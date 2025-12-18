'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { 
  BookIcon, 
  ClockIcon, 
  CalendarIcon, 
  BellIcon, 
  CrownIcon, 
  UserIcon, 
  LogOutIcon,
  DownloadIcon
} from '@/components/ui/Icons'
import { useSession, signOut } from 'next-auth/react'
import { useDanton } from '@/hooks/useDanton'
import { trpc } from '@/lib/trpc'
import { Capacitor } from '@capacitor/core'
import { useQueryClient } from '@tanstack/react-query'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { isDanton } = useDanton()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        overlayRef.current &&
        overlayRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    setIsOpen(false)
    
    try {
      queryClient.clear()
      
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
      }
      
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (apiError) {
        console.error('Logout API error:', apiError)
      }
      
      await signOut({
        redirect: false,
        callbackUrl: '/auth/signin',
      })
      
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(";")
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i]
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Logout error:', error)
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin'
      }
    }
  }

  const mainNavItems: NavItem[] = [
    { href: '/', label: 'Tugas', icon: <BookIcon size={20} /> },
    { href: '/history', label: 'History', icon: <ClockIcon size={20} /> },
    { href: '/schedule', label: 'Jadwal', icon: <CalendarIcon size={20} /> },
    { href: '/announcement', label: 'Pengumuman', icon: <BellIcon size={20} /> },
    { href: '/settings', label: 'Me', icon: <UserIcon size={20} /> },
  ]

  const additionalNavItems: NavItem[] = [
    // Danton and Admin items moved to user section below
  ]

  const allNavItems = [...mainNavItems, ...additionalNavItems]

  return (
    <>
      {/* Sidebar Toggle Button (Desktop - Hamburger Menu) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sidebar-toggle"
        style={{
          display: 'none', // Hidden by default, shown via CSS on desktop
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 101,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-secondary)'
          e.currentTarget.style.borderColor = 'var(--primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--card)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
        aria-label="Toggle sidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--text)' }}
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay (Mobile only) */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          background: 'var(--card)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          transition: 'transform 0.3s ease-out',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--primary)',
              margin: 0,
            }}
          >
            TuntasinAja
          </h2>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0',
            overflowY: 'auto',
          }}
        >
          {allNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text)',
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s',
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
                  }}
                >
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        {session && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '0.25rem',
                }}
              >
                {session.user.name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-light)',
                }}
              >
                {session.user.email}
              </div>
            </div>

            {/* Danton Dashboard / Admin Panel / Profil (conditional) */}
            {isDanton && (
              <Link
                href="/danton"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  borderRadius: '0.5rem',
                  transition: 'background 0.2s',
                  marginBottom: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <CrownIcon size={18} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.875rem' }}>Danton Dashboard</span>
              </Link>
            )}
            {isAdmin && !isDanton && (
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  borderRadius: '0.5rem',
                  transition: 'background 0.2s',
                  marginBottom: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <CrownIcon size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.875rem' }}>Admin Panel</span>
              </Link>
            )}
            {/* Regular users: no profile button */}

            {!Capacitor.isNativePlatform() && (
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault()
                  
                  try {
                    // Always use production URL to ensure latest version
                    const baseUrl = 'https://tuntasinaja-livid.vercel.app'
                    const apkUrl = `${baseUrl}/TuntasinAja.apk?v=${Date.now()}&nocache=1`
                    
                    console.log('[Sidebar] Starting APK download from:', apkUrl)
                    
                    // Use fetch to download and create blob
                    const response = await fetch(apkUrl, {
                      method: 'GET',
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                      },
                    })
                    
                    if (!response.ok) {
                      throw new Error(`Failed to download: ${response.status}`)
                    }
                    
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'TuntasinAja.apk'
                    link.style.display = 'none'
                    
                    document.body.appendChild(link)
                    link.click()
                    
                    setTimeout(() => {
                      window.URL.revokeObjectURL(url)
                      if (document.body.contains(link)) {
                        document.body.removeChild(link)
                      }
                    }, 100)
                    
                    console.log('[Sidebar] APK download completed')
                  } catch (error) {
                    console.error('[Sidebar] Error downloading APK:', error)
                    // Fallback: direct link
                    window.open('https://tuntasinaja-livid.vercel.app/TuntasinAja.apk', '_blank')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  borderRadius: '0.5rem',
                  transition: 'background 0.2s',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <DownloadIcon size={18} />
                <span style={{ fontSize: '0.875rem' }}>Download APK</span>
              </a>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid var(--danger)',
                borderRadius: '0.5rem',
                color: 'var(--danger)',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isLoggingOut ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.background = 'var(--danger)'
                  e.currentTarget.style.color = 'white'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--danger)'
                }
              }}
            >
              <LogOutIcon size={18} />
              <span style={{ fontSize: '0.875rem' }}>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

