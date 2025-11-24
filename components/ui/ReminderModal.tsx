'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { trpc } from '@/lib/trpc'
import { toast } from './ToastContainer'
import LoadingSpinner from './LoadingSpinner'
import { CalendarIcon, UserIcon, CheckIcon, XIcon } from './Icons'

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
}

export default function ReminderModal({
  isOpen,
  onClose,
  overdueTasks: initialOverdueTasks,
  onTasksUpdated,
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

  // Use updated data if available, otherwise use initial data
  const overdueTasks = updatedOverdueData?.overdueTasks || initialOverdueTasks

  const toggleThreadMutation = trpc.userStatus.toggleThread.useMutation({
    onSuccess: async () => {
      utils.userStatus.getUncompletedCount.invalidate()
      utils.thread.getAll.invalidate()
      toast('Tugas berhasil ditandai sebagai selesai!', 'success')
      
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
      toast(`Error: ${error.message}`, 'error')
    },
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = 'unset'
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!isOpen || !mounted) return null

  const dialogContent = (
    <div 
      ref={overlayRef}
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        zIndex: 10000,
      }}
    >
      <div 
        ref={contentRef}
        className="confirm-dialog-content"
        onClick={handleContentClick}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
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
          <h3 className="confirm-dialog-title" style={{ margin: 0 }}>
            ⏰ Pengingat Tugas
          </h3>
          <button
            onClick={onClose}
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
          <p className="confirm-dialog-message" style={{ textAlign: 'center', padding: '2rem' }}>
            Tidak ada tugas yang perlu diingatkan. Semua tugas sudah selesai! 🎉
          </p>
        ) : (
          <>
            <p className="confirm-dialog-message" style={{ marginBottom: '1.5rem' }}>
              Ada {overdueTasks.length} tugas yang belum selesai selama lebih dari 7 hari. 
              Apakah tugas-tugas ini sudah selesai?
            </p>

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
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{ 
                        margin: 0, 
                        marginBottom: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text)',
                      }}>
                        {task.threadTitle}
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-light)',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <UserIcon size={14} />
                          {task.authorName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <CalendarIcon size={14} />
                          {format(new Date(task.threadDate), 'd MMMM yyyy', { locale: id })}
                        </span>
                        <span style={{ 
                          color: 'var(--danger)',
                          fontWeight: 500,
                        }}>
                          ⚠️ Belum selesai selama {task.daysOverdue} hari
                        </span>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem',
                    }}>
                      <button
                        onClick={() => handleMarkComplete(task.threadId)}
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
                        onClick={onClose}
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
            onClick={onClose}
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

