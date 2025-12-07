'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SoundSettings() {
  const [isSaving, setIsSaving] = useState(false)
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

  const handleToggle = (key: string, value: boolean) => {
    setIsSaving(true)
    updateSettings.mutate({ [key]: value })
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
        🔊 Suara & Getar
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Sound Enabled */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.soundEnabled}
            onChange={(checked) => handleToggle('soundEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Suara Notifikasi"
            description="Putar suara saat menerima notifikasi"
          />
        </div>

        {/* Vibration Enabled */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.vibrationEnabled}
            onChange={(checked) => handleToggle('vibrationEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Getar"
            description="Getar perangkat saat menerima notifikasi"
          />
        </div>
      </div>
    </div>
  )
}

