'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TestDeadlineReminderButton() {
  const [isTesting, setIsTesting] = useState(false)

  const testReminder = trpc.thread.testDeadlineReminder.useMutation({
    onSuccess: (data) => {
      toast.success(
        `✅ Deadline reminder berhasil!\n\n` +
        `Users diproses: ${data.usersProcessed}\n` +
        `Notifikasi terkirim: ${data.totalSent}`,
        5000
      )
      setIsTesting(false)
    },
    onError: (error) => {
      toast.error(`❌ Error: ${error.message}`, 5000)
      setIsTesting(false)
    },
  })

  const handleTest = () => {
    if (isTesting) return

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengirim deadline reminder sekarang?\n\n' +
      'Notifikasi akan dikirim ke semua user yang:\n' +
      '- Memiliki deadline reminder enabled\n' +
      '- Memiliki reminder time dalam 30 menit dari waktu sekarang\n' +
      '- Memiliki tugas dengan deadline besok yang belum selesai'
    )

    if (!confirmed) return

    setIsTesting(true)
    testReminder.mutate()
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
        🔔 Test Deadline Reminder
      </h3>
      <p style={{
        color: 'var(--text-light)',
        fontSize: '0.875rem',
        marginBottom: '1rem',
      }}>
        Gunakan tombol di bawah untuk mengirim deadline reminder secara manual ke user yang memenuhi kriteria.
      </p>
      <div style={{
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.375rem',
        fontSize: '0.8125rem',
      }}>
        <strong>ℹ️ Kriteria:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>User memiliki deadline reminder enabled</li>
          <li>Reminder time dalam 30 menit dari waktu sekarang</li>
          <li>Ada tugas/sub-tugas dengan deadline besok yang belum selesai</li>
        </ul>
      </div>
      <button
        onClick={handleTest}
        disabled={isTesting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: isTesting ? 'var(--bg-secondary)' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: isTesting ? 'not-allowed' : 'pointer',
          opacity: isTesting ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isTesting) {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {isTesting ? (
          <>
            <LoadingSpinner size={16} color="white" />
            <span>Mengirim reminder...</span>
          </>
        ) : (
          <>
            <span>🔔</span>
            <span>Test Deadline Reminder</span>
          </>
        )}
      </button>
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '0.375rem',
        fontSize: '0.8125rem',
        color: 'var(--text-light)',
      }}>
        <strong>⚠️ Catatan:</strong> Notifikasi akan dikirim ke semua user yang memenuhi kriteria di atas. 
        Pastikan Anda benar-benar ingin mengirim notifikasi test sebelum klik tombol.
      </div>
    </div>
  )
}

