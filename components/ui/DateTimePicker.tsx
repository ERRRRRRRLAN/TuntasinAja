'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import { ClockIcon } from './Icons'

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
  const [isOpen, setIsOpen] = useState(false)
  const [dateValue, setDateValue] = useState(value ? value.split('T')[0] : '')
  const [timeValue, setTimeValue] = useState(value ? value.split('T')[1] || '00:00' : '00:00')
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDateValue(newDate)
    if (newDate && timeValue) {
      onChange(`${newDate}T${timeValue}`)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (dateValue && newTime) {
      onChange(`${dateValue}T${newTime}`)
    }
  }

  const handleClear = () => {
    setDateValue('')
    setTimeValue('00:00')
    onChange('')
    setIsOpen(false)
  }

  const displayValue = value
    ? format(toJakartaDate(new Date(value)), 'd MMM yyyy, HH:mm', { locale: id })
    : ''

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
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
        <ClockIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
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

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--card)',
            border: '2px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
              Tanggal
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              min={min?.split('T')[0]}
              max={max?.split('T')[0]}
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
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>
              Waktu
            </label>
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
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

