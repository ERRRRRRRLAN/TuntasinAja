'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { addWeeks } from 'date-fns'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { XCloseIcon, BookIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
import DateTimePicker from '@/components/ui/DateTimePicker'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import UserAutocomplete from '@/components/ui/UserAutocomplete'
import RadioButton from '@/components/ui/RadioButton'
import { useUserPermission } from '@/hooks/useUserPermission'
import { useBackHandler } from '@/hooks/useBackHandler'

interface User {
  id: string
  name: string
  email: string
  kelas: string | null
}

interface CreateThreadQuickViewProps {
  onClose: () => void
}

export default function CreateThreadQuickView({ onClose }: CreateThreadQuickViewProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isGroupTask, setIsGroupTask] = useState(false)
  const [groupTaskTitle, setGroupTaskTitle] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  // Default deadline: 7 days from today at 00:00 (midnight) in local timezone
  // Calculate when form is opened, not when component mounts
  const getDefaultDeadline = () => {
    const today = new Date()
    // Add 7 days
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    // Set time to 00:00:00 in local timezone
    sevenDaysLater.setHours(0, 0, 0, 0)
    
    // Format as local date-time string (YYYY-MM-DDTHH:mm)
    // Don't use toISOString() as it converts to UTC which can change the date
    const year = sevenDaysLater.getFullYear()
    const month = String(sevenDaysLater.getMonth() + 1).padStart(2, '0')
    const day = String(sevenDaysLater.getDate()).padStart(2, '0')
    const hours = String(sevenDaysLater.getHours()).padStart(2, '0')
    const minutes = String(sevenDaysLater.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  const [deadline, setDeadline] = useState<string>(getDefaultDeadline())
  const [deadlineError, setDeadlineError] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

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
      console.error('[ERROR] Anda hanya memiliki izin membaca. Tidak dapat membuat thread baru.')
      onClose()
    }
  }, [isOnlyRead, onClose])

  const createThread = trpc.thread.create.useMutation({
    onSuccess: async (data) => {
      if (data.type === 'comment') {
        console.info('[INFO]', `PR "${data.thread.title}" hari ini sudah dibuat oleh ${data.thread.author.name}. Postingan Anda ditambahkan sebagai sub tugas.`)
      } else {
        // Toast notification removed: User requested to remove UI notifications
      }
      
      // Clear deadline error on success
      setDeadlineError('')
      
      // Invalidate and refetch immediately
      await utils.thread.getAll.invalidate()
      await utils.thread.getAll.refetch()
      router.refresh()
      
      // Close immediately after success without resetting fields
      setIsSubmitting(false)
      handleClose()
    },
    onError: (error) => {
      setIsSubmitting(false)
      const errorMessage = error.message || 'Gagal membuat tugas. Silakan coba lagi.'
      console.error('[ERROR]', errorMessage)
      
      // Check if error is related to deadline
      if (errorMessage.includes('Deadline') || errorMessage.includes('deadline') || errorMessage.includes('masa lalu')) {
        setDeadlineError('Tidak boleh mencantumkan waktu deadline yang sudah terlewat')
      } else {
        setDeadlineError('')
      toast.error(errorMessage, 5000) // Show error toast for 5 seconds
      }
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
  // Also reset deadline to current date + 7 days when form opens
  useEffect(() => {
    setIsQuickViewOpen(true)
    // Reset deadline to 7 days from today when form opens
    setDeadline(getDefaultDeadline())
    
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
      console.error('[ERROR] Anda hanya memiliki izin membaca. Tidak dapat membuat thread baru.')
      return
    }
    
    // Prevent double submission
    if (isSubmitting || createThread.isLoading) {
      return
    }
    
    if (!title) {
      console.warn('[WARNING] Pilih mata pelajaran terlebih dahulu!')
      return
    }

    // Validate group task fields
    if (isGroupTask) {
      if (!groupTaskTitle.trim()) {
        console.warn('[WARNING] Judul tugas kelompok harus diisi!')
        return
      }
      if (selectedMembers.length === 0) {
        console.warn('[WARNING] Pilih minimal 1 anggota kelompok!')
        return
      }
    }
    
    // Validate deadline - must be in the future
    if (deadline) {
      const deadlineDate = new Date(deadline)
      const now = new Date()
      if (deadlineDate <= now) {
        setDeadlineError('Tidak boleh mencantumkan waktu deadline yang sudah terlewat')
        setIsSubmitting(false)
        return
      }
    }
    
    // Clear any previous deadline error
    setDeadlineError('')
    setIsSubmitting(true)
    
    createThread.mutate({ 
      title, 
      comment: comment || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      isGroupTask,
      groupTaskTitle: isGroupTask ? groupTaskTitle : undefined,
      memberIds: isGroupTask ? selectedMembers.map(m => m.id) : undefined,
    })
  }

  return (
    <>
      {/* Loading Overlay - Full Screen */}
      {isSubmitting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out',
            padding: '1rem', // Padding for mobile
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              padding: '2.5rem',
              background: 'var(--card)',
              borderRadius: '1.25rem',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
              animation: 'fadeInUp 0.3s ease-out',
              maxWidth: '90vw',
              width: 'auto',
              minWidth: '280px',
            }}
          >
            {/* Custom spinner with guaranteed animation */}
            <div
              style={{
                width: '64px',
                height: '64px',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  border: '4px solid rgba(59, 130, 246, 0.2)',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  WebkitAnimation: 'spin 0.8s linear infinite', // For Safari
                }}
              />
            </div>
            <p style={{ 
              color: 'var(--text)', 
              fontSize: '1.125rem', 
              margin: 0, 
              fontWeight: 600,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              width: '100%',
            }}>
              Membuat PR...
            </p>
          </div>
        </div>
      )}

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
        {/* Simplified Header */}
        <div className="quickview-header" style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem 2rem',
          paddingTop: isMobile ? `calc(1rem + env(safe-area-inset-top, 0px))` : '1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          position: 'relative',
        }}>
          {/* Top Row: Close Button - Always on the right top corner */}
          <div style={{
            position: 'absolute',
            top: isMobile ? `calc(1rem + env(safe-area-inset-top, 0px))` : '1.5rem',
            right: isMobile ? '1rem' : '2rem',
            zIndex: 10,
          }}>
            <button
              onClick={handleClose}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                minWidth: '36px',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-light)'
              }}
              aria-label="Tutup"
            >
              <XCloseIcon size={20} />
            </button>
          </div>
          
          {/* Title Section */}
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.4,
              wordBreak: 'break-word',
              }}>
                Buat PR Baru
            </h2>
          </div>
        </div>

        <div className="comments-section" style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem 2rem',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Pilihan Jenis Tugas */}
            <div className="form-group">
              <label>Jenis Tugas *</label>
              <div style={{ display: 'flex', gap: isMobile ? '0.75rem' : '1rem', marginTop: '0.5rem' }}>
                <label
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isGroupTask) return
                    setIsGroupTask(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.5rem' : '0.75rem',
                    cursor: 'pointer',
                    padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                    border: `2px solid ${!isGroupTask ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '0.5rem',
                    background: !isGroupTask ? 'var(--primary)10' : 'transparent',
                    flex: 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isGroupTask) return
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.background = 'var(--primary)05'
                  }}
                  onMouseLeave={(e) => {
                    if (!isGroupTask) return
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <RadioButton
                    checked={!isGroupTask}
                    onChange={() => setIsGroupTask(false)}
                    size={isMobile ? 18 : 20}
                  />
                  <span style={{ 
                    fontWeight: !isGroupTask ? 600 : 400,
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  }}>Individual</span>
                </label>
                <label
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isGroupTask) return
                    setIsGroupTask(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.5rem' : '0.75rem',
                    cursor: 'pointer',
                    padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
                    border: `2px solid ${isGroupTask ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '0.5rem',
                    background: isGroupTask ? 'var(--primary)10' : 'transparent',
                    flex: 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (isGroupTask) return
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.background = 'var(--primary)05'
                  }}
                  onMouseLeave={(e) => {
                    if (isGroupTask) return
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <RadioButton
                    checked={isGroupTask}
                    onChange={() => setIsGroupTask(true)}
                    size={isMobile ? 18 : 20}
                  />
                  <span style={{ 
                    fontWeight: isGroupTask ? 600 : 400,
                    fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  }}>Kelompok</span>
                </label>
              </div>
              <small className="form-hint">
                {isGroupTask
                  ? 'Tugas untuk kelompok tertentu dengan anggota yang bisa dipilih'
                  : 'Tugas untuk semua siswa di kelas yang sama'}
              </small>
            </div>

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

            {/* Group Task Title */}
            {isGroupTask && (
              <div className="form-group">
                <label htmlFor="groupTaskTitle">Judul Tugas Kelompok *</label>
                <input
                  type="text"
                  id="groupTaskTitle"
                  value={groupTaskTitle}
                  onChange={(e) => setGroupTaskTitle(e.target.value)}
                  placeholder="Contoh: Membuat Presentasi Bab 5"
                  required={isGroupTask}
                />
                <small className="form-hint">Judul yang mendeskripsikan tugas kelompok</small>
              </div>
            )}

            {/* Group Members */}
            {isGroupTask && (
              <div className="form-group">
                <label>Anggota Kelompok *</label>
                <UserAutocomplete
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  placeholder="Ketik nama anggota... (contoh: Makarim)"
                  excludeUserId={session?.user?.id}
                />
                <small className="form-hint">
                  Pilih anggota kelompok. Anda akan otomatis menjadi anggota.
                </small>
              </div>
            )}

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

            <div className="form-group">
              <label htmlFor="threadDeadline">Deadline (Opsional)</label>
              <DateTimePicker
                value={deadline}
                onChange={(value) => {
                  setDeadline(value)
                  setDeadlineError('') // Clear error when user changes deadline
                }}
                placeholder="Pilih deadline tugas"
                min={new Date().toISOString().slice(0, 16)}
              />
              {deadlineError && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.875rem', 
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>⚠️</span>
                  <span>{deadlineError}</span>
                </div>
              )}
              {!deadlineError && (
              <small className="form-hint">Tentukan kapan tugas harus selesai (opsional)</small>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn"
                disabled={createThread.isLoading || isSubmitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: createThread.isLoading || isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: createThread.isLoading || isSubmitting ? 0.6 : 1,
                }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={createThread.isLoading || isSubmitting}
                style={{
                  padding: '0.75rem 1.5rem',
                }}
              >
                {createThread.isLoading || isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <LoadingSpinner size={16} color="white" />
                    <span>Membuat...</span>
                  </span>
                ) : (isGroupTask ? 'Buat Tugas Kelompok' : 'Buat PR')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}

