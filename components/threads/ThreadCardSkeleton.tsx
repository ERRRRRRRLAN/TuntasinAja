'use client'

import React from 'react'
import Skeleton, { SkeletonText } from '@/components/ui/Skeleton'

/**
 * Skeleton loading component for ThreadCard
 * Shows placeholder structure while thread data is loading
 */
export default function ThreadCardSkeleton() {
  return (
    <div
      className="thread-card"
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
        {/* Checkbox placeholder */}
        <Skeleton width={28} height={28} borderRadius="0.25rem" />
        
        {/* Title and meta */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton height="1.25rem" width="60%" />
          <Skeleton height="0.875rem" width="40%" />
        </div>
      </div>

      {/* Content */}
      <SkeletonText lines={2} />

      {/* Meta info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Skeleton height="1rem" width="5rem" />
        <Skeleton height="1rem" width="6rem" />
        <Skeleton height="1rem" width="4rem" />
      </div>

      {/* Comments preview */}
      <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <Skeleton height="0.875rem" width="30%" style={{ marginBottom: '0.5rem' }} />
        <SkeletonText lines={1} />
      </div>
    </div>
  )
}

