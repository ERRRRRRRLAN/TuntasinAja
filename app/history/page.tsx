'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import { format, differenceInDays, addDays } from 'date-fns'
import { id } from 'date-fns/locale'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
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
    if (confirm('Apakah Anda yakin ingin menghapus history ini?')) {
      deleteHistory.mutate({ historyId })
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
                
                return (
                  <div key={history.id} className="history-item">
                    <div className="history-item-header">
                      <h3 className="history-item-title">{history.thread.title}</h3>
                      <div className="history-item-meta">
                        <span className="history-item-date">
                          ✅ Selesai: {format(new Date(history.completedDate), 'd MMMM yyyy', { locale: id })}
                        </span>
                        <span 
                          className="history-item-deletion"
                          style={{ 
                            color: deletionInfo.color,
                            fontWeight: deletionInfo.urgent ? 600 : 400
                          }}
                        >
                          ⏰ {deletionInfo.text}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteHistory(history.id)}
                      className="btn btn-danger"
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem'
                      }}
                      disabled={deleteHistory.isLoading}
                    >
                      {deleteHistory.isLoading ? 'Menghapus...' : '🗑️ Hapus History'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

