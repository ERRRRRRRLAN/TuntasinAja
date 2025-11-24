import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging, Messaging } from 'firebase-admin/messaging'

let adminApp: App | undefined
let messaging: Messaging | undefined

// Initialize Firebase Admin SDK
export function getFirebaseAdmin(): { app: App; messaging: Messaging } | null {
  // Return existing instance if already initialized
  if (adminApp && messaging) {
    return { app: adminApp, messaging }
  }

  // Check if Firebase Admin is already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    messaging = getMessaging(adminApp)
    return { app: adminApp, messaging }
  }

  // Initialize Firebase Admin
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    
    if (!serviceAccount) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY not configured')
      return null
    }

    // Parse service account key (should be JSON string)
    let serviceAccountKey
    try {
      serviceAccountKey = JSON.parse(serviceAccount)
    } catch {
      // If not JSON, try to parse as base64
      try {
        serviceAccountKey = JSON.parse(Buffer.from(serviceAccount, 'base64').toString())
      } catch {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY')
        return null
      }
    }

    adminApp = initializeApp({
      credential: cert(serviceAccountKey),
    })

    messaging = getMessaging(adminApp)
    
    console.log('✅ Firebase Admin initialized')
    return { app: adminApp, messaging }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error)
    return null
  }
}

// Send push notification to a single device
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const admin = getFirebaseAdmin()
  if (!admin) {
    console.error('Firebase Admin not initialized')
    return false
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
        },
        fcmOptions: {
          link: data?.url || '/',
        },
      },
    }

    const response = await admin.messaging.send(message)
    console.log('✅ Push notification sent successfully:', response)
    return true
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error)
    
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('⚠️ Invalid or unregistered FCM token, should be removed from database')
    }
    
    return false
  }
}

// Send push notification to multiple devices
export async function sendPushNotificationToMultiple(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: number; failure: number }> {
  const admin = getFirebaseAdmin()
  if (!admin) {
    console.error('Firebase Admin not initialized')
    return { success: 0, failure: fcmTokens.length }
  }

  if (fcmTokens.length === 0) {
    return { success: 0, failure: 0 }
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
        },
        fcmOptions: {
          link: data?.url || '/',
        },
      },
      tokens: fcmTokens,
    }

    const response = await admin.messaging.sendEachForMulticast(message)
    
    console.log(`✅ Push notifications sent: ${response.successCount} success, ${response.failureCount} failure`)
    
    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error
          if (error?.code === 'messaging/invalid-registration-token' || 
              error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(fcmTokens[idx])
          }
        }
      })
      
      if (invalidTokens.length > 0) {
        console.warn(`⚠️ Found ${invalidTokens.length} invalid tokens, should be removed from database`)
      }
    }
    
    return {
      success: response.successCount,
      failure: response.failureCount,
    }
  } catch (error) {
    console.error('❌ Error sending multicast push notification:', error)
    return { success: 0, failure: fcmTokens.length }
  }
}

