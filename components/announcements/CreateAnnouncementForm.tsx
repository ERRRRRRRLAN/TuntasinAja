'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { XCloseIcon } from '@/components/ui/Icons'
import { format, addHours } from 'date-fns'
import { id } from 'date-fns/locale'

interface CreateAnnouncementFormProps {
  announcementId?: string
  initialData?: {
    title: string
    content: string
    expiresAt: Date
  }
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateAnnouncementForm({ 
  announcementId, 
  initialData, 
  onClose, 
  onSuccess 
}: CreateAnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const isEditing = !!announcementId

  useEffect(() => {
    if (initialData?.expiresAt) {
      const now = new Date()
      const expiresAt = new Date(initialData.expiresAt)
      const diffMs = expiresAt.getTime() - now.getTime()
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
      if (diffHours > 0) {
        setExpiresInHours(diffHours)
      }
    }
    setIsVisible(true)
    
    // Lock body scroll
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      handleClose()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isVisible])

  const utils = trpc.useUtils()

  const createAnnouncement = trpc.announcement.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Announcement berhasil dibuat!')
      utils.announcement.getAll.invalidate()
      if (!data.message?.includes('Request')) {
        utils.announcement.getRequestCount.invalidate()
      }
      if (onSuccess) onSuccess()
      handleClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal membuat announcement')
    },
  })

  const updateAnnouncement = trpc.announcement.update.useMutation({
    onSuccess: () => {
      toast.success('Announcement berhasil diupdate!')
      utils.announcement.getAll.invalidate()
      if (onSuccess) onSuccess()
      handleClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengupdate announcement')
    },
  })

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan konten harus diisi')
      return
    }

    if (expiresInHours < 1 || expiresInHours > 8760) {
      toast.error('Durasi harus antara 1 jam sampai 8760 jam (1 tahun)')
      return
    }

    if (isEditing) {
      updateAnnouncement.mutate({
        announcementId,
        title: title.trim(),
        content: content.trim(),
        expiresInHours,
      })
    } else {
      createAnnouncement.mutate({
        title: title.trim(),
        content: content.trim(),
        expiresInHours,
      })
    }
  }

  const isLoading = createAnnouncement.isLoading || updateAnnouncement.isLoading

  const previewExpiresAt = addHours(new Date(), expiresInHours)

  return (
    <div
      ref={overlayRef}
      className="quickview-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        className="quickview-content"
        style={{
          background: 'var(--card)',
          borderRadius: '0.5rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.3s ease-out',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="announcement-form-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--card)',
          zIndex: 10,
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            {isEditing ? 'Edit Announcement' : 'Buat Announcement'}
          </h2>
          <button
            onClick={handleClose}
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
              minWidth: '44px',
              minHeight: '44px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            title="Tutup"
          >
            <XCloseIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="announcement-form-content" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="announcement-title">
                Judul *
              </label>
              <input
                id="announcement-title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                disabled={isLoading}
                placeholder="Masukkan judul announcement"
                style={{ minHeight: '44px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="announcement-content">
                Konten *
              </label>
              <textarea
                id="announcement-content"
                className="form-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                disabled={isLoading}
                placeholder="Masukkan konten announcement"
                style={{ 
                  resize: 'vertical',
                  minHeight: '120px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="announcement-expires">
                Berlaku Selama (Jam) *
              </label>
              <input
                id="announcement-expires"
                type="number"
                className="form-input"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 1)}
                required
                min={1}
                max={8760}
                disabled={isLoading}
                style={{ minHeight: '44px' }}
              />
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                <p style={{ margin: '0 0 0.25rem 0' }}>
                  <strong>Contoh:</strong>
                </p>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li>24 jam = 1 hari</li>
                  <li>168 jam = 7 hari (1 minggu)</li>
                  <li>720 jam = 30 hari (1 bulan)</li>
                </ul>
                {expiresInHours > 0 && (
                  <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Akan terhapus pada: {format(previewExpiresAt, 'd MMMM yyyy, HH:mm', { locale: id })}
                  </p>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !title.trim() || !content.trim()}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: '0.625rem 1.25rem',
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <LoadingSpinner size={16} color="white" />
                    {isEditing ? 'Menyimpan...' : 'Membuat...'}
                  </span>
                ) : (
                  isEditing ? 'Simpan Perubahan' : 'Buat Announcement'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: '0.625rem 1.25rem',
                }}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

