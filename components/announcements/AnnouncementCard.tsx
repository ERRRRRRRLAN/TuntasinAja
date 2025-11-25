'use client'

import { format, differenceInHours, differenceInDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, ClockIcon, TrashIcon, EditIcon, XCloseIcon } from '@/components/ui/Icons'
import { useDanton } from '@/hooks/useDanton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useState } from 'react'
import CreateAnnouncementForm from './CreateAnnouncementForm'

interface AnnouncementCardProps {
  announcement: {
    id: string
    title: string
    content: string
    author: {
      id: string
      name: string
      email: string
    }
    expiresAt: Date
    createdAt: Date
    kelas: string
  }
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const { data: session } = useSession()
  const { isDanton, kelas: dantonKelas } = useDanton()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const utils = trpc.useUtils()

  const isAuthor = session?.user?.id === announcement.author.id
  const isDantonOfSameClass = isDanton && dantonKelas === announcement.kelas

  const canEdit = isAuthor || isDantonOfSameClass
  const canDelete = isAuthor || isDantonOfSameClass

  const deleteAnnouncement = trpc.announcement.delete.useMutation({
    onSuccess: () => {
      toast.success('Announcement berhasil dihapus')
      utils.announcement.getAll.invalidate()
      setShowDeleteDialog(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus announcement')
      setShowDeleteDialog(false)
    },
  })

  const expiresAt = new Date(announcement.expiresAt)
  const now = new Date()
  const hoursRemaining = differenceInHours(expiresAt, now)
  const daysRemaining = differenceInDays(expiresAt, now)

  let expiresText = ''
  if (daysRemaining > 0) {
    expiresText = `${daysRemaining} hari lagi`
  } else if (hoursRemaining > 0) {
    expiresText = `${hoursRemaining} jam lagi`
  } else {
    expiresText = 'Akan segera terhapus'
  }

  return (
    <>
      <div className="card subscription-fade-in announcement-card" style={{ 
        border: '1px solid var(--border)',
        padding: '1.25rem'
      }}>
        {/* Header */}
        <div className="announcement-card-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '1rem',
          gap: '0.75rem'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '1.125rem', 
              fontWeight: 600,
              wordBreak: 'break-word'
            }}>
              {announcement.title}
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              flexWrap: 'wrap',
              fontSize: '0.875rem',
              color: 'var(--text-light)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <UserIcon size={14} style={{ color: 'var(--text-light)' }} />
                {announcement.author.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CalendarIcon size={14} style={{ color: 'var(--text-light)' }} />
                {format(new Date(announcement.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
              </span>
            </div>
          </div>

          {(canEdit || canDelete) && (
            <div className="announcement-actions" style={{ 
              display: 'flex', 
              gap: '0.5rem',
              flexShrink: 0
            }}>
              {canEdit && (
                <button
                  onClick={() => setShowEditForm(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    padding: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    minHeight: '32px',
                    color: 'var(--text-light)',
                  }}
                  title="Edit"
                >
                  <EditIcon size={16} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    padding: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    minHeight: '32px',
                    color: 'var(--text-light)',
                  }}
                  title="Hapus"
                >
                  <TrashIcon size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ 
          marginBottom: '1rem',
          fontSize: '0.9375rem',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {announcement.content}
        </div>

        {/* Footer - Expires info */}
        <div style={{ 
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-light)'
        }}>
          <ClockIcon size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <span>Berlaku hingga: {format(expiresAt, 'd MMM yyyy, HH:mm', { locale: id })} ({expiresText})</span>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <CreateAnnouncementForm
          announcementId={announcement.id}
          initialData={{
            title: announcement.title,
            content: announcement.content,
            expiresAt: expiresAt,
          }}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false)
            utils.announcement.getAll.invalidate()
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus Announcement?"
        message={`Apakah Anda yakin ingin menghapus announcement "${announcement.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={deleteAnnouncement.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        disabled={deleteAnnouncement.isLoading}
        onConfirm={() => {
          if (!deleteAnnouncement.isLoading) {
            deleteAnnouncement.mutate({ announcementId: announcement.id })
          }
        }}
        onCancel={() => {
          if (!deleteAnnouncement.isLoading) {
            setShowDeleteDialog(false)
          }
        }}
      />
    </>
  )
}

