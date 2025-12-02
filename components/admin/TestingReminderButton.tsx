'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { BellIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '../ui/ToastContainer'

export default function TestingReminderButton() {
  const [testingMaghrib, setTestingMaghrib] = useState(false)
  const [testingMalam, setTestingMalam] = useState(false)

  const testMaghrib = trpc.schedule.testReminderMaghrib.useMutation({
    onSuccess: (data) => {
      toast.success(
        `✅ Test Reminder Maghrib berhasil!\n` +
        `Dikirim ke ${data.totalSent} device\n` +
        `Kelas yang diproses: ${data.processedClasses}\n` +
        `Besok: ${data.tomorrow}`,
        { autoClose: 5000 }
      )
      setTestingMaghrib(false)
    },
    onError: (error) => {
      toast.error(`❌ Error: ${error.message}`, { autoClose: 5000 })
      setTestingMaghrib(false)
    },
  })

  const testMalam = trpc.schedule.testReminderMalam.useMutation({
    onSuccess: (data) => {
      toast.success(
        `✅ Test Reminder Malam berhasil!\n` +
        `Dikirim ke ${data.totalSent} device\n` +
        `Kelas yang diproses: ${data.processedClasses}\n` +
        `Besok: ${data.tomorrow}`,
        { autoClose: 5000 }
      )
      setTestingMalam(false)
    },
    onError: (error) => {
      toast.error(`❌ Error: ${error.message}`, { autoClose: 5000 })
      setTestingMalam(false)
    },
  })

  const handleTestMaghrib = () => {
    if (window.confirm('Kirim test reminder Maghrib sekarang? Notifikasi akan dikirim ke semua user di kelas yang memiliki jadwal untuk besok.')) {
      setTestingMaghrib(true)
      testMaghrib.mutate()
    }
  }

  const handleTestMalam = () => {
    if (window.confirm('Kirim test reminder Malam sekarang? Notifikasi akan dikirim ke semua user di kelas yang memiliki jadwal untuk besok.')) {
      setTestingMalam(true)
      testMalam.mutate()
    }
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: 600,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <BellIcon size={20} />
        Testing Reminder Notification
      </h3>
      <p style={{
        color: 'var(--text-light)',
        fontSize: '0.875rem',
        marginBottom: '1rem',
      }}>
        Gunakan tombol di bawah untuk test mengirim reminder notification secara manual. 
        Notifikasi akan dikirim ke semua user di kelas yang memiliki jadwal untuk besok.
      </p>
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={handleTestMaghrib}
          disabled={testingMaghrib || testingMalam}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: testingMaghrib ? 'var(--bg-secondary)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: testingMaghrib || testingMalam ? 'not-allowed' : 'pointer',
            opacity: testingMaghrib || testingMalam ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!testingMaghrib && !testingMalam) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {testingMaghrib ? (
            <>
              <LoadingSpinner size={16} color="white" />
              <span>Mengirim Reminder Maghrib...</span>
            </>
          ) : (
            <>
              <BellIcon size={16} />
              <span>Test Reminder Maghrib</span>
            </>
          )}
        </button>
        <button
          onClick={handleTestMalam}
          disabled={testingMaghrib || testingMalam}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: testingMalam ? 'var(--bg-secondary)' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: testingMaghrib || testingMalam ? 'not-allowed' : 'pointer',
            opacity: testingMaghrib || testingMalam ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!testingMaghrib && !testingMalam) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {testingMalam ? (
            <>
              <LoadingSpinner size={16} color="white" />
              <span>Mengirim Reminder Malam...</span>
            </>
          ) : (
            <>
              <BellIcon size={16} />
              <span>Test Reminder Malam</span>
            </>
          )}
        </button>
      </div>
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.375rem',
        fontSize: '0.8125rem',
        color: 'var(--text-light)',
      }}>
        <strong>⚠️ Catatan:</strong> Notifikasi akan dikirim ke semua device yang terdaftar di kelas yang memiliki jadwal untuk besok. 
        Pastikan Anda benar-benar ingin mengirim notifikasi test sebelum klik tombol.
      </div>
    </div>
  )
}

