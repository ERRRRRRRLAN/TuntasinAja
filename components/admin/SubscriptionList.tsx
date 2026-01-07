'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ClassSubscriptionManager from './ClassSubscriptionManager'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from '@/components/ui/Icons'

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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid var(--border)'
        }}>
          <CheckIcon size={12} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          Aktif {daysRemaining !== null && daysRemaining > 0 ? `(${daysRemaining} hari)` : ''}
        </span>
      )
    } else if (status === 'expiring_soon') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid var(--border)'
        }}>
          <AlertTriangleIcon size={12} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          Akan Berakhir {daysRemaining !== null ? `(${daysRemaining} hari)` : ''}
        </span>
      )
    } else if (status === 'expired') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-light)',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid var(--border)'
        }}>
          <XIcon size={12} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          Habis
        </span>
      )
    } else {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-light)',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid var(--border)'
        }}>
          <InfoIcon size={12} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          Belum Ada
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Manajemen Subscription Kelas</h2>
        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
          Kelola subscription untuk setiap kelas. Subscription expired akan menonaktifkan fitur kelas tersebut.
        </p>
      </div>

      {subscriptions && subscriptions.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="card subscription-table-desktop" style={{ overflow: 'hidden', display: 'none' }}>
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
                  {subscriptions.map((sub: any, index: number) => (
                    <tr 
                      key={sub.kelas} 
                      className="subscription-fade-in"
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        animationDelay: `${index * 0.05}s`
                      }}
                    >
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
                          className="btn btn-primary subscription-fade-in"
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease-out'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = 'var(--shadow)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="subscription-list-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {subscriptions.map((sub: any, index: number) => (
              <div 
                key={sub.kelas}
                className="card subscription-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
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
                  {getStatusBadge(sub.status || 'no_subscription', sub.daysRemaining)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ 
                      margin: '0 0 0.25rem 0', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-light)',
                      fontWeight: 500
                    }}>
                      Berakhir Pada
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem', 
                      color: 'var(--text-primary)'
                    }}>
                      {sub.subscriptionEndDate ? (
                        format(new Date(sub.subscriptionEndDate), 'd MMM yyyy, HH:mm', { locale: id })
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>-</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p style={{ 
                      margin: '0 0 0.25rem 0', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-light)',
                      fontWeight: 500
                    }}>
                      Sisa Durasi
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem', 
                      color: 'var(--text-primary)',
                      fontWeight: 500
                    }}>
                      {sub.daysRemaining !== null && sub.daysRemaining >= 0 ? (
                        <>
                          {sub.daysRemaining} hari
                          {sub.hoursRemaining !== null && (
                            <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                              ({Math.floor(sub.hoursRemaining)} jam)
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>-</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingKelas(sub.kelas)}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem',
                    fontSize: '0.875rem',
                    minHeight: '44px',
                    transition: 'all 0.2s ease-out'
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            Belum ada kelas dengan subscription.
          </p>
        </div>
      )}

      {editingKelas && (
        <div className="subscription-fade-in" style={{ marginTop: '2rem' }}>
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

