'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

// Helper to safely load Capacitor modules (only available in native builds)
async function loadCapacitorModules() {
  if (typeof window === 'undefined') {
    return { Capacitor: null, PushNotifications: null }
  }

  try {
    // Use dynamic import() which is truly lazy and won't break web builds
    const [capacitorCore, capacitorPush] = await Promise.all([
      import('@capacitor/core').catch(() => null),
      import('@capacitor/push-notifications').catch(() => null),
    ])

    if (capacitorCore?.Capacitor && capacitorPush?.PushNotifications) {
      return {
        Capacitor: capacitorCore.Capacitor,
        PushNotifications: capacitorPush.PushNotifications,
      }
    }
  } catch (e) {
    // Capacitor not available (web build) - this is expected and OK
  }

  return { Capacitor: null, PushNotifications: null }
}

export default function PushNotificationSetup() {
  const { data: session, status } = useSession()
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const setupAttempted = useRef(false)

  const registerToken = trpc.notification.registerToken.useMutation()
  const unregisterToken = trpc.notification.unregisterToken.useMutation()

  useEffect(() => {
    let isMounted = true
    let deviceToken: string | null = null
    let listeners: any[] = []

    const initialize = async () => {
      // Load Capacitor modules dynamically
      const capacitorModules = await loadCapacitorModules()

      if (!isMounted) return

      // Skip if Capacitor is not available (web build)
      if (!capacitorModules?.Capacitor || !capacitorModules?.PushNotifications) {
        console.log('[PushNotificationSetup] Capacitor not available, skipping (web build)')
        return
      }

      const { Capacitor, PushNotifications } = capacitorModules

      // Debug logging
      console.log('[PushNotificationSetup] Effect triggered', {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        hasSession: !!session,
        sessionStatus: status,
        setupAttempted: setupAttempted.current,
      })

      // Only run on native platforms (Android/iOS)
      // Check both isNativePlatform and platform to be sure
      const isNative = Capacitor.isNativePlatform() || 
                       Capacitor.getPlatform() === 'android' || 
                       Capacitor.getPlatform() === 'ios'
      
      if (!isNative) {
        console.log('[PushNotificationSetup] Not native platform, skipping setup')
        return
      }

      // Wait for session to be ready
      if (status === 'loading' || !session) {
        console.log('[PushNotificationSetup] Waiting for session...', { status, hasSession: !!session })
        return
      }

      // Prevent multiple setup attempts
      if (setupAttempted.current) {
        console.log('[PushNotificationSetup] Setup already attempted, skipping')
        return
      }

      setupAttempted.current = true

      const setupPushNotifications = async () => {
        try {
          console.log('[PushNotificationSetup] Starting push notification setup...')
          
          // Check if PushNotifications is available
          if (!PushNotifications) {
            console.error('[PushNotificationSetup] PushNotifications plugin not available')
            setRegistrationError('PushNotifications plugin not available')
            return
          }

          // Request permission
          console.log('[PushNotificationSetup] Requesting permissions...')
          let permResult = await PushNotifications.requestPermissions()
          
          console.log('[PushNotificationSetup] Permission result:', permResult)
          
          if (permResult.receive === 'prompt') {
            console.log('[PushNotificationSetup] Permission was prompted, requesting again...')
            permResult = await PushNotifications.requestPermissions()
          }

          if (permResult.receive !== 'granted') {
            console.warn('[PushNotificationSetup] Permission denied:', permResult.receive)
            setRegistrationError('Push notification permission denied')
            return
          }

          console.log('[PushNotificationSetup] Permission granted, registering with FCM...')

          // Register with FCM
          await PushNotifications.register()
          console.log('[PushNotificationSetup] Registration request sent to FCM')

          // Listen for registration
          const registrationListener = PushNotifications.addListener('registration', (token: any) => {
            deviceToken = token.value
            console.log('[PushNotificationSetup] ✅ Push registration success!')
            console.log('[PushNotificationSetup] Token:', token.value.substring(0, 20) + '...')
            console.log('[PushNotificationSetup] User ID:', session?.user?.id)
            
            // Register token with backend
            console.log('[PushNotificationSetup] Sending token to backend...')
            registerToken.mutate({
              token: token.value,
              deviceInfo: Capacitor.getPlatform(),
            }, {
              onSuccess: (data) => {
                console.log('[PushNotificationSetup] ✅ Token registered successfully in backend!', data)
                setIsRegistered(true)
                setRegistrationError(null)
              },
              onError: (error) => {
                console.error('[PushNotificationSetup] ❌ Error registering token in backend:', error)
                setRegistrationError('Failed to register device token: ' + (error?.message || 'Unknown error'))
              },
            })
          })
          listeners.push(registrationListener)

          // Listen for registration errors
          const registrationErrorListener = PushNotifications.addListener('registrationError', (error: any) => {
            console.error('[PushNotificationSetup] ❌ Registration error:', JSON.stringify(error))
            setRegistrationError('Failed to register for push notifications: ' + (error?.error || 'Unknown error'))
          })
          listeners.push(registrationErrorListener)

          // Listen for push notifications
          const pushListener = PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
            console.log('[PushNotificationSetup] 📬 Push notification received:', notification)
          })
          listeners.push(pushListener)

          // Listen for push notification actions
          const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
            console.log('[PushNotificationSetup] 🔔 Push notification action performed:', notification.actionId, notification.inputValue)
          })
          listeners.push(actionListener)

          console.log('[PushNotificationSetup] All listeners registered')

        } catch (error) {
          console.error('[PushNotificationSetup] ❌ Error setting up push notifications:', error)
          setRegistrationError('Failed to setup push notifications: ' + (error instanceof Error ? error.message : 'Unknown error'))
          setupAttempted.current = false // Allow retry on error
        }
      }

      setupPushNotifications()
    }

    initialize()

    // Cleanup listeners on unmount
    return () => {
      isMounted = false
      console.log('[PushNotificationSetup] Cleaning up listeners...')
      listeners.forEach(listener => {
        try {
          listener.remove()
        } catch (e) {
          console.error('[PushNotificationSetup] Error removing listener:', e)
        }
      })
      
      // Unregister token when component unmounts (optional)
      if (deviceToken) {
        console.log('[PushNotificationSetup] Unregistering token on unmount...')
        unregisterToken.mutate({ token: deviceToken })
      }
    }
  }, [session, status, registerToken, unregisterToken])

  // Don't render anything - this is a background component
  return null
}
