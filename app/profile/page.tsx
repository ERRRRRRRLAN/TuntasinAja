'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import AddUserForm from '@/components/admin/AddUserForm'
import UserList from '@/components/admin/UserList'
import { UserIcon, CrownIcon, LogOutIcon } from '@/components/ui/Icons'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAddUser, setShowAddUser] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const utils = trpc.useUtils()
  
  const { data: profile } = trpc.auth.getProfile.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  )

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  // Redirect jika belum login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/auth/signin'
      })
      router.push('/auth/signin')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/signin')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Show loading jika sedang check session
  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="main-content">
          <div className="container">
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>Memuat...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  // Don't render jika belum login (will redirect)
  if (status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="profile-card">
            <div className="profile-header" style={{ position: 'relative' }}>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  opacity: isLoggingOut ? 0.6 : 1,
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  if (!isLoggingOut) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
                title="Logout"
                aria-label="Logout"
              >
                <LogOutIcon 
                  size={20} 
                  style={{ 
                    color: 'var(--text)',
                    transition: 'transform 0.2s'
                  }} 
                />
              </button>
              <div className="profile-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={48} />
              </div>
              <h2>{session.user.name}</h2>
              <p>{session.user.email}</p>
              {isAdmin && (
                <p style={{ 
                  color: 'var(--primary)', 
                  fontWeight: 600,
                  marginTop: '0.5rem'
                }}>
                  <CrownIcon size={16} style={{ marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  Admin
                </p>
              )}
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">{profile?.threadsCount || 0}</div>
                <div className="stat-label">PR Dibuat</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{profile?.commentsCount || 0}</div>
                <div className="stat-label">Komentar</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{profile?.completedCount || 0}</div>
                <div className="stat-label">Tugas Selesai</div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  Panel Admin
                </h2>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="btn btn-primary"
                >
                  {showAddUser ? '✕ Tutup' : '+ Tambah User Baru'}
                </button>
              </div>

              {showAddUser && (
                <div style={{ marginBottom: '2rem' }}>
                  <AddUserForm 
                    onSuccess={() => {
                      setShowAddUser(false)
                      // Invalidate user list to refresh
                      utils.auth.getAllUsers.invalidate()
                    }} 
                  />
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                <UserList />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

