'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { useBackButton } from './useBackButton'

// Navigation history manager
class NavigationHistoryManager {
  private history: string[] = []
  private maxHistory = 10

  push(path: string) {
    // Don't add if same as last
    if (this.history[this.history.length - 1] === path) {
      return
    }
    
    this.history.push(path)
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
    
    console.log('[NavigationHistory] Pushed path:', path, 'History:', this.history)
  }

  pop(): string | null {
    if (this.history.length <= 1) {
      return null // Can't go back, already at root
    }
    
    // Remove current
    this.history.pop()
    
    // Get previous
    const previous = this.history[this.history.length - 1]
    console.log('[NavigationHistory] Popped, previous:', previous, 'History:', this.history)
    
    return previous || null
  }

  getPrevious(): string | null {
    if (this.history.length <= 1) {
      return null
    }
    return this.history[this.history.length - 2] || null
  }

  clear() {
    this.history = []
  }

  getHistory(): string[] {
    return [...this.history]
  }
}

// Singleton instance
const navigationHistory = new NavigationHistoryManager()

/**
 * Hook untuk track navigation history dan handle back button untuk navigation
 */
export function useNavigationHistory() {
  const pathname = usePathname()
  const router = useRouter()
  const isInitialMount = useRef(true)
  const previousPathname = useRef<string | null>(null)

  // Track navigation
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Add initial path
      navigationHistory.push(pathname)
      previousPathname.current = pathname
      return
    }

    // Only track if pathname actually changed
    if (pathname !== previousPathname.current) {
      navigationHistory.push(pathname)
      previousPathname.current = pathname
    }
  }, [pathname])

  // Handle back button for navigation (only on native platform)
  // This handler has lower priority - it will only be called if no QuickView/Modal is open
  // QuickView handlers will be registered after this, so they have higher priority
  useBackButton(
    Capacitor.isNativePlatform() && navigationHistory.getHistory().length > 1,
    () => {
      // Check if we're at root (can't go back further)
      if (navigationHistory.getHistory().length <= 1) {
        return false // Allow default (exit app)
      }
      
      const previous = navigationHistory.pop()
      if (previous && previous !== pathname) {
        console.log('[NavigationHistory] Navigating back to:', previous, 'from:', pathname)
        router.push(previous)
        return true // Prevent default
      }
      return false // Allow default (exit app)
    }
  )

  return {
    canGoBack: navigationHistory.getHistory().length > 1,
    goBack: () => {
      const previous = navigationHistory.pop()
      if (previous) {
        router.push(previous)
      }
    },
    getHistory: () => navigationHistory.getHistory(),
  }
}

