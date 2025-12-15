'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { trpc } from '@/lib/trpc'
import { UserIcon, XIconSmall, CheckIcon } from './Icons'
import LoadingSpinner from './LoadingSpinner'

interface User {
  id: string
  name: string
  email: string
  kelas: string | null
}

interface UserAutocompleteProps {
  value: User[]
  onChange: (users: User[]) => void
  placeholder?: string
  excludeUserId?: string // Exclude current user from results
  disabled?: boolean
}

export default function UserAutocomplete({
  value,
  onChange,
  placeholder = 'Cari dan pilih anggota kelompok...',
  excludeUserId,
  disabled = false,
}: UserAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  // Search users with debounce
  const { data: searchResults = [], isLoading: isSearching } = trpc.auth.searchUsers.useQuery(
    {
      query: searchQuery,
      excludeUserId: excludeUserId,
      limit: 10,
    },
    {
      enabled: isOpen && searchQuery.length >= 1,
      staleTime: 5000,
    }
  )

  // Filter out already selected users
  const selectedUserIds = new Set(value.map((u) => u.id))
  const availableResults = searchResults.filter((user) => !selectedUserIds.has(user.id))

  // Mount check for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Calculate dropdown position when opened
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const updatePosition = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: containerRect.bottom + 4,
          left: containerRect.left,
          width: containerRect.width,
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // Handle render and animation state
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsAnimating(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleSelectUser = (user: User) => {
    onChange([...value, user])
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleRemoveUser = (userId: string) => {
    onChange(value.filter((u) => u.id !== userId))
  }

  const dropdownContent = shouldRender && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 9999,
        opacity: isAnimating ? 1 : 0,
        transform: isAnimating ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
    >
      {isSearching ? (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          <LoadingSpinner size={20} color="var(--primary)" />
        </div>
      ) : availableResults.length > 0 ? (
        <div>
          {availableResults.map((user) => (
            <div
              key={user.id}
              onClick={() => handleSelectUser(user)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--primary)20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UserIcon size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-light)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.kelas || 'Tanpa kelas'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searchQuery.length > 0 ? (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-light)',
            fontSize: '0.875rem',
          }}
        >
          Tidak ada hasil untuk "{searchQuery}"
        </div>
      ) : (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-light)',
            fontSize: '0.875rem',
          }}
        >
          Ketik untuk mencari anggota...
        </div>
      )}
    </div>
  )

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {/* Selected users */}
      {value.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          {value.map((user) => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: 'var(--primary)15',
                border: '1px solid var(--primary)30',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: 'var(--text)',
              }}
            >
              <UserIcon size={14} style={{ color: 'var(--primary)' }} />
              <span>{user.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-light)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--danger)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-light)'
                  }}
                >
                  <XIconSmall size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontSize: '1rem',
          outline: 'none',
          transition: 'border-color 0.2s',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'var(--primary)'
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      />

      {/* Portal dropdown */}
      {mounted && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  )
}
