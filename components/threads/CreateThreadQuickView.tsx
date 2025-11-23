'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { XCloseIcon, BookIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'

interface CreateThreadQuickViewProps {
  onClose: () => void
}

export default function CreateThreadQuickView({ onClose }: CreateThreadQuickViewProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const utils = trpc.useUtils()

  const createThread = trpc.thread.create.useMutation({
    onSuccess: async (data) => {
      if (data.type === 'comment') {
        toast.info(
          `PR "${data.thread.title}" hari ini sudah dibuat oleh ${data.thread.author.name}. Postingan Anda ditambahkan sebagai komentar.`,
          5000
        )
      } else {
        toast.success('PR berhasil dibuat!')
      }
      setTitle('')
      setComment('')
      // Invalidate and refetch immediately
      await utils.thread.getAll.invalidate()
      await utils.thread.getAll.refetch()
      router.refresh()
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Lock body scroll when quickview is open (mobile)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = () => {
    // Start exit animation
    setIsClosing(true)
    
    // Wait for animation to complete before closing
    const timer = setTimeout(() => {
      setIsClosing(false)
      document.body.style.overflow = ''
      onClose()
    }, 300) // Match animation duration
    
    timeoutRef.current = timer
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast.warning('Pilih mata pelajaran terlebih dahulu!')
      return
    }
    createThread.mutate({ title, comment: comment || undefined })
  }

  return (
    <div className={`quickview-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`quickview-content ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
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
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createThread.isLoading}
              >
                {createThread.isLoading ? 'Membuat...' : 'Buat PR'}
              </button>
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-secondary"
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

