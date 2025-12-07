'use client'

import { useEffect, useRef } from 'react'
// Capacitor will be loaded dynamically to avoid initialization errors

// Global back button handler registry
type BackButtonHandler = () => boolean | void // Return true to prevent default, false/void to allow default

class BackButtonManager {
  private handlers: BackButtonHandler[] = []
  private listener: any = null
  private isSetup = false

  async setup() {
    if (this.isSetup) {
      return
    }

    try {
      // Lazy load Capacitor to avoid errors if not initialized
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) {
        return
      }

      const { App } = await import('@capacitor/app')
      
      // Remove existing listener if any
      if (this.listener) {
        await this.listener.remove()
      }

      // Add global listener
      this.listener = await App.addListener('backButton', ({ canGoBack }) => {
        console.log('[BackButtonManager] Back button pressed', { 
          canGoBack, 
          handlersCount: this.handlers.length 
        })

        // Call handlers in reverse order (last registered = highest priority)
        for (let i = this.handlers.length - 1; i >= 0; i--) {
          const handler = this.handlers[i]
          try {
            const result = handler()
            // If handler returns true, prevent default behavior
            if (result === true) {
              console.log('[BackButtonManager] Handler prevented default behavior', { index: i })
              return
            }
          } catch (error) {
            console.error('[BackButtonManager] Error in handler:', error)
          }
        }

        // If no handler prevented default, allow default behavior (exit app)
        console.log('[BackButtonManager] No handler prevented default, allowing default behavior')
      })

      this.isSetup = true
      console.log('[BackButtonManager] Global back button listener registered')
    } catch (error) {
      console.error('[BackButtonManager] Error setting up back button listener:', error)
    }
  }

  register(handler: BackButtonHandler): () => void {
    this.handlers.push(handler)
    console.log('[BackButtonManager] Handler registered', { totalHandlers: this.handlers.length })
    
    // Setup if not already done
    this.setup()

    // Return unregister function
    return () => {
      const index = this.handlers.indexOf(handler)
      if (index > -1) {
        this.handlers.splice(index, 1)
        console.log('[BackButtonManager] Handler unregistered', { remainingHandlers: this.handlers.length })
      }
    }
  }

  async cleanup() {
    if (this.listener) {
      try {
        await this.listener.remove()
        this.listener = null
        this.isSetup = false
        console.log('[BackButtonManager] Global back button listener removed')
      } catch (error) {
        console.error('[BackButtonManager] Error removing listener:', error)
      }
    }
    this.handlers = []
  }
}

// Singleton instance
const backButtonManager = new BackButtonManager()

/**
 * Hook untuk handle hardware back button di Android
 * @param isActive - apakah handler aktif
 * @param onBack - callback ketika back button ditekan. Return true untuk prevent default behavior
 */
export function useBackButton(isActive: boolean, onBack: () => boolean | void) {
  const onBackRef = useRef(onBack)
  const unregisterRef = useRef<(() => void) | null>(null)

  // Keep ref in sync
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!isActive) {
      // Unregister when inactive
      if (unregisterRef.current) {
        unregisterRef.current()
        unregisterRef.current = null
      }
      return
    }

    // Register handler
    // Note: Handlers are called in reverse order (last registered = highest priority)
    // So QuickView handlers (registered after navigation) will be called first
    const unregister = backButtonManager.register(() => {
      // Double check isActive to avoid stale closures
      if (isActive) {
        const result = onBackRef.current()
        console.log('[useBackButton] Handler called, result:', result)
        return result
      }
      console.log('[useBackButton] Handler not active, skipping')
      return false
    })

    unregisterRef.current = unregister

    return () => {
      if (unregisterRef.current) {
        unregisterRef.current()
        unregisterRef.current = null
      }
    }
  }, [isActive])
}

// Setup global listener on module load (for native platforms)
// This ensures the listener is registered as soon as the module loads
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure Capacitor is fully initialized
  setTimeout(() => {
    // Use dynamic import instead of require to avoid module-level errors
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        backButtonManager.setup().catch((error) => {
          console.error('[useBackButton] Error setting up global back button handler:', error)
        })
      }
    }).catch((error) => {
      // Silently fail - Capacitor might not be available (web build)
      console.warn('[useBackButton] Capacitor not available, skipping setup:', error)
    })
  }, 100)
}

