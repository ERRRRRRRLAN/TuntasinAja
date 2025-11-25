'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { CrownIcon, TrashIcon, EditIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EditUserForm from '@/components/admin/EditUserForm'

export default function UserList() {
  const { data: session } = useSession()
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState('')
  const [deleteUserEmail, setDeleteUserEmail] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const { data: users, isLoading, refetch } = trpc.auth.getAllUsers.useQuery()
  const utils = trpc.useUtils()

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
              {users.map((user) => {
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
      </div>

      {editingUserId && users && (
        <div style={{ 
          marginTop: '2rem',
          position: 'relative',
          zIndex: 10
        }}>
          <EditUserForm
            user={users.find(u => u.id === editingUserId)!}
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

