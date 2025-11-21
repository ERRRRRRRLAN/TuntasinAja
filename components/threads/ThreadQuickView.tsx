'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import QuickViewConfirmDialog from '@/components/ui/QuickViewConfirmDialog'

interface ThreadQuickViewProps {
  threadId: string
  onClose: () => void
}

export default function ThreadQuickView({ threadId, onClose }: ThreadQuickViewProps) {
  const { data: session } = useSession()
  const [commentContent, setCommentContent] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
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

  const utils = trpc.useUtils()

  const threadStatus = statuses?.find((s) => s.threadId === threadId && !s.commentId)
  const isThreadCompleted = threadStatus?.isCompleted || false

  const toggleThread = trpc.userStatus.toggleThread.useMutation({
    onSuccess: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId })
      utils.thread.getById.invalidate({ id: threadId })
      utils.history.getUserHistory.invalidate()
      setShowConfirmDialog(false)
    },
    onError: (error) => {
      console.error('Error toggling thread:', error)
      alert('Gagal mengubah status thread. Silakan coba lagi.')
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
    onSuccess: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId })
      utils.thread.getById.invalidate({ id: threadId })
      utils.history.getUserHistory.invalidate()
    },
    onError: (error) => {
      console.error('Error toggling comment:', error)
      alert('Gagal mengubah status komentar. Silakan coba lagi.')
    },
  })

  const addComment = trpc.thread.addComment.useMutation({
    onSuccess: () => {
      setCommentContent('')
      utils.thread.getById.invalidate({ id: threadId })
      utils.thread.getAll.invalidate()
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

  if (isLoading) {
    return (
      <div className="quickview-overlay" onClick={onClose}>
        <div className="quickview-content" onClick={(e) => e.stopPropagation()}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)' }}>Memuat thread...</p>
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
            title="Centang Thread?"
            message={`Apakah Anda yakin ingin mencentang thread "${thread.title}"? Semua komentar di dalamnya akan otomatis tercentang.`}
            confirmText="Ya, Centang"
            cancelText="Batal"
            onConfirm={handleConfirmThread}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
        <div className="quickview-header">
          <h2 className="thread-detail-title">
            {session && (
              <input
                type="checkbox"
                checked={isThreadCompleted}
                onChange={() => {}}
                onClick={handleThreadCheckboxClick}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: 'var(--primary)'
                }}
              />
            )}
            <span style={{
              textDecoration: isThreadCompleted ? 'line-through' : 'none',
              color: isThreadCompleted ? 'var(--text-light)' : 'var(--text)'
            }}>
              {thread.title}
            </span>
          </h2>
          <button
            onClick={handleCloseQuickView}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: '0.5rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div className="thread-detail-meta">
          <span>👤 {thread.author.name}</span>
          <span>📅 {format(new Date(thread.date), 'd MMMM yyyy', { locale: id })}</span>
          <span>💬 {thread.comments.length} komentar</span>
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
                  <div key={comment.id} className="comment-card">
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
                        marginBottom: '0.5rem'
                      }}>
                        {comment.content}
                      </div>
                      <div className="comment-footer">
                        <span>👤 {comment.author.name}</span>
                        <span>📅 {format(new Date(comment.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

