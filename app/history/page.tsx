'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import { format, differenceInDays, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { CheckIcon, ClockIcon, TrashIcon } from '@/components/ui/Icons'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null)
  
  const { data: histories, isLoading } = trpc.history.getUserHistory.useQuery(undefined, {
    refetchInterval: 5000, // Auto refresh every 5 seconds
    enabled: !!session, // Only fetch if session exists
  })

  // Redirect jika belum login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const utils = trpc.useUtils()

  const deleteHistory = trpc.history.deleteHistory.useMutation({
    onSuccess: () => {
      utils.history.getUserHistory.invalidate()
      setDeleteHistoryId(null)
    },
  })

  const getDeletionInfo = (completedDate: Date) => {
    const deletionDate = addDays(new Date(completedDate), 30)
    const daysRemaining = differenceInDays(deletionDate, new Date())
    
    if (daysRemaining <= 0) {
      return {
        text: 'Akan terhapus hari ini',
        color: 'var(--danger)',
        urgent: true
      }
    } else if (daysRemaining === 1) {
      return {
        text: 'Akan terhapus besok',
        color: 'var(--danger)',
        urgent: true
      }
    } else if (daysRemaining <= 7) {
      return {
        text: `Akan terhapus dalam ${daysRemaining} hari`,
        color: '#f59e0b', // Orange
        urgent: true
      }
    } else {
      return {
        text: `Akan terhapus dalam ${daysRemaining} hari (${format(deletionDate, 'd MMMM yyyy', { locale: id })})`,
        color: 'var(--text-light)',
        urgent: false
      }
    }
  }

  const handleDeleteHistory = (historyId: string) => {
    setDeleteHistoryId(historyId)
  }

  const handleConfirmDelete = () => {
    if (deleteHistoryId) {
      deleteHistory.mutate({ historyId: deleteHistoryId })
    }
  }

  // Show loading jika sedang check session
  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>Memuat...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Don't render jika belum login (will redirect)
  if (status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h2>History Tugas Selesai</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              History akan otomatis terhapus setelah 30 hari
            </p>
          </div>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>Memuat history...</p>
            </div>
          ) : !histories || histories.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>
                Belum ada tugas yang selesai.
              </p>
            </div>
          ) : (
            <div className="history-container">
              {histories.map((history) => {
                const deletionInfo = getDeletionInfo(new Date(history.completedDate))
                // Handle case where thread might be null (deleted) but we have denormalized data
                const threadTitle = history.thread?.title || (history as any).threadTitle || 'Tugas yang sudah dihapus'
                const threadAuthor = history.thread?.author || ((history as any).threadAuthorName ? {
                  id: (history as any).threadAuthorId || '',
                  name: (history as any).threadAuthorName || 'Unknown'
                } : null)
                
                return (
                  <div key={history.id} className="history-item">
                    <div className="history-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                      <h3 className="history-item-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, flex: 1 }}>{threadTitle}</h3>
                      <div className="history-item-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <span className="history-item-date" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <CheckIcon size={14} />
                          Selesai: {format(new Date(history.completedDate), 'd MMMM yyyy', { locale: id })}
                        </span>
                        <span 
                          className="history-item-deletion"
                          style={{ 
                            color: deletionInfo.color,
                            fontWeight: deletionInfo.urgent ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}
                        >
                          <ClockIcon size={14} />
                          {deletionInfo.text}
                        </span>
                      </div>
                    </div>
                    <div className="history-item-actions" style={{ marginTop: '1rem' }}>
                      <button
                        onClick={() => handleDeleteHistory(history.id)}
                        className="btn btn-danger"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem'
                        }}
                        disabled={deleteHistory.isLoading}
                      >
                      {deleteHistory.isLoading ? 'Menghapus...' : (
                        <>
                          <TrashIcon size={16} style={{ marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} />
                          Hapus History
                        </>
                      )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={deleteHistoryId !== null}
        title="Hapus History?"
        message="Apakah Anda yakin ingin menghapus history ini? Tindakan ini tidak dapat dibatalkan."
        confirmText={deleteHistory.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        danger={true}
        disabled={deleteHistory.isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteHistory.isLoading) {
            setDeleteHistoryId(null)
          }
        }}
      />
    </>
  )
}

