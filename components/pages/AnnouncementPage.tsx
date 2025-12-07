'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AlertTriangleIcon, PinIcon, ClockIcon, UserIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { useUserPermission } from '@/hooks/useUserPermission'
import CreateAnnouncementQuickView from '@/components/announcements/CreateAnnouncementQuickView'

export default function AnnouncementPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { canCreateAnnouncement } = useUserPermission()
  const [hasSessionCookie, setHasSessionCookie] = useState(false)

  // Check if session cookie exists (even if session data not loaded yet)
  useEffect(() => {
    const checkSessionCookie = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const hasCookie = cookies.some(cookie => {
          const trimmed = cookie.trim()
          return trimmed.startsWith('next-auth.session-token=') || 
                 trimmed.startsWith('__Secure-next-auth.session-token=')
        })
        setHasSessionCookie(hasCookie)
      }
    }

    checkSessionCookie()
    
    // Check periodically in case cookie is restored
    const interval = setInterval(checkSessionCookie, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Get user data to check if admin/danton
  const { data: userData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = userData?.isAdmin || false
  const isDanton = userData?.isDanton || false

  const { data: announcements, isLoading, refetch } = trpc.announcement.getAll.useQuery(undefined, {
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false
      }
      return 60000 // 60 seconds - less frequent to prevent flickering
    },
    refetchOnWindowFocus: false, // Disable to prevent flickering
  })

  const { data: unreadData } = trpc.announcement.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) {
        return false
      }
      return 60000 // 60 seconds - less frequent to prevent flickering
    },
    refetchOnWindowFocus: false, // Disable to prevent flickering
  })

  const markAsRead = trpc.announcement.markAsRead.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const deleteAnnouncement = trpc.announcement.delete.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(false)
      setDeleteId(null)
      refetch()
    },
    onError: (error) => {
      toast.error(`Gagal menghapus pengumuman: ${error.message}`)
      setShowDeleteDialog(false)
    },
  })

  // Mark as read when viewing
  useEffect(() => {
    if (selectedAnnouncement && session) {
      markAsRead.mutate({ announcementId: selectedAnnouncement })
    }
  }, [selectedAnnouncement, session])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'var(--danger)'
      case 'normal':
        return 'var(--primary)'
      case 'low':
        return 'var(--text-light)'
      default:
        return 'var(--text-light)'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent'
      case 'normal':
        return 'Normal'
      case 'low':
        return 'Rendah'
      default:
        return priority
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  const unreadCount = unreadData?.unreadCount || 0

  return (
    <>
      {showCreateForm && (isAdmin || isDanton || canCreateAnnouncement) && (
        <CreateAnnouncementQuickView
          onClose={() => {
            setShowCreateForm(false)
            refetch()
          }}
        />
      )}
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Pengumuman
          </h1>
          {unreadCount > 0 && (
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              {unreadCount} pengumuman belum dibaca
            </p>
          )}
        </div>
      </div>

      {!announcements || announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-light)' }}>
            Belum ada pengumuman.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((announcement) => {
            const isSelected = selectedAnnouncement === announcement.id
            const createdAtJakarta = toJakartaDate(announcement.createdAt)
            const expiresAtJakarta = announcement.expiresAt ? toJakartaDate(announcement.expiresAt) : null

            return (
              <div
                key={announcement.id}
                className="card"
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onClick={() => setSelectedAnnouncement(isSelected ? null : announcement.id)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'var(--shadow)'
                  }
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      {announcement.isPinned && (
                        <PinIcon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      )}
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          margin: 0,
                          color: announcement.isRead ? 'var(--text-light)' : 'var(--text)',
                        }}
                      >
                        {announcement.title}
                      </h3>
                      {!announcement.isRead && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    {/* Delete button for author */}
                    {session && announcement.authorId === session.user.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(announcement.id)
                          setShowDeleteDialog(true)
                        }}
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626'
                          e.currentTarget.style.transform = 'scale(1.1)'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ef4444'
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.color = 'white'
                        }}
                        aria-label="Hapus pengumuman"
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        <UserIcon size={14} />
                        <span>{announcement.author.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        <ClockIcon size={14} />
                        <span>{format(createdAtJakarta, 'd MMM yyyy, HH:mm', { locale: id })}</span>
                      </div>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: getPriorityColor(announcement.priority) + '20',
                          color: getPriorityColor(announcement.priority),
                        }}
                      >
                        {getPriorityLabel(announcement.priority)}
                      </span>
                      {announcement.targetType === 'class' && announcement.targetKelas && (
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text)',
                          }}
                        >
                          {announcement.targetKelas}
                        </span>
                      )}
                      {announcement.targetType === 'subject' && announcement.targetSubject && (
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text)',
                          }}
                        >
                          {announcement.targetSubject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                {!isSelected && (
                  <p
                    style={{
                      color: 'var(--text-light)',
                      fontSize: '0.875rem',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {announcement.content}
                  </p>
                )}

                {/* Full Content */}
                {isSelected && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div
                      style={{
                        color: 'var(--text)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {announcement.content}
                    </div>
                    {expiresAtJakarta && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        <AlertTriangleIcon size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Berakhir pada: {format(expiresAtJakarta, 'd MMMM yyyy, HH:mm', { locale: id })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }            )}
          </div>
        )}

        {/* FAB Button - Buat Pengumuman */}
        {(isAdmin || isDanton || canCreateAnnouncement) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="fab-button fab-create-announcement"
            aria-label="Buat Pengumuman"
            style={{
              position: 'fixed',
              bottom: '1.5rem',
              right: '1.5rem',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 998,
              transition: 'all 0.3s ease',
              padding: 0,
              minHeight: '56px',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-dark)'
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <PlusIcon size={24} />
          </button>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <ConfirmDialog
            isOpen={showDeleteDialog}
            title="Hapus Pengumuman"
            message="Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan."
            confirmText={deleteAnnouncement.isLoading ? 'Menghapus...' : 'Hapus'}
            cancelText="Batal"
            disabled={deleteAnnouncement.isLoading}
            onConfirm={() => {
              if (!deleteAnnouncement.isLoading) {
                deleteAnnouncement.mutate({ id: deleteId })
              }
            }}
            onCancel={() => {
              if (!deleteAnnouncement.isLoading) {
                setShowDeleteDialog(false)
                // Clear deleteId after animation completes
                setTimeout(() => {
                  setDeleteId(null)
                }, 500)
              }
            }}
            danger={true}
          />
        )}
      </div>

    </>
  )
}

