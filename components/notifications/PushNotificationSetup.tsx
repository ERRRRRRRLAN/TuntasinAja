'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
        console.log('[PushNotificationSetup] 📡 Calling PushNotifications.register()...')
        await PushNotifications.register()
        console.log('[PushNotificationSetup] 📡 Registration request sent to FCM, waiting for token...')

        // Check if token is already available (sometimes it comes immediately)
        try {
          const checkToken = await PushNotifications.checkPermissions()
          console.log('[PushNotificationSetup] Current permissions after register:', checkToken)
        } catch (e) {
          console.log('[PushNotificationSetup] Could not check permissions:', e)
        }

        // Listen for registration - this is async, token will come later
        const registrationListener = PushNotifications.addListener('registration', async (token: any) => {
          console.log('[PushNotificationSetup] 🎯 Registration event received!', {
            hasToken: !!token,
            tokenType: typeof token,
            tokenKeys: token ? Object.keys(token) : [],
            fullToken: token,
          })
          
          if (!isMounted) {
            console.log('[PushNotificationSetup] ⚠️ Component unmounted, ignoring token')
            return
          }
          
          const tokenValue = token?.value || token?.token || token
          
          if (!tokenValue || typeof tokenValue !== 'string') {
            console.error('[PushNotificationSetup] ❌ Invalid token received:', {
              token,
              tokenValue,
              tokenType: typeof tokenValue,
            })
            setRegistrationError('Invalid token received from FCM')
            setupAttempted.current = false
            return
          }
          
          deviceTokenRef.current = tokenValue
          
          console.log('[PushNotificationSetup] ✅ Push registration success!')
          console.log('[PushNotificationSetup] Token length:', tokenValue.length)
          console.log('[PushNotificationSetup] Token (first 50 chars):', tokenValue.substring(0, 50) + '...')
          console.log('[PushNotificationSetup] User ID:', session?.user?.id)
          console.log('[PushNotificationSetup] User Name:', session?.user?.name)
          console.log('[PushNotificationSetup] User Email:', session?.user?.email)
          
          if (!session?.user?.id) {
            console.error('[PushNotificationSetup] ❌ No user session when token received!')
            setRegistrationError('No user session available')
            setupAttempted.current = false
            return
          }
          
          // Register token with backend
          console.log('[PushNotificationSetup] 📤 Sending token to backend...', {
            tokenLength: tokenValue.length,
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
                console.error('[PushNotificationSetup] Error type:', typeof error)
                console.error('[PushNotificationSetup] Error message:', error?.message)
                console.error('[PushNotificationSetup] Error stack:', error?.stack)
                console.error('[PushNotificationSetup] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
                setRegistrationError('Failed to register device token: ' + (error?.message || 'Unknown error'))
                // Reset setupAttempted to allow retry
                setupAttempted.current = false
              },
            })
          } catch (error) {
            console.error('[PushNotificationSetup] ❌ Exception registering token:', error)
            console.error('[PushNotificationSetup] Exception details:', {
              error,
              errorType: typeof error,
              errorMessage: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
            })
            setRegistrationError('Exception registering token: ' + (error instanceof Error ? error.message : 'Unknown error'))
            setupAttempted.current = false
          }
        })
        listenersRef.current.push(registrationListener)
        
        console.log('[PushNotificationSetup] ✅ Registration listener added, waiting for FCM token...')

        // Listen for registration errors
        const registrationErrorListener = PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[PushNotificationSetup] ❌ Registration error:', JSON.stringify(error))
          setRegistrationError('Failed to register for push notifications: ' + (error?.error || error?.message || 'Unknown error'))
          setupAttempted.current = false // Allow retry on error
        })
        listenersRef.current.push(registrationErrorListener)

        // Listen for push notifications received
        const pushListener = PushNotifications.addListener('pushNotificationReceived', async (notification: any) => {
          console.log('[PushNotificationSetup] 📬 Push notification received:', notification)
          
          // Get user settings for sound and vibration
          try {
            const settingsResponse = await fetch('/api/trpc/userSettings.get?input={}')
            if (settingsResponse.ok) {
              const settingsData = await settingsResponse.json()
              const settings = settingsData?.result?.data
              
              // Play sound if enabled
              if (settings?.soundEnabled !== false) {
                // Sound is handled by the notification system, but we can add custom sound here if needed
                console.log('[PushNotificationSetup] Sound enabled for notification')
              }
              
              // Trigger vibration if enabled
              if (settings?.vibrationEnabled !== false && 'vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]) // Vibration pattern: vibrate 200ms, pause 100ms, vibrate 200ms
                console.log('[PushNotificationSetup] Vibration triggered')
              }
            }
          } catch (error) {
            console.error('[PushNotificationSetup] Error getting user settings:', error)
            // Default to enabled if error
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200])
            }
          }
        })
        listenersRef.current.push(pushListener)

        // Listen for push notification actions (when user taps notification)
        const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
          console.log('[PushNotificationSetup] 🔔 Push notification action performed:', notification.actionId, notification.inputValue)
          console.log('[PushNotificationSetup] Notification data:', notification.notification?.data)
          
          // Handle deep link from notification
          const data = notification.notification?.data
          
          // Priority: filter > deepLink
          if (data?.filter) {
            // Handle filter from schedule reminder
            const filterSubjects = data.filter
            console.log('[PushNotificationSetup] Applying filter from notification:', filterSubjects)
            
            // Navigate to home with filter using Next.js router
            // This works better in Android WebView
            const filterUrl = `/?filter=${encodeURIComponent(filterSubjects)}`
            console.log('[PushNotificationSetup] Navigating to:', filterUrl)
            
            // Use router.push for better navigation in Next.js
            if (typeof window !== 'undefined') {
              // Small delay to ensure app is ready
              setTimeout(() => {
                router.push(filterUrl)
              }, 100)
            }
          } else if (data?.deepLink) {
            // Navigate to deep link
            const deepLink = data.deepLink
            console.log('[PushNotificationSetup] Navigating to deep link:', deepLink)
            
            // Use router.push for better navigation in Next.js
            if (typeof window !== 'undefined') {
              const finalUrl = deepLink.startsWith('/') ? deepLink : `/${deepLink}`
              setTimeout(() => {
                router.push(finalUrl)
              }, 100)
            }
          }
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
