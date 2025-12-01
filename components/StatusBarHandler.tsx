'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

// Helper to safely load StatusBar
async function loadStatusBar() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const statusBar = await import('@capacitor/status-bar')
    return statusBar.StatusBar
  } catch (e) {
    return null
  }
}

export default function StatusBarHandler() {
  useEffect(() => {
    const setupStatusBar = async () => {
      // Only run on native platforms
      if (!Capacitor.isNativePlatform()) {
        return
      }

      const StatusBar = await loadStatusBar()
      if (!StatusBar) {
        return
      }

      try {
        // Set status bar style
        await StatusBar.setStyle({
          style: 'dark', // or 'light' depending on your preference
        })

        // Set status bar background color (transparent)
        await StatusBar.setBackgroundColor({
          color: '#ffffff', // White background to match header
        })

        // Set overlay to false so content doesn't go under status bar
        await StatusBar.setOverlaysWebView({
          overlay: false,
        })

        console.log('[StatusBarHandler] ✅ Status bar configured')
      } catch (error) {
        console.error('[StatusBarHandler] ❌ Error configuring status bar:', error)
      }
    }

    setupStatusBar()
  }, [])

  return null
}

