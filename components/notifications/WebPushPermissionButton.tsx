'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

/**
 * Button component untuk meminta Web Push permission secara manual
 * Diperlukan untuk iOS karena iOS tidak mengizinkan request permission otomatis
 */
export default function WebPushPermissionButton() {
  const { data: session, status } = useSession()
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  
  const registerWebPush = trpc.notification.registerWebPushToken.useMutation()

  // Check permission status and support
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if browser supports Web Push
    const supported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    // Check current permission status
    if (supported && 'Notification' in window) {
      setPermissionStatus(Notification.permission)
    }

    // Check if running as PWA (standalone mode)
    const isStandalone = 
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (document as any).referrer.includes('android-app://')

    setIsPWA(isStandalone)
  }, [])

  const handleRequestPermission = async () => {
    if (!isSupported) {
      toast.error('Browser Anda tidak mendukung Web Push Notifications')
      return
    }

    setIsRequesting(true)

    try {
      console.log('[WebPushPermissionButton] Requesting notification permission...')

      // Request permission (this requires user interaction on iOS)
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)

      console.log('[WebPushPermissionButton] Permission result:', permission)

      if (permission !== 'granted') {
        toast.error('Izin notifikasi ditolak. Aktifkan di Pengaturan browser.')
        setIsRequesting(false)
        return
      }

      toast.success('Izin notifikasi diberikan!')

      // Wait for service worker to be ready
      let registration: ServiceWorkerRegistration | null = null
      
      try {
        registration = await navigator.serviceWorker.ready
        console.log('[WebPushPermissionButton] Service worker ready')
      } catch (error) {
        console.error('[WebPushPermissionButton] Service worker not ready:', error)
        toast.error('Service worker belum siap. Pastikan PWA sudah di-install.')
        setIsRequesting(false)
        return
      }

      if (!registration || !registration.pushManager) {
        console.error('[WebPushPermissionButton] PushManager not available')
        toast.error('Push Manager tidak tersedia. Pastikan PWA sudah di-install.')
        setIsRequesting(false)
        return
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!vapidPublicKey) {
        console.error('[WebPushPermissionButton] VAPID public key not configured')
        toast.error('Konfigurasi VAPID key belum lengkap')
        setIsRequesting(false)
        return
      }

      // Convert VAPID key to Uint8Array
      function urlBase64ToUint8Array(base64String: string): BufferSource {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        
        return outputArray.buffer
      }

      // Subscribe to push notifications
      console.log('[WebPushPermissionButton] Subscribing to push notifications...')
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      console.log('[WebPushPermissionButton] ✅ Push subscription created')

      // Send subscription to backend
      const subscriptionJSON = subscription.toJSON()
      
      if (!subscriptionJSON.keys?.p256dh || !subscriptionJSON.keys?.auth) {
        throw new Error('Invalid subscription keys')
      }

      await registerWebPush.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth,
        },
        userAgent: navigator.userAgent,
      })

      console.log('[WebPushPermissionButton] ✅ Web Push subscription registered successfully')
      toast.success('Notifikasi Web Push berhasil diaktifkan!')
    } catch (error) {
      console.error('[WebPushPermissionButton] ❌ Error:', error)
      toast.error(`Gagal mengaktifkan notifikasi: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRequesting(false)
    }
  }

  // Don't show if not authenticated
  if (status !== 'authenticated' || !session?.user) {
    return null
  }

  // Don't show if not supported
  if (!isSupported) {
    return (
      <div style={{
        padding: '1rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '0.875rem', 
          color: 'var(--text-light)' 
        }}>
          Browser Anda tidak mendukung Web Push Notifications
        </p>
      </div>
    )
  }

  // Show different UI based on permission status
  if (permissionStatus === 'granted') {
    return (
      <div style={{
        padding: '1rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '0.875rem',
            color: 'var(--text-success)',
            marginBottom: '0.25rem',
          }}>
            ✅ Izin Notifikasi Aktif
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-light)' 
          }}>
            Anda akan menerima notifikasi push untuk tugas baru dan update
          </div>
        </div>
      </div>
    )
  }

  // Show request button for 'default' or 'denied' status
  return (
    <div style={{
      padding: '1rem',
      background: 'var(--bg-secondary)',
      borderRadius: '0.5rem',
      border: '1px solid var(--border)',
    }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: '0.875rem',
          color: 'var(--text)',
          marginBottom: '0.25rem',
        }}>
          {permissionStatus === 'denied' ? '⚠️ Izin Notifikasi Ditolak' : '🔔 Aktifkan Notifikasi Web Push'}
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-light)',
          lineHeight: '1.5',
        }}>
          {permissionStatus === 'denied' 
            ? 'Izin notifikasi ditolak. Buka Pengaturan browser untuk mengaktifkannya kembali.'
            : isPWA
            ? 'Klik tombol di bawah untuk mengaktifkan notifikasi push. Pastikan PWA sudah di-install ke home screen.'
            : 'Untuk iPhone: Install PWA ke home screen terlebih dahulu, lalu klik tombol ini untuk mengaktifkan notifikasi.'}
        </div>
      </div>
      
      <button
        onClick={handleRequestPermission}
        disabled={isRequesting || registerWebPush.isLoading}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          background: permissionStatus === 'denied' ? 'var(--text-light)' : 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: (isRequesting || registerWebPush.isLoading) ? 'not-allowed' : 'pointer',
          opacity: (isRequesting || registerWebPush.isLoading) ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isRequesting && !registerWebPush.isLoading && permissionStatus !== 'denied') {
            e.currentTarget.style.background = 'var(--primary-dark)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isRequesting && !registerWebPush.isLoading && permissionStatus !== 'denied') {
            e.currentTarget.style.background = 'var(--primary)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        {isRequesting || registerWebPush.isLoading ? (
          <>
            <LoadingSpinner size={16} />
            <span>Memproses...</span>
          </>
        ) : (
          <span>
            {permissionStatus === 'denied' ? 'Buka Pengaturan Browser' : 'Aktifkan Notifikasi'}
          </span>
        )}
      </button>

      {permissionStatus === 'denied' && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: 'var(--card)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-light)',
            lineHeight: '1.5',
          }}>
            <strong>Cara mengaktifkan kembali:</strong>
            <ol style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
              <li>Buka Pengaturan iPhone</li>
              <li>Pilih Safari (atau browser yang digunakan)</li>
              <li>Pilih "Situs Web" → "Notifikasi"</li>
              <li>Cari TuntasinAja dan aktifkan</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

