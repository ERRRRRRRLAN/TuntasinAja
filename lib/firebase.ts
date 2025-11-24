import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

// Firebase configuration
// These values should be in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
let app: FirebaseApp | undefined
if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig)
}

// Get FCM messaging instance
export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!app) {
    console.warn('Firebase app not initialized')
    return null
  }

  try {
    return getMessaging(app)
  } catch (error) {
    console.error('Error getting messaging instance:', error)
    return null
  }
}

// Request FCM token
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  const messaging = getMessagingInstance()
  if (!messaging) {
    return null
  }

  try {
    // VAPID key from Firebase Console
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('FCM VAPID key not configured')
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    if (token) {
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...')
      return token
    } else {
      console.warn('⚠️ No FCM token available')
      return null
    }
  } catch (error: any) {
    console.error('❌ Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const messaging = getMessagingInstance()
  if (!messaging) {
    return () => {}
  }

  try {
    return onMessage(messaging, callback)
  } catch (error) {
    console.error('Error setting up foreground message listener:', error)
    return () => {}
  }
}

export default app

