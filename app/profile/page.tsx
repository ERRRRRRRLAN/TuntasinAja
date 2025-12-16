'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Layout from '@/components/layout/Layout'
import AddUserForm from '@/components/admin/AddUserForm'
import BulkAddUserForm from '@/components/admin/BulkAddUserForm'
import UserList from '@/components/admin/UserList'
import SubscriptionList from '@/components/admin/SubscriptionList'
import ClassSubjectList from '@/components/admin/ClassSubjectList'
import FeedbackList from '@/components/admin/FeedbackList'
import AppSettingsControl from '@/components/admin/AppSettingsControl'
import TestingReminderButton from '@/components/admin/TestingReminderButton'
import DatabaseHealth from '@/components/admin/DatabaseHealth'
import BulkOperations from '@/components/admin/BulkOperations'
import AnnouncementManagement from '@/components/admin/AnnouncementManagement'
import AutoDeleteExpiredButton from '@/components/admin/AutoDeleteExpiredButton'
import TestDeadlineReminderButton from '@/components/admin/TestDeadlineReminderButton'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAddUser, setShowAddUser] = useState(false)
  const [showBulkAddUser, setShowBulkAddUser] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions' | 'subjects' | 'feedback' | 'settings' | 'announcements'>('users')
  const [hasSessionCookie, setHasSessionCookie] = useState(true) // Assume true initially
  const utils = trpc.useUtils()
  
  // Get unread feedback count for admin
  const { data: unreadCount } = trpc.feedback.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false

  // Check if session cookie exists
  useEffect(() => {
    const checkSessionCookie = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const hasCookie = cookies.some(cookie => {
          const trimmed = cookie.trim()
          return trimmed.startsWith('next-auth.session-token=') || 
                 trimmed.startsWith('__Secure-next-auth.session-token=')
        })
        setHasSessionCookie(hasCookie)
      }
    }
    checkSessionCookie()
    const interval = setInterval(checkSessionCookie, 1000)
    return () => clearInterval(interval)
  }, [])

  // Redirect jika belum login - only if no cookie exists
  useEffect(() => {
    if (status === 'unauthenticated' && !hasSessionCookie) {
      router.push('/auth/signin')
    }
  }, [status, hasSessionCookie, router])


  // Show loading jika sedang check session
  if (status === 'loading') {
    return (
      <Layout>
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)' }}>Memuat...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Don't render jika belum login (will redirect) - but keep showing if cookie exists
  if ((status === 'unauthenticated' && !hasSessionCookie) || (!session && !hasSessionCookie)) {
    return null
  }

  return (
    <Layout>
      <div className="container">
          {isAdmin ? (
            <div>
              <div className="admin-panel-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                  Panel Admin
                </h2>
                {activeTab === 'users' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setShowAddUser(!showAddUser)
                        if (showAddUser) setShowBulkAddUser(false)
                      }}
                      className="btn btn-primary"
                    >
                      {showAddUser ? '✕ Tutup' : '+ Tambah User Baru'}
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkAddUser(!showBulkAddUser)
                        if (showBulkAddUser) setShowAddUser(false)
                      }}
                      className="btn btn-primary"
                      style={{ background: 'var(--primary)', border: '1px solid var(--primary)' }}
                    >
                      {showBulkAddUser ? '✕ Tutup' : '📦 Tambah User Bulk'}
                    </button>
                  </div>
                )}
                {activeTab === 'subjects' && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Kelola mata pelajaran per kelas
                  </div>
                )}
                {activeTab === 'feedback' && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Kelola saran dan masukan dari user
                  </div>
                )}
                {activeTab === 'announcements' && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Kelola pengumuman untuk kelas
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                    Pengaturan aplikasi
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                borderBottom: '2px solid var(--border)',
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border) transparent'
              }}>
                <button
                  onClick={() => setActiveTab('users')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'users' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'users' ? 'white' : 'var(--text-light)',
                    border: 'none',
                    borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'users' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  Manajemen User
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'subscriptions' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'subscriptions' ? 'white' : 'var(--text-light)',
                    border: 'none',
                    borderBottom: activeTab === 'subscriptions' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'subscriptions' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  Manajemen Subscription
                </button>
                <button
                  onClick={() => setActiveTab('subjects')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'subjects' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'subjects' ? 'white' : 'var(--text-light)',
                    border: 'none',
                    borderBottom: activeTab === 'subjects' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'subjects' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  Mata Pelajaran per Kelas
                </button>
                <button
                  onClick={() => setActiveTab('feedback')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'feedback' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'feedback' ? 'white' : 'var(--text-light)',
                    border: 'none',
                    borderBottom: activeTab === 'feedback' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'feedback' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span>Saran & Masukan</span>
                  {unreadCount && unreadCount.count > 0 && (
                    <span style={{
                      background: activeTab === 'feedback' ? 'white' : 'var(--danger)',
                      color: activeTab === 'feedback' ? 'var(--primary)' : 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {unreadCount.count > 99 ? '99+' : unreadCount.count}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activeTab === 'settings' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'settings' ? 'white' : 'var(--text-light)',
                    border: 'none',
                    borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'settings' ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    marginBottom: '-2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  ⚙️ Pengaturan
                </button>
              </div>

              {/* Tab Content */}
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

                  {showBulkAddUser && (
                    <div style={{ marginBottom: '2rem' }}>
                      <BulkAddUserForm 
                        onSuccess={() => {
                          setShowBulkAddUser(false)
                          // Invalidate user list and subscription list to refresh
                          utils.auth.getAllUsers.invalidate()
                          utils.subscription.getAllClassSubscriptions.invalidate()
                        }} 
                      />
                    </div>
                  )}

                  <div style={{ marginTop: '2rem' }}>
                    <UserList />
                  </div>
                </>
              )}

              {activeTab === 'subscriptions' && (
                <div>
                  <SubscriptionList />
                </div>
              )}

              {activeTab === 'subjects' && (
                <div>
                  <ClassSubjectList />
                </div>
              )}

              {activeTab === 'feedback' && (
                <div>
                  <FeedbackList />
                </div>
              )}

              {activeTab === 'announcements' && (
                <div>
                  <AnnouncementManagement />
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <DatabaseHealth />
                  <div style={{ marginTop: '1.5rem' }}>
                    <BulkOperations />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <AutoDeleteExpiredButton />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <TestingReminderButton />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <TestDeadlineReminderButton />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <AppSettingsControl />
                  </div>
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
      </Layout>
  )
}

