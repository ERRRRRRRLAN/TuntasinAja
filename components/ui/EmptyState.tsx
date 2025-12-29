'use client'

import React from 'react'
import { BookIcon, CheckIcon, MessageIcon, SearchIcon } from './Icons'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'search' | 'success' | 'info'
}

/**
 * EmptyState component - Displays a friendly empty state with icon, message, and optional action
 */
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  // Default icons based on variant
  const defaultIcons = {
    default: <BookIcon size={64} />,
    search: <SearchIcon size={64} />,
    success: <CheckIcon size={64} />,
    info: <MessageIcon size={64} />,
  }

  const displayIcon = icon || defaultIcons[variant]

  // Color scheme based on variant
  const colorSchemes = {
    default: {
      icon: 'var(--primary)',
      bg: 'rgba(99, 102, 241, 0.1)',
      title: 'var(--text)',
      description: 'var(--text-light)',
    },
    search: {
      icon: 'var(--secondary)',
      bg: 'rgba(100, 116, 139, 0.1)',
      title: 'var(--text)',
      description: 'var(--text-light)',
    },
    success: {
      icon: 'var(--success)',
      bg: 'rgba(16, 185, 129, 0.1)',
      title: 'var(--text)',
      description: 'var(--text-light)',
    },
    info: {
      icon: 'var(--primary)',
      bg: 'rgba(99, 102, 241, 0.1)',
      title: 'var(--text)',
      description: 'var(--text-light)',
    },
  }

  const colors = colorSchemes[variant]

  return (
    <div
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 5vw, 3rem) clamp(1rem, 4vw, 1.5rem)',
        textAlign: 'center',
        animation: 'fadeInUp 0.5s ease-out',
        width: '100%',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
    >
      {/* Icon Container */}
      <div
        style={{
          width: 'clamp(80px, 20vw, 120px)',
          height: 'clamp(80px, 20vw, 120px)',
          borderRadius: '50%',
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
          position: 'relative',
          animation: 'scaleIn 0.6s ease-out 0.2s backwards',
          flexShrink: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          style={{
            color: colors.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
          }}
        >
          {displayIcon}
        </div>
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(-6px, -1vw, -8px)',
            right: 'clamp(-6px, -1vw, -8px)',
            width: 'clamp(18px, 4vw, 24px)',
            height: 'clamp(18px, 4vw, 24px)',
            borderRadius: '50%',
            background: colors.icon,
            opacity: 0.2,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
          fontWeight: 600,
          color: colors.title,
          margin: '0 auto 0.75rem auto',
          lineHeight: 1.3,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          color: colors.description,
          margin: '0 auto 1.5rem auto',
          maxWidth: 'min(400px, 100%)',
          lineHeight: 1.6,
          width: '100%',
          padding: '0 clamp(0.5rem, 2vw, 1rem)',
          boxSizing: 'border-box',
        }}
      >
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
          style={{
            minWidth: 'clamp(140px, 40vw, 160px)',
            width: 'auto',
            margin: '0 auto',
            animation: 'fadeInUp 0.5s ease-out 0.3s backwards',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

