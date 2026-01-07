'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { TrashIcon, InfoIcon, AlertTriangleIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '../ui/ToastContainer'

export default function AutoDeleteExpiredButton() {
  const [deleting, setDeleting] = useState(false)

  const deleteExpired = trpc.thread.deleteExpired.useMutation({
    onSuccess: (data) => {
      console.log('[SUCCESS]', `✅ Auto-delete expired berhasil!\n` +
        `Thread yang dihapus: ${data.deleted.threads}\n` +
        `Comment yang dihapus: ${data.deleted.comments}\n` +
        `${data.message}`)
      setDeleting(false)
    },
    onError: (error) => {
      console.error('[ERROR]', `❌ Error: ${error.message}`)
      setDeleting(false)
    },
  })

  const handleDeleteExpired = () => {
    if (window.confirm(
      'Hapus semua thread dan comment yang deadline-nya sudah lewat?\n\n' +
      'Aksi ini akan:\n' +
      '• Menghapus thread dengan deadline yang sudah expired\n' +
      '• Menghapus comment (sub-task) dengan deadline yang sudah expired\n' +
      '• Menghapus thread jika semua sub-task-nya sudah expired\n' +
      '• History tetap tersimpan untuk laporan\n\n' +
      'Apakah Anda yakin ingin melanjutkan?'
    )) {
      setDeleting(true)
      deleteExpired.mutate()
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
        <TrashIcon size={20} />
        Auto-Delete Expired Threads & Comments
      </h3>
      <p style={{
        color: 'var(--text-light)',
        fontSize: '0.875rem',
        marginBottom: '1rem',
      }}>
        Gunakan tombol di bawah untuk menghapus semua thread dan comment yang deadline-nya sudah lewat secara manual.
        Fitur ini biasanya berjalan otomatis melalui cron job, tapi Anda bisa trigger manual jika diperlukan.
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
          <span>Informasi:</span>
        </strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>Thread dengan deadline expired akan dihapus</li>
          <li>Comment (sub-task) dengan deadline expired akan dihapus</li>
          <li>Thread tanpa deadline tapi semua sub-task-nya expired akan dihapus</li>
          <li>History tetap tersimpan untuk laporan</li>
          <li>Thread/comment tanpa deadline tidak akan dihapus</li>
        </ul>
      </div>
      <button
        onClick={handleDeleteExpired}
        disabled={deleting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: deleting ? 'var(--bg-secondary)' : 'var(--danger)',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: deleting ? 'not-allowed' : 'pointer',
          opacity: deleting ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!deleting) {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {deleting ? (
          <>
            <LoadingSpinner size={16} color="white" />
            <span>Menghapus expired items...</span>
          </>
        ) : (
          <>
            <TrashIcon size={16} />
            <span>Hapus Expired Threads & Comments</span>
          </>
        )}
      </button>
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '0.375rem',
        fontSize: '0.8125rem',
        color: 'var(--text-light)',
      }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangleIcon size={14} />
          <span>Peringatan:</span>
        </strong>
        <span style={{ marginLeft: '1.5rem', display: 'block', marginTop: '0.25rem' }}>
          Aksi ini tidak dapat dibatalkan. Pastikan Anda benar-benar ingin menghapus expired items sebelum klik tombol.
        </span>
      </div>
    </div>
  )
}

