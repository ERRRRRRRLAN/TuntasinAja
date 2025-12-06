'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function NetworkErrorHandler() {
  const [hasNetworkError, setHasNetworkError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const queryClient = useQueryClient()

  const handleReload = useCallback(() => {
    // Clear all caches
    queryClient.clear()
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
    }
    
    // Reload page
    window.location.reload()
  }, [queryClient])

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    setHasNetworkError(false)
    setErrorMessage(null)
    
    // Retry all queries
    queryClient.refetchQueries()
  }, [queryClient])

  useEffect(() => {
    // Listen for unhandled promise rejections (network errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      const errorMessage = error?.message || error?.toString() || ''
      
      const isNetworkError = 
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('ERR_FAILED') ||
        error?.name === 'NetworkError' ||
        error?.name === 'TypeError'

      if (isNetworkError) {
        console.error('[NetworkErrorHandler] Network error detected:', error)
        setHasNetworkError(true)
        setErrorMessage(errorMessage)
        setRetryCount(0)
        
        // Prevent default error handling
        event.preventDefault()
      }
    }

    // Listen for fetch errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Check if response is ok
        if (!response.ok && response.status >= 500) {
          // Server error - might be network related
          const error = new Error(`Server error: ${response.status}`)
          throw error
        }
        
        return response
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || ''
        
        const isNetworkError = 
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('ERR_FAILED') ||
          error?.name === 'NetworkError' ||
          error?.name === 'TypeError'

        if (isNetworkError) {
          console.error('[NetworkErrorHandler] Fetch network error:', error)
          setHasNetworkError(true)
          setErrorMessage(errorMessage)
          setRetryCount(0)
        }
        
        throw error
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.fetch = originalFetch
    }
  }, [])

  // Auto reload after 3 seconds if network error
  useEffect(() => {
    if (hasNetworkError && retryCount === 0) {
      setCountdown(3)
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Auto reload timer
      const reloadTimer = setTimeout(() => {
        console.log('[NetworkErrorHandler] Auto reloading due to network error...')
        handleReload()
      }, 3000) // 3 seconds delay

      return () => {
        clearTimeout(reloadTimer)
        clearInterval(countdownInterval)
      }
    }
  }, [hasNetworkError, retryCount, handleReload])

  if (!hasNetworkError) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
        }}>
          ⚠️
        </div>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: '#1f2937',
        }}>
          Koneksi Gagal
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          marginBottom: '1.5rem',
          lineHeight: 1.5,
        }}>
          Terjadi kesalahan saat menghubungkan ke server. Aplikasi akan dimuat ulang otomatis dalam beberapa detik.
        </p>
        {errorMessage && (
          <p style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            marginBottom: '1.5rem',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
          }}>
            {errorMessage}
          </p>
        )}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4f46e5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366f1'
            }}
          >
            Coba Lagi
          </button>
          <button
            onClick={handleReload}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}
          >
            Muat Ulang
          </button>
        </div>
        {retryCount === 0 && countdown > 0 && (
          <p style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            marginTop: '1rem',
          }}>
            Auto reload dalam {countdown} detik...
          </p>
        )}
      </div>
    </div>
  )
}

