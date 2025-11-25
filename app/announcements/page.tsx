'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import CreateAnnouncementForm from '@/components/announcements/CreateAnnouncementForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useUserPermission } from '@/hooks/useUserPermission'
import { PlusIcon, AlertTriangleIcon } from '@/components/ui/Icons'
import { useClassSubscription } from '@/hooks/useClassSubscription'
import { useDanton } from '@/hooks/useDanton'

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { announcements, isLoading } = useAnnouncements()
  const { canPostEdit, isOnlyRead } = useUserPermission()
  const { isDanton, kelas } = useDanton()
  const { isActive: isSubscriptionActive, isExpired: isSubscriptionExpired } = useClassSubscription(kelas || undefined)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <LoadingSpinner size={32} />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const canActuallyPostEdit = canPostEdit && (isSubscriptionActive || isDanton)

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '1.5rem 1rem',
      minHeight: 'calc(100vh - 4rem)'
    }}>
      {/* Header */}
      <div className="announcements-page-header" style={{ 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.75rem', 
            fontWeight: 600 
          }}>
            Pengumuman
          </h1>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-light)', 
            fontSize: '0.9375rem' 
          }}>
            Lihat pengumuman terbaru dari kelas Anda
          </p>
        </div>
        {canActuallyPostEdit && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              minHeight: '44px',
            }}
          >
            <PlusIcon size={18} />
            Buat Pengumuman
          </button>
        )}
      </div>

      {/* Warning if subscription expired */}
      {!isDanton && isSubscriptionExpired && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <AlertTriangleIcon size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 500, color: '#dc2626' }}>
              Subscription kelas sudah habis
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Anda hanya dapat melihat pengumuman. Hubungi danton untuk memperpanjang subscription.
            </p>
          </div>
        </div>
      )}

      {/* Permission warning */}
      {isOnlyRead && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <AlertTriangleIcon size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 500, color: '#dc2626' }}>
              Hanya dapat membaca
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Anda hanya memiliki izin membaca. Tidak dapat membuat pengumuman.
            </p>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner size={32} />
          <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
            Memuat pengumuman...
          </p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            Belum ada pengumuman.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((announcement: any) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateAnnouncementForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
          }}
        />
      )}
    </div>
  )
}

