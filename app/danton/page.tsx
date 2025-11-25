'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DantonDashboard from '@/components/danton/DantonDashboard'
import Header from '@/components/layout/Header'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DantonPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <Header />
      <main style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>
          Dashboard Danton
        </h1>
        <DantonDashboard />
      </main>
    </>
  )
}

