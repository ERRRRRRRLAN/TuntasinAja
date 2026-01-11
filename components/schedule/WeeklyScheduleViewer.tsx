'use client'

import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CalendarIcon } from '@/components/ui/Icons'

const DAYS = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
] as const

const MAX_PERIODS = 10

export default function WeeklyScheduleViewer() {
  const { data: scheduleData, isLoading, error } = trpc.weeklySchedule.getUserSchedule.useQuery()

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat jadwal...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-light)' }}>
          {error.message || 'Gagal memuat jadwal. Pastikan Anda memiliki kelas yang terdaftar.'}
        </p>
      </div>
    )
  }

  if (!scheduleData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-light)' }}>
          Jadwal belum tersedia untuk kelas Anda.
        </p>
      </div>
    )
  }

  // Check if schedule is empty
  const hasSchedule = Object.values(scheduleData.schedule).some(day => day.length > 0)

  if (!hasSchedule) {
    return (
      <div className="card">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          marginBottom: '1rem' 
        }}>
          <CalendarIcon size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Jadwal Pelajaran
          </h3>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: 'var(--text-light)'
        }}>
          <p>Jadwal untuk kelas {scheduleData.kelas} belum tersedia.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Hubungi ketua kelas Anda untuk mengatur jadwal.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <CalendarIcon size={24} style={{ color: 'var(--primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          Jadwal Pelajaran
        </h3>
      </div>

      {/* Schedule Table */}
      <div style={{ 
        overflowX: 'auto',
        overflowY: 'visible',
        position: 'relative'
      }}>
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
                borderRight: '1px solid var(--border)'
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
                  borderRight: '1px solid var(--border)'
                }}>
                  {period}
                </td>
                {DAYS.map(day => {
                  const scheduleItem = scheduleData.schedule[day.value as keyof typeof scheduleData.schedule]?.find(
                    s => s.period === period
                  )

                  return (
                    <td
                      key={day.value}
                      style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                        textAlign: 'center',
                        background: scheduleItem ? 'var(--bg-secondary)' : 'transparent',
                        color: 'var(--text)',
                        minHeight: '60px',
                        verticalAlign: 'middle'
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
                          -
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
    </div>
  )
}

