'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'
import { XIconSmall } from './Icons'

interface CompletionStatsModalProps {
  isOpen: boolean
  onClose: () => void
  threadTitle: string
  completedCount: number
  totalCount: number
  completedUsers: Array<{
    id: string
    name: string
  }>
}

export default function CompletionStatsModal({
  isOpen,
  onClose,
  threadTitle,
  completedCount,
  totalCount,
  completedUsers,
}: CompletionStatsModalProps) {
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!isOpen || !mounted) return null

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const modalContent = (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        onClick={handleContentClick}
        className="card completion-stats-modal-content"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              Status Pengerjaan
            </h3>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              wordBreak: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {threadTitle}
            </p>
          </div>
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
              borderRadius: '0.25rem',
              color: 'var(--text-light)',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--text-light)'
            }}
            aria-label="Tutup"
          >
            <XIconSmall size={20} />
          </button>
        </div>

        {/* Stats */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              {completedCount}
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--text-light)'
            }}>
              / {totalCount}
            </span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--text-light)'
            }}>
              siswa
            </span>
          </div>
          
          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--bg-secondary)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--text-light)'
          }}>
            {percentage}% siswa telah menyelesaikan
          </p>
        </div>

        {/* Users List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.5rem',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            Daftar Siswa yang Sudah Selesai ({completedUsers.length})
          </h4>
          
          {completedUsers.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: 'var(--text-light)',
              padding: '2rem 0',
              fontSize: '0.875rem'
            }}>
              Belum ada siswa yang menyelesaikan tugas ini
            </p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {completedUsers.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'background 0.2s'
                  }}
                >
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                    flex: 1,
                    wordBreak: 'break-word'
                  }}>
                    {user.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

