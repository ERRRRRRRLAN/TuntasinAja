import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging, Messaging } from 'firebase-admin/messaging'

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
      const serviceAccountJson = JSON.parse(serviceAccount)
      app = initializeApp({
        credential: cert(serviceAccountJson),
      })
    } catch (error) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${error}`)
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
      },
      // Add APNS-specific config for iOS (if needed in future)
      apns: {
        headers: {
          'apns-priority': '10',
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

