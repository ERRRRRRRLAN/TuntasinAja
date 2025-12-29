'use client'

import { useState } from 'react'

interface RadioButtonProps {
  checked: boolean
  onChange?: () => void
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  isLoading?: boolean
  size?: number
  className?: string
}

export default function RadioButton({
  checked,
  onChange,
  onClick,
  disabled = false,
  isLoading = false,
  size = 18,
  className = '',
}: RadioButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isLoading) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onClick) {
      onClick(e)
    } else if (onChange) {
      onChange()
    }
  }

  return (
    <div
      className={`custom-radio-button ${className}`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
      }}
      onClick={handleClick}
      onMouseEnter={() => !disabled && !isLoading && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `2px solid ${checked ? 'var(--primary)' : isHovered ? 'var(--primary)' : 'var(--border)'}`,
          background: checked ? 'var(--primary)' : 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
          boxShadow: checked 
            ? '0 2px 4px rgba(99, 102, 241, 0.3)' 
            : isHovered 
            ? '0 2px 4px rgba(99, 102, 241, 0.2)' 
            : '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
      >
        {isLoading ? (
          <div
            style={{
              width: `${size * 0.4}px`,
              height: `${size * 0.4}px`,
              border: '2px solid var(--primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        ) : checked ? (
          <div
            style={{
              width: `${size * 0.4}px`,
              height: `${size * 0.4}px`,
              borderRadius: '50%',
              background: 'white',
              transition: 'all 0.2s ease',
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

