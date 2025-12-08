'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AnnouncementPage from '@/components/pages/AnnouncementPage'

export default function AnnouncementPageRoute() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasSessionCookie, setHasSessionCookie] = useState(true) // Assume true initially

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

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  // Keep showing content if cookie exists (session might be refreshing)
  if (!session && !hasSessionCookie) {
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

