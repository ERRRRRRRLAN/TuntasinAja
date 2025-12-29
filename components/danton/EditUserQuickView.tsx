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
import RadioButton from '@/components/ui/RadioButton'
import Checkbox from '@/components/ui/Checkbox'

interface EditUserQuickViewProps {
  userId: string
  onClose: () => void
  onSuccess?: () => void
}

export default function EditUserQuickView({ userId, onClose, onSuccess }: EditUserQuickViewProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permission, setPermission] = useState<'only_read' | 'read_and_post_edit'>('read_and_post_edit')
  const [canCreateAnnouncement, setCanCreateAnnouncement] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

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
    setIsVisible(false)
    
    // Wait for transition to complete before closing
    setTimeout(() => {
      onClose()
    }, 300) // Match transition duration
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
      console.log('[SUCCESS] Data user berhasil diupdate')
      utils.danton.getClassUsers.invalidate()
      utils.danton.getClassStats.invalidate()
      if (onSuccess) onSuccess()
      handleCloseQuickView()
    },
    onError: (error: any) => {
      console.error('Error editing user:', error)
      console.error('[ERROR]', error.message || 'Gagal mengupdate user. Silakan coba lagi.')
    },
  })

  const updatePermission = trpc.danton.updateUserPermission.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] Permission berhasil diupdate')
      utils.danton.getClassUsers.invalidate()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      console.error('Error updating permission:', error)
      console.error('[ERROR]', error.message || 'Gagal mengupdate permission. Silakan coba lagi.')
    },
  })

  const deleteUser = trpc.danton.deleteUserFromClass.useMutation({
    onSuccess: () => {
      console.log('[SUCCESS] User berhasil dihapus')
      utils.danton.getClassUsers.invalidate()
      utils.danton.getClassStats.invalidate()
      setShowDeleteDialog(false)
      handleCloseQuickView()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error)
      console.error('[ERROR]', error.message || 'Gagal menghapus user. Silakan coba lagi.')
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
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
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
          className="quickview-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card)',
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div className="quickview-header" style={{ position: 'relative' }}>
            <div className="quickview-header-top">
              <div className="quickview-header-left" style={{ paddingRight: isMobile ? '88px' : '88px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserIcon size={20} style={{ color: 'var(--text-light)' }} />
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                    Edit User
                  </h2>
                </div>
              </div>
            </div>
            
            {/* Right: Actions & Close - Always on the right top corner */}
            <div style={{ 
              position: 'absolute',
              top: isMobile ? `calc(1rem + env(safe-area-inset-top, 0px))` : '1.5rem',
              right: isMobile ? '1rem' : '1.5rem',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              flexShrink: 0,
              zIndex: 10,
            }}>
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteUser.isLoading}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: deleteUser.isLoading ? '#fca5a5' : 'transparent',
                  color: deleteUser.isLoading ? 'white' : 'var(--text-light)',
                  cursor: deleteUser.isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  minWidth: '36px',
                  minHeight: '36px',
                }}
                onMouseEnter={(e) => {
                  if (!deleteUser.isLoading) {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.color = '#ef4444'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteUser.isLoading) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-light)'
                  }
                }}
                title="Hapus User"
              >
                {deleteUser.isLoading ? (
                  <LoadingSpinner size={18} color="#ef4444" />
                ) : (
                  <TrashIcon size={18} />
                )}
              </button>
              <button
                onClick={handleCloseQuickView}
                className="quickview-close-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.5rem',
                  minWidth: '36px',
                  minHeight: '36px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-light)'
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
                  <div style={{ marginTop: '0.125rem', flexShrink: 0 }}>
                    <RadioButton
                      checked={permission === 'read_and_post_edit'}
                      onChange={() => handlePermissionChange('read_and_post_edit')}
                      disabled={updatePermission.isLoading}
                      size={18}
                    />
                  </div>
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
                  <div style={{ marginTop: '0.125rem', flexShrink: 0 }}>
                    <RadioButton
                      checked={permission === 'only_read'}
                      onChange={() => handlePermissionChange('only_read')}
                      disabled={updatePermission.isLoading}
                      size={18}
                    />
                  </div>
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
                    <Checkbox
                      checked={canCreateAnnouncement}
                      onChange={() => handleCanCreateAnnouncementChange(!canCreateAnnouncement)}
                      disabled={updatePermission.isLoading}
                      size={18}
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

