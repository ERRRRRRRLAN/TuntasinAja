'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import QuickViewConfirmDialog from '@/components/ui/QuickViewConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, MessageIcon, TrashIcon, XCloseIcon } from '@/components/ui/Icons'

interface ThreadQuickViewProps {
  threadId: string
  onClose: () => void
}

export default function ThreadQuickView({ threadId, onClose }: ThreadQuickViewProps) {
  const { data: session } = useSession()
  const [commentContent, setCommentContent] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDeleteThreadDialog, setShowDeleteThreadDialog] = useState(false)
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState<string | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)

  // Reset confirm dialog when quickview is closed or threadId changes
  useEffect(() => {
    setIsQuickViewOpen(true)
    setShowConfirmDialog(false)
    return () => {
      setIsQuickViewOpen(false)
      setShowConfirmDialog(false)
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
      // If unchecking, no confirmation needed
      if (isThreadCompleted) {
        toggleThread.mutate({
          threadId,
          isCompleted: false,
        })
      } else {
        // If checking, show confirmation dialog (only if quickview is open)
        setShowConfirmDialog(true)
      }
    }
  }

  const handleCloseQuickView = () => {
    setShowConfirmDialog(false)
    setIsQuickViewOpen(false)
    onClose()
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
      <div className="quickview-overlay" onClick={onClose}>
        <div className="quickview-content" onClick={(e) => e.stopPropagation()}>
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
    <div className="quickview-overlay" onClick={handleCloseQuickView}>
      <div className="quickview-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
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
                background: 'var(--bg-secondary)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                minWidth: '40px',
                minHeight: '40px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              aria-label="Tutup"
            >
              <XCloseIcon size={20} />
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
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s',
                  minHeight: '40px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444'
                }}
                title="Hapus PR (Admin)"
              >
                <TrashIcon size={18} />
                <span>Hapus</span>
              </button>
            )}
          </div>
          
          <div className="quickview-title-section">
            {session && (
              <input
                type="checkbox"
                checked={isThreadCompleted}
                onChange={() => {}}
                onClick={handleThreadCheckboxClick}
                style={{
                  width: '22px',
                  height: '22px',
                  cursor: 'pointer',
                  accentColor: 'var(--primary)',
                  flexShrink: 0
                }}
              />
            )}
            <h2 className="thread-detail-title" style={{ 
              margin: 0,
              flex: 1,
              lineHeight: 1.4
            }}>
              <span style={{
                textDecoration: isThreadCompleted ? 'line-through' : 'none',
                color: isThreadCompleted ? 'var(--text-light)' : 'var(--text)',
                wordBreak: 'break-word'
              }}>
                {thread.title}
              </span>
            </h2>
          </div>
        </div>

        <div className="thread-detail-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <UserIcon size={14} />
            {thread.author.name}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CalendarIcon size={14} />
            {format(new Date(thread.date), 'd MMMM yyyy', { locale: id })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MessageIcon size={14} />
            {thread.comments.length} komentar
          </span>
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
            {thread.comments.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
                Belum ada komentar. Jadilah yang pertama!
              </p>
            ) : (
              thread.comments.map((comment) => {
                const commentStatus = statuses?.find((s) => s.commentId === comment.id)
                const isCommentCompleted = commentStatus?.isCompleted || false

                return (
                  <div key={comment.id} className="comment-card" style={{ position: 'relative' }}>
                    {session && (
                      <input
                        type="checkbox"
                        checked={isCommentCompleted}
                        onChange={() => {}}
                        onClick={() => {
                          if (session) {
                            toggleComment.mutate({
                              threadId,
                              commentId: comment.id,
                              isCompleted: !isCommentCompleted,
                            })
                          }
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          marginTop: '0.25rem',
                          accentColor: 'var(--primary)'
                        }}
                      />
                    )}
                    <div className="comment-content" style={{ flex: 1 }}>
                      <div style={{
                        textDecoration: isCommentCompleted ? 'line-through' : 'none',
                        color: isCommentCompleted ? 'var(--text-light)' : 'var(--text)',
                        marginBottom: '0.75rem',
                        wordBreak: 'break-word',
                        lineHeight: 1.6
                      }}>
                        {comment.content}
                      </div>
                      {isAdmin && (
                        <div className="comment-admin-actions">
                          <button
                            onClick={() => setShowDeleteCommentDialog(comment.id)}
                            className="comment-delete-btn"
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <UserIcon size={12} />
                          {comment.author.name}
                        </span>
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

