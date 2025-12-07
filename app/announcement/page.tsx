'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AnnouncementPage from '@/components/pages/AnnouncementPage'

export default function AnnouncementPageRoute() {
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
        <AnnouncementPage />
      </div>
    </Layout>
  )
}

