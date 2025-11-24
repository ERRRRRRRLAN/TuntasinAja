'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { XCloseIcon, BookIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CreateThreadQuickViewProps {
  onClose: () => void
}

export default function CreateThreadQuickView({ onClose }: CreateThreadQuickViewProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const utils = trpc.useUtils()

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

  // Lock body scroll when quickview is open (mobile)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    // Small delay to ensure DOM is ready before showing
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    
    // Wait for transition to complete before closing
    const timer = setTimeout(() => {
      document.body.style.overflow = ''
      onClose()
    }, 300) // Match transition duration
    
    return () => clearTimeout(timer)
  }

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    // Only handle transition end for opacity (not child elements)
    if (e.target === overlayRef.current && !isVisible) {
      document.body.style.overflow = ''
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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
      onClick={handleClose}
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

