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
    console.log('[PushNotificationSetup] Capacitor import failed (expected in web):', e)
  }

  return { Capacitor: null, PushNotifications: null }
}

export default function PushNotificationSetup() {
  const { data: session, status } = useSession()
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const setupAttempted = useRef(false)
  const lastUserIdRef = useRef<string | null>(null) // Track last user ID
  const listenersRef = useRef<any[]>([])
  const deviceTokenRef = useRef<string | null>(null)

  const registerToken = trpc.notification.registerToken.useMutation()
  const unregisterToken = trpc.notification.unregisterToken.useMutation()

  // Log component mount
  useEffect(() => {
    console.log('[PushNotificationSetup] 🚀 Component mounted/updated!', {
      status,
      hasSession: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name,
    })
  }, [])

  useEffect(() => {
    const currentUserId = session?.user?.id || null
    
    console.log('[PushNotificationSetup] ⚡ useEffect triggered', {
      status,
      hasSession: !!session,
      userId: currentUserId,
      lastUserId: lastUserIdRef.current,
      setupAttempted: setupAttempted.current,
      userChanged: currentUserId !== lastUserIdRef.current,
    })

    // Skip if session is not ready
    if (status === 'loading' || !session) {
      console.log('[PushNotificationSetup] ⏸️ Skipping - session not ready', { status, hasSession: !!session })
      // Reset if user logged out
      if (!session && lastUserIdRef.current) {
        console.log('[PushNotificationSetup] 🔄 User logged out, resetting state')
        setupAttempted.current = false
        lastUserIdRef.current = null
        deviceTokenRef.current = null
        setIsRegistered(false)
      }
      return
    }

    // If user changed (logout/login with different account), reset and re-register
    if (currentUserId !== lastUserIdRef.current) {
      console.log('[PushNotificationSetup] 🔄 User changed! Resetting and re-registering', {
        oldUserId: lastUserIdRef.current,
        newUserId: currentUserId,
      })
      setupAttempted.current = false
      lastUserIdRef.current = currentUserId
      setIsRegistered(false)
      
      // Unregister old token if exists
      if (deviceTokenRef.current) {
        console.log('[PushNotificationSetup] Unregistering old token for previous user')
        unregisterToken.mutate({ token: deviceTokenRef.current })
        deviceTokenRef.current = null
      }
    }

    // Prevent multiple setup attempts for same user
    if (setupAttempted.current && currentUserId === lastUserIdRef.current) {
      console.log('[PushNotificationSetup] ⏸️ Setup already attempted for this user, skipping')
      return
    }

    let isMounted = true
    setupAttempted.current = true
    lastUserIdRef.current = currentUserId

    const initialize = async () => {
      try {
        console.log('[PushNotificationSetup] 🔄 Initializing push notification setup...')
        console.log('[PushNotificationSetup] Session status:', { 
          status, 
          hasSession: !!session, 
          userId: session?.user?.id,
          userName: session?.user?.name,
          userEmail: session?.user?.email,
        })

        // Load Capacitor modules dynamically
        const capacitorModules = await loadCapacitorModules()

        if (!isMounted) {
          console.log('[PushNotificationSetup] Component unmounted, aborting')
          return
        }

        // Skip if Capacitor is not available (web build)
        if (!capacitorModules?.Capacitor || !capacitorModules?.PushNotifications) {
          console.log('[PushNotificationSetup] ⚠️ Capacitor not available, skipping (web build)')
          setupAttempted.current = false // Allow retry if needed
          return
        }

        const { Capacitor, PushNotifications } = capacitorModules

        // Check platform
        const platform = Capacitor.getPlatform()
        const isNative = Capacitor.isNativePlatform()
        
        console.log('[PushNotificationSetup] Platform check:', {
          platform,
          isNative,
          isAndroid: platform === 'android',
          isIOS: platform === 'ios',
        })

        // Only run on native platforms (Android/iOS)
        // More lenient check - if platform is android or ios, proceed
        if (platform !== 'android' && platform !== 'ios') {
          console.log('[PushNotificationSetup] ⚠️ Not native platform, skipping setup')
          setupAttempted.current = false
          return
        }

        console.log('[PushNotificationSetup] ✅ Native platform detected, proceeding with setup...')

        // Setup push notifications
        await setupPushNotifications(Capacitor, PushNotifications, session)
      } catch (error) {
        console.error('[PushNotificationSetup] ❌ Error in initialize:', error)
        setRegistrationError('Failed to initialize push notifications: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setupAttempted.current = false // Allow retry on error
      }
    }

    const setupPushNotifications = async (
      Capacitor: any,
      PushNotifications: any,
      session: any
    ) => {
      try {
        console.log('[PushNotificationSetup] 📱 Starting push notification setup...')
        
        // Check if PushNotifications is available
        if (!PushNotifications) {
          console.error('[PushNotificationSetup] ❌ PushNotifications plugin not available')
          setRegistrationError('PushNotifications plugin not available')
          return
        }

        // Request permission
        console.log('[PushNotificationSetup] 🔐 Requesting permissions...')
        let permResult = await PushNotifications.requestPermissions()
        
        console.log('[PushNotificationSetup] Permission result:', permResult)
        
        // Handle prompt state - request again
        if (permResult.receive === 'prompt') {
          console.log('[PushNotificationSetup] Permission was prompted, waiting and requesting again...')
          // Wait a bit for user to respond
          await new Promise(resolve => setTimeout(resolve, 1000))
          permResult = await PushNotifications.requestPermissions()
          console.log('[PushNotificationSetup] Permission result (retry):', permResult)
        }

        if (permResult.receive !== 'granted') {
          console.warn('[PushNotificationSetup] ⚠️ Permission denied:', permResult.receive)
          setRegistrationError('Push notification permission denied. Please enable notifications in Settings.')
          setupAttempted.current = false // Allow retry
          return
        }

        console.log('[PushNotificationSetup] ✅ Permission granted, registering with FCM...')

        // Register with FCM
        await PushNotifications.register()
        console.log('[PushNotificationSetup] 📡 Registration request sent to FCM')

        // Listen for registration - this is async, token will come later
        const registrationListener = PushNotifications.addListener('registration', async (token: any) => {
          if (!isMounted) return
          
          const tokenValue = token.value
          deviceTokenRef.current = tokenValue
          
          console.log('[PushNotificationSetup] ✅ Push registration success!')
          console.log('[PushNotificationSetup] Token:', tokenValue.substring(0, 30) + '...')
          console.log('[PushNotificationSetup] User ID:', session?.user?.id)
          console.log('[PushNotificationSetup] User Name:', session?.user?.name)
          
            // Register token with backend
            console.log('[PushNotificationSetup] 📤 Sending token to backend...', {
              tokenPrefix: tokenValue.substring(0, 30) + '...',
              userId: session?.user?.id,
              userName: session?.user?.name,
              userEmail: session?.user?.email,
              deviceInfo: Capacitor.getPlatform(),
            })
            try {
              registerToken.mutate({
                token: tokenValue,
                deviceInfo: Capacitor.getPlatform(),
              }, {
                onSuccess: (data) => {
                  console.log('[PushNotificationSetup] ✅✅ Token registered successfully in backend!', {
                    data,
                    userId: session?.user?.id,
                    userName: session?.user?.name,
                    userEmail: session?.user?.email,
                  })
                  setIsRegistered(true)
                  setRegistrationError(null)
                  // Update lastUserId to current user
                  lastUserIdRef.current = session?.user?.id || null
                },
                onError: (error) => {
                  console.error('[PushNotificationSetup] ❌ Error registering token in backend:', error)
                  console.error('[PushNotificationSetup] Error details:', JSON.stringify(error, null, 2))
                  setRegistrationError('Failed to register device token: ' + (error?.message || 'Unknown error'))
                  // Reset setupAttempted to allow retry
                  setupAttempted.current = false
                },
              })
            } catch (error) {
              console.error('[PushNotificationSetup] ❌ Exception registering token:', error)
              setRegistrationError('Exception registering token: ' + (error instanceof Error ? error.message : 'Unknown error'))
              setupAttempted.current = false
            }
        })
        listenersRef.current.push(registrationListener)

        // Listen for registration errors
        const registrationErrorListener = PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[PushNotificationSetup] ❌ Registration error:', JSON.stringify(error))
          setRegistrationError('Failed to register for push notifications: ' + (error?.error || error?.message || 'Unknown error'))
          setupAttempted.current = false // Allow retry on error
        })
        listenersRef.current.push(registrationErrorListener)

        // Listen for push notifications received
        const pushListener = PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          console.log('[PushNotificationSetup] 📬 Push notification received:', notification)
        })
        listenersRef.current.push(pushListener)

        // Listen for push notification actions
        const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
          console.log('[PushNotificationSetup] 🔔 Push notification action performed:', notification.actionId, notification.inputValue)
        })
        listenersRef.current.push(actionListener)

        console.log('[PushNotificationSetup] ✅ All listeners registered')
        console.log('[PushNotificationSetup] ⏳ Waiting for FCM token...')

      } catch (error) {
        console.error('[PushNotificationSetup] ❌ Error setting up push notifications:', error)
        setRegistrationError('Failed to setup push notifications: ' + (error instanceof Error ? error.message : 'Unknown error'))
        setupAttempted.current = false // Allow retry on error
      }
    }

    // Start initialization
    initialize()

    // Cleanup on unmount
    return () => {
      isMounted = false
      console.log('[PushNotificationSetup] 🧹 Cleaning up...')
      
      // Remove all listeners
      listenersRef.current.forEach(listener => {
        try {
          listener.remove()
        } catch (e) {
          console.error('[PushNotificationSetup] Error removing listener:', e)
        }
      })
      listenersRef.current = []
      
      // Note: We don't unregister token on unmount anymore
      // Token should persist across app restarts
      // Only unregister on explicit logout
    }
  }, [session, status]) // Removed registerToken and unregisterToken from deps to prevent re-initialization

  // Don't render anything - this is a background component
  return null
}
