'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Component to handle session refresh when app resumes from background
 * This ensures session is refreshed when user returns to the app after being idle
 */
export default function SessionRefreshHandler() {
  const { data: session, update } = useSession()

  useEffect(() => {
    // Handle visibility change (when app comes back to foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        // Refresh session when app becomes visible
        console.log('[SessionRefreshHandler] App resumed, refreshing session...')
        update()
      }
    }

    // Handle focus event (when window/tab gets focus)
    const handleFocus = () => {
      if (session) {
        console.log('[SessionRefreshHandler] Window focused, refreshing session...')
        update()
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Also refresh on mount if app was in background
    if (document.visibilityState === 'visible' && session) {
      // Small delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        update()
      }, 1000)
      return () => clearTimeout(timer)
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [session, update])

  return null
}

