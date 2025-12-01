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

