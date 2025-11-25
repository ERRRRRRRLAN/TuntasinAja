'use client'

import { useMySchedule } from '@/hooks/useSchedule'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CalendarIcon } from '@/components/ui/Icons'

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
  { value: 'saturday', label: 'Sabtu' },
  { value: 'sunday', label: 'Minggu' },
] as const

export default function ScheduleViewer() {
  const { schedules, isLoading } = useMySchedule()

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
    <div className="card schedule-viewer-card">
      <h3 style={{ 
        margin: '0 0 1.5rem 0', 
        fontSize: '1.25rem', 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <CalendarIcon size={20} />
        Jadwal Pelajaran
      </h3>

      {schedules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
          <p style={{ margin: 0 }}>Belum ada jadwal pelajaran untuk kelas Anda.</p>
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
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '0.375rem',
                      }}>
                        <span style={{ fontWeight: 500 }}>{schedule.subject}</span>
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
  )
}

