'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import AddUserForm from '@/components/admin/AddUserForm'
import UserList from '@/components/admin/UserList'
import ThreadList from '@/components/admin/ThreadList'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAddUser, setShowAddUser] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'threads'>('users')
  const utils = trpc.useUtils()
  

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
          {isAdmin ? (
            <div>
              <div className="admin-panel-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                  Panel Admin
                </h2>
                {activeTab === 'users' && (
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="btn btn-primary"
                  >
                    {showAddUser ? '✕ Tutup' : '+ Tambah User Baru'}
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                borderBottom: '2px solid var(--border)'
              }}>
                <button
                  onClick={() => setActiveTab('users')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'users' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'users' ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'users' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                  }}
                >
                  User Management
                </button>
                <button
                  onClick={() => setActiveTab('threads')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'threads' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'threads' ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderBottom: activeTab === 'threads' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'threads' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                  }}
                >
                  Thread Management
                </button>
              </div>

              {activeTab === 'users' && (
                <>
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
                </>
              )}

              {activeTab === 'threads' && (
                <div style={{ marginTop: '1rem' }}>
                  <ThreadList />
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-light)' }}>
                Halaman ini hanya untuk admin.
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

