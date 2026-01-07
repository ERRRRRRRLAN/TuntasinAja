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
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload page saat service worker baru mengambil kontrol
          // Tapi jangan reload terlalu sering
          if (!window.location.reload) {
            return
          }
          
          // Delay reload sedikit untuk menghindari loop
          setTimeout(() => {
            window.location.reload()
          }, 100)
        })
      }

      // Cleanup function untuk useEffect
      return () => {
        if (updateInterval) {
          clearInterval(updateInterval)
        }
      }
    }
  }, [])

  return null
}

