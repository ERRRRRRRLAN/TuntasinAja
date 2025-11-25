'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/layout/Header'
import ScheduleViewer from '@/components/schedule/ScheduleViewer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SchedulePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="container">
            <div style={{ 
              minHeight: 'calc(100vh - 4rem)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <LoadingSpinner size={32} />
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h2>Jadwal Pelajaran</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Lihat jadwal pelajaran kelas Anda
            </p>
          </div>

          <ScheduleViewer />
        </div>
      </main>
    </>
  )
}

