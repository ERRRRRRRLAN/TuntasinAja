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
  const [editingCell, setEditingCell] = useState<{
    day: string
    period: number
  } | null>(null)

  const utils = trpc.useUtils()
  const { data: scheduleData, isLoading } = trpc.weeklySchedule.getSchedule.useQuery()
  const { data: subjects } = trpc.weeklySchedule.getSubjects.useQuery()

  const setSchedule = trpc.weeklySchedule.setSchedule.useMutation({
    onSuccess: () => {
      utils.weeklySchedule.getSchedule.invalidate()
      setEditingCell(null)
      toast.success('Jadwal berhasil disimpan!')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan jadwal')
    },
  })

  const deleteSchedule = trpc.weeklySchedule.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.weeklySchedule.getSchedule.invalidate()
      setEditingCell(null)
      toast.success('Jadwal berhasil dihapus!')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus jadwal')
    },
  })

  const handleCellClick = (day: string, period: number) => {
    setEditingCell({ day, period })
  }

  const handleSubjectChange = (subject: string) => {
    if (!editingCell) return

    // If empty, don't do anything
    if (!subject || subject.trim() === '') {
      return
    }

    // Save the schedule (auto-save on selection)
    setSchedule.mutate({
      dayOfWeek: editingCell.day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
      period: editingCell.period,
      subject,
    })
  }

  const handleDelete = () => {
    if (!editingCell) return

    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      deleteSchedule.mutate({
        dayOfWeek: editingCell.day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
        period: editingCell.period,
      })
    }
  }

  const handleCancel = () => {
    setEditingCell(null)
  }

  const getCurrentSubject = () => {
    if (!editingCell || !scheduleData) return ''
    
    const scheduleItem = scheduleData.schedule[editingCell.day as keyof typeof scheduleData.schedule]?.find(
      s => s.period === editingCell.period
    )
    
    return scheduleItem?.subject || ''
  }

  const getEditingCellLabel = () => {
    if (!editingCell || !scheduleData) return ''
    
    const dayName = scheduleData.dayNames[editingCell.day as keyof typeof scheduleData.dayNames]
    return `${dayName} - Jam ke-${editingCell.period}`
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
        Klik pada sel untuk menambah atau mengubah jadwal pelajaran. Pilih mata pelajaran dari dropdown di bawah tabel.
      </p>

      {/* Edit Form - Outside Table */}
      {editingCell && (
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border)'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'var(--text)'
            }}>
              {getEditingCellLabel()}
            </label>
            <ComboBox
              value={getCurrentSubject()}
              onChange={handleSubjectChange}
              placeholder="Pilih Mata Pelajaran"
              options={subjects || []}
              showAllOption={false}
              searchPlaceholder="Cari mata pelajaran..."
              emptyMessage="Tidak ada mata pelajaran yang ditemukan"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {getCurrentSubject() && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteSchedule.isLoading || setSchedule.isLoading}
                className="btn btn-danger"
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <TrashIcon size={16} />
                {deleteSchedule.isLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={setSchedule.isLoading || deleteSchedule.isLoading}
              className="btn btn-secondary"
              style={{
                marginLeft: 'auto',
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                minHeight: '40px'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

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
                  const isEditing = editingCell?.day === day.value && editingCell?.period === period

                  return (
                    <td
                      key={day.value}
                      onClick={() => handleCellClick(day.value, period)}
                      style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isEditing
                          ? 'var(--primary)'
                          : scheduleItem 
                          ? 'var(--bg-secondary)' 
                          : 'transparent',
                        color: isEditing ? 'white' : 'var(--text)',
                        transition: 'all 0.2s',
                        minHeight: '60px',
                        verticalAlign: 'middle',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isEditing) {
                          e.currentTarget.style.background = scheduleItem 
                            ? 'var(--bg-tertiary)' 
                            : 'var(--bg-secondary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isEditing) {
                          e.currentTarget.style.background = scheduleItem 
                            ? 'var(--bg-secondary)' 
                            : 'transparent'
                        }
                      }}
                    >
                      {scheduleItem ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ 
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            wordBreak: 'break-word'
                          }}>
                            {scheduleItem.subject}
                          </span>
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--text-light)',
                          fontSize: '0.75rem'
                        }}>
                          Klik untuk menambah
                        </div>
                      )}
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
        <strong>Tips:</strong> Klik pada sel untuk menambah atau mengubah jadwal. Form akan muncul di bawah tabel. Pilih mata pelajaran dari dropdown, jadwal akan tersimpan otomatis.
      </div>
    </div>
  )
}

