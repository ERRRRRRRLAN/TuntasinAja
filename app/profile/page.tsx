'use client'

import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'

export default function ProfilePage() {
  const { data: session } = useSession()
  const { data: profile } = trpc.auth.getProfile.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  )

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
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">{profile?.threadsCount || 0}</div>
                <div className="stat-label">Thread Dibuat</div>
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
        </div>
      </main>
    </>
  )
}

