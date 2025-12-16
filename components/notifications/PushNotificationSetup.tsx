'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'

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

        console.log('[PushNotificationSetup] ✅ Permission granted!')
        
        // Track if token was received (needs to be in wider scope for timeout check)
        let tokenReceived = false
        
        // Set up listener BEFORE calling register() to ensure we don't miss the event
        const registrationListener = PushNotifications.addListener('registration', async (token: any) => {
          if (tokenReceived) {
            console.log('[PushNotificationSetup] ⚠️ Duplicate registration event, ignoring')
            return
          }
          tokenReceived = true
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
          
          // Extract token with multiple fallback strategies
          let tokenValue: string | null = null
          
          // Try different token formats
          if (typeof token === 'string') {
            tokenValue = token
          } else if (token?.value && typeof token.value === 'string') {
            tokenValue = token.value
          } else if (token?.token && typeof token.token === 'string') {
            tokenValue = token.token
          } else if (token?.data?.token && typeof token.data.token === 'string') {
            tokenValue = token.data.token
          }
          
          console.log('[PushNotificationSetup] Token extraction result:', {
            originalToken: token,
            extractedToken: tokenValue,
            tokenType: typeof tokenValue,
            tokenLength: tokenValue?.length,
          })
          
          if (!tokenValue || typeof tokenValue !== 'string' || tokenValue.length < 10) {
            console.error('[PushNotificationSetup] ❌ Invalid token received:', {
              token,
              tokenValue,
              tokenType: typeof tokenValue,
              tokenLength: tokenValue?.length,
            })
            setRegistrationError('Invalid token received from FCM: ' + JSON.stringify(token))
            setupAttempted.current = false
            toast.error('❌ Format token FCM tidak valid', 5000)
            return
          }
          
          deviceTokenRef.current = tokenValue
          
          console.log('[PushNotificationSetup] ✅ Push registration success!')
          console.log('[PushNotificationSetup] Token length:', tokenValue.length)
          console.log('[PushNotificationSetup] Token (first 50 chars):', tokenValue.substring(0, 50) + '...')
          console.log('[PushNotificationSetup] User ID:', session?.user?.id)
          console.log('[PushNotificationSetup] User Name:', session?.user?.name)
          console.log('[PushNotificationSetup] User Email:', session?.user?.email)
          
          // Double-check session is still valid
          const currentSession = session
          if (!currentSession?.user?.id) {
            console.error('[PushNotificationSetup] ❌ No user session when token received!', {
              hasSession: !!currentSession,
              hasUser: !!currentSession?.user,
              userId: currentSession?.user?.id,
            })
            setRegistrationError('No user session available when token received')
            setupAttempted.current = false
            toast.error('❌ Session tidak tersedia. Silakan login ulang.', 5000)
            return
          }
          
          const userId = currentSession.user.id
          const userName = currentSession.user.name
          const userEmail = currentSession.user.email
          const deviceInfo = Capacitor.getPlatform()
          
          // Register token with backend
          console.log('[PushNotificationSetup] 📤 Sending token to backend...', {
            tokenLength: tokenValue.length,
            tokenPrefix: tokenValue.substring(0, 30) + '...',
            userId,
            userName,
            userEmail,
            deviceInfo,
            sessionValid: !!currentSession,
          })
          
          // Show toast to user
          toast.info('📱 Mendaftarkan device token...', 2000)
          
          // Use a promise-based approach to ensure we can catch errors properly
          try {
            await new Promise<void>((resolve, reject) => {
              registerToken.mutate({
                token: tokenValue,
                deviceInfo,
              }, {
                onSuccess: (data) => {
                  console.log('[PushNotificationSetup] ✅✅ Token registered successfully in backend!', {
                    data,
                    userId,
                    userName,
                    userEmail,
                    tokenLength: tokenValue.length,
                    tokenPrefix: tokenValue.substring(0, 30) + '...',
                  })
                  setIsRegistered(true)
                  setRegistrationError(null)
                  // Update lastUserId to current user
                  lastUserIdRef.current = userId
                  
                  // Show success toast
                  toast.success('✅ Device token berhasil terdaftar!', 3000)
                  
                  resolve()
                },
                onError: (error) => {
                  console.error('[PushNotificationSetup] ❌ Error registering token in backend:', error)
                  console.error('[PushNotificationSetup] Error type:', typeof error)
                  
                  // TRPC errors have different structure
                  let errorMsg = 'Unknown error'
                  if (error instanceof Error) {
                    errorMsg = error.message
                  } else if (error && typeof error === 'object') {
                    // Try to extract message from TRPC error structure
                    const trpcError = error as any
                    errorMsg = trpcError.message || 
                               trpcError.data?.message || 
                               trpcError.shape?.message || 
                               trpcError.cause?.message ||
                               String(error)
                  } else {
                    errorMsg = String(error)
                  }
                  
                  console.error('[PushNotificationSetup] Error message:', errorMsg)
                  console.error('[PushNotificationSetup] Error data:', (error as any)?.data)
                  console.error('[PushNotificationSetup] Error shape:', (error as any)?.shape)
                  
                  // TRPC errors don't have stack property
                  const errorDetails = error instanceof Error 
                    ? { message: error.message, stack: error.stack }
                    : { message: errorMsg, error: String(error) }
                  console.error('[PushNotificationSetup] Error details:', errorDetails)
                  
                  const fullErrorMsg = 'Failed to register device token: ' + errorMsg
                  setRegistrationError(fullErrorMsg)
                  
                  // Show error toast
                  toast.error('❌ Gagal mendaftarkan token: ' + errorMsg, 5000)
                  
                  // Reset setupAttempted to allow retry
                  setupAttempted.current = false
                  
                  reject(error)
                },
              })
            })
          } catch (error) {
            console.error('[PushNotificationSetup] ❌ Exception registering token:', error)
            const errorDetails = error instanceof Error
              ? {
                  errorType: typeof error,
                  errorMessage: error.message,
                  errorStack: error.stack,
                }
              : {
                  errorType: typeof error,
                  errorMessage: String(error),
                }
            console.error('[PushNotificationSetup] Exception details:', errorDetails)
            const errorMsg = 'Exception registering token: ' + (error instanceof Error ? error.message : 'Unknown error')
            setRegistrationError(errorMsg)
            
            // Show error toast
            toast.error('❌ ' + errorMsg, 5000)
            
            setupAttempted.current = false
            
            // Retry after 5 seconds
            console.log('[PushNotificationSetup] ⏳ Will retry token registration in 5 seconds...')
            setTimeout(() => {
              if (isMounted && currentSession?.user?.id && deviceTokenRef.current) {
                console.log('[PushNotificationSetup] 🔄 Retrying token registration...')
                setupAttempted.current = false
                // Trigger re-initialization by resetting lastUserId
                lastUserIdRef.current = null
              }
            }, 5000)
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
        
        // Now call register() to trigger FCM token generation
        console.log('[PushNotificationSetup] 🚀 Calling PushNotifications.register() to get FCM token...')
        toast.info('📱 Mendaftarkan device token...', 3000)
        await PushNotifications.register()
        console.log('[PushNotificationSetup] ⏳ Waiting for registration event...')
        
        // Set timeout to detect if token is never received
        setTimeout(() => {
          if (!tokenReceived) {
            console.warn('[PushNotificationSetup] ⚠️ Token not received after 10 seconds!')
            console.warn('[PushNotificationSetup] This might indicate:')
            console.warn('[PushNotificationSetup] 1. FCM configuration issue (google-services.json)')
            console.warn('[PushNotificationSetup] 2. Network connectivity issue')
            console.warn('[PushNotificationSetup] 3. Registration event listener not firing')
            console.warn('[PushNotificationSetup] Current state:', {
              setupAttempted: setupAttempted.current,
              hasSession: !!session,
              userId: session?.user?.id,
              tokenReceived: tokenReceived,
            })
            
            setRegistrationError('FCM token not received. Please check your internet connection and try again.')
            toast.error('❌ Gagal mendapatkan token FCM. Cek koneksi internet Anda.', 5000)
            setupAttempted.current = false // Allow retry
          }
        }, 10000) // 10 second timeout

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
