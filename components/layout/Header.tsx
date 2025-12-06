'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { BookIcon, UserIcon, LogOutIcon, CrownIcon, DownloadIcon } from '@/components/ui/Icons'
import { trpc } from '@/lib/trpc'
import { useDanton } from '@/hooks/useDanton'
import { Capacitor } from '@capacitor/core'
import { useQueryClient } from '@tanstack/react-query'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [shouldRenderProfile, setShouldRenderProfile] = useState(false)
  const [isProfileAnimating, setIsProfileAnimating] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(64)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const profileContentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  // Check if user is danton
  const { isDanton } = useDanton()

  const navLinks = [
    { href: '/', label: 'Tugas' },
    { href: '/history', label: 'History' },
    { href: '/schedule', label: 'Jadwal' },
    { href: '/announcement', label: 'Pengumuman' },
    ...(isDanton ? [{ href: '/danton', label: 'Danton' }] : []),
  ]

  // Calculate header height for mobile menu positioning
  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight
      setHeaderHeight(height)
    }
  }, [session])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isMobileMenuOpen && !target.closest('.header') && !target.closest('.mobile-menu')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Handle profile dropdown render and animation state
  useEffect(() => {
    if (isProfileDropdownOpen) {
      // Start rendering
      setShouldRenderProfile(true)
      setIsProfileAnimating(false)
      // Small delay to ensure DOM is ready before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsProfileAnimating(true)
        })
      })
    } else {
      // Start closing animation
      setIsProfileAnimating(false)
      // Wait for transition to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRenderProfile(false)
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isProfileDropdownOpen])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!isProfileDropdownOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const utils = trpc.useUtils() // Move to top level

  const handleLogout = async (e?: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (isLoggingOut) return // Prevent multiple clicks
    
    setIsLoggingOut(true)
    setIsProfileDropdownOpen(false)
    
    // Clear all caches immediately
    queryClient.clear()
    utils.invalidate()
    
    // Clear all storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      
      // Clear all cookies manually (including NextAuth cookies)
      const cookies = document.cookie.split(";")
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        // Clear cookie for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        // Also try to clear for parent domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      }
    }
    
    // Sign out from NextAuth (fire and forget - don't wait)
    signOut({
      redirect: false,
      callbackUrl: '/auth/signin',
    }).catch((err) => {
      console.error('SignOut error:', err)
    })
    
    // Force immediate redirect - don't wait for anything
    // This ensures logout happens immediately
    if (typeof window !== 'undefined') {
      // Use replace to prevent back button from going back to logged-in state
      window.location.replace('/auth/signin')
    }
  }

  const handleAdminPanel = () => {
    setIsProfileDropdownOpen(false)
    router.push('/profile')
  }

  const handleDantonPanel = () => {
    setIsProfileDropdownOpen(false)
    router.push('/danton')
  }

  if (!session) return null

  return (
    <header className="header" ref={headerRef}>
      <div className="header-content">
        <Link href="/" className="logo" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        
        {/* Right side: Navigation + Profile */}
        <div className="header-right-container" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Desktop Navigation */}
          <nav className="nav nav-desktop">
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
          </nav>

          {/* Profile Dropdown */}
          {session && (
            <div
              ref={profileDropdownRef}
              className="profile-dropdown-container"
              style={{
                position: 'relative',
              }}
            >
            <button
              onClick={() => {
                setIsProfileDropdownOpen(!isProfileDropdownOpen)
              }}
              className="profile-button"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
              aria-label="Profile menu"
            >
              <UserIcon size={20} style={{ color: 'var(--text)' }} />
            </button>

            {/* Dropdown Panel */}
            {shouldRenderProfile && (
              <div
                ref={profileContentRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  zIndex: 1000,
                  overflow: 'hidden',
                  opacity: isProfileAnimating ? 1 : 0,
                  transform: isProfileAnimating ? 'translateY(0)' : 'translateY(-10px)',
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                  pointerEvents: isProfileAnimating ? 'auto' : 'none',
                  visibility: shouldRenderProfile ? 'visible' : 'hidden'
                }}
              >
                <div style={{ padding: '0.5rem' }}>
                  {/* User Info */}
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: 'var(--text)',
                      marginBottom: '0.25rem'
                    }}>
                      {session.user.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-light)'
                    }}>
                      {session.user.email}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: 'var(--text)',
                      fontSize: '0.875rem',
                      transition: 'background 0.2s',
                      textAlign: 'left',
                      opacity: isLoggingOut ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoggingOut) {
                        e.currentTarget.style.background = 'var(--bg-secondary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <LogOutIcon size={18} />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>

                  {isDanton && (
                    <button
                      onClick={handleDantonPanel}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: 'var(--text)',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s',
                        textAlign: 'left',
                        marginTop: '0.25rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <CrownIcon size={18} style={{ color: '#fbbf24' }} />
                      <span>Danton Dashboard</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={handleAdminPanel}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        color: 'var(--text)',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s',
                        textAlign: 'left',
                        marginTop: '0.25rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <CrownIcon size={18} style={{ color: 'var(--primary)' }} />
                      <span>Admin Panel</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav 
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        style={{ top: `${headerHeight}px` }}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            style={{
              color: pathname === link.href ? 'var(--primary)' : 'var(--text)',
              fontWeight: pathname === link.href ? 600 : 500,
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        
        {/* Download APK Button - Mobile Web Only (not in native APK) */}
        {!Capacitor.isNativePlatform() && (
          <a
            href="/TuntasinAja.apk"
            download="TuntasinAja.apk"
            className="mobile-nav-link"
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderTop: '1px solid var(--border)',
              marginTop: '0.5rem',
              paddingTop: '1rem',
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <DownloadIcon size={18} style={{ color: 'var(--primary)' }} />
            <span>Download APK</span>
          </a>
        )}
      </nav>
    </header>
  )
}
