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
  const [action, setAction] = useState<'set' | 'extend'>('set')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const utils = trpc.useUtils()
  
  // Get current subscription to determine default action
  const { data: currentSubscription } = trpc.subscription.getClassSubscription.useQuery({ kelas })
  
  useEffect(() => {
    if (currentSubscription) {
      if (currentSubscription.status === 'no_subscription' || currentSubscription.status === 'expired') {
        setAction('set')
      } else {
        setAction('extend')
      }
    }
  }, [currentSubscription])

  const setSubscription = trpc.subscription.setClassSubscription.useMutation({
    onSuccess: () => {
      setSuccess('Subscription berhasil diatur!')
      setError('')
      utils.subscription.getAllClassSubscriptions.invalidate()
      utils.subscription.getClassSubscription.invalidate({ kelas })
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
      toast.success('Subscription berhasil diatur!')
    },
    onError: (err: any) => {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setSuccess('')
      toast.error(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
    },
  })

  const extendSubscription = trpc.subscription.extendClassSubscription.useMutation({
    onSuccess: () => {
      setSuccess('Subscription berhasil diperpanjang!')
      setError('')
      utils.subscription.getAllClassSubscriptions.invalidate()
      utils.subscription.getClassSubscription.invalidate({ kelas })
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
      toast.success('Subscription berhasil diperpanjang!')
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

    if (!days || days < 1 || days > 3650) {
      setError('Durasi harus antara 1 sampai 3650 hari!')
      return
    }

    if (action === 'set') {
      setSubscription.mutate({ kelas, days })
    } else {
      extendSubscription.mutate({ kelas, days })
    }
  }

  const isLoading = setSubscription.isLoading || extendSubscription.isLoading

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            {action === 'set' ? 'Set' : 'Extend'} Subscription Kelas
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
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
              transition: 'background 0.2s'
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
        <div style={{
          padding: '0.75rem 1rem',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#166534'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>
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
          </p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534',
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
            onChange={(e) => setAction(e.target.value as 'set' | 'extend')}
            className="form-input"
            disabled={isLoading}
            style={{ padding: '0.625rem', fontSize: '0.875rem' }}
          >
            <option value="set">Set Subscription Baru</option>
            <option value="extend" disabled={currentSubscription?.status === 'no_subscription' || currentSubscription?.status === 'expired'}>
              Extend Subscription
            </option>
          </select>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            {action === 'set' 
              ? 'Set subscription baru mulai dari sekarang. Jika sudah ada subscription aktif, akan di-extend dari endDate yang ada.'
              : 'Tambahkan durasi ke subscription yang sudah ada. Durasi akan dihitung dari tanggal berakhir saat ini (atau sekarang jika sudah expired).'}
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="subscriptionDays" className="form-label">
            Durasi (Hari) *
          </label>
          <input
            id="subscriptionDays"
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 0)}
            className="form-input"
            required
            min={1}
            max={3650}
            disabled={isLoading}
            placeholder="Contoh: 90 untuk 3 bulan"
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            <p style={{ margin: 0 }}>
              <strong>Contoh:</strong>
            </p>
            <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.5rem' }}>
              <li>30 hari = 1 bulan</li>
              <li>90 hari = 3 bulan</li>
              <li>180 hari = 6 bulan</li>
              <li>365 hari = 1 tahun</li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size={16} color="white" style={{ marginRight: '0.5rem', display: 'inline-block' }} />
                {action === 'set' ? 'Mengatur...' : 'Memperpanjang...'}
              </>
            ) : (
              action === 'set' ? 'Set Subscription' : 'Extend Subscription'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

