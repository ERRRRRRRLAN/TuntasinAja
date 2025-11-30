'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ComboBox from '@/components/ui/ComboBox'
import { BookIcon } from '@/components/ui/Icons'

interface BulkAddUserFormProps {
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

export default function BulkAddUserForm({ onSuccess }: BulkAddUserFormProps) {
  const [namesText, setNamesText] = useState('')
  const [kelas, setKelas] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const utils = trpc.useUtils()
  const kelasOptions = generateKelasOptions()

  const bulkCreateUsers = trpc.auth.bulkCreateUsers.useMutation({
    onSuccess: (data) => {
      setSuccess(`Berhasil membuat ${data.success} user!`)
      setResults({
        success: data.success,
        failed: data.failed,
        errors: data.errors,
      })
      setNamesText('')
      setError('')
      // Invalidate user list and subscription list to refresh
      utils.auth.getAllUsers.invalidate()
      utils.subscription.getAllClassSubscriptions.invalidate()
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setSuccess('')
      setResults(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setResults(null)

    // Parse names from textarea (one per line)
    const names = namesText
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (names.length === 0) {
      setError('Masukkan minimal satu nama siswa!')
      return
    }

    if (!kelas) {
      setError('Kelas harus dipilih!')
      return
    }

    bulkCreateUsers.mutate({ 
      names,
      kelas
    })
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
        Tambah User Bulk
      </h3>
      <p style={{ 
        marginBottom: '1.5rem', 
        fontSize: '0.875rem', 
        color: 'var(--text-light)',
        lineHeight: '1.5'
      }}>
        Masukkan nama siswa (satu nama per baris). Sistem akan otomatis membuat email dan password untuk setiap siswa.
      </p>

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

      {results && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
            Hasil:
          </p>
          <p style={{ margin: '0 0 0.25rem 0', color: 'var(--success)' }}>
            Berhasil: {results.success} user
          </p>
          {results.failed > 0 && (
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>
              Gagal: {results.failed} user
            </p>
          )}
          {results.errors.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                Detail Error:
              </p>
              <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#b91c1c' }}>
                {results.errors.map((err, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="bulkKelas" className="form-label">
            Kelas *
          </label>
          <ComboBox
            value={kelas}
            onChange={(value) => setKelas(value)}
            placeholder="Pilih Kelas"
            options={kelasOptions}
            showAllOption={false}
            searchPlaceholder="Cari kelas..."
            emptyMessage="Tidak ada kelas yang ditemukan"
            icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bulkNames" className="form-label">
            Nama Siswa (satu nama per baris) *
          </label>
          <textarea
            id="bulkNames"
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            className="form-input"
            required
            disabled={bulkCreateUsers.isLoading}
            placeholder="Contoh:&#10;Ahmad Fauzi&#10;Budi Santoso&#10;Citra Dewi"
            rows={10}
            style={{
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '150px'
            }}
          />
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            fontSize: '0.875rem', 
            color: 'var(--text-light)' 
          }}>
            Format email: (2 kata pertama dari nama, atau 1 kata jika hanya 1 kata)@tuntasinaja.com<br />
            Format password: (2 kata pertama dari nama, atau 1 kata jika hanya 1 kata) + 4-5 angka random
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={bulkCreateUsers.isLoading}
          style={{ width: '100%' }}
        >
          {bulkCreateUsers.isLoading ? (
            <>
              <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
              Membuat user...
            </>
          ) : 'Eksekusi - Buat User Bulk'}
        </button>
      </form>
    </div>
  )
}

