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
    if (disabled) {
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
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
        {checked && (
          <CheckIcon
            size={size * 0.75}
            style={{
              color: 'white',
              strokeWidth: 3,
              position: 'relative',
              zIndex: 1,
            }}
          />
        )}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: `${size * 0.85}px`,
                height: `${size * 0.85}px`,
                border: `2px solid ${checked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                borderTopColor: checked ? 'white' : 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

