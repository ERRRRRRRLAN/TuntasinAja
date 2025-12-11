'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { XCloseIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
import DateTimePicker from '@/components/ui/DateTimePicker'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useUserPermission } from '@/hooks/useUserPermission'
import { useBackHandler } from '@/hooks/useBackHandler'

interface CreateAnnouncementQuickViewProps {
  onClose: () => void
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

export default function CreateAnnouncementQuickView({ onClose }: CreateAnnouncementQuickViewProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'global' | 'class' | 'subject'>('class')
  const [targetKelas, setTargetKelas] = useState<string>('')
  const [targetSubject, setTargetSubject] = useState<string>('')
  const [priority, setPriority] = useState<'urgent' | 'normal' | 'low'>('normal')
  const [isPinned, setIsPinned] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const utils = trpc.useUtils()
  const { canCreateAnnouncement } = useUserPermission()

  // Get user data (kelas, isAdmin, isDanton)
  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const userKelas = userData?.kelas || null
  const isAdmin = userData?.isAdmin || false
  const isDanton = userData?.isDanton || false

  // Get subjects for user's class
  const { data: classSubjects } = trpc.classSubject.getClassSubjects.useQuery(
    { kelas: targetKelas || userKelas || undefined },
    { enabled: !!session && (!!targetKelas || !!userKelas) && targetType === 'subject' }
  )
  const subjectOptions = classSubjects?.map((s: any) => s.subject) || []
  const kelasOptions = generateKelasOptions()

  // Set default kelas to user's kelas
  useEffect(() => {
    if (userKelas && !targetKelas) {
      setTargetKelas(userKelas)
    }
  }, [userKelas, targetKelas])

  // Set default targetType based on user role
  useEffect(() => {
    if (!isAdmin && userKelas) {
      setTargetType('class')
    }
  }, [isAdmin, userKelas])

  const createAnnouncement = trpc.announcement.create.useMutation({
    onSuccess: async () => {
      // Toast notification removed: User requested to remove UI notifications
      setTitle('')
      setContent('')
      setTargetType('class')
      setTargetKelas(userKelas || '')
      setTargetSubject('')
      setPriority('normal')
      setIsPinned(false)
      setExpiresAt('')
      setIsSubmitting(false)
      // Invalidate and refetch
      await utils.announcement.getAll.invalidate()
      await utils.announcement.getAll.refetch()
      onClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(error.message || 'Gagal membuat pengumuman')
    },
  })

  const handleClose = useCallback(() => {
    setIsQuickViewOpen(false)
    setIsVisible(false)
    
    // Wait for transition to complete before closing
    setTimeout(() => {
      document.body.style.overflow = ''
      onClose()
    }, 300) // Match transition duration
  }, [onClose])

  // Lock body scroll when quickview is open (mobile)
  useEffect(() => {
    setIsQuickViewOpen(true)
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    // Push state untuk back handler
    window.history.pushState({ quickView: true }, '')
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Show animation after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  // Handle back button (Android)
  useBackHandler(isQuickViewOpen, handleClose)

  // Handle popstate (browser back button)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isQuickViewOpen) {
        handleClose()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isQuickViewOpen, handleClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose()
    }
  }

  const handleTransitionEnd = () => {
    if (!isQuickViewOpen && !isVisible) {
      // Cleanup after transition
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting || createAnnouncement.isLoading) {
      return
    }

    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan konten harus diisi')
      return
    }

    if (targetType === 'class' && !targetKelas) {
      toast.error('Kelas harus dipilih untuk pengumuman kelas')
      return
    }

    if (targetType === 'subject' && (!targetKelas || !targetSubject)) {
      toast.error('Kelas dan mata pelajaran harus dipilih untuk pengumuman mata pelajaran')
      return
    }

    setIsSubmitting(true)
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
    <div 
      ref={overlayRef}
      className="quickview-overlay" 
      onClick={handleOverlayClick}
      onTransitionEnd={handleTransitionEnd}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        ref={contentRef}
        className="quickview-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
        }}
      >
        <div className="quickview-header">
          <div className="quickview-header-top">
            <div className="quickview-header-left">
              {/* Empty left section */}
            </div>
            <button
              onClick={handleClose}
              className="quickview-close-btn"
              style={{
                background: 'var(--card)',
                border: '2px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--text)',
                padding: '0.625rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                minWidth: '44px',
                minHeight: '44px',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--primary)'
                e.currentTarget.style.color = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              aria-label="Tutup"
            >
              <XCloseIcon size={22} />
            </button>
          </div>
          
          <div className="quickview-title-section">
            <h2 className="thread-detail-title" style={{ 
              margin: 0,
              flex: 1,
              lineHeight: 1.4
            }}>
              <span style={{
                color: 'var(--text)',
                wordBreak: 'break-word'
              }}>
                Buat Pengumuman Baru
              </span>
            </h2>
          </div>
        </div>

        <div className="comments-section">
          <form onSubmit={handleSubmit} style={{ padding: '0' }}>
            <div className="form-group">
              <label htmlFor="announcementTitle">Judul *</label>
              <input
                type="text"
                id="announcementTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul pengumuman"
                maxLength={200}
                required
                autoFocus
              />
              <small className="form-hint">Maksimal 200 karakter</small>
            </div>

            <div className="form-group">
              <label htmlFor="announcementContent">Konten *</label>
              <textarea
                id="announcementContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Masukkan isi pengumuman"
                rows={6}
                maxLength={5000}
                required
              />
              <small className="form-hint">Maksimal 5000 karakter</small>
            </div>

            <div className="form-group">
              <label htmlFor="announcementTarget">Target</label>
              <ComboBox
                value={targetType}
                onChange={(value) => setTargetType(value as 'global' | 'class' | 'subject')}
                options={[
                  { value: 'global', label: 'Global (Semua Kelas)' },
                  { value: 'class', label: 'Kelas Tertentu' },
                  { value: 'subject', label: 'Mata Pelajaran Tertentu' },
                ]}
                placeholder="Pilih Target"
                showAllOption={false}
                disabled={!isAdmin}
              />
              {!isAdmin && (
                <small className="form-hint">Hanya admin yang bisa membuat pengumuman global</small>
              )}
            </div>

            {targetType === 'class' && (
              <div className="form-group">
                <label htmlFor="announcementKelas">Kelas *</label>
                <ComboBox
                  value={targetKelas}
                  onChange={setTargetKelas}
                  options={kelasOptions}
                  placeholder="Pilih Kelas"
                  showAllOption={false}
                  disabled={!isAdmin && !!userKelas} // Disable for danton/non-admin
                />
                {!isAdmin && userKelas && (
                  <small className="form-hint">Pengumuman akan dibuat untuk kelas Anda: {userKelas}</small>
                )}
              </div>
            )}

            {targetType === 'subject' && (
              <>
                <div className="form-group">
                  <label htmlFor="announcementKelas">Kelas *</label>
                  <ComboBox
                    value={targetKelas}
                    onChange={setTargetKelas}
                    options={kelasOptions}
                    placeholder="Pilih Kelas"
                    showAllOption={false}
                    disabled={!isAdmin && !!userKelas} // Disable for danton/non-admin
                  />
                  {!isAdmin && userKelas && (
                    <small className="form-hint">Pengumuman akan dibuat untuk kelas Anda: {userKelas}</small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="announcementSubject">Mata Pelajaran *</label>
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

            <div className="form-group">
              <label htmlFor="announcementPriority">Prioritas</label>
              <ComboBox
                value={priority}
                onChange={(value) => setPriority(value as 'urgent' | 'normal' | 'low')}
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Rendah' },
                ]}
                placeholder="Pilih Prioritas"
                showAllOption={false}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Pin pengumuman (tampilkan di atas)</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="announcementExpiresAt">Berakhir Pada (Opsional)</label>
              <DateTimePicker
                value={expiresAt}
                onChange={setExpiresAt}
                placeholder="Pilih tanggal dan waktu berakhir"
                min={new Date().toISOString().slice(0, 16)}
              />
              <small className="form-hint">Pengumuman akan otomatis tidak terlihat setelah tanggal ini</small>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createAnnouncement.isLoading || isSubmitting}
              >
                {createAnnouncement.isLoading || isSubmitting ? (
                  <>
                    <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                    Menyimpan...
                  </>
                ) : 'Buat Pengumuman'}
              </button>
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-secondary"
                disabled={createAnnouncement.isLoading || isSubmitting}
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

