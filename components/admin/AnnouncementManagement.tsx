'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import { toast } from '@/components/ui/ToastContainer'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { TrashIcon, EditIcon, PlusIcon, PinIcon, AlertTriangleIcon } from '@/components/ui/Icons'
import Checkbox from '@/components/ui/Checkbox'
import ComboBox from '@/components/ui/ComboBox'

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

export default function AnnouncementManagement() {
  const { data: session } = useSession()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: announcements, isLoading, refetch } = trpc.announcement.getAllForManagement.useQuery()
  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, { enabled: !!session })
  const { data: classSubjects } = trpc.classSubject.getClassSubjects.useQuery(
    { kelas: userData?.kelas || undefined },
    { enabled: !!session && !!userData?.kelas }
  )

  const isAdmin = userData?.isAdmin || false
  const userKelas = userData?.kelas || null
  const kelasOptions = generateKelasOptions()
  const subjectOptions = classSubjects?.map((s: any) => s.subject) || []

  const deleteAnnouncement = trpc.announcement.delete.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Pengumuman berhasil dihapus')
      setDeleteId(null)
      refetch()
    },
    onError: (error) => {
      console.error('[ERROR]', `Gagal menghapus: ${error.message}`)
    },
  })

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat pengumuman...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Manajemen Pengumuman</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
            {isAdmin ? 'Kelola semua pengumuman' : 'Kelola pengumuman untuk kelas Anda'}
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusIcon size={16} />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {showCreateForm && (
        <CreateAnnouncementForm
          isAdmin={isAdmin}
          userKelas={userKelas}
          kelasOptions={kelasOptions}
          subjectOptions={subjectOptions}
          onSuccess={() => {
            setShowCreateForm(false)
            refetch()
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingId && (
        <EditAnnouncementForm
          id={editingId}
          isAdmin={isAdmin}
          userKelas={userKelas}
          kelasOptions={kelasOptions}
          subjectOptions={subjectOptions}
          onSuccess={() => {
            setEditingId(null)
            refetch()
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {announcements && announcements.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((announcement) => {
            const createdAtJakarta = toJakartaDate(announcement.createdAt)
            const expiresAtJakarta = announcement.expiresAt ? toJakartaDate(announcement.expiresAt) : null

            return (
              <div key={announcement.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {announcement.isPinned && <PinIcon size={16} style={{ color: 'var(--primary)' }} />}
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{announcement.title}</h3>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          background:
                            announcement.priority === 'urgent'
                              ? 'var(--danger)'
                              : announcement.priority === 'normal'
                              ? 'var(--primary)'
                              : 'var(--text-light)',
                          color: 'white',
                        }}
                      >
                        {announcement.priority === 'urgent' ? 'Urgent' : announcement.priority === 'normal' ? 'Normal' : 'Rendah'}
                      </span>
                    </div>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-light)', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {announcement.content}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      <span>Oleh: {announcement.author.name}</span>
                      <span>Target: {announcement.targetType === 'global' ? 'Semua' : announcement.targetKelas || '-'}</span>
                      <span>Dibaca: {announcement._count.reads} kali</span>
                      <span>{format(createdAtJakarta, 'd MMM yyyy, HH:mm', { locale: id })}</span>
                      {expiresAtJakarta && (
                        <span>
                          <AlertTriangleIcon size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                          Berakhir: {format(expiresAtJakarta, 'd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => setEditingId(announcement.id)}
                      className="btn"
                      style={{ padding: '0.5rem' }}
                      title="Edit"
                    >
                      <EditIcon size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(announcement.id)}
                      className="btn"
                      style={{ padding: '0.5rem', color: 'var(--danger)' }}
                      title="Hapus"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-light)' }}>Belum ada pengumuman.</p>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          isOpen={!!deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteId) {
              deleteAnnouncement.mutate({ id: deleteId })
            }
          }}
          title="Hapus Pengumuman?"
          message="Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Hapus"
          cancelText="Batal"
          danger={true}
        />
      )}
    </div>
  )
}

// Create Announcement Form Component
function CreateAnnouncementForm({
  isAdmin,
  userKelas,
  kelasOptions,
  subjectOptions,
  onSuccess,
  onCancel,
}: {
  isAdmin: boolean
  userKelas: string | null
  kelasOptions: string[]
  subjectOptions: string[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'global' | 'class' | 'subject'>('class')
  const [targetKelas, setTargetKelas] = useState<string>(userKelas || '')
  const [targetSubject, setTargetSubject] = useState<string>('')
  const [priority, setPriority] = useState<'urgent' | 'normal' | 'low'>('normal')
  const [isPinned, setIsPinned] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string>('')

  const createAnnouncement = trpc.announcement.create.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Pengumuman berhasil dibuat')
      onSuccess()
    },
    onError: (error) => {
      console.error('[ERROR]', `Gagal membuat pengumuman: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      console.error('[ERROR] Judul dan konten harus diisi')
      return
    }

    if (targetType === 'class' && !targetKelas) {
      console.error('[ERROR] Kelas harus dipilih untuk pengumuman kelas')
      return
    }

    if (targetType === 'subject' && (!targetKelas || !targetSubject)) {
      console.error('[ERROR] Kelas dan mata pelajaran harus dipilih untuk pengumuman mata pelajaran')
      return
    }

    createAnnouncement.mutate({
      title: title.trim(),
      content: content.trim(),
      targetType,
      targetKelas: targetType !== 'global' ? targetKelas : undefined,
      targetSubject: targetType === 'subject' ? targetSubject : undefined,
      priority,
      isPinned,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Buat Pengumuman Baru</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Judul *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul pengumuman"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Konten *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Masukkan isi pengumuman"
            rows={6}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontFamily: 'inherit' }}
            maxLength={5000}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Target
          </label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as 'global' | 'class' | 'subject')}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            disabled={!isAdmin}
          >
            <option value="global">Global (Semua Kelas)</option>
            <option value="class">Kelas Tertentu</option>
            <option value="subject">Mata Pelajaran Tertentu</option>
          </select>
          {!isAdmin && <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>Hanya admin yang bisa membuat pengumuman global</p>}
        </div>

        {targetType === 'class' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Kelas *
            </label>
            <ComboBox
              value={targetKelas}
              onChange={setTargetKelas}
              options={kelasOptions}
              placeholder="Pilih Kelas"
              showAllOption={false}
            />
          </div>
        )}

        {targetType === 'subject' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                Kelas *
              </label>
              <ComboBox
                value={targetKelas}
                onChange={setTargetKelas}
                options={kelasOptions}
                placeholder="Pilih Kelas"
                showAllOption={false}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                Mata Pelajaran *
              </label>
              <ComboBox
                value={targetSubject}
                onChange={setTargetSubject}
                options={subjectOptions}
                placeholder="Pilih Mata Pelajaran"
                showAllOption={false}
              />
            </div>
          </>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Prioritas
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'urgent' | 'normal' | 'low')}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
          >
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Rendah</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Checkbox
            checked={isPinned}
            onChange={() => setIsPinned(!isPinned)}
            size={18}
          />
          <label htmlFor="isPinned" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
            Pin pengumuman (tampilkan di atas)
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Berakhir Pada (Opsional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} className="btn">
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={createAnnouncement.isLoading}>
            {createAnnouncement.isLoading ? <LoadingSpinner size={16} color="white" /> : 'Buat Pengumuman'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Edit Announcement Form Component (simplified - similar to create)
function EditAnnouncementForm({
  id,
  isAdmin,
  userKelas,
  kelasOptions,
  subjectOptions,
  onSuccess,
  onCancel,
}: {
  id: string
  isAdmin: boolean
  userKelas: string | null
  kelasOptions: string[]
  subjectOptions: string[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const { data: announcement } = trpc.announcement.getAllForManagement.useQuery()
  const currentAnnouncement = announcement?.find((a) => a.id === id)

  const [title, setTitle] = useState(currentAnnouncement?.title || '')
  const [content, setContent] = useState(currentAnnouncement?.content || '')
  const [priority, setPriority] = useState<'urgent' | 'normal' | 'low'>(
    (currentAnnouncement?.priority as 'urgent' | 'normal' | 'low') || 'normal'
  )
  const [isPinned, setIsPinned] = useState(currentAnnouncement?.isPinned || false)
  const [expiresAt, setExpiresAt] = useState(
    currentAnnouncement?.expiresAt ? new Date(currentAnnouncement.expiresAt).toISOString().slice(0, 16) : ''
  )

  useEffect(() => {
    if (currentAnnouncement) {
      setTitle(currentAnnouncement.title)
      setContent(currentAnnouncement.content)
      setPriority(currentAnnouncement.priority as 'urgent' | 'normal' | 'low')
      setIsPinned(currentAnnouncement.isPinned)
      setExpiresAt(currentAnnouncement.expiresAt ? new Date(currentAnnouncement.expiresAt).toISOString().slice(0, 16) : '')
    }
  }, [currentAnnouncement])

  const updateAnnouncement = trpc.announcement.update.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Pengumuman berhasil diperbarui')
      onSuccess()
    },
    onError: (error) => {
      console.error('[ERROR]', `Gagal memperbarui: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      console.error('[ERROR] Judul dan konten harus diisi')
      return
    }

    updateAnnouncement.mutate({
      id,
      title: title.trim(),
      content: content.trim(),
      priority,
      isPinned,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
  }

  if (!currentAnnouncement) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Edit Pengumuman</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Judul *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Konten *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontFamily: 'inherit' }}
            maxLength={5000}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Prioritas
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'urgent' | 'normal' | 'low')}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
          >
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Rendah</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Checkbox
            checked={isPinned}
            onChange={() => setIsPinned(!isPinned)}
            size={18}
          />
          <label htmlFor="isPinnedEdit" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
            Pin pengumuman
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
            Berakhir Pada (Kosongkan untuk tidak berakhir)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} className="btn">
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={updateAnnouncement.isLoading}>
            {updateAnnouncement.isLoading ? <LoadingSpinner size={16} color="white" /> : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}

