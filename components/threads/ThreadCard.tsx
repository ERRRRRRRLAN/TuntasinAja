'use client'

import { useState, useEffect } from 'react'
import { format, differenceInHours, differenceInMinutes, addDays, differenceInDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { toJakartaDate, getUTCDate } from '@/lib/date-utils'
import { trpc } from '@/lib/trpc'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CompletionStatsModal from '@/components/ui/CompletionStatsModal'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, MessageIcon, ClockIcon } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ThreadCardProps {
  thread: {
    id: string
    title: string
    date: Date
    createdAt: Date
    deadline?: Date | null
    isGroupTask?: boolean
    groupTaskTitle?: string | null
    author: {
      id: string
      name: string
      kelas?: string | null
    }
    comments: Array<{
      id: string
      content: string
      deadline?: Date | null
      author: {
        id: string
        name: string
        kelas?: string | null
      }
    }>
    _count: {
      comments: number
    }
    groupMembers?: Array<{
      userId: string
      user: {
        id: string
        name: string
      }
    }>
  }
  onThreadClick?: (threadId: string) => void
}

export default function ThreadCard({ thread, onThreadClick }: ThreadCardProps) {
  const { data: session } = useSession()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showUncheckDialog, setShowUncheckDialog] = useState(false)
  const [showCompletionStatsModal, setShowCompletionStatsModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')

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

  // Get completion stats for admin
  const { data: completionStats } = trpc.thread.getCompletionStats.useQuery(
    { threadId: thread.id },
    { enabled: !!session && isAdmin }
  )

  const utils = trpc.useUtils()

  const threadStatus = statuses?.find((s) => s.threadId === thread.id && !s.commentId)
  const isCompleted = threadStatus?.isCompleted || false

  // Calculate time remaining until auto-delete (1 day from when thread was checked)
  // Timer only shows when thread is completed
  useEffect(() => {
    if (!isCompleted || !threadStatus?.updatedAt) {
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
  }, [isCompleted, threadStatus?.updatedAt])

  // Toggle thread completion
  const toggleThread = trpc.userStatus.toggleThread.useMutation({
    onSuccess: async () => {
      setShowConfirmDialog(false)
      // Invalidate first to mark as stale
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId: thread.id }),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
        utils.userStatus.getUncompletedCount.invalidate(),
        utils.userStatus.getOverdueTasks.invalidate(),
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
      // If unchecking, show confirmation dialog about timer reset
      if (isCompleted) {
        setShowUncheckDialog(true)
      } else {
        // If checking, show confirmation dialog
        setShowConfirmDialog(true)
      }
    }
  }

  const handleConfirmUncheck = () => {
    setShowUncheckDialog(false)
    toggleThread.mutate({
      threadId: thread.id,
      isCompleted: false,
    })
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
    // Don't open quickview if any dialog is open
    if (showConfirmDialog || showUncheckDialog) {
      return
    }
    if (onThreadClick) {
      onThreadClick(thread.id)
    }
  }

  // Calculate all deadline badges (from thread and comments)
  const getAllDeadlineBadges = () => {
    const now = getUTCDate()
    const nowJakarta = toJakartaDate(now)
    const badges: Array<{ text: string; color: string; bg: string }> = []

    // Add thread deadline if exists
    if (thread.deadline) {
      const deadlineUTC = new Date(thread.deadline)
      const deadlineJakarta = toJakartaDate(deadlineUTC)
      const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
      const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta)

      if (hoursUntilDeadline < 0) {
        badges.push({
          text: 'Deadline lewat',
          color: 'var(--danger)',
          bg: 'var(--danger)20',
        })
      } else if (hoursUntilDeadline < 2) {
        badges.push({
          text: `${hoursUntilDeadline * 60 + differenceInMinutes(deadlineJakarta, nowJakarta) % 60}m lagi`,
          color: 'var(--danger)',
          bg: 'var(--danger)20',
        })
      } else if (hoursUntilDeadline < 24) {
        badges.push({
          text: `${hoursUntilDeadline}j lagi`,
          color: 'var(--danger)',
          bg: 'var(--danger)20',
        })
      } else if (daysUntilDeadline < 3) {
        badges.push({
          text: `${daysUntilDeadline}d lagi`,
          color: 'var(--warning)',
          bg: 'var(--warning)20',
        })
      } else {
        badges.push({
          text: format(deadlineJakarta, 'd MMM', { locale: id }),
          color: 'var(--text-light)',
          bg: 'var(--bg-secondary)',
        })
      }
    }

    // Add comment deadlines
    thread.comments.forEach((comment) => {
      if (comment.deadline) {
        const deadlineUTC = new Date(comment.deadline)
        const deadlineJakarta = toJakartaDate(deadlineUTC)
        const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
        const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta)

        if (hoursUntilDeadline < 0) {
          badges.push({
            text: 'Deadline lewat',
            color: 'var(--danger)',
            bg: 'var(--danger)20',
          })
        } else if (hoursUntilDeadline < 2) {
          badges.push({
            text: `${hoursUntilDeadline * 60 + differenceInMinutes(deadlineJakarta, nowJakarta) % 60}m lagi`,
            color: 'var(--danger)',
            bg: 'var(--danger)20',
          })
        } else if (hoursUntilDeadline < 24) {
          badges.push({
            text: `${hoursUntilDeadline}j lagi`,
            color: 'var(--danger)',
            bg: 'var(--danger)20',
          })
        } else if (daysUntilDeadline < 3) {
          badges.push({
            text: `${daysUntilDeadline}d lagi`,
            color: 'var(--warning)',
            bg: 'var(--warning)20',
          })
        } else {
          badges.push({
            text: format(deadlineJakarta, 'd MMM', { locale: id }),
            color: 'var(--text-light)',
            bg: 'var(--bg-secondary)',
          })
        }
      }
    })

    // Remove duplicates and sort by urgency (shorter time first)
    const uniqueBadges = Array.from(
      new Map(badges.map(badge => [badge.text, badge])).values()
    )

    return uniqueBadges
  }

  const deadlineBadges = getAllDeadlineBadges()


  return (
    <div 
      className="thread-card" 
      onClick={handleCardClick}
      style={{ 
        cursor: 'pointer',
        pointerEvents: (showConfirmDialog || showUncheckDialog) ? 'none' : 'auto'
      }}
    >
      <div className="thread-card-content">
        <div className="thread-card-header">
          {session && !isAdmin && (
            <Checkbox
              checked={isCompleted}
              onClick={handleCheckboxClick}
              isLoading={toggleThread.isLoading}
              disabled={toggleThread.isLoading}
              size={28}
            />
          )}
          {session && isAdmin && (
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
          )}
          <div className="thread-card-header-content" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 
                  className="thread-title"
                  style={{
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted ? 'var(--text-light)' : 'var(--text)',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {thread.title}
                </h3>
                {thread.isGroupTask && (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>
                    Kelompok
                  </span>
                )}
                {thread.author.kelas && (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'transparent',
                  }}>
                    {thread.author.kelas}
                  </span>
                )}
              </div>
              {thread.isGroupTask && thread.groupTaskTitle && (
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--text-light)',
                  fontStyle: 'italic',
                }}>
                  {thread.groupTaskTitle}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="thread-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <UserIcon size={16} />
            <span>{thread.author.name}</span>
          </span>
          {thread.isGroupTask && thread.groupMembers && thread.groupMembers.length > 0 && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.375rem',
              fontSize: '0.875rem',
              color: 'var(--text-light)',
            }}>
              👥 {thread.groupMembers.length} anggota
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <CalendarIcon size={16} />
            <span>{format(new Date(thread.date), 'EEEE, d MMM yyyy', { locale: id })}</span>
          </span>
          {deadlineBadges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {deadlineBadges.map((badge, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: badge.color,
                    background: badge.bg,
                  }}
                >
                  <ClockIcon size={14} />
                  {badge.text}
                </span>
              ))}
            </div>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MessageIcon size={16} />
            <span>{thread._count.comments} sub tugas</span>
          </span>
          {isCompleted && timeRemaining && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.375rem',
              color: 'var(--text-light)',
              fontSize: '0.875rem'
            }}>
              <ClockIcon size={16} />
              <span>Auto-hapus: {timeRemaining}</span>
            </span>
          )}
        </div>

        {thread.comments.length > 0 && (
          <div className="thread-comments-preview">
            {thread.comments.slice(0, 2).map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                threadId={thread.id}
                statuses={statuses || []}
                threadAuthorId={thread.author.id}
              />
            ))}
            {thread.comments.length > 2 && (
              <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                + {thread.comments.length - 2} sub tugas lainnya
              </p>
            )}
          </div>
        )}

      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Centang PR?"
        message={`Apakah Anda yakin ingin mencentang PR "${thread.title}"? Semua sub tugas di dalamnya akan otomatis tercentang.`}
        confirmText="Ya, Centang"
        cancelText="Batal"
        onConfirm={handleConfirmThread}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <ConfirmDialog
        isOpen={showUncheckDialog}
        title="Uncentang PR?"
        message={`Apakah Anda yakin ingin menguncentang PR "${thread.title}"? Jika Anda mencentang lagi nanti, timer auto-hapus akan direset ke 1 hari lagi dari waktu centang tersebut.`}
        confirmText="Ya, Uncentang"
        cancelText="Batal"
        onConfirm={handleConfirmUncheck}
        onCancel={() => setShowUncheckDialog(false)}
      />
      
      {isAdmin && completionStats && (
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
  )
}

