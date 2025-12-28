'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

export default function WebPushSetup() {
  const { data: session, status } = useSession()
  const setupAttempted = useRef(false)
  const [isSupported, setIsSupported] = useState(false)
  
  // Move useMutation to top level - hooks must be called at top level
  const registerWebPush = trpc.notification.registerWebPushToken.useMutation()

  useEffect(() => {
    // Only run on authenticated sessions
    if (status !== 'authenticated' || !session?.user) {
      return
    }

    // Prevent multiple setup attempts
    if (setupAttempted.current) {
      return
    }

    setupAttempted.current = true
    let isMounted = true

    const setup = async () => {
      try {
        console.log('[WebPushSetup] ========== STARTING WEB PUSH SETUP ==========')
        console.log('[WebPushSetup] User:', session.user.name, session.user.id)

        // Check if browser supports Web Push
        if (
          !('serviceWorker' in navigator) ||
          !('PushManager' in window) ||
          !('Notification' in window)
        ) {
          console.log('[WebPushSetup] Web Push not supported in this browser')
          setIsSupported(false)
          return
        }

        setIsSupported(true)

        // Check if we're in a native app (Capacitor) - skip Web Push for native
        const isNative = (window as any).Capacitor?.isNativePlatform()
        if (isNative) {
          console.log('[WebPushSetup] Native app detected, skipping Web Push (using native push instead)')
          return
        }

        // Check if running on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        
        // Check if running as PWA (standalone mode)
        const isPWA = 
          (window.navigator as any).standalone === true ||
          window.matchMedia('(display-mode: standalone)').matches ||
          (document as any).referrer.includes('android-app://')

        // For iOS, don't auto-request permission - user must click button
        // iOS requires user interaction to request notification permission
        if (isIOS && Notification.permission === 'default') {
          console.log('[WebPushSetup] iOS detected with default permission - skipping auto-request (user must click button)')
          return
        }

        // Wait for service worker to be ready
        let registration: ServiceWorkerRegistration | null = null
        
        try {
          registration = await navigator.serviceWorker.ready
          console.log('[WebPushSetup] Service worker ready')
        } catch (error) {
          console.error('[WebPushSetup] Service worker not ready:', error)
          return
        }

        if (!registration) {
          console.error('[WebPushSetup] No service worker registration found')
          return
        }

        // Check if push manager is available
        if (!registration.pushManager) {
          console.error('[WebPushSetup] PushManager not available')
          return
        }

        // Check existing subscription
        let subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          console.log('[WebPushSetup] Existing subscription found, checking if still valid...')
          
          // Check if subscription is still valid by trying to register it
          try {
            const subscriptionJSON = subscription.toJSON()
            
            if (subscriptionJSON.keys?.p256dh && subscriptionJSON.keys?.auth) {
              await registerWebPush.mutateAsync({
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscriptionJSON.keys.p256dh,
                  auth: subscriptionJSON.keys.auth,
                },
              })
              console.log('[WebPushSetup] ✅ Existing subscription registered')
              return
            }
          } catch (error) {
            console.warn('[WebPushSetup] Existing subscription invalid, will create new one:', error)
            // Continue to create new subscription
          }
        }

        // Request notification permission
        console.log('[WebPushSetup] Requesting notification permission...')
        const permission = await Notification.requestPermission()
        
        if (permission !== 'granted') {
          console.warn('[WebPushSetup] Notification permission denied:', permission)
          setupAttempted.current = false
          return
        }

        console.log('[WebPushSetup] ✅ Notification permission granted')

        // Get VAPID public key from environment
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        
        if (!vapidPublicKey) {
          console.error('[WebPushSetup] VAPID public key not configured')
          setupAttempted.current = false
          return
        }

        // Convert VAPID key to Uint8Array
        function urlBase64ToUint8Array(base64String: string): BufferSource {
          const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
          const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/')
          
          const rawData = window.atob(base64)
          const outputArray = new Uint8Array(rawData.length)
          
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
          }
          
          return outputArray.buffer
        }

        // Subscribe to push notifications
        console.log('[WebPushSetup] Subscribing to push notifications...')
        
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })

          console.log('[WebPushSetup] ✅ Push subscription created')

          // Send subscription to backend
          const subscriptionJSON = subscription.toJSON()
          
          if (!subscriptionJSON.keys?.p256dh || !subscriptionJSON.keys?.auth) {
            throw new Error('Invalid subscription keys')
          }

          await registerWebPush.mutateAsync({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscriptionJSON.keys.p256dh,
              auth: subscriptionJSON.keys.auth,
            },
          })

          console.log('[WebPushSetup] ✅ Web Push subscription registered successfully')
        } catch (error) {
          console.error('[WebPushSetup] ❌ Error subscribing to push notifications:', error)
          setupAttempted.current = false
        }
      } catch (error) {
        console.error('[WebPushSetup] ❌ Error in Web Push setup:', error)
        setupAttempted.current = false
      }
    }

    // Small delay to ensure everything is ready
    const timer = setTimeout(() => {
      if (isMounted) {
        setup()
      }
    }, 1000)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [session, status, registerWebPush])

  return null // Component tidak render apa-apa
}

