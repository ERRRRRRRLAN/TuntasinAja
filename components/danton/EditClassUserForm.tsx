'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface EditClassUserFormProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditClassUserForm({ userId, onClose, onSuccess }: EditClassUserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { data: users } = trpc.danton.getClassUsers.useQuery()
  const user = users?.find(u => u.id === userId)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPassword('')
    }
  }, [user])

  const editUser = trpc.danton.editUserData.useMutation({
    onSuccess: () => {
      toast.success('Data user berhasil diupdate')
      onSuccess()
    },
    onError: (error: any) => {
      console.error('Error editing user:', error)
      toast.error(error.message || 'Gagal mengupdate user. Silakan coba lagi.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const updateData: any = {
      userId,
      name,
      email,
    }

    if (password.trim()) {
      updateData.password = password
    }

    editUser.mutate(updateData)
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
          Edit User - {user.name}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="name">
              Nama
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              disabled={editUser.isLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={editUser.isLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="password">
              Password (Kosongkan jika tidak ingin mengubah)
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              disabled={editUser.isLoading}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              disabled={editUser.isLoading}
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
              disabled={editUser.isLoading || !name.trim() || !email.trim()}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: editUser.isLoading ? 'not-allowed' : 'pointer',
                opacity: editUser.isLoading ? 0.6 : 1,
              }}
            >
              {editUser.isLoading ? (
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

