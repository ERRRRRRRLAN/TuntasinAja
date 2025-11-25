'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAnnouncementRequests } from '@/hooks/useAnnouncementRequests'
import AnnouncementRequestCard from '@/components/announcements/AnnouncementRequestCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useDanton } from '@/hooks/useDanton'
import { AlertTriangleIcon } from '@/components/ui/Icons'

export default function AnnouncementRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isDanton } = useDanton()
  const { requests, isLoading } = useAnnouncementRequests()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && !isDanton) {
      router.push('/')
    }
  }, [status, isDanton, router])

  if (status === 'loading' || isDanton === undefined) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  if (!session || !isDanton) {
    return null
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '1.5rem 1rem',
      minHeight: 'calc(100vh - 4rem)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.75rem', 
          fontWeight: 600 
        }}>
          Request Pengumuman
        </h1>
        <p style={{ 
          margin: 0, 
          color: 'var(--text-light)', 
          fontSize: '0.9375rem' 
        }}>
          Kelola request pengumuman dari siswa di kelas Anda
        </p>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner size={32} />
          <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
            Memuat request...
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertTriangleIcon size={48} style={{ color: 'var(--text-light)', opacity: 0.5 }} />
          <div>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-primary)', 
              fontWeight: 500,
              marginBottom: '0.25rem'
            }}>
              Tidak ada request
            </p>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-light)', 
              fontSize: '0.875rem'
            }}>
              Belum ada request pengumuman dari siswa di kelas Anda.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((request: any) => (
            <AnnouncementRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}

