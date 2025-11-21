'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookIcon } from '@/components/ui/Icons'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Tugas' },
    { href: '/history', label: 'History' },
    { href: '/profile', label: 'Profil' },
  ]

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

  if (!session) return null

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookIcon size={24} style={{ flexShrink: 0 }} />
          <span>TuntasinAja</span>
        </Link>
        
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

      {/* Mobile Navigation */}
      <nav className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
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
      </nav>
    </header>
  )
}
