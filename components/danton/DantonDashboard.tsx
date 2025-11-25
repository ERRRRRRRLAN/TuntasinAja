'use client'

import { useState } from 'react'
import { useDanton } from '@/hooks/useDanton'
import { trpc } from '@/lib/trpc'
import ClassUserList from './ClassUserList'
import AddUserToClassForm from './AddUserToClassForm'
import SubscriptionStatusCard from './SubscriptionStatusCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { UserIcon, PlusIcon } from '@/components/ui/Icons'
import { useClassSubscription } from '@/hooks/useClassSubscription'

export default function DantonDashboard() {
  const { isDanton, kelas: dantonKelas, isLoading: isDantonLoading } = useDanton()
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const { isActive, isExpired, isLoading: isSubscriptionLoading } = useClassSubscription(dantonKelas || undefined)

  const { data: stats, isLoading: isStatsLoading } = trpc.danton.getClassStats.useQuery(undefined, {
    enabled: isDanton,
  })

  if (isDantonLoading || isStatsLoading || isSubscriptionLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat dashboard...</p>
      </div>
    )
  }

  if (!isDanton) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-light)' }}>Anda bukan danton.</p>
      </div>
    )
  }

  // Disable all management features if subscription expired
  const canManage = isActive && !isExpired

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Subscription Status Card - Always show at top */}
      <SubscriptionStatusCard />

      {/* Warning if subscription expired */}
      {isExpired && (
        <div style={{
          padding: '1.5rem',
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '0.5rem',
          color: '#991b1b'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
            ⚠️ Subscription Sudah Habis
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.6' }}>
            Subscription untuk kelas {dantonKelas} sudah habis. Semua fitur management telah dinonaktifkan.
            Hubungi admin untuk memperpanjang subscription agar fitur dapat digunakan kembali.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <UserIcon size={24} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Siswa</h4>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {stats?.userCount || 0}
            <span style={{ fontSize: '1rem', color: 'var(--text-light)', fontWeight: 400 }}>
              {' '}/ {stats?.maxUsers || 40}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            {stats?.remainingSlots || 0} slot tersedia
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Kelas</h4>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
            {dantonKelas || '-'}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Thread</h4>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {stats?.threadCount || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Komentar</h4>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
            {stats?.commentCount || 0}
          </div>
        </div>
      </div>

      {/* Class User List - Only show if subscription active */}
      {canManage ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Manajemen Siswa</h3>
            <button
              onClick={() => setShowAddUserForm(true)}
              className="btn btn-primary"
              disabled={stats ? stats.userCount >= stats.maxUsers : false}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: stats && stats.userCount >= stats.maxUsers ? '#cbd5e1' : 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: stats && stats.userCount >= stats.maxUsers ? 'not-allowed' : 'pointer',
                opacity: stats && stats.userCount >= stats.maxUsers ? 0.6 : 1,
              }}
            >
              <PlusIcon size={18} />
              Tambah Siswa
            </button>
          </div>

          <ClassUserList />

          {showAddUserForm && (
            <AddUserToClassForm
              onClose={() => setShowAddUserForm(false)}
              onSuccess={() => setShowAddUserForm(false)}
            />
          )}
        </>
      ) : (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#f9fafb',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem'
        }}>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
            Fitur manajemen siswa hanya tersedia saat subscription aktif.
          </p>
        </div>
      )}
    </div>
  )
}

