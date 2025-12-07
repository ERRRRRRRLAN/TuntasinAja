'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false)
  const utils = trpc.useUtils()

  // Get current settings
  const { data: settings, isLoading } = trpc.userSettings.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  // Update mutation
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

  const handleTimeChange = (key: string, value: string) => {
    setIsSaving(true)
    updateSettings.mutate({ [key]: value || null })
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

  // Generate time options (00:00 - 23:30, 30 minute intervals)
  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeStr)
    }
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
        🔔 Notifikasi & Pengingat
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Push Notifications */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.pushNotificationsEnabled}
            onChange={(checked) => handleToggle('pushNotificationsEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Push Notifications"
            description="Terima notifikasi push di perangkat Anda"
          />
        </div>

        {/* Task Notifications */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.taskNotificationsEnabled}
            onChange={(checked) => handleToggle('taskNotificationsEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Notifikasi Tugas Baru"
            description="Dapat notifikasi saat ada tugas baru di kelas"
          />
        </div>

        {/* Comment Notifications */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.commentNotificationsEnabled}
            onChange={(checked) => handleToggle('commentNotificationsEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Notifikasi Sub Tugas Baru"
            description="Dapat notifikasi saat ada sub tugas baru"
          />
        </div>

        {/* Announcement Notifications */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.announcementNotificationsEnabled}
            onChange={(checked) => handleToggle('announcementNotificationsEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Notifikasi Pengumuman"
            description="Dapat notifikasi saat ada pengumuman baru"
          />
        </div>

        {/* Deadline Reminder */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.deadlineReminderEnabled}
            onChange={(checked) => handleToggle('deadlineReminderEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Pengingat Deadline"
            description="Dapat pengingat untuk deadline yang mendekat"
          />
        </div>

        {/* Schedule Reminder */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.scheduleReminderEnabled}
            onChange={(checked) => handleToggle('scheduleReminderEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Pengingat Berdasarkan Jadwal"
            description="Dapat pengingat berdasarkan jadwal pelajaran"
          />
        </div>

        {/* Overdue Reminder */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.overdueReminderEnabled}
            onChange={(checked) => handleToggle('overdueReminderEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Pengingat Tugas Terlambat"
            description="Dapat pengingat untuk tugas yang belum selesai > 7 hari"
          />
        </div>

        {/* Reminder Time */}
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
              Waktu Pengingat
            </label>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-light)',
              marginBottom: '0.75rem',
            }}>
              Atur waktu untuk menerima pengingat harian
            </div>
          </div>
          <ComboBox
            value={settings.reminderTime || '19:00'}
            onChange={(value) => handleTimeChange('reminderTime', value)}
            options={timeOptions}
            placeholder="Pilih waktu"
            disabled={isSaving}
            showAllOption={false}
          />
        </div>

        {/* Do Not Disturb */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <ToggleSwitch
            checked={settings.dndEnabled}
            onChange={(checked) => handleToggle('dndEnabled', checked)}
            disabled={isSaving}
            isLoading={isSaving && updateSettings.isLoading}
            size="medium"
            label="Do Not Disturb"
            description="Nonaktifkan notifikasi pada jam tertentu"
          />
          {settings.dndEnabled && (
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'var(--text-light)',
                  marginBottom: '0.5rem',
                }}>
                  Mulai
                </label>
                <ComboBox
                  value={settings.dndStartTime || '22:00'}
                  onChange={(value) => handleTimeChange('dndStartTime', value)}
                  options={timeOptions}
                  placeholder="Pilih waktu"
                  disabled={isSaving}
                  showAllOption={false}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'var(--text-light)',
                  marginBottom: '0.5rem',
                }}>
                  Selesai
                </label>
                <ComboBox
                  value={settings.dndEndTime || '06:00'}
                  onChange={(value) => handleTimeChange('dndEndTime', value)}
                  options={timeOptions}
                  placeholder="Pilih waktu"
                  disabled={isSaving}
                  showAllOption={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

