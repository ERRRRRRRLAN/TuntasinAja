'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { getIsRecoveringSession } from './SessionRefresher'
import LoadingSpinner from './ui/LoadingSpinner'

interface SessionGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

/**
 * SessionGuard Component
 * 
 * This component provides client-side session protection that works well
 * with app resume from background. It prevents premature redirects during
 * session recovery.
 */
export default function SessionGuard({ children, requireAuth = true }: SessionGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [hasSessionCookie, setHasSessionCookie] = useState(true) // Optimistic - assume true
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [recoveryAttempts, setRecoveryAttempts] = useState(0)

  // Check if session cookie exists
  const checkSessionCookie = useCallback(() => {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const hasCookie = cookies.some(cookie => {
        const trimmed = cookie.trim()
        return trimmed.startsWith('next-auth.session-token=') || 
               trimmed.startsWith('__Secure-next-auth.session-token=')
      })
      return hasCookie
    }
    return false
  }, [])

  // Initial cookie check
  useEffect(() => {
    const hasCookie = checkSessionCookie()
    setHasSessionCookie(hasCookie)
    
    // If we have a cookie, wait a bit for session to load
    if (hasCookie && status === 'loading') {
      setIsCheckingSession(true)
    } else if (!hasCookie && status === 'unauthenticated') {
      // No cookie and not authenticated - definitely need to redirect
      setIsCheckingSession(false)
    }
  }, [checkSessionCookie, status])

  // Periodic cookie check
  useEffect(() => {
    const checkAndUpdate = () => {
      const hasCookie = checkSessionCookie()
      setHasSessionCookie(hasCookie)
    }

    // Check every second
    const interval = setInterval(checkAndUpdate, 1000)
    return () => clearInterval(interval)
  }, [checkSessionCookie])

  // Handle session status changes
  useEffect(() => {
    const isRecovering = getIsRecoveringSession()
    
    console.log('[SessionGuard] Status check:', {
      status,
      hasSession: !!session,
      hasSessionCookie,
      isRecovering,
      pathname,
      recoveryAttempts
    })

    // Session is authenticated - all good
    if (status === 'authenticated' && session) {
      setIsCheckingSession(false)
      return
    }

    // Still loading - wait
    if (status === 'loading') {
      setIsCheckingSession(true)
      return
    }

    // Status is unauthenticated
    if (status === 'unauthenticated') {
      // If we're in recovery mode, wait longer
      if (isRecovering) {
        console.log('[SessionGuard] ⏳ Session is recovering, waiting...')
        setIsCheckingSession(true)
        return
      }

      // If we have a cookie but session says unauthenticated, 
      // it might be a temporary state - wait a bit and retry
      if (hasSessionCookie && recoveryAttempts < 3) {
        console.log('[SessionGuard] ⏳ Have cookie but unauthenticated, retrying...', {
          attempt: recoveryAttempts + 1
        })
        setIsCheckingSession(true)
        
        // Wait and check again
        const timer = setTimeout(() => {
          setRecoveryAttempts(prev => prev + 1)
        }, 1000)
        
        return () => clearTimeout(timer)
      }

      // No cookie or exhausted retries - redirect
      if (!hasSessionCookie || recoveryAttempts >= 3) {
        console.log('[SessionGuard] 🔀 No valid session, redirecting to login')
        setIsCheckingSession(false)
        
        // Only redirect if not already on signin page
        if (pathname !== '/auth/signin' && requireAuth) {
          router.push('/auth/signin')
        }
      }
    }
  }, [status, session, hasSessionCookie, pathname, router, recoveryAttempts, requireAuth])

  // Reset recovery attempts when session is restored
  useEffect(() => {
    if (status === 'authenticated') {
      setRecoveryAttempts(0)
    }
  }, [status])

  // Show loading during session check
  if (isCheckingSession && status === 'loading') {
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
          Memuat sesi...
        </p>
      </div>
    )
  }

  // Show loading during recovery
  if (isCheckingSession && getIsRecoveringSession()) {
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
          Memulihkan sesi...
        </p>
      </div>
    )
  }

  // If unauthenticated and no cookie (after checks), show loading while redirecting
  if (status === 'unauthenticated' && !hasSessionCookie && requireAuth) {
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

  // Render children if authenticated or has cookie (waiting for session)
  return <>{children}</>
}

