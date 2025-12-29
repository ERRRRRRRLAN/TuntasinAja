'use client'

import { useState } from 'react'
import { CheckIcon } from './Icons'

interface CheckboxProps {
  checked: boolean
  onChange?: () => void
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  isLoading?: boolean
  size?: number
  className?: string
}

export default function Checkbox({
  checked,
  onChange,
  onClick,
  disabled = false,
  isLoading = false,
  size = 18,
  className = '',
}: CheckboxProps) {
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
      className={`custom-checkbox ${className}`}
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
          borderRadius: '0.25rem',
          border: `2px solid ${checked ? 'var(--primary)' : isHovered ? 'var(--primary)' : 'var(--border)'}`,
          background: checked ? 'var(--primary)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        {isLoading ? (
          <div
            style={{
              width: `${size * 0.5}px`,
              height: `${size * 0.5}px`,
              border: '2px solid var(--primary)',
              borderTopColor: 'transparent',
              borderRadius: '0.125rem',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        ) : checked ? (
          <CheckIcon size={size * 0.7} style={{ color: 'white', strokeWidth: 3 }} />
        ) : null}
      </div>
    </div>
  )
}

