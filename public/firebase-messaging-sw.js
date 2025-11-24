// Service Worker for Firebase Cloud Messaging
// This file must be in the public folder
// NOTE: Firebase config will be injected by the main app via postMessage

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

let messaging = null
let firebaseInitialized = false

// Listen for Firebase config from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && !firebaseInitialized) {
    const firebaseConfig = event.data.config
    
    try {
      firebase.initializeApp(firebaseConfig)
      messaging = firebase.messaging()
      firebaseInitialized = true
      console.log('[firebase-messaging-sw.js] ✅ Firebase initialized')
    } catch (error) {
      console.error('[firebase-messaging-sw.js] ❌ Error initializing Firebase:', error)
    }
  }
})

// Handle background messages (when app is closed)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received')
  
  let notificationData = {}
  try {
    notificationData = event.data ? event.data.json() : {}
  } catch (e) {
    console.error('[firebase-messaging-sw.js] Error parsing push data:', e)
  }

  const notificationTitle = notificationData.notification?.title || notificationData.data?.title || 'TuntasinAja'
  const notificationOptions = {
    body: notificationData.notification?.body || notificationData.data?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: notificationData.data?.tag || 'tuntasinaja-notification',
    data: notificationData.data || {},
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  )
})

// Handle background messages from FCM (when app is in background)
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  
  const notificationTitle = payload.notification?.title || 'TuntasinAja'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: payload.data?.tag || 'tuntasinaja-notification',
    data: payload.data || {},
  }

    return self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.')
  
  event.notification.close()

  // Open the app
  const urlToOpen = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

