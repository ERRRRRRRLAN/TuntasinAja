'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { XCloseIcon, UserIcon } from '@/components/ui/Icons'
import { useBackHandler } from '@/hooks/useBackHandler'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  threadId: string
  maxGroupMembers: number
  onSuccess: () => void
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  threadId,
  maxGroupMembers,
  onSuccess,
}: CreateGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search users
  const { data: searchResults, isLoading: isSearching } = trpc.groupTask.searchUsersByName.useQuery(
    {
      threadId,
      query: debouncedQuery,
    },
    {
      enabled: isOpen && debouncedQuery.length >= 1,
      staleTime: 0, // Always fetch fresh results
    }
  )

  // Get existing members count
  const { data: existingMembers } = trpc.groupTask.getGroupMembers.useQuery(
    { threadId },
    { enabled: isOpen }
  )

  const existingMemberCount = existingMembers?.length || 0
  // Creator will be auto-added, so available slots = max - existing - 1 (for creator)
  // But if creator already exists, then available slots = max - existing
  const availableSlots = maxGroupMembers - existingMemberCount
  const canAddMore = selectedNames.size <= availableSlots

  const utils = trpc.useUtils()

  const createGroup = trpc.groupTask.createGroup.useMutation({
    onSuccess: () => {
      toast.success('Kelompok berhasil dibuat')
      setSearchQuery('')
      setSelectedNames(new Set())
      utils.thread.getById.invalidate({ id: threadId })
      utils.thread.getAll.invalidate()
      utils.groupTask.getGroupMembers.invalidate({ threadId })
      onSuccess()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal membuat kelompok')
    },
  })

  const handleSelectUser = (name: string) => {
    if (selectedNames.has(name)) {
      // Remove
      setSelectedNames((prev) => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    } else {
      // Add - check limit
      if (selectedNames.size >= availableSlots) {
        toast.warning(`Maksimal ${availableSlots} anggota yang bisa ditambahkan`)
        return
      }
      setSelectedNames((prev) => {
        const next = new Set(prev)
        next.add(name)
        return next
      })
    }
    // Clear search after selection
    setSearchQuery('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedNames.size === 0) {
      toast.warning('Pilih minimal 1 anggota untuk membuat kelompok')
      return
    }

    createGroup.mutate({
      threadId,
      userNames: Array.from(selectedNames),
    })
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  // Handle browser back button
  const [shouldHandleBack, setShouldHandleBack] = useState(false)

  useEffect(() => {
    if (isOpen && isVisible) {
      const timer = setTimeout(() => {
        setShouldHandleBack(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShouldHandleBack(false)
    }
  }, [isOpen, isVisible])

  useBackHandler(shouldHandleBack, onClose)

  if (!mounted || !isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '1rem',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Buat Kelompok</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            aria-label="Tutup"
          >
            <XCloseIcon size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
          Pilih anggota yang bisa melihat dan mengerjakan tugas ini. Ketik nama untuk mencari.
        </p>

        {/* Info about max members */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-light)',
          }}
        >
          Maksimal {maxGroupMembers} anggota (termasuk Anda). 
          {existingMemberCount > 0 ? (
            <>
              {' '}Anda sudah memiliki {existingMemberCount} anggota.
              {availableSlots > 0 ? (
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  {' '}Bisa tambah {availableSlots} anggota lagi.
                </span>
              ) : (
                <span style={{ color: 'var(--danger)', fontWeight: 500 }}> Kelompok sudah penuh.</span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
              {' '}Bisa tambah {availableSlots} anggota (Anda akan otomatis ditambahkan sebagai anggota).
            </span>
          )}
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="memberSearch" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Cari Anggota
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              id="memberSearch"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama anggota (misal: makarim)"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                paddingLeft: '2.5rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            >
              <UserIcon size={18} />
            </div>
            {isSearching && (
              <div
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <LoadingSpinner size={16} />
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 1 && (
          <div
            style={{
              marginBottom: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
            }}
          >
            {isSearching ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                <LoadingSpinner size={20} />
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Mencari...</p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isSelected = selectedNames.has(user.name)
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user.name)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--bg)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent onClick
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{user.email}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                Tidak ada user ditemukan dengan nama "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Selected Members */}
        {selectedNames.size > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Anggota Terpilih ({selectedNames.size})
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {Array.from(selectedNames).map((name) => (
                <div
                  key={name}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>{name}</span>
                  <button
                    onClick={() => {
                      setSelectedNames((prev) => {
                        const next = new Set(prev)
                        next.delete(name)
                        return next
                      })
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '1rem',
                    }}
                    aria-label={`Hapus ${name}`}
                  >
                    <XCloseIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={createGroup.isLoading}
            style={{
              padding: '0.625rem 1.25rem',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={createGroup.isLoading || selectedNames.size === 0 || (availableSlots <= 0 && selectedNames.size > 0)}
            style={{
              padding: '0.625rem 1.25rem',
            }}
          >
            {createGroup.isLoading ? (
              <>
                <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                Membuat...
              </>
            ) : (
              `Buat Kelompok (${selectedNames.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

