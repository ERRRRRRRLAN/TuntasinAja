'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBackHandler } from '@/hooks/useBackHandler'

interface QuickViewConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
}

// QuickViewConfirmDialog untuk digunakan di dalam quickview (overlay di atas quickview content)
// Menggunakan Portal agar benar-benar floating di tengah layar
export default function QuickViewConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  disabled = false,
}: QuickViewConfirmDialogProps) {
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
      // Immediately show overlay
      setIsVisible(true)
      // Small delay for content to create stagger effect
      const timer = setTimeout(() => {
        setContentVisible(true)
      }, 30) // Reduced delay for faster appearance
      return () => clearTimeout(timer)
    } else {
      // Close animation: hide content first, then overlay
      setContentVisible(false)
      // Wait for content to fade out before hiding overlay
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = 'unset'
      }, 300) // Wait for content fade out (300ms)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle browser back button - hanya aktif ketika dialog benar-benar visible
  // Tambahkan delay kecil untuk memastikan dialog sudah fully rendered
  const [shouldHandleBack, setShouldHandleBack] = useState(false)
  
  useEffect(() => {
    if (isOpen && isVisible) {
      // Delay kecil untuk memastikan dialog sudah fully rendered
      const timer = setTimeout(() => {
        setShouldHandleBack(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShouldHandleBack(false)
    }
  }, [isOpen, isVisible])

  useBackHandler(shouldHandleBack, onCancel)

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isOpen && !isVisible) {
      // Animation complete, safe to cleanup
      document.body.style.overflow = 'unset'
    }
  }

  // Keep dialog in DOM during close animation
  // Only unmount when both isOpen is false AND isVisible is false (animation complete)
  if (!mounted) return null
  if (!isOpen && !isVisible) return null

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
      className="quickview-confirm-dialog-overlay"
      onClick={handleOverlayClick}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity: isVisible ? 1 : 0,
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        className="quickview-confirm-dialog-content"
        onClick={handleContentClick}
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible 
            ? 'translateY(0) scale(1)' 
            : 'translateY(20px) scale(0.95)',
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <h3 
          className="confirm-dialog-title quickview-confirm-dialog-title"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: contentVisible
              ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s'
              : 'opacity 0.25s cubic-bezier(0.4, 0, 1, 1), transform 0.25s cubic-bezier(0.4, 0, 1, 1)'
          }}
        >
          {title}
        </h3>
        <p 
          className="confirm-dialog-message quickview-confirm-dialog-message"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: contentVisible
              ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
              : 'opacity 0.25s cubic-bezier(0.4, 0, 1, 1), transform 0.25s cubic-bezier(0.4, 0, 1, 1)'
          }}
        >
          {message}
        </p>
        <div 
          className="confirm-dialog-actions quickview-confirm-dialog-actions"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: contentVisible
              ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.15s'
              : 'opacity 0.25s cubic-bezier(0.4, 0, 1, 1), transform 0.25s cubic-bezier(0.4, 0, 1, 1)'
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
            className="btn btn-primary"
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

