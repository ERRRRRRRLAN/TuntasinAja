'use client'

import { useEffect, useRef, useState } from 'react'

interface QuickViewConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

// QuickViewConfirmDialog untuk digunakan di dalam quickview (overlay di atas quickview content)
export default function QuickViewConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}: QuickViewConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready before showing
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      // Wait for transition to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isOpen) {
      setIsVisible(false)
    }
  }

  if (!isOpen && !isVisible) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only cancel if clicking directly on the overlay, not on the content
    if (e.target === overlayRef.current) {
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

  return (
    <div 
      ref={overlayRef}
      className="quickview-confirm-dialog-overlay"
      onClick={handleOverlayClick}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        className="quickview-confirm-dialog-content"
        onClick={handleContentClick}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
        }}
      >
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            onClick={handleCancelClick}
            className="btn btn-secondary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="btn btn-primary"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

