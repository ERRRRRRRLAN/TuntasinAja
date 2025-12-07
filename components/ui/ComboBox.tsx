'use client'

import { useState, useRef, useEffect } from 'react'
import { FilterIcon, XIconSmall, CheckIcon } from './Icons'

const MATA_PELAJARAN = [
  'Dasar BC',
  'Bahasa Inggris',
  'Seni Musik',
  'Koding dan Kecerdasan Artificial',
  'Matematika',
  'Mulok BK',
  'Mulok Batik',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Proj IPAS',
  'Sejarah',
  'PJOK',
  'PAI & BP',
  'Informatika',
  // Legacy mata pelajaran (untuk backward compatibility)
  'PAI',
  'Pendidikan Kewarganegaraan Negara',
  'Dasar PPLG',
  'IPAS',
]

interface ComboBoxOption {
  value: string
  label: string
}

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options?: string[] | ComboBoxOption[]
  showAllOption?: boolean
  allValue?: string
  allLabel?: string
  searchPlaceholder?: string
  icon?: React.ReactNode
  emptyMessage?: string
  disabled?: boolean
  showSearch?: boolean // New prop to control search box visibility
  showClear?: boolean // New prop to control clear button visibility
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
  emptyMessage = 'Tidak ada mata pelajaran yang ditemukan',
  disabled = false,
  showSearch = true, // Default to true for backward compatibility
  showClear = true // Default to true for backward compatibility
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Normalize options to ComboBoxOption format
  const normalizedOptions: ComboBoxOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })

  // Filter options based on search query (only if search is enabled)
  const filteredOptions = showSearch
    ? normalizedOptions.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : normalizedOptions

  // Get display value
  const selectedOption = normalizedOptions.find(opt => opt.value === value)
  const displayValue = value === allValue && showAllOption 
    ? allLabel 
    : selectedOption?.label || value || placeholder

  // Handle render and animation state
  useEffect(() => {
    if (isOpen) {
      // Start rendering
      setShouldRender(true)
      setIsAnimating(false)
      // Small delay to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      // Start closing animation
      setIsAnimating(false)
      // Wait for transition to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 200) // Match transition duration
      return () => clearTimeout(timer)
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
    // Focus input when opened (only if search is enabled)
    if (showSearch) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 50)
      })
    }

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

  const handleSelect = (optionValue: string) => {
    if (disabled) return
    onChange(optionValue)
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
          if (disabled) return
          if (isOpen) {
            setIsOpen(false)
            setSearchQuery('')
          } else {
            setIsOpen(true)
          }
        }}
        disabled={disabled}
        style={{
          width: '100%',
          padding: showAllOption || icon !== undefined 
            ? '0.625rem 0.75rem 0.625rem 2.5rem' 
            : '0.625rem 0.75rem',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          background: disabled ? 'var(--bg-secondary)' : 'var(--card)',
          color: disabled ? 'var(--text-light)' : (value === allValue && showAllOption ? 'var(--text-light)' : 'var(--text)'),
          fontSize: '0.875rem',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          minHeight: '42px',
          opacity: disabled ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = 'var(--primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = 'var(--border)'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {icon !== undefined ? icon : (showAllOption ? (
            <FilterIcon 
              size={18} 
              style={{ 
                color: 'var(--text-light)',
                flexShrink: 0
              }} 
            />
          ) : null)}
          <span style={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {displayValue}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          {showClear && value !== allValue && value && (
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
      {shouldRender && (
        <div
          ref={dropdownRef}
          className="combobox-dropdown"
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
            display: 'flex',
            flexDirection: 'column',
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            pointerEvents: isAnimating ? 'auto' : 'none',
            visibility: shouldRender ? 'visible' : 'hidden'
          }}
        >
          {/* Search Input - Only show if showSearch is true */}
          {showSearch && (
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
          )}

          {/* Options List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column'
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
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: value === option.value ? 'var(--bg-secondary)' : 'transparent',
                    color: value === option.value ? 'var(--primary)' : 'var(--text)',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.15s',
                    fontWeight: value === option.value ? 600 : 400,
                    borderTop: showAllOption || filteredOptions.indexOf(option) > 0 ? '1px solid var(--border)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option.value) {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option.value) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
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

