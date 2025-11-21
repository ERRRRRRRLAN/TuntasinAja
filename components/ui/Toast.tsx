'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for fade out animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!mounted) return null

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const colors = {
    success: {
      bg: '#f0fdf4',
      border: '#86efac',
      text: '#166534',
      icon: '#10b981',
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#b91c1c',
      icon: '#ef4444',
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      icon: '#f59e0b',
    },
    info: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      icon: '#3b82f6',
    },
  }

  const color = colors[type]

  const toastContent = (
    <div
      className={`toast ${isVisible ? 'toast-visible' : ''}`}
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        color: color.text,
      }}
      onClick={onClose}
    >
      <span className="toast-icon" style={{ color: color.icon }}>
        {icons[type]}
      </span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation()
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  )

  return createPortal(toastContent, document.body)
}

