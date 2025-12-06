'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { XCloseIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
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
      toast.success('Pengumuman berhasil dibuat!')
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
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="quickview-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Buat Pengumuman Baru</h2>
          <button
            onClick={handleClose}
            className="btn btn-icon"
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Tutup"
          >
            <XCloseIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
              Judul *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul pengumuman"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9375rem' }}
              maxLength={200}
              required
              autoFocus
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
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9375rem', resize: 'vertical' }}
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
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9375rem' }}
              disabled={!isAdmin}
            >
              <option value="global">Global (Semua Kelas)</option>
              <option value="class">Kelas Tertentu</option>
              <option value="subject">Mata Pelajaran Tertentu</option>
            </select>
            {!isAdmin && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                Hanya admin yang bisa membuat pengumuman global
              </p>
            )}
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
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9375rem' }}
            >
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="low">Rendah</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="isPinned" style={{ fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}>
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
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9375rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn"
              disabled={isSubmitting || createAnnouncement.isLoading}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting || createAnnouncement.isLoading}
              style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSubmitting || createAnnouncement.isLoading ? (
                <>
                  <LoadingSpinner size={16} color="white" />
                  Menyimpan...
                </>
              ) : (
                'Buat Pengumuman'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