function CommentItem({ 
  comment, 
  threadId,
  statuses,
  threadAuthorId
}: { 
  comment: { id: string; content: string; deadline?: Date | null; author: { id: string; name: string; kelas?: string | null } }
  threadId: string
  statuses: Array<{ commentId?: string | null; isCompleted: boolean }>
  threadAuthorId: string
}) {
  const { data: session } = useSession()
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
      toast.error('Gagal mengubah status sub tugas. Silakan coba lagi.')
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


  return (
    <div className="comment-item" style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', position: 'relative', width: '100%' }}>
      {session && !isAdmin && (
        <div style={{ marginTop: '0.25rem' }}>
          <Checkbox
            checked={isCompleted}
            onClick={handleCheckboxClick}
            isLoading={toggleComment.isLoading}
            disabled={toggleComment.isLoading}
            size={24}
          />
        </div>
      )}
      <div className="comment-text" style={{ flex: 1 }}>
        <div style={{
          textDecoration: isCompleted ? 'line-through' : 'none',
          color: isCompleted ? 'var(--text-light)' : 'var(--text)'
        }}>
          {comment.content}
        </div>
        <div className="comment-author" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', position: 'relative', flexWrap: 'wrap', gap: '0.375rem' }}>
          <span>- {comment.author.name}</span>
          {comment.deadline && (() => {
            const now = getUTCDate()
            const deadlineUTC = new Date(comment.deadline)
            const deadlineJakarta = toJakartaDate(deadlineUTC)
            const nowJakarta = toJakartaDate(now)
            const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
            const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta)

            let deadlineText = ''
            let deadlineColor = 'var(--text-light)'
            let deadlineBg = 'var(--bg-secondary)'

            if (hoursUntilDeadline < 0) {
              deadlineText = 'Deadline lewat'
              deadlineColor = 'var(--danger)'
              deadlineBg = 'var(--danger)20'
            } else if (hoursUntilDeadline < 2) {
              deadlineText = `${hoursUntilDeadline * 60 + differenceInMinutes(deadlineJakarta, nowJakarta) % 60}m lagi`
              deadlineColor = 'var(--danger)'
              deadlineBg = 'var(--danger)20'
            } else if (hoursUntilDeadline < 24) {
              deadlineText = `${hoursUntilDeadline}j lagi`
              deadlineColor = 'var(--danger)'
              deadlineBg = 'var(--danger)20'
            } else if (daysUntilDeadline < 3) {
              deadlineText = `${daysUntilDeadline}d lagi`
              deadlineColor = 'var(--warning)'
              deadlineBg = 'var(--warning)20'
            } else {
              deadlineText = format(deadlineJakarta, 'd MMM', { locale: id })
            }

            return (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: deadlineColor,
                background: deadlineBg,
              }}>
                <ClockIcon size={12} />
                {deadlineText}
              </span>
            )
          })()}
          {comment.author.kelas && (
            <span style={{
              display: 'inline-block',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'transparent'
            }}>
              {comment.author.kelas}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
