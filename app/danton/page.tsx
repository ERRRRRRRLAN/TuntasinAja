'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DantonDashboard from '@/components/danton/DantonDashboard'
import Layout from '@/components/layout/Layout'
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
    <Layout>
      <div className="container">
        <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>
          Dashboard Danton
        </h1>
        <DantonDashboard />
      </div>
    </Layout>
  )
}

