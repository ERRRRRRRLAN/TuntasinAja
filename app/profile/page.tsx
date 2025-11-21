'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import AddUserForm from '@/components/admin/AddUserForm'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [showAddUser, setShowAddUser] = useState(false)
  
  const { data: profile } = trpc.auth.getProfile.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  )

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  if (!session) {
    return null
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">👤</div>
              <h2>{session.user.name}</h2>
              <p>{session.user.email}</p>
              {isAdmin && (
                <p style={{ 
                  color: 'var(--primary)', 
                  fontWeight: 600,
                  marginTop: '0.5rem'
                }}>
                  👑 Admin
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
                <AddUserForm onSuccess={() => setShowAddUser(false)} />
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

