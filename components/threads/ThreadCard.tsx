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
      deadline?: Date | null // Make sure this is included
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

  // Get thread status (for current user)
  const { data: statuses } = trpc.userStatus.getThreadStatuses.useQuery(
    { threadId: thread.id },
    { enabled: !!session }
  )

  // Get group task progress (for all users - public data)
  const { data: groupTaskProgress } = trpc.thread.getGroupTaskProgress.useQuery(
    { threadId: thread.id },
    { enabled: thread.isGroupTask === true }
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

  // Use server-calculated progress for group tasks (works for all users)
  // Fallback to client-side calculation if server data not available
  const groupProgress = thread.isGroupTask && groupTaskProgress
    ? groupTaskProgress
    : thread.isGroupTask && thread.comments && thread.comments.length > 0 && statuses
    ? (() => {
        const completedComments = thread.comments.filter((comment) => {
          const commentStatus = statuses.find((s) => s.commentId === comment.id)
          return commentStatus?.isCompleted || false
        })
        const totalComments = thread.comments.length
        const completedCount = completedComments.length
        const percentage = totalComments > 0 ? Math.round((completedCount / totalComments) * 100) : 0
        return {
          completed: completedCount,
          total: totalComments,
          percentage,
        }
      })()
    : null

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

  // Calculate deadline badge for a single deadline
  const getDeadlineBadge = (deadline: Date | null | undefined) => {
    if (!deadline) return null

    const now = getUTCDate()
    const deadlineUTC = new Date(deadline)
    const deadlineJakarta = toJakartaDate(deadlineUTC)
    const nowJakarta = toJakartaDate(now)

    const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
    const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta)

    if (hoursUntilDeadline < 0) {
      // Deadline sudah lewat
      return {
        text: 'Deadline lewat',
        color: 'var(--danger)',
        bg: 'var(--danger)20',
      }
    } else if (hoursUntilDeadline < 2) {
      // Kurang dari 2 jam
      return {
        text: `${hoursUntilDeadline * 60 + differenceInMinutes(deadlineJakarta, nowJakarta) % 60}m lagi`,
        color: 'var(--danger)',
        bg: 'var(--danger)20',
      }
    } else if (hoursUntilDeadline < 24) {
      // Kurang dari 24 jam
      return {
        text: `${hoursUntilDeadline}j lagi`,
        color: 'var(--danger)',
        bg: 'var(--danger)20',
      }
    } else if (daysUntilDeadline < 3) {
      // Kurang dari 3 hari
      return {
        text: `${daysUntilDeadline}d lagi`,
        color: 'var(--warning)',
        bg: 'var(--warning)20',
      }
    } else {
      // Lebih dari 3 hari
      return {
        text: format(deadlineJakarta, 'd MMM', { locale: id }),
        color: 'var(--text-light)',
        bg: 'var(--bg-secondary)',
      }
    }
  }

  // Get all unique deadlines from thread and comments
  const getAllDeadlines = () => {
    const deadlines: Date[] = []
    
    // Add thread deadline if exists
    if (thread.deadline) {
      deadlines.push(new Date(thread.deadline))
    }
    
    // Add comment deadlines if they exist and are different from thread deadline
    thread.comments.forEach(comment => {
      if (comment.deadline) {
        const commentDeadline = new Date(comment.deadline)
        // Check if this deadline is different from existing ones (compare timestamps)
        const isDifferent = !deadlines.some(d => 
          Math.abs(d.getTime() - commentDeadline.getTime()) < 60000 // Within 1 minute = same
        )
        if (isDifferent) {
          deadlines.push(commentDeadline)
        }
      }
    })
    
    // Sort deadlines by date (earliest first)
    return deadlines.sort((a, b) => a.getTime() - b.getTime())
  }

  const allDeadlines = getAllDeadlines()
  const deadlineBadges = allDeadlines.map(deadline => getDeadlineBadge(deadline)).filter(Boolean)

  // Filter out comments with expired deadline (hide them)
  const visibleComments = thread.comments.filter(comment => {
    if (!comment.deadline) return true // Show comments without deadline
    
    const deadlineDate = new Date(comment.deadline)
    const now = getUTCDate()
    const isExpired = deadlineDate <= now
    
    console.log('[ThreadCard] Comment deadline check:', {
      commentId: comment.id,
      content: comment.content.substring(0, 30),
      deadline: comment.deadline,
      deadlineDate: deadlineDate.toISOString(),
      now: now.toISOString(),
      isExpired,
      willShow: !isExpired
    })
    
    return !isExpired // Only show if deadline hasn't passed
  })

  console.log('[ThreadCard] Thread visibility:', {
    threadId: thread.id,
    title: thread.title,
    totalComments: thread.comments.length,
    visibleComments: visibleComments.length,
    shouldHide: thread.comments.length > 0 && visibleComments.length === 0
  })

  // Check if thread should be hidden (all comments are hidden due to expired deadline)
  const shouldHideThread = thread.comments.length > 0 && visibleComments.length === 0


  // Don't render if thread should be hidden
  if (shouldHideThread) {
    return null
  }

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
          {thread.isGroupTask && groupProgress && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              marginTop: '0.5rem',
            }}>
              <div style={{
                flex: 1,
                height: '8px',
                background: 'var(--bg-secondary)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${groupProgress.percentage}%`,
                  height: '100%',
                  background: groupProgress.percentage === 100 ? 'var(--success)' : 'var(--primary)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-light)',
                whiteSpace: 'nowrap',
              }}>
                {groupProgress.completed}/{groupProgress.total}
              </span>
            </div>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <CalendarIcon size={16} />
            <span>{format(new Date(thread.date), 'EEEE, d MMM yyyy', { locale: id })}</span>
          </span>
          {deadlineBadges.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                    color: badge!.color,
                    background: badge!.bg,
                  }}
                >
                  <ClockIcon size={14} />
                  {badge!.text}
                </span>
              ))}
            </div>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MessageIcon size={16} />
            <span>{visibleComments.length} sub tugas</span>
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

        {visibleComments.length > 0 && (
          <div className="thread-comments-preview">
            {visibleComments.slice(0, 2).map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                threadId={thread.id}
                statuses={statuses || []}
                threadAuthorId={thread.author.id}
              />
            ))}
            {visibleComments.length > 2 && (
              <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                + {visibleComments.length - 2} sub tugas lainnya
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

  // Calculate deadline badge for comment
  const getCommentDeadlineBadge = () => {
    if (!comment.deadline) {
      // Debug: log if deadline is missing
      console.log('[CommentItem] No deadline for comment:', comment.id, comment.content.substring(0, 30))
      return null
    }

    console.log('[CommentItem] Has deadline:', comment.id, comment.deadline)

    const now = getUTCDate()
    const deadlineUTC = new Date(comment.deadline)
    const deadlineJakarta = toJakartaDate(deadlineUTC)
    const nowJakarta = toJakartaDate(now)

    const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
    const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta)

    if (hoursUntilDeadline < 0) {
      return {
        text: 'Lewat',
        color: 'var(--danger)',
        bg: 'var(--danger)20',
      }
    } else if (hoursUntilDeadline < 2) {
      return {
        text: `${hoursUntilDeadline * 60 + differenceInMinutes(deadlineJakarta, nowJakarta) % 60}m`,
        color: 'var(--danger)',
        bg: 'var(--danger)20',
      }
    } else if (hoursUntilDeadline < 24) {
      return {
        text: `${hoursUntilDeadline}j`,
        color: 'var(--danger)',
        bg: 'var(--danger)20',
      }
    } else if (daysUntilDeadline < 3) {
      return {
        text: `${daysUntilDeadline}d`,
        color: 'var(--warning)',
        bg: 'var(--warning)20',
      }
    } else {
      return {
        text: format(deadlineJakarta, 'd MMM', { locale: id }),
        color: 'var(--text-light)',
        bg: 'var(--bg-secondary)',
      }
    }
  }

  const commentDeadlineBadge = getCommentDeadlineBadge()

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
        <div className="comment-author" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', position: 'relative', flexWrap: 'wrap' }}>
          <span>- {comment.author.name}</span>
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
          {commentDeadlineBadge && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: commentDeadlineBadge.color,
              background: commentDeadlineBadge.bg,
            }}>
              <ClockIcon size={12} />
              {commentDeadlineBadge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
