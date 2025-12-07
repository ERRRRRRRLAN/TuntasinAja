'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const { data: session, status: sessionStatus } = useSession()
  const pathname = usePathname()
  const [hasSessionCookie, setHasSessionCookie] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // Check if session cookie exists (even if session data not loaded yet)
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
    
    // Check periodically in case cookie is restored
    const interval = setInterval(checkSessionCookie, 1000)
    return () => clearInterval(interval)
  }, [])


  // Only hide if session is definitely not authenticated AND no cookie exists
  // Keep showing header if cookie exists (session might be loading)
  if (sessionStatus === 'unauthenticated' && !hasSessionCookie) {
    return null
  }

  // Show header if:
  // 1. We have a session, OR
  // 2. Session is loading (might be refreshing), OR
  // 3. Session cookie exists (session might be restored)
  if (session || sessionStatus === 'loading' || hasSessionCookie) {
    // Show header - session exists or is being loaded
  } else {
    // No session, not loading, and no cookie - user is logged out
    return null
  }

  return (
    <header className="header" ref={headerRef}>
      <div className="header-content">
        <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/logo.svg" 
            alt="TuntasinAja Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              flexShrink: 0,
              objectFit: 'contain'
            }} 
          />
          <span>TuntasinAja</span>
        </Link>
        
      </div>
    </header>
  )
}
