'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { EditIcon, TrashIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EditClassUserForm from './EditClassUserForm'
import PermissionManager from './PermissionManager'

export default function ClassUserList() {
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [managingPermissionUserId, setManagingPermissionUserId] = useState<string | null>(null)

  const { data: users, isLoading, refetch } = trpc.danton.getClassUsers.useQuery()
  const utils = trpc.useUtils()

  const deleteUser = trpc.danton.deleteUserFromClass.useMutation({
    onSuccess: () => {
      toast.success('User berhasil dihapus')
      utils.danton.getClassUsers.invalidate()
      utils.danton.getClassStats.invalidate()
      setDeletingUserId(null)
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Gagal menghapus user. Silakan coba lagi.')
      setDeletingUserId(null)
    },
  })

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat daftar siswa...</p>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-light)' }}>Belum ada siswa di kelas ini.</p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Daftar Siswa di Kelas
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
                  Permission
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
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user.name}
                      {user.isDanton && (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          background: '#fbbf24',
                          color: '#78350f',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          Danton
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: user.permission === 'read_and_post_edit' 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      color: user.permission === 'read_and_post_edit'
                        ? '#15803d'
                        : '#dc2626',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {user.permission === 'read_and_post_edit' ? 'Read & Post/Edit' : 'Only Read'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => setManagingPermissionUserId(user.id)}
                        className="btn"
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                        title="Ubah Permission"
                      >
                        <EditIcon size={14} />
                        Permission
                      </button>
                      <button
                        onClick={() => setEditingUserId(user.id)}
                        className="btn"
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                        title="Edit User"
                      >
                        <EditIcon size={14} />
                        Edit
                      </button>
                      {!user.isDanton && (
                        <button
                          onClick={() => setDeletingUserId(user.id)}
                          className="btn"
                          style={{
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.875rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                          title="Hapus User"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUserId && (
        <EditClassUserForm
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
          onSuccess={() => {
            refetch()
            setEditingUserId(null)
          }}
        />
      )}

      {managingPermissionUserId && (
        <PermissionManager
          userId={managingPermissionUserId}
          onClose={() => setManagingPermissionUserId(null)}
          onSuccess={() => {
            refetch()
            setManagingPermissionUserId(null)
          }}
        />
      )}

      {deletingUserId && (
        <ConfirmDialog
          isOpen={!!deletingUserId}
          title="Hapus User?"
          message={`Apakah Anda yakin ingin menghapus user ini dari kelas? Tindakan ini tidak dapat dibatalkan.`}
          confirmText={deleteUser.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
          cancelText="Batal"
          disabled={deleteUser.isLoading}
          onConfirm={() => {
            if (deletingUserId && !deleteUser.isLoading) {
              deleteUser.mutate({ userId: deletingUserId })
            }
          }}
          onCancel={() => {
            if (!deleteUser.isLoading) {
              setDeletingUserId(null)
            }
          }}
        />
      )}
    </>
  )
}

