'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import ComboBox from '@/components/ui/ComboBox'
import { BookIcon } from '@/components/ui/Icons'

interface AddUserFormProps {
  onSuccess?: () => void
}

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

export default function AddUserForm({ onSuccess }: AddUserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [kelas, setKelas] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const utils = trpc.useUtils()
  const kelasOptions = generateKelasOptions()

  const createUser = trpc.auth.createUser.useMutation({
    onSuccess: () => {
      setSuccess('User berhasil dibuat!')
      setName('')
      setEmail('')
      setPassword('')
      setIsAdmin(false)
      setKelas('')
      setError('')
      // Invalidate user list to refresh
      utils.auth.getAllUsers.invalidate()
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setSuccess('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || name.length < 3) {
      setError('Nama harus minimal 3 karakter!')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Email tidak valid!')
      return
    }

    if (!password || password.length < 6) {
      setError('Password harus minimal 6 karakter!')
      return
    }

    if (!isAdmin && !kelas) {
      setError('Kelas harus dipilih untuk user non-admin!')
      return
    }

    createUser.mutate({ name, email, password, isAdmin, kelas: isAdmin ? undefined : kelas })
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
        Tambah User Baru
      </h3>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="adminName" className="form-label">
            Nama *
          </label>
          <input
            id="adminName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
            minLength={3}
            disabled={createUser.isLoading}
            placeholder="Masukkan nama user"
          />
        </div>

        <div className="form-group">
          <label htmlFor="adminEmail" className="form-label">
            Email *
          </label>
          <input
            id="adminEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
            disabled={createUser.isLoading}
            placeholder="user@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="adminPassword" className="form-label">
            Password *
          </label>
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
            minLength={6}
            disabled={createUser.isLoading}
            placeholder="Minimal 6 karakter"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => {
                setIsAdmin(e.target.checked)
                if (e.target.checked) {
                  setKelas('')
                }
              }}
              disabled={createUser.isLoading}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: 'var(--primary)'
              }}
            />
            <span>Buat sebagai Admin</span>
          </label>
        </div>

        {!isAdmin && (
          <div className="form-group">
            <label htmlFor="adminKelas" className="form-label">
              Kelas *
            </label>
            <ComboBox
              value={kelas}
              onChange={setKelas}
              placeholder="Pilih Kelas"
              options={kelasOptions}
              showAllOption={false}
              searchPlaceholder="Cari kelas..."
              emptyMessage="Tidak ada kelas yang ditemukan"
              icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={createUser.isLoading}
          style={{ width: '100%' }}
        >
          {createUser.isLoading ? 'Membuat...' : 'Tambah User'}
        </button>
      </form>
    </div>
  )
}

