'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, differenceInHours, differenceInMinutes, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import QuickViewConfirmDialog from '@/components/ui/QuickViewConfirmDialog'
import CompletionStatsModal from '@/components/ui/CompletionStatsModal'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, MessageIcon, TrashIcon, XCloseIcon, ClockIcon, SettingsIcon, EditIcon, AlertTriangleIcon } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'
import { useBackHandler } from '@/hooks/useBackHandler'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
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
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Handle browser back button untuk quickview
  useEffect(() => {
    if (!isQuickViewOpen || !isVisible) return

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      handleCloseQuickView()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isQuickViewOpen, isVisible, handleCloseQuickView])

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
  const isThreadCompleted = threadStatus?.isCompleted || false

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
    onSuccess: async () => {
      setShowConfirmDialog(false)
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId }),
        utils.thread.getById.invalidate(),
        utils.history.getUserHistory.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.userStatus.getThreadStatuses.refetch({ threadId }),
        utils.thread.getById.refetch(),
        utils.history.getUserHistory.refetch(),
      ])
    },
    onError: (error: any) => {
      console.error('Error toggling thread:', error)
      toast.error('Gagal mengubah status thread. Silakan coba lagi.')
      setShowConfirmDialog(false)
    },
  })

  const handleThreadCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (session && isQuickViewOpen) {
      // If unchecking, show confirmation dialog about timer reset
      if (isThreadCompleted) {
        setShowUncheckDialog(true)
      } else {
        // If checking, show confirmation dialog (only if quickview is open)
        setShowConfirmDialog(true)
      }
    }
  }

  const handleConfirmUncheck = () => {
    setShowUncheckDialog(false)
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
    // Then execute the mutation
    toggleThread.mutate({
      threadId,
      isCompleted: true,
    })
  }

  const toggleComment = trpc.userStatus.toggleComment.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId }),
        utils.thread.getById.invalidate(),
        utils.history.getUserHistory.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.userStatus.getThreadStatuses.refetch({ threadId }),
        utils.thread.getById.refetch(),
        utils.history.getUserHistory.refetch(),
      ])
    },
    onError: (error: any) => {
      console.error('Error toggling comment:', error)
      toast.error('Gagal mengubah status sub tugas. Silakan coba lagi.')
    },
  })

  const addComment = trpc.thread.addComment.useMutation({
    onSuccess: async () => {
      setCommentContent('')
      setIsSubmittingComment(false)
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
      toast.error(error.message || 'Gagal menambahkan sub tugas. Silakan coba lagi.')
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
    
    setIsSubmittingComment(true)
    addComment.mutate({
      threadId,
      content: commentContent.trim(),
    })
  }

  // Delete thread (Admin only)
  const deleteThread = trpc.thread.delete.useMutation({
    onSuccess: async () => {
      setShowDeleteThreadDialog(false)
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
      onClose()
    },
    onError: (error: any) => {
      console.error('Error deleting thread:', error)
      toast.error('Gagal menghapus thread. Silakan coba lagi.')
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
      toast.success('Sub tugas berhasil diubah')
    },
    onError: (error: any) => {
      console.error('Error editing comment:', error)
      setIsSubmittingEdit(false)
      toast.error(error.message || 'Gagal mengedit sub tugas. Silakan coba lagi.')
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
      toast.error('Gagal menghapus sub tugas. Silakan coba lagi.')
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
      toast.error('Konten sub tugas tidak boleh kosong')
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
        ref={overlayRef}
        className="quickview-overlay" 
        onClick={handleCloseQuickView}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
      >
        <div 
          ref={contentRef}
          className="quickview-content" 
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
          }}
        >
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)' }}>Memuat PR...</p>
          </div>
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
        pointerEvents: isVisible ? 'auto' : 'none'
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
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
        }}
      >
        {/* Only show QuickViewConfirmDialog when quickview is open and thread is loaded */}
        {isQuickViewOpen && thread && (
          <QuickViewConfirmDialog
            isOpen={showConfirmDialog}
            title="Centang PR?"
            message={`Apakah Anda yakin ingin mencentang PR "${thread.title}"? Semua sub tugas di dalamnya akan otomatis tercentang.`}
            confirmText="Ya, Centang"
            cancelText="Batal"
            onConfirm={handleConfirmThread}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
        <div className="quickview-header">
          <div className="quickview-header-top">
            <div className="quickview-header-left">
              {(thread as any).author?.kelas && (
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--primary)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(99, 102, 241, 0.1)',
                  whiteSpace: 'nowrap'
                }}>
                  {(thread as any).author?.kelas}
                </span>
              )}
              {canDeleteThread && (
                <button
                  onClick={() => setShowDeleteThreadDialog(true)}
                  className="quickview-delete-btn"
                  disabled={deleteThread.isLoading}
                  style={{
                    background: deleteThread.isLoading ? '#fca5a5' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.625rem',
                    cursor: deleteThread.isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s, transform 0.2s',
                    minWidth: '44px',
                    minHeight: '44px',
                    flexShrink: 0,
                    opacity: deleteThread.isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!deleteThread.isLoading) {
                      e.currentTarget.style.background = '#dc2626'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deleteThread.isLoading) {
                      e.currentTarget.style.background = '#ef4444'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                  title={isAdmin ? "Hapus PR (Admin)" : "Hapus PR Saya"}
                  aria-label={isAdmin ? "Hapus PR (Admin)" : "Hapus PR Saya"}
                >
                  {deleteThread.isLoading ? (
                    <LoadingSpinner size={20} color="white" />
                  ) : (
                    <TrashIcon size={20} />
                  )}
                </button>
              )}
            </div>
            <button
              onClick={handleCloseQuickView}
              className="quickview-close-btn"
              style={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text)',
                padding: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                minWidth: '44px',
                minHeight: '44px',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              aria-label="Tutup"
            >
              <XCloseIcon size={22} />
            </button>
          </div>
          
          <div className="quickview-title-section">
            {session && !isAdmin && (
              <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                <Checkbox
                  checked={isThreadCompleted}
                  onClick={handleThreadCheckboxClick}
                  isLoading={toggleThread.isLoading}
                  disabled={toggleThread.isLoading}
                  size={28}
                />
              </div>
            )}
            {session && isAdmin && (
              <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                <div style={{
                  minWidth: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  padding: '0 0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid var(--primary)',
                  background: 'transparent',
                  transition: 'all 0.2s',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (completionStats) {
                    setShowCompletionStatsModal(true)
                  }
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
                  {completionStats ? `${completionStats.completedCount}/${completionStats.totalCount}` : '-'}
                </div>
              </div>
            )}
            <h2 className="thread-detail-title" style={{ 
              margin: 0,
              flex: 1,
              lineHeight: 1.4,
              minWidth: 0
            }}>
              <span style={{
                textDecoration: isThreadCompleted ? 'line-through' : 'none',
                color: isThreadCompleted ? 'var(--text-light)' : 'var(--text)',
                wordBreak: 'break-word',
                display: 'block'
              }}>
                {thread.title}
              </span>
            </h2>
          </div>
        </div>

        <div className="thread-detail-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <UserIcon size={14} />
            <span>{(thread as any).author?.name || 'Unknown'}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CalendarIcon size={14} />
            {format(new Date(thread.date), 'EEEE, d MMMM yyyy', { locale: id })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MessageIcon size={14} />
            {(thread as any).comments?.length || 0} sub tugas
          </span>
          {isThreadCompleted && timeRemaining && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem',
              color: 'var(--text-light)'
            }}>
              <ClockIcon size={14} />
              Auto-hapus: {timeRemaining}
            </span>
          )}
        </div>

        <div className="comments-section">
          <h3 style={{ marginBottom: '1.5rem' }}>Sub Tugas</h3>

          {session && canActuallyPostEdit && (
            <form onSubmit={handleAddComment} className="add-comment-form">
              <div className="form-group">
                <label htmlFor="newComment" className="form-label">
                  Tambah Sub Tugas
                </label>
                <textarea
                  id="newComment"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                  className="form-input"
                  placeholder="Tulis sub tugas Anda..."
                  required
                  disabled={addComment.isLoading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={addComment.isLoading || isSubmittingComment || !commentContent.trim()}
              >
                {addComment.isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LoadingSpinner size={16} color="white" />
                    Mengirim...
                  </span>
                ) : 'Tambah Sub Tugas'}
              </button>
            </form>
          )}
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
            {!((thread as any).comments?.length > 0) ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
                Belum ada sub tugas. Jadilah yang pertama!
              </p>
            ) : (
              ((thread as any).comments || []).map((comment: any) => {
                const commentStatus = statuses?.find((s) => s.commentId === comment.id)
                const isCommentCompleted = commentStatus?.isCompleted || false
                
                // Check if user can edit/delete this comment
                const isCommentAuthor = session?.user?.id === comment?.author?.id
                const commentAuthorKelas = comment?.author?.kelas || null
                const isDantonOfCommentClass = isDanton && dantonKelas === commentAuthorKelas && dantonKelas !== null
                const canEditComment = isCommentAuthor && canActuallyPostEdit // Only author can edit, and must have post/edit permission AND subscription active
                const canDeleteComment = isAdmin || isCommentAuthor || isThreadAuthor || isDantonOfCommentClass
                const isEditing = editingCommentId === comment.id

                return (
                  <div key={comment.id} className="comment-card" style={{ position: 'relative' }}>
                    {session && !isAdmin && !isEditing && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <Checkbox
                          checked={isCommentCompleted}
                          onClick={() => {
                            if (session && !toggleComment.isLoading) {
                              toggleComment.mutate({
                                threadId,
                                commentId: comment.id,
                                isCompleted: !isCommentCompleted,
                              })
                            }
                          }}
                          isLoading={toggleComment.isLoading}
                          disabled={toggleComment.isLoading}
                          size={24}
                        />
                      </div>
                    )}
                    <div className="comment-content" style={{ flex: 1, position: 'relative' }}>
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
                          <div className="comment-content-header">
                            <div style={{
                              textDecoration: isCommentCompleted ? 'line-through' : 'none',
                              color: isCommentCompleted ? 'var(--text-light)' : 'var(--text)',
                              flex: 1,
                              wordBreak: 'break-word',
                              lineHeight: 1.6
                            }}>
                              {comment.content}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              {canEditComment && (
                                <button
                                  onClick={() => handleStartEdit(comment)}
                                  className="comment-edit-btn comment-edit-btn-desktop"
                                  disabled={editComment.isLoading}
                                  style={{
                                    background: editComment.isLoading ? '#cbd5e1' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem',
                                    cursor: editComment.isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s, transform 0.2s',
                                    minWidth: '36px',
                                    minHeight: '36px',
                                    flexShrink: 0,
                                    marginTop: '-0.25rem',
                                    opacity: editComment.isLoading ? 0.7 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!editComment.isLoading) {
                                      e.currentTarget.style.background = '#2563eb'
                                      e.currentTarget.style.transform = 'scale(1.1)'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!editComment.isLoading) {
                                      e.currentTarget.style.background = '#3b82f6'
                                      e.currentTarget.style.transform = 'scale(1)'
                                    }
                                  }}
                                  title="Edit Sub Tugas"
                                  aria-label="Edit Sub Tugas"
                                >
                                  <EditIcon size={18} />
                                </button>
                              )}
                              {canDeleteComment && (
                                <button
                                  onClick={() => setShowDeleteCommentDialog(comment.id)}
                                  className="comment-delete-btn comment-delete-btn-desktop"
                                  disabled={deleteComment.isLoading}
                                  style={{
                                    background: deleteComment.isLoading ? '#fca5a5' : '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem',
                                    cursor: deleteComment.isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s, transform 0.2s',
                                    minWidth: '36px',
                                    minHeight: '36px',
                                    flexShrink: 0,
                                    marginTop: '-0.25rem',
                                    opacity: deleteComment.isLoading ? 0.7 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!deleteComment.isLoading) {
                                      e.currentTarget.style.background = '#dc2626'
                                      e.currentTarget.style.transform = 'scale(1.1)'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!deleteComment.isLoading) {
                                      e.currentTarget.style.background = '#ef4444'
                                      e.currentTarget.style.transform = 'scale(1)'
                                    }
                                  }}
                                  title={
                                    isAdmin ? "Hapus Sub Tugas (Admin)" :
                                    isThreadAuthor ? "Hapus Sub Tugas (Author Thread)" :
                                    "Hapus Sub Tugas Saya"
                                  }
                                  aria-label={
                                    isAdmin ? "Hapus Sub Tugas (Admin)" :
                                    isThreadAuthor ? "Hapus Sub Tugas (Author Thread)" :
                                    "Hapus Sub Tugas Saya"
                                  }
                                >
                                  {deleteComment.isLoading ? (
                                    <LoadingSpinner size={16} color="white" />
                                  ) : (
                                    <TrashIcon size={18} />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                      {!isEditing && (canEditComment || canDeleteComment) && (
                        <div className="comment-admin-actions">
                          {canEditComment && (
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="comment-edit-btn comment-edit-btn-mobile"
                              disabled={editComment.isLoading}
                              style={{
                                background: editComment.isLoading ? '#cbd5e1' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.625rem',
                                cursor: editComment.isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s, transform 0.2s',
                                minWidth: '44px',
                                minHeight: '44px',
                                width: 'auto',
                                opacity: editComment.isLoading ? 0.7 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!editComment.isLoading) {
                                  e.currentTarget.style.background = '#2563eb'
                                  e.currentTarget.style.transform = 'scale(1.05)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!editComment.isLoading) {
                                  e.currentTarget.style.background = '#3b82f6'
                                  e.currentTarget.style.transform = 'scale(1)'
                                }
                              }}
                              title="Edit Sub Tugas"
                              aria-label="Edit Sub Tugas"
                            >
                              <EditIcon size={20} />
                            </button>
                          )}
                          {canDeleteComment && (
                            <button
                              onClick={() => setShowDeleteCommentDialog(comment.id)}
                              className="comment-delete-btn comment-delete-btn-mobile"
                              disabled={deleteComment.isLoading}
                              style={{
                                background: deleteComment.isLoading ? '#fca5a5' : '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.625rem',
                                cursor: deleteComment.isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s, transform 0.2s',
                                minWidth: '44px',
                                minHeight: '44px',
                                width: 'auto',
                                opacity: deleteComment.isLoading ? 0.7 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!deleteComment.isLoading) {
                                  e.currentTarget.style.background = '#dc2626'
                                  e.currentTarget.style.transform = 'scale(1.05)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!deleteComment.isLoading) {
                                  e.currentTarget.style.background = '#ef4444'
                                  e.currentTarget.style.transform = 'scale(1)'
                                }
                              }}
                              title={
                                isAdmin ? "Hapus Sub Tugas (Admin)" :
                                isThreadAuthor ? "Hapus Sub Tugas (Author Thread)" :
                                "Hapus Sub Tugas Saya"
                              }
                              aria-label={
                                isAdmin ? "Hapus Sub Tugas (Admin)" :
                                isThreadAuthor ? "Hapus Sub Tugas (Author Thread)" :
                                "Hapus Sub Tugas Saya"
                              }
                            >
                              {deleteComment.isLoading ? (
                                <LoadingSpinner size={20} color="white" />
                              ) : (
                                <TrashIcon size={20} />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                      {!isEditing && (
                        <div className="comment-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserIcon size={12} />
                            <span>{comment?.author?.name || 'Unknown'}</span>
                          </span>
                          {comment?.author?.kelas && (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              border: '1px solid var(--primary)',
                              color: 'var(--primary)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'transparent',
                              whiteSpace: 'nowrap'
                            }}>
                              {comment?.author?.kelas}
                            </span>
                          )}
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CalendarIcon size={12} />
                          {format(toJakartaDate(comment.createdAt), 'EEEE, d MMM yyyy, HH:mm', { locale: id })}
                        </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
        {isQuickViewOpen && thread && (
          <QuickViewConfirmDialog
            isOpen={showUncheckDialog}
            title="Uncentang PR?"
            message={`Apakah Anda yakin ingin menguncentang PR "${thread.title}"? Jika Anda mencentang lagi nanti, timer auto-hapus akan direset ke 1 hari lagi dari waktu centang tersebut.`}
            confirmText="Ya, Uncentang"
            cancelText="Batal"
            onConfirm={handleConfirmUncheck}
            onCancel={() => setShowUncheckDialog(false)}
          />
        )}
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
