'use client'

import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Skeleton loading component
 * Provides a shimmer effect for loading states
 */
export default function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  className = '',
  style = {},
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/**
 * Skeleton text component
 * Multiple lines of skeleton text
 */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton card component
 * For card-like loading states
 */
export function SkeletonCard({
  className = '',
}: {
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <Skeleton height="1.25rem" width="60%" />
      <SkeletonText lines={2} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Skeleton height="1.5rem" width="4rem" />
        <Skeleton height="1.5rem" width="4rem" />
      </div>
    </div>
  )
}

