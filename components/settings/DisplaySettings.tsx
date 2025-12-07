'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DisplaySettings() {
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

  const handleSelect = (key: string, value: string) => {
    setIsSaving(true)
    updateSettings.mutate({ [key]: value })
  }

  const handleNumber = (key: string, value: number) => {
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

  const themeOptions = [
    { value: 'light', label: '☀️ Light' },
    { value: 'dark', label: '🌙 Dark' },
    { value: 'auto', label: '⚙️ Auto' },
  ]

  const fontSizeOptions = [
    { value: 'small', label: 'Kecil' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Besar' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'oldest', label: 'Terlama' },
    { value: 'deadline', label: 'Deadline' },
  ]

  const tasksPerPageOptions = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
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
        👁️ Tampilan & Tema
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Theme */}
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
              Tema
            </label>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
              marginBottom: '0.75rem',
            }}>
              Pilih tema tampilan aplikasi
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}>
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect('theme', option.value)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '0.75rem 1rem',
                  background: settings.theme === option.value ? 'var(--primary)' : 'var(--bg)',
                  color: settings.theme === option.value ? 'white' : 'var(--text)',
                  border: `1px solid ${settings.theme === option.value ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving && settings.theme !== option.value) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving && settings.theme !== option.value) {
                    e.currentTarget.style.background = 'var(--bg)'
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
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
              Ukuran Font
            </label>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
              marginBottom: '0.75rem',
            }}>
              Atur ukuran font untuk kemudahan membaca
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}>
            {fontSizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect('fontSize', option.value)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '0.75rem 1rem',
                  background: settings.fontSize === option.value ? 'var(--primary)' : 'var(--bg)',
                  color: settings.fontSize === option.value ? 'white' : 'var(--text)',
                  border: `1px solid ${settings.fontSize === option.value ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving && settings.fontSize !== option.value) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving && settings.fontSize !== option.value) {
                    e.currentTarget.style.background = 'var(--bg)'
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Per Page */}
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
              Tugas per Halaman
            </label>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
              marginBottom: '0.75rem',
            }}>
              Jumlah tugas yang ditampilkan per halaman
            </div>
          </div>
          <ComboBox
            value={settings.tasksPerPage.toString()}
            onChange={(value) => handleNumber('tasksPerPage', parseInt(value))}
            options={tasksPerPageOptions.map(o => ({ value: o.value, label: o.label }))}
            placeholder="Pilih jumlah"
            disabled={isSaving}
            showAllOption={false}
          />
        </div>

        {/* Default Sort */}
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
              Urutan Default
            </label>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
              marginBottom: '0.75rem',
            }}>
              Urutan default untuk menampilkan tugas
            </div>
          </div>
          <ComboBox
            value={settings.defaultSort}
            onChange={(value) => handleSelect('defaultSort', value)}
            options={sortOptions.map(o => ({ value: o.value, label: o.label }))}
            placeholder="Pilih urutan"
            disabled={isSaving}
            showAllOption={false}
          />
        </div>

        {/* Show Completed Tasks */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.showCompletedTasks}
            onChange={(checked) => handleToggle('showCompletedTasks', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Tampilkan Tugas Selesai"
            description="Tampilkan tugas yang sudah selesai di feed"
          />
        </div>

        {/* Animations */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.animationsEnabled}
            onChange={(checked) => handleToggle('animationsEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Animasi Transisi"
            description="Tampilkan animasi saat transisi halaman"
          />
        </div>
      </div>
    </div>
  )
}

