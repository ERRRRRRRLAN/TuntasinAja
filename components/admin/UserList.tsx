'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { CrownIcon, TrashIcon, EditIcon, SearchIcon, XIconSmall } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EditUserForm from '@/components/admin/EditUserForm'
import ComboBox from '@/components/ui/ComboBox'

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

  const { data: users, isLoading, refetch } = trpc.auth.getAllUsers.useQuery()
  const utils = trpc.useUtils()
  const kelasOptions = generateKelasOptions()

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
      toast.error(error.message || 'Gagal menghapus user. Silakan coba lagi.')
      setDeleteUserId(null)
      setDeleteUserName('')
      setDeleteUserEmail('')
    },
  })

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

        {/* Search and Filter Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search Bar */}
          <div style={{ 
            position: 'relative', 
            flex: '1', 
            minWidth: '200px',
            maxWidth: '400px'
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
          <div style={{ minWidth: '180px' }}>
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
            border: '1px solid var(--border)'
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
        ) : (
          <div className="user-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Nama
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Email
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Role
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Kelas
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  PR
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Sub Tugas
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Terdaftar
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isCurrentUser = user.id === session?.user?.id
                return (
                  <tr 
                    key={user.id}
                    style={{ 
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isCurrentUser ? 'var(--bg-secondary)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{user.name}</span>
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
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {user.isAdmin ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            <CrownIcon size={12} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                            Admin
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-light)',
                            fontSize: '0.75rem'
                          }}>
                            User
                          </span>
                        )}
                        {(user as any).isDanton && !user.isAdmin && (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            background: '#fbbf24',
                            color: '#78350f',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            Danton
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                      {user.kelas ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {user.kelas}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
                      {user._count.threads}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
                      {user._count.comments}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {!isCurrentUser && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Edit button clicked for user:', user.id)
                              setEditingUserId(user.id)
                              // Scroll to form after a short delay
                              setTimeout(() => {
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                              }, 100)
                            }}
                            title="Edit User"
                            type="button"
                            style={{
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              transition: 'all 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--primary-hover)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--primary)'
                            }}
                          >
                            <EditIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(user.id, user.name, user.email)
                            }}
                            title="Hapus User"
                            disabled={deleteUser.isLoading}
                            style={{
                              background: deleteUser.isLoading ? '#9ca3af' : '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              cursor: deleteUser.isLoading ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              transition: 'all 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              opacity: deleteUser.isLoading ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!deleteUser.isLoading) {
                                e.currentTarget.style.background = '#b91c1c'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!deleteUser.isLoading) {
                                e.currentTarget.style.background = '#dc2626'
                              }
                            }}
                          >
                            {deleteUser.isLoading ? (
                              <>
                                <LoadingSpinner size={14} color="white" style={{ marginRight: '0.25rem', display: 'inline-block' }} />
                                <span>Menghapus...</span>
                              </>
                            ) : (
                              <>
                                <TrashIcon size={14} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                                <span>Hapus</span>
                              </>
                            )}
                          </button>
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
    </>
  )
}

