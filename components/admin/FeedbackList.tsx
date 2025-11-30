'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { TrashIcon, EyeIcon, EyeOffIcon, UserIcon, CalendarIcon, MessageIcon } from '@/components/ui/Icons'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toJakartaDate } from '@/lib/date-utils'

export default function FeedbackList() {
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all')
  
  const utils = trpc.useUtils()
  const { data: feedbacks, isLoading } = trpc.feedback.getAll.useQuery()
  const { data: unreadCount } = trpc.feedback.getUnreadCount.useQuery()

  const markAsRead = trpc.feedback.markAsRead.useMutation({
    onSuccess: () => {
      utils.feedback.getAll.invalidate()
      utils.feedback.getUnreadCount.invalidate()
      toast.success('Feedback ditandai sebagai sudah dibaca')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengubah status feedback')
    },
  })

  const markAsUnread = trpc.feedback.markAsUnread.useMutation({
    onSuccess: () => {
      utils.feedback.getAll.invalidate()
      utils.feedback.getUnreadCount.invalidate()
      toast.success('Feedback ditandai sebagai belum dibaca')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengubah status feedback')
    },
  })

  const deleteFeedback = trpc.feedback.delete.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(null)
      utils.feedback.getAll.invalidate()
      utils.feedback.getUnreadCount.invalidate()
      toast.success('Feedback berhasil dihapus')
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus feedback')
    },
  })

  const handleDelete = (id: string) => {
    deleteFeedback.mutate({ id })
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat feedback...</p>
      </div>
    )
  }

  // Filter feedbacks
  const filteredFeedbacks = feedbacks?.filter((feedback) => {
    if (filterRead === 'read') return feedback.isRead
    if (filterRead === 'unread') return !feedback.isRead
    return true
  }) || []

  return (
    <div>
      {/* Stats and Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
              Total Feedback
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              {feedbacks?.length || 0}
            </div>
          </div>
          
          <div style={{
            padding: '0.75rem 1rem',
            background: unreadCount && unreadCount.count > 0 ? 'var(--danger)' : 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            color: unreadCount && unreadCount.count > 0 ? 'white' : 'var(--text)'
          }}>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.9 }}>
              Belum Dibaca
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {unreadCount?.count || 0}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setFilterRead('all')}
            className={`btn ${filterRead === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.875rem' }}
          >
            Semua ({feedbacks?.length || 0})
          </button>
          <button
            onClick={() => setFilterRead('unread')}
            className={`btn ${filterRead === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.875rem' }}
          >
            Belum Dibaca ({feedbacks?.filter(f => !f.isRead).length || 0})
          </button>
          <button
            onClick={() => setFilterRead('read')}
            className={`btn ${filterRead === 'read' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.875rem' }}
          >
            Sudah Dibaca ({feedbacks?.filter(f => f.isRead).length || 0})
          </button>
        </div>
      </div>

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <MessageIcon size={48} style={{ color: 'var(--text-light)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-light)' }}>
            {filterRead === 'all' 
              ? 'Belum ada feedback yang masuk.'
              : filterRead === 'read'
              ? 'Tidak ada feedback yang sudah dibaca.'
              : 'Tidak ada feedback yang belum dibaca.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="card"
              style={{
                padding: '1.5rem',
                border: feedback.isRead ? '1px solid var(--border)' : '2px solid var(--primary)',
                background: feedback.isRead ? 'var(--card)' : 'var(--bg-secondary)',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                gap: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <UserIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text)'
                      }}>
                        {feedback.user.name}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-light)'
                      }}>
                        {feedback.user.email}
                        {feedback.user.kelas && (
                          <span style={{ marginLeft: '0.5rem' }}>
                            • {feedback.user.kelas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-light)'
                  }}>
                    <CalendarIcon size={14} />
                    <span>
                      {format(toJakartaDate(feedback.createdAt), 'EEEE, d MMM yyyy, HH:mm', { locale: id })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexShrink: 0
                }}>
                  {feedback.isRead ? (
                    <button
                      onClick={() => markAsUnread.mutate({ id: feedback.id })}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Tandai belum dibaca"
                    >
                      <EyeOffIcon size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => markAsRead.mutate({ id: feedback.id })}
                      className="btn btn-primary"
                      style={{
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Tandai sudah dibaca"
                    >
                      <EyeIcon size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteDialog(feedback.id)}
                    className="btn btn-danger"
                    style={{
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Hapus feedback"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{
                padding: '1rem',
                background: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.6',
                color: 'var(--text)'
              }}>
                {feedback.content}
              </div>

              {/* Unread Badge */}
              {!feedback.isRead && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  Baru
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog !== null}
        title="Hapus Feedback?"
        message="Apakah Anda yakin ingin menghapus feedback ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        danger={true}
        disabled={deleteFeedback.isLoading}
        onConfirm={() => {
          if (showDeleteDialog) {
            handleDelete(showDeleteDialog)
          }
        }}
        onCancel={() => setShowDeleteDialog(null)}
      />
    </div>
  )
}

