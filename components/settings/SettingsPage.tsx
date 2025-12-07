'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import NotificationSettings from '@/components/settings/NotificationSettings'
import DisplaySettings from '@/components/settings/DisplaySettings'
import DataSettings from '@/components/settings/DataSettings'
import SoundSettings from '@/components/settings/SoundSettings'
import AboutSettings from '@/components/settings/AboutSettings'
import { SettingsIcon } from '@/components/ui/Icons'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Redirect jika belum login
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <LoadingSpinner />
              <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
                Memuat pengaturan...
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!session) {
    return null
  }

  const categories = [
    { id: 'notifications', icon: '🔔', label: 'Notifikasi & Pengingat', component: NotificationSettings },
    { id: 'display', icon: '👁️', label: 'Tampilan & Tema', component: DisplaySettings },
    { id: 'data', icon: '💾', label: 'Data & Penyimpanan', component: DataSettings },
    { id: 'sound', icon: '🔊', label: 'Suara & Getar', component: SoundSettings },
    { id: 'about', icon: 'ℹ️', label: 'Tentang & Bantuan', component: AboutSettings },
  ]

  const ActiveComponent = activeCategory
    ? categories.find(c => c.id === activeCategory)?.component
    : null

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div>
              <h2 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                margin: 0,
              }}>
                <SettingsIcon size={24} />
                Pengaturan
              </h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Kelola preferensi dan pengaturan aplikasi
              </p>
            </div>
          </div>

          {!activeCategory ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
            }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ fontSize: '2.5rem' }}>{category.icon}</div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '1rem',
                    color: 'var(--text)',
                  }}>
                    {category.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setActiveCategory(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                ← Kembali
              </button>
              {ActiveComponent && <ActiveComponent />}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

