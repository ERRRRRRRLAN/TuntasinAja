'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/ToastContainer'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { XCloseIcon, EditIcon, TrashIcon, UserIcon } from '@/components/ui/Icons'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useBackHandler } from '@/hooks/useBackHandler'

interface EditUserQuickViewProps {
  userId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function EditUserQuickView({ userId, onClose, onSuccess }: EditUserQuickViewProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permission, setPermission] = useState<'only_read' | 'read_and_post_edit'>('read_and_post_edit')
  const [canCreateAnnouncement, setCanCreateAnnouncement] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: users } = trpc.danton.getClassUsers.useQuery(undefined, {
    refetchOnWindowFocus: false, // Disable to prevent flickering
    staleTime: 60000, // Cache for 1 minute
  })
  const user = users?.find(u => u.id === userId)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPassword('')
      setPermission(user.permission || 'read_and_post_edit')
      setCanCreateAnnouncement(user.canCreateAnnouncement || false)
    }
  }, [user])

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(true)

  const handleCloseQuickView = useCallback(() => {
    setIsQuickViewOpen(false)
    
    // Add closing class for animation
    if (overlayRef.current) {
      overlayRef.current.classList.add('closing')
    }
    if (contentRef.current) {
      contentRef.current.classList.add('closing')
    }
    
    setIsVisible(false)
    
    // Wait for animation to complete before closing
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }, [onClose])

  useEffect(() => {
    setIsQuickViewOpen(true)
    setIsVisible(false)
    
    // Lock body scroll when quickview is open (mobile)
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    // Push state untuk back handler
    window.history.pushState({ quickview: true }, '')
    
    // Small delay to ensure DOM is ready before showing
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
    
    return () => {
      setIsQuickViewOpen(false)
      setIsVisible(false)
      
      // Unlock body scroll when quickview is closed
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      
      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Handle browser back button untuk quickview
  const [shouldHandleBack, setShouldHandleBack] = useState(false)
  
  useEffect(() => {
    if (isQuickViewOpen && isVisible) {
      const timer = setTimeout(() => {
        setShouldHandleBack(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShouldHandleBack(false)
    }
  }, [isQuickViewOpen, isVisible])

  useBackHandler(shouldHandleBack, handleCloseQuickView)

  const utils = trpc.useUtils()

  const editUser = trpc.danton.editUserData.useMutation({
    onSuccess: () => {
      toast.success('Data user berhasil diupdate')
      utils.danton.getClassUsers.invalidate()
      utils.danton.getClassStats.invalidate()
      if (onSuccess) onSuccess()
      handleCloseQuickView()
    },
    onError: (error: any) => {
      console.error('Error editing user:', error)
      toast.error(error.message || 'Gagal mengupdate user. Silakan coba lagi.')
    },
  })

  const updatePermission = trpc.danton.updateUserPermission.useMutation({
    onSuccess: () => {
      toast.success('Permission berhasil diupdate')
      utils.danton.getClassUsers.invalidate()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      console.error('Error updating permission:', error)
      toast.error(error.message || 'Gagal mengupdate permission. Silakan coba lagi.')
    },
  })

  const deleteUser = trpc.danton.deleteUserFromClass.useMutation({
    onSuccess: () => {
      toast.success('User berhasil dihapus')
      utils.danton.getClassUsers.invalidate()
      utils.danton.getClassStats.invalidate()
      setShowDeleteDialog(false)
      handleCloseQuickView()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Gagal menghapus user. Silakan coba lagi.')
      setShowDeleteDialog(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const updateData: any = {
      userId,
      name,
      email,
    }

    if (password.trim()) {
      updateData.password = password
    }

    editUser.mutate(updateData)
  }

  const handlePermissionChange = (newPermission: 'only_read' | 'read_and_post_edit') => {
    setPermission(newPermission)
    updatePermission.mutate({
      userId,
      permission: newPermission,
      canCreateAnnouncement,
    })
  }

  const handleCanCreateAnnouncementChange = (value: boolean) => {
    setCanCreateAnnouncement(value)
    updatePermission.mutate({
      userId,
      permission,
      canCreateAnnouncement: value,
    })
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="quickview-overlay"
        className={`quickview-overlay ${!isVisible ? 'closing' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
          if (e.target === overlayRef.current) {
            handleCloseQuickView()
          }
        }}
      >
        <div
          ref={contentRef}
          className={`quickview-content ${!isVisible ? 'closing' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card)',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div className="quickview-header">
            <div className="quickview-header-top">
              <div className="quickview-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserIcon size={20} style={{ color: 'var(--text-light)' }} />
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                    Edit User
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseQuickView}
                className="quickview-close-btn"
                style={{
                  background: 'var(--card)',
                  border: '2px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  padding: '0.625rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.5rem',
                  minWidth: '44px',
                  minHeight: '44px',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.color = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--card)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                aria-label="Tutup"
              >
                <XCloseIcon size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="quickview-body" style={{ padding: '1.5rem' }}>
            {/* User Info */}
            <div style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <p style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-light)',
                    fontWeight: 500
                  }}>
                    Nama
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                    {user.name}
                  </p>
                </div>
                <div>
                  <p style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-light)',
                    fontWeight: 500
                  }}>
                    Email
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    {user.email}
                  </p>
                </div>
                <div>
                  <p style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-light)',
                    fontWeight: 500
                  }}>
                    Terdaftar
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                {user.isDanton && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      background: '#fbbf24',
                      color: '#78350f',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      Danton
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Permission Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <EditIcon size={16} style={{ color: 'var(--text-light)' }} />
                Permission
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: permission === 'read_and_post_edit' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: permission === 'read_and_post_edit' ? 'var(--bg-primary)' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="permission"
                    value="read_and_post_edit"
                    checked={permission === 'read_and_post_edit'}
                    onChange={() => handlePermissionChange('read_and_post_edit')}
                    disabled={updatePermission.isLoading}
                    style={{ marginTop: '0.125rem', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Read & Post/Edit</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      User dapat membaca, membuat, dan mengedit tugas/sub tugas
                    </div>
                  </div>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: permission === 'only_read' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: permission === 'only_read' ? 'var(--bg-primary)' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="permission"
                    value="only_read"
                    checked={permission === 'only_read'}
                    onChange={() => handlePermissionChange('only_read')}
                    disabled={updatePermission.isLoading}
                    style={{ marginTop: '0.125rem', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Only Read</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      User hanya dapat membaca, tidak dapat membuat atau mengedit
                    </div>
                  </div>
                </label>
                
                {/* Can Create Announcement Checkbox */}
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--card)',
                  border: '1px solid var(--border)'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={canCreateAnnouncement}
                      onChange={(e) => handleCanCreateAnnouncementChange(e.target.checked)}
                      disabled={updatePermission.isLoading}
                      style={{ 
                        cursor: 'pointer', 
                        width: '18px', 
                        height: '18px',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Bisa Membuat Pengumuman</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        User dapat membuat pengumuman untuk kelas mereka sendiri
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <EditIcon size={16} style={{ color: 'var(--text-light)' }} />
                Edit Data User
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="edit-name">
                    Nama
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={3}
                    disabled={editUser.isLoading}
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="edit-email">
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={editUser.isLoading}
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" htmlFor="edit-password">
                    Password (Kosongkan jika tidak ingin mengubah)
                  </label>
                  <input
                    id="edit-password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    disabled={editUser.isLoading}
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editUser.isLoading || !name.trim() || !email.trim()}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      padding: '0.625rem 1.25rem',
                    }}
                  >
                    {editUser.isLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <LoadingSpinner size={16} color="white" />
                        Menyimpan...
                      </span>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>

                  {!user.isDanton && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteDialog(true)}
                      className="btn"
                      disabled={deleteUser.isLoading}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '0.625rem 1.25rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: deleteUser.isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <TrashIcon size={16} />
                      Hapus User
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Hapus User?"
        message={`Apakah Anda yakin ingin menghapus ${user.name} dari kelas? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={deleteUser.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        disabled={deleteUser.isLoading}
        onConfirm={() => {
          if (!deleteUser.isLoading) {
            deleteUser.mutate({ userId })
          }
        }}
        onCancel={() => {
          if (!deleteUser.isLoading) {
            setShowDeleteDialog(false)
          }
        }}
      />
    </>
  )
}

