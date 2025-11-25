'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ComboBox from '@/components/ui/ComboBox'
import { TrashIcon, CalendarIcon } from '@/components/ui/Icons'

const DAYS = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
] as const

const MAX_PERIODS = 10

export default function WeeklyScheduleManager() {
  const utils = trpc.useUtils()
  const { data: scheduleData, isLoading } = trpc.weeklySchedule.getSchedule.useQuery()
  const { data: subjects } = trpc.weeklySchedule.getSubjects.useQuery()

  const setSchedule = trpc.weeklySchedule.setSchedule.useMutation({
    onSuccess: () => {
      utils.weeklySchedule.getSchedule.invalidate()
      toast.success('Jadwal berhasil disimpan!')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan jadwal')
    },
  })

  const deleteSchedule = trpc.weeklySchedule.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.weeklySchedule.getSchedule.invalidate()
      toast.success('Jadwal berhasil dihapus!')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus jadwal')
    },
  })

  const handleSubjectChange = (
    day: string, 
    period: number, 
    subject: string
  ) => {
    // If empty, don't do anything
    if (!subject || subject.trim() === '') {
      return
    }

    // Save the schedule (auto-save on selection)
    setSchedule.mutate({
      dayOfWeek: day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
      period,
      subject,
    })
  }

  const handleDelete = (day: string, period: number) => {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      deleteSchedule.mutate({
        dayOfWeek: day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
        period,
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
    <div className="card">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <CalendarIcon size={24} style={{ color: 'var(--primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          Jadwal Mingguan
        </h3>
      </div>

      <p style={{ 
        color: 'var(--text-light)', 
        fontSize: '0.875rem', 
        marginBottom: '1.5rem',
        lineHeight: '1.6'
      }}>
        Pilih mata pelajaran langsung dari dropdown di setiap sel. Jadwal akan tersimpan otomatis saat dipilih. Pilih "Hapus" untuk menghapus jadwal.
      </p>

      {/* Schedule Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: 600,
                color: 'var(--text-light)',
                borderBottom: '2px solid var(--border)',
                position: 'sticky',
                left: 0,
                background: 'var(--card)',
                zIndex: 1
              }}>
                Jam
              </th>
              {DAYS.map(day => (
                <th 
                  key={day.value}
                  style={{ 
                    padding: '0.75rem', 
                    textAlign: 'center', 
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    borderBottom: '2px solid var(--border)',
                    minWidth: '120px'
                  }}
                >
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map(period => (
              <tr key={period}>
                <td style={{ 
                  padding: '0.75rem', 
                  fontWeight: 600,
                  color: 'var(--text)',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky',
                  left: 0,
                  background: 'var(--card)',
                  zIndex: 1
                }}>
                  {period}
                </td>
                {DAYS.map(day => {
                  const scheduleItem = scheduleData?.schedule[day.value as keyof typeof scheduleData.schedule]?.find(
                    s => s.period === period
                  )
                  const currentSubject = scheduleItem?.subject || ''

                  return (
                    <td
                      key={day.value}
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                        textAlign: 'center',
                        background: scheduleItem 
                          ? 'var(--bg-secondary)' 
                          : 'transparent',
                        transition: 'all 0.2s',
                        minHeight: '60px',
                        verticalAlign: 'middle',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.25rem',
                        alignItems: 'stretch'
                      }}>
                        <ComboBox
                          value={currentSubject}
                          onChange={(value) => handleSubjectChange(day.value, period, value)}
                          placeholder="Pilih mata pelajaran..."
                          options={subjects || []}
                          showAllOption={false}
                          searchPlaceholder="Cari mata pelajaran..."
                          emptyMessage="Tidak ada mata pelajaran yang ditemukan"
                        />
                        {scheduleItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDelete(day.value, period)
                            }}
                            disabled={deleteSchedule.isLoading || setSchedule.isLoading}
                            style={{
                              marginTop: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              background: 'var(--danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: deleteSchedule.isLoading || setSchedule.isLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              width: '100%',
                              transition: 'opacity 0.2s',
                              opacity: deleteSchedule.isLoading || setSchedule.isLoading ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!deleteSchedule.isLoading && !setSchedule.isLoading) {
                                e.currentTarget.style.opacity = '0.8'
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = deleteSchedule.isLoading || setSchedule.isLoading ? 0.6 : 1
                            }}
                          >
                            <TrashIcon size={12} />
                            {deleteSchedule.isLoading ? 'Menghapus...' : 'Hapus'}
                          </button>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        background: 'var(--bg-secondary)', 
        borderRadius: '0.5rem',
        fontSize: '0.8125rem',
        color: 'var(--text-light)'
      }}>
        <strong>Tips:</strong> Pilih mata pelajaran langsung dari dropdown di setiap sel. Jadwal akan tersimpan otomatis. Gunakan tombol "Hapus" untuk menghapus jadwal yang sudah ada.
      </div>
    </div>
  )
}

