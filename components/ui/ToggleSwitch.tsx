'use client'

import { useState } from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  isLoading?: boolean
  size?: 'small' | 'medium' | 'large'
  label?: string
  description?: string
}

export default function ToggleSwitch({
  checked,
  onChange,
  onClick,
  disabled = false,
  isLoading = false,
  size = 'medium',
  label,
  description,
}: ToggleSwitchProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizes = {
    small: { width: 36, height: 20, circle: 16 },
    medium: { width: 44, height: 24, circle: 20 },
    large: { width: 52, height: 28, circle: 24 },
  }

  const sizeConfig = sizes[size]

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isLoading) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onClick) {
      onClick(e)
    } else if (onChange) {
      onChange(!checked)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
      }}
      onClick={handleClick}
      onMouseEnter={() => !disabled && !isLoading && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: 'relative',
          width: `${sizeConfig.width}px`,
          height: `${sizeConfig.height}px`,
          borderRadius: `${sizeConfig.height / 2}px`,
          background: checked ? 'var(--primary)' : 'var(--bg-secondary)',
          border: `2px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
          transition: 'all 0.3s ease',
          flexShrink: 0,
          boxShadow: isHovered && !disabled
            ? checked
              ? '0 2px 8px rgba(99, 102, 241, 0.4)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)'
            : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? `${sizeConfig.width - sizeConfig.circle - 2}px` : '2px',
            width: `${sizeConfig.circle - 4}px`,
            height: `${sizeConfig.circle - 4}px`,
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.3s ease, transform 0.2s ease',
            transform: isHovered && !disabled ? 'scale(1.1)' : 'scale(1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${sizeConfig.circle * 0.4}px`,
              height: `${sizeConfig.circle * 0.4}px`,
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        )}
      </div>
      {(label || description) && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {label && (
            <div
              style={{
                fontWeight: 500,
                fontSize: size === 'large' ? '1rem' : '0.95rem',
                color: 'var(--text)',
                marginBottom: description ? '0.25rem' : 0,
              }}
            >
              {label}
            </div>
          )}
          {description && (
            <div
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-light)',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

