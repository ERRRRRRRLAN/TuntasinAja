'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from '@/components/ui/ToastContainer'
import { CalendarIcon } from '@/components/ui/Icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toJakartaDate } from '@/lib/date-utils'

export default function ThreadList() {
  const { data: session } = useSession()
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  const { data: threads, isLoading, refetch } = trpc.thread.getAll.useQuery()
  const utils = trpc.useUtils()

  const updateThreadDate = trpc.thread.updateThreadDate.useMutation({
    onSuccess: () => {
      utils.thread.getAll.invalidate()
      setEditingThreadId(null)
      setSelectedDate('')
      toast.success('Tanggal thread berhasil diupdate')
    },
    onError: (error: any) => {
      console.error('Error updating thread date:', error)
      toast.error(error.message || 'Gagal mengupdate tanggal thread. Silakan coba lagi.')
      setEditingThreadId(null)
      setSelectedDate('')
    },
  })

  const handleStartEdit = (thread: any) => {
    setEditingThreadId(thread.id)
    // Format date untuk input type="date" (YYYY-MM-DD)
    const threadDate = toJakartaDate(thread.date)
    const formattedDate = threadDate.toISOString().split('T')[0]
    setSelectedDate(formattedDate)
  }

  const handleCancelEdit = () => {
    setEditingThreadId(null)
    setSelectedDate('')
  }

  const handleSubmitDate = (threadId: string) => {
    if (!selectedDate) {
      toast.error('Pilih tanggal terlebih dahulu')
      return
    }

    updateThreadDate.mutate({
      threadId,
      date: selectedDate,
    })
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>Memuat threads...</p>
      </div>
    )
  }

  if (!threads || threads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-light)' }}>Belum ada thread.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Manage Threads - Set Tanggal
        </h2>
        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
          Set atau ubah tanggal thread untuk keperluan testing
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Judul</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Author</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Tanggal</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Komentar</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((thread: any) => {
              const isEditing = editingThreadId === thread.id
              return (
                <tr
                  key={thread.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>{thread.title}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-light)' }}>
                    {thread.author.name}
                    {thread.author.kelas && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      >
                        {thread.author.kelas}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          style={{
                            padding: '0.375rem 0.5rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                          }}
                          disabled={updateThreadDate.isLoading}
                        />
                        <button
                          onClick={() => handleSubmitDate(thread.id)}
                          disabled={updateThreadDate.isLoading || !selectedDate}
                          style={{
                            padding: '0.375rem 0.75rem',
                            background: updateThreadDate.isLoading || !selectedDate ? '#9ca3af' : 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: updateThreadDate.isLoading || !selectedDate ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                          }}
                        >
                          {updateThreadDate.isLoading ? (
                            <>
                              <LoadingSpinner size={14} color="white" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            'Simpan'
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={updateThreadDate.isLoading}
                          style={{
                            padding: '0.375rem 0.75rem',
                            background: 'transparent',
                            color: 'var(--text-light)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.375rem',
                            cursor: updateThreadDate.isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarIcon size={14} />
                        <span style={{ color: 'var(--text-light)' }}>
                          {format(toJakartaDate(thread.date), 'EEEE, d MMM yyyy', { locale: id })}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    {thread._count.comments}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(thread)}
                        disabled={updateThreadDate.isLoading}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          opacity: updateThreadDate.isLoading ? 0.6 : 1,
                        }}
                        title="Set Tanggal Thread"
                      >
                        <CalendarIcon size={14} />
                        <span>Set Tanggal</span>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

