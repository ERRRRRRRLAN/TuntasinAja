'use client'

import React, { useState, useRef, useEffect } from 'react'

interface RippleEffectProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

/**
 * RippleEffect component - Adds ripple animation on click
 */
export default function RippleEffect({ 
  children, 
  className = '', 
  disabled = false 
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const rippleIdRef = useRef(0)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = {
      x,
      y,
      id: rippleIdRef.current++,
    }

    setRipples((prev) => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'scale(0)',
            animation: 'ripple 0.6s ease-out',
            width: '100px',
            height: '100px',
            left: ripple.x - 50,
            top: ripple.y - 50,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}

