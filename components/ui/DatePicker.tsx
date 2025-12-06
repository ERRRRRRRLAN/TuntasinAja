'use client'

import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, setMonth, setYear, getMonth, getYear } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'

interface DatePickerProps {
  value: string // Format: 'YYYY-MM-DD'
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string // Format: 'YYYY-MM-DD'
  max?: string // Format: 'YYYY-MM-DD'
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const WEEKDAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  disabled = false,
  min,
  max,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      return new Date(value)
    }
    return new Date()
  })
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value))
    }
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowMonthPicker(false)
        setShowYearPicker(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // Check min/max constraints
    if (min && dateStr < min) return
    if (max && dateStr > max) return
    
    onChange(dateStr)
    setIsOpen(false)
    setShowMonthPicker(false)
    setShowYearPicker(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
    setShowMonthPicker(false)
    setShowYearPicker(false)
  }

  const handleToday = () => {
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    
    // Check min/max constraints
    if (min && todayStr < min) return
    if (max && todayStr > max) return
    
    onChange(todayStr)
    setCurrentMonth(today)
    setIsOpen(false)
    setShowMonthPicker(false)
    setShowYearPicker(false)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(setMonth(currentMonth, monthIndex))
    setShowMonthPicker(false)
  }

  const handleYearSelect = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year))
    setShowYearPicker(false)
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const selectedDate = value ? new Date(value) : null
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Generate year options (current year ± 10 years)
  const currentYear = getYear(currentMonth)
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

  const displayValue = value
    ? format(toJakartaDate(new Date(value)), 'd MMMM yyyy', { locale: id })
    : ''

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '2px solid var(--border)',
          borderRadius: '0.5rem',
          background: disabled ? 'var(--bg-secondary)' : 'var(--card)',
          color: disabled ? 'var(--text-light)' : 'var(--text)',
          fontSize: '1rem',
          fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'border-color 0.2s',
          minHeight: '44px',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'var(--primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'var(--border)'
          }
        }}
      >
        <CalendarIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>
          {displayValue || placeholder}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.25rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.color = 'var(--danger)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--text-light)'
            }}
            aria-label="Hapus"
          >
            ✕
          </button>
        )}
      </div>

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '2px solid var(--border)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            padding: '1rem',
            minWidth: '280px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={goToPreviousMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.25rem',
                color: 'var(--text)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeftIcon size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker)
                  setShowYearPicker(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                <span>{MONTHS[getMonth(currentMonth)]}</span>
                <span style={{ fontSize: '0.75rem' }}>▼</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowYearPicker(!showYearPicker)
                  setShowMonthPicker(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  borderRadius: '0.25rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                <span>{getYear(currentMonth)}</span>
                <span style={{ fontSize: '0.75rem' }}>▼</span>
              </button>
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.25rem',
                color: 'var(--text)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
              aria-label="Bulan berikutnya"
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>

          {/* Month Picker */}
          {showMonthPicker && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
            }}>
              {MONTHS.map((month, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    background: getMonth(currentMonth) === index ? 'var(--primary)' : 'transparent',
                    color: getMonth(currentMonth) === index ? 'white' : 'var(--text)',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (getMonth(currentMonth) !== index) {
                      e.currentTarget.style.background = 'var(--card)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getMonth(currentMonth) !== index) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {month.substring(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Year Picker */}
          {showYearPicker && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearSelect(year)}
                  style={{
                    padding: '0.5rem',
                    border: 'none',
                    background: getYear(currentMonth) === year ? 'var(--primary)' : 'transparent',
                    color: getYear(currentMonth) === year ? 'white' : 'var(--text)',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (getYear(currentMonth) !== year) {
                      e.currentTarget.style.background = 'var(--card)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getYear(currentMonth) !== year) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* Weekday Headers */}
          {!showMonthPicker && !showYearPicker && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.25rem',
                marginBottom: '0.5rem',
              }}>
                {WEEKDAYS_SHORT.map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-light)',
                      padding: '0.5rem',
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.25rem',
                marginBottom: '1rem',
              }}>
                {days.map((day, index) => {
                  const dayStr = format(day, 'yyyy-MM-dd')
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isToday = dayStr === todayStr
                  const isDisabled = Boolean((min && dayStr < min) || (max && dayStr > max))

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      style={{
                        padding: '0.75rem',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                        background: isSelected
                          ? 'var(--primary)'
                          : isToday
                          ? 'var(--bg-secondary)'
                          : 'transparent',
                        color: isSelected
                          ? 'white'
                          : !isCurrentMonth
                          ? 'var(--text-light)'
                          : isDisabled
                          ? 'var(--text-light)'
                          : 'var(--text)',
                        borderRadius: '0.5rem',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: isSelected || isToday ? 600 : 400,
                        transition: 'all 0.2s',
                        opacity: isDisabled ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled && !isSelected) {
                          e.currentTarget.style.background = 'var(--bg-secondary)'
                          e.currentTarget.style.borderColor = 'var(--primary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled && !isSelected) {
                          e.currentTarget.style.background = isToday ? 'var(--bg-secondary)' : 'transparent'
                          e.currentTarget.style.borderColor = 'transparent'
                        }
                      }}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
              }}>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  Today
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

