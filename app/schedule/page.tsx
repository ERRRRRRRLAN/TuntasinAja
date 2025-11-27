<<<<<<< HEAD
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
=======
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import Header from '@/components/layout/Header'
import WeeklyScheduleViewer from '@/components/schedule/WeeklyScheduleViewer'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      redirect('/auth/signin')
    }

>>>>>>> 1dac9a9394949390aa486672e06bf372bec80955
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="container">
<<<<<<< HEAD
            <div style={{ 
              minHeight: 'calc(100vh - 4rem)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <LoadingSpinner size={32} />
            </div>
=======
            <WeeklyScheduleViewer />
>>>>>>> 1dac9a9394949390aa486672e06bf372bec80955
          </div>
        </main>
      </>
    )
<<<<<<< HEAD
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
=======
  } catch (error: any) {
    // NEXT_REDIRECT is not a real error, it's how Next.js handles redirects
    // Don't log redirect errors
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error // Re-throw redirect to let Next.js handle it
    }
    // Only log actual errors
    console.error('Error getting session:', error)
    redirect('/auth/signin')
  }
>>>>>>> 1dac9a9394949390aa486672e06bf372bec80955
}

