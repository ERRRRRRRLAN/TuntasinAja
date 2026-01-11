'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CreateThreadFormProps {
  onSuccess?: () => void
}

export default function CreateThreadForm({ onSuccess }: CreateThreadFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const utils = trpc.useUtils()

  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const userKelas = userData?.kelas || null

  const { data: classSubjects } = trpc.classSubject.getClassSubjects.useQuery(
    { kelas: userKelas || undefined },
    { enabled: !!session && !!userKelas }
  )
  const subjectOptions = classSubjects?.map((s: any) => s.subject) || []

  const createThread = trpc.thread.create.useMutation({
    onSuccess: async (data) => {
      if (data.type === 'comment') {
        console.info('[INFO]', `PR "${data.thread.title}" hari ini sudah dibuat oleh ${data.thread.author.name}. Postingan Anda ditambahkan sebagai sub tugas.`)
      }
      setTitle('')
      setComment('')
      setIsSubmitting(false)
      await utils.thread.getAll.invalidate()
      await utils.thread.getAll.refetch()
      router.refresh()
      onSuccess?.()
    },
    onError: (error) => {
      setIsSubmitting(false)
      const errorMessage = error.message || 'Gagal membuat tugas. Silakan coba lagi.'
      console.error('[ERROR]', errorMessage)
      toast.error(errorMessage, 5000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting || createThread.isLoading) {
      return
    }

    if (!title) {
      console.warn('[WARNING] Pilih mata pelajaran terlebih dahulu!')
      return
    }

    setIsSubmitting(true)
    createThread.mutate({ title, comment: comment || undefined })
  }

  return (
    <>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
        Buat PR Baru
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
            {subjectOptions.map((mapel) => (
              <option key={mapel} value={mapel}>
                {mapel}
              </option>
            ))}
          </select>
          <small className="form-hint">Pilih mata pelajaran dari daftar</small>
        </div>

        <div className="form-group">
          <label htmlFor="threadComment">Sub Tugas Awal (Deskripsi Tugas)</label>
          <textarea
            id="threadComment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Contoh: Kerjakan halaman 42-45"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={createThread.isLoading || isSubmitting}>
            {createThread.isLoading || isSubmitting ? (
              <>
                <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                Membuat...
              </>
            ) : 'Buat PR'}
          </button>
          <button type="button" onClick={onSuccess} className="btn btn-secondary" disabled={createThread.isLoading || isSubmitting}>
            Batal
          </button>
        </div>
      </form>
    </>
  )
}
