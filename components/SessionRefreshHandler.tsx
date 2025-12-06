'use client'

import { useEffect, useRef } from 'react'
import { useSession, getSession } from 'next-auth/react'

/**
 * Component to handle session refresh when app resumes from background
 * This ensures session is refreshed when user returns to the app after being idle
 */
export default function SessionRefreshHandler() {
  const { data: session, status, update } = useSession()
  const lastRefreshTime = useRef<number>(0)
  const wasHidden = useRef<boolean>(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hiddenStartTime = useRef<number | null>(null)

  useEffect(() => {
    // Minimum time between refreshes (1 minute - more frequent)
    const MIN_REFRESH_INTERVAL = 60 * 1000
    // Minimum time app was hidden before refreshing (30 seconds)
    const MIN_HIDDEN_TIME = 30 * 1000

    // Handle visibility change (when app comes back to foreground)
    const handleVisibilityChange = async () => {
      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshTime.current

      if (document.visibilityState === 'visible') {
        // Check if app was hidden long enough
        const hiddenDuration = hiddenStartTime.current 
          ? now - hiddenStartTime.current 
          : 0

        // Refresh if:
        // 1. App was previously hidden
        // 2. App was hidden for at least MIN_HIDDEN_TIME
        // 3. Enough time has passed since last refresh
        if (
          wasHidden.current && 
          hiddenDuration > MIN_HIDDEN_TIME &&
          timeSinceLastRefresh > MIN_REFRESH_INTERVAL
        ) {
          // Clear any pending refresh
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
          }

          // Force refresh session immediately (don't wait)
          console.log('[SessionRefreshHandler] App resumed after being hidden, force refreshing session...', {
            hiddenDuration: Math.round(hiddenDuration / 1000) + 's',
            timeSinceLastRefresh: Math.round(timeSinceLastRefresh / 1000) + 's',
            currentStatus: status,
            hasSession: !!session
          })

          // Try to get session first (force refresh)
          try {
            await getSession()
          } catch (error) {
            console.error('[SessionRefreshHandler] Error getting session:', error)
          }

          // Also trigger update
          lastRefreshTime.current = Date.now()
          update()
        }
        
        wasHidden.current = false
        hiddenStartTime.current = null
      } else if (document.visibilityState === 'hidden') {
        // Mark that app was hidden and record time
        wasHidden.current = true
        hiddenStartTime.current = Date.now()
        
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
      hiddenStartTime.current = Date.now()
    }
    // Don't auto refresh on mount - let SessionProvider handle initial session
    // Only refresh when app actually resumes from background

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [session, status, update])

  return null
}

