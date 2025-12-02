'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '../ui/ToastContainer'

export default function AppSettingsControl() {
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Get current update enabled status
  const { data: updateEnabled, isLoading, refetch } = trpc.appSettings.getUpdateEnabled.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Mutation to toggle update enabled
  const toggleUpdateEnabled = trpc.appSettings.setUpdateEnabled.useMutation({
    onSuccess: () => {
      toast.success('Pengaturan update berhasil diubah')
      refetch()
      setIsUpdating(false)
    },
    onError: (error) => {
      toast.error(`Gagal mengubah pengaturan: ${error.message}`)
      setIsUpdating(false)
    },
  })

  const handleToggle = async () => {
    if (isUpdating || isLoading || updateEnabled === undefined) return

    setIsUpdating(true)
    toggleUpdateEnabled.mutate({ enabled: !updateEnabled })
  }

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>
          Memuat pengaturan...
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '1rem', 
        fontSize: '1.25rem',
        fontWeight: 600,
      }}>
        ⚙️ Pengaturan Aplikasi
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        marginBottom: '1rem',
      }}>
        <div>
          <div style={{ 
            fontWeight: 500, 
            marginBottom: '0.25rem',
            fontSize: '0.95rem',
          }}>
            Notifikasi Update
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-light)',
            marginTop: '0.25rem',
          }}>
            {updateEnabled 
              ? 'User dapat melihat notifikasi update jika ada versi baru' 
              : 'User tidak akan melihat notifikasi update (update dinonaktifkan)'}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: updateEnabled ? 'var(--primary)' : 'var(--bg-secondary)',
            color: updateEnabled ? 'white' : 'var(--text)',
            border: `1px solid ${updateEnabled ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '6px',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: isUpdating ? 0.6 : 1,
            transition: 'all 0.2s',
            minWidth: '100px',
          }}
          onMouseEnter={(e) => {
            if (!isUpdating) {
              e.currentTarget.style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            if (!isUpdating) {
              e.currentTarget.style.opacity = '1'
            }
          }}
        >
          {isUpdating ? 'Menyimpan...' : updateEnabled ? 'Aktif' : 'Nonaktif'}
        </button>
      </div>

      <div style={{
        padding: '0.75rem',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: 'var(--text-light)',
      }}>
        <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>
          ℹ️ Catatan:
        </strong>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li>Pengaturan ini mengontrol apakah user dapat melihat notifikasi update</li>
          <li>Jika dinonaktifkan, user tidak akan melihat dialog update meskipun ada versi baru</li>
          <li>Perubahan langsung aktif tanpa perlu redeploy</li>
          <li>Jika tidak ada pengaturan di database, sistem akan menggunakan environment variable <code>APP_UPDATE_ENABLED</code></li>
        </ul>
      </div>
    </div>
  )
}

