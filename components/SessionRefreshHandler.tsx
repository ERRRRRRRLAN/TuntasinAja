'use client'

import { useEffect, useRef } from 'react'

/**
 * Component to handle auto reload when app resumes from background
 * This ensures app state is fresh when user returns after being idle
 */
export default function SessionRefreshHandler() {
  const wasHidden = useRef<boolean>(false)
  const hiddenStartTime = useRef<number | null>(null)
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasReloadedRef = useRef<boolean>(false)

  useEffect(() => {
    // Minimum time app was hidden before reloading (30 seconds)
    const MIN_HIDDEN_TIME = 30 * 1000

    // Handle visibility change (when app comes back to foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if app was hidden long enough
        const now = Date.now()
        const hiddenDuration = hiddenStartTime.current 
          ? now - hiddenStartTime.current 
          : 0

        // Check if session cookie exists
        const hasCookie = typeof document !== 'undefined' && document.cookie.split(';').some(cookie => {
          const trimmed = cookie.trim()
          return trimmed.startsWith('next-auth.session-token=') || 
                 trimmed.startsWith('__Secure-next-auth.session-token=')
        })

        // Reload if:
        // 1. App was previously hidden
        // 2. App was hidden for at least MIN_HIDDEN_TIME
        // 3. Session cookie exists (user was logged in)
        // 4. Haven't reloaded yet in this session
        if (
          wasHidden.current && 
          hiddenDuration > MIN_HIDDEN_TIME &&
          hasCookie &&
          !hasReloadedRef.current
        ) {
          // Clear any pending reload
          if (reloadTimeoutRef.current) {
            clearTimeout(reloadTimeoutRef.current)
          }

          console.log('[SessionRefreshHandler] App resumed after being hidden, reloading page...', {
            hiddenDuration: Math.round(hiddenDuration / 1000) + 's',
            hasCookie
          })

          // Mark as reloaded to prevent multiple reloads
          hasReloadedRef.current = true

          // Small delay to ensure visibility change is complete
          reloadTimeoutRef.current = setTimeout(() => {
            // Clear caches before reload
            if (typeof window !== 'undefined') {
              // Clear sessionStorage
              sessionStorage.clear()
              
              // Reload page
              window.location.reload()
            }
          }, 500) // 500ms delay
        }
        
        wasHidden.current = false
        hiddenStartTime.current = null
      } else if (document.visibilityState === 'hidden') {
        // Mark that app was hidden and record time
        wasHidden.current = true
        hiddenStartTime.current = Date.now()
        
        // Reset reload flag when app goes to background
        // This allows reload on next resume
        hasReloadedRef.current = false
        
        // Clear any pending reload when app goes to background
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current)
          reloadTimeoutRef.current = null
        }
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initialize: check if app was hidden when component mounts
    if (document.visibilityState === 'hidden') {
      wasHidden.current = true
      hiddenStartTime.current = Date.now()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current)
      }
    }
  }, [])

  return null
}

