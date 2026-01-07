'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from './Icons'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface NotificationPopupProps {
  message: string
  type?: NotificationType
  duration?: number
  onClose: () => void
}

export default function NotificationPopup({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}: NotificationPopupProps) {
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
    // Open animation
    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden'
    setIsVisible(true)
    const timer = setTimeout(() => {
      setContentVisible(true)
    }, 30)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        // Close animation: reverse of open
        setContentVisible(false)
        // Wait for animation to complete before hiding overlay and calling onClose
        const closeTimer = setTimeout(() => {
          setIsVisible(false)
          document.body.style.overflow = 'unset'
          onClose()
        }, 330) // 300ms (content fade) + 30ms buffer
        return () => clearTimeout(closeTimer)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      setContentVisible(false)
      setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = 'unset'
        onClose()
      }, 330)
    }
  }

  if (!mounted) return null

  const icons = {
    success: <CheckIcon size={24} />,
    error: <XIcon size={24} />,
    warning: <AlertTriangleIcon size={24} />,
    info: <InfoIcon size={24} />,
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

  const popupContent = (
    <div 
      ref={overlayRef}
      className="notification-popup-overlay"
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
        zIndex: 3000,
        opacity: isVisible ? 1 : 0,
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        transition: isVisible
          ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.18s, backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.18s',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div 
        ref={contentRef}
        className="notification-popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: color.bg,
          border: `2px solid ${color.border}`,
          borderRadius: '1rem',
          padding: '1.5rem 2rem',
          width: 'auto',
          minWidth: '280px',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: contentVisible
            ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.03s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.03s'
            : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div 
          style={{
            color: color.icon,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {icons[type]}
        </div>
        <p 
          style={{
            margin: 0,
            color: color.text,
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
            flex: 1,
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  )

  return createPortal(popupContent, document.body)
}

