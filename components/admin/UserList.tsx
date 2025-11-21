'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function UserList() {
  const { data: session } = useSession()
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState('')
  const [deleteUserEmail, setDeleteUserEmail] = useState('')

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
      alert(error.message || 'Gagal menghapus user. Silakan coba lagi.')
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
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-light)' }}>Memuat daftar users...</p>
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

        <div style={{ overflowX: 'auto' }}>
          <table className="user-list-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  PR
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Komentar
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
                          👑 Admin
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
                          <span>🗑️</span>
                          <span>Hapus</span>
                        </button>
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

      <ConfirmDialog
        isOpen={deleteUserId !== null}
        title="Hapus User?"
        message={`Apakah Anda yakin ingin menghapus user "${deleteUserName}" (${deleteUserEmail})? Tindakan ini akan menghapus semua PR, komentar, dan data terkait user ini. Tindakan ini tidak dapat dibatalkan.`}
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

