'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { Capacitor } from '@capacitor/core'
import ManualPushRegistration from './ManualPushRegistration'

export default function DeviceTokenStatus() {
  const { data: session } = useSession()
  const [deviceToken, setDeviceToken] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<'checking' | 'registered' | 'not_registered' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Check if device token is registered in database
  const checkDeviceToken = trpc.notification.checkDeviceToken.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      if (data?.token) {
        setDeviceToken(data.token)
        setRegistrationStatus('registered')
        setErrorMessage(null)
      } else {
        setDeviceToken(null)
        setRegistrationStatus('not_registered')
        setErrorMessage('Device token belum terdaftar. Pastikan Anda sudah mengizinkan notifikasi.')
      }
    },
    onError: (error) => {
      setRegistrationStatus('error')
      setErrorMessage(error.message || 'Gagal mengecek status device token')
    },
  })

  // Try to get token from Capacitor if available
  useEffect(() => {
    const checkCapacitorToken = async () => {
      if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
        return
      }

      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        // Note: Capacitor doesn't have a direct method to get current token
        // We rely on the database check instead
      } catch (e) {
        // Ignore
      }
    }

    checkCapacitorToken()
  }, [])

  const handleRetry = () => {
    setIsChecking(true)
    checkDeviceToken.refetch().finally(() => {
      setIsChecking(false)
    })
  }

  if (!session) {
    return null
  }

  const isNative = Capacitor.isNativePlatform()

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginTop: '1rem',
    }}>
      <h4 style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        📱 Status Device Token
      </h4>
      
      {!isNative && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          color: 'var(--text-light)',
          marginBottom: '0.75rem',
        }}>
          ⚠️ Fitur ini hanya tersedia di aplikasi mobile (Android/iOS)
        </div>
      )}

      {isNative && (
        <>
          {registrationStatus === 'checking' && (
            <div style={{
              padding: '0.75rem',
              fontSize: '0.8125rem',
              color: 'var(--text-light)',
            }}>
              🔄 Mengecek status device token...
            </div>
          )}

          {registrationStatus === 'registered' && deviceToken && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
            }}>
              <div style={{ marginBottom: '0.5rem', color: '#10b981', fontWeight: 600 }}>
                ✅ Device token terdaftar
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-light)',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}>
                Token: {deviceToken.substring(0, 30)}...
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-light)',
                marginTop: '0.5rem',
              }}>
                Notifikasi akan dikirim ke device ini.
              </div>
            </div>
          )}

          {registrationStatus === 'not_registered' && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
            }}>
              <div style={{ marginBottom: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
                ❌ Device token belum terdaftar
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                {errorMessage || 'Device token belum terdaftar di database. Coba langkah berikut:'}
              </div>
              <ol style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-light)',
                marginLeft: '1.25rem',
                marginBottom: '0.75rem',
              }}>
                <li>Pastikan Anda sudah mengizinkan notifikasi</li>
                <li>Logout dan login ulang</li>
                <li>Atau restart aplikasi</li>
              </ol>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={handleRetry}
                  disabled={isChecking}
                  style={{
                    padding: '0.5rem 1rem',
                    background: isChecking ? 'var(--bg-secondary)' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: isChecking ? 'not-allowed' : 'pointer',
                    opacity: isChecking ? 0.6 : 1,
                  }}
                >
                  {isChecking ? '🔄 Mengecek...' : '🔄 Cek Ulang'}
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                Atau coba daftar ulang secara manual:
              </div>
              <ManualPushRegistration />
            </div>
          )}

          {registrationStatus === 'error' && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
            }}>
              <div style={{ marginBottom: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
                ❌ Error
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                {errorMessage}
              </div>
              <button
                onClick={handleRetry}
                disabled={isChecking}
                style={{
                  padding: '0.5rem 1rem',
                  background: isChecking ? 'var(--bg-secondary)' : '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: isChecking ? 'not-allowed' : 'pointer',
                  opacity: isChecking ? 0.6 : 1,
                }}
              >
                {isChecking ? '🔄 Mengecek...' : '🔄 Coba Lagi'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

