'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/ToastContainer'

export default function TestDeadlineReminderButton() {
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async () => {
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
    toast.info('🔄 Mengirim deadline reminder...', 3000)

    try {
      const response = await fetch('/api/cron/deadline-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test'}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          `✅ Deadline reminder berhasil!\n\n` +
          `Users diproses: ${data.usersProcessed}\n` +
          `Notifikasi terkirim: ${data.totalSent}`,
          5000
        )
      } else {
        toast.error(`❌ Error: ${data.message || data.error}`, 5000)
      }
    } catch (error) {
      console.error('Error testing deadline reminder:', error)
      toast.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 5000)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <button
      onClick={handleTest}
      disabled={isTesting}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: isTesting ? '#94a3b8' : '#f59e0b',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: isTesting ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: isTesting ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isTesting) {
          e.currentTarget.style.backgroundColor = '#d97706'
          e.currentTarget.style.transform = 'scale(1.02)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isTesting) {
          e.currentTarget.style.backgroundColor = '#f59e0b'
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {isTesting ? (
        <>
          <span>⏳</span>
          <span>Mengirim...</span>
        </>
      ) : (
        <>
          <span>🔔</span>
          <span>Test Deadline Reminder</span>
        </>
      )}
    </button>
  )
}

