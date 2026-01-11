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
import Checkbox from '@/components/ui/Checkbox'

interface CreateAnnouncementQuickViewProps {
  onClose: () => void
}

// Hardcoded kelasOptions removed

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
  const [isMobile, setIsMobile] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
  const { canCreateAnnouncement } = useUserPermission()

  // Get user data (kelas, isAdmin, isKetua)
  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const userKelas = userData?.kelas || null
  const isAdmin = userData?.isAdmin || false
  const isKetua = userData?.isKetua || false

  // Get subjects for user's class
  const { data: allClassNames } = trpc.school.getAllClassNames.useQuery()
  const { data: classSubjects } = trpc.classSubject.getClassSubjects.useQuery(
    { kelas: targetKelas || userKelas || undefined },
    { enabled: !!session && (!!targetKelas || !!userKelas) && targetType === 'subject' }
  )
  const subjectOptions = classSubjects?.map((s: any) => s.subject) || []
  const kelasOptions = allClassNames || []

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
      console.error('[ERROR]', error.message || 'Gagal membuat pengumuman')
    },
  })

  // Get taggable users
  const { data: taggableUsers } = trpc.announcement.getTaggableUsers.useQuery(
    { targetType, targetKelas: targetKelas || undefined },
    { enabled: !!session }
  )

  const filteredUsers = taggableUsers?.filter(u =>
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  ).slice(0, 5) || []

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursor = e.target.selectionStart
    setContent(value)
    setCursorPosition(cursor)

    // Check if we should show mentions
    const textBeforeCursor = value.substring(0, cursor)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setShowMentions(true)
      setMentionFilter(mentionMatch[1])
      setMentionIndex(0)
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (name: string) => {
    const textBeforeCursor = content.substring(0, cursorPosition)
    const textAfterCursor = content.substring(cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const pseudoUsername = name.replace(/\s+/g, '')
      const newTextBefore = textBeforeCursor.substring(0, mentionMatch.index) + '@' + pseudoUsername + ' '
      setContent(newTextBefore + textAfterCursor)
      setShowMentions(false)

      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newPos = newTextBefore.length
          textareaRef.current.setSelectionRange(newPos, newPos)
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(prev => (prev + 1) % filteredUsers.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredUsers[mentionIndex].name)
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    }
  }

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
        <div className="quickview-header" style={{ position: 'relative' }}>
          {/* Close Button - Always on the right top corner */}
          <button
            onClick={handleClose}
            className="quickview-close-btn"
            style={{
              position: 'absolute',
              top: isMobile ? `calc(1rem + env(safe-area-inset-top, 0px))` : '1.5rem',
              right: isMobile ? '1rem' : '2rem',
              background: 'var(--card)',
              border: '2px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--text)',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.5rem',
              minWidth: '36px',
              minHeight: '36px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              zIndex: 10,
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
            <XCloseIcon size={20} />
          </button>

          <div className="quickview-title-section" style={{ paddingRight: isMobile ? '50px' : '60px' }}>
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
              <div style={{ position: 'relative' }}>
                <textarea
                  id="announcementContent"
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Masukkan isi pengumuman (gunakan @ untuk tag, *tebal*, _miring_)"
                  rows={6}
                  maxLength={5000}
                  required
                />

                {showMentions && filteredUsers.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    width: '100%',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}>
                    {filteredUsers.map((user, idx) => (
                      <div
                        key={user.id}
                        onClick={() => insertMention(user.name)}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          background: idx === mentionIndex ? 'var(--bg-secondary)' : 'transparent',
                          borderBottom: idx < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{user.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>@{user.name.replace(/\s+/g, '')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="form-hint">Gunakan @ untuk tag teman, *bold*, _italic_, ~strike~, `code`</small>
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
                  disabled={!isAdmin && !!userKelas} // Disable for ketua/non-admin
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
                    disabled={!isAdmin && !!userKelas} // Disable for ketua/non-admin
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <Checkbox
                  checked={isPinned}
                  onChange={() => setIsPinned(!isPinned)}
                  size={18}
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

