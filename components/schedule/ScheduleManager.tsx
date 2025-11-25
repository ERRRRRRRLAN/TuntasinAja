'use client'

import { useState } from 'react'
import { useDanton } from '@/hooks/useDanton'
import { useSchedule } from '@/hooks/useSchedule'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ComboBox from '@/components/ui/ComboBox'
import { PlusIcon, TrashIcon, EditIcon, CalendarIcon, BookIcon } from '@/components/ui/Icons'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
  { value: 'saturday', label: 'Sabtu' },
  { value: 'sunday', label: 'Minggu' },
] as const

export default function ScheduleManager() {
  const { kelas: dantonKelas } = useDanton()
  const { schedules, isLoading, refetch } = useSchedule(dantonKelas || undefined)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>('monday')
  const [subject, setSubject] = useState('')
  const utils = trpc.useUtils()

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      toast.success('Jadwal berhasil ditambahkan')
      setShowAddForm(false)
      setSubject('')
      refetch()
      utils.schedule.getByKelas.invalidate()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan jadwal')
    },
  })

  const deleteSchedule = trpc.schedule.delete.useMutation({
    onSuccess: () => {
      toast.success('Jadwal berhasil dihapus')
      setDeletingId(null)
      refetch()
      utils.schedule.getByKelas.invalidate()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus jadwal')
      setDeletingId(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      toast.error('Nama mata pelajaran harus diisi')
      return
    }
    createSchedule.mutate({ dayOfWeek, subject: subject.trim() })
  }

  // Group schedules by day
  const schedulesByDay = schedules.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = []
    }
    acc[schedule.dayOfWeek].push(schedule)
    return acc
  }, {})

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
            Jadwal Pelajaran
          </h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              minHeight: '44px',
            }}
          >
            <PlusIcon size={18} />
            Tambah Jadwal
          </button>
        </div>

        {schedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
            <p style={{ margin: 0 }}>Belum ada jadwal pelajaran.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {DAYS_OF_WEEK.map((day) => {
              const daySchedules = schedulesByDay[day.value] || []
              if (daySchedules.length === 0) return null

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
                  }}>
                    {day.label}
                  </div>
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="modal-content schedule-manager-form"
            style={{
              background: 'var(--card)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
              Tambah Jadwal
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="dayOfWeek">
                  Hari
                </label>
                <select
                  id="dayOfWeek"
                  className="form-select"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as any)}
                  required
                  disabled={createSchedule.isLoading}
                  style={{ minHeight: '44px' }}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="subject">
                  Mata Pelajaran *
                </label>
                <ComboBox
                  value={subject}
                  onChange={setSubject}
                  placeholder="-- Pilih Mata Pelajaran --"
                  showAllOption={false}
                  searchPlaceholder="Cari mata pelajaran..."
                  emptyMessage="Tidak ada mata pelajaran yang ditemukan"
                  icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
                />
                <small className="form-hint" style={{ marginTop: '0.5rem', display: 'block', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  Pilih mata pelajaran dari daftar
                </small>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setSubject('')
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
                  type="submit"
                  className="btn btn-primary"
                  disabled={createSchedule.isLoading || !subject.trim()}
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
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

