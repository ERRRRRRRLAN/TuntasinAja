'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import ThreadCard from '@/components/threads/ThreadCard'
import CreateThreadForm from '@/components/threads/CreateThreadForm'
import ThreadQuickView from '@/components/threads/ThreadQuickView'
import { PlusIcon } from '@/components/ui/Icons'

export default function FeedPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const { data: threads, isLoading } = trpc.thread.getAll.useQuery(undefined, {
    refetchInterval: 3000, // Auto refresh every 3 seconds (faster)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div>
              <h2>Tugas</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Klik PR untuk melihat detail • Centang checkbox untuk menandai selesai
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
            >
              <PlusIcon size={18} style={{ marginRight: '0.375rem', display: 'inline-block', verticalAlign: 'middle' }} />
              Buat PR Baru
            </button>
          </div>

          {showForm && (
            <div className="card">
              <CreateThreadForm onSuccess={() => setShowForm(false)} />
            </div>
          )}

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>Memuat PR...</p>
            </div>
          ) : !threads || threads.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>
                Belum ada PR. Buat PR pertama Anda!
              </p>
            </div>
          ) : (
            <div className="threads-container">
              {threads.map((thread) => (
                <ThreadCard 
                  key={thread.id} 
                  thread={thread}
                  onThreadClick={(threadId) => setSelectedThreadId(threadId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedThreadId && (
        <ThreadQuickView
          threadId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
        />
      )}
    </>
  )
}
