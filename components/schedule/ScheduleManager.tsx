'use client'

import { useState } from 'react'
import { useketua } from '@/hooks/useKetua'
import { useSchedule } from '@/hooks/useSchedule'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ComboBox from '@/components/ui/ComboBox'
import { PlusIcon, TrashIcon, CalendarIcon, BookIcon, XIconSmall } from '@/components/ui/Icons'

const WEEKDAYS = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
] as const

export default function ScheduleManager() {
  const { kelas: ketuaKelas } = useketua()
  const { schedules, isLoading, refetch } = useSchedule(ketuaKelas || undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [tempSubjects, setTempSubjects] = useState<Record<string, string>>({})
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, string[]>>({})
  const utils = trpc.useUtils()

  const { data: subjects = [] } = trpc.weeklySchedule.getSubjects.useQuery(undefined, {
    enabled: !!ketuaKelas,
  })

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      // Handled in handleAddSubject
    },
    onError: (error: any) => {
      console.error('[ERROR]', error.message || 'Gagal menambahkan jadwal')
    },
  })

  const deleteSchedule = trpc.schedule.delete.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Jadwal berhasil dihapus')
      setDeletingId(null)
      refetch()
      utils.schedule.getByKelas.invalidate()
    },
    onError: (error: any) => {
      console.error('[ERROR]', error.message || 'Gagal menghapus jadwal')
      setDeletingId(null)
    },
  })

  const handleAddSubjectToDay = (dayValue: string) => {
    const subject = tempSubjects[dayValue]?.trim()
    if (!subject) {
      console.warn('[WARNING] Pilih mata pelajaran terlebih dahulu')
      return
    }

    const daySubjects = selectedSubjects[dayValue] || []
    if (daySubjects.includes(subject)) {
      console.warn('[WARNING] Mata pelajaran sudah ada di daftar')
      return
    }

    // Add to selected subjects for this day
    setSelectedSubjects({
      ...selectedSubjects,
      [dayValue]: [...daySubjects, subject],
    })

    // Clear temp subject
    setTempSubjects({
      ...tempSubjects,
      [dayValue]: '',
    })
  }

  const handleRemoveSubjectFromList = (dayValue: string, subjectToRemove: string) => {
    const daySubjects = selectedSubjects[dayValue] || []
    setSelectedSubjects({
      ...selectedSubjects,
      [dayValue]: daySubjects.filter(s => s !== subjectToRemove),
    })
  }

  const handleSaveDay = async (dayValue: string) => {
    const daySubjects = selectedSubjects[dayValue] || []
    if (daySubjects.length === 0) {
      console.warn('[WARNING] Pilih minimal satu mata pelajaran')
      return
    }

    // Create all schedules for this day
    let successCount = 0
    let errorCount = 0

    for (const subject of daySubjects) {
      try {
        await createSchedule.mutateAsync({
          dayOfWeek: dayValue as any,
          subject
        })
        successCount++
      } catch (error) {
        errorCount++
        // Continue with other subjects even if one fails
      }
    }

    // Show appropriate message
    if (successCount > 0 && errorCount === 0) {
      console.log('[SUCCESS]', `${successCount} jadwal berhasil ditambahkan untuk ${WEEKDAYS.find(d => d.value === dayValue)?.label}`)
    } else if (successCount > 0 && errorCount > 0) {
      console.warn('[WARNING]', `${successCount} jadwal berhasil ditambahkan, ${errorCount} gagal`)
    } else {
      console.error('[ERROR] Gagal menambahkan jadwal')
    }

    // Clear selected subjects for this day
    setSelectedSubjects({
      ...selectedSubjects,
      [dayValue]: [],
    })

    // Collapse form
    setExpandedDays({
      ...expandedDays,
      [dayValue]: false,
    })

    refetch()
    utils.schedule.getByKelas.invalidate()
  }

  const toggleDayForm = (dayValue: string) => {
    setExpandedDays({
      ...expandedDays,
      [dayValue]: !expandedDays[dayValue],
    })
    // Initialize selected subjects if not exists
    if (!selectedSubjects[dayValue]) {
      setSelectedSubjects({
        ...selectedSubjects,
        [dayValue]: [],
      })
    }
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat jadwal...</p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="schedule-manager-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={20} />
            Jadwal Pelajaran Mingguan
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)' }}>
            Jadwal ini berlaku untuk setiap minggu
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {WEEKDAYS.map((day) => {
            const daySchedules = schedules[day.value] || []
            const isExpanded = expandedDays[day.value] || false
            const daySelectedSubjects = selectedSubjects[day.value] || []
            const dayTempSubject = tempSubjects[day.value] || ''

            return (
              <div key={day.value} className="schedule-day-card" style={{
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
              }}>
                <div className="schedule-day-header" style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{day.label}</span>
                  <button
                    onClick={() => toggleDayForm(day.value)}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      minHeight: '32px',
                    }}
                  >
                    <PlusIcon size={16} />
                    {isExpanded ? 'Tutup' : 'Tambah'}
                  </button>
                </div>

                <div style={{ padding: '0.75rem' }}>
                  {/* Existing Subjects */}
                  {daySchedules.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: isExpanded ? '1rem' : '0' }}>
                      {daySchedules.map((schedule: any) => (
                        <div key={schedule.id} className="schedule-subject-item" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '0.375rem',
                          gap: '0.75rem',
                        }}>
                          <span style={{ fontWeight: 500 }}>{schedule.subject}</span>
                          <button
                            onClick={() => setDeletingId(schedule.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '0.375rem',
                              padding: '0.375rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '32px',
                              minHeight: '32px',
                              color: 'var(--text-light)',
                            }}
                            title="Hapus"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Form (Inline) */}
                  {isExpanded && (
                    <div style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>
                          Mata Pelajaran
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <ComboBox
                              value={dayTempSubject}
                              onChange={(value) => setTempSubjects({ ...tempSubjects, [day.value]: value })}
                              options={subjects.map((name: string) => ({ value: name, label: name }))}
                              placeholder="-- Pilih Mata Pelajaran --"
                              showAllOption={false}
                              searchPlaceholder="Cari mata pelajaran..."
                              emptyMessage="Tidak ada mata pelajaran yang ditemukan"
                              icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSubjectToDay(day.value)}
                            disabled={!dayTempSubject.trim() || daySelectedSubjects.includes(dayTempSubject.trim()) || createSchedule.isLoading}
                            style={{
                              padding: '0.625rem 1rem',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: (!dayTempSubject.trim() || daySelectedSubjects.includes(dayTempSubject.trim()) || createSchedule.isLoading) ? 'not-allowed' : 'pointer',
                              opacity: (!dayTempSubject.trim() || daySelectedSubjects.includes(dayTempSubject.trim()) || createSchedule.isLoading) ? 0.6 : 1,
                              minHeight: '44px',
                              minWidth: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Tambah ke daftar"
                          >
                            <PlusIcon size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Selected Subjects List */}
                      {daySelectedSubjects.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>
                            Mata Pelajaran Terpilih ({daySelectedSubjects.length}):
                          </label>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '0.5rem',
                            background: 'var(--card)',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--border)',
                          }}>
                            {daySelectedSubjects.map((subject) => (
                              <div
                                key={subject}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.625rem 0.75rem',
                                  background: 'var(--bg-secondary)',
                                  borderRadius: '0.375rem',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{subject}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectFromList(day.value, subject)}
                                  disabled={createSchedule.isLoading}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: createSchedule.isLoading ? 'not-allowed' : 'pointer',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-light)',
                                    borderRadius: '0.25rem',
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!createSchedule.isLoading) {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                      e.currentTarget.style.color = '#ef4444'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!createSchedule.isLoading) {
                                      e.currentTarget.style.background = 'transparent'
                                      e.currentTarget.style.color = 'var(--text-light)'
                                    }
                                  }}
                                  title="Hapus dari daftar"
                                >
                                  <XIconSmall size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedDays({ ...expandedDays, [day.value]: false })
                            setSelectedSubjects({ ...selectedSubjects, [day.value]: [] })
                            setTempSubjects({ ...tempSubjects, [day.value]: '' })
                          }}
                          className="btn"
                          disabled={createSchedule.isLoading}
                          style={{
                            padding: '0.625rem 1.25rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.375rem',
                            minHeight: '44px',
                          }}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveDay(day.value)}
                          className="btn btn-primary"
                          disabled={createSchedule.isLoading || daySelectedSubjects.length === 0}
                          style={{
                            padding: '0.625rem 1.25rem',
                            minHeight: '44px',
                          }}
                        >
                          {createSchedule.isLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <LoadingSpinner size={16} color="white" />
                              Menyimpan...
                            </span>
                          ) : (
                            `Simpan ${daySelectedSubjects.length > 0 ? `(${daySelectedSubjects.length})` : ''}`
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isExpanded && daySchedules.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      Belum ada mata pelajaran. Klik "Tambah" untuk menambahkan.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deletingId && (
        <ConfirmDialog
          isOpen={!!deletingId}
          title="Hapus Jadwal?"
          message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
          confirmText={deleteSchedule.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
          cancelText="Batal"
          disabled={deleteSchedule.isLoading}
          onConfirm={() => {
            if (deletingId && !deleteSchedule.isLoading) {
              deleteSchedule.mutate({ scheduleId: deletingId })
            }
          }}
          onCancel={() => {
            if (!deleteSchedule.isLoading) {
              setDeletingId(null)
            }
          }}
        />
      )}
    </>
  )
}
