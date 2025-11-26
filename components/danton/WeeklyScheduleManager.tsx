'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CalendarIcon } from '@/components/ui/Icons'
import ScheduleEditQuickView from './ScheduleEditQuickView'

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
  const savedScrollPositionRef = useRef<number>(0)
  const shouldRestoreScrollRef = useRef<boolean>(false)

  const { data: scheduleData, isLoading } = trpc.weeklySchedule.getSchedule.useQuery()

  // Restore scroll position after data is updated
  useEffect(() => {
    if (shouldRestoreScrollRef.current && scheduleData) {
      // Wait a bit for DOM to update after data refetch
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: savedScrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior
        })
        shouldRestoreScrollRef.current = false
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [scheduleData])

  const handleCellClick = (day: string, period: number) => {
    // Save current scroll position before opening quickview
    savedScrollPositionRef.current = window.scrollY
    setEditingCell({ day, period })
  }

  const handleCloseQuickView = () => {
    setEditingCell(null)
    // Mark that we should restore scroll position after data refetch
    shouldRestoreScrollRef.current = true
  }

  const getCurrentSubject = () => {
    if (!editingCell || !scheduleData) return ''
    
    const scheduleItem = scheduleData.schedule[editingCell.day as keyof typeof scheduleData.schedule]?.find(
      s => s.period === editingCell.period
    )
    
    return scheduleItem?.subject || ''
  }

  const getDayName = () => {
    if (!editingCell || !scheduleData) return ''
    
    return scheduleData.dayNames[editingCell.day as keyof typeof scheduleData.dayNames]
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
    <div className="card" style={{ overflow: 'hidden' }}>
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
        Klik pada sel untuk menambah atau mengubah jadwal pelajaran.
      </p>

      {/* Schedule Table */}
      <div style={{ 
        margin: '0 -1.5rem',
        padding: '0 1.5rem',
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
                borderRight: '1px solid var(--border)',
                position: 'sticky',
                left: '1.5rem',
                background: 'var(--card)',
                zIndex: 1,
                boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
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
                  borderRight: '1px solid var(--border)',
                  position: 'sticky',
                  left: '1.5rem',
                  background: 'var(--card)',
                  zIndex: 1,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
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
        <strong>Tips:</strong> Klik pada sel untuk menambah atau mengubah jadwal. Quick view akan muncul untuk memilih mata pelajaran.
      </div>

      {/* Schedule Edit QuickView */}
      {editingCell && (
        <ScheduleEditQuickView
          day={editingCell.day}
          period={editingCell.period}
          dayName={getDayName()}
          currentSubject={getCurrentSubject()}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  )
}

