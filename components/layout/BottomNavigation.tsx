'use client'

import { usePathname } from 'next/navigation'
import { BookIcon, ClockIcon, CalendarIcon, BellIcon, UserIcon } from '@/components/ui/Icons'
import { useDanton } from '@/hooks/useDanton'
import ProtectedLink from '@/components/ui/ProtectedLink'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export default function BottomNavigation() {
  const pathname = usePathname()
  const { isDanton } = useDanton()

  // Main navigation items (always visible) - increased icon size
  const mainNavItems: NavItem[] = [
    { href: '/', label: 'Tugas', icon: <BookIcon size={24} /> },
    { href: '/history', label: 'History', icon: <ClockIcon size={24} /> },
    { href: '/schedule', label: 'Jadwal', icon: <CalendarIcon size={24} /> },
    { href: '/announcement', label: 'Pengumuman', icon: <BellIcon size={24} /> },
    { href: '/settings', label: 'Me', icon: <UserIcon size={24} /> },
  ]

  // Additional items (if danton, show in sidebar only)
  const additionalItems: NavItem[] = isDanton
    ? [{ href: '/danton', label: 'Danton', icon: <BookIcon size={20} /> }]
    : []

  // Combine all items for mobile (show max 5 in bottom nav, rest in sidebar)
  const allItems = [...mainNavItems, ...additionalItems]
  const bottomNavItems = allItems.slice(0, 5)

  return (
    <nav
      className="bottom-navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 100, /* Lower than FAB buttons (z-index: 1001) */
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: '0.75rem',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        height: 'var(--bottom-nav-height)',
        minHeight: 'var(--bottom-nav-height)',
        maxHeight: 'var(--bottom-nav-height)',
      }}
    >
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <ProtectedLink
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              textDecoration: 'none',
              color: isActive ? 'var(--primary)' : 'var(--text-light)',
              transition: 'all 0.2s',
              minWidth: '56px',
              position: 'relative',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text)'
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-light)'
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
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: isActive ? 600 : 500,
                color: 'inherit',
                letterSpacing: '-0.01em',
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '3px',
                  background: 'var(--primary)',
                  borderRadius: '0 0 3px 3px',
                }}
              />
            )}
          </ProtectedLink>
        )
      })}
    </nav>
  )
}

