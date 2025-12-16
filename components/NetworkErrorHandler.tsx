'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function NetworkErrorHandler() {
  const [hasNetworkError, setHasNetworkError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
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
    // Check for JSON error displayed in body (like {"error":"Network request failed"})
    const checkForJsonError = () => {
      if (typeof document !== 'undefined') {
        // Don't check if React app is already rendered - errors should be handled by React/TRPC
        if (document.getElementById('__next') || document.querySelector('[data-reactroot]') || window.__NEXT_DATA__) {
          return false
        }
        
        const bodyText = document.body?.textContent || ''
        
        // Only check for real network errors, not API errors
        // Must contain specific network error codes, not just "Network request failed"
        if (bodyText.includes('"error"') && 
            (bodyText.includes('ERR_NAME_NOT_RESOLVED') || 
             bodyText.includes('ERR_FAILED') ||
             bodyText.includes('ERR_INTERNET_DISCONNECTED'))) {
          try {
            // Try to parse JSON from body
            const jsonMatch = bodyText.match(/\{[^}]*"error"[^}]*\}/)
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0])
              if (errorData.error && 
                  (errorData.error.includes('ERR_NAME_NOT_RESOLVED') ||
                   errorData.error.includes('ERR_FAILED') ||
                   errorData.error.includes('ERR_INTERNET_DISCONNECTED'))) {
                console.error('[NetworkErrorHandler] JSON error detected in body:', errorData)
                setHasNetworkError(true)
                setErrorMessage(errorData.error)
                setRetryCount(0)
                // Clear the error from body
                document.body.innerHTML = ''
                return true
              }
            }
          } catch (e) {
            // If parsing fails, just check for the error text
            if (bodyText.includes('ERR_NAME_NOT_RESOLVED') || 
                bodyText.includes('ERR_FAILED') ||
                bodyText.includes('ERR_INTERNET_DISCONNECTED')) {
              console.error('[NetworkErrorHandler] Network error text detected in body')
              setHasNetworkError(true)
              setErrorMessage('Network connection failed')
              setRetryCount(0)
              document.body.innerHTML = ''
              return true
            }
          }
        }
      }
      return false
    }

    // Initial check
    if (checkForJsonError()) {
      return
    }

    // Track handled errors to avoid false positives
    const handledErrors = new WeakSet()
    
    // Listen for unhandled promise rejections (network errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // Skip if this error was already handled
      if (handledErrors.has(error)) {
        return
      }
      
      // Skip if React app is already rendered (errors should be handled by React/TRPC)
      if (document.getElementById('__next') || document.querySelector('[data-reactroot]') || window.__NEXT_DATA__) {
        // Only handle errors if they're from initial page load or critical failures
        // Check if error is from a mutation/query that should be handled by TRPC
        const errorMessage = error?.message || error?.toString() || ''
        
        // If error contains TRPC-specific patterns, it's likely already handled
        if (errorMessage.includes('TRPC') || 
            errorMessage.includes('UNAUTHORIZED') ||
            errorMessage.includes('FORBIDDEN') ||
            errorMessage.includes('BAD_REQUEST') ||
            errorMessage.includes('NOT_FOUND')) {
          return
        }
      }
      
      const errorMessage = error?.message || error?.toString() || ''
      
      // Also check if error is a JSON object
      let jsonError = null
      try {
        if (typeof error === 'object' && error !== null) {
          const errorStr = JSON.stringify(error)
          if (errorStr.includes('Network request failed')) {
            jsonError = error
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      // Only treat as network error if it's a real network failure
      // Not errors from mutations/queries that are handled by TRPC
      const isNetworkError = 
        (errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
         errorMessage.includes('ERR_FAILED') ||
         errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
         errorMessage.includes('ERR_NETWORK_CHANGED')) &&
        !errorMessage.includes('TRPC') &&
        !errorMessage.includes('UNAUTHORIZED') &&
        !errorMessage.includes('FORBIDDEN') &&
        !errorMessage.includes('BAD_REQUEST')

      if (isNetworkError) {
        console.error('[NetworkErrorHandler] Network error detected:', error)
        setHasNetworkError(true)
        setErrorMessage(jsonError?.error || errorMessage)
        setRetryCount(0)
        
        // Mark as handled
        handledErrors.add(error)
        
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
        if (!response.ok) {
          // Try to parse error response body
          try {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.clone().json()
              
              // Check if error message contains network error
              const errorText = JSON.stringify(errorData)
              if (errorText.includes('Network request failed') || 
                  errorText.includes('Failed to fetch') ||
                  errorData?.error?.includes('Network request failed')) {
                console.error('[NetworkErrorHandler] Network error in response:', errorData)
                setHasNetworkError(true)
                setErrorMessage(errorData?.error || 'Network request failed')
                setRetryCount(0)
                // Don't throw, let the error handler show the UI
                return response
              }
            }
          } catch (parseError) {
            // If parsing fails, continue with normal error handling
          }
          
          // Server error - might be network related
          if (response.status >= 500) {
            const error = new Error(`Server error: ${response.status}`)
            throw error
          }
        }
        
        return response
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || ''
        
        // Only handle real network errors, not errors from API responses
        // API errors (4xx, 5xx) should be handled by the calling code
        const isNetworkError = 
          (errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
           errorMessage.includes('ERR_FAILED') ||
           errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
           errorMessage.includes('ERR_NETWORK_CHANGED')) &&
          !errorMessage.includes('TRPC') &&
          !errorMessage.includes('HTTP 4') &&
          !errorMessage.includes('HTTP 5')

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

    // Monitor body changes for JSON errors
    const observer = new MutationObserver(() => {
      checkForJsonError()
    })

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      })
    }

    // Periodic check as fallback
    const checkInterval = setInterval(() => {
      checkForJsonError()
    }, 1000)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.fetch = originalFetch
      observer.disconnect()
      clearInterval(checkInterval)
    }
  }, [])


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
          Terjadi kesalahan saat menghubungkan ke server. Pastikan koneksi internet Anda aktif, lalu klik tombol "Muat Ulang Aplikasi" di bawah.
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
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <button
            onClick={handleReload}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}
          >
            🔄 Muat Ulang Aplikasi
          </button>
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
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4f46e5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366f1'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = '#4f46e5'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = '#6366f1'
            }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  )
}

