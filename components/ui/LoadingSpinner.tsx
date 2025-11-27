'use client'

import { CSSProperties } from 'react'

interface LoadingSpinnerProps {
  size?: number
  color?: string
  className?: string
  style?: CSSProperties
}

export default function LoadingSpinner({ 
  size = 24, 
  color = 'var(--primary)',
  className = '',
  style = {}
}: LoadingSpinnerProps) {
  return (
    <div 
      className={className}
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        border: `3px solid ${color}20`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        ...style
      }}
      aria-label="Loading"
    />
  )
}

