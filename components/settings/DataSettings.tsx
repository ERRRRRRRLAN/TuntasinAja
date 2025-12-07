'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { DownloadIcon, TrashIcon } from '@/components/ui/Icons'

export default function DataSettings() {
  const [isSaving, setIsSaving] = useState(false)
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false)
  const utils = trpc.useUtils()

  const { data: settings, isLoading } = trpc.userSettings.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const updateSettings = trpc.userSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Pengaturan berhasil disimpan')
      setIsSaving(false)
      utils.userSettings.get.invalidate()
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan: ${error.message}`)
      setIsSaving(false)
    },
  })

  const exportData = trpc.userSettings.exportData.useQuery(undefined, {
    enabled: false,
  })

  const clearCache = trpc.userSettings.clearCache.useMutation({
    onSuccess: () => {
      toast.success('Cache berhasil dihapus')
      setShowClearCacheDialog(false)
    },
    onError: (error) => {
      toast.error(`Gagal menghapus cache: ${error.message}`)
    },
  })

  const handleNumber = (key: string, value: number | null) => {
    setIsSaving(true)
    updateSettings.mutate({ [key]: value })
  }

  const handleExportData = async () => {
    try {
      const data = await exportData.refetch()
      if (data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tuntasin-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Data berhasil diekspor')
      }
    } catch (error: any) {
      toast.error(`Gagal mengekspor data: ${error.message}`)
    }
  }

  const handleClearCache = () => {
    clearCache.mutate()
  }

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <LoadingSpinner />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
          Memuat pengaturan...
        </p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-light)' }}>
          Gagal memuat pengaturan
        </p>
      </div>
    )
  }

  const autoDeleteOptions = [
    { value: '0', label: 'Tidak pernah' },
    { value: '30', label: '30 hari' },
    { value: '60', label: '60 hari' },
    { value: '90', label: '90 hari' },
  ]

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '1.5rem', 
        fontSize: '1.25rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        💾 Data & Penyimpanan
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Auto Delete History */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{
              display: 'block',
              fontWeight: 500,
              marginBottom: '0.25rem',
              fontSize: '0.95rem',
              color: 'var(--text)',
            }}>
              Auto-Hapus History
            </label>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
              marginBottom: '0.75rem',
            }}>
              Otomatis hapus history setelah periode tertentu
            </div>
          </div>
          <ComboBox
            value={settings.autoDeleteHistoryDays?.toString() || '0'}
            onChange={(value) => handleNumber('autoDeleteHistoryDays', value === '0' ? null : parseInt(value))}
            options={autoDeleteOptions.map(o => ({ value: o.value, label: o.label }))}
            placeholder="Pilih periode"
            disabled={isSaving}
            showAllOption={false}
          />
        </div>

        {/* Export Data */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              fontWeight: 500,
              marginBottom: '0.25rem',
              fontSize: '0.95rem',
              color: 'var(--text)',
            }}>
              Ekspor Data
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
            }}>
              Unduh semua data Anda dalam format JSON
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={exportData.isFetching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: exportData.isFetching ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: exportData.isFetching ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!exportData.isFetching) {
                e.currentTarget.style.background = 'var(--primary-dark)'
              }
            }}
            onMouseLeave={(e) => {
              if (!exportData.isFetching) {
                e.currentTarget.style.background = 'var(--primary)'
              }
            }}
          >
            <DownloadIcon size={16} />
            {exportData.isFetching ? 'Mengekspor...' : 'Ekspor Data'}
          </button>
        </div>

        {/* Clear Cache */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              fontWeight: 500,
              marginBottom: '0.25rem',
              fontSize: '0.95rem',
              color: 'var(--text)',
            }}>
              Hapus Cache
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
            }}>
              Hapus data cache yang tersimpan di perangkat
            </div>
          </div>
          <button
            onClick={() => setShowClearCacheDialog(true)}
            disabled={clearCache.isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              cursor: clearCache.isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: clearCache.isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!clearCache.isLoading) {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }
            }}
            onMouseLeave={(e) => {
              if (!clearCache.isLoading) {
                e.currentTarget.style.background = 'var(--bg)'
              }
            }}
          >
            <TrashIcon size={16} />
            {clearCache.isLoading ? 'Menghapus...' : 'Hapus Cache'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearCacheDialog}
        title="Hapus Cache?"
        message="Apakah Anda yakin ingin menghapus cache? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger={true}
        onConfirm={handleClearCache}
        onCancel={() => setShowClearCacheDialog(false)}
      />
    </div>
  )
}

