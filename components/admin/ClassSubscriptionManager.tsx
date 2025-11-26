'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { XIconSmall } from '@/components/ui/Icons'
import { toast } from '@/components/ui/ToastContainer'

interface ClassSubscriptionManagerProps {
  kelas: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ClassSubscriptionManager({ kelas, onSuccess, onCancel }: ClassSubscriptionManagerProps) {
  const [days, setDays] = useState<number>(90)
  const [action, setAction] = useState<'set' | 'extend' | 'reduce'>('set')
  const [forceFromNow, setForceFromNow] = useState<boolean>(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const utils = trpc.useUtils()
  
  // Get current subscription to determine default action
  const { data: currentSubscription } = trpc.subscription.getClassSubscription.useQuery({ kelas })
  
  useEffect(() => {
    if (currentSubscription) {
      if (currentSubscription.status === 'no_subscription' || currentSubscription.status === 'expired') {
        setAction('set')
        setForceFromNow(true)
      } else {
        setAction('extend')
        setForceFromNow(false)
      }
    }
  }, [currentSubscription])

  const updateSubscription = trpc.subscription.updateClassSubscription.useMutation({
    onSuccess: () => {
      let successMessage = 'Subscription berhasil diupdate!'
      if (action === 'set') {
        successMessage = 'Subscription berhasil diatur!'
      } else if (action === 'extend') {
        successMessage = 'Subscription berhasil diperpanjang!'
      } else if (action === 'reduce') {
        successMessage = 'Subscription berhasil dikurangi!'
      }
      
      setSuccess(successMessage)
      setError('')
      utils.subscription.getAllClassSubscriptions.invalidate()
      utils.subscription.getClassSubscription.invalidate({ kelas })
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
      toast.success(successMessage)
    },
    onError: (err: any) => {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setSuccess('')
      toast.error(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate days based on action
    if (action === 'reduce') {
      // For reduce, days can be negative or positive (will be treated as positive for subtraction)
      if (!days || days === 0 || Math.abs(days) > 3650) {
        setError('Jumlah hari harus antara 1 sampai 3650 hari!')
        return
      }
    } else {
      // For set and extend, days must be positive
      if (!days || days < 1 || days > 3650) {
        setError('Durasi harus antara 1 sampai 3650 hari!')
        return
      }
    }

    updateSubscription.mutate({ 
      kelas, 
      action, 
      days: action === 'reduce' ? Math.abs(days) : days, // Ensure positive for reduce
      forceFromNow 
    })
  }

  const isLoading = updateSubscription.isLoading

  return (
    <div className="card subscription-fade-in" style={{ position: 'relative' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Edit Subscription Kelas
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-light)', fontSize: '0.875rem', wordBreak: 'break-word' }}>
            Kelas: <strong>{kelas}</strong>
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
              borderRadius: '0.375rem',
              transition: 'background 0.2s',
              minWidth: '44px',
              minHeight: '44px',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            title="Tutup"
          >
            <XIconSmall size={20} />
          </button>
        )}
      </div>

      {currentSubscription && currentSubscription.status !== 'no_subscription' && currentSubscription.status !== 'expired' && (
        <div className="subscription-fade-in" style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: 'var(--text-primary)'
        }}>
          <p style={{ margin: 0, fontWeight: 400 }}>
            Info: Subscription saat ini akan berakhir pada{' '}
            {currentSubscription.subscriptionEndDate && (
              new Date(currentSubscription.subscriptionEndDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            )}
            {' '}({currentSubscription.daysRemaining !== null ? currentSubscription.daysRemaining : 0} hari tersisa).
            {action === 'extend' && ' Durasi yang ditambahkan akan dihitung dari tanggal berakhir saat ini.'}
            {action === 'reduce' && ' Durasi yang dikurangi akan dihitung dari tanggal berakhir saat ini.'}
          </p>
        </div>
      )}

      {error && (
        <div className="subscription-fade-in" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div className="subscription-fade-in" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subscriptionAction" className="form-label">
            Aksi
          </label>
          <select
            id="subscriptionAction"
            value={action}
            onChange={(e) => {
              const newAction = e.target.value as 'set' | 'extend' | 'reduce'
              setAction(newAction)
              // Auto-adjust forceFromNow based on action
              if (newAction === 'set') {
                setForceFromNow(true)
              } else {
                setForceFromNow(false)
              }
            }}
            className="form-input"
            disabled={isLoading}
            style={{ padding: '0.625rem', fontSize: '0.875rem' }}
          >
            <option value="set">Set Subscription (Paksa dari Sekarang)</option>
            <option value="extend" disabled={currentSubscription?.status === 'no_subscription' || currentSubscription?.status === 'expired'}>
              Extend Subscription (Tambah Hari)
            </option>
            <option value="reduce" disabled={currentSubscription?.status === 'no_subscription' || currentSubscription?.status === 'expired'}>
              Reduce Subscription (Kurangi Hari)
            </option>
          </select>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {action === 'set' 
              ? 'Set subscription baru mulai dari sekarang (paksa). Jika sudah ada subscription aktif, akan di-extend dari endDate yang ada kecuali "Paksa dari Sekarang" dicentang.'
              : action === 'extend'
              ? 'Tambahkan durasi ke subscription yang sudah ada. Durasi akan dihitung dari tanggal berakhir saat ini (atau sekarang jika sudah expired).'
              : 'Kurangi durasi dari subscription yang sudah ada. Durasi akan dikurangi dari tanggal berakhir saat ini. Minimum adalah tanggal sekarang.'}
          </p>
        </div>

        {action === 'set' && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={forceFromNow}
                onChange={(e) => setForceFromNow(e.target.checked)}
                disabled={isLoading}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--primary)'
                }}
              />
              <span>Paksa dari Sekarang (abaikan endDate yang ada)</span>
            </label>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>
              Jika dicentang, subscription akan di-set mulai dari sekarang, mengabaikan endDate yang ada. Jika tidak dicentang, akan di-extend dari endDate yang ada.
            </p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="subscriptionDays" className="form-label">
            {action === 'reduce' ? 'Kurangi (Hari)' : 'Durasi (Hari)'} *
          </label>
          <input
            id="subscriptionDays"
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 0)}
            className="form-input"
            required
            min={action === 'reduce' ? -3650 : 1}
            max={3650}
            disabled={isLoading}
            placeholder={action === 'reduce' ? 'Contoh: 30 untuk mengurangi 30 hari' : 'Contoh: 90 untuk 3 bulan'}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {action === 'reduce' ? (
              <p style={{ margin: 0 }}>
                Masukkan jumlah hari yang ingin dikurangi dari subscription saat ini. Minimum endDate adalah tanggal sekarang.
              </p>
            ) : (
              <>
                <p style={{ margin: 0 }}>
                  <strong>Contoh:</strong>
                </p>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.5rem' }}>
                  <li>30 hari = 1 bulan</li>
                  <li>90 hari = 3 bulan</li>
                  <li>180 hari = 6 bulan</li>
                  <li>365 hari = 1 tahun</li>
                </ul>
              </>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.75rem', 
          marginTop: '1.5rem'
        }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ 
              width: '100%',
              minHeight: '44px',
              padding: '0.625rem 1rem'
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                {action === 'set' ? 'Mengatur...' : action === 'extend' ? 'Memperpanjang...' : 'Mengurangi...'}
              </>
            ) : (
              action === 'set' ? 'Set Subscription' : action === 'extend' ? 'Extend Subscription' : 'Reduce Subscription'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isLoading}
              style={{ 
                width: '100%',
                minHeight: '44px',
                padding: '0.625rem 1rem'
              }}
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

