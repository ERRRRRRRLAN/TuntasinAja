'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { CrownIcon, TrashIcon, EditIcon, SearchIcon, XIconSmall, EyeIcon, EyeOffIcon, CheckCircleIcon, AlertTriangleIcon, SchoolIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EditUserForm from '@/components/admin/EditUserForm'
import ComboBox from '@/components/ui/ComboBox'
import Checkbox from '@/components/ui/Checkbox'

// Generate list of kelas options
const generateKelasOptions = () => {
  const kelasOptions: string[] = []
  const tingkat = ['X', 'XI', 'XII']
  const jurusan = ['RPL', 'TKJ', 'BC']
  const nomor = ['1', '2']

  tingkat.forEach((t) => {
    jurusan.forEach((j) => {
      nomor.forEach((n) => {
        kelasOptions.push(`${t} ${j} ${n}`)
      })
    })
  })

  return kelasOptions
}

export default function UserList() {
  const { data: session } = useSession()
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState('')
  const [deleteUserEmail, setDeleteUserEmail] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKelas, setSelectedKelas] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewingPasswordUserId, setViewingPasswordUserId] = useState<string | null>(null)
  const [showPasswordHash, setShowPasswordHash] = useState<Record<string, boolean>>({})
  const [passwordHashes, setPasswordHashes] = useState<Record<string, string>>({})

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768) // 768px breakpoint for tablet/mobile
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const { data: users, isLoading, refetch } = trpc.auth.getAllUsers.useQuery()
  const utils = trpc.useUtils()
  const kelasOptions = generateKelasOptions()
  const getUserPasswordHash = trpc.auth.getUserPasswordHash.useQuery(
    { userId: viewingPasswordUserId! },
    {
      enabled: !!viewingPasswordUserId,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  )

  // Handle view password
  const handleViewPassword = (userId: string) => {
    if (viewingPasswordUserId === userId) {
      setViewingPasswordUserId(null)
      setShowPasswordHash({ ...showPasswordHash, [userId]: false })
      // Clear password hash when closing
      setPasswordHashes(prev => {
        const newHashes = { ...prev }
        delete newHashes[userId]
        return newHashes
      })
    } else {
      setViewingPasswordUserId(userId)
      setShowPasswordHash({ ...showPasswordHash, [userId]: false })
    }
  }

  // Update password when query completes
  useEffect(() => {
    if (getUserPasswordHash.data && viewingPasswordUserId) {
      // Show decrypted password if available
      if (getUserPasswordHash.data.password !== null && getUserPasswordHash.data.password !== undefined && getUserPasswordHash.data.password !== '') {
        setPasswordHashes(prev => ({
          ...prev,
          [viewingPasswordUserId]: getUserPasswordHash.data!.password!,
        }))
      } else {
        // If password not available, check if there's an error
        if (getUserPasswordHash.data.decryptError) {
          console.error('[UserList] Decrypt error:', getUserPasswordHash.data.decryptError)
        }
        // Set to empty so we can show warning message
        setPasswordHashes(prev => ({
          ...prev,
          [viewingPasswordUserId]: '',
        }))
      }
    }
  }, [getUserPasswordHash.data, viewingPasswordUserId])

  // Filter users based on search query and kelas
  const filteredUsers = useMemo(() => {
    if (!users) return []

    return users.filter((user) => {
      // Filter by kelas
      if (selectedKelas && user.kelas !== selectedKelas) {
        return false
      }

      // Filter by search query (name or email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = user.name.toLowerCase().includes(query)
        const matchesEmail = user.email.toLowerCase().includes(query)
        return matchesName || matchesEmail
      }

      return true
    })
  }, [users, searchQuery, selectedKelas])

  const deleteUser = trpc.auth.deleteUser.useMutation({
    onSuccess: () => {
      utils.auth.getAllUsers.invalidate()
      setDeleteUserId(null)
      setDeleteUserName('')
      setDeleteUserEmail('')
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error)
      console.error('[ERROR]', error.message || 'Gagal menghapus user. Silakan coba lagi.')
      setDeleteUserId(null)
      setDeleteUserName('')
      setDeleteUserEmail('')
    },
  })

  const bulkDeleteUsers = trpc.auth.bulkDeleteUsers.useMutation({
    onSuccess: (data) => {
      utils.auth.getAllUsers.invalidate()
      setSelectedUserIds(new Set())
      setShowBulkDeleteConfirm(false)
      if (data.success > 0) {
        console.log('[SUCCESS]', `Berhasil menghapus ${data.success} user`)
      }
      if (data.failed > 0) {
        console.error('[ERROR]', `Gagal menghapus ${data.failed} user. ${data.errors.join('; ')}`)
      }
    },
    onError: (error: any) => {
      console.error('Error bulk deleting users:', error)
      console.error('[ERROR]', error.message || 'Gagal menghapus user. Silakan coba lagi.')
      setShowBulkDeleteConfirm(false)
    },
  })

  // Handle select/deselect user
  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.filter(u => u.id !== session?.user?.id).length) {
      // Deselect all
      setSelectedUserIds(new Set())
    } else {
      // Select all (except current user)
      const allIds = new Set(
        filteredUsers
          .filter(u => u.id !== session?.user?.id)
          .map(u => u.id)
      )
      setSelectedUserIds(allIds)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    const userIds = Array.from(selectedUserIds)
    if (userIds.length === 0) {
      console.error('[ERROR] Pilih minimal satu user untuk dihapus')
      return
    }
    bulkDeleteUsers.mutate({ userIds })
  }

  const handleDeleteClick = (userId: string, userName: string, userEmail: string) => {
    setDeleteUserId(userId)
    setDeleteUserName(userName)
    setDeleteUserEmail(userEmail)
  }

  const handleConfirmDelete = () => {
    if (deleteUserId && !deleteUser.isLoading) {
      deleteUser.mutate({ userId: deleteUserId })
    }
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat daftar users...</p>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-light)' }}>Belum ada user terdaftar.</p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Daftar Users
        </h3>

        {/* Bulk Actions */}
        {selectedUserIds.size > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)'
          }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {selectedUserIds.size} user dipilih
            </span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={bulkDeleteUsers.isLoading}
              style={{
                background: 'transparent',
                color: 'var(--text-light)',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                cursor: bulkDeleteUsers.isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: bulkDeleteUsers.isLoading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!bulkDeleteUsers.isLoading) {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = '#dc2626'
                }
              }}
              onMouseLeave={(e) => {
                if (!bulkDeleteUsers.isLoading) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-light)'
                }
              }}
            >
              <TrashIcon size={14} />
              Hapus {selectedUserIds.size} User
            </button>
            <button
              onClick={() => setSelectedUserIds(new Set())}
              disabled={bulkDeleteUsers.isLoading}
              style={{
                background: 'transparent',
                color: 'var(--text-light)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                cursor: bulkDeleteUsers.isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!bulkDeleteUsers.isLoading) {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!bulkDeleteUsers.isLoading) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              Batal
            </button>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            flex: isMobile ? '1 1 100%' : '1',
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? '100%' : '200px',
            maxWidth: isMobile ? '100%' : '400px'
          }}>
            <SearchIcon
              size={18}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '2.75rem',
                paddingRight: searchQuery ? '2.5rem' : '0.875rem',
                border: '2px solid var(--border)',
                borderRadius: '0.5rem',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                type="button"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-light)',
                  borderRadius: '0.25rem',
                  transition: 'color 0.2s, background 0.2s',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)'
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-light)'
                  e.currentTarget.style.background = 'transparent'
                }}
                aria-label="Hapus pencarian"
              >
                <XIconSmall size={16} />
              </button>
            )}
          </div>

          {/* Kelas Filter */}
          <div style={{
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? '100%' : '180px'
          }}>
            <ComboBox
              value={selectedKelas}
              onChange={setSelectedKelas}
              placeholder="Pilih Kelas"
              options={kelasOptions}
              showAllOption={true}
              allValue=""
              allLabel="Semua Kelas"
              searchPlaceholder="Cari kelas..."
              emptyMessage="Tidak ada kelas yang ditemukan"
            />
          </div>

          {/* Results Count */}
          <div style={{
            color: 'var(--text-light)',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            width: isMobile ? '100%' : 'auto',
            textAlign: isMobile ? 'center' : 'left',
          }}>
            {filteredUsers.length} dari {users.length} user
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-light)'
          }}>
            <p>Tidak ada user yang sesuai dengan filter.</p>
          </div>
        ) : isMobile ? (
          // Mobile Card View
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredUsers.map((user) => {
              const isCurrentUser = user.id === session?.user?.id
              const isSelected = selectedUserIds.has(user.id)
              return (
                <div
                  key={user.id}
                  style={{
                    padding: '1rem',
                    background: isCurrentUser
                      ? 'var(--bg-secondary)'
                      : isSelected
                        ? 'rgba(var(--primary-rgb), 0.1)'
                        : 'var(--card)',
                    borderRadius: '0.75rem',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {/* Header: Checkbox + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {!isCurrentUser && (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleUser(user.id)}
                        size={18}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'var(--text)',
                          wordBreak: 'break-word',
                        }}>
                          {user.name}
                        </h4>
                        {isCurrentUser && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            fontWeight: 600
                          }}>
                            (Anda)
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-light)',
                        marginTop: '0.25rem',
                        wordBreak: 'break-all',
                      }}>
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    gridColumn: '1 / -1'
                  }}>
                    {/* Role */}
                    <div>
                      <div style={{
                        color: 'var(--text-light)',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                      }}>
                        Role
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {user.isAdmin && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.875rem',
                            color: 'var(--text)',
                            fontWeight: 500
                          }}>
                            <CrownIcon size={16} style={{ color: 'var(--primary)' }} />
                            <span>Admin</span>
                          </span>
                        )}
                        {(user as any).isDanton && !user.isAdmin && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontSize: '0.875rem',
                            color: 'var(--text)',
                            fontWeight: 500
                          }}>
                            <span style={{ color: '#f59e0b' }}>•</span>
                            <span>Danton</span>
                          </span>
                        )}
                        {!user.isAdmin && !(user as any).isDanton && (
                          <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-light)'
                          }}>
                            User
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Kelas */}
                    <div>
                      <div style={{
                        color: 'var(--text-light)',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                      }}>
                        Kelas
                      </div>
                      {user.kelas ? (
                        <span style={{
                          fontSize: '0.875rem',
                          color: 'var(--text)',
                          fontWeight: 500
                        }}>
                          {user.kelas}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          -
                        </span>
                      )}
                    </div>

                    {/* Sekolah */}
                    <div>
                      <div style={{
                        color: 'var(--text-light)',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                      }}>
                        Sekolah
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <SchoolIcon size={14} style={{ color: 'var(--text-light)' }} />
                        <span style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>
                          {user.school?.name || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Terdaftar */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{
                        color: 'var(--text-light)',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                      }}>
                        Terdaftar
                      </div>
                      <div style={{ color: 'var(--text)', fontSize: '0.875rem' }}>
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  {viewingPasswordUserId === user.id && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-light)',
                          fontWeight: 500,
                        }}>
                          Password
                        </div>
                        <button
                          onClick={() => {
                            setShowPasswordHash({
                              ...showPasswordHash,
                              [user.id]: !showPasswordHash[user.id],
                            })
                          }}
                          type="button"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--text-light)',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--text)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-light)'
                          }}
                          title={showPasswordHash[user.id] ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {showPasswordHash[user.id] ? (
                            <EyeOffIcon size={16} />
                          ) : (
                            <EyeIcon size={16} />
                          )}
                        </button>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: 'var(--text)',
                        wordBreak: 'break-all',
                        background: 'var(--card)',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--border)',
                      }}>
                        {showPasswordHash[user.id] && passwordHashes[user.id]
                          ? passwordHashes[user.id]
                          : '••••••••••••••••••••••••••••••••'}
                      </div>
                      {getUserPasswordHash.data?.password && getUserPasswordHash.data.password !== '' ? (
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-success)',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <CheckCircleIcon size={12} />
                          <span>Password asli (decrypted)</span>
                        </div>
                      ) : getUserPasswordHash.data && !getUserPasswordHash.isLoading ? (
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-warning)',
                          marginTop: '0.5rem',
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <AlertTriangleIcon size={12} />
                          <span>
                            {getUserPasswordHash.data.decryptError ? (
                              <>Error decrypt password: {getUserPasswordHash.data.decryptError}</>
                            ) : getUserPasswordHash.data.hasEncryptedPassword ? (
                              <>Password ter-encrypt tapi gagal di-decrypt</>
                            ) : (
                              <>Password belum di-encrypt</>
                            )}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {viewingPasswordUserId === user.id && getUserPasswordHash.isLoading && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}>
                      <LoadingSpinner size={16} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        Memuat password...
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {!isCurrentUser && (
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border)',
                      flexWrap: 'wrap',
                    }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleViewPassword(user.id)
                        }}
                        type="button"
                        title={viewingPasswordUserId === user.id ? 'Tutup Password' : 'Lihat Password'}
                        style={{
                          background: 'transparent',
                          color: viewingPasswordUserId === user.id ? 'var(--primary)' : 'var(--text-light)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '44px',
                          minHeight: '44px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)'
                          e.currentTarget.style.color = 'var(--primary)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = viewingPasswordUserId === user.id ? 'var(--primary)' : 'var(--text-light)'
                        }}
                      >
                        {viewingPasswordUserId === user.id ? (
                          <XIconSmall size={20} />
                        ) : (
                          <EyeIcon size={20} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingUserId(user.id)
                        }}
                        type="button"
                        title="Edit User"
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: 'var(--text-light)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          minHeight: '44px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)'
                          e.currentTarget.style.color = 'var(--primary)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-light)'
                        }}
                      >
                        <EditIcon size={18} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(user.id, user.name, user.email)
                        }}
                        disabled={deleteUser.isLoading}
                        title="Hapus User"
                        style={{
                          flex: 1,
                          background: 'transparent',
                          color: 'var(--text-light)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          cursor: deleteUser.isLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          opacity: deleteUser.isLoading ? 0.5 : 1,
                          minHeight: '44px'
                        }}
                        onMouseEnter={(e) => {
                          if (!deleteUser.isLoading) {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                            e.currentTarget.style.color = '#dc2626'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!deleteUser.isLoading) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-light)'
                          }
                        }}
                      >
                        {deleteUser.isLoading ? (
                          <>
                            <LoadingSpinner size={18} color="var(--text-light)" />
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          <>
                            <TrashIcon size={18} />
                            <span>Hapus</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          // Desktop Table View
          <div className="user-table" style={{
            overflowX: 'auto',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--card)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              minWidth: '900px'
            }}>
              <thead>
                <tr style={{
                  background: 'transparent',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    width: '50px',
                    position: 'sticky',
                    left: 0,
                    background: 'var(--card)',
                    zIndex: 10
                  }}>
                    <Checkbox
                      checked={
                        filteredUsers.filter(u => u.id !== session?.user?.id).length > 0 &&
                        filteredUsers.filter(u => u.id !== session?.user?.id).every(u => selectedUserIds.has(u.id))
                      }
                      onChange={handleSelectAll}
                      size={18}
                    />
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '150px'
                  }}>
                    Nama
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '200px'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '120px'
                  }}>
                    Role
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '150px'
                  }}>
                    Sekolah
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '120px'
                  }}>
                    Kelas
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '130px'
                  }}>
                    Terdaftar
                  </th>
                  <th style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    fontSize: '0.875rem',
                    minWidth: '150px',
                    position: 'sticky',
                    right: 0,
                    background: 'var(--card)',
                    zIndex: 10
                  }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.id === session?.user?.id
                  const isSelected = selectedUserIds.has(user.id)
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isCurrentUser
                          ? 'var(--bg-secondary)'
                          : isSelected
                            ? 'rgba(var(--primary-rgb), 0.03)'
                            : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentUser && !isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentUser && !isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <td style={{
                        padding: '1rem 0.75rem',
                        position: 'sticky',
                        left: 0,
                        background: isCurrentUser
                          ? 'var(--bg-secondary)'
                          : isSelected
                            ? 'rgba(var(--primary-rgb), 0.03)'
                            : 'var(--card)',
                        zIndex: 5
                      }}>
                        {!isCurrentUser && (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleUser(user.id)}
                            size={18}
                          />
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text)' }}>{user.name}</span>
                          {isCurrentUser && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              fontWeight: 600,
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              background: 'rgba(var(--primary-rgb), 0.1)'
                            }}>
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        <span style={{ wordBreak: 'break-word' }}>{user.email}</span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {user.isAdmin && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.875rem',
                              color: 'var(--text)',
                              fontWeight: 500
                            }}>
                              <CrownIcon size={16} style={{ color: 'var(--primary)' }} />
                              <span>Admin</span>
                            </span>
                          )}
                          {(user as any).isDanton && !user.isAdmin && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.875rem',
                              color: 'var(--text)',
                              fontWeight: 500
                            }}>
                              <span style={{ color: '#f59e0b' }}>•</span>
                              <span>Danton</span>
                            </span>
                          )}
                          {!user.isAdmin && !(user as any).isDanton && (
                            <span style={{
                              fontSize: '0.875rem',
                              color: 'var(--text-light)'
                            }}>
                              User
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: '150px' }}>
                          <SchoolIcon size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                            {(user as any).school?.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {user.kelas ? (
                          <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--text)',
                            fontWeight: 500
                          }}>
                            {user.kelas}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                            -
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td style={{
                        padding: '1rem 0.75rem',
                        textAlign: 'center',
                        position: 'sticky',
                        right: 0,
                        background: isCurrentUser
                          ? 'var(--bg-secondary)'
                          : isSelected
                            ? 'rgba(var(--primary-rgb), 0.03)'
                            : 'var(--card)',
                        zIndex: 5
                      }}>
                        {!isCurrentUser && (
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexWrap: 'nowrap'
                          }}>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleViewPassword(user.id)
                              }}
                              title={viewingPasswordUserId === user.id ? 'Tutup Password' : 'Lihat Password'}
                              type="button"
                              style={{
                                background: 'transparent',
                                color: viewingPasswordUserId === user.id ? 'var(--primary)' : 'var(--text-light)',
                                border: 'none',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.375rem',
                                minWidth: '36px',
                                minHeight: '36px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)'
                                e.currentTarget.style.color = 'var(--primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = viewingPasswordUserId === user.id ? 'var(--primary)' : 'var(--text-light)'
                              }}
                            >
                              {viewingPasswordUserId === user.id ? (
                                <XIconSmall size={18} />
                              ) : (
                                <EyeIcon size={18} />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setEditingUserId(user.id)
                                setTimeout(() => {
                                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                                }, 100)
                              }}
                              title="Edit User"
                              type="button"
                              style={{
                                background: 'transparent',
                                color: 'var(--text-light)',
                                border: 'none',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.375rem',
                                minWidth: '36px',
                                minHeight: '36px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)'
                                e.currentTarget.style.color = 'var(--primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--text-light)'
                              }}
                            >
                              <EditIcon size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(user.id, user.name, user.email)
                              }}
                              title="Hapus User"
                              disabled={deleteUser.isLoading}
                              style={{
                                background: 'transparent',
                                color: 'var(--text-light)',
                                border: 'none',
                                padding: '0.5rem',
                                cursor: deleteUser.isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.375rem',
                                opacity: deleteUser.isLoading ? 0.5 : 1,
                                minWidth: '36px',
                                minHeight: '36px'
                              }}
                              onMouseEnter={(e) => {
                                if (!deleteUser.isLoading) {
                                  e.currentTarget.style.background = 'var(--bg-secondary)'
                                  e.currentTarget.style.color = '#dc2626'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!deleteUser.isLoading) {
                                  e.currentTarget.style.background = 'transparent'
                                  e.currentTarget.style.color = 'var(--text-light)'
                                }
                              }}
                            >
                              {deleteUser.isLoading ? (
                                <LoadingSpinner size={18} color="var(--text-light)" />
                              ) : (
                                <TrashIcon size={18} />
                              )}
                            </button>
                          </div>
                        )}
                        {viewingPasswordUserId === user.id && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            textAlign: 'left',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                            }}>
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-light)',
                                fontWeight: 500,
                              }}>
                                Password
                              </div>
                              <button
                                onClick={() => {
                                  setShowPasswordHash({
                                    ...showPasswordHash,
                                    [user.id]: !showPasswordHash[user.id],
                                  })
                                }}
                                type="button"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: 'var(--text-light)',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--text)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'var(--text-light)'
                                }}
                                title={showPasswordHash[user.id] ? 'Sembunyikan' : 'Tampilkan'}
                              >
                                {showPasswordHash[user.id] ? (
                                  <EyeOffIcon size={16} />
                                ) : (
                                  <EyeIcon size={16} />
                                )}
                              </button>
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              color: 'var(--text)',
                              wordBreak: 'break-all',
                              background: 'var(--card)',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              border: '1px solid var(--border)',
                            }}>
                              {showPasswordHash[user.id] && passwordHashes[user.id]
                                ? passwordHashes[user.id]
                                : '••••••••••••••••••••••••••••••••'}
                            </div>
                            {getUserPasswordHash.data?.password && getUserPasswordHash.data.password !== '' ? (
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-success)',
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <CheckCircleIcon size={12} />
                                <span>Password asli (decrypted)</span>
                              </div>
                            ) : getUserPasswordHash.data && !getUserPasswordHash.isLoading ? (
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-warning)',
                                marginTop: '0.5rem',
                                fontStyle: 'italic',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <AlertTriangleIcon size={12} />
                                <span>
                                  {getUserPasswordHash.data.decryptError ? (
                                    <>Error decrypt password: {getUserPasswordHash.data.decryptError}</>
                                  ) : getUserPasswordHash.data.hasEncryptedPassword ? (
                                    <>Password ter-encrypt tapi gagal di-decrypt</>
                                  ) : (
                                    <>Password belum di-encrypt</>
                                  )}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}
                        {viewingPasswordUserId === user.id && getUserPasswordHash.isLoading && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                          }}>
                            <LoadingSpinner size={16} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                              Memuat password...
                            </span>
                          </div>
                        )}
                        {isCurrentUser && (
                          <span style={{
                            color: 'var(--text-light)',
                            fontSize: '0.875rem',
                            fontStyle: 'italic'
                          }}>
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUserId && users && (
        <div style={{
          marginTop: '2rem',
          position: 'relative',
          zIndex: 10
        }}>
          <EditUserForm
            user={users.find(u => u.id === editingUserId) || filteredUsers.find(u => u.id === editingUserId)!}
            onSuccess={() => {
              setEditingUserId(null)
              utils.auth.getAllUsers.invalidate()
              // Scroll to top of form
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onCancel={() => {
              setEditingUserId(null)
              // Scroll back to table
              setTimeout(() => {
                const tableElement = document.querySelector('.user-table')
                if (tableElement) {
                  tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }, 100)
            }}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteUserId !== null}
        title="Hapus User?"
        message={`Apakah Anda yakin ingin menghapus user "${deleteUserName}" (${deleteUserEmail})? Tindakan ini akan menghapus semua PR, sub tugas, dan data terkait user ini. Tindakan ini tidak dapat dibatalkan.`}
        confirmText={deleteUser.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        danger={true}
        disabled={deleteUser.isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteUser.isLoading) {
            setDeleteUserId(null)
            setDeleteUserName('')
            setDeleteUserEmail('')
          }
        }}
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Hapus Multiple User?"
        message={`Apakah Anda yakin ingin menghapus ${selectedUserIds.size} user yang dipilih? Tindakan ini akan menghapus semua PR, sub tugas, dan data terkait user-user ini. Tindakan ini tidak dapat dibatalkan.`}
        confirmText={bulkDeleteUsers.isLoading ? 'Menghapus...' : `Ya, Hapus ${selectedUserIds.size} User`}
        cancelText="Batal"
        danger={true}
        disabled={bulkDeleteUsers.isLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => {
          if (!bulkDeleteUsers.isLoading) {
            setShowBulkDeleteConfirm(false)
          }
        }}
      />
    </>
  )
}

