'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ComboBox from '@/components/ui/ComboBox'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { UserIcon, DownloadIcon, TrashIcon, SunIcon, MoonIcon, MonitorIcon } from '@/components/ui/Icons'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesProvider'

export default function MePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isNotificationClosing, setIsNotificationClosing] = useState(false)
  const [localSettings, setLocalSettings] = useState<any>(null)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)
  const prevHasUnsavedChangesRef = useRef(false)
  const utils = trpc.useUtils()
  
  // Get unsaved changes context for global navigation blocking
  const { 
    setHasUnsavedChanges: setGlobalHasUnsavedChanges,
    pendingNavigation,
    setPendingNavigation,
    setOnSave,
    setOnDiscard,
  } = useUnsavedChanges()

  // Redirect jika belum login
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Get settings
  const { data: settings, isLoading: isLoadingSettings } = trpc.userSettings.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  // Initialize local settings when settings are loaded
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
      setHasUnsavedChanges(false)
    }
  }, [settings])

  // Check for unsaved changes whenever localSettings changes
  useEffect(() => {
    if (!localSettings || !settings) {
      setHasUnsavedChanges(false)
      setIsNotificationClosing(false)
      prevHasUnsavedChangesRef.current = false
      setGlobalHasUnsavedChanges(false)
      return
    }

    // Compare all settings fields (excluding metadata)
    let hasChanges = false
    Object.keys(localSettings).forEach((key) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
        const localValue = localSettings[key as keyof typeof localSettings]
        const originalValue = settings[key as keyof typeof settings]
        if (localValue !== originalValue) {
          hasChanges = true
        }
      }
    })

    // Sync with global context
    setGlobalHasUnsavedChanges(hasChanges)

    // If we had changes before but now don't, trigger closing animation
    if (prevHasUnsavedChangesRef.current && !hasChanges) {
      setIsNotificationClosing(true)
      // Wait for animation to complete before hiding
      const timeout = setTimeout(() => {
        setHasUnsavedChanges(false)
        setIsNotificationClosing(false)
      }, 300) // Match animation duration
      prevHasUnsavedChangesRef.current = false
      return () => clearTimeout(timeout)
    } else {
      // Update state only if it's different to avoid unnecessary re-renders
      if (hasUnsavedChanges !== hasChanges) {
        setHasUnsavedChanges(hasChanges)
      }
      prevHasUnsavedChangesRef.current = hasChanges
      if (hasChanges && isNotificationClosing) {
        setIsNotificationClosing(false)
      }
    }
  }, [localSettings, settings, setGlobalHasUnsavedChanges]) // Removed hasUnsavedChanges from deps to avoid loop

  // Update mutation
  const updateSettings = trpc.userSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Pengaturan berhasil disimpan')
      setIsSaving(false)
      setHasUnsavedChanges(false)
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

  // Initialize local settings when settings are loaded
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings)
    }
  }, [settings, localSettings])

  const handleToggle = (key: string, value: boolean) => {
    if (!localSettings) return
    setLocalSettings({ ...localSettings, [key]: value })
    // hasUnsavedChanges will be updated by useEffect
  }

  const handleTimeChange = (key: string, value: string) => {
    if (!localSettings) return
    setLocalSettings({ ...localSettings, [key]: value || null })
    // hasUnsavedChanges will be updated by useEffect
  }

  const handleSelect = (key: string, value: string) => {
    if (!localSettings) return
    setLocalSettings({ ...localSettings, [key]: value })
    // hasUnsavedChanges will be updated by useEffect
  }

  const handleNumber = (key: string, value: number | null) => {
    if (!localSettings) return
    setLocalSettings({ ...localSettings, [key]: value })
    // hasUnsavedChanges will be updated by useEffect
  }

  const handleSave = useCallback(async () => {
    if (!localSettings || !settings) return
    
    setIsSaving(true)
    // Prepare update data - only include changed fields
    const updateData: any = {}
    
    // Compare with original settings and only include changed fields
    Object.keys(localSettings).forEach((key) => {
      if (key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
        const localValue = localSettings[key as keyof typeof localSettings]
        const originalValue = settings[key as keyof typeof settings]
        if (localValue !== originalValue) {
          updateData[key] = localValue
        }
      }
    })

    if (Object.keys(updateData).length === 0) {
      setIsSaving(false)
      setHasUnsavedChanges(false)
      setGlobalHasUnsavedChanges(false)
      toast.info('Tidak ada perubahan untuk disimpan')
      return
    }

    return new Promise<void>((resolve, reject) => {
      updateSettings.mutate(updateData, {
        onSuccess: () => {
          resolve()
        },
        onError: (error) => {
          reject(error)
        }
      })
    })
  }, [localSettings, settings, updateSettings, setGlobalHasUnsavedChanges])

  const handleDiscard = useCallback(() => {
    if (settings) {
      setLocalSettings({ ...settings })
    }
    setHasUnsavedChanges(false)
    setGlobalHasUnsavedChanges(false)
    toast.info('Perubahan dibatalkan')
  }, [settings, setGlobalHasUnsavedChanges])

  // Setup save/discard callbacks in context
  useEffect(() => {
    setOnSave(handleSave)
    setOnDiscard(handleDiscard)
    return () => {
      setOnSave(null)
      setOnDiscard(null)
    }
  }, [handleSave, handleDiscard, setOnSave, setOnDiscard])

  // Block browser refresh/close when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const handleExportData = () => {
    exportData.refetch().then((result) => {
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tuntasinaja-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Data berhasil diekspor')
      }
    })
  }

  if (status === 'loading' || isLoadingSettings) {
    return (
      <Layout>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <LoadingSpinner />
            <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
              Memuat...
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!session || !settings || !localSettings) {
    return null
  }

  // Use localSettings for display instead of settings
  const displaySettings = localSettings

  // Generate time options (00:00 - 23:30, 30 minute intervals)
  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push({ value: timeStr, label: timeStr })
    }
  }

  const themeOptions = [
    { 
      value: 'light', 
      label: 'Light',
      icon: <SunIcon size={18} style={{ color: 'currentColor' }} />
    },
    { 
      value: 'dark', 
      label: 'Dark',
      icon: <MoonIcon size={18} style={{ color: 'currentColor' }} />
    },
    { 
      value: 'auto', 
      label: 'Auto',
      icon: <MonitorIcon size={18} style={{ color: 'currentColor' }} />
    },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'oldest', label: 'Terlama' },
    { value: 'dueDate', label: 'Berdasarkan Deadline' },
  ]

  return (
    <Layout>
      <div className="container">
        {/* Profile Section */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}>
              <UserIcon size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                {session.user.name}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Notifikasi & Pengingat */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '0.5rem', 
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              Notifikasi & Pengingat
            </h3>
            <p style={{ 
              margin: 0,
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              lineHeight: '1.5',
            }}>
              Kelola notifikasi tugas, pengingat deadline, dan waktu tidak mengganggu
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ToggleSwitch
              checked={displaySettings.pushNotificationsEnabled ?? true}
              onChange={(checked) => handleToggle('pushNotificationsEnabled', checked)}
              label="Notifikasi Push"
              description="Terima notifikasi push untuk tugas baru dan update"
              isLoading={false}
            />

            <ToggleSwitch
              checked={displaySettings.taskNotificationsEnabled ?? true}
              onChange={(checked) => handleToggle('taskNotificationsEnabled', checked)}
              label="Notifikasi Tugas"
              description="Terima notifikasi untuk tugas baru"
              isLoading={false}
            />

            <ToggleSwitch
              checked={displaySettings.commentNotificationsEnabled ?? true}
              onChange={(checked) => handleToggle('commentNotificationsEnabled', checked)}
              label="Notifikasi Komentar"
              description="Terima notifikasi untuk komentar baru"
              isLoading={false}
            />

            <ToggleSwitch
              checked={displaySettings.deadlineReminderEnabled ?? true}
              onChange={(checked) => handleToggle('deadlineReminderEnabled', checked)}
              label="Pengingat Deadline"
              description="Dapatkan pengingat untuk tugas yang mendekati deadline"
              isLoading={false}
            />

            {displaySettings.deadlineReminderEnabled && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.25rem', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text)',
                }}>
                  Waktu Pengingat
                </label>
                <p style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}>
                  Waktu harian untuk menerima pengingat tugas yang deadline-nya besok
                </p>
                <ComboBox
                  options={timeOptions}
                  value={displaySettings.reminderTime || '08:00'}
                  onChange={(value) => handleTimeChange('reminderTime', value)}
                  placeholder="Pilih waktu"
                  showAllOption={false}
                  showSearch={false}
                  showClear={false}
                  searchPlaceholder=""
                  emptyMessage="Tidak ada waktu yang ditemukan"
                />
              </div>
            )}

            <ToggleSwitch
              checked={displaySettings.dndEnabled ?? false}
              onChange={(checked) => handleToggle('dndEnabled', checked)}
              label="Jangan Ganggu"
              description="Nonaktifkan semua notifikasi selama waktu tertentu"
              isLoading={false}
            />

            {displaySettings.dndEnabled && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}>
                    Mulai
                  </label>
                  <ComboBox
                    options={timeOptions}
                    value={displaySettings.dndStartTime || '22:00'}
                    onChange={(value) => handleTimeChange('dndStartTime', value)}
                    placeholder="Pilih waktu"
                    showAllOption={false}
                    showSearch={false}
                    showClear={false}
                    searchPlaceholder=""
                    emptyMessage="Tidak ada waktu yang ditemukan"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}>
                    Selesai
                  </label>
                  <ComboBox
                    options={timeOptions}
                    value={displaySettings.dndEndTime || '07:00'}
                    onChange={(value) => handleTimeChange('dndEndTime', value)}
                    placeholder="Pilih waktu"
                    showAllOption={false}
                    showSearch={false}
                    showClear={false}
                    searchPlaceholder=""
                    emptyMessage="Tidak ada waktu yang ditemukan"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tampilan & Tema */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '0.5rem', 
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              Tampilan & Tema
            </h3>
            <p style={{ 
              margin: 0,
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              lineHeight: '1.5',
            }}>
              Sesuaikan tampilan aplikasi sesuai preferensi Anda
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text)',
              }}>
                Tema
              </label>
              <ComboBox
                options={themeOptions}
                value={displaySettings.theme || 'auto'}
                onChange={(value) => {
                  handleSelect('theme', value)
                  // Update theme immediately
                  if (typeof window !== 'undefined') {
                    const root = document.documentElement
                    if (value === 'dark') {
                      root.classList.add('dark')
                    } else if (value === 'light') {
                      root.classList.remove('dark')
                    } else {
                      // Auto mode - check system preference
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                      if (prefersDark) {
                        root.classList.add('dark')
                      } else {
                        root.classList.remove('dark')
                      }
                    }
                  }
                }}
                placeholder="Pilih tema"
                showAllOption={false}
                showSearch={false}
                showClear={false}
                searchPlaceholder=""
                emptyMessage="Tidak ada tema yang ditemukan"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text)',
              }}>
                Tugas per Halaman
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={displaySettings.tasksPerPage || 20}
                onChange={(e) => handleNumber('tasksPerPage', parseInt(e.target.value) || 20)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'var(--card)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text)',
              }}>
                Urutan Default
              </label>
              <ComboBox
                options={sortOptions}
                value={displaySettings.defaultSort || 'newest'}
                onChange={(value) => handleSelect('defaultSort', value)}
                placeholder="Pilih urutan"
                showAllOption={false}
                showSearch={false}
                showClear={false}
                searchPlaceholder=""
                emptyMessage="Tidak ada urutan yang ditemukan"
              />
            </div>

            <ToggleSwitch
              checked={displaySettings.showCompletedTasks ?? true}
              onChange={(checked) => handleToggle('showCompletedTasks', checked)}
              label="Tampilkan Tugas Selesai"
              description="Tampilkan tugas yang sudah selesai di daftar"
              isLoading={false}
            />

            <ToggleSwitch
              checked={displaySettings.animationsEnabled ?? true}
              onChange={(checked) => handleToggle('animationsEnabled', checked)}
              label="Aktifkan Animasi"
              description="Tampilkan animasi transisi dan efek visual"
              isLoading={false}
            />
          </div>
        </div>

        {/* Suara & Getar */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '0.5rem', 
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              Suara & Getar
            </h3>
            <p style={{ 
              margin: 0,
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              lineHeight: '1.5',
            }}>
              Kelola suara dan getaran untuk notifikasi
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <ToggleSwitch
              checked={displaySettings.soundEnabled ?? true}
              onChange={(checked) => handleToggle('soundEnabled', checked)}
              label="Aktifkan Suara"
              description="Putar suara saat menerima notifikasi"
              isLoading={false}
            />

            <ToggleSwitch
              checked={displaySettings.vibrationEnabled ?? true}
              onChange={(checked) => handleToggle('vibrationEnabled', checked)}
              label="Aktifkan Getar"
              description="Getarkan perangkat saat menerima notifikasi"
              isLoading={false}
            />
          </div>
        </div>

        {/* Data & Penyimpanan */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '0.5rem', 
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              Data & Penyimpanan
            </h3>
            <p style={{ 
              margin: 0,
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              lineHeight: '1.5',
            }}>
              Kelola data dan penyimpanan aplikasi
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text)',
              }}>
                Auto-hapus History (hari)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={displaySettings.autoDeleteHistoryDays ?? 30}
                onChange={(e) => handleNumber('autoDeleteHistoryDays', parseInt(e.target.value) || null)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'var(--card)',
                  color: 'var(--text)',
                }}
              />
              <p style={{ 
                margin: '0.5rem 0 0 0',
                fontSize: '0.75rem', 
                color: 'var(--text-light)',
              }}>
                Set 0 untuk menonaktifkan auto-hapus
              </p>
            </div>

            <button
              onClick={handleExportData}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-dark)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--primary)'
              }}
            >
              <DownloadIcon size={18} />
              Ekspor Data
            </button>

            <button
              onClick={() => setShowClearCacheDialog(true)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--danger)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <TrashIcon size={18} />
              Hapus Cache
            </button>
          </div>
        </div>

        {/* Tentang & Bantuan */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '0.5rem', 
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              Tentang & Bantuan
            </h3>
            <p style={{ 
              margin: 0,
              fontSize: '0.875rem', 
              color: 'var(--text-light)',
              lineHeight: '1.5',
            }}>
              Informasi aplikasi dan bantuan
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontWeight: 500,
                marginBottom: '0.25rem',
                fontSize: '0.95rem',
                color: 'var(--text)',
              }}>
                Versi Aplikasi
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-light)',
                marginTop: '0.25rem',
              }}>
                TuntasinAja v1.5.0
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontWeight: 500,
                marginBottom: '0.5rem',
                fontSize: '0.95rem',
                color: 'var(--text)',
              }}>
                Update & Informasi
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-light)',
                margin: 0,
                lineHeight: '1.5',
              }}>
                TuntasinAja menginformasikan update melalui channel WhatsApp @TuntasinAja Info
              </p>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showClearCacheDialog}
          onCancel={() => setShowClearCacheDialog(false)}
          onConfirm={() => clearCache.mutate()}
          title="Hapus Cache"
          message="Apakah Anda yakin ingin menghapus cache? Tindakan ini tidak dapat dibatalkan."
          confirmText="Hapus"
          cancelText="Batal"
          danger={true}
        />

        {/* Sticky Notification for Unsaved Changes */}
        {(hasUnsavedChanges || isNotificationClosing) && (
          <div
            className="settings-unsaved-notification"
            style={{
              position: 'fixed',
              bottom: 'calc(var(--bottom-nav-height) + 1rem)',
              left: '1rem',
              right: '1rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              animation: isNotificationClosing 
                ? 'slideDownToBottom 0.3s ease-out forwards'
                : 'slideUpFromBottom 0.3s ease-out',
              maxWidth: 'calc(100vw - 2rem)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                fontWeight: 500,
                color: 'var(--text)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}>
                Pengaturan telah diubah
              </p>
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontSize: '0.75rem', 
                color: 'var(--text-light)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}>
                Simpan perubahan atau batalkan?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button
                onClick={handleDiscard}
                disabled={isSaving}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text)',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.borderColor = 'var(--text-light)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: isSaving ? 'var(--text-light)' : 'var(--primary)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'white',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.background = 'var(--primary-dark)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.background = 'var(--primary)'
                  }
                }}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

