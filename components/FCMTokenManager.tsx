'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase'
import { registerFirebaseServiceWorker } from '@/lib/firebase-sw-register'
import { trpc } from '@/lib/trpc'
import { notificationService } from '@/lib/notification-service'

export default function FCMTokenManager() {
  const { data: session } = useSession()
  const [tokenRegistered, setTokenRegistered] = useState(false)
  const utils = trpc.useUtils()

  const saveFCMToken = trpc.auth.saveFCMToken.useMutation({
    onSuccess: () => {
      console.log('✅ FCM token saved to database')
      setTokenRegistered(true)
    },
    onError: (error) => {
      console.error('❌ Error saving FCM token:', error)
    },
  })

  // Register Service Worker first
  useEffect(() => {
    if (!session) {
      return
    }

    registerFirebaseServiceWorker().catch(console.error)
  }, [session])

  // Register FCM token when user logs in
  useEffect(() => {
    if (!session) {
      return
    }

    const registerToken = async () => {
      try {
        // Wait for service worker to be ready
        await new Promise((resolve) => setTimeout(resolve, 2000))
        
        console.log('🔔 Registering FCM token...')
        const token = await requestFCMToken()
        
        if (token) {
          // Save token to database
          saveFCMToken.mutate({ fcmToken: token })
        } else {
          console.warn('⚠️ Could not get FCM token')
        }
      } catch (error) {
        console.error('❌ Error registering FCM token:', error)
      }
    }

    // Wait a bit for Firebase and Service Worker to initialize
    const timer = setTimeout(registerToken, 2000)
    
    return () => clearTimeout(timer)
  }, [session, saveFCMToken])

  // Listen for foreground messages (when app is open)
  useEffect(() => {
    if (!session) {
      return
    }

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📬 Received foreground message:', payload)
      
      // Show browser notification
      const title = payload.notification?.title || payload.data?.title || 'TuntasinAja'
      const body = payload.notification?.body || payload.data?.body || ''
      
      notificationService.showNotification(title, {
        body,
        tag: payload.data?.tag || 'fcm-notification',
        data: {
          url: payload.data?.url || '/',
        },
      }).catch(console.error)
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [session])

  return null
}

