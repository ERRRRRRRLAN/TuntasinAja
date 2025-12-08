'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import FeedPage from '@/components/pages/FeedPage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getIsRecoveringSession } from '@/components/SessionRefresher'

/**
 * Home Page - Main entry point
 * 
 * This page uses client-side session management to handle:
 * 1. Initial session loading
 * 2. Session recovery after app resumes from background
 * 3. Proper redirect to login only when truly unauthenticated
 */
export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasSessionCookie, setHasSessionCookie] = useState(true) // Optimistic
  const [shouldRender, setShouldRender] = useState(false)
  const [checkCount, setCheckCount] = useState(0)

  // Check if session cookie exists
  const checkSessionCookie = useCallback(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      return cookies.some(cookie => {
        const trimmed = cookie.trim()
        return trimmed.startsWith('next-auth.session-token=') || 
               trimmed.startsWith('__Secure-next-auth.session-token=')
      })
    }
    return false
  }, [])

  // Initial and periodic cookie check
  useEffect(() => {
    const check = () => {
      const hasCookie = checkSessionCookie()
      setHasSessionCookie(hasCookie)
    }

    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [checkSessionCookie])

  // Main session check logic
  useEffect(() => {
    const isRecovering = getIsRecoveringSession()
    
    console.log('[HomePage] Session check:', {
      status,
      hasSession: !!session,
      userId: session?.user?.id,
      hasSessionCookie,
      isRecovering,
      checkCount
    })

    // Session is authenticated - render the page
    if (status === 'authenticated' && session) {
      setShouldRender(true)
      return
    }

    // Still loading - show loading state
    if (status === 'loading') {
      setShouldRender(false)
      return
    }

    // Session recovery in progress - wait
    if (isRecovering) {
      console.log('[HomePage] ⏳ Session recovery in progress, waiting...')
      setShouldRender(false)
      return
    }

    // Unauthenticated but has cookie - might be recovering
    if (status === 'unauthenticated' && hasSessionCookie) {
      // Give it a few more attempts
      if (checkCount < 5) {
        console.log('[HomePage] ⏳ Have cookie but unauthenticated, waiting...', { checkCount })
        setShouldRender(false)
        
        const timer = setTimeout(() => {
          setCheckCount(prev => prev + 1)
        }, 500)
        
        return () => clearTimeout(timer)
      }
    }

    // Definitely unauthenticated - redirect to login
    if (status === 'unauthenticated' && (!hasSessionCookie || checkCount >= 5)) {
      console.log('[HomePage] 🔀 Not authenticated, redirecting to login')
      router.push('/auth/signin')
      return
    }
  }, [status, session, hasSessionCookie, checkCount, router])

  // Reset check count when session is restored
  useEffect(() => {
    if (status === 'authenticated') {
      setCheckCount(0)
    }
  }, [status])

  // Show loading during session check
  if (status === 'loading' || getIsRecoveringSession()) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'var(--bg-primary)',
      }}>
        <LoadingSpinner size={40} />
        <p style={{ 
          color: 'var(--text-light)', 
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          {getIsRecoveringSession() ? 'Memulihkan sesi...' : 'Memuat...'}
        </p>
      </div>
    )
  }

  // Show loading while waiting for cookie to be validated
  if (!shouldRender && hasSessionCookie && status === 'unauthenticated' && checkCount < 5) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'var(--bg-primary)',
      }}>
        <LoadingSpinner size={40} />
        <p style={{ 
          color: 'var(--text-light)', 
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          Memverifikasi sesi...
        </p>
      </div>
    )
  }

  // Show loading while redirecting to login
  if (!shouldRender && !hasSessionCookie && status === 'unauthenticated') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        background: 'var(--bg-primary)',
      }}>
        <LoadingSpinner size={40} />
        <p style={{ 
          color: 'var(--text-light)', 
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          Mengalihkan ke halaman login...
        </p>
      </div>
    )
  }

  // Render feed page if authenticated
  if (shouldRender || (session && status === 'authenticated')) {
    return <FeedPage />
  }

  // Fallback loading state
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'var(--bg-primary)',
    }}>
      <LoadingSpinner size={40} />
      <p style={{ 
        color: 'var(--text-light)', 
        marginTop: '1rem',
        fontSize: '0.875rem'
      }}>
        Memuat...
      </p>
    </div>
  )
}
