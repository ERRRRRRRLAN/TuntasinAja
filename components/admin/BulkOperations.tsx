'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ComboBox from '@/components/ui/ComboBox'
import { format } from 'date-fns'

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

export default function BulkOperations() {
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions' | 'content' | 'migration'>('users')
  const utils = trpc.useUtils()

  // Get all users for selection
  const { data: users } = trpc.auth.getAllUsers.useQuery()
  const { data: subscriptions } = trpc.subscription.getAllClassSubscriptions.useQuery()

  // User Management States
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkKelas, setBulkKelas] = useState<string>('')
  const [bulkPermission, setBulkPermission] = useState<'only_read' | 'read_and_post_edit'>('read_and_post_edit')
  const [showUserKelasConfirm, setShowUserKelasConfirm] = useState(false)
  const [showUserPermissionConfirm, setShowUserPermissionConfirm] = useState(false)

  // Subscription Management States
  const [selectedKelasList, setSelectedKelasList] = useState<Set<string>>(new Set())
  const [subscriptionDays, setSubscriptionDays] = useState<number>(30)
  const [showExtendConfirm, setShowExtendConfirm] = useState(false)
  const [showSetConfirm, setShowSetConfirm] = useState(false)
  const [showExpireConfirm, setShowExpireConfirm] = useState(false)

  // Content Management States
  const [deleteStartDate, setDeleteStartDate] = useState<string>('')
  const [deleteEndDate, setDeleteEndDate] = useState<string>('')
  const [deleteKelas, setDeleteKelas] = useState<string>('')
  const [showDeleteThreadsConfirm, setShowDeleteThreadsConfirm] = useState(false)
  const [showDeleteCommentsConfirm, setShowDeleteCommentsConfirm] = useState(false)

  // Migration States
  const [migrationUserIds, setMigrationUserIds] = useState<Set<string>>(new Set())
  const [targetKelas, setTargetKelas] = useState<string>('')
  const [showMoveConfirm, setShowMoveConfirm] = useState(false)
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)

  const kelasOptions = generateKelasOptions()

  // User Management Mutations
  const bulkEditKelas = trpc.bulkOperations.bulkEditUserKelas.useMutation({
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success(`Berhasil mengubah kelas ${data.success} user`)
      }
      if (data.failed > 0) {
        toast.error(`Gagal mengubah ${data.failed} user: ${data.errors.join('; ')}`)
      }
      setShowUserKelasConfirm(false)
      setSelectedUserIds(new Set())
      setBulkKelas('')
      utils.auth.getAllUsers.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengubah kelas user')
      setShowUserKelasConfirm(false)
    },
  })

  const bulkSetPermission = trpc.bulkOperations.bulkSetUserPermission.useMutation({
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success(`Berhasil mengubah permission ${data.success} user`)
      }
      if (data.failed > 0) {
        toast.error(`Gagal mengubah ${data.failed} user: ${data.errors.join('; ')}`)
      }
      setShowUserPermissionConfirm(false)
      setSelectedUserIds(new Set())
      utils.auth.getAllUsers.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengubah permission user')
      setShowUserPermissionConfirm(false)
    },
  })

  // Subscription Management Mutations
  const bulkExtendSubscription = trpc.bulkOperations.bulkExtendSubscription.useMutation({
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success(`Berhasil extend subscription ${data.success} kelas`)
      }
      if (data.failed > 0) {
        toast.error(`Gagal extend ${data.failed} kelas: ${data.errors.join('; ')}`)
      }
      setShowExtendConfirm(false)
      setSelectedKelasList(new Set())
      utils.subscription.getAllClassSubscriptions.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal extend subscription')
      setShowExtendConfirm(false)
    },
  })

  const bulkSetSubscription = trpc.bulkOperations.bulkSetSubscription.useMutation({
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success(`Berhasil set subscription ${data.success} kelas`)
      }
      if (data.failed > 0) {
        toast.error(`Gagal set ${data.failed} kelas: ${data.errors.join('; ')}`)
      }
      setShowSetConfirm(false)
      setSelectedKelasList(new Set())
      utils.subscription.getAllClassSubscriptions.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal set subscription')
      setShowSetConfirm(false)
    },
  })

  const bulkExpireSubscription = trpc.bulkOperations.bulkExpireSubscription.useMutation({
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success(`Berhasil expire subscription ${data.success} kelas`)
      }
      if (data.failed > 0) {
        toast.error(`Gagal expire ${data.failed} kelas: ${data.errors.join('; ')}`)
      }
      setShowExpireConfirm(false)
      setSelectedKelasList(new Set())
      utils.subscription.getAllClassSubscriptions.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal expire subscription')
      setShowExpireConfirm(false)
    },
  })

  // Content Management Mutations
  const bulkDeleteThreads = trpc.bulkOperations.bulkDeleteThreads.useMutation({
    onSuccess: (data) => {
      toast.success(data.message)
      setShowDeleteThreadsConfirm(false)
      setDeleteStartDate('')
      setDeleteEndDate('')
      setDeleteKelas('')
      utils.thread.getAll.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus thread')
      setShowDeleteThreadsConfirm(false)
    },
  })

  const bulkDeleteComments = trpc.bulkOperations.bulkDeleteComments.useMutation({
    onSuccess: (data) => {
      toast.success(data.message)
      setShowDeleteCommentsConfirm(false)
      setDeleteStartDate('')
      setDeleteEndDate('')
      utils.thread.getAll.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus comment')
      setShowDeleteCommentsConfirm(false)
    },
  })

  // Migration Mutations
  const moveUsers = trpc.bulkOperations.moveUsersBetweenKelas.useMutation({
    onSuccess: (data) => {
      toast.success(data.message)
      setShowMoveConfirm(false)
      setMigrationUserIds(new Set())
      setTargetKelas('')
      utils.auth.getAllUsers.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal memindahkan user')
      setShowMoveConfirm(false)
    },
  })

  const cleanupOrphaned = trpc.bulkOperations.cleanupOrphanedUserStatuses.useMutation({
    onSuccess: (data) => {
      toast.success(data.message)
      setShowCleanupConfirm(false)
      utils.database.getStats.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal cleanup orphaned data')
      setShowCleanupConfirm(false)
    },
  })

  // Helper functions
  const toggleUserSelection = (userId: string) => {
    const newSet = new Set(selectedUserIds)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedUserIds(newSet)
  }

  const toggleKelasSelection = (kelas: string) => {
    const newSet = new Set(selectedKelasList)
    if (newSet.has(kelas)) {
      newSet.delete(kelas)
    } else {
      newSet.add(kelas)
    }
    setSelectedKelasList(newSet)
  }

  const toggleMigrationUser = (userId: string) => {
    const newSet = new Set(migrationUserIds)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setMigrationUserIds(newSet)
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '1.5rem',
        fontSize: '1.25rem',
        fontWeight: 600,
      }}>
        🔧 Bulk Operations & Tools
      </h3>

      {/* Warning */}
      <div style={{
        padding: '0.75rem',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: 'var(--text-light)',
        marginBottom: '1.5rem',
      }}>
        <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text)' }}>
          ⚠️ Peringatan:
        </strong>
        <p style={{ margin: 0 }}>
          Operasi bulk akan mempengaruhi banyak data sekaligus. Pastikan untuk memilih data dengan benar dan backup data penting sebelum melakukan operasi bulk.
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'users' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'users' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'users' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          👥 User Management
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'subscriptions' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'subscriptions' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'subscriptions' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'subscriptions' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          🎫 Subscription Management
        </button>
        <button
          onClick={() => setActiveTab('content')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'content' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'content' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'content' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'content' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          📝 Content Management
        </button>
        <button
          onClick={() => setActiveTab('migration')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'migration' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'migration' ? 'white' : 'var(--text-light)',
            border: 'none',
            borderBottom: activeTab === 'migration' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: activeTab === 'migration' ? 600 : 400,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          🔄 Data Migration
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            Pilih User untuk Operasi Bulk
          </h4>
          
          {/* User Selection */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
          }}>
            {users && users.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {users.map((user) => (
                  <label
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      backgroundColor: selectedUserIds.has(user.id) ? 'var(--bg-secondary)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                      {user.name} ({user.email}) {user.kelas ? `- ${user.kelas}` : ''}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1rem' }}>
                Tidak ada user
              </p>
            )}
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
            Terpilih: {selectedUserIds.size} user
          </div>

          {/* Bulk Edit Kelas */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Ubah Kelas
            </h5>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <ComboBox
                  options={kelasOptions}
                  value={bulkKelas}
                  onChange={setBulkKelas}
                  placeholder="Pilih kelas"
                />
              </div>
              <button
                onClick={() => {
                  if (selectedUserIds.size === 0) {
                    toast.error('Pilih minimal satu user')
                    return
                  }
                  setShowUserKelasConfirm(true)
                }}
                disabled={bulkEditKelas.isLoading || selectedUserIds.size === 0}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {bulkEditKelas.isLoading ? 'Mengubah...' : 'Ubah Kelas'}
              </button>
            </div>
          </div>

          {/* Bulk Set Permission */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Ubah Permission
            </h5>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <select
                  value={bulkPermission}
                  onChange={(e) => setBulkPermission(e.target.value as 'only_read' | 'read_and_post_edit')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="read_and_post_edit">Read & Post/Edit</option>
                  <option value="only_read">Only Read</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (selectedUserIds.size === 0) {
                    toast.error('Pilih minimal satu user')
                    return
                  }
                  setShowUserPermissionConfirm(true)
                }}
                disabled={bulkSetPermission.isLoading || selectedUserIds.size === 0}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {bulkSetPermission.isLoading ? 'Mengubah...' : 'Ubah Permission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            Pilih Kelas untuk Operasi Bulk
          </h4>

          {/* Kelas Selection */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {kelasOptions.map((kelas) => (
                <label
                  key={kelas}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    backgroundColor: selectedKelasList.has(kelas) ? 'var(--bg-secondary)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedKelasList.has(kelas)}
                    onChange={() => toggleKelasSelection(kelas)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                    {kelas}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
            Terpilih: {selectedKelasList.size} kelas
          </div>

          {/* Bulk Extend Subscription */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Extend Subscription
            </h5>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <input
                  type="number"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={3650}
                  placeholder="Hari"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (selectedKelasList.size === 0) {
                    toast.error('Pilih minimal satu kelas')
                    return
                  }
                  setShowExtendConfirm(true)
                }}
                disabled={bulkExtendSubscription.isLoading || selectedKelasList.size === 0}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {bulkExtendSubscription.isLoading ? 'Extending...' : 'Extend Subscription'}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Extend dari tanggal berakhir saat ini
            </div>
          </div>

          {/* Bulk Set Subscription */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Set Subscription (Reset dari sekarang)
            </h5>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <input
                  type="number"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={3650}
                  placeholder="Hari"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (selectedKelasList.size === 0) {
                    toast.error('Pilih minimal satu kelas')
                    return
                  }
                  setShowSetConfirm(true)
                }}
                disabled={bulkSetSubscription.isLoading || selectedKelasList.size === 0}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {bulkSetSubscription.isLoading ? 'Setting...' : 'Set Subscription'}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Set subscription baru dari sekarang (reset)
            </div>
          </div>

          {/* Bulk Expire Subscription */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Expire Subscription
            </h5>
            <button
              onClick={() => {
                if (selectedKelasList.size === 0) {
                  toast.error('Pilih minimal satu kelas')
                  return
                }
                setShowExpireConfirm(true)
              }}
              disabled={bulkExpireSubscription.isLoading || selectedKelasList.size === 0}
              className="btn"
              style={{
                minWidth: '150px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                border: 'none',
              }}
            >
              {bulkExpireSubscription.isLoading ? 'Expiring...' : 'Expire Subscription'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Set subscription menjadi expired (kemarin)
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            Bulk Delete Content
          </h4>

          {/* Date Range */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Filter Tanggal (Opsional)
            </h5>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={deleteStartDate}
                  onChange={(e) => setDeleteStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={deleteEndDate}
                  onChange={(e) => setDeleteEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  Filter Kelas (Opsional)
                </label>
                <ComboBox
                  options={kelasOptions}
                  value={deleteKelas}
                  onChange={setDeleteKelas}
                  placeholder="Pilih kelas (kosongkan untuk semua kelas)"
                />
              </div>
            </div>
          </div>

          {/* Bulk Delete Threads */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Hapus Thread
            </h5>
            <button
              onClick={() => setShowDeleteThreadsConfirm(true)}
              disabled={bulkDeleteThreads.isLoading}
              className="btn"
              style={{
                backgroundColor: 'var(--danger)',
                color: 'white',
                border: 'none',
              }}
            >
              {bulkDeleteThreads.isLoading ? 'Menghapus...' : 'Hapus Thread'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Hapus thread berdasarkan filter tanggal dan kelas di atas
            </div>
          </div>

          {/* Bulk Delete Comments */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Hapus Comments
            </h5>
            <button
              onClick={() => setShowDeleteCommentsConfirm(true)}
              disabled={bulkDeleteComments.isLoading}
              className="btn"
              style={{
                backgroundColor: 'var(--danger)',
                color: 'white',
                border: 'none',
              }}
            >
              {bulkDeleteComments.isLoading ? 'Menghapus...' : 'Hapus Comments'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Hapus comment berdasarkan filter tanggal di atas
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <div>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            Data Migration & Cleanup
          </h4>

          {/* Move Users Between Kelas */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Pindahkan User ke Kelas Lain
            </h5>
            
            {/* User Selection */}
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
            }}>
              {users && users.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {users.map((user) => (
                    <label
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        backgroundColor: migrationUserIds.has(user.id) ? 'var(--bg-secondary)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={migrationUserIds.has(user.id)}
                        onChange={() => toggleMigrationUser(user.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                        {user.name} ({user.email}) {user.kelas ? `- ${user.kelas}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1rem' }}>
                  Tidak ada user
                </p>
              )}
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
              Terpilih: {migrationUserIds.size} user
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <ComboBox
                  options={kelasOptions}
                  value={targetKelas}
                  onChange={setTargetKelas}
                  placeholder="Pilih kelas tujuan"
                />
              </div>
              <button
                onClick={() => {
                  if (migrationUserIds.size === 0) {
                    toast.error('Pilih minimal satu user')
                    return
                  }
                  if (!targetKelas) {
                    toast.error('Pilih kelas tujuan')
                    return
                  }
                  setShowMoveConfirm(true)
                }}
                disabled={moveUsers.isLoading || migrationUserIds.size === 0 || !targetKelas}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {moveUsers.isLoading ? 'Memindahkan...' : 'Pindahkan User'}
              </button>
            </div>
          </div>

          {/* Cleanup Orphaned Data */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <h5 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Cleanup Orphaned User Statuses
            </h5>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
              Menghapus user statuses yang merujuk ke thread atau comment yang sudah tidak ada.
            </p>
            <button
              onClick={() => setShowCleanupConfirm(true)}
              disabled={cleanupOrphaned.isLoading}
              className="btn"
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
              }}
            >
              {cleanupOrphaned.isLoading ? 'Cleaning up...' : 'Cleanup Orphaned Data'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {showUserKelasConfirm && (
        <ConfirmDialog
          isOpen={showUserKelasConfirm}
          onCancel={() => setShowUserKelasConfirm(false)}
          onConfirm={() => {
            bulkEditKelas.mutate({
              userIds: Array.from(selectedUserIds),
              kelas: bulkKelas || null,
            })
          }}
          title="Ubah Kelas User?"
          message={`Apakah Anda yakin ingin mengubah kelas ${selectedUserIds.size} user menjadi "${bulkKelas || 'null'}"?`}
          confirmText="Ya, Ubah"
          cancelText="Batal"
        />
      )}

      {showUserPermissionConfirm && (
        <ConfirmDialog
          isOpen={showUserPermissionConfirm}
          onCancel={() => setShowUserPermissionConfirm(false)}
          onConfirm={() => {
            bulkSetPermission.mutate({
              userIds: Array.from(selectedUserIds),
              permission: bulkPermission,
            })
          }}
          title="Ubah Permission User?"
          message={`Apakah Anda yakin ingin mengubah permission ${selectedUserIds.size} user menjadi "${bulkPermission === 'only_read' ? 'Only Read' : 'Read & Post/Edit'}"?`}
          confirmText="Ya, Ubah"
          cancelText="Batal"
        />
      )}

      {showExtendConfirm && (
        <ConfirmDialog
          isOpen={showExtendConfirm}
          onCancel={() => setShowExtendConfirm(false)}
          onConfirm={() => {
            bulkExtendSubscription.mutate({
              kelasList: Array.from(selectedKelasList),
              days: subscriptionDays,
            })
          }}
          title="Extend Subscription?"
          message={`Apakah Anda yakin ingin extend subscription ${selectedKelasList.size} kelas selama ${subscriptionDays} hari?`}
          confirmText="Ya, Extend"
          cancelText="Batal"
        />
      )}

      {showSetConfirm && (
        <ConfirmDialog
          isOpen={showSetConfirm}
          onCancel={() => setShowSetConfirm(false)}
          onConfirm={() => {
            bulkSetSubscription.mutate({
              kelasList: Array.from(selectedKelasList),
              days: subscriptionDays,
            })
          }}
          title="Set Subscription?"
          message={`Apakah Anda yakin ingin set subscription ${selectedKelasList.size} kelas selama ${subscriptionDays} hari (reset dari sekarang)?`}
          confirmText="Ya, Set"
          cancelText="Batal"
        />
      )}

      {showExpireConfirm && (
        <ConfirmDialog
          isOpen={showExpireConfirm}
          onCancel={() => setShowExpireConfirm(false)}
          onConfirm={() => {
            bulkExpireSubscription.mutate({
              kelasList: Array.from(selectedKelasList),
            })
          }}
          title="Expire Subscription?"
          message={`Apakah Anda yakin ingin expire subscription ${selectedKelasList.size} kelas?`}
          confirmText="Ya, Expire"
          cancelText="Batal"
        />
      )}

      {showDeleteThreadsConfirm && (
        <ConfirmDialog
          isOpen={showDeleteThreadsConfirm}
          onCancel={() => setShowDeleteThreadsConfirm(false)}
          onConfirm={() => {
            bulkDeleteThreads.mutate({
              startDate: deleteStartDate ? new Date(deleteStartDate) : undefined,
              endDate: deleteEndDate ? new Date(deleteEndDate) : undefined,
              kelas: deleteKelas || undefined,
              confirm: true,
            })
          }}
          title="Hapus Thread?"
          message={`Apakah Anda yakin ingin menghapus thread berdasarkan filter yang dipilih? Operasi ini tidak dapat dibatalkan!`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
        />
      )}

      {showDeleteCommentsConfirm && (
        <ConfirmDialog
          isOpen={showDeleteCommentsConfirm}
          onCancel={() => setShowDeleteCommentsConfirm(false)}
          onConfirm={() => {
            bulkDeleteComments.mutate({
              startDate: deleteStartDate ? new Date(deleteStartDate) : undefined,
              endDate: deleteEndDate ? new Date(deleteEndDate) : undefined,
              confirm: true,
            })
          }}
          title="Hapus Comments?"
          message={`Apakah Anda yakin ingin menghapus comments berdasarkan filter yang dipilih? Operasi ini tidak dapat dibatalkan!`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
        />
      )}

      {showMoveConfirm && (
        <ConfirmDialog
          isOpen={showMoveConfirm}
          onCancel={() => setShowMoveConfirm(false)}
          onConfirm={() => {
            moveUsers.mutate({
              userIds: Array.from(migrationUserIds),
              targetKelas: targetKelas || null,
            })
          }}
          title="Pindahkan User?"
          message={`Apakah Anda yakin ingin memindahkan ${migrationUserIds.size} user ke kelas "${targetKelas}"?`}
          confirmText="Ya, Pindahkan"
          cancelText="Batal"
        />
      )}

      {showCleanupConfirm && (
        <ConfirmDialog
          isOpen={showCleanupConfirm}
          onCancel={() => setShowCleanupConfirm(false)}
          onConfirm={() => {
            cleanupOrphaned.mutate({ confirm: true })
          }}
          title="Cleanup Orphaned Data?"
          message="Apakah Anda yakin ingin menghapus orphaned user statuses? Operasi ini tidak dapat dibatalkan!"
          confirmText="Ya, Cleanup"
          cancelText="Batal"
        />
      )}
    </div>
  )
}

