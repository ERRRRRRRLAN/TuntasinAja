'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface ThreadCardProps {
  thread: {
    id: string
    title: string
    date: Date
    author: {
      id: string
      name: string
    }
    comments: Array<{
      id: string
      content: string
      author: {
        id: string
        name: string
      }
    }>
    _count: {
      comments: number
    }
  }
  onThreadClick?: (threadId: string) => void
}

export default function ThreadCard({ thread, onThreadClick }: ThreadCardProps) {
  const { data: session } = useSession()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Get thread status
  const { data: statuses } = trpc.userStatus.getThreadStatuses.useQuery(
    { threadId: thread.id },
    { enabled: !!session }
  )

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  const utils = trpc.useUtils()

  const threadStatus = statuses?.find((s) => s.threadId === thread.id && !s.commentId)
  const isCompleted = threadStatus?.isCompleted || false

  // Toggle thread completion
  const toggleThread = trpc.userStatus.toggleThread.useMutation({
    onSuccess: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId: thread.id })
      utils.thread.getAll.invalidate()
      utils.history.getUserHistory.invalidate()
      setShowConfirmDialog(false)
    },
    onError: (error) => {
      console.error('Error toggling thread:', error)
      alert('Gagal mengubah status thread. Silakan coba lagi.')
      setShowConfirmDialog(false)
    },
  })

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (session) {
      // If unchecking, no confirmation needed
      if (isCompleted) {
        toggleThread.mutate({
          threadId: thread.id,
          isCompleted: false,
        })
      } else {
        // If checking, show confirmation dialog
        setShowConfirmDialog(true)
      }
    }
  }

  const handleConfirmThread = () => {
    // Close dialog immediately for better UX
    setShowConfirmDialog(false)
    // Then execute the mutation
    toggleThread.mutate({
      threadId: thread.id,
      isCompleted: true,
    })
  }

  const handleCardClick = () => {
    if (onThreadClick) {
      onThreadClick(thread.id)
    }
  }

  // Delete thread (Admin only)
  const deleteThread = trpc.thread.delete.useMutation({
    onSuccess: () => {
      utils.thread.getAll.invalidate()
      setShowDeleteDialog(false)
    },
    onError: (error) => {
      console.error('Error deleting thread:', error)
      alert('Gagal menghapus thread. Silakan coba lagi.')
      setShowDeleteDialog(false)
    },
  })

  const handleDeleteThread = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAdmin) {
      setShowDeleteDialog(true)
    }
  }

  const handleConfirmDelete = () => {
    deleteThread.mutate({ id: thread.id })
  }

  return (
    <div 
      className="thread-card" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
        {session && (
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            className="thread-checkbox"
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              marginTop: '0.25rem',
              accentColor: 'var(--primary)',
              flexShrink: 0
            }}
          />
        )}
        <div style={{ flex: 1, position: 'relative' }}>
          {isAdmin && (
            <button
              onClick={handleDeleteThread}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
              title="Hapus Thread (Admin)"
            >
              🗑️ Hapus
            </button>
          )}
          <h3 
            className="thread-title"
            style={{
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--text-light)' : 'var(--text)'
            }}
          >
            {thread.title}
          </h3>
          <div className="thread-meta">
            <span>👤 {thread.author.name}</span>
            <span>📅 {format(new Date(thread.date), 'd MMMM yyyy', { locale: id })}</span>
            <span>💬 {thread._count.comments} komentar</span>
          </div>

          {thread.comments.length > 0 && (
            <div className="thread-comments-preview">
              {thread.comments.slice(0, 2).map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  threadId={thread.id}
                  statuses={statuses || []}
                />
              ))}
              {thread.comments.length > 2 && (
                <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                  + {thread.comments.length - 2} komentar lainnya
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Centang Thread?"
        message={`Apakah Anda yakin ingin mencentang thread "${thread.title}"? Semua komentar di dalamnya akan otomatis tercentang.`}
        confirmText="Ya, Centang"
        cancelText="Batal"
        onConfirm={handleConfirmThread}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus Thread?"
        message={`Apakah Anda yakin ingin menghapus thread "${thread.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}

function CommentItem({ 
  comment, 
  threadId,
  statuses 
}: { 
  comment: { id: string; content: string; author: { id: string; name: string } }
  threadId: string
  statuses: Array<{ commentId?: string | null; isCompleted: boolean }>
}) {
  const { data: session } = useSession()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const commentStatus = statuses.find((s) => s.commentId === comment.id)
  const isCompleted = commentStatus?.isCompleted || false

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  const utils = trpc.useUtils()

  const toggleComment = trpc.userStatus.toggleComment.useMutation({
    onSuccess: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId })
      utils.thread.getAll.invalidate()
      utils.history.getUserHistory.invalidate()
    },
    onError: (error) => {
      console.error('Error toggling comment:', error)
      alert('Gagal mengubah status komentar. Silakan coba lagi.')
    },
  })

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (session) {
      toggleComment.mutate({
        threadId,
        commentId: comment.id,
        isCompleted: !isCompleted,
      })
    }
  }

  // Delete comment (Admin only)
  const deleteComment = trpc.thread.deleteComment.useMutation({
    onSuccess: () => {
      utils.thread.getAll.invalidate()
      setShowDeleteDialog(false)
    },
    onError: (error) => {
      console.error('Error deleting comment:', error)
      alert('Gagal menghapus komentar. Silakan coba lagi.')
      setShowDeleteDialog(false)
    },
  })

  const handleDeleteComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAdmin) {
      setShowDeleteDialog(true)
    }
  }

  const handleConfirmDelete = () => {
    deleteComment.mutate({ id: comment.id })
  }

  return (
    <div className="comment-item" style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', position: 'relative' }}>
      {session && (
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => {}}
          onClick={handleCheckboxClick}
          className="comment-checkbox"
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            marginTop: '0.25rem',
            accentColor: 'var(--primary)',
            flexShrink: 0
          }}
        />
      )}
      <div className="comment-text" style={{ flex: 1 }}>
        {isAdmin && (
          <button
            onClick={handleDeleteComment}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.125rem 0.375rem',
              cursor: 'pointer',
              fontSize: '0.625rem',
              fontWeight: 'bold'
            }}
            title="Hapus Komentar (Admin)"
          >
            🗑️
          </button>
        )}
        <div style={{
          textDecoration: isCompleted ? 'line-through' : 'none',
          color: isCompleted ? 'var(--text-light)' : 'var(--text)'
        }}>
          {comment.content}
        </div>
        <div className="comment-author">- {comment.author.name}</div>
      </div>
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus Komentar?"
        message="Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
