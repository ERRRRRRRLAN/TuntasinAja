'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/ToastContainer'
import { EditIcon, TrashIcon, UserIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EditUserQuickView from './EditUserQuickView'

export default function ClassUserList() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data: users, isLoading, refetch } = trpc.danton.getClassUsers.useQuery()
  const utils = trpc.useUtils()

  const handleSuccess = () => {
    refetch()
    utils.danton.getClassStats.invalidate()
  }

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat daftar siswa...</p>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-light)' }}>Belum ada siswa di kelas ini.</p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Daftar Siswa di Kelas
        </h3>

        {/* Desktop Table View */}
        <div className="danton-user-table-desktop" style={{ overflowX: 'auto', display: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Nama
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Email
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Permission
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Terdaftar
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  fontWeight: 600,
                  color: 'var(--text-light)',
                  fontSize: '0.875rem'
                }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user.name}
                      {user.isDanton && (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          background: '#fbbf24',
                          color: '#78350f',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          Danton
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: user.permission === 'read_and_post_edit' 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      color: user.permission === 'read_and_post_edit'
                        ? '#15803d'
                        : '#dc2626',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {user.permission === 'read_and_post_edit' ? 'Read & Post/Edit' : 'Only Read'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="btn"
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                        title="Edit User"
                      >
                        <EditIcon size={14} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="danton-user-list-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {users.map((user) => (
            <div
              key={user.id}
              className="card"
              onClick={() => setSelectedUserId(user.id)}
              style={{
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 640) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow)'
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth > 640) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <UserIcon size={20} style={{ color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      wordBreak: 'break-word'
                    }}>
                      {user.name}
                    </h4>
                    {user.isDanton && (
                      <span style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        background: '#fbbf24',
                        color: '#78350f',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        Danton
                      </span>
                    )}
                  </div>
                  <p style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-light)',
                    wordBreak: 'break-word'
                  }}>
                    {user.email}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: user.permission === 'read_and_post_edit' 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      color: user.permission === 'read_and_post_edit'
                        ? '#15803d'
                        : '#dc2626',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {user.permission === 'read_and_post_edit' ? 'Read & Post/Edit' : 'Only Read'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-light)'
                    }}>
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                </div>
                <EditIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '0.25rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedUserId && (
        <EditUserQuickView
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

