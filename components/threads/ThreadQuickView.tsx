'use client'

import { useState, useEffect, useRef } from 'react'
import { format, differenceInHours, differenceInMinutes, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import QuickViewConfirmDialog from '@/components/ui/QuickViewConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, MessageIcon, TrashIcon, XCloseIcon, ClockIcon } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'

interface ThreadQuickViewProps {
  threadId: string
  onClose: () => void
}

export default function ThreadQuickView({ threadId, onClose }: ThreadQuickViewProps) {
  const { data: session } = useSession()
  const [commentContent, setCommentContent] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showUncheckDialog, setShowUncheckDialog] = useState(false)
  const [showDeleteThreadDialog, setShowDeleteThreadDialog] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState<string | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Reset confirm dialog when quickview is closed or threadId changes
  useEffect(() => {
    setIsQuickViewOpen(true)
    setShowConfirmDialog(false)
    
    // Lock body scroll when quickview is open (mobile)
    document.body.style.overflow = 'hidden'
    
    // Small delay to ensure DOM is ready before showing
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
    
    return () => {
      setIsQuickViewOpen(false)
      setShowConfirmDialog(false)
      setIsVisible(false)
      // Unlock body scroll when quickview is closed
      document.body.style.overflow = ''
    }
  }, [threadId])

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

  const handleCloseQuickView = () => {
    setShowConfirmDialog(false)
    setIsQuickViewOpen(false)
    setIsVisible(false)
    
    // Wait for transition to complete before closing
    const timer = setTimeout(() => {
      document.body.style.overflow = ''
      onClose()
    }, 300) // Match transition duration
    
    return () => clearTimeout(timer)
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
      toast.error('Gagal mengubah status komentar. Silakan coba lagi.')
    },
  })

  const addComment = trpc.thread.addComment.useMutation({
    onSuccess: async () => {
      setCommentContent('')
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
  })

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (commentContent.trim()) {
      addComment.mutate({
        threadId,
        content: commentContent.trim(),
      })
    }
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
      toast.error('Gagal menghapus komentar. Silakan coba lagi.')
      setShowDeleteCommentDialog(null)
    },
  })

  if (isLoading) {
    return (
      <div className={`quickview-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseQuickView}>
        <div className={`quickview-content ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
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

  return (
    <div 
      ref={overlayRef}
      className="quickview-overlay" 
      onClick={handleCloseQuickView}
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
            message={`Apakah Anda yakin ingin mencentang PR "${thread.title}"? Semua komentar di dalamnya akan otomatis tercentang.`}
            confirmText="Ya, Centang"
            cancelText="Batal"
            onConfirm={handleConfirmThread}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
        <div className="quickview-header">
          <div className="quickview-header-top">
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
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
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
            {isAdmin && (
              <button
                onClick={() => setShowDeleteThreadDialog(true)}
                className="quickview-delete-btn"
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'background 0.2s',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444'
                }}
                title="Hapus PR (Admin)"
              >
                <TrashIcon size={16} />
                <span>Hapus</span>
              </button>
            )}
          </div>
          
          <div className="quickview-title-section" style={{ position: 'relative' }}>
            {session && (
              <Checkbox
                checked={isThreadCompleted}
                onClick={handleThreadCheckboxClick}
                isLoading={toggleThread.isLoading}
                disabled={toggleThread.isLoading}
                size={28}
              />
            )}
            <h2 className="thread-detail-title" style={{ 
              margin: 0,
              flex: 1,
              lineHeight: 1.4,
              paddingRight: (thread as any).author?.kelas && isAdmin ? '160px' : ((thread as any).author?.kelas ? '80px' : '0')
            }}>
              <span style={{
                textDecoration: isThreadCompleted ? 'line-through' : 'none',
                color: isThreadCompleted ? 'var(--text-light)' : 'var(--text)',
                wordBreak: 'break-word'
              }}>
                {thread.title}
              </span>
            </h2>
            {(thread as any).author?.kelas && (
              <span style={{
                position: 'absolute',
                right: isAdmin ? '70px' : '0',
                top: 0,
                display: 'inline-block',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'transparent',
                zIndex: 1
              }}>
                {(thread as any).author?.kelas}
              </span>
            )}
          </div>
        </div>

        <div className="thread-detail-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <UserIcon size={14} />
            <span>{(thread as any).author?.name || 'Unknown'}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CalendarIcon size={14} />
            {format(new Date(thread.date), 'd MMMM yyyy', { locale: id })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MessageIcon size={14} />
            {(thread as any).comments?.length || 0} komentar
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
          <h3 style={{ marginBottom: '1.5rem' }}>Komentar</h3>

          {session && (
            <form onSubmit={handleAddComment} className="add-comment-form">
              <div className="form-group">
                <label htmlFor="newComment" className="form-label">
                  Tambah Komentar
                </label>
                <textarea
                  id="newComment"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                  className="form-input"
                  placeholder="Tulis komentar Anda..."
                  required
                  disabled={addComment.isLoading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={addComment.isLoading || !commentContent.trim()}
              >
                {addComment.isLoading ? 'Mengirim...' : 'Tambah Komentar'}
              </button>
            </form>
          )}

          <div className="comments-list">
            {!((thread as any).comments?.length > 0) ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
                Belum ada komentar. Jadilah yang pertama!
              </p>
            ) : (
              ((thread as any).comments || []).map((comment: any) => {
                const commentStatus = statuses?.find((s) => s.commentId === comment.id)
                const isCommentCompleted = commentStatus?.isCompleted || false

                return (
                  <div key={comment.id} className="comment-card" style={{ position: 'relative' }}>
                    {session && (
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
                        {isAdmin && (
                          <button
                            onClick={() => setShowDeleteCommentDialog(comment.id)}
                            className="comment-delete-btn comment-delete-btn-desktop"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.375rem 0.625rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'background 0.2s',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              marginTop: '-0.25rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dc2626'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ef4444'
                            }}
                            title="Hapus Komentar (Admin)"
                          >
                            <TrashIcon size={14} />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="comment-admin-actions">
                          <button
                            onClick={() => setShowDeleteCommentDialog(comment.id)}
                            className="comment-delete-btn comment-delete-btn-mobile"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.375rem',
                              width: '100%',
                              transition: 'background 0.2s',
                              minHeight: '36px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dc2626'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ef4444'
                            }}
                            title="Hapus Komentar (Admin)"
                          >
                            <TrashIcon size={16} />
                            <span>Hapus Komentar</span>
                          </button>
                        </div>
                      )}
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
                          {format(new Date(comment.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                      </div>
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
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={() => deleteThread.mutate({ id: threadId })}
          onCancel={() => setShowDeleteThreadDialog(false)}
        />
        {showDeleteCommentDialog && (
          <QuickViewConfirmDialog
            isOpen={!!showDeleteCommentDialog}
            title="Hapus Komentar?"
            message="Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan."
            confirmText="Ya, Hapus"
            cancelText="Batal"
            onConfirm={() => {
              if (showDeleteCommentDialog) {
                deleteComment.mutate({ id: showDeleteCommentDialog })
              }
            }}
            onCancel={() => setShowDeleteCommentDialog(null)}
          />
        )}
      </div>
    </div>
  )
}

