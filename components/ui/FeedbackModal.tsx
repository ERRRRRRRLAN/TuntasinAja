'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [isClosing, setIsClosing] = useState(false)

  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success('Saran dan masukan berhasil dikirim! Terima kasih.')
      setContent('')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengirim saran dan masukan. Silakan coba lagi.')
    },
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Lock body scroll when modal is open (mobile)
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      
      // Trigger animation in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
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
      // Trigger animation out
      setIsClosing(true)
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsClosing(false)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.trim().length < 10) {
      toast.warning('Saran dan masukan harus minimal 10 karakter')
      return
    }

    submitFeedback.mutate({ content: content.trim() })
  }

  if ((!isOpen && !isClosing) || !mounted) return null

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
        transition: isVisible || isClosing
          ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'none',
        pointerEvents: isVisible ? 'auto' : 'none',
        overflowY: 'auto'
      }}
    >
      <div 
        ref={contentRef}
        onClick={handleContentClick}
        className="card feedback-modal-content"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: isVisible ? 1 : 0,
          transform: isVisible 
            ? 'translateY(0) scale(1)' 
            : (isClosing ? 'translateY(20px) scale(0.95)' : 'translateY(20px) scale(0.95)'),
          transition: isVisible || isClosing
            ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none',
        }}
      >
        {/* Header */}
        <div className="feedback-modal-header">
          <div className="feedback-modal-header-top">
            <div className="feedback-modal-header-left">
              <h3>
                Saran dan Masukan
              </h3>
            </div>
            <button
              onClick={onClose}
              className="feedback-modal-close-btn"
              style={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text)',
                padding: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                minWidth: '44px',
                minHeight: '44px',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              aria-label="Tutup"
              disabled={submitFeedback.isLoading}
            >
              <XIconSmall size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="feedback-modal-form">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="feedback-content" style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text)'
            }}>
              Saran dan Masukan <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="feedback-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Masukkan saran dan masukan Anda di sini (minimal 10 karakter)..."
              required
              disabled={submitFeedback.isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--bg-primary)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s',
                minHeight: '150px',
                lineHeight: '1.5'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            />
            <small style={{ 
              display: 'block',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-light)'
            }}>
              Minimal 10 karakter - {content.length} karakter
            </small>
          </div>

          <div className="feedback-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitFeedback.isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitFeedback.isLoading || !content.trim() || content.trim().length < 10}
            >
              {submitFeedback.isLoading ? (
                <>
                  <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                  Mengirim...
                </>
              ) : (
                'Kirim'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

