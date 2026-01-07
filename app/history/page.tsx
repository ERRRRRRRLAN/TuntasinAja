'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Layout from '@/components/layout/Layout'
import { format, differenceInDays, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { toJakartaDate } from '@/lib/date-utils'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { CheckIcon, ClockIcon, TrashIcon, RotateCcwIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null)
  const [recoverHistoryId, setRecoverHistoryId] = useState<string | null>(null)
  const [hasSessionCookie, setHasSessionCookie] = useState(true) // Assume true initially
  
  const { data: histories, isLoading, error: historyError } = trpc.history.getUserHistory.useQuery(undefined, {
    refetchInterval: (query) => {
      // Stop polling jika tab tidak aktif (hidden)
      if (typeof document !== 'undefined' && document.hidden) {
        return false
      }
      return 60000 // 60 seconds - less frequent to prevent flickering
    },
    refetchOnWindowFocus: false, // Disable to prevent flickering
    enabled: !!session, // Only fetch if session exists
    onError: (error) => {
      console.error('[HistoryPage] Error fetching history:', error)
    },
  })

  // Check if session cookie exists
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
    const interval = setInterval(checkSessionCookie, 1000)
    return () => clearInterval(interval)
  }, [])

  // Redirect jika belum login - only if no cookie exists
  useEffect(() => {
    if (status === 'unauthenticated' && !hasSessionCookie) {
      router.push('/auth/signin')
    }
  }, [status, hasSessionCookie, router])

  const utils = trpc.useUtils()

  const deleteHistory = trpc.history.deleteHistory.useMutation({
    onSuccess: () => {
      utils.history.getUserHistory.invalidate()
      utils.thread.getAll.invalidate()
      utils.userStatus.getThreadStatuses.invalidate()
      setDeleteHistoryId(null)
    },
  })

  const recoverHistory = trpc.history.recoverHistory.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch to update feed
      await Promise.all([
        utils.history.getUserHistory.invalidate(),
        utils.thread.getAll.invalidate(),
        utils.userStatus.getThreadStatuses.invalidate(),
        utils.userStatus.getUncompletedCount.invalidate(),
        utils.userStatus.getOverdueTasks.invalidate(),
      ])
      await Promise.all([
        utils.history.getUserHistory.refetch(),
        utils.thread.getAll.refetch(),
      ])
      setRecoverHistoryId(null)
    },
    onError: (error) => {
      console.error('Error recovering history:', error)
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
      <Layout>
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)' }}>Memuat...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Don't render jika belum login (will redirect) - but keep showing if cookie exists
  if ((status === 'unauthenticated' && !hasSessionCookie) || (!session && !hasSessionCookie)) {
    return null
  }

  return (
    <Layout>
      <div className="container">
          <div className="page-header">
            <h2>History Tugas Selesai</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              History akan otomatis terhapus setelah 30 hari
            </p>
          </div>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <LoadingSpinner size={32} />
              <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat history...</p>
            </div>
          ) : historyError ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', border: '1px solid var(--danger)' }}>
              <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>Error memuat history</p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {historyError.message || 'Terjadi kesalahan saat memuat data'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Muat Ulang
              </button>
            </div>
          ) : !histories || histories.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<CheckIcon size={64} />}
                title="Belum ada tugas yang selesai"
                description="Tugas yang sudah Anda selesaikan akan muncul di sini. Yuk, selesaikan tugas pertama Anda!"
                variant="success"
              />
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
                
                // Check if thread still exists in database (from server flag)
                const threadExists = (history as any).threadExists === true
                
                return (
                  <div key={history.id} className="history-item">
                    <div className="history-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                      <h3 className="history-item-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, flex: 1 }}>{threadTitle}</h3>
                      <div className="history-item-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <span className="history-item-date" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <CheckIcon size={14} />
                          Selesai: {format(toJakartaDate(history.completedDate), 'd MMMM yyyy', { locale: id })}
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
                    <div className="history-item-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setRecoverHistoryId(history.id)}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          opacity: threadExists ? 1 : 0.5,
                          cursor: threadExists ? 'pointer' : 'not-allowed',
                          backgroundColor: threadExists ? undefined : 'var(--bg-secondary)',
                          color: threadExists ? undefined : 'var(--text-light)',
                        }}
                        disabled={recoverHistory.isLoading || !threadExists}
                        title={!threadExists ? 'Thread sudah tidak ada' : 'Kembalikan tugas ke feed'}
                      >
                        {recoverHistory.isLoading && recoverHistoryId === history.id ? 'Memulihkan...' : (
                          <>
                            <RotateCcwIcon size={16} style={{ marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} />
                            Recovery
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(history.id)}
                        className="btn btn-danger"
                        style={{
                          flex: 1,
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

        <ConfirmDialog
          isOpen={recoverHistoryId !== null}
          title="Recovery Tugas?"
          message="Apakah Anda yakin ingin mengembalikan tugas ini ke feed? Tugas akan kembali muncul di feed dan history akan dihapus."
          confirmText={recoverHistory.isLoading ? 'Memulihkan...' : 'Ya, Recovery'}
          cancelText="Batal"
          disabled={recoverHistory.isLoading}
          onConfirm={() => {
            if (recoverHistoryId) {
              recoverHistory.mutate({ historyId: recoverHistoryId })
            }
          }}
          onCancel={() => {
            if (!recoverHistory.isLoading) {
              setRecoverHistoryId(null)
            }
          }}
        />
      </Layout>
  )
}

