'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Hanya register di production atau jika diperlukan
      // Skip di development untuk menghindari masalah
      if (process.env.NODE_ENV === 'development') {
        // Unregister service worker jika ada di development
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister()
          })
        })
        return
      }

      // Register service worker
      let updateInterval: NodeJS.Timeout | null = null

      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Selalu cek update dari server
        })
        .then((registration) => {
          console.log('[Service Worker] Registered successfully:', registration.scope)

          // Check for updates setiap 1 jam
          updateInterval = setInterval(() => {
            registration.update().catch((err) => {
              console.error('[Service Worker] Update check failed:', err)
            })
          }, 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error)
          // Jangan crash app jika service worker gagal
        })

      // Handle service worker updates
      if (navigator.serviceWorker.controller) {
        let reloadTimeout: NodeJS.Timeout | null = null
        const handleControllerChange = () => {
          // Prevent multiple reloads
          if (reloadTimeout) {
            return
          }
          
          // Delay reload sedikit untuk menghindari loop
          reloadTimeout = setTimeout(() => {
            try {
              if (typeof window !== 'undefined' && window.location) {
                window.location.reload()
              }
            } catch (error) {
              console.warn('[ServiceWorkerRegistration] Error reloading page:', error)
            }
          }, 100)
        }
        
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
        
        // Cleanup
        return () => {
          if (reloadTimeout) {
            clearTimeout(reloadTimeout)
          }
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
        }
      }

      // Cleanup function untuk useEffect
      return () => {
        if (updateInterval) {
          clearInterval(updateInterval)
        }
        // Note: Service worker event listeners are cleaned up above
      }
    }
  }, [])

  return null
}

