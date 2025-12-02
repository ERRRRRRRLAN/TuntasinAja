'use client'

import { useEffect, useState } from 'react'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showMessage, setShowMessage] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Show message briefly when coming back online
      if (wasOffline) {
        setShowMessage(true)
        setTimeout(() => {
          setShowMessage(false)
        }, 3000) // Hide after 3 seconds
      }
      setWasOffline(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowMessage(true)
      setWasOffline(true)
    }

    // Check initial status
    if (typeof window !== 'undefined') {
      const initialOnline = navigator.onLine
      setIsOnline(initialOnline)
      if (!initialOnline) {
        setShowMessage(true)
        setWasOffline(true)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  if (!showMessage) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: isOnline ? '#d1fae5' : '#fef3c7',
      color: isOnline ? '#065f46' : '#92400e',
      padding: '0.75rem 1rem',
      textAlign: 'center',
      zIndex: 9999,
      borderBottom: `1px solid ${isOnline ? '#10b981' : '#fbbf24'}`,
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}>
      {isOnline ? (
        <span>✓ Koneksi internet tersedia</span>
      ) : (
        <span>⚠ Tidak ada koneksi internet</span>
      )}
    </div>
  )
}

