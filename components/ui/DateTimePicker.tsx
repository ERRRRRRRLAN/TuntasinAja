'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import { ClockIcon } from './Icons'
import DatePicker from './DatePicker'

interface DateTimePickerProps {
  value: string // Format: 'YYYY-MM-DDTHH:mm'
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string // Format: 'YYYY-MM-DDTHH:mm'
  max?: string // Format: 'YYYY-MM-DDTHH:mm'
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal dan waktu',
  disabled = false,
  min,
  max,
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState(value ? value.split('T')[0] : '')
  const [timeValue, setTimeValue] = useState(value ? value.split('T')[1] || '00:00' : '00:00')
  const [isTimeOpen, setIsTimeOpen] = useState(false)
  const timeContainerRef = useRef<HTMLDivElement>(null)

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const [date, time] = value.split('T')
      setDateValue(date || '')
      setTimeValue(time || '00:00')
    } else {
      setDateValue('')
      setTimeValue('00:00')
    }
  }, [value])

  // Close time dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeContainerRef.current && !timeContainerRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false)
      }
    }

    if (isTimeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isTimeOpen])

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate)
    if (newDate && timeValue) {
      onChange(`${newDate}T${timeValue}`)
    } else if (newDate) {
      onChange(`${newDate}T00:00`)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (dateValue && newTime) {
      onChange(`${dateValue}T${newTime}`)
    }
  }

  const displayValue = value
    ? format(toJakartaDate(new Date(value)), 'd MMM yyyy, HH:mm', { locale: id })
    : ''

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Date Picker */}
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
          Tanggal
        </label>
        <DatePicker
          value={dateValue}
          onChange={handleDateChange}
          placeholder="Pilih tanggal"
          disabled={disabled}
          min={min?.split('T')[0]}
          max={max?.split('T')[0]}
        />
      </div>

      {/* Time Picker */}
      <div ref={timeContainerRef} style={{ position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
          Waktu
        </label>
        <div
          onClick={() => !disabled && setIsTimeOpen(!isTimeOpen)}
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
          <ClockIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left' }}>
            {timeValue || '00:00'}
          </span>
        </div>

        {isTimeOpen && !disabled && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              left: 0,
              right: 0,
              background: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
                background: 'var(--card)',
                color: 'var(--text)',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsTimeOpen(false)}
                className="btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
