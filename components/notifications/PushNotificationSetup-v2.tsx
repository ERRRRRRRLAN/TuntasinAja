'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'

// Simplified push notification setup with better debugging
export default function PushNotificationSetup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(false)
  const setupAttempted = useRef(false)
  const listenersRef = useRef<any[]>([])

  const registerToken = trpc.notification.registerToken.useMutation()

  useEffect(() => {
    // Only run on authenticated sessions
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('[PushSetup] Waiting for authentication...', { status })
      return
    }

    // Prevent duplicate setup
    if (setupAttempted.current) {
      console.log('[PushSetup] Setup already attempted')
      return
    }

    setupAttempted.current = true
    let isMounted = true

    const setup = async () => {
      try {
        console.log('[PushSetup] ========== STARTING SETUP ==========')
        console.log('[PushSetup] User:', session.user.name, session.user.id)

        // Step 1: Load Capacitor modules
        console.log('[PushSetup] Step 1: Loading Capacitor modules...')
        const { Capacitor, PushNotifications } = await loadCapacitor()
        
        if (!Capacitor || !PushNotifications) {
          console.log('[PushSetup] Not a native app, skipping')
          return
        }

        const platform = Capacitor.getPlatform()
        console.log('[PushSetup] Platform:', platform)

        if (platform !== 'android' && platform !== 'ios') {
          console.log('[PushSetup] Not a mobile platform, skipping')
          return
        }

        // Step 2: Request permissions
        console.log('[PushSetup] Step 2: Requesting permissions...')
        const permResult = await PushNotifications.requestPermissions()
        console.log('[PushSetup] Permission result:', permResult)

        if (permResult.receive !== 'granted') {
          console.warn('[PushSetup] Permission denied')
          console.error('[ERROR] ❌ Izin notifikasi ditolak')
          setupAttempted.current = false
          return
        }

        console.log('[PushSetup] ✅ Permission granted!')

        // Step 3: Setup registration listener
        console.log('[PushSetup] Step 3: Setting up registration listener...')
        let tokenReceived = false

        const registrationListener = PushNotifications.addListener(
          'registration',
          async (token: any) => {
            if (!isMounted || tokenReceived) {
              console.log('[PushSetup] Ignoring token (unmounted or duplicate)')
              return
            }

            tokenReceived = true
            console.log('[PushSetup] ========== TOKEN RECEIVED ==========')
            console.log('[PushSetup] Token object:', token)

            // Extract token value
            const tokenValue = token?.value || token?.token || token
            
            if (!tokenValue || typeof tokenValue !== 'string') {
              console.error('[PushSetup] ❌ Invalid token:', token)
              console.error('[ERROR] ❌ Token FCM tidak valid')
              setupAttempted.current = false
              return
            }

            console.log('[PushSetup] Token length:', tokenValue.length)
            console.log('[PushSetup] Token preview:', tokenValue.substring(0, 50) + '...')

            // Check session still valid
            if (!session?.user?.id) {
              console.error('[PushSetup] ❌ Session lost!')
              console.error('[ERROR] ❌ Session hilang, silakan login ulang')
              setupAttempted.current = false
              return
            }

            // Register with backend
            console.log('[PushSetup] Registering with backend...')
            console.info('[INFO] 📱 Mendaftarkan notifikasi...')

            registerToken.mutate(
              {
                token: tokenValue,
                deviceInfo: platform,
              },
              {
                onSuccess: () => {
                  console.log('[PushSetup] ========== REGISTRATION SUCCESS ==========')
                  setIsRegistered(true)
                  console.log('[SUCCESS] ✅ Notifikasi berhasil terdaftar!')
                },
                onError: (error) => {
                  console.error('[PushSetup] ========== REGISTRATION ERROR ==========')
                  console.error('[PushSetup] Error:', error)
                  
                  const errorMsg = 
                    error instanceof Error ? error.message :
                    (error as any)?.message || 
                    (error as any)?.data?.message || 
                    'Unknown error'
                  
                  console.error('[ERROR]', `❌ Gagal mendaftar: ${errorMsg}`)
                  setupAttempted.current = false
                },
              }
            )
          }
        )
        listenersRef.current.push(registrationListener)

        // Setup error listener
        const errorListener = PushNotifications.addListener(
          'registrationError',
          (error: any) => {
            console.error('[PushSetup] ❌ Registration error:', error)
            console.error('[ERROR] ❌ Gagal mendaftarkan FCM')
            setupAttempted.current = false
          }
        )
        listenersRef.current.push(errorListener)

        // Setup notification received listener
        const pushListener = PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: any) => {
            console.log('[PushSetup] 📬 Notification received:', notification)
            // Vibrate on notification
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200])
            }
          }
        )
        listenersRef.current.push(pushListener)

        // Setup notification action listener (when tapped)
        const actionListener = PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: any) => {
            console.log('[PushSetup] 🔔 Notification tapped:', notification)
            
            const data = notification.notification?.data
            if (data?.filter) {
              const filterUrl = `/?filter=${encodeURIComponent(data.filter)}`
              setTimeout(() => router.push(filterUrl), 100)
            } else if (data?.deepLink) {
              const url = data.deepLink.startsWith('/') ? data.deepLink : `/${data.deepLink}`
              setTimeout(() => router.push(url), 100)
            }
          }
        )
        listenersRef.current.push(actionListener)

        console.log('[PushSetup] ✅ All listeners setup')

        // Step 4: Register with FCM
        console.log('[PushSetup] Step 4: Calling FCM register()...')
        await PushNotifications.register()
        console.log('[PushSetup] ✅ FCM register() called, waiting for token...')

        // Timeout after 15 seconds
        setTimeout(() => {
          if (!tokenReceived) {
            console.error('[PushSetup] ⏱️ TIMEOUT - Token not received after 15s')
            console.error('[PushSetup] Possible issues:')
            console.error('[PushSetup] 1. google-services.json missing or invalid')
            console.error('[PushSetup] 2. FCM not enabled in Firebase Console')
            console.error('[PushSetup] 3. Network connectivity issue')
            console.error('[PushSetup] 4. Registration event not firing')
            
            console.error('[ERROR] ❌ Timeout mendapatkan token FCM')
            setupAttempted.current = false
          }
        }, 15000)

      } catch (error) {
        console.error('[PushSetup] ❌ Setup error:', error)
        console.error('[ERROR] ❌ Gagal setup notifikasi')
        setupAttempted.current = false
      }
    }

    setup()

    // Cleanup
    return () => {
      isMounted = false
      listenersRef.current.forEach(listener => {
        try {
          listener.remove()
        } catch (e) {
          console.error('[PushSetup] Cleanup error:', e)
        }
      })
      listenersRef.current = []
    }
  }, [session, status])

  return null
}

// Helper to load Capacitor modules
async function loadCapacitor() {
  if (typeof window === 'undefined') {
    return { Capacitor: null, PushNotifications: null }
  }

  try {
    const [capacitorCore, capacitorPush] = await Promise.all([
      import('@capacitor/core').catch(() => null),
      import('@capacitor/push-notifications').catch(() => null),
    ])

    return {
      Capacitor: capacitorCore?.Capacitor || null,
      PushNotifications: capacitorPush?.PushNotifications || null,
    }
  } catch (e) {
    console.log('[PushSetup] Capacitor not available:', e)
    return { Capacitor: null, PushNotifications: null }
  }
}

