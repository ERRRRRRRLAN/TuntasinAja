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
      })
    } else {
      // Wait for transition to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = 'unset'
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle browser back button
  useBackHandler(isOpen && isVisible && !disabled, onCancel)

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isOpen) {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
    }
  }

  if (!isOpen || !mounted) return null

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
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        className="confirm-dialog-content"
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

