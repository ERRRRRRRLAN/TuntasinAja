'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import Header from '@/components/layout/Header'
import ThreadCard from '@/components/threads/ThreadCard'
import ThreadQuickView from '@/components/threads/ThreadQuickView'
import CreateThreadQuickView from '@/components/threads/CreateThreadQuickView'
import ReminderModal from '@/components/ui/ReminderModal'
import ScheduleReminderModal from '@/components/schedule/ScheduleReminderModal'
import { PlusIcon, SearchIcon, XIconSmall, BookIcon, BellIcon, AlertTriangleIcon } from '@/components/ui/Icons'
import ComboBox from '@/components/ui/ComboBox'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useUserPermission } from '@/hooks/useUserPermission'
import { useClassSubscription } from '@/hooks/useClassSubscription'
import { useScheduleReminder } from '@/hooks/useScheduleReminder'

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
  const { data: session, status: sessionStatus } = useSession()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedKelas, setSelectedKelas] = useState<string>('all')
  const [isDataValidated, setIsDataValidated] = useState(false)
  const [previousUserId, setPreviousUserId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showScheduleReminderModal, setShowScheduleReminderModal] = useState(false)
  const [hasCheckedReminder, setHasCheckedReminder] = useState(false)
  const [hasCheckedScheduleReminder, setHasCheckedScheduleReminder] = useState(false)
  const [threadOpenedFromReminder, setThreadOpenedFromReminder] = useState(false)

  // Get user data (kelas, isAdmin)
  const { data: userData, isLoading: isLoadingUserData } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: !!session,
  })
  const userKelas = userData?.kelas || null
  const isAdmin = userData?.isAdmin || false

  // Check user permission
  const { canPostEdit, isOnlyRead, permission } = useUserPermission()

  // Check subscription status (skip for admin)
  const { isActive: isSubscriptionActive, isExpired: isSubscriptionExpired } = useClassSubscription(isAdmin ? undefined : userKelas || undefined)

  // User can only post/edit if: has permission AND subscription is active (or admin)
  const canActuallyPostEdit = canPostEdit && (isAdmin || isSubscriptionActive)

  // Get threads - invalidate cache when user changes
  const utils = trpc.useUtils()
  const { data: threads, isLoading, isFetching, isRefetching } = trpc.thread.getAll.useQuery(undefined, {
    refetchInterval: 3000, // Auto refresh every 3 seconds (faster) - works in background
    refetchOnWindowFocus: true, // Refetch when user returns to tab - works in background
    enabled: sessionStatus !== 'loading' && !isLoadingUserData, // Only fetch when session and user data are ready
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
  })

  // Track initial load completion
  useEffect(() => {
    if (!isLoading && threads && isDataValidated) {
      setIsInitialLoad(false)
    }
  }, [isLoading, threads, isDataValidated])

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
    }
  }, [session?.user?.id, previousUserId, utils])

  // Validate that displayed threads match user's kelas
  useEffect(() => {
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
    } else if (isAdmin || !userKelas) {
      // Admin or no kelas - always valid
      setIsDataValidated(true)
    }
  }, [threads, userKelas, isAdmin, utils, isInitialLoad])

  // Get uncompleted comments count
  const { data: uncompletedData } = trpc.userStatus.getUncompletedCount.useQuery(
    undefined,
    {
      enabled: !!session && isDataValidated,
      refetchInterval: 3000, // Auto refresh every 3 seconds
      refetchOnWindowFocus: true,
    }
  )

  // Get overdue tasks for reminder (for all users) - always fetch to show badge
  const { data: overdueData } = trpc.userStatus.getOverdueTasks.useQuery(
    undefined,
    {
      enabled: !!session && isDataValidated,
    }
  )

  // Get schedule reminder (check if tomorrow has classes with tasks)
  const { tasks: scheduleTasks, subjects: scheduleSubjects, tomorrow: tomorrowDate, hasReminder: hasScheduleReminder, isLoading: isLoadingScheduleReminder } = useScheduleReminder()

  const kelasOptions = generateKelasOptions()
  const uncompletedCount = uncompletedData?.uncompletedCount || 0
  const overdueTasks = overdueData?.overdueTasks || []

  // Show reminder modal automatically when user logs in and there are overdue tasks (for all users)
  // Only show once per session
  useEffect(() => {
    if (
      session &&
      isDataValidated &&
      !hasCheckedReminder &&
      overdueTasks.length > 0
    ) {
      setShowReminderModal(true)
      setHasCheckedReminder(true)
    }
  }, [session, isDataValidated, hasCheckedReminder, overdueTasks.length])

  // Show schedule reminder modal automatically when user logs in and there are tasks for tomorrow's classes
  // Only show once per session
  useEffect(() => {
    // Debug logging
    if (session && isDataValidated && !isLoadingScheduleReminder) {
      console.log('[Schedule Reminder Debug]', {
        hasCheckedScheduleReminder,
        hasScheduleReminder,
        scheduleTasksLength: scheduleTasks.length,
        scheduleSubjectsLength: scheduleSubjects.length,
        showReminderModal,
        overdueTasksLength: overdueTasks.length,
        tomorrowDate,
      })
    }

    if (
      session &&
      isDataValidated &&
      !hasCheckedScheduleReminder &&
      !isLoadingScheduleReminder &&
      scheduleTasks.length > 0 && // Must have tasks
      scheduleSubjects.length > 0 // Must have subjects
    ) {
      // If overdue reminder is showing, wait for it to close first
      if (showReminderModal) {
        // Wait for overdue reminder to close, then show schedule reminder
        const checkInterval = setInterval(() => {
          if (!showReminderModal) {
            clearInterval(checkInterval)
            setShowScheduleReminderModal(true)
            setHasCheckedScheduleReminder(true)
          }
        }, 500)
        return () => clearInterval(checkInterval)
      } else {
        // No overdue reminder, show schedule reminder immediately
        setShowScheduleReminderModal(true)
        setHasCheckedScheduleReminder(true)
      }
    }
  }, [session, isDataValidated, hasCheckedScheduleReminder, isLoadingScheduleReminder, scheduleTasks.length, scheduleSubjects.length, showReminderModal, overdueTasks.length, tomorrowDate])


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
  }, [threads, selectedSubject, selectedKelas, searchQuery, isAdmin, userKelas, isDataValidated])

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
                {session && overdueTasks.length > 0 && (
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

          {/* Only show loading on initial load, not during background refresh */}
          {(isLoading || isLoadingUserData || (isInitialLoad && !isDataValidated)) ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <LoadingSpinner size={32} />
              <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
                {isLoadingUserData ? 'Memuat data user...' : 'Memuat PR...'}
              </p>
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

      {/* Reminder Modal - For all users */}
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

      {/* Schedule Reminder Modal - For tasks related to tomorrow's classes */}
      <ScheduleReminderModal
        isOpen={showScheduleReminderModal}
        onClose={() => {
          setShowScheduleReminderModal(false)
          utils.schedule.getReminderTasks.invalidate()
        }}
        subjects={scheduleSubjects}
        tasks={scheduleTasks.map((task: any) => ({
          threadId: task.threadId,
          threadTitle: task.threadTitle,
          authorName: task.authorName,
          threadDate: new Date(task.threadDate),
        }))}
        tomorrow={tomorrowDate}
        onTaskClick={(threadId) => {
          setThreadOpenedFromReminder(true)
          setSelectedThreadId(threadId)
          setShowScheduleReminderModal(false)
        }}
      />

      {/* Permission Indicator */}
      {session && isOnlyRead && (
        <div
          className="subscription-fade-in"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
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
            bottom: '1.5rem',
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

      {/* Floating Action Button */}
      {session && canActuallyPostEdit && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="fab-button"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
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
            zIndex: 999,
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

    </>
  )
}
