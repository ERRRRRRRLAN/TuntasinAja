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
  const [isClosing, setIsClosing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Prevent flicker by using pointer-events
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = 'auto'
      }
    } else {
      // Start exit animation
      setIsClosing(true)
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = 'none'
      }
      const timer = setTimeout(() => {
        setIsClosing(false)
      }, 300) // Match animation duration
      timeoutRef.current = timer
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

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
      className={`quickview-confirm-dialog-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`quickview-confirm-dialog-content ${isClosing ? 'closing' : ''}`}
        onClick={handleContentClick}
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

