import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging, Messaging } from 'firebase-admin/messaging'
import webpush from 'web-push'

let messaging: Messaging | null = null

export function getFirebaseMessaging(): Messaging {
  if (messaging) {
    return messaging
  }

  // Initialize Firebase Admin if not already initialized
  let app: App
  const apps = getApps()
  
  if (apps.length === 0) {
    // Check if we have Firebase credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please set it with your Firebase service account JSON.')
    }

    try {
      // Clean the service account string - remove any leading/trailing quotes or whitespace
      let cleanedServiceAccount = serviceAccount.trim()
      
      // Remove surrounding quotes if present
      if ((cleanedServiceAccount.startsWith('"') && cleanedServiceAccount.endsWith('"')) ||
          (cleanedServiceAccount.startsWith("'") && cleanedServiceAccount.endsWith("'"))) {
        cleanedServiceAccount = cleanedServiceAccount.slice(1, -1)
      }
      
      // Unescape any escaped quotes
      cleanedServiceAccount = cleanedServiceAccount.replace(/\\"/g, '"').replace(/\\'/g, "'")
      
      const serviceAccountJson = JSON.parse(cleanedServiceAccount)
      
      // Validate required fields
      if (!serviceAccountJson.project_id || !serviceAccountJson.private_key || !serviceAccountJson.client_email) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields: project_id, private_key, or client_email')
      }
      
      app = initializeApp({
        credential: cert(serviceAccountJson),
      })
      
      console.log('[FirebaseAdmin] ✅ Firebase initialized successfully', {
        projectId: serviceAccountJson.project_id,
        clientEmail: serviceAccountJson.client_email,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[FirebaseAdmin] ❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', {
        error: errorMessage,
        serviceAccountLength: serviceAccount.length,
        serviceAccountPrefix: serviceAccount.substring(0, 50) + '...',
      })
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${errorMessage}. Please check that the value is valid JSON without surrounding quotes.`)
    }
  } else {
    app = apps[0]
  }

  messaging = getMessaging(app)
  return messaging
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    console.log('[FirebaseAdmin] Sending push notification:', {
      tokenCount: tokens.length,
      title,
      body,
      data,
    })

    const messaging = getFirebaseMessaging()
    
    // Convert data values to strings (FCM requires string values)
    const dataPayload: Record<string, string> = {}
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        dataPayload[key] = String(value)
      }
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: dataPayload,
      tokens,
      // Add Android-specific config
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default', // Will be controlled by user settings on client
          channelId: 'default', // Android notification channel
          // Vibration will be controlled by user settings on client
        },
      },
      // Add APNS-specific config for iOS (if needed in future)
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default', // Will be controlled by user settings on client
            // Vibration/badge will be controlled by user settings on client
          },
        },
      },
    }

    const response = await messaging.sendEachForMulticast(message)
    
    console.log('[FirebaseAdmin] ✅ Push notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
    })

    // Log failures if any
    if (response.failureCount > 0) {
      console.error('[FirebaseAdmin] ❌ Some notifications failed:')
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(`  Token ${index}: ${resp.error?.code} - ${resp.error?.message}`)
        }
      })
    }
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    }
  } catch (error) {
    console.error('[FirebaseAdmin] ❌ Error sending push notification:', error)
    throw error
  }
}

// Initialize Web Push VAPID keys
let vapidInitialized = false

function initializeVAPID() {
  if (vapidInitialized) {
    return
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL || 'noreply@tuntasinaja.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[WebPush] VAPID keys not configured. Web Push notifications will be disabled.')
    return
  }

  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  )

  vapidInitialized = true
  console.log('[WebPush] ✅ VAPID keys initialized')
}

// Send Web Push notification
export async function sendWebPushNotification(
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  },
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    initializeVAPID()

    if (!vapidInitialized) {
      console.warn('[WebPush] VAPID not initialized, skipping Web Push')
      return { success: false, error: 'VAPID not configured' }
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data || {},
      tag: data?.tag || 'default',
      requireInteraction: false,
      silent: false,
    })

    await webpush.sendNotification(subscription, payload)
    
    console.log('[WebPush] ✅ Web Push notification sent:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      title,
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[WebPush] ❌ Error sending Web Push notification:', errorMessage)
    
    // If subscription is invalid (410 Gone), we should delete it
    if (errorMessage.includes('410') || errorMessage.includes('Gone')) {
      return { success: false, error: 'Subscription expired', shouldDelete: true }
    }
    
    return { success: false, error: errorMessage }
  }
}

// Send Web Push notifications to multiple subscriptions
export async function sendWebPushNotifications(
  subscriptions: Array<{
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }>,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendWebPushNotification(sub, title, body, data))
  )

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failureCount = results.length - successCount
  const expiredSubscriptions: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.shouldDelete) {
      expiredSubscriptions.push(subscriptions[index].endpoint)
    }
  })

  return {
    successCount,
    failureCount,
    expiredSubscriptions,
  }
}

