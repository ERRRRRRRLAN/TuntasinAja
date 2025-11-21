'use client'

import { useEffect, useRef } from 'react'

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

  // Prevent flicker by using pointer-events
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.style.pointerEvents = 'auto'
    } else if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = 'none'
    }
  }, [isOpen])

  if (!isOpen) return null

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
    >
      <div 
        className="quickview-confirm-dialog-content"
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

