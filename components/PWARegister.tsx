'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Try to register service worker from next-pwa
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })
          console.log('Service Worker registered:', registration)
        } catch (error) {
          console.log('Service Worker registration failed:', error)
          // Service worker might not exist yet, that's okay
        }
      }

      // Register after page load
      if (document.readyState === 'complete') {
        registerSW()
      } else {
        window.addEventListener('load', registerSW)
      }

      return () => {
        window.removeEventListener('load', registerSW)
      }
    }
  }, [])

  return null
}

