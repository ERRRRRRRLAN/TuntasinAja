'use client'

import { useState, useRef, useEffect } from 'react'
import { FilterIcon, XIconSmall, CheckIcon } from './Icons'

const MATA_PELAJARAN = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'Pendidikan Agama',
  'Pendidikan Kewarganegaraan',
  'Seni Budaya',
  'Pendidikan Jasmani',
  'TIK',
  'Bahasa Jawa',
  'Bahasa Sunda',
  'Prakarya',
]

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options?: string[]
  showAllOption?: boolean
  allValue?: string
  allLabel?: string
  searchPlaceholder?: string
  icon?: React.ReactNode
  emptyMessage?: string
}

export default function ComboBox({ 
  value, 
  onChange, 
  placeholder = 'Pilih Mata Pelajaran',
  options = MATA_PELAJARAN,
  showAllOption = true,
  allValue = 'all',
  allLabel = 'Semua Mata Pelajaran',
  searchPlaceholder = 'Cari mata pelajaran...',
  icon,
  emptyMessage = 'Tidak ada mata pelajaran yang ditemukan'
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get display value
  const displayValue = value === allValue && showAllOption ? allLabel : value || placeholder

  // Handle visibility based on isOpen
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready before showing
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      // When closing, keep isVisible true to show closing animation
      // Then set to false after transition completes
      if (isVisible) {
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, 200) // Match transition duration
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    // Focus input when opened
    requestAnimationFrame(() => {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(showAllOption ? allValue : '')
    setSearchQuery('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
            setSearchQuery('')
          } else {
            setIsOpen(true)
          }
        }}
        style={{
          width: '100%',
          padding: '0.625rem 0.75rem 0.625rem 2.5rem',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          background: 'var(--card)',
          color: value === allValue && showAllOption ? 'var(--text-light)' : 'var(--text)',
          fontSize: '0.875rem',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          minHeight: '42px'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--border)'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {icon || (
            <FilterIcon 
              size={18} 
              style={{ 
                color: 'var(--text-light)',
                flexShrink: 0
              }} 
            />
          )}
          <span style={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {displayValue}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          {value !== allValue && value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                borderRadius: '0.25rem',
                transition: 'background 0.2s',
                marginRight: '0.25rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = 'var(--text-light)'
              }}
              aria-label="Clear selection"
            >
              <XIconSmall size={14} />
            </button>
          )}
          <span style={{
            color: 'var(--text-light)',
            fontSize: '0.75rem',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {(isOpen || isVisible) && (
        <div
          ref={dropdownRef}
          className="combobox-dropdown"
          onTransitionEnd={(e) => {
            // Only handle transition end for this element (not child elements)
            if (e.target === dropdownRef.current && !isOpen && !isVisible) {
              // Transition completed, dropdown can be safely unmounted
            }
          }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            pointerEvents: isVisible ? 'auto' : 'none',
            visibility: isVisible ? 'visible' : 'hidden'
          }}
        >
          {/* Search Input */}
          <div style={{
            padding: '0.75rem',
            borderBottom: '1px solid var(--border)'
          }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{
            overflowY: 'auto',
            maxHeight: '250px'
          }}>
            {/* All Option */}
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelect(allValue)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: value === allValue ? 'var(--bg-secondary)' : 'transparent',
                  color: value === allValue ? 'var(--primary)' : 'var(--text)',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s',
                  fontWeight: value === allValue ? 600 : 400
                }}
                onMouseEnter={(e) => {
                  if (value !== allValue) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== allValue) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span>{allLabel}</span>
                {value === allValue && (
                  <CheckIcon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                )}
              </button>
            )}

            {/* Filtered Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: value === option ? 'var(--bg-secondary)' : 'transparent',
                    color: value === option ? 'var(--primary)' : 'var(--text)',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s',
                    fontWeight: value === option ? 600 : 400,
                    borderTop: showAllOption || filteredOptions.indexOf(option) > 0 ? '1px solid var(--border)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option) {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span>{option}</span>
                  {value === option && (
                    <CheckIcon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  )}
                </button>
              ))
            ) : (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--text-light)',
                fontSize: '0.875rem'
              }}>
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

