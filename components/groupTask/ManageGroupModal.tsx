'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { XCloseIcon, UserIcon, TrashIcon } from '@/components/ui/Icons'
import { useBackHandler } from '@/hooks/useBackHandler'

interface ManageGroupModalProps {
  isOpen: boolean
  onClose: () => void
  threadId: string
  maxGroupMembers: number
  onSuccess: () => void
}

export default function ManageGroupModal({
  isOpen,
  onClose,
  threadId,
  maxGroupMembers,
  onSuccess,
}: ManageGroupModalProps) {
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
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    } else {
      setIsVisible(false)
      setSearchQuery('')
      setSelectedNames(new Set())
    }
  }, [isOpen])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Get existing members
  const { data: existingMembers, isLoading: isLoadingMembers } = trpc.groupTask.getGroupMembers.useQuery(
    { threadId },
    { enabled: isOpen }
  )

  // Search users
  const { data: searchResults, isLoading: isSearching } = trpc.groupTask.searchUsersByName.useQuery(
    {
      threadId,
      query: debouncedQuery,
    },
    {
      enabled: isOpen && debouncedQuery.length >= 1,
      staleTime: 0,
    }
  )

  const existingMemberCount = existingMembers?.length || 0
  const availableSlots = maxGroupMembers - existingMemberCount
  const canAddMore = selectedNames.size <= availableSlots

  const utils = trpc.useUtils()

  const addMembers = trpc.groupTask.addMembers.useMutation({
    onSuccess: () => {
      toast.success('Anggota berhasil ditambahkan')
      setSearchQuery('')
      setSelectedNames(new Set())
      utils.thread.getById.invalidate({ id: threadId })
      utils.groupTask.getGroupMembers.invalidate({ threadId })
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menambahkan anggota')
    },
  })

  const removeMember = trpc.groupTask.removeMember.useMutation({
    onSuccess: () => {
      toast.success('Anggota berhasil dihapus')
      utils.thread.getById.invalidate({ id: threadId })
      utils.groupTask.getGroupMembers.invalidate({ threadId })
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus anggota')
    },
  })

  const handleSelectUser = (name: string) => {
    if (selectedNames.has(name)) {
      setSelectedNames((prev) => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    } else {
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
    setSearchQuery('')
  }

  const handleAddMembers = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedNames.size === 0) {
      toast.warning('Pilih minimal 1 anggota untuk ditambahkan')
      return
    }

    addMembers.mutate({
      threadId,
      userNames: Array.from(selectedNames),
    })
  }

  const handleRemoveMember = (userId: string, userName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${userName} dari kelompok?`)) {
      removeMember.mutate({
        threadId,
        userId,
      })
    }
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
        alignItems: window.innerWidth <= 640 ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: window.innerWidth <= 640 ? '0' : '1rem',
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
          borderRadius: window.innerWidth <= 640 ? '1rem 1rem 0 0' : '1rem',
          padding: window.innerWidth <= 640 ? '1rem' : '1.5rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: window.innerWidth <= 640 ? '90vh' : '90vh',
          overflow: 'auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible 
            ? (window.innerWidth <= 640 ? 'translateY(0)' : 'translateY(0) scale(1)')
            : (window.innerWidth <= 640 ? 'translateY(100%)' : 'translateY(20px) scale(0.95)'),
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Kelola Kelompok</h3>
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
          Maksimal {maxGroupMembers} anggota. Anda sudah memiliki {existingMemberCount} anggota.
          {availableSlots > 0 ? (
            <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
              {' '}Bisa tambah {availableSlots} anggota lagi.
            </span>
          ) : (
            <span style={{ color: 'var(--danger)', fontWeight: 500 }}> Kelompok sudah penuh.</span>
          )}
        </div>

        {/* Existing Members */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: 0, marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
            Anggota Saat Ini ({existingMemberCount})
          </h4>
          {isLoadingMembers ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <LoadingSpinner size={20} />
            </div>
          ) : existingMembers && existingMembers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {existingMembers.map((member) => (
                <div
                  key={member.id}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.875rem' }}>
                        {member.user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{member.user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                    disabled={removeMember.isLoading}
                    style={{
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      cursor: removeMember.isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: removeMember.isLoading ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                    title="Hapus anggota"
                    aria-label={`Hapus ${member.user.name}`}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
              Belum ada anggota
            </div>
          )}
        </div>

        {/* Add Members Section */}
        {availableSlots > 0 && (
          <div>
            <h4 style={{ margin: 0, marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
              Tambah Anggota
            </h4>

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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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

            {/* Add Button */}
            {selectedNames.size > 0 && (
              <button
                type="button"
                onClick={handleAddMembers}
                className="btn btn-primary"
                disabled={addMembers.isLoading || !canAddMore}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 640 ? '0.875rem 1.25rem' : '0.625rem 1.25rem',
                  fontSize: window.innerWidth <= 640 ? '1rem' : '0.875rem',
                }}
              >
                {addMembers.isLoading ? (
                  <>
                    <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                    Menambahkan...
                  </>
                ) : (
                  `Tambah ${selectedNames.size} Anggota`
                )}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end', 
          marginTop: '1.5rem',
          flexDirection: window.innerWidth <= 640 ? 'column' : 'row'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: window.innerWidth <= 640 ? '0.875rem 1.25rem' : '0.625rem 1.25rem',
              width: window.innerWidth <= 640 ? '100%' : 'auto',
              fontSize: window.innerWidth <= 640 ? '1rem' : '0.875rem',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

