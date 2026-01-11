'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ComboBox from '@/components/ui/ComboBox'
import { BookIcon, XIconSmall } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'
import RadioButton from '@/components/ui/RadioButton'

interface EditUserFormProps {
  user: {
    id: string
    name: string
    email: string
    isAdmin: boolean
    isKetua?: boolean
    kelas: string | null
    permission?: {
      permission: 'only_read' | 'read_and_post_edit'
      canCreateAnnouncement: boolean
    }
  }
  isModal?: boolean
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

export default function EditUserForm({ user, isModal, onSuccess, onCancel }: EditUserFormProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(user.isAdmin)
  const [isKetua, setisKetua] = useState(user.isKetua || false)
  const [kelas, setKelas] = useState(user.kelas || '')
  const [permission, setPermission] = useState<'only_read' | 'read_and_post_edit'>(
    user.permission?.permission || 'read_and_post_edit'
  )
  const [canCreateAnnouncement, setCanCreateAnnouncement] = useState(
    user.permission?.canCreateAnnouncement || false
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const utils = trpc.useUtils()
  const kelasOptions = generateKelasOptions()

  // Update form when user changes
  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setIsAdmin(user.isAdmin)
    setisKetua(user.isKetua || false)
    setKelas(user.kelas || '')
    setPermission(user.permission?.permission || 'read_and_post_edit')
    setCanCreateAnnouncement(user.permission?.canCreateAnnouncement || false)
    setPassword('')
    setError('')
    setSuccess('')
  }, [user])

  const updateUser = trpc.auth.updateUser.useMutation({
    onSuccess: () => {
      setSuccess('Data user berhasil diupdate!')
      setPassword('')
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

    if (password && password.length < 6) {
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

    const updateData: any = {
      userId: user.id,
      name,
      email,
      isAdmin,
      isKetua: isAdmin ? false : isKetua, // Cannot be ketua if admin
      kelas: isAdmin ? null : kelas,
    }

    // Only include password if it's provided
    if (password) {
      updateData.password = password
    }

    // Only include permission if user is not admin
    if (!isAdmin) {
      updateData.permission = permission
      updateData.canCreateAnnouncement = canCreateAnnouncement
    }

    updateUser.mutate(updateData)
  }

  return (
    <div className="card" style={{ position: 'relative' }}>
      {!isModal && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Edit Data Siswa
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                borderRadius: '0.375rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              title="Tutup"
            >
              <XIconSmall size={20} />
            </button>
          )}
        </div>
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
          <label htmlFor="editName" className="form-label">
            Nama *
          </label>
          <input
            id="editName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
            minLength={3}
            disabled={updateUser.isLoading}
            placeholder="Masukkan nama user"
          />
        </div>

        <div className="form-group">
          <label htmlFor="editEmail" className="form-label">
            Email *
          </label>
          <input
            id="editEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
            disabled={updateUser.isLoading}
            placeholder="user@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="editPassword" className="form-label">
            Password (Kosongkan jika tidak ingin mengubah)
          </label>
          <input
            id="editPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            minLength={6}
            disabled={updateUser.isLoading}
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
                  setisKetua(false) // Cannot be ketua if admin
                }
              }}
              disabled={updateUser.isLoading}
              size={18}
            />
            <span>Jadikan sebagai Admin</span>
          </label>
        </div>

        {!isAdmin && (
          <>
            <div className="form-group">
              <label htmlFor="editKelas" className="form-label">
                Kelas *
              </label>
              <ComboBox
                value={kelas}
                onChange={(value) => {
                  setKelas(value)
                  // If removing kelas, also remove ketua status
                  if (!value) {
                    setisKetua(false)
                  }
                }}
                placeholder="Pilih Kelas"
                options={kelasOptions}
                showAllOption={false}
                searchPlaceholder="Cari kelas..."
                emptyMessage="Tidak ada kelas yang ditemukan"
                icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
              />
            </div>

            {kelas && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <Checkbox
                    checked={isKetua}
                    onChange={() => setisKetua(!isKetua)}
                    disabled={updateUser.isLoading || !kelas}
                    size={18}
                  />
                  <span>Jadikan sebagai ketua (Ketua Kelas)</span>
                </label>
                <p style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--text-light)'
                }}>
                  ketua dapat mengelola user di kelas ini dan mengatur permission mereka.
                </p>
              </div>
            )}

            {/* Permission Settings */}
            <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 500 }}>
                Permission
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <RadioButton
                    checked={permission === 'read_and_post_edit'}
                    onChange={() => setPermission('read_and_post_edit')}
                    disabled={updateUser.isLoading}
                    size={18}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>Read & Post/Edit</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      User dapat membaca, membuat, dan mengedit tugas/sub tugas
                    </div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <RadioButton
                    checked={permission === 'only_read'}
                    onChange={() => setPermission('only_read')}
                    disabled={updateUser.isLoading}
                    size={18}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>Only Read</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      User hanya dapat membaca, tidak dapat membuat atau mengedit
                    </div>
                  </div>
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <Checkbox
                  checked={canCreateAnnouncement}
                  onChange={() => setCanCreateAnnouncement(!canCreateAnnouncement)}
                  disabled={updateUser.isLoading}
                  size={18}
                />
                <div>
                  <div style={{ fontWeight: 500 }}>Bisa Membuat Pengumuman</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    User dapat membuat pengumuman untuk kelas mereka sendiri
                  </div>
                </div>
              </label>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateUser.isLoading}
            style={{ flex: 1 }}
          >
            {updateUser.isLoading ? (
              <>
                <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                Menyimpan...
              </>
            ) : 'Simpan Perubahan'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={updateUser.isLoading}
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

