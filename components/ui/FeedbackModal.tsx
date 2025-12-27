'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'
import { XIconSmall } from './Icons'
import { trpc } from '@/lib/trpc'
import { toast } from './ToastContainer'
import LoadingSpinner from './LoadingSpinner'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackModal({
  isOpen,
  onClose,
}: FeedbackModalProps) {
  const [content, setContent] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    
    // Wait for transition to complete before closing
    setTimeout(() => {
      onClose()
    }, 300) // Match transition duration
  }, [onClose])

  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success('Saran dan masukan berhasil dikirim! Terima kasih.', 3000)
      setContent('')
      handleClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengirim saran dan masukan. Silakan coba lagi.', 5000)
    },
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true)
      // Lock body scroll when modal is open (mobile)
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      
      // Trigger animation in
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
      
      return () => {
        // Unlock body scroll when modal is closed
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    } else {
      setIsModalOpen(false)
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

  useBackHandler(shouldHandleBack, handleClose)

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.trim().length < 10) {
      toast.error('Saran dan masukan harus minimal 10 karakter', 3000)
      return
    }

    submitFeedback.mutate({ content: content.trim() })
  }

  if (!isModalOpen || !mounted) return null

  const modalContent = (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="feedback-modal-overlay"
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
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
        overflowY: 'auto'
      }}
    >
      <div 
        ref={contentRef}
        onClick={handleContentClick}
        className="card feedback-modal-content"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Simplified Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text)',
          }}>
            Saran & Masukan
          </h3>
          <button
            onClick={handleClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-light)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              minWidth: '36px',
              minHeight: '36px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-light)'
            }}
            aria-label="Tutup"
            disabled={submitFeedback.isLoading}
          >
            <XIconSmall size={20} />
          </button>
        </div>

        {/* Simplified Form */}
        <div style={{
          padding: '1.5rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            <div>
              <textarea
                id="feedback-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Tulis saran dan masukan Anda di sini..."
                required
                disabled={submitFeedback.isLoading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  fontSize: '0.9375rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  minHeight: '180px',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'var(--card)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
              />
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem',
              }}>
                <small style={{ 
                  fontSize: '0.8125rem',
                  color: content.trim().length < 10 ? 'var(--danger)' : 'var(--text-light)'
                }}>
                  {content.trim().length < 10 
                    ? `Minimal 10 karakter (${content.length}/10)`
                    : `${content.length} karakter`
                  }
                </small>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              marginTop: 'auto',
              paddingTop: '1rem',
            }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitFeedback.isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: submitFeedback.isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  opacity: submitFeedback.isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!submitFeedback.isLoading) {
                    e.currentTarget.style.background = 'var(--border)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitFeedback.isLoading) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitFeedback.isLoading || !content.trim() || content.trim().length < 10}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: (submitFeedback.isLoading || !content.trim() || content.trim().length < 10) 
                    ? 'var(--border)' 
                    : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: (submitFeedback.isLoading || !content.trim() || content.trim().length < 10) 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  if (!submitFeedback.isLoading && content.trim().length >= 10) {
                    e.currentTarget.style.background = 'var(--primary-dark)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitFeedback.isLoading && content.trim().length >= 10) {
                    e.currentTarget.style.background = 'var(--primary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {submitFeedback.isLoading ? (
                  <>
                    <LoadingSpinner size={16} color="white" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  'Kirim'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

