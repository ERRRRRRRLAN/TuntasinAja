'use client'

import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

// Helper to safely load App plugin
async function loadApp() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const app = await import('@capacitor/app')
    return app.App
  } catch (e) {
    return null
  }
}

/**
 * Hook untuk handle browser back button di mobile dan hardware back button di Android
 * @param isActive - apakah handler aktif
 * @param onBack - callback ketika back button ditekan
 */
export function useBackHandler(isActive: boolean, onBack: () => void) {
  const hasPushedState = useRef(false)
  const handlerId = useRef<string | null>(null)
  const backButtonListenerRef = useRef<any>(null)

  useEffect(() => {
    if (!isActive) {
      // Reset flag ketika tidak aktif
      if (hasPushedState.current && handlerId.current) {
        // Hanya remove listener, jangan cleanup history karena bisa trigger popstate
        hasPushedState.current = false
        handlerId.current = null
      }
      return
    }

    // Generate unique ID untuk handler ini
    if (!handlerId.current) {
      handlerId.current = `back-handler-${Date.now()}-${Math.random()}`
    }

    // Setup untuk native platform (Android/iOS) - hardware back button
    const setupNativeBackButton = async () => {
      if (!Capacitor.isNativePlatform()) {
        return
      }

      const App = await loadApp()
      if (!App) {
        return
      }

      // Remove existing listener if any
      if (backButtonListenerRef.current) {
        try {
          await backButtonListenerRef.current.remove()
        } catch (e) {
          console.error('[useBackHandler] Error removing existing listener:', e)
        }
        backButtonListenerRef.current = null
      }

      // Add listener for hardware back button
      const listener = await App.addListener('backButton', ({ canGoBack }) => {
        if (isActive) {
          // Prevent default back behavior
          onBack()
        }
      })

      backButtonListenerRef.current = listener
    }

    // Setup untuk web browser - popstate event
    const setupWebBackButton = () => {
      // Hanya push state sekali ketika dialog dibuka
      if (!hasPushedState.current) {
        // Push state untuk membuat history entry dengan unique ID
        window.history.pushState({ 
          modal: true, 
          handlerId: handlerId.current,
          timestamp: Date.now() 
        }, '')
        hasPushedState.current = true
      }

      const handlePopState = (event: PopStateEvent) => {
        // Hanya handle jika state kita yang di-pop
        const currentState = window.history.state
        if (hasPushedState.current && currentState?.handlerId === handlerId.current) {
          event.preventDefault()
          hasPushedState.current = false
          handlerId.current = null
          onBack()
        }
      }

      window.addEventListener('popstate', handlePopState)

      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }

    // Setup both handlers
    let webCleanup: (() => void) | undefined

    if (Capacitor.isNativePlatform()) {
      // Native platform: use Capacitor App plugin
      setupNativeBackButton()
    } else {
      // Web platform: use popstate event
      webCleanup = setupWebBackButton()
    }

    return () => {
      // Cleanup web handler
      if (webCleanup) {
        webCleanup()
      }

      // Cleanup native handler (async cleanup)
      if (Capacitor.isNativePlatform() && backButtonListenerRef.current) {
        // Use remove() method on the listener object itself
        backButtonListenerRef.current.remove().catch((e: any) => {
          console.error('[useBackHandler] Error removing listener:', e)
        })
        backButtonListenerRef.current = null
      }

      // Reset flags
      hasPushedState.current = false
      handlerId.current = null
    }
  }, [isActive, onBack])
}

