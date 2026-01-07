'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, differenceInHours, differenceInMinutes, differenceInDays, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate, getUTCDate } from '@/lib/date-utils'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import QuickViewConfirmDialog from '@/components/ui/QuickViewConfirmDialog'
import CompletionStatsModal from '@/components/ui/CompletionStatsModal'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, MessageIcon, TrashIcon, XCloseIcon, ClockIcon, SettingsIcon, EditIcon, AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'
import { useBackHandler } from '@/hooks/useBackHandler'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { useDanton } from '@/hooks/useDanton'
import { useUserPermission } from '@/hooks/useUserPermission'
import { useClassSubscription } from '@/hooks/useClassSubscription'

interface ThreadQuickViewProps {
  threadId: string
  onClose: () => void
}

export default function ThreadQuickView({ threadId, onClose }: ThreadQuickViewProps) {
  const { data: session } = useSession()
  const [commentContent, setCommentContent] = useState('')
  const [commentDeadline, setCommentDeadline] = useState<string>('')
  const [commentDeadlineError, setCommentDeadlineError] = useState<string>('')
  const [hasSetDefaultDeadline, setHasSetDefaultDeadline] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showUncheckDialog, setShowUncheckDialog] = useState(false)
  const [showDeleteThreadDialog, setShowDeleteThreadDialog] = useState(false)
  const [showCompletionStatsModal, setShowCompletionStatsModal] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [showGroupMembers, setShowGroupMembers] = useState(false)
  const [isFakeLoadingThread, setIsFakeLoadingThread] = useState(false)
  const [fakeLoadingComments, setFakeLoadingComments] = useState<Set<string>>(new Set())
  const [visualStatuses, setVisualStatuses] = useState<Record<string, boolean>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Detect mobile viewport and lock it
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const handleCloseQuickView = useCallback(() => {
    setShowConfirmDialog(false)
    setIsQuickViewOpen(false)
    setIsVisible(false)

    // Wait for transition to complete before closing
    setTimeout(() => {
      // Unlock body scroll - cleanup will be handled by useEffect
      onClose()
    }, 300) // Match transition duration
  }, [onClose])

  // Reset confirm dialog when quickview is closed or threadId changes
  useEffect(() => {
    setIsQuickViewOpen(true)
    setShowConfirmDialog(false)

    // Lock body scroll when quickview is open (mobile)
    // Save current scroll position
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    // Prevent scroll on touch devices
    const preventScroll = (e: TouchEvent) => {
      // Allow scroll only inside quickview content
      const target = e.target as HTMLElement
      if (!contentRef.current?.contains(target)) {
        e.preventDefault()
      }
    }

    // Prevent scroll on wheel (for desktop)
    const preventWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (!contentRef.current?.contains(target)) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventScroll, { passive: false })
    document.addEventListener('wheel', preventWheel, { passive: false })

    // Push state untuk back handler
    window.history.pushState({ quickview: true }, '')

    // Small delay to ensure DOM is ready before showing
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    return () => {
      setIsQuickViewOpen(false)
      setShowConfirmDialog(false)
      setIsVisible(false)

      // Unlock body scroll when quickview is closed
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('wheel', preventWheel)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''

      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [threadId])

  // Handle browser back button dan hardware back button untuk quickview
  const [shouldHandleBack, setShouldHandleBack] = useState(false)

  useEffect(() => {
    if (isQuickViewOpen && isVisible) {
      // Delay kecil untuk memastikan QuickView sudah fully rendered
      const timer = setTimeout(() => {
        console.log('[ThreadQuickView] Enabling back handler', { isQuickViewOpen, isVisible })
        setShouldHandleBack(true)
      }, 300) // Increased delay to ensure everything is ready
      return () => {
        clearTimeout(timer)
        setShouldHandleBack(false)
      }
    } else {
      setShouldHandleBack(false)
    }
  }, [isQuickViewOpen, isVisible])

  useBackHandler(shouldHandleBack, () => {
    console.log('[ThreadQuickView] Back button pressed, closing QuickView')
    handleCloseQuickView()
  })

  const { data: thread, isLoading } = trpc.thread.getById.useQuery({ id: threadId })
  const { data: statuses } = trpc.userStatus.getThreadStatuses.useQuery(
    { threadId },
    { enabled: !!session }
  )

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  // Get completion stats for admin
  const { data: completionStats } = trpc.thread.getCompletionStats.useQuery(
    { threadId },
    { enabled: !!session && isAdmin }
  )

  // Check if user is danton
  const { isDanton, kelas: dantonKelas } = useDanton()

  // Check user permission
  const { canPostEdit, isOnlyRead } = useUserPermission()

  // Get user's kelas for subscription check
  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session && !isAdmin,
  })
  const userKelas = isAdmin ? null : (userData?.kelas || null)

  // Check subscription status (skip for admin)
  const { isActive: isSubscriptionActive, isExpired: isSubscriptionExpired } = useClassSubscription(userKelas || undefined)

  // User can only post/edit if: has permission AND subscription is active (or admin)
  const canActuallyPostEdit = canPostEdit && (isAdmin || isSubscriptionActive)

  // Check if user is the author of this thread
  const isThreadAuthor = session?.user?.id === (thread as any)?.author?.id
  const threadAuthorKelas = (thread as any)?.author?.kelas || null
  const isDantonOfSameClass = isDanton && dantonKelas === threadAuthorKelas && dantonKelas !== null
  const canDeleteThread = isAdmin || isThreadAuthor || isDantonOfSameClass

  const utils = trpc.useUtils()

  const threadStatus = statuses?.find((s) => s.threadId === threadId && !s.commentId)
  const isThreadCompleted = visualStatuses[threadId] ?? (threadStatus?.isCompleted || false)
  const isGroupTask = (thread as any)?.isGroupTask || false
  const groupMembers = (thread as any)?.groupMembers || []
  const hasGroupMembers = Array.isArray(groupMembers) && groupMembers.length > 0

  // Debug: Log group members data (remove in production if not needed)
  useEffect(() => {
    if (isGroupTask && thread) {
      console.log('[ThreadQuickView] Group task detected:', {
        isGroupTask,
        groupMembers,
        hasGroupMembers,
        groupMembersLength: groupMembers.length,
        threadId: thread.id,
      })
    }
  }, [isGroupTask, groupMembers, hasGroupMembers, thread])

  // Set default deadline from thread or first comment
  useEffect(() => {
    if (!thread || hasSetDefaultDeadline || commentDeadline) {
      // Don't override if user has already set a deadline or already set default
      return
    }

    // Try to get deadline from thread first
    const threadDeadline = (thread as any)?.deadline
    if (threadDeadline) {
      const deadlineDate = new Date(threadDeadline)
      // Format as YYYY-MM-DDTHH:mm for DateTimePicker
      const year = deadlineDate.getFullYear()
      const month = String(deadlineDate.getMonth() + 1).padStart(2, '0')
      const day = String(deadlineDate.getDate()).padStart(2, '0')
      const hours = String(deadlineDate.getHours()).padStart(2, '0')
      const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
      const formattedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`
      setCommentDeadline(formattedDeadline)
      setHasSetDefaultDeadline(true)
      return
    }

    // If thread doesn't have deadline, try to get from first comment
    const comments = (thread as any)?.comments || []
    if (comments.length > 0) {
      // Find first comment with deadline
      const firstCommentWithDeadline = comments.find((comment: any) => comment.deadline)
      if (firstCommentWithDeadline?.deadline) {
        const deadlineDate = new Date(firstCommentWithDeadline.deadline)
        // Format as YYYY-MM-DDTHH:mm for DateTimePicker
        const year = deadlineDate.getFullYear()
        const month = String(deadlineDate.getMonth() + 1).padStart(2, '0')
        const day = String(deadlineDate.getDate()).padStart(2, '0')
        const hours = String(deadlineDate.getHours()).padStart(2, '0')
        const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
        const formattedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`
        setCommentDeadline(formattedDeadline)
        setHasSetDefaultDeadline(true)
        return
      }
    }

    // Mark as set even if no deadline found (to prevent re-running)
    setHasSetDefaultDeadline(true)
  }, [thread, hasSetDefaultDeadline, commentDeadline])

  // Calculate time remaining until auto-delete (1 day from when thread was checked)
  // Timer only shows when thread is completed
  useEffect(() => {
    if (!isThreadCompleted || !threadStatus?.updatedAt) {
      setTimeRemaining('')
      return
    }

    const calculateTimeRemaining = () => {
      // Timer is calculated from when thread was checked (updatedAt) + 1 day
      const deleteDate = addDays(new Date(threadStatus.updatedAt), 1)
      const now = new Date()
      const diffMs = deleteDate.getTime() - now.getTime()

      if (diffMs <= 0) {
        setTimeRemaining('Akan terhapus segera')
        return
      }

      const hours = differenceInHours(deleteDate, now)
      const minutes = differenceInMinutes(deleteDate, now) % 60

      if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m lagi`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m lagi`)
      } else {
        setTimeRemaining('Akan terhapus segera')
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [isThreadCompleted, threadStatus?.updatedAt])

  const toggleThread = trpc.userStatus.toggleThread.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await utils.userStatus.getThreadStatuses.cancel({ threadId });

      // Snapshot the previous value
      const previousStatuses = utils.userStatus.getThreadStatuses.getData({
        threadId,
      });

      // Optimistically update to the new value
      utils.userStatus.getThreadStatuses.setData({ threadId }, (old = []) => {
        const threadStatusIndex = old.findIndex(s => !s.commentId);
        let updatedStatuses = [...old];

        if (threadStatusIndex > -1) {
          // Update existing thread status
          updatedStatuses = updatedStatuses.map((s, i) => {
            if (i === threadStatusIndex) {
              return { ...s, isCompleted: variables.isCompleted };
            }
            // If thread is completed, all subtasks are also completed
            if (variables.isCompleted && s.commentId) {
              return { ...s, isCompleted: true };
            }
            return s;
          });
        } else {
          // Add new thread status
          updatedStatuses.push({
            id: "temp-thread-id",
            threadId: threadId,
            commentId: null,
            isCompleted: variables.isCompleted,
            updatedAt: new Date(),
            createdAt: new Date(),
            userId: session?.user?.id || "temp-user-id",
          });
          // If thread is completed, ensure all subtasks in cache are also completed
          if (variables.isCompleted) {
            updatedStatuses = updatedStatuses.map(s => s.commentId ? { ...s, isCompleted: true } : s);
          }
        }
        return updatedStatuses;
      });

      return { previousStatuses };
    },
    onSuccess: async () => {
      setShowConfirmDialog(false);
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId }),
        utils.thread.getById.invalidate(),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
        utils.userStatus.getUncompletedCount.invalidate(),
        utils.userStatus.getOverdueTasks.invalidate(),
      ]);
    },
    onError: (error: any, variables, context) => {
      console.error("Error toggling thread:", error);
      console.error("[ERROR] Gagal mengubah status thread. Silakan coba lagi.");
      setShowConfirmDialog(false);

      // Rollback
      if (context?.previousStatuses) {
        utils.userStatus.getThreadStatuses.setData(
          { threadId },
          context.previousStatuses,
        );
      }
    },
    onSettled: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId });
    },
  });

  const handleThreadCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session || !isQuickViewOpen) return

    const nextState = !isThreadCompleted
    setVisualStatuses(prev => ({ ...prev, [threadId]: nextState }))
    setIsFakeLoadingThread(true)

    if (debounceTimers.current[threadId]) clearTimeout(debounceTimers.current[threadId])

    debounceTimers.current[threadId] = setTimeout(() => {
      setIsFakeLoadingThread(false)
      // Only mutate if state truly changed from current DB state
      if (nextState !== (threadStatus?.isCompleted || false)) {
        toggleThread.mutate({
          threadId,
          isCompleted: nextState,
        })
      }
    }, 800)
  }

  const handleConfirmUncheck = () => {
    setShowUncheckDialog(false)
    setIsFakeLoadingThread(true)
    setTimeout(() => {
      setIsFakeLoadingThread(false)
      setVisualStatuses(prev => ({ ...prev, [threadId]: false }))
    }, 500)
    toggleThread.mutate({
      threadId,
      isCompleted: false,
    })
  }

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isVisible) {
      document.body.style.overflow = ''
      onClose()
    }
  }

  const handleConfirmThread = () => {
    // Close dialog immediately for better UX
    setShowConfirmDialog(false)
    setIsFakeLoadingThread(true)
    setTimeout(() => {
      setIsFakeLoadingThread(false)
      setVisualStatuses(prev => ({ ...prev, [threadId]: true }))
    }, 500)
    // Then execute the mutation
    toggleThread.mutate({
      threadId,
      isCompleted: true,
    })
  }

  const toggleComment = trpc.userStatus.toggleComment.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await utils.userStatus.getThreadStatuses.cancel({ threadId });

      // Snapshot the previous value
      const previousStatuses = utils.userStatus.getThreadStatuses.getData({
        threadId,
      });

      // Optimistically update to the new value
      utils.userStatus.getThreadStatuses.setData({ threadId }, (old = []) => {
        const statusIndex = old.findIndex(s => s.commentId === variables.commentId);
        if (statusIndex > -1) {
          return old.map((s, i) => i === statusIndex ? { ...s, isCompleted: variables.isCompleted } : s);
        } else {
          return [
            ...old,
            {
              id: "temp-comment-" + variables.commentId,
              threadId,
              commentId: variables.commentId,
              isCompleted: variables.isCompleted,
              updatedAt: new Date(),
              createdAt: new Date(),
              userId: session?.user?.id || "temp-user-id",
            }
          ];
        }
      });

      // Start fake loading
      setFakeLoadingComments((prev) => {
        const next = new Set(prev);
        next.add(variables.commentId);
        return next;
      });

      // Remove from fake loading after 500ms
      setTimeout(() => {
        setFakeLoadingComments((prev) => {
          const next = new Set(prev);
          next.delete(variables.commentId);
          return next;
        });
      }, 500);

      return { previousStatuses };
    },
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId }),
        utils.thread.getById.invalidate(),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
        utils.userStatus.getUncompletedCount.invalidate(),
        utils.userStatus.getOverdueTasks.invalidate(),
      ]);
    },
    onError: (error: any, variables, context) => {
      console.error("Error toggling comment:", error);
      console.error(
        "[ERROR] Gagal mengubah status sub tugas. Silakan coba lagi.",
      );

      // Rollback
      if (context?.previousStatuses) {
        utils.userStatus.getThreadStatuses.setData(
          { threadId },
          context.previousStatuses,
        );
      }
    },
    onSettled: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId });
    },
  });

  const addComment = trpc.thread.addComment.useMutation({
    onSuccess: async () => {
      setCommentContent('')
      // Reset deadline but keep default for next comment
      setCommentDeadline('')
      setCommentDeadlineError('')
      setIsSubmittingComment(false)
      // Reset flag so default deadline will be set again for next comment
      setHasSetDefaultDeadline(false)
      // Invalidate and refetch immediately
      await Promise.all([
        utils.thread.getById.invalidate(),
        utils.thread.getAll.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.thread.getById.refetch(),
        utils.thread.getAll.refetch(),
      ])
    },
    onError: (error) => {
      setIsSubmittingComment(false)
      const errorMessage = error.message || 'Gagal menambahkan sub tugas. Silakan coba lagi.'
      console.error('[ERROR]', errorMessage)

      // Check if error is related to deadline
      if (errorMessage.includes('Deadline') || errorMessage.includes('deadline') || errorMessage.includes('masa lalu')) {
        setCommentDeadlineError('Tidak boleh mencantumkan waktu deadline yang sudah terlewat')
      } else {
        setCommentDeadlineError('')
        toast.error(errorMessage, 5000)
      }
    },
  })

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmittingComment || addComment.isLoading) {
      return
    }

    if (!commentContent.trim()) {
      return
    }

    // Validate deadline - must be in the future
    if (commentDeadline) {
      const deadlineDate = new Date(commentDeadline)
      const now = new Date()
      if (deadlineDate <= now) {
        setCommentDeadlineError('Tidak boleh mencantumkan waktu deadline yang sudah terlewat')
        setIsSubmittingComment(false)
        return
      }
    }

    // Clear any previous deadline error
    setCommentDeadlineError('')
    setIsSubmittingComment(true)
    addComment.mutate({
      threadId,
      content: commentContent.trim(),
      deadline: commentDeadline ? new Date(commentDeadline) : undefined,
    })
  }

  // Delete thread (Admin only)
  const deleteThread = trpc.thread.delete.useMutation({
    onSuccess: async () => {
      // Close dialog and thread immediately for better UX
      setShowDeleteThreadDialog(false)
      onClose()

      // Invalidate and refetch in background (don't wait for it)
      // This ensures dialog and thread close together without delay
      Promise.all([
        utils.thread.getById.invalidate(),
        utils.thread.getAll.invalidate(),
      ]).then(() => {
        // Force immediate refetch after invalidation
        Promise.all([
          utils.thread.getById.refetch(),
          utils.thread.getAll.refetch(),
        ]).catch((error) => {
          console.error('Error refetching after delete:', error)
        })
      }).catch((error) => {
        console.error('Error invalidating after delete:', error)
      })
    },
    onError: (error: any) => {
      console.error('Error deleting thread:', error)
      console.error('[ERROR] Gagal menghapus thread. Silakan coba lagi.')
      setShowDeleteThreadDialog(false)
    },
  })

  // Edit comment
  const editComment = trpc.thread.editComment.useMutation({
    onSuccess: async () => {
      setEditingCommentId(null)
      setEditCommentContent('')
      setIsSubmittingEdit(false)
      // Invalidate and refetch immediately
      await Promise.all([
        utils.thread.getById.invalidate(),
        utils.thread.getAll.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.thread.getById.refetch(),
        utils.thread.getAll.refetch(),
      ])
      console.log('[SUCCESS] Sub tugas berhasil diubah')
    },
    onError: (error: any) => {
      console.error('Error editing comment:', error)
      setIsSubmittingEdit(false)
      console.error('[ERROR]', error.message || 'Gagal mengedit sub tugas. Silakan coba lagi.')
    },
  })

  // Delete comment (Admin only)
  const deleteComment = trpc.thread.deleteComment.useMutation({
    onSuccess: async () => {
      setShowDeleteCommentDialog(null)
      // Invalidate and refetch immediately
      await Promise.all([
        utils.thread.getById.invalidate(),
        utils.thread.getAll.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.thread.getById.refetch(),
        utils.thread.getAll.refetch(),
      ])
    },
    onError: (error: any) => {
      console.error('Error deleting comment:', error)
      console.error('[ERROR] Gagal menghapus sub tugas. Silakan coba lagi.')
      setShowDeleteCommentDialog(null)
    },
  })

  const handleStartEdit = (comment: any) => {
    setEditingCommentId(comment.id)
    setEditCommentContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditCommentContent('')
    setIsSubmittingEdit(false)
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmittingEdit || editComment.isLoading || !editingCommentId) {
      return
    }

    if (!editCommentContent.trim()) {
      console.error('[ERROR] Konten sub tugas tidak boleh kosong')
      return
    }

    setIsSubmittingEdit(true)
    editComment.mutate({
      id: editingCommentId,
      content: editCommentContent.trim(),
    })
  }

  if (isLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
        onClick={handleCloseQuickView}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            padding: '2.5rem 3rem',
            background: 'var(--card)',
            borderRadius: '1.25rem',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
            animation: isVisible ? 'fadeInUp 0.3s ease-out' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Custom spinner with guaranteed animation */}
          <div
            style={{
              width: '64px',
              height: '64px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                border: '4px solid rgba(59, 130, 246, 0.2)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                WebkitAnimation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
          <p style={{
            color: 'var(--text)',
            fontSize: '1.125rem',
            margin: 0,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>
            Memuat PR...
          </p>
        </div>
      </div>
    )
  }

  if (!thread) {
    return null
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.target === overlayRef.current) {
      handleCloseQuickView()
    }
  }

  return (
    <div
      ref={overlayRef}
      className="quickview-overlay"
      onClick={handleOverlayClick}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        // Force mobile overlay style - prevent desktop layout shift
        ...(isMobile ? {
          padding: 0,
          background: 'var(--card)',
          alignItems: 'flex-start',
          overflow: 'hidden',
        } : {})
      }}
    >
      <div
        ref={contentRef}
        className="quickview-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          // Force mobile view - prevent desktop layout shift after update
          ...(isMobile ? {
            width: '100%',
            maxWidth: '100%',
            height: '100vh',
            maxHeight: '100vh',
            margin: 0,
            borderRadius: 0,
            padding: 0,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
          } : {})
        }}
      >
        {/* Only show QuickViewConfirmDialog when quickview is open and thread is loaded */}
        {isQuickViewOpen && thread && (
          <>
            <QuickViewConfirmDialog
              isOpen={showConfirmDialog}
              title="Centang PR?"
              message={`Apakah Anda yakin ingin mencentang PR "${thread.title}"? Semua sub tugas di dalamnya akan otomatis tercentang.`}
              confirmText="Ya, Centang"
              cancelText="Batal"
              onConfirm={handleConfirmThread}
              onCancel={() => setShowConfirmDialog(false)}
            />
            <QuickViewConfirmDialog
              isOpen={showUncheckDialog}
              title="Uncentang PR?"
              message={`Apakah Anda yakin ingin menguncentang PR "${thread.title}"? Jika Anda mencentang lagi nanti, timer auto-hapus akan direset ke 1 hari lagi dari waktu centang tersebut.`}
              confirmText="Ya, Uncentang"
              cancelText="Batal"
              onConfirm={handleConfirmUncheck}
              onCancel={() => setShowUncheckDialog(false)}
            />
          </>
        )}
        {/* Simplified Header */}
        <div className="quickview-header" style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem 2rem',
          paddingTop: isMobile ? `calc(1rem + env(safe-area-inset-top, 0px))` : '1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          position: 'relative',
        }}>
          {/* Top Row: Checkbox for completion */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            paddingRight: canDeleteThread ? '88px' : '44px', // Space for buttons
          }}>
            {session && !isAdmin && (
              <Checkbox
                checked={isThreadCompleted}
                onClick={handleThreadCheckboxClick}
                isLoading={isFakeLoadingThread}
                size={24}
              />
            )}
            {session && isAdmin && completionStats && (
              <button
                onClick={() => setShowCompletionStatsModal(true)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--primary)',
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--primary)'
                }}
              >
                {completionStats.completedCount}/{completionStats.totalCount} selesai
              </button>
            )}
          </div>

          {/* Right: Actions & Close - Always on the right top corner */}
          <div style={{
            position: 'absolute',
            top: isMobile ? `calc(1rem + env(safe-area-inset-top, 0px))` : '1.5rem',
            right: isMobile ? '1rem' : '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
            zIndex: 10,
          }}>
            {canDeleteThread && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteThreadDialog(true)
                }}
                disabled={deleteThread.isLoading}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: deleteThread.isLoading ? '#fca5a5' : 'transparent',
                  color: deleteThread.isLoading ? 'white' : 'var(--text-light)',
                  cursor: deleteThread.isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  minWidth: '36px',
                  minHeight: '36px',
                }}
                onMouseEnter={(e) => {
                  if (!deleteThread.isLoading) {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.color = '#ef4444'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteThread.isLoading) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-light)'
                  }
                }}
                title="Hapus PR"
              >
                {deleteThread.isLoading ? (
                  <LoadingSpinner size={18} color="#ef4444" />
                ) : (
                  <TrashIcon size={18} />
                )}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCloseQuickView()
              }}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                minWidth: '36px',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-light)'
              }}
              aria-label="Tutup"
            >
              <XCloseIcon size={20} />
            </button>
          </div>

          {/* Title Section */}
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 600,
              color: isThreadCompleted ? 'var(--text-light)' : 'var(--text)',
              margin: '0 0 0.75rem 0',
              lineHeight: 1.4,
              textDecoration: isThreadCompleted ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}>
              {thread.title}
            </h2>

            {/* Compact Meta Info */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--text-light)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <UserIcon size={14} />
                {(thread as any).author?.name || 'Unknown'}
              </span>
              {(thread as any).author?.kelas && (
                <span style={{
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-light)',
                  fontSize: '0.8125rem',
                }}>
                  {(thread as any).author?.kelas}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CalendarIcon size={14} />
                {format(new Date(thread.date), 'd MMM yyyy', { locale: id })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MessageIcon size={14} />
                {(thread as any).comments?.length || 0} sub tugas
              </span>
            </div>
          </div>
        </div>

        {/* Group Members Section - Collapsible dropdown for both mobile and desktop */}
        {isGroupTask && hasGroupMembers && (
          <div style={{
            width: '100%',
            marginBottom: '1.5rem',
            padding: 0,
            boxSizing: 'border-box',
          }}>
            <div style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}>
              <button
                onClick={() => setShowGroupMembers(!showGroupMembers)}
                type="button"
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1rem 2rem',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <UserIcon size={16} />
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}>
                    Anggota Kelompok ({groupMembers.length})
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: showGroupMembers ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  <ChevronDownIcon size={20} style={{ color: 'var(--text-light)' }} />
                </div>
              </button>
              <div
                style={{
                  maxHeight: showGroupMembers ? '1000px' : '0',
                  overflow: 'hidden',
                  opacity: showGroupMembers ? 1 : 0,
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{
                  padding: isMobile ? '0 1rem 1rem 1rem' : '0 2rem 1rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  {groupMembers.map((member: any, index: number) => (
                    <div
                      key={member.userId || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: 'var(--card)',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--text)',
                        fontWeight: 500,
                      }}>
                        {member.user?.name || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simplified Comments Section */}
        <div className="comments-section" style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem 2rem',
        }}>
          {session && isOnlyRead && (
            <div className="card subscription-fade-in" style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertTriangleIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '0.125rem' }} />
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                Anda hanya memiliki izin membaca. Tidak dapat menambahkan sub tugas.
              </p>
            </div>
          )}
          {session && !isAdmin && isSubscriptionExpired && canPostEdit && (
            <div className="card subscription-fade-in" style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertTriangleIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '0.125rem' }} />
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                Subscription kelas {userKelas} sudah habis. Tidak dapat menambahkan sub tugas.
              </p>
            </div>
          )}

          <div className="comments-list">
            {(() => {
              // Filter out comments with expired deadline
              const allComments = (thread as any).comments || []
              const visibleComments = allComments.filter((comment: any) => {
                if (!comment.deadline) return true // Show comments without deadline
                const deadlineDate = new Date(comment.deadline)
                const now = getUTCDate()
                return deadlineDate > now // Only show if deadline hasn't passed
              })

              if (visibleComments.length === 0) {
                return (
                  <div style={{ padding: '1rem 0' }}>
                    <EmptyState
                      icon={<MessageIcon size={48} />}
                      title="Belum ada sub tugas"
                      description="Jadilah yang pertama menambahkan sub tugas untuk tugas ini!"
                      variant="info"
                    />
                  </div>
                )
              }

              return visibleComments.map((comment: any) => {
                const commentStatus = statuses?.find((s) => s.commentId === comment.id)
                const isCommentCompleted = visualStatuses[comment.id] ?? (commentStatus?.isCompleted || false)

                // Check if user can edit/delete this comment
                const isCommentAuthor = session?.user?.id === comment?.author?.id
                const commentAuthorKelas = comment?.author?.kelas || null
                const isDantonOfCommentClass = isDanton && dantonKelas === commentAuthorKelas && dantonKelas !== null
                // For group tasks: disable edit if comment is completed
                const isGroupTask = (thread as any)?.isGroupTask || false
                const canEditCommentForGroupTask = isGroupTask ? !isCommentCompleted : true
                const canEditComment = isCommentAuthor && canActuallyPostEdit && canEditCommentForGroupTask // Only author can edit, must have permission, and for group tasks: comment must not be completed
                const canDeleteComment = isAdmin || isCommentAuthor || isThreadAuthor || isDantonOfCommentClass
                const isEditing = editingCommentId === comment.id

                return (
                  <div key={comment.id} style={{
                    background: 'var(--card)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    marginBottom: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Checkbox */}
                    {session && !isAdmin && !isEditing && (
                      <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                        <Checkbox
                          checked={isCommentCompleted}
                          onClick={() => {
                            if (!session) return
                            const nextState = !isCommentCompleted
                            setVisualStatuses(prev => ({ ...prev, [comment.id]: nextState }))

                            // Start/restart fake loading for this comment
                            setFakeLoadingComments(prev => {
                              const next = new Set(prev)
                              next.add(comment.id)
                              return next
                            })

                            if (debounceTimers.current[comment.id]) clearTimeout(debounceTimers.current[comment.id])

                            debounceTimers.current[comment.id] = setTimeout(() => {
                              setFakeLoadingComments(prev => {
                                const next = new Set(prev)
                                next.delete(comment.id)
                                return next
                              })

                              if (nextState !== (commentStatus?.isCompleted || false)) {
                                toggleComment.mutate({
                                  threadId,
                                  commentId: comment.id,
                                  isCompleted: nextState,
                                })
                              }
                            }, 800)
                          }}
                          isLoading={fakeLoadingComments.has(comment.id)}
                          size={20}
                        />
                      </div>
                    )}
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <form onSubmit={handleSubmitEdit} style={{ width: '100%' }}>
                          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              rows={3}
                              className="form-input"
                              placeholder="Edit sub tugas..."
                              required
                              disabled={editComment.isLoading || isSubmittingEdit}
                              style={{ width: '100%', resize: 'vertical' }}
                              autoFocus
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="btn"
                              disabled={editComment.isLoading || isSubmittingEdit}
                              style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                cursor: editComment.isLoading || isSubmittingEdit ? 'not-allowed' : 'pointer',
                                opacity: editComment.isLoading || isSubmittingEdit ? 0.6 : 1
                              }}
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={editComment.isLoading || isSubmittingEdit || !editCommentContent.trim()}
                              style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                cursor: editComment.isLoading || isSubmittingEdit || !editCommentContent.trim() ? 'not-allowed' : 'pointer',
                                opacity: editComment.isLoading || isSubmittingEdit || !editCommentContent.trim() ? 0.6 : 1
                              }}
                            >
                              {editComment.isLoading || isSubmittingEdit ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <LoadingSpinner size={16} color="white" />
                                  Menyimpan...
                                </span>
                              ) : 'Simpan'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {/* Comment Text */}
                          <div style={{
                            textDecoration: isCommentCompleted ? 'line-through' : 'none',
                            color: isCommentCompleted ? 'var(--text-light)' : 'var(--text)',
                            wordBreak: 'break-word',
                            lineHeight: 1.6,
                            fontSize: '0.9375rem',
                            marginBottom: '0.5rem',
                          }}>
                            {comment.content}
                          </div>

                          {/* Comment Meta & Actions */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border)',
                          }}>
                            {/* Left: Author & Deadline */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                              alignItems: 'center',
                              fontSize: '0.8125rem',
                              color: 'var(--text-light)',
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <UserIcon size={12} />
                                {comment.author?.name || 'Unknown'}
                              </span>
                              {comment?.deadline && (() => {
                                const deadlineUTC = new Date(comment.deadline)
                                const deadlineJakarta = toJakartaDate(deadlineUTC)
                                const nowJakarta = toJakartaDate(getUTCDate())
                                const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)

                                let badgeColor = 'var(--text-light)'
                                let badgeBg = 'var(--bg-secondary)'
                                if (hoursUntilDeadline < 0) {
                                  badgeColor = 'var(--danger)'
                                  badgeBg = 'rgba(239, 68, 68, 0.1)'
                                } else if (hoursUntilDeadline < 24) {
                                  badgeColor = 'var(--danger)'
                                  badgeBg = 'rgba(239, 68, 68, 0.1)'
                                } else if (hoursUntilDeadline < 72) {
                                  badgeColor = 'var(--warning)'
                                  badgeBg = 'rgba(245, 158, 11, 0.1)'
                                }

                                return (
                                  <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    background: badgeBg,
                                    color: badgeColor,
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                  }}>
                                    <ClockIcon size={12} />
                                    {format(deadlineJakarta, 'd MMM yyyy, HH:mm', { locale: id })}
                                  </span>
                                )
                              })()}
                            </div>

                            {/* Right: Actions */}
                            {(canEditComment || canDeleteComment) && (
                              <div style={{ display: 'flex', gap: '0.375rem' }}>
                                {canEditComment && (
                                  <button
                                    onClick={() => handleStartEdit(comment)}
                                    disabled={editComment.isLoading}
                                    style={{
                                      padding: '0.375rem 0.5rem',
                                      borderRadius: '0.375rem',
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--text-light)',
                                      cursor: editComment.isLoading ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      transition: 'all 0.2s',
                                      opacity: editComment.isLoading ? 0.5 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!editComment.isLoading) {
                                        e.currentTarget.style.background = 'var(--bg-secondary)'
                                        e.currentTarget.style.color = 'var(--primary)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!editComment.isLoading) {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.color = 'var(--text-light)'
                                      }
                                    }}
                                    title="Edit"
                                  >
                                    <EditIcon size={16} />
                                  </button>
                                )}
                                {canDeleteComment && (
                                  <button
                                    onClick={() => setShowDeleteCommentDialog(comment.id)}
                                    disabled={deleteComment.isLoading}
                                    style={{
                                      padding: '0.375rem 0.5rem',
                                      borderRadius: '0.375rem',
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--text-light)',
                                      cursor: deleteComment.isLoading ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      transition: 'all 0.2s',
                                      opacity: deleteComment.isLoading ? 0.5 : 1,
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!deleteComment.isLoading) {
                                        e.currentTarget.style.background = '#fee2e2'
                                        e.currentTarget.style.color = '#ef4444'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!deleteComment.isLoading) {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.color = 'var(--text-light)'
                                      }
                                    }}
                                    title="Hapus"
                                  >
                                    {deleteComment.isLoading ? (
                                      <LoadingSpinner size={14} color="#ef4444" />
                                    ) : (
                                      <TrashIcon size={16} />
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          {/* Add Comment Form - Moved to Bottom */}
          {session && canActuallyPostEdit && !(isGroupTask && isThreadCompleted) && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginTop: '2rem',
              border: '1px solid var(--border)',
            }}>
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={2}
                  placeholder="Tulis sub tugas Anda di sini..."
                  required
                  disabled={addComment.isLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <DateTimePicker
                    value={commentDeadline}
                    onChange={(value) => {
                      setCommentDeadline(value)
                      setCommentDeadlineError('')
                    }}
                    placeholder="Deadline (opsional)"
                    disabled={addComment.isLoading}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {commentDeadlineError && (
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--danger)',
                    }}>
                      {commentDeadlineError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addComment.isLoading || isSubmittingComment || !commentContent.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      width: '100%',
                      marginTop: '0.25rem',
                    }}
                  >
                    {addComment.isLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <LoadingSpinner size={16} color="white" />
                        <span>Mengirim...</span>
                      </span>
                    ) : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        <QuickViewConfirmDialog
          isOpen={showDeleteThreadDialog}
          title="Hapus PR?"
          message={`Apakah Anda yakin ingin menghapus PR "${thread.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText={deleteThread.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
          cancelText="Batal"
          disabled={deleteThread.isLoading}
          onConfirm={() => {
            if (!deleteThread.isLoading) {
              deleteThread.mutate({ id: threadId })
            }
          }}
          onCancel={() => {
            if (!deleteThread.isLoading) {
              setShowDeleteThreadDialog(false)
            }
          }}
        />
        {showDeleteCommentDialog && (
          <QuickViewConfirmDialog
            isOpen={!!showDeleteCommentDialog}
            title="Hapus Sub Tugas?"
            message="Apakah Anda yakin ingin menghapus sub tugas ini? Tindakan ini tidak dapat dibatalkan."
            confirmText={deleteComment.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            cancelText="Batal"
            disabled={deleteComment.isLoading}
            onConfirm={() => {
              if (showDeleteCommentDialog && !deleteComment.isLoading) {
                deleteComment.mutate({ id: showDeleteCommentDialog })
              }
            }}
            onCancel={() => {
              if (!deleteComment.isLoading) {
                setShowDeleteCommentDialog(null)
              }
            }}
          />
        )}

        {isAdmin && completionStats && thread && (
          <CompletionStatsModal
            isOpen={showCompletionStatsModal}
            onClose={() => setShowCompletionStatsModal(false)}
            threadTitle={thread.title}
            completedCount={completionStats.completedCount}
            totalCount={completionStats.totalCount}
            completedUsers={completionStats.completedUsers}
          />
        )}
      </div>
    </div>
  )
}
