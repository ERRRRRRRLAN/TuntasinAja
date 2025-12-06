'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean // If true, use btn-danger instead of btn-primary
  disabled?: boolean // If true, disable buttons and prevent closing
}

// ConfirmDialog untuk digunakan di luar quickview (full screen overlay)
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  danger = false,
  disabled = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden'
      // Small delay to ensure DOM is ready before showing
      requestAnimationFrame(() => {
        setIsVisible(true)
        // Stagger animation: show content after overlay starts fading in
        setTimeout(() => {
          setContentVisible(true)
        }, 50)
      })
    } else {
      // Smooth close animation: hide content first with reverse stagger
      // Buttons disappear first, then message, then title, then content, then overlay
      setContentVisible(false)
      // Wait for content animation to complete before hiding overlay
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = 'unset'
      }, 400) // Slightly longer to ensure all animations complete
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle browser back button - hanya aktif ketika dialog benar-benar visible
  // Tambahkan delay kecil untuk memastikan dialog sudah fully rendered
  const [shouldHandleBack, setShouldHandleBack] = useState(false)
  
  useEffect(() => {
    if (isOpen && isVisible && !disabled) {
      // Delay kecil untuk memastikan dialog sudah fully rendered
      const timer = setTimeout(() => {
        setShouldHandleBack(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShouldHandleBack(false)
    }
  }, [isOpen, isVisible, disabled])

  useBackHandler(shouldHandleBack, onCancel)

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isOpen && !isVisible) {
      // Animation complete, safe to cleanup
      document.body.style.overflow = 'unset'
    }
  }

  // Keep dialog in DOM during close animation
  if (!mounted || (!isOpen && !isVisible)) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only cancel if clicking directly on the overlay, not on the content
    // Don't allow closing if disabled (e.g., during loading)
    if (e.target === overlayRef.current && !disabled) {
      onCancel()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    // Prevent clicks inside content from bubbling to overlay
    e.stopPropagation()
  }

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onConfirm()
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCancel()
  }

  const dialogContent = (
    <div 
      ref={overlayRef}
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity: isVisible ? 1 : 0,
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        transition: isVisible
          ? 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'opacity 0.3s cubic-bezier(0.4, 0, 1, 1) 0.2s, backdrop-filter 0.3s cubic-bezier(0.4, 0, 1, 1) 0.2s',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        className="confirm-dialog-content"
        onClick={handleContentClick}
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible 
            ? 'translateY(0) scale(1)' 
            : 'translateY(20px) scale(0.95)',
          transition: contentVisible
            ? 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'opacity 0.3s cubic-bezier(0.4, 0, 1, 1) 0.15s, transform 0.3s cubic-bezier(0.4, 0, 1, 1) 0.15s'
        }}
      >
        <h3 
          className="confirm-dialog-title"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: contentVisible 
              ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
              : 'opacity 0.25s cubic-bezier(0.4, 0, 1, 1) 0s, transform 0.25s cubic-bezier(0.4, 0, 1, 1) 0s'
          }}
        >
          {title}
        </h3>
        <p 
          className="confirm-dialog-message"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: contentVisible 
              ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s'
              : 'opacity 0.25s cubic-bezier(0.4, 0, 1, 1) 0.05s, transform 0.25s cubic-bezier(0.4, 0, 1, 1) 0.05s'
          }}
        >
          {message}
        </p>
        <div 
          className="confirm-dialog-actions"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: contentVisible 
              ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
              : 'opacity 0.25s cubic-bezier(0.4, 0, 1, 1) 0.1s, transform 0.25s cubic-bezier(0.4, 0, 1, 1) 0.1s'
          }}
        >
          <button
            type="button"
            onClick={handleCancelClick}
            className="btn btn-secondary"
            disabled={disabled}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            disabled={disabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogContent, document.body)
}

