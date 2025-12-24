'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'

// Manual button to re-register push notifications
export default function ManualPushRegistration() {
  const [isLoading, setIsLoading] = useState(false)
  const registerToken = trpc.notification.registerToken.useMutation()

  const handleRegister = async () => {
    try {
      setIsLoading(true)
      console.log('[ManualRegister] ========== STARTING MANUAL REGISTRATION ==========')

      // Load Capacitor
      const { Capacitor, PushNotifications } = await loadCapacitor()
      
      if (!Capacitor || !PushNotifications) {
        console.error('[ERROR] ❌ Fitur ini hanya tersedia di aplikasi mobile')
        return
      }

      const platform = Capacitor.getPlatform()
      console.log('[ManualRegister] Platform:', platform)

      if (platform !== 'android' && platform !== 'ios') {
        console.error('[ERROR] ❌ Fitur ini hanya tersedia di aplikasi mobile')
        return
      }

      // Request permissions
      console.log('[ManualRegister] Requesting permissions...')
      console.info('[INFO] 🔐 Meminta izin notifikasi...')
      
      const permResult = await PushNotifications.requestPermissions()
      console.log('[ManualRegister] Permission result:', permResult)

      if (permResult.receive !== 'granted') {
        console.error('[ERROR] ❌ Izin notifikasi ditolak. Aktifkan di Pengaturan sistem.')
        return
      }

        // Setup listener
        console.log('[ManualRegister] Setting up listener...')
        let tokenReceived = false

        const registrationListener = await PushNotifications.addListener(
          'registration',
          async (token: any) => {
            if (tokenReceived) return
            tokenReceived = true

            console.log('[ManualRegister] Token received:', token)
            
            const tokenValue = token?.value || token?.token || token
            
            if (!tokenValue || typeof tokenValue !== 'string') {
              console.error('[ManualRegister] Invalid token:', token)
              console.error('[ERROR] ❌ Token tidak valid')
              setIsLoading(false)
              return
            }

            console.log('[ManualRegister] Token length:', tokenValue.length)
            console.log('[ManualRegister] Registering with backend...')

            registerToken.mutate(
              {
                token: tokenValue,
                deviceInfo: platform,
              },
              {
                onSuccess: async () => {
                  console.log('[ManualRegister] ========== SUCCESS ==========')
                  console.log('[SUCCESS] ✅ Notifikasi berhasil terdaftar!')
                  setIsLoading(false)
                  // Remove listener
                  await registrationListener.remove()
                },
                onError: async (error) => {
                  console.error('[ManualRegister] ========== ERROR ==========')
                  console.error('[ManualRegister] Error:', error)
                  
                  const errorMsg = 
                    error instanceof Error ? error.message :
                    (error as any)?.message || 
                    'Unknown error'
                  
                  console.error('[ERROR]', `❌ Gagal: ${errorMsg}`)
                  setIsLoading(false)
                  // Remove listener
                  await registrationListener.remove()
                },
              }
            )
          }
        )

      // Register with FCM
      console.log('[ManualRegister] Calling FCM register()...')
      console.info('[INFO] 📱 Mendaftarkan dengan FCM...')
      await PushNotifications.register()

      // Timeout
      setTimeout(async () => {
        if (!tokenReceived) {
          console.error('[ManualRegister] TIMEOUT - No token received')
          console.error('[ERROR] ❌ Timeout - Cek koneksi internet')
          setIsLoading(false)
          await registrationListener.remove()
        }
      }, 15000)

    } catch (error) {
      console.error('[ManualRegister] Error:', error)
      console.error('[ERROR] ❌ Terjadi kesalahan')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isLoading}
      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? '⏳ Mendaftarkan...' : '🔄 Daftar Ulang Notifikasi'}
    </button>
  )
}

// Helper to load Capacitor
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
    return { Capacitor: null, PushNotifications: null }
  }
}

