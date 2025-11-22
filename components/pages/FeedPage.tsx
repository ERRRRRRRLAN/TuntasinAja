'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import ThreadCard from '@/components/threads/ThreadCard'
import CreateThreadForm from '@/components/threads/CreateThreadForm'
import ThreadQuickView from '@/components/threads/ThreadQuickView'
import { PlusIcon, SearchIcon, XIconSmall, BookIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'

// Generate list of kelas options
const generateKelasOptions = () => {
  const kelasOptions: string[] = []
  const tingkat = ['X', 'XI', 'XII']
  const jurusan = ['RPL', 'TKJ', 'BC']
  const nomor = ['1', '2']

  tingkat.forEach((t) => {
    jurusan.forEach((j) => {
      nomor.forEach((n) => {
        kelasOptions.push(`${t} ${j} ${n}`)
      })
    })
  })

  return kelasOptions
}

export default function FeedPage() {
  const { data: session } = useSession()
  const [showForm, setShowForm] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedKelas, setSelectedKelas] = useState<string>('all')
  const { data: threads, isLoading } = trpc.thread.getAll.useQuery(undefined, {
    refetchInterval: 3000, // Auto refresh every 3 seconds (faster)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  })
  const isAdmin = adminCheck?.isAdmin || false
  const kelasOptions = generateKelasOptions()


  // Filter and search threads
  const filteredThreads = useMemo(() => {
    if (!threads) return []

    let filtered = threads

    // Filter by subject (mata pelajaran)
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(thread => thread.title === selectedSubject)
    }

    // Filter by kelas (admin only)
    if (isAdmin && selectedKelas !== 'all') {
      filtered = filtered.filter(thread => {
        const authorKelas = (thread.author as any)?.kelas
        return authorKelas === selectedKelas
      })
    }

    // Search by comment content
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(thread => {
        // Check if any comment content matches the search query
        return thread.comments.some(comment => 
          comment.content.toLowerCase().includes(query)
        )
      })
    }

    return filtered
  }, [threads, selectedSubject, selectedKelas, searchQuery, isAdmin])

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

          {/* Search and Filter Section */}
          <div className="search-filter-container" style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            alignItems: 'stretch'
          }}>
            {/* Search Input */}
            <div className="search-input-wrapper" style={{ 
              flex: '1', 
              minWidth: '200px',
              position: 'relative'
            }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <SearchIcon 
                  size={18} 
                  style={{ 
                    position: 'absolute',
                    left: '0.75rem',
                    color: 'var(--text-light)',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Cari berdasarkan isi komentar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-light)',
                      borderRadius: '0.25rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none'
                    }}
                    aria-label="Clear search"
                  >
                    <XIconSmall size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter ComboBox - Mata Pelajaran */}
            <div className="filter-combobox-wrapper" style={{ 
              minWidth: '220px',
              maxWidth: '300px',
              width: '100%'
            }}>
              <ComboBox
                value={selectedSubject}
                onChange={setSelectedSubject}
                placeholder="Pilih Mata Pelajaran"
              />
            </div>

            {/* Filter ComboBox - Kelas (Admin only) */}
            {isAdmin && (
              <div className="filter-combobox-wrapper" style={{ 
                minWidth: '180px',
                maxWidth: '250px',
                width: '100%'
              }}>
                <ComboBox
                  value={selectedKelas}
                  onChange={setSelectedKelas}
                  placeholder="Pilih Kelas"
                  options={kelasOptions}
                  showAllOption={true}
                  allValue="all"
                  allLabel="Semua Kelas"
                  searchPlaceholder="Cari kelas..."
                  emptyMessage="Tidak ada kelas yang ditemukan"
                  icon={<BookIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />}
                />
              </div>
            )}
          </div>

          {/* Results Count */}
          {(searchQuery || selectedSubject !== 'all' || (isAdmin && selectedKelas !== 'all')) && (
            <div className="results-count" style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-light)'
            }}>
              Menampilkan {filteredThreads.length} dari {threads?.length || 0} PR
              {searchQuery && (
                <span> • Pencarian: "{searchQuery}"</span>
              )}
              {selectedSubject !== 'all' && (
                <span> • Mata Pelajaran: {selectedSubject}</span>
              )}
              {isAdmin && selectedKelas !== 'all' && (
                <span> • Kelas: {selectedKelas}</span>
              )}
            </div>
          )}

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
          ) : filteredThreads.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-light)' }}>
                {searchQuery || selectedSubject !== 'all' || (isAdmin && selectedKelas !== 'all')
                  ? 'Tidak ada PR yang sesuai dengan filter/pencarian Anda.' 
                  : 'Belum ada PR. Buat PR pertama Anda!'}
              </p>
            </div>
          ) : (
            <div className="threads-container">
              {filteredThreads.map((thread) => (
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
