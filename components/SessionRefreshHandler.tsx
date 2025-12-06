'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Component to handle session refresh when app resumes from background
 * This ensures session is refreshed when user returns to the app after being idle
 */
export default function SessionRefreshHandler() {
  const { data: session, update } = useSession()
  const lastRefreshTime = useRef<number>(0)
  const wasHidden = useRef<boolean>(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Minimum time between refreshes (5 minutes)
    const MIN_REFRESH_INTERVAL = 5 * 60 * 1000

    // Handle visibility change (when app comes back to foreground)
    const handleVisibilityChange = () => {
      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshTime.current

      if (document.visibilityState === 'visible') {
        // Only refresh if:
        // 1. App was previously hidden (not just tab switch)
        // 2. Enough time has passed since last refresh
        // 3. Session exists
        if (wasHidden.current && timeSinceLastRefresh > MIN_REFRESH_INTERVAL && session) {
          // Clear any pending refresh
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
          }

          // Debounce: wait 2 seconds before refreshing to avoid flickering
          refreshTimeoutRef.current = setTimeout(() => {
            console.log('[SessionRefreshHandler] App resumed after being hidden, refreshing session...')
            lastRefreshTime.current = Date.now()
            update()
          }, 2000) // 2 second delay
        }
        wasHidden.current = false
      } else if (document.visibilityState === 'hidden') {
        // Mark that app was hidden
        wasHidden.current = true
        // Clear any pending refresh when app goes to background
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
          refreshTimeoutRef.current = null
        }
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initialize: check if app was hidden when component mounts
    if (document.visibilityState === 'hidden') {
      wasHidden.current = true
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [session, update])

  return null
}

