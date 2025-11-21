'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Tugas' },
    { href: '/history', label: 'History' },
    { href: '/profile', label: 'Profil' },
  ]

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
          <button onClick={() => signOut()} className="btn-logout">
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}
