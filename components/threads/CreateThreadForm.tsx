'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'

const MATA_PELAJARAN = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
  'Pendidikan Agama',
  'Pendidikan Kewarganegaraan',
  'Seni Budaya',
  'Pendidikan Jasmani',
  'TIK',
  'Bahasa Jawa',
  'Bahasa Sunda',
  'Prakarya',
]

interface CreateThreadFormProps {
  onSuccess?: () => void
}

export default function CreateThreadForm({ onSuccess }: CreateThreadFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  const createThread = trpc.thread.create.useMutation({
    onSuccess: (data) => {
      if (data.type === 'comment') {
        alert(
          `Thread "${data.thread.title}" hari ini sudah dibuat oleh ${data.thread.author.name}. Postingan Anda ditambahkan sebagai komentar.`
        )
      } else {
        alert('Thread berhasil dibuat!')
      }
      router.refresh()
      setTitle('')
      setComment('')
      onSuccess?.()
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      alert('Pilih mata pelajaran terlebih dahulu!')
      return
    }
    createThread.mutate({ title, comment: comment || undefined })
  }

  return (
    <>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
        Buat Thread Baru
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="threadTitle">Nama Mata Pelajaran *</label>
          <select
            id="threadTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          >
            <option value="">-- Pilih Mata Pelajaran --</option>
            {MATA_PELAJARAN.map((mapel) => (
              <option key={mapel} value={mapel}>
                {mapel}
              </option>
            ))}
          </select>
          <small className="form-hint">Pilih mata pelajaran dari daftar</small>
        </div>

        <div className="form-group">
          <label htmlFor="threadComment">Komentar Awal (Deskripsi Tugas)</label>
          <textarea
            id="threadComment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Contoh: Kerjakan halaman 42-45"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={createThread.isLoading}>
            {createThread.isLoading ? 'Membuat...' : 'Buat Thread'}
          </button>
          <button type="button" onClick={onSuccess} className="btn btn-secondary">
            Batal
          </button>
        </div>
      </form>
    </>
  )
}
