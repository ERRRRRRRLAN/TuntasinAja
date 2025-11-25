'use client'

import { format, differenceInHours, differenceInDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import { UserIcon, CalendarIcon, ClockIcon, CheckIcon, XCloseIcon } from '@/components/ui/Icons'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useState } from 'react'

interface AnnouncementRequestCardProps {
  request: {
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
  }
}

export default function AnnouncementRequestCard({ request }: AnnouncementRequestCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const utils = trpc.useUtils()

  const approveRequest = trpc.announcement.approveRequest.useMutation({
    onSuccess: () => {
      toast.success('Request announcement disetujui')
      utils.announcement.getRequests.invalidate()
      utils.announcement.getRequestCount.invalidate()
      utils.announcement.getAll.invalidate()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyetujui request')
    },
  })

  const rejectRequest = trpc.announcement.rejectRequest.useMutation({
    onSuccess: () => {
      toast.success('Request announcement ditolak')
      utils.announcement.getRequests.invalidate()
      utils.announcement.getRequestCount.invalidate()
      setShowRejectDialog(false)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menolak request')
      setShowRejectDialog(false)
    },
  })

  const expiresAt = new Date(request.expiresAt)
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
      <div className="card subscription-fade-in announcement-request-card" style={{ 
        border: '1px solid var(--border)',
        padding: '1.25rem'
      }}>
        {/* Header */}
        <div style={{ 
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
              {request.title}
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
                {request.author.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CalendarIcon size={14} style={{ color: 'var(--text-light)' }} />
                {format(new Date(request.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
              </span>
            </div>
          </div>
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
          {request.content}
        </div>

        {/* Footer - Expires info */}
        <div style={{ 
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          marginBottom: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ClockIcon size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            <span>Berlaku hingga: {format(expiresAt, 'd MMM yyyy, HH:mm', { locale: id })} ({expiresText})</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          flexDirection: 'column'
        }}>
          <button
            onClick={() => approveRequest.mutate({ announcementId: request.id })}
            disabled={approveRequest.isLoading || rejectRequest.isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0.625rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckIcon size={18} />
            Setujui
          </button>
          <button
            onClick={() => setShowRejectDialog(true)}
            disabled={approveRequest.isLoading || rejectRequest.isLoading}
            className="btn"
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0.625rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'var(--bg-secondary)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            <XCloseIcon size={18} />
            Tolak
          </button>
        </div>
      </div>

      {/* Reject Confirmation */}
      <ConfirmDialog
        isOpen={showRejectDialog}
        title="Tolak Request?"
        message={`Apakah Anda yakin ingin menolak request announcement "${request.title}" dari ${request.author.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={rejectRequest.isLoading ? 'Menolak...' : 'Ya, Tolak'}
        cancelText="Batal"
        disabled={rejectRequest.isLoading}
        onConfirm={() => {
          if (!rejectRequest.isLoading) {
            rejectRequest.mutate({ announcementId: request.id })
          }
        }}
        onCancel={() => {
          if (!rejectRequest.isLoading) {
            setShowRejectDialog(false)
          }
        }}
      />
    </>
  )
}

