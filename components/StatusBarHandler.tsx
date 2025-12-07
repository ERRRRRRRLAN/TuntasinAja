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
    return {
      StatusBar: statusBar.StatusBar,
      Style: statusBar.Style,
    }
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

      const statusBarModule = await loadStatusBar()
      if (!statusBarModule) {
        return
      }

      const { StatusBar, Style } = statusBarModule

      try {
        // Set status bar style
        await StatusBar.setStyle({
          style: Style.Dark, // Use enum instead of string
        })

        // Set status bar background color (transparent)
        await StatusBar.setBackgroundColor({
          color: '#ffffff', // White background to match header
        })

        // Set overlay to false so content doesn't go under status bar
        await StatusBar.setOverlaysWebView({
          overlay: false,
        })

        // Note: Navigation bar is handled by Android theme configuration
        // (windowTranslucentNavigation: false in styles.xml)
        // CSS padding-bottom with env(safe-area-inset-bottom) handles spacing

        console.log('[StatusBarHandler] ✅ Status bar configured')
      } catch (error) {
        console.error('[StatusBarHandler] ❌ Error configuring status bar:', error)
      }
    }

    setupStatusBar()
  }, [])

  return null
}

