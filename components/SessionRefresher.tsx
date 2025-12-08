'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Capacitor } from '@capacitor/core'

/**
 * SessionRefresher Component
 * 
 * This component handles session persistence when the app resumes from background.
 * 
 * Problem: When the app goes to background and returns after some time,
 * the WebView might temporarily show session as unauthenticated before
 * the cookie is properly read. This causes unwanted redirects to login.
 * 
 * Solution: 
 * 1. Listen for app resume events (appStateChange)
 * 2. Force session refresh when app comes back to foreground
 * 3. Track that we're in a "recovery period" to prevent premature redirects
 */

// Global flag to indicate session is being recovered
// This is used by other components to prevent redirect during recovery
let isRecoveringSession = false
let recoveryTimeout: NodeJS.Timeout | null = null

// Export function to check if session is being recovered
export const getIsRecoveringSession = () => isRecoveringSession

// Export function to set recovery state (used by this component)
export const setIsRecoveringSession = (value: boolean) => {
  isRecoveringSession = value
  
  // Auto-reset after timeout to prevent stuck state
  if (value) {
    if (recoveryTimeout) {
      clearTimeout(recoveryTimeout)
    }
    recoveryTimeout = setTimeout(() => {
      isRecoveringSession = false
      recoveryTimeout = null
    }, 10000) // 10 second max recovery time
  } else {
    if (recoveryTimeout) {
      clearTimeout(recoveryTimeout)
      recoveryTimeout = null
    }
  }
}

export default function SessionRefresher() {
  const { data: session, status, update } = useSession()
  const lastActiveTime = useRef<number>(Date.now())
  const wasInBackground = useRef<boolean>(false)
  const appStateListenerRef = useRef<any>(null)

  // Check if session cookie exists
  const checkSessionCookie = useCallback(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      return cookies.some(cookie => {
        const trimmed = cookie.trim()
        return trimmed.startsWith('next-auth.session-token=') || 
               trimmed.startsWith('__Secure-next-auth.session-token=')
      })
    }
    return false
  }, [])

  // Force session refresh
  const refreshSession = useCallback(async () => {
    console.log('[SessionRefresher] 🔄 Forcing session refresh...')
    
    try {
      // Check if cookie exists
      const hasCookie = checkSessionCookie()
      console.log('[SessionRefresher] Cookie check:', { hasCookie, status })
      
      if (hasCookie) {
        // Mark as recovering
        setIsRecoveringSession(true)
        
        // Use NextAuth's update function to refresh the session
        // This will re-fetch the session from the server
        if (update) {
          await update()
          console.log('[SessionRefresher] ✅ Session updated via update()')
        }
        
        // Also trigger a re-fetch of the session endpoint
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
            },
          })
          
          if (response.ok) {
            const sessionData = await response.json()
            console.log('[SessionRefresher] ✅ Session fetched:', { 
              hasUser: !!sessionData?.user,
              userId: sessionData?.user?.id 
            })
          } else {
            console.log('[SessionRefresher] ⚠️ Session fetch response not ok:', response.status)
          }
        } catch (fetchError) {
          console.error('[SessionRefresher] ❌ Error fetching session:', fetchError)
        }
        
        // Wait a bit before clearing recovery flag
        setTimeout(() => {
          setIsRecoveringSession(false)
          console.log('[SessionRefresher] ✅ Session recovery complete')
        }, 2000)
      } else {
        console.log('[SessionRefresher] ℹ️ No session cookie found, user likely logged out')
        setIsRecoveringSession(false)
      }
    } catch (error) {
      console.error('[SessionRefresher] ❌ Error refreshing session:', error)
      setIsRecoveringSession(false)
    }
  }, [checkSessionCookie, status, update])

  // Handle visibility change (for web/PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background
        wasInBackground.current = true
        lastActiveTime.current = Date.now()
        console.log('[SessionRefresher] 📴 App going to background')
      } else {
        // App coming to foreground
        const timeInBackground = Date.now() - lastActiveTime.current
        console.log('[SessionRefresher] 📱 App resuming from background', {
          wasInBackground: wasInBackground.current,
          timeInBackgroundMs: timeInBackground,
          timeInBackgroundMin: Math.round(timeInBackground / 60000)
        })
        
        // If was in background for more than 30 seconds, refresh session
        if (wasInBackground.current && timeInBackground > 30000) {
          refreshSession()
        }
        
        wasInBackground.current = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshSession])

  // Handle Capacitor app state change (for native app)
  useEffect(() => {
    let isMounted = true
    
    const setupCapacitorListener = async () => {
      if (!Capacitor.isNativePlatform()) {
        return
      }
      
      try {
        const { App } = await import('@capacitor/app')
        
        // Remove existing listener if any
        if (appStateListenerRef.current) {
          await appStateListenerRef.current.remove()
        }
        
        appStateListenerRef.current = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isMounted) return
          
          if (!isActive) {
            // App going to background
            wasInBackground.current = true
            lastActiveTime.current = Date.now()
            console.log('[SessionRefresher] 📴 Native app going to background')
          } else {
            // App coming to foreground
            const timeInBackground = Date.now() - lastActiveTime.current
            console.log('[SessionRefresher] 📱 Native app resuming', {
              wasInBackground: wasInBackground.current,
              timeInBackgroundMs: timeInBackground,
              timeInBackgroundMin: Math.round(timeInBackground / 60000)
            })
            
            // If was in background for more than 30 seconds, refresh session
            // For native apps, we should be more aggressive with refreshing
            if (wasInBackground.current && timeInBackground > 30000) {
              // Mark as recovering immediately
              setIsRecoveringSession(true)
              
              // Small delay to let WebView stabilize
              setTimeout(() => {
                refreshSession()
              }, 500)
            }
            
            wasInBackground.current = false
          }
        })
        
        console.log('[SessionRefresher] ✅ Capacitor app state listener registered')
      } catch (error) {
        console.error('[SessionRefresher] ❌ Error setting up Capacitor listener:', error)
      }
    }
    
    setupCapacitorListener()
    
    return () => {
      isMounted = false
      if (appStateListenerRef.current) {
        appStateListenerRef.current.remove().catch((e: any) => {
          console.error('[SessionRefresher] Error removing listener:', e)
        })
      }
    }
  }, [refreshSession])

  // Monitor session status changes during recovery
  useEffect(() => {
    if (isRecoveringSession) {
      console.log('[SessionRefresher] Session status during recovery:', { 
        status, 
        hasSession: !!session,
        userId: session?.user?.id 
      })
      
      // If session is restored, end recovery
      if (status === 'authenticated' && session) {
        console.log('[SessionRefresher] ✅ Session restored during recovery')
        setIsRecoveringSession(false)
      }
    }
  }, [status, session])

  // This component doesn't render anything
  return null
}

