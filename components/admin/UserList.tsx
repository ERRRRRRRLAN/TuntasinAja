'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface ConfirmDialogProps {
  isOpen: boolean
  userName: string
  userEmail: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

function ConfirmDialog({ isOpen, userName, userEmail, onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Hapus User?
        </h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)', lineHeight: 1.6 }}>
          Apakah Anda yakin ingin menghapus user <strong>{userName}</strong> ({userEmail})? 
          Tindakan ini akan menghapus semua PR, komentar, dan data terkait user ini. 
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            className="btn"
            disabled={isLoading}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text)',
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    if (deleteUserId) {
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
                          onClick={() => handleDeleteClick(user.id, user.name, user.email)}
                          className="btn-icon btn-danger"
                          title="Hapus User"
                          disabled={deleteUser.isLoading}
                        >
                          🗑️
                        </button>
                      )}
                      {isCurrentUser && (
                        <span style={{ 
                          color: 'var(--text-light)', 
                          fontSize: '0.75rem',
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
        userName={deleteUserName}
        userEmail={deleteUserEmail}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteUserId(null)
          setDeleteUserName('')
          setDeleteUserEmail('')
        }}
        isLoading={deleteUser.isLoading}
      />
    </>
  )
}

