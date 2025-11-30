'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { trpc } from '@/lib/trpc'
import { toast } from './ToastContainer'
import LoadingSpinner from './LoadingSpinner'
import { CalendarIcon, UserIcon, CheckIcon, XIcon, BellIcon, AlertCircleIcon, InfoIcon } from './Icons'

interface OverdueTask {
  threadId: string
  threadTitle: string
  threadDate: Date
  authorName: string
  daysOverdue: number
}

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  overdueTasks: OverdueTask[]
  onTasksUpdated?: () => void
  onTaskClick?: (threadId: string) => void
}

export default function ReminderModal({
  isOpen,
  onClose,
  overdueTasks: initialOverdueTasks,
  onTasksUpdated,
  onTaskClick,
}: ReminderModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set())

  const utils = trpc.useUtils()
  const { data: updatedOverdueData, refetch: refetchOverdue } = trpc.userStatus.getOverdueTasks.useQuery(
    undefined,
    {
      enabled: isOpen && initialOverdueTasks.length > 0,
    }
  )

  const overdueTasks = updatedOverdueData?.overdueTasks || initialOverdueTasks

  const toggleThreadMutation = trpc.userStatus.toggleThread.useMutation({
    onSuccess: async () => {
      utils.userStatus.getUncompletedCount.invalidate()
      utils.thread.getAll.invalidate()
      toast.success('Tugas berhasil ditandai sebagai selesai!')
      
      // Refetch overdue tasks to update the list
      const result = await refetchOverdue()
      
      // If no more overdue tasks, close modal after a short delay
      if (result.data?.overdueTasks.length === 0) {
        if (onTasksUpdated) {
          onTasksUpdated()
        }
        setTimeout(() => {
          onClose()
        }, 1000)
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    },
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden'
      // Reset isVisible to false first, then set to true after a small delay
      // This ensures the open animation plays
      setIsVisible(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      // Don't immediately set isVisible to false
      // Let the transition handle the fade-out animation first
      // isVisible will be set to false in handleTransitionEnd after animation completes
    }
  }, [isOpen])

  // Handle browser back button
  const [shouldHandleBack, setShouldHandleBack] = useState(false)
  
  useEffect(() => {
    if (isOpen && isVisible) {
      const timer = setTimeout(() => {
        setShouldHandleBack(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShouldHandleBack(false)
    }
  }, [isOpen, isVisible])

  useBackHandler(shouldHandleBack, onClose)

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    // Clean up after close animation completes
    if (e.target === overlayRef.current && !isOpen) {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
    }
  }

  // Don't render if not mounted
  if (!mounted) return null
  // Keep rendered during close animation (when isOpen is false but isVisible is still true)
  if (!isOpen && !isVisible) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on the content
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    // Prevent clicks inside content from bubbling to overlay
    e.stopPropagation()
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleMarkComplete = async (threadId: string) => {
    setProcessingTasks((prev) => new Set(prev).add(threadId))
    try {
      await toggleThreadMutation.mutateAsync({
        threadId,
        isCompleted: true,
      })
    } finally {
      setProcessingTasks((prev) => {
        const next = new Set(prev)
        next.delete(threadId)
        return next
      })
    }
  }

  const handleTaskClick = (threadId: string) => {
    if (onTaskClick && !processingTasks.has(threadId)) {
      onTaskClick(threadId)
      onClose()
    }
  }

  const dialogContent = (
    <div 
      ref={overlayRef}
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity: (isOpen && isVisible) ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: (isOpen && isVisible) ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        className="confirm-dialog-content"
        onClick={handleContentClick}
        style={{
          opacity: (isOpen && isVisible) ? 1 : 0,
          transform: (isOpen && isVisible) ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BellIcon size={24} style={{ color: 'var(--primary)' }} />
            <h3 className="confirm-dialog-title" style={{ margin: 0 }}>
              Pengingat Tugas
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCloseClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
              borderRadius: '0.25rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
            aria-label="Tutup"
          >
            <XIcon size={20} />
          </button>
        </div>

        {overdueTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              marginBottom: '1rem'
            }}>
              <CheckIcon size={32} style={{ color: 'var(--primary)' }} />
            </div>
            <p className="confirm-dialog-message">
              Tidak ada tugas yang perlu diingatkan. Semua tugas sudah selesai!
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--border)',
            }}>
              <AlertCircleIcon size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '0.125rem' }} />
              <p className="confirm-dialog-message" style={{ margin: 0 }}>
                Ada <strong>{overdueTasks.length}</strong> tugas yang belum selesai selama lebih dari 7 hari. 
                Apakah tugas-tugas ini sudah selesai?
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-light)',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--card)',
              borderRadius: '0.375rem',
            }}>
              <InfoIcon size={14} style={{ color: 'var(--primary)' }} />
              <span>Klik pada tugas untuk melihat detail</span>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
            }}>
              {overdueTasks.map((task) => {
                const isProcessing = processingTasks.has(task.threadId)
                
                return (
                  <div
                    key={task.threadId}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      cursor: onTaskClick ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleTaskClick(task.threadId)}
                    onMouseEnter={(e) => {
                      if (onTaskClick && !isProcessing) {
                        e.currentTarget.style.background = 'var(--card)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (onTaskClick && !isProcessing) {
                        e.currentTarget.style.background = 'var(--bg-secondary)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ 
                        margin: 0, 
                        marginBottom: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        {task.threadTitle}
                        {onTaskClick && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            fontWeight: 400,
                          }}>
                            (Klik untuk detail)
                          </span>
                        )}
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.375rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-light)',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UserIcon size={14} />
                          {task.authorName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CalendarIcon size={14} />
                          {format(new Date(task.threadDate), 'EEEE, d MMMM yyyy', { locale: id })}
                        </span>
                        <span style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: 'var(--danger)',
                          fontWeight: 500,
                        }}>
                          <AlertCircleIcon size={14} />
                          Belum selesai selama {task.daysOverdue} hari
                        </span>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem',
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkComplete(task.threadId)
                        }}
                        disabled={isProcessing}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          padding: '0.625rem 1rem',
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <LoadingSpinner size={16} />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <CheckIcon size={16} />
                            Sudah Selesai
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCloseClick(e)
                        }}
                        disabled={isProcessing}
                        className="btn btn-secondary"
                        style={{
                          flex: 1,
                          fontSize: '0.875rem',
                          padding: '0.625rem 1rem',
                        }}
                      >
                        Belum Selesai
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="confirm-dialog-actions" style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={handleCloseClick}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}
