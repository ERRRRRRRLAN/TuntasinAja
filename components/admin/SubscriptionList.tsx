'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ClassSubscriptionManager from './ClassSubscriptionManager'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function SubscriptionList() {
  const [editingKelas, setEditingKelas] = useState<string | null>(null)
  
  const { data: subscriptions, isLoading, refetch } = trpc.subscription.getAllClassSubscriptions.useQuery()
  const utils = trpc.useUtils()

  const handleSuccess = () => {
    setEditingKelas(null)
    utils.subscription.getAllClassSubscriptions.invalidate()
    refetch()
  }

  const getStatusBadge = (status: string, daysRemaining: number | null) => {
    if (status === 'active') {
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: '#f0fdf4',
          color: '#166534',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid #86efac'
        }}>
          ✓ Aktif {daysRemaining !== null && daysRemaining > 0 ? `(${daysRemaining} hari)` : ''}
        </span>
      )
    } else if (status === 'expiring_soon') {
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: '#fffbeb',
          color: '#92400e',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid #fde047'
        }}>
          ⚠ Akan Berakhir {daysRemaining !== null ? `(${daysRemaining} hari)` : ''}
        </span>
      )
    } else if (status === 'expired') {
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: '#fef2f2',
          color: '#991b1b',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid #fecaca'
        }}>
          ✗ Habis
        </span>
      )
    } else {
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: '#f3f4f6',
          color: '#6b7280',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid #d1d5db'
        }}>
          - Belum Ada
        </span>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat subscription...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Manajemen Subscription Kelas</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
            Kelola subscription untuk setiap kelas. Subscription expired akan menonaktifkan fitur kelas tersebut.
          </p>
        </div>
      </div>

      {subscriptions && subscriptions.length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    Kelas
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    Berakhir Pada
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    Sisa Durasi
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub: any) => (
                  <tr key={sub.kelas} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        {sub.kelas}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {getStatusBadge(sub.status || 'no_subscription', sub.daysRemaining)}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                      {sub.subscriptionEndDate ? (
                        <span style={{ fontSize: '0.875rem' }}>
                          {format(new Date(sub.subscriptionEndDate), 'd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                      {sub.daysRemaining !== null && sub.daysRemaining >= 0 ? (
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {sub.daysRemaining} hari
                          {sub.hoursRemaining !== null && (
                            <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                              ({Math.floor(sub.hoursRemaining)} jam)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          -
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setEditingKelas(sub.kelas)}
                        className="btn btn-primary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        {sub.status === 'no_subscription' || sub.status === 'expired' ? 'Set Subscription' : 'Extend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            Belum ada kelas dengan subscription.
          </p>
        </div>
      )}

      {editingKelas && (
        <div style={{ marginTop: '2rem' }}>
          <ClassSubscriptionManager
            kelas={editingKelas}
            onSuccess={handleSuccess}
            onCancel={() => setEditingKelas(null)}
          />
        </div>
      )}
    </div>
  )
}

