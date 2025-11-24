'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { notificationService } from '@/lib/notification-service'

export default function NotificationTestButton() {
  const { data: session } = useSession()
  const [isTesting, setIsTesting] = useState(false)

  const handleTestNotification = async () => {
    if (!session) {
      alert('Silakan login terlebih dahulu')
      return
    }

    setIsTesting(true)
    try {
      // Test permission first
      const permission = await notificationService.requestPermission()
      console.log('🔔 Test - Permission:', permission)

      if (permission === 'granted') {
        // Test showing a notification
        await notificationService.showNotification('Test Notifikasi', {
          body: 'Ini adalah test notifikasi dari TuntasinAja',
          tag: 'test-notification',
        })
        alert('✅ Test notifikasi berhasil! Cek notifikasi di browser Anda.')
      } else {
        alert(`⚠️ Permission: ${permission}\n\nSilakan izinkan notifikasi di browser settings.`)
      }
    } catch (error) {
      console.error('Error testing notification:', error)
      alert('❌ Error: ' + (error as Error).message)
    } finally {
      setIsTesting(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <button
      onClick={handleTestNotification}
      disabled={isTesting}
      style={{
        padding: '0.5rem 1rem',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: isTesting ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        opacity: isTesting ? 0.6 : 1,
      }}
    >
      {isTesting ? 'Testing...' : '🔔 Test Notifikasi'}
    </button>
  )
}

