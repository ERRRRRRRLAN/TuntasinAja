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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.trim().length < 10) {
      toast.warning('Saran dan masukan harus minimal 10 karakter')
      return
    }

    submitFeedback.mutate({ content: content.trim() })
  }

  if (!isOpen || !mounted) return null

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
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
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
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Saran dan Masukan
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
            disabled={submitFeedback.isLoading}
          >
            <XIconSmall size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
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
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s'
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
              Minimal 10 karakter • {content.length} karakter
            </small>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}>
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

