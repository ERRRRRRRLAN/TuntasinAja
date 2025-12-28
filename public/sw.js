// Service Worker untuk TuntasinAja
const CACHE_NAME = 'tuntasin-v2'
const OFFLINE_URL = '/offline.html'

// Assets yang akan di-cache saat install
const urlsToCache = [
  '/offline.html',
  '/logo.svg',
  '/manifest.json',
]

// Request yang harus selalu dari network (tidak di-cache)
const networkOnlyPatterns = [
  '/api/',
  '/_next/',
  '/auth/',
  '/trpc',
]

// Fungsi untuk cek apakah request harus selalu dari network
function shouldUseNetworkOnly(url) {
  return networkOnlyPatterns.some(pattern => url.includes(pattern))
}

// Install event - cache assets penting
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets')
        // Cache hanya file statis, jangan cache root karena bisa berubah
        return cache.addAll(
          urlsToCache
            .map(url => new Request(url, { cache: 'reload' }))
            .filter(Boolean)
        )
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[Service Worker] Error caching assets:', error)
        // Jangan gagal install jika cache error
        return self.skipWaiting()
      })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim()
    })
  )
})

// Fetch event - network first untuk API, cache first untuk assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Skip cross-origin requests (kecuali same origin)
  if (url.origin !== location.origin) {
    return
  }

  // API routes dan Next.js internal - selalu dari network
  if (shouldUseNetworkOnly(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response
        })
        .catch((error) => {
          console.error('[Service Worker] Network request failed:', error)
          // Return error response untuk API routes
          return new Response(
            JSON.stringify({ error: 'Network request failed' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
            }
          )
        })
    )
    return
  }

  // Untuk request lainnya: network first, fallback ke cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Hanya cache response yang valid
        if (response && response.status === 200 && response.type === 'basic') {
          // Clone response untuk cache
          const responseToCache = response.clone()
          
          // Cache response (async, tidak blocking)
          caches.open(CACHE_NAME).then((cache) => {
            // Hanya cache static assets, bukan HTML pages
            if (
              !request.url.includes('/api/') &&
              !request.url.includes('/_next/') &&
              (request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) || 
               request.url === location.origin + '/')
            ) {
              cache.put(request, responseToCache).catch((err) => {
                console.error('[Service Worker] Error caching:', err)
              })
            }
          })
        }
        
        return response
      })
      .catch((error) => {
        console.log('[Service Worker] Network failed, trying cache:', error)
        
        // Fallback ke cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Jika navigation request dan tidak ada cache, return offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL).then((offlinePage) => {
              return offlinePage || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html',
                }),
              })
            })
          }

          // Untuk request lainnya, return error
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
      })
  )
})

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Web Push Notification Handler
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push notification received:', event)
  
  let notificationData = {
    title: 'TuntasinAja',
    body: 'Anda memiliki notifikasi baru',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'default',
    data: {},
  }

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || notificationData.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
      }
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e)
      // Fallback: try to get text
      const text = event.data.text()
      if (text) {
        notificationData.body = text
      }
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  )
})

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event.notification)
  
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
      .then(function(clientList) {
        // Cek apakah sudah ada window yang terbuka dengan URL yang sama
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          const clientUrl = new URL(client.url)
          const targetUrl = new URL(urlToOpen, self.location.origin)
          
          if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Buka window baru jika belum ada
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event.notification)
})

