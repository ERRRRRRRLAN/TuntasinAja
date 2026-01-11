'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ComboBox from '@/components/ui/ComboBox'
import { BookIcon } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'

interface AddUserFormProps {
  isModal?: boolean
  defaultSchoolId?: string
  defaultKelas?: string
  onSuccess?: () => void
  onCancel?: () => void
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

export default function AddUserForm({ isModal, defaultSchoolId, defaultKelas, onSuccess, onCancel }: AddUserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isKetua, setIsKetua] = useState(false)
  const [schoolId, setSchoolId] = useState(defaultSchoolId || '')
  const [kelas, setKelas] = useState(defaultKelas || '')
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
      setIsKetua(false)
      setKelas(defaultKelas || '')
      setSchoolId(defaultSchoolId || '')
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

    // Validate: cannot be ketua if admin or no kelas
    if (isKetua && isAdmin) {
      setError('User tidak dapat menjadi admin dan ketua sekaligus!')
      return
    }

    if (isKetua && !kelas) {
      setError('User harus memiliki kelas untuk dijadikan ketua!')
      return
    }

    createUser.mutate({
      name,
      email,
      password,
      isAdmin,
      isKetua: isAdmin ? false : isKetua, // Cannot be ketua if admin
      kelas: isAdmin ? undefined : kelas,
      schoolId: schoolId || undefined
    })
  }

  return (
    <div className="card" style={{ position: 'relative' }}>
      {!isModal && (
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Tambah User Baru
        </h3>
      )}

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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <Checkbox
              checked={isAdmin}
              onChange={() => {
                setIsAdmin(!isAdmin)
                if (!isAdmin) {
                  setKelas('')
                  setIsKetua(false) // Cannot be ketua if admin
                }
              }}
              disabled={createUser.isLoading}
              size={18}
            />
            <span>Buat sebagai Admin</span>
          </label>
        </div>

        {!isAdmin && (
          <>
            <div className="form-group">
              <label htmlFor="adminKelas" className="form-label">
                Kelas *
              </label>
              <ComboBox
                value={kelas}
                onChange={(value) => {
                  setKelas(value)
                  // If removing kelas, also remove ketua status
                  if (!value) {
                    setIsKetua(false)
                  }
                }}
                placeholder="Pilih Kelas"
                options={kelasOptions}
                showAllOption={false}
                searchPlaceholder="Cari kelas..."
                emptyMessage="Tidak ada kelas yang ditemukan"
                icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
                disabled={!!defaultKelas || createUser.isLoading}
              />
            </div>

            {kelas && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <Checkbox
                    checked={isKetua}
                    onChange={() => setIsKetua(!isKetua)}
                    disabled={createUser.isLoading || !kelas}
                    size={18}
                  />
                  <span>Buat sebagai Ketua (Ketua Kelas)</span>
                </label>
                <p style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--text-light)'
                }}>
                  Ketua dapat mengelola user di kelas ini dan mengatur permission mereka.
                </p>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createUser.isLoading}
            style={{ flex: 1 }}
          >
            {createUser.isLoading ? (
              <>
                <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                Membuat...
              </>
            ) : 'Tambah User'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={createUser.isLoading}
              style={{ flex: 1 }}
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

