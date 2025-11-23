'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import AddUserForm from '@/components/admin/AddUserForm'
import UserList from '@/components/admin/UserList'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAddUser, setShowAddUser] = useState(false)
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

