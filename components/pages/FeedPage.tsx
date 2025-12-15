'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import Layout from '@/components/layout/Layout'
import ThreadCard from '@/components/threads/ThreadCard'
import ThreadQuickView from '@/components/threads/ThreadQuickView'
import CreateThreadQuickView from '@/components/threads/CreateThreadQuickView'
import ReminderModal from '@/components/ui/ReminderModal'
import FeedbackModal from '@/components/ui/FeedbackModal'
import { PlusIcon, SearchIcon, XIconSmall, BookIcon, BellIcon, AlertTriangleIcon, MessageIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useUserPermission } from '@/hooks/useUserPermission'
import { useClassSubscription } from '@/hooks/useClassSubscription'

// Generate list of kelas options
const generateKelasOptions = (): string[] => {
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
  const { data: session, status: sessionStatus } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [hasSessionCookie, setHasSessionCookie] = useState(false)

  // Check if session cookie exists (even if session data not loaded yet)
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
    
    // Check periodically in case cookie is restored
    const interval = setInterval(checkSessionCookie, 1000)
    return () => clearInterval(interval)
  }, [])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedKelas, setSelectedKelas] = useState<string>('all')
  const [filteredSubjects, setFilteredSubjects] = useState<string[]>([]) // For multiple subject filter from URL
  const [isDataValidated, setIsDataValidated] = useState(false)
  const [previousUserId, setPreviousUserId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [hasCheckedReminder, setHasCheckedReminder] = useState(false)
  const [threadOpenedFromReminder, setThreadOpenedFromReminder] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showFeedbackTooltip, setShowFeedbackTooltip] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Get user data (kelas, isAdmin)
  const { data: userData, isLoading: isLoadingUserData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const userKelas = userData?.kelas || null
  const isAdmin = userData?.isAdmin || false

  // Get user settings
  const { data: userSettings } = trpc.userSettings.get.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
  })
  
  const pageSize = userSettings?.tasksPerPage || 20
  const defaultSort: 'newest' | 'oldest' | 'dueDate' = (userSettings?.defaultSort as 'newest' | 'oldest' | 'dueDate') || 'newest'
  const showCompletedTasks = userSettings?.showCompletedTasks ?? true

  // Get subjects for user's class
  const { data: classSubjects, isLoading: isLoadingSubjects } = trpc.classSubject.getClassSubjects.useQuery(
    { kelas: userKelas || undefined },
    { enabled: !!session && !!userKelas }
  )
  const subjectOptions = classSubjects?.map((s: any) => s.subject) || []

  // Check user permission
  const { canPostEdit, isOnlyRead, permission } = useUserPermission()

  // Check subscription status (skip for admin)
  const { isActive: isSubscriptionActive, isExpired: isSubscriptionExpired } = useClassSubscription(isAdmin ? undefined : userKelas || undefined)

  // User can only post/edit if: has permission AND subscription is active (or admin)
  const canActuallyPostEdit = canPostEdit && (isAdmin || isSubscriptionActive)

  // Get threads with pagination - invalidate cache when user changes
  const utils = trpc.useUtils()
  const { data: threadsData, isLoading, isFetching, isRefetching, error: threadsError, refetch: refetchThreads } = trpc.thread.getAll.useQuery(
    { 
      page: currentPage, 
      limit: pageSize,
      sort: defaultSort,
      showCompleted: showCompletedTasks,
    },
    {
      refetchInterval: (query) => {
        // Stop polling jika tab tidak aktif (hidden)
        if (typeof document !== 'undefined' && document.hidden) {
          return false
        }
        // 5 detik lebih reasonable untuk mengurangi beban server
        return 5000
      },
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnReconnect: true, // Refetch when network reconnects
      enabled: sessionStatus !== 'loading' && !isLoadingUserData, // Only fetch when session and user data are ready
      staleTime: 0, // Always consider data stale
      cacheTime: 0, // Don't cache data
      onError: (error) => {
        console.error('[FeedPage] Error fetching threads:', error)
      },
    }
  )

  // Extract threads and pagination info from response
  const threads = threadsData?.threads || []
  const totalThreads = threadsData?.total || 0
  const totalPages = threadsData?.totalPages || 1

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [selectedSubject, selectedKelas, searchQuery, filteredSubjects])

  // Track initial load completion
  useEffect(() => {
    // For admin, mark initial load complete once data is validated (don't wait for threads)
    if (isAdmin && isDataValidated && !isLoadingUserData && userData !== undefined) {
      setIsInitialLoad(false)
      return
    }

    // For non-admin, wait for threads to load and validate
    if (!isLoading && threads && isDataValidated) {
      setIsInitialLoad(false)
    }
  }, [isLoading, threads, isDataValidated, isAdmin, isLoadingUserData, userData])

  // Handle filter from URL (deep link from notification)
  useEffect(() => {
    if (!searchParams) return
    
    const filterParam = searchParams.get('filter')
    if (filterParam) {
      // Parse filter subjects from URL (comma-separated)
      // Decode URL-encoded subjects
      const decodedFilter = decodeURIComponent(filterParam)
      const subjects = decodedFilter.split(',').map(s => s.trim()).filter(s => s.length > 0)
      
      console.log('[FeedPage] Filter from URL:', { filterParam, decodedFilter, subjects })
      
      if (subjects.length > 0) {
        setFilteredSubjects(subjects)
        // Remove filter from URL after applying (but keep it in state)
        // Don't remove from URL immediately - let user see the filter in URL
        // Only remove when user manually clears filter
      }
    } else {
      // If no filter param, clear filtered subjects (user navigated away or cleared filter)
      if (filteredSubjects.length > 0) {
        setFilteredSubjects([])
      }
    }
  }, [searchParams, router])

  // Invalidate cache when user changes
  useEffect(() => {
    if (session?.user?.id && session.user.id !== previousUserId) {
      // User changed - invalidate all queries and reset initial load
      utils.thread.getAll.invalidate()
      utils.userStatus.getUncompletedCount.invalidate()
      utils.userStatus.getOverdueTasks.invalidate()
      setPreviousUserId(session.user.id)
      setIsDataValidated(false)
      setIsInitialLoad(true) // Reset initial load state when user changes
      setHasCheckedReminder(false) // Reset reminder check when user changes
      setFilteredSubjects([]) // Reset filter when user changes
    }
  }, [session?.user?.id, previousUserId, utils])

  // Validate that displayed threads match user's kelas
  useEffect(() => {
    // For admin, validate immediately once userData is loaded (don't wait for threads)
    if (isAdmin && !isLoadingUserData && userData !== undefined) {
      setIsDataValidated(true)
      return
    }

    // For non-admin users, validate threads match their kelas
    if (threads && userKelas !== undefined && !isAdmin) {
      // Check if all threads match user's kelas
      const allMatchKelas = threads.every(thread => {
        const authorKelas = (thread.author as any)?.kelas
        return authorKelas === userKelas
      })
      
      if (allMatchKelas || threads.length === 0) {
        setIsDataValidated(true)
      } else if (isInitialLoad) {
        // Only invalidate on initial load if data doesn't match
        // Background refresh will handle updates automatically
        setIsDataValidated(false)
        utils.thread.getAll.invalidate()
      }
    } else if (!userKelas && !isLoadingUserData && userData !== undefined) {
      // No kelas but user data is loaded - always valid (public view)
      setIsDataValidated(true)
    }
  }, [threads, userKelas, isAdmin, utils, isInitialLoad, isLoadingUserData, userData])

  // Get uncompleted comments count
  const { data: uncompletedData } = trpc.userStatus.getUncompletedCount.useQuery(
    undefined,
    {
      enabled: !!session && isDataValidated,
      refetchInterval: (query) => {
        // Stop polling jika tab tidak aktif (hidden)
        if (typeof document !== 'undefined' && document.hidden) {
          return false
        }
        // 5 detik lebih reasonable untuk mengurangi beban server
        return 5000
      },
      refetchOnWindowFocus: true,
    }
  )

  // Get overdue tasks for reminder (disabled for admin users)
  const { data: overdueData } = trpc.userStatus.getOverdueTasks.useQuery(
    undefined,
    {
      enabled: !!session && isDataValidated && !isAdmin, // Disable for admin
    }
  )

  const kelasOptions = generateKelasOptions()
  const uncompletedCount = uncompletedData?.uncompletedCount || 0
  const overdueTasks = overdueData?.overdueTasks || []

  // Show reminder modal automatically when user logs in and there are overdue tasks
  // Disabled for admin users (admin doesn't have kelas)
  // Only show once per application session (using sessionStorage)
  useEffect(() => {
    // Skip for admin users
    if (isAdmin) return
    
    // Check if reminder has been shown in this session
    const reminderShownKey = `reminder_shown_${session?.user?.id || 'anonymous'}`
    const hasShownReminder = typeof window !== 'undefined' && sessionStorage.getItem(reminderShownKey) === 'true'
    
    // Only check once per session (when component first mounts and data is validated)
    // And only if reminder hasn't been shown in this session
    if (
      session &&
      !hasShownReminder &&
      isDataValidated &&
      overdueTasks.length > 0
    ) {
      setShowReminderModal(true)
      setHasCheckedReminder(true)
      // Mark reminder as shown in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(reminderShownKey, 'true')
      }
    }
  }, [session, isAdmin, isDataValidated, overdueTasks.length])



  // Filter and search threads
  const filteredThreads = useMemo(() => {
    if (!threads || !isDataValidated) return []

    let filtered = threads

    // Additional client-side validation: filter by user's kelas (non-admin only)
    if (!isAdmin && userKelas) {
      filtered = filtered.filter(thread => {
        const authorKelas = (thread.author as any)?.kelas
        return authorKelas === userKelas
      })
    }

    // Filter by multiple subjects from URL (deep link from notification)
    // This filter works as OR condition: show threads that match ANY of the subjects
    if (filteredSubjects.length > 0) {
      filtered = filtered.filter(thread => {
        const titleUpper = thread.title.toUpperCase()
        // Check if thread title contains ANY of the filtered subjects
        return filteredSubjects.some(subject => {
          const subjectUpper = subject.toUpperCase().trim()
          // Use includes for substring matching (case-insensitive)
          // This allows matching "IPAS" in "IPAS - Kerjakan PR" or "PR IPAS"
          return titleUpper.includes(subjectUpper)
        })
      })
      console.log('[FeedPage] Filtered threads by subjects:', {
        filteredSubjects,
        totalThreads: threads.length,
        filteredCount: filtered.length,
      })
    } else if (selectedSubject !== 'all') {
      // Filter by single subject (from dropdown)
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

    // Sort by deadline (nearest first), then by createdAt (newest first)
    filtered.sort((a, b) => {
      // If both have deadlines, sort by deadline (nearest first)
      if (a.deadline && b.deadline) {
        const deadlineA = new Date(a.deadline).getTime()
        const deadlineB = new Date(b.deadline).getTime()
        return deadlineA - deadlineB
      }
      // If only one has deadline, prioritize it
      if (a.deadline && !b.deadline) return -1
      if (!a.deadline && b.deadline) return 1
      // If neither has deadline, sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return filtered
  }, [threads, selectedSubject, selectedKelas, searchQuery, filteredSubjects, isAdmin, userKelas, isDataValidated])

  // Clear filter function
  const clearFilter = () => {
    setFilteredSubjects([])
    setSelectedSubject('all')
    // Remove filter from URL
    router.replace('/', { scroll: false })
  }

  return (
    <Layout>
        <div className="container">
          <div className="page-header">
            <div>
              <h2>Tugas</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Klik PR untuk melihat detail • Centang checkbox untuk menandai selesai
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {session && uncompletedCount > 0 && (
                  <span style={{ 
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}>
                    {uncompletedCount} belum selesai
                  </span>
                )}
                {session && !isAdmin && overdueTasks.length > 0 && (
                  <button
                    onClick={() => setShowReminderModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      background: 'var(--danger)',
                      border: 'none',
                      color: 'white',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dc2626'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--danger)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <BellIcon size={14} />
                    {overdueTasks.length} tugas belum selesai &gt; 7 hari
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Badge (from notification deep link) */}
          {filteredSubjects.length > 0 && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--primary)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                <BellIcon size={18} style={{ color: 'white' }} />
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                  Filter Aktif: Tugas untuk besok ({filteredSubjects.join(', ')})
                </span>
              </div>
              <button
                onClick={clearFilter}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.375rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <XIconSmall size={16} />
                Hapus Filter
              </button>
            </div>
          )}

          {/* WhatsApp Channel Info Banner */}
          <div style={{
            marginBottom: '1rem',
            padding: '0.875rem 1rem',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.2)',
          }}>
            <MessageIcon 
              size={20} 
              style={{ 
                color: 'white', 
                flexShrink: 0 
              }} 
            />
            <div style={{ flex: 1, color: 'white' }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                fontWeight: 500,
                lineHeight: 1.4
              }}>
                TuntasinAja menginformasikan update melalui channel WhatsApp{' '}
                <a
                  href="https://whatsapp.com/channel/0029VbC91BjD38CKIiir6932"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    textDecoration: 'underline',
                    fontWeight: 600,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  @TuntasinAja Info
                </a>
              </p>
            </div>
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
                  placeholder="Cari berdasarkan isi sub tugas..."
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
                options={subjectOptions}
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
              Menampilkan {filteredThreads.length} dari {totalThreads} PR
              {totalPages > 1 && (
                <span> • Halaman {currentPage} dari {totalPages}</span>
              )}
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

          {/* Only show loading on initial load, not during background refresh */}
          {/* For admin: don't wait for isLoadingSubjects (query is disabled) or threads loading after validation */}
          {/* For non-admin: wait for all data including threads on initial load */}
          {(
            isLoadingUserData || 
            (!isAdmin && isLoadingSubjects) || 
            (isInitialLoad && !isDataValidated) ||
            (!isAdmin && isInitialLoad && isLoading && !threads)
          ) ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <LoadingSpinner size={32} />
              <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
                {isLoadingUserData ? 'Memuat data user...' : 'Memuat PR...'}
              </p>
            </div>
          ) : threadsError ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', border: '1px solid var(--danger)' }}>
              <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>Error memuat tugas</p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {threadsError.message || 'Terjadi kesalahan saat memuat data'}
              </p>
              <button
                onClick={() => {
                  refetchThreads()
                  window.location.reload()
                }}
                className="btn btn-primary"
              >
                Muat Ulang
              </button>
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
            <>
              <div className="threads-container">
                {filteredThreads.map((thread) => (
                  <ThreadCard 
                    key={thread.id} 
                    thread={thread}
                    onThreadClick={(threadId) => setSelectedThreadId(threadId)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '2rem',
                  flexWrap: 'wrap',
                }}>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="btn"
                    style={{
                      padding: '0.5rem 1rem',
                      minWidth: '80px',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← Sebelumnya
                  </button>

                  {/* Page Numbers */}
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    alignItems: 'center',
                  }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        // Show all pages if 5 or less
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        // Show first 5 pages
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages
                        pageNum = totalPages - 4 + i
                      } else {
                        // Show pages around current page
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className="btn"
                          style={{
                            padding: '0.5rem 0.75rem',
                            minWidth: '40px',
                            background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: currentPage === pageNum ? 'white' : 'var(--text)',
                            border: currentPage === pageNum ? '1px solid var(--primary)' : '1px solid var(--border)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    className="btn"
                    style={{
                      padding: '0.5rem 1rem',
                      minWidth: '80px',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Selanjutnya →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedThreadId && (
          <ThreadQuickView
            threadId={selectedThreadId}
            onClose={() => {
              setSelectedThreadId(null)
              // Jika thread dibuka dari reminder, buka reminder modal lagi
              if (threadOpenedFromReminder) {
                setThreadOpenedFromReminder(false)
                setShowReminderModal(true)
              }
            }}
          />
        )}

        {showCreateForm && (
          <CreateThreadQuickView onClose={() => setShowCreateForm(false)} />
        )}

        {/* Reminder Modal - Disabled for admin users */}
        {!isAdmin && (
          <ReminderModal
          isOpen={showReminderModal}
          onClose={() => {
            setShowReminderModal(false)
            // Invalidate overdue tasks query so it can be checked again next time
            utils.userStatus.getOverdueTasks.invalidate()
          }}
          overdueTasks={overdueTasks.map((task) => ({
            threadId: task.threadId,
            threadTitle: task.threadTitle,
            threadDate: new Date(task.threadDate),
            authorName: task.authorName,
            daysOverdue: task.daysOverdue,
          }))}
          onTasksUpdated={() => {
            // Invalidate queries when tasks are updated
            utils.userStatus.getOverdueTasks.invalidate()
            utils.userStatus.getUncompletedCount.invalidate()
            utils.thread.getAll.invalidate()
          }}
          onTaskClick={(threadId) => {
            // Open thread detail when task is clicked
            // Set flag bahwa thread dibuka dari reminder
            setThreadOpenedFromReminder(true)
            setSelectedThreadId(threadId)
            // Tutup reminder modal sementara
            setShowReminderModal(false)
          }}
          />
        )}

        {/* Schedule Reminder Modal - For tasks related to tomorrow's classes */}
        {/* Permission Indicator */}
        {session && isOnlyRead && (
        <div
          className="subscription-fade-in"
          style={{
            position: 'fixed',
            bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0))',
            right: '1.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            zIndex: 998,
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangleIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <span>Hanya Baca - Tidak dapat membuat/mengedit</span>
        </div>
        )}

        {/* Subscription Warning */}
        {session && !isAdmin && isSubscriptionExpired && (
          <div
          className="subscription-fade-in"
          style={{
            position: 'fixed',
            bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0))',
            right: '1.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            zIndex: 998,
            boxShadow: 'var(--shadow)',
            maxWidth: '300px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}
        >
          <AlertTriangleIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '0.125rem' }} />
          <span>Subscription habis - Tidak dapat membuat/mengedit</span>
          </div>
        )}

        {/* Feedback FAB - Above Create Thread Button */}
        {(session || hasSessionCookie) && (
          <div 
          className="feedback-fab-container fab-feedback-container"
          style={{
            position: 'fixed',
            bottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))', // Desktop default, CSS overrides for mobile
            right: '1.5rem',
            zIndex: 999, // Lower than quickview overlay (1000)
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.5rem'
          }}
        >
          {/* Tooltip - Hidden on mobile */}
          {showFeedbackTooltip && (
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              maxWidth: '280px',
              width: 'calc(100vw - 3rem)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text)',
              lineHeight: '1.5',
              animation: 'fadeIn 0.2s ease-out',
              position: 'relative'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--primary)' }}>
                Saran & Masukan
              </div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.8125rem' }}>
                Berikan saran dan masukan Anda untuk membantu TuntasinAja semakin berkembang
              </div>
              {/* Arrow pointing down */}
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                right: '20px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid var(--border)'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-7px',
                right: '20px',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid var(--bg-primary)'
              }} />
            </div>
          )}

          {/* Feedback Button */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="feedback-fab-button"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: 0,
              position: 'relative',
              animation: 'fadeInUp 0.5s ease-out 0.2s both, pulse 2s ease-in-out infinite 1s'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 640) {
                setShowFeedbackTooltip(true)
                e.currentTarget.style.background = 'var(--primary-dark)'
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              setShowFeedbackTooltip(false)
              e.currentTarget.style.background = 'var(--primary)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'var(--primary-dark)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'var(--primary)'
            }}
            aria-label="Saran dan Masukan - Berikan saran dan masukan Anda untuk membantu TuntasinAja semakin berkembang"
          >
            <MessageIcon size={24} />
          </button>
          </div>
        )}

        {/* Floating Action Button - Create Thread */}
        {(session || hasSessionCookie) && canActuallyPostEdit && (
          <button
          onClick={() => setShowCreateForm(true)}
          className="fab-button fab-create-thread"
          style={{
            position: 'fixed',
            bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))', // Desktop default, CSS overrides for mobile
            right: '1.5rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 999, // Lower than quickview overlay (1000)
            transition: 'all 0.3s ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-dark)'
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--primary)'
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          aria-label="Buat PR Baru"
        >
          <PlusIcon size={24} />
          {uncompletedCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              {uncompletedCount > 99 ? '99+' : uncompletedCount}
            </span>
          )}
          </button>
        )}

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      </Layout>
  )
}
