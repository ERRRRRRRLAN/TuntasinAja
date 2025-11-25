'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { BellIcon, XIcon, CalendarIcon, BookIcon, AlertCircleIcon } from '../ui/Icons'

interface ScheduleReminderModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: string[]
  tasks: Array<{
    threadId: string
    threadTitle: string
    authorName: string
    createdAt: Date
  }>
  tomorrowDate: Date | null
  onTaskClick?: (threadId: string) => void
}

export default function ScheduleReminderModal({
  isOpen,
  onClose,
  subjects,
  tasks,
  tomorrowDate,
  onTaskClick,
}: ScheduleReminderModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setIsVisible(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
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

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target === overlayRef.current && !isOpen) {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
    }
  }

  if (!mounted) return null
  if (!isOpen && !isVisible) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleTaskClick = (threadId: string) => {
    if (onTaskClick) {
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
              Pengingat Tugas Besok
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

        {tomorrowDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            border: '1px solid var(--border)',
          }}>
            <CalendarIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Besok: {format(tomorrowDate, 'EEEE, d MMMM yyyy', { locale: id })}
            </span>
          </div>
        )}

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
          <AlertCircleIcon size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.125rem' }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: 'var(--text-primary)' }}>
              Ada pelajaran besok:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {subjects.map((subject) => (
                <span
                  key={subject}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.375rem 0.75rem',
                    background: 'var(--card)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    border: '1px solid var(--border)',
                  }}
                >
                  <BookIcon size={14} style={{ color: 'var(--text-light)' }} />
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="confirm-dialog-message" style={{ margin: 0 }}>
              Tidak ada tugas yang belum selesai untuk pelajaran besok. Bagus!
            </p>
          </div>
        ) : (
          <>
            <p style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              fontWeight: 500
            }}>
              Tugas yang belum selesai ({tasks.length}):
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
            }}>
              {tasks.map((task) => (
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
                    if (onTaskClick) {
                      e.currentTarget.style.background = 'var(--card)'
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onTaskClick) {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <BookIcon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    {task.threadTitle}
                    {onTaskClick && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--primary)',
                        fontWeight: 400,
                        marginLeft: 'auto',
                      }}>
                        (Klik untuk detail)
                      </span>
                    )}
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    color: 'var(--text-light)' 
                  }}>
                    Oleh: {task.authorName}
                  </p>
                </div>
              ))}
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

