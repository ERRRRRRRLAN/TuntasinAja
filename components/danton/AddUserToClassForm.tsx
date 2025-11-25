'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface AddUserToClassFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddUserToClassForm({ onClose, onSuccess }: AddUserToClassFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { data: stats } = trpc.danton.getClassStats.useQuery()
  const utils = trpc.useUtils()

  const addUser = trpc.danton.addUserToClass.useMutation({
    onSuccess: () => {
      toast.success('User berhasil ditambahkan ke kelas')
      utils.danton.getClassUsers.invalidate()
      utils.danton.getClassStats.invalidate()
      onSuccess()
      setName('')
      setEmail('')
      setPassword('')
    },
    onError: (error: any) => {
      console.error('Error adding user:', error)
      toast.error(error.message || 'Gagal menambahkan user. Silakan coba lagi.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addUser.mutate({ name, email, password })
  }

  const isAtMaxCapacity = stats ? stats.userCount >= stats.maxUsers : false

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
          Tambah User ke Kelas
        </h3>

        {stats && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.75rem', 
            background: isAtMaxCapacity ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            borderRadius: '0.375rem',
            border: `1px solid ${isAtMaxCapacity ? '#ef4444' : '#22c55e'}`,
            color: isAtMaxCapacity ? '#dc2626' : '#15803d',
            fontSize: '0.875rem',
          }}>
            Kapasitas: {stats.userCount} / {stats.maxUsers} user
            {isAtMaxCapacity && ' (Penuh)'}
          </div>
        )}

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
              disabled={addUser.isLoading || isAtMaxCapacity}
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
              disabled={addUser.isLoading || isAtMaxCapacity}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={addUser.isLoading || isAtMaxCapacity}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              disabled={addUser.isLoading}
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
              disabled={addUser.isLoading || !name.trim() || !email.trim() || !password.trim() || isAtMaxCapacity}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: addUser.isLoading || isAtMaxCapacity ? 'not-allowed' : 'pointer',
                opacity: addUser.isLoading || isAtMaxCapacity ? 0.6 : 1,
              }}
            >
              {addUser.isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LoadingSpinner size={16} color="white" />
                  Menambahkan...
                </span>
              ) : (
                'Tambah'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

