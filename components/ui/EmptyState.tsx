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
        padding: '3rem 1.5rem',
        textAlign: 'center',
        animation: 'fadeInUp 0.5s ease-out',
      }}
    >
      {/* Icon Container */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          position: 'relative',
          animation: 'scaleIn 0.6s ease-out 0.2s backwards',
        }}
      >
        <div
          style={{
            color: colors.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
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
          fontSize: '1.5rem',
          fontWeight: 600,
          color: colors.title,
          margin: '0 0 0.75rem 0',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '1rem',
          color: colors.description,
          margin: '0 0 1.5rem 0',
          maxWidth: '400px',
          lineHeight: 1.6,
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
            minWidth: '160px',
            animation: 'fadeInUp 0.5s ease-out 0.3s backwards',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

