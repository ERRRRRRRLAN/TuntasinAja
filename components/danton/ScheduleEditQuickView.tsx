'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import ComboBox from '@/components/ui/ComboBox'
import { XCloseIcon, TrashIcon, CalendarIcon } from '@/components/ui/Icons'
import { useBackHandler } from '@/hooks/useBackHandler'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import QuickViewConfirmDialog from '@/components/ui/QuickViewConfirmDialog'

interface ScheduleEditQuickViewProps {
  day: string
  period: number
  dayName: string
  currentSubject: string
  onClose: () => void
}

export default function ScheduleEditQuickView({
  day,
  period,
  dayName,
  currentSubject,
  onClose,
}: ScheduleEditQuickViewProps) {
  const [selectedSubject, setSelectedSubject] = useState(currentSubject)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const utils = trpc.useUtils()
  const { data: subjects } = trpc.weeklySchedule.getSubjects.useQuery()

  const setSchedule = trpc.weeklySchedule.setSchedule.useMutation({
    onSuccess: () => {
      utils.weeklySchedule.getSchedule.invalidate()
      utils.weeklySchedule.getUserSchedule.invalidate()
      handleCloseQuickView()
      toast.success('Jadwal berhasil disimpan!')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menyimpan jadwal')
    },
  })

  const deleteSchedule = trpc.weeklySchedule.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.weeklySchedule.getSchedule.invalidate()
      utils.weeklySchedule.getUserSchedule.invalidate()
      handleCloseQuickView()
      toast.success('Jadwal berhasil dihapus!')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus jadwal')
    },
  })

  const handleCloseQuickView = useCallback(() => {
    setIsQuickViewOpen(false)
    setIsVisible(false)
    setShowDeleteDialog(false)
    
    // Wait for transition to complete before closing
    setTimeout(() => {
      onClose()
    }, 300) // Match transition duration
  }, [onClose])

  // Mount effect for Portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Reset state when props change and handle scroll lock
  useEffect(() => {
    setSelectedSubject(currentSubject)
    setIsQuickViewOpen(true)
    setShowDeleteDialog(false)
    
    // Lock body scroll when quickview is open (mobile)
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    // Prevent scroll on touch devices
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (!contentRef.current?.contains(target)) {
        e.preventDefault()
      }
    }
    
    // Prevent scroll on wheel (for desktop)
    const preventWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (!contentRef.current?.contains(target)) {
        e.preventDefault()
      }
    }
    
    document.addEventListener('touchmove', preventScroll, { passive: false })
    document.addEventListener('wheel', preventWheel, { passive: false })
    
    // Push state untuk back handler
    window.history.pushState({ quickview: true }, '')
    
    // Small delay to ensure DOM is ready before showing
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
    
    return () => {
      setIsQuickViewOpen(false)
      setShowDeleteDialog(false)
      setIsVisible(false)
      
      // Unlock body scroll when quickview is closed
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('wheel', preventWheel)
      document.body.style.overflow = 'unset'
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      
      // Note: Scroll position restoration is handled by parent component (WeeklyScheduleManager)
    }
  }, [day, period, currentSubject])

  // Handle browser back button
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

  useBackHandler(shouldHandleBack, handleCloseQuickView)

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleCloseQuickView()
    }
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    
    // Auto-save on selection
    if (subject && subject.trim() !== '') {
      setSchedule.mutate({
        dayOfWeek: day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
        period,
        subject,
      })
    }
  }

  const handleDelete = () => {
    if (currentSubject) {
      setShowDeleteDialog(true)
    }
  }

  const handleConfirmDelete = () => {
    deleteSchedule.mutate({
      dayOfWeek: day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday',
      period,
    })
  }

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target === overlayRef.current && !isQuickViewOpen) {
      setIsVisible(false)
    }
  }

  // Don't render until mounted (for Portal)
  if (!mounted) return null

  const quickViewContent = (
    <>
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
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                flex: 1
              }}>
                <CalendarIcon size={24} style={{ color: 'var(--primary)' }} />
                <div>
                  <h2 className="thread-detail-title" style={{ margin: 0 }}>
                    Edit Jadwal
                  </h2>
                  <p style={{ 
                    margin: '0.25rem 0 0 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-light)' 
                  }}>
                    {dayName} - Jam ke-{period}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseQuickView}
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
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--card)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
                aria-label="Tutup"
              >
                <XCloseIcon size={20} />
              </button>
            </div>
          </div>

          <div className="quickview-body" style={{ 
            padding: '1.5rem',
            paddingBottom: '2rem'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'var(--text)'
              }}>
                Mata Pelajaran
              </label>
              {subjects ? (
                <ComboBox
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  placeholder="Pilih Mata Pelajaran"
                  options={subjects}
                  showAllOption={false}
                  searchPlaceholder="Cari mata pelajaran..."
                  emptyMessage="Tidak ada mata pelajaran yang ditemukan"
                />
              ) : (
                <div style={{ 
                  padding: '1rem', 
                  textAlign: 'center',
                  color: 'var(--text-light)'
                }}>
                  <LoadingSpinner size={24} />
                </div>
              )}
            </div>

            {currentSubject && (
              <div style={{ 
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border)'
              }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteSchedule.isLoading || setSchedule.isLoading}
                  className="btn btn-danger"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <TrashIcon size={18} />
                  {deleteSchedule.isLoading ? 'Menghapus...' : 'Hapus Jadwal'}
                </button>
              </div>
            )}

            <div style={{ 
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--text-light)',
              lineHeight: '1.5'
            }}>
              <strong>Tips:</strong> Pilih mata pelajaran dari dropdown di atas. Jadwal akan tersimpan otomatis saat dipilih.
            </div>
          </div>
        </div>
      </div>

      <QuickViewConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus Jadwal"
        message={`Yakin ingin menghapus jadwal ${dayName} - Jam ke-${period}?`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        disabled={deleteSchedule.isLoading}
      />
    </>
  )

  return createPortal(quickViewContent, document.body)
}
