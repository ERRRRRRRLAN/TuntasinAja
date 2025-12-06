'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface PermissionManagerProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function PermissionManager({ userId, onClose, onSuccess }: PermissionManagerProps) {
  const [permission, setPermission] = useState<'only_read' | 'read_and_post_edit'>('read_and_post_edit')
  const [canCreateAnnouncement, setCanCreateAnnouncement] = useState(false)

  const { data: users } = trpc.danton.getClassUsers.useQuery(undefined, {
    refetchOnWindowFocus: false, // Disable to prevent flickering
    staleTime: 60000, // Cache for 1 minute
  })
  const user = users?.find(u => u.id === userId)

  useEffect(() => {
    if (user) {
      setPermission(user.permission)
      setCanCreateAnnouncement(user.canCreateAnnouncement || false)
    }
  }, [user])

  const updatePermission = trpc.danton.updateUserPermission.useMutation({
    onSuccess: () => {
      toast.success('Permission berhasil diupdate')
      onSuccess()
    },
    onError: (error: any) => {
      console.error('Error updating permission:', error)
      toast.error(error.message || 'Gagal mengupdate permission. Silakan coba lagi.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    updatePermission.mutate({
      userId,
      permission,
      canCreateAnnouncement,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div 
      className="modal-overlay"
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
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--card)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Ubah Permission - {user.name}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>
              Permission
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="permission"
                  value="read_and_post_edit"
                  checked={permission === 'read_and_post_edit'}
                  onChange={(e) => setPermission(e.target.value as 'read_and_post_edit')}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Read & Post/Edit</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    User dapat membaca, membuat, dan mengedit tugas/sub tugas
                  </div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="permission"
                  value="only_read"
                  checked={permission === 'only_read'}
                  onChange={(e) => setPermission(e.target.value as 'only_read')}
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Only Read</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    User hanya dapat membaca, tidak dapat membuat atau mengedit
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={canCreateAnnouncement}
                onChange={(e) => setCanCreateAnnouncement(e.target.checked)}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Bisa Membuat Pengumuman</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  User dapat membuat pengumuman untuk kelas mereka sendiri
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              disabled={updatePermission.isLoading}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updatePermission.isLoading || !permission}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: updatePermission.isLoading ? 'not-allowed' : 'pointer',
                opacity: updatePermission.isLoading ? 0.6 : 1,
              }}
            >
              {updatePermission.isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LoadingSpinner size={16} color="white" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

