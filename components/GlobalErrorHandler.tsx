'use client'

import { useEffect } from 'react'

/**
 * Global error handler untuk menangkap error yang tidak tertangani oleh ErrorBoundary
 * ErrorBoundary hanya bisa catch error di render, lifecycle methods, dan constructors
 * Tapi tidak bisa catch error di event handlers, async code, atau setTimeout
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', event.reason)
      
      // Prevent default error handling (browser console)
      event.preventDefault()
      
      // Log error details
      const error = event.reason
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      const errorStack = error?.stack || ''
      
      console.error('[GlobalErrorHandler] Error details:', {
        message: errorMessage,
        stack: errorStack,
        error: error,
      })
      
      // Don't show error UI for network errors (they're handled by NetworkErrorHandler)
      const isNetworkError = 
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('ERR_FAILED') ||
        error?.name === 'NetworkError' ||
        error?.name === 'TypeError'
      
      if (isNetworkError) {
        // Network errors are handled by NetworkErrorHandler
        return
      }
      
      // For other errors, we could show a toast or log to error tracking service
      // For now, just log to console
    }

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('[GlobalErrorHandler] Unhandled error:', event.error)
      
      // Prevent default error handling
      event.preventDefault()
      
      // Log error details
      const error = event.error
      const errorMessage = error?.message || event.message || 'Unknown error'
      const errorStack = error?.stack || ''
      
      console.error('[GlobalErrorHandler] Error details:', {
        message: errorMessage,
        stack: errorStack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: error,
      })
      
      // Don't show error UI for network errors
      const isNetworkError = 
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('ERR_FAILED') ||
        error?.name === 'NetworkError' ||
        error?.name === 'TypeError'
      
      if (isNetworkError) {
        return
      }
    }

    // Register handlers
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}

