'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navLinks = [
    { href: '/', label: 'Tugas' },
    { href: '/history', label: 'History' },
    { href: '/profile', label: 'Profil' },
  ]

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/auth/signin'
      })
      // Force redirect to signin page
      router.push('/auth/signin')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      router.push('/auth/signin')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!session) return null

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo">
          📚 TuntasinAja
        </Link>
        <nav className="nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              style={{
                color: pathname === link.href ? 'var(--primary)' : 'var(--text-light)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <button 
            onClick={handleLogout} 
            className="btn-logout"
            disabled={isLoggingOut}
            style={{
              opacity: isLoggingOut ? 0.6 : 1,
              cursor: isLoggingOut ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </nav>
      </div>
    </header>
  )
}
