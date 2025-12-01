'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { XCloseIcon, BookIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useUserPermission } from '@/hooks/useUserPermission'
import { useBackHandler } from '@/hooks/useBackHandler'

interface CreateThreadQuickViewProps {
  onClose: () => void
}

export default function CreateThreadQuickView({ onClose }: CreateThreadQuickViewProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const utils = trpc.useUtils()
  const { canPostEdit, isOnlyRead } = useUserPermission()

  // Get user data (kelas)
  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const userKelas = userData?.kelas || null

  // Get subjects for user's class
  const { data: classSubjects } = trpc.classSubject.getClassSubjects.useQuery(
    { kelas: userKelas || undefined },
    { enabled: !!session && !!userKelas }
  )
  const subjectOptions = classSubjects?.map((s: any) => s.subject) || []

  // Close if user doesn't have permission
  useEffect(() => {
    if (isOnlyRead) {
      toast.error('Anda hanya memiliki izin membaca. Tidak dapat membuat thread baru.')
      onClose()
    }
  }, [isOnlyRead, onClose])

  const createThread = trpc.thread.create.useMutation({
    onSuccess: async (data) => {
      if (data.type === 'comment') {
        toast.info(
          `PR "${data.thread.title}" hari ini sudah dibuat oleh ${data.thread.author.name}. Postingan Anda ditambahkan sebagai sub tugas.`,
          5000
        )
      } else {
        toast.success('PR berhasil dibuat!')
      }
      setTitle('')
      setComment('')
      setIsSubmitting(false)
      // Invalidate and refetch immediately
      await utils.thread.getAll.invalidate()
      await utils.thread.getAll.refetch()
      router.refresh()
      onClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      toast.error(error.message)
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
    window.history.pushState({ quickview: true }, '')
    
    // Small delay to ensure DOM is ready before showing
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
    
    return () => {
      setIsQuickViewOpen(false)
      setIsVisible(false)
      
      // Unlock body scroll when quickview is closed
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      
      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Handle browser back button untuk quickview
  const [shouldHandleBack, setShouldHandleBack] = useState(false)
  
  useEffect(() => {
    if (isQuickViewOpen && isVisible) {
      const timer = setTimeout(() => {
        setShouldHandleBack(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShouldHandleBack(false)
    }
  }, [isQuickViewOpen, isVisible])

  useBackHandler(shouldHandleBack, handleClose)

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.target === overlayRef.current) {
      handleClose()
    }
  }

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isQuickViewOpen) {
      setIsVisible(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check permission
    if (isOnlyRead || !canPostEdit) {
      toast.error('Anda hanya memiliki izin membaca. Tidak dapat membuat thread baru.')
      return
    }
    
    // Prevent double submission
    if (isSubmitting || createThread.isLoading) {
      return
    }
    
    if (!title) {
      toast.warning('Pilih mata pelajaran terlebih dahulu!')
      return
    }
    
    setIsSubmitting(true)
    createThread.mutate({ title, comment: comment || undefined })
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
              {/* Empty left section for CreateThreadQuickView */}
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
                Buat PR Baru
              </span>
            </h2>
          </div>
        </div>

        <div className="comments-section">
          <form onSubmit={handleSubmit} style={{ padding: '0' }}>
            <div className="form-group">
              <label htmlFor="threadTitle">Nama Mata Pelajaran *</label>
              <ComboBox
                value={title}
                onChange={setTitle}
                placeholder="-- Pilih Mata Pelajaran --"
                options={subjectOptions}
                showAllOption={false}
                searchPlaceholder="Cari mata pelajaran..."
                emptyMessage="Tidak ada mata pelajaran yang ditemukan"
                icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
              />
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
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createThread.isLoading || isSubmitting}
              >
                {createThread.isLoading || isSubmitting ? (
                  <>
                    <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                    Membuat...
                  </>
                ) : 'Buat PR'}
              </button>
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-secondary"
                disabled={createThread.isLoading || isSubmitting}
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

