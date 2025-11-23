'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden'
    } else {
      // Start exit animation
      setIsClosing(true)
      const timer = setTimeout(() => {
        setIsClosing(false)
        document.body.style.overflow = 'unset'
      }, 300) // Match animation duration
      timeoutRef.current = timer
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
      className={`confirm-dialog-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`confirm-dialog-content ${isClosing ? 'closing' : ''}`}
        onClick={handleContentClick}
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
