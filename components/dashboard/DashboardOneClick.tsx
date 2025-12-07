'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { trpc } from '@/lib/trpc'
import { toJakartaDate, getUTCDate } from '@/lib/date-utils'
import { differenceInHours, differenceInDays, differenceInMinutes } from 'date-fns'
import Checkbox from '@/components/ui/Checkbox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/ToastContainer'
import { ClockIcon, MessageIcon } from '@/components/ui/Icons'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function DashboardOneClick() {
  const { data: session } = useSession()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  // Get today's tasks
  const { data: todayData, isLoading, refetch } = trpc.thread.getTodayTasks.useQuery(
    undefined,
    {
      enabled: !!session,
      refetchInterval: (query) => {
        if (typeof document !== 'undefined' && document.hidden) {
          return false
        }
        return 10000 // Refetch every 10 seconds
      },
      refetchOnWindowFocus: true,
    }
  )

  const threads = todayData?.threads || []
  const utils = trpc.useUtils()

  // Toggle thread completion
  const toggleThread = trpc.userStatus.toggleThread.useMutation({
    onSuccess: async () => {
      setShowConfirmDialog(false)
      setIsCompleting(false)
      // Invalidate and refetch
      await Promise.all([
        utils.thread.getTodayTasks.invalidate(),
        utils.thread.getAll.invalidate(),
        utils.userStatus.getUncompletedCount.invalidate(),
        utils.history.getUserHistory.invalidate(),
      ])
      await refetch()
      toast.success('Tugas berhasil dicentang!')
    },
    onError: (error: any) => {
      console.error('Error toggling thread:', error)
      toast.error('Gagal mengubah status tugas. Silakan coba lagi.')
      setIsCompleting(false)
      setShowConfirmDialog(false)
    },
  })

  const handleQuickCheck = (threadId: string, isCompleted: boolean) => {
    if (isCompleted) {
      // Uncheck directly without confirmation
      toggleThread.mutate({
        threadId,
        isCompleted: false,
      })
    } else {
      // Check with confirmation
      setSelectedThreadId(threadId)
      setShowConfirmDialog(true)
    }
  }

  const handleConfirmCheck = () => {
    if (selectedThreadId) {
      setIsCompleting(true)
      toggleThread.mutate({
        threadId: selectedThreadId,
        isCompleted: true,
      })
    }
  }

  // Get deadline badge
  const getDeadlineBadge = (deadline?: Date | null) => {
    if (!deadline) return null

    const now = getUTCDate()
    const deadlineUTC = new Date(deadline)
    const deadlineJakarta = toJakartaDate(deadlineUTC)
    const nowJakarta = toJakartaDate(now)

    const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
    const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta)
    const minutesUntilDeadline = differenceInMinutes(deadlineJakarta, nowJakarta)

    if (hoursUntilDeadline < 0) {
      return {
        text: 'Lewat',
        color: 'var(--danger)',
        bg: 'var(--danger)20',
        priority: 3, // Highest priority
      }
    } else if (hoursUntilDeadline < 2) {
      return {
        text: `${minutesUntilDeadline}m`,
        color: 'var(--danger)',
        bg: 'var(--danger)20',
        priority: 3,
      }
    } else if (hoursUntilDeadline < 24) {
      return {
        text: `${hoursUntilDeadline}j`,
        color: 'var(--danger)',
        bg: 'var(--danger)20',
        priority: 2,
      }
    } else if (daysUntilDeadline < 3) {
      return {
        text: `${daysUntilDeadline}d`,
        color: 'var(--warning)',
        bg: 'var(--warning)20',
        priority: 1,
      }
    } else {
      return {
        text: format(deadlineJakarta, 'd MMM', { locale: id }),
        color: 'var(--text-light)',
        bg: 'var(--bg-secondary)',
        priority: 0,
      }
    }
  }

  // Sort threads by priority (deadline urgency) and completion status
  const sortedThreads = [...threads].sort((a, b) => {
    // Uncompleted first
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    
    // Then by deadline priority
    const badgeA = getDeadlineBadge(a.deadline)
    const badgeB = getDeadlineBadge(b.deadline)
    
    if (badgeA && badgeB) {
      if (badgeA.priority !== badgeB.priority) {
        return badgeB.priority - badgeA.priority // Higher priority first
      }
    } else if (badgeA && !badgeB) {
      return -1 // A has deadline, B doesn't
    } else if (!badgeA && badgeB) {
      return 1 // B has deadline, A doesn't
    }
    
    // Finally by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '2rem',
        minHeight: '200px'
      }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-light)',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          margin: '0 auto 1rem',
          borderRadius: '50%',
          background: 'var(--success)20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          ✓
        </div>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
          Tidak ada tugas hari ini! 🎉
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
          Semua tugas sudah selesai atau belum ada tugas yang dibuat hari ini.
        </p>
      </div>
    )
  }

  const selectedThread = threads.find(t => t.id === selectedThreadId)

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: 600,
          color: 'var(--text)',
        }}>
          Tugas Hari Ini
        </h2>
        <span style={{
          fontSize: '0.875rem',
          color: 'var(--text-light)',
          background: 'var(--bg-secondary)',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontWeight: 500,
        }}>
          {threads.length} tugas
        </span>
      </div>

      <div style={{
        display: 'grid',
        gap: '0.75rem',
      }}>
        {sortedThreads.map((thread) => {
          const deadlineBadge = getDeadlineBadge(thread.deadline)
          const isCompleted = thread.isCompleted || false

          return (
            <div
              key={thread.id}
              style={{
                background: isCompleted ? 'var(--bg-secondary)' : 'var(--bg)',
                border: `1px solid ${isCompleted ? 'var(--border)' : 'var(--border)'}`,
                borderRadius: '0.75rem',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                transition: 'all 0.2s',
                opacity: isCompleted ? 0.7 : 1,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isCompleted) {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isCompleted ? 'var(--bg-secondary)' : 'var(--bg)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              onClick={() => {
                // Quick check on click (if not already completing)
                if (!isCompleting && !toggleThread.isLoading) {
                  handleQuickCheck(thread.id, isCompleted)
                }
              }}
            >
              {/* Checkbox */}
              <div style={{ marginTop: '0.125rem' }}>
                <Checkbox
                  checked={isCompleted}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isCompleting && !toggleThread.isLoading) {
                      handleQuickCheck(thread.id, isCompleted)
                    }
                  }}
                  isLoading={toggleThread.isLoading && selectedThreadId === thread.id}
                  disabled={toggleThread.isLoading}
                  size={24}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: isCompleted ? 'var(--text-light)' : 'var(--text)',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    flex: 1,
                    lineHeight: 1.4,
                  }}>
                    {thread.title}
                  </h3>
                  
                  {deadlineBadge && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: deadlineBadge.color,
                      background: deadlineBadge.bg,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      <ClockIcon size={12} />
                      {deadlineBadge.text}
                    </span>
                  )}
                </div>

                {/* Meta info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  fontSize: '0.875rem',
                  color: 'var(--text-light)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MessageIcon size={14} />
                    {thread.totalComments} sub tugas
                    {thread.completedComments > 0 && (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        ({thread.completedComments} selesai)
                      </span>
                    )}
                  </span>
                  
                  {thread.author && (
                    <span>
                      oleh {thread.author.name}
                    </span>
                  )}
                </div>

                {/* Progress bar for comments */}
                {thread.totalComments > 0 && (
                  <div style={{
                    marginTop: '0.5rem',
                    height: '4px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(thread.completedComments / thread.totalComments) * 100}%`,
                      background: thread.allCommentsCompleted 
                        ? 'var(--success)' 
                        : 'var(--primary)',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      {selectedThread && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title="Centang Tugas?"
          message={`Apakah Anda yakin ingin mencentang tugas "${selectedThread.title}"? Semua sub tugas di dalamnya akan otomatis tercentang.`}
          confirmText="Ya, Centang"
          cancelText="Batal"
          onConfirm={handleConfirmCheck}
          onCancel={() => {
            setShowConfirmDialog(false)
            setSelectedThreadId(null)
          }}
        />
      )}
    </div>
  )
}

