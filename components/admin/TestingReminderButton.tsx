'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { BellIcon, RotateCcwIcon, InfoIcon, AlertTriangleIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '../ui/ToastContainer'

export default function TestingReminderButton() {
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const testReminder = trpc.schedule.testReminder.useMutation({
    onSuccess: (data) => {
      console.log('[SUCCESS]', `✅ Test Reminder berhasil!\n` +
        `Dikirim ke ${data.totalSent} device\n` +
        `Gagal: ${data.totalFailed} device\n` +
        `Kelas yang diproses: ${data.processedClasses}\n` +
        `Besok: ${data.tomorrow}`)
      setTesting(false)
    },
    onError: (error) => {
      console.error('[ERROR]', `❌ Error: ${error.message}`)
      setTesting(false)
    },
  })

  const syncSchedules = trpc.schedule.syncFromWeeklySchedule.useMutation({
    onSuccess: (data) => {
      console.log('[SUCCESS]', `✅ Sync berhasil!\n` +
        `Data yang di-sync: ${data.syncedCount}\n` +
        `Data yang dilewati: ${data.skippedCount}\n` +
        `Total jadwal: ${data.totalWeeklySchedules}`)
      setSyncing(false)
    },
    onError: (error) => {
      console.error('[ERROR]', `❌ Error: ${error.message}`)
      setSyncing(false)
    },
  })

  const handleTestReminder = () => {
    if (window.confirm('Kirim test reminder sekarang? Notifikasi akan dikirim ke user yang memiliki PR yang belum selesai untuk pelajaran besok. Setiap user akan mendapat notifikasi detail dengan daftar PR mereka.')) {
      setTesting(true)
      testReminder.mutate()
    }
  }

  const handleSyncSchedules = () => {
    if (window.confirm('Sync jadwal dari weekly_schedules ke class_schedules? Ini akan mengisi tabel class_schedules dengan data dari jadwal yang sudah ada di aplikasi.')) {
      setSyncing(true)
      syncSchedules.mutate()
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
        Notifikasi akan dikirim ke user yang memiliki PR yang belum selesai untuk pelajaran besok.
        Setiap user akan mendapat notifikasi detail dengan daftar PR mereka yang belum selesai.
      </p>
      <div style={{
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '0.375rem',
        fontSize: '0.8125rem',
      }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <InfoIcon size={14} />
          <span>Tips:</span>
        </strong>
        <span style={{ marginLeft: '1.5rem', display: 'block', marginTop: '0.25rem' }}>
          Jika notifikasi tidak muncul, pastikan tabel <code>class_schedules</code> sudah terisi. 
          Klik tombol "Sync Jadwal" di bawah untuk mengisi tabel dari jadwal yang sudah ada di aplikasi.
        </span>
      </div>
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={handleTestReminder}
          disabled={testing || syncing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: testing ? 'var(--bg-secondary)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: testing || syncing ? 'not-allowed' : 'pointer',
            opacity: testing || syncing ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!testing && !syncing) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {testing ? (
            <>
              <LoadingSpinner size={16} color="white" />
              <span>Mengirim Reminder...</span>
            </>
          ) : (
            <>
              <BellIcon size={16} />
              <span>Test Reminder</span>
            </>
          )}
        </button>
        <button
          onClick={handleSyncSchedules}
          disabled={syncing || testing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: syncing ? 'var(--bg-secondary)' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: syncing || testing ? 'not-allowed' : 'pointer',
            opacity: syncing || testing ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!syncing && !testing) {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {syncing ? (
            <>
              <LoadingSpinner size={16} color="white" />
              <span>Mensinkronkan...</span>
            </>
          ) : (
            <>
              <RotateCcwIcon size={16} />
              <span>Sync Jadwal</span>
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
        <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangleIcon size={14} />
          <span>Catatan:</span>
        </strong>
        <span style={{ marginLeft: '1.5rem', display: 'block', marginTop: '0.25rem' }}>
          Notifikasi akan dikirim ke semua device yang terdaftar di kelas yang memiliki jadwal untuk besok. 
          Pastikan Anda benar-benar ingin mengirim notifikasi test sebelum klik tombol.
        </span>
      </div>
    </div>
  )
}

