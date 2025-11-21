'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, MessageIcon, TrashIcon } from '@/components/ui/Icons'

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
    onSuccess: async () => {
      setShowConfirmDialog(false)
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId: thread.id }),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.userStatus.getThreadStatuses.refetch({ threadId: thread.id }),
        utils.thread.getAll.refetch(),
        utils.history.getUserHistory.refetch(),
      ])
    },
    onError: (error: any) => {
      console.error('Error toggling thread:', error)
      toast.error('Gagal mengubah status thread. Silakan coba lagi.')
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
    onSuccess: async () => {
      setShowDeleteDialog(false)
      // Invalidate and refetch immediately
      await utils.thread.getAll.invalidate()
      await utils.thread.getAll.refetch()
    },
    onError: (error: any) => {
      console.error('Error deleting thread:', error)
      toast.error('Gagal menghapus thread. Silakan coba lagi.')
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
      <div className="thread-card-content">
        <div className="thread-card-header">
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
                accentColor: 'var(--primary)',
                flexShrink: 0
              }}
            />
          )}
          <h3 
            className="thread-title"
            style={{
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--text-light)' : 'var(--text)',
              flex: 1,
              margin: 0,
              lineHeight: 1.4
            }}
          >
            {thread.title}
          </h3>
        </div>
        
        {isAdmin && (
          <div className="thread-card-admin-actions">
            <button
              onClick={handleDeleteThread}
              className="thread-delete-btn"
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
                transition: 'background 0.2s'
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
              <span>Hapus PR</span>
            </button>
          </div>
        )}
        
        <div className="thread-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <UserIcon size={16} />
            <span>{thread.author.name}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <CalendarIcon size={16} />
            <span>{format(new Date(thread.date), 'd MMM yyyy', { locale: id })}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MessageIcon size={16} />
            <span>{thread._count.comments} komentar</span>
          </span>
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

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Centang PR?"
        message={`Apakah Anda yakin ingin mencentang PR "${thread.title}"? Semua komentar di dalamnya akan otomatis tercentang.`}
        confirmText="Ya, Centang"
        cancelText="Batal"
        onConfirm={handleConfirmThread}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus PR?"
        message={`Apakah Anda yakin ingin menghapus PR "${thread.title}"? Tindakan ini tidak dapat dibatalkan.`}
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
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId }),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
      ])
      // Force immediate refetch
      await Promise.all([
        utils.userStatus.getThreadStatuses.refetch({ threadId }),
        utils.thread.getAll.refetch(),
        utils.history.getUserHistory.refetch(),
      ])
    },
    onError: (error: any) => {
      console.error('Error toggling comment:', error)
      toast.error('Gagal mengubah status komentar. Silakan coba lagi.')
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
    onSuccess: async () => {
      setShowDeleteDialog(false)
      // Invalidate and refetch immediately
      await utils.thread.getAll.invalidate()
      await utils.thread.getAll.refetch()
    },
    onError: (error: any) => {
      console.error('Error deleting comment:', error)
      toast.error('Gagal menghapus komentar. Silakan coba lagi.')
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
            <TrashIcon size={12} />
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
