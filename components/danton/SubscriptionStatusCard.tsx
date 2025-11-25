'use client'

import { useClassSubscription } from '@/hooks/useClassSubscription'
import { useDanton } from '@/hooks/useDanton'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SubscriptionStatusCard() {
  const { dantonKelas } = useDanton()
  const { subscription, isActive, isExpired, isExpiringSoon, daysRemaining, hoursRemaining, status, endDate, isLoading } = useClassSubscription(dantonKelas || undefined)

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
        <LoadingSpinner size={24} />
        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Memuat status subscription...
        </p>
      </div>
    )
  }

  // Determine status badge color and text
  let badgeColor = '#ef4444' // red for expired
  let badgeBg = '#fef2f2'
  let badgeText = 'Expired'
  let statusMessage = ''
  let daysText = ''

  if (status === 'active') {
    badgeColor = '#22c55e' // green
    badgeBg = '#f0fdf4'
    badgeText = 'Aktif'
    if (daysRemaining !== null) {
      daysText = `${daysRemaining} hari tersisa`
    }
  } else if (status === 'expiring_soon') {
    badgeColor = '#f59e0b' // amber
    badgeBg = '#fffbeb'
    badgeText = 'Akan Berakhir'
    if (daysRemaining !== null) {
      daysText = `${daysRemaining} hari tersisa`
      statusMessage = `Subscription akan berakhir dalam ${daysRemaining} hari. Hubungi admin untuk memperpanjang.`
    }
  } else if (status === 'expired') {
    badgeColor = '#ef4444' // red
    badgeBg = '#fef2f2'
    badgeText = 'Habis'
    statusMessage = 'Subscription sudah habis. Fitur kelas telah dinonaktifkan. Hubungi admin untuk memperpanjang subscription.'
  } else {
    // no_subscription
    badgeColor = '#ef4444' // red
    badgeBg = '#fef2f2'
    badgeText = 'Tidak Ada Subscription'
    statusMessage = 'Kelas ini belum memiliki subscription. Hubungi admin untuk mengaktifkan subscription.'
  }

  return (
    <div className="card" style={{ 
      border: `2px solid ${badgeColor}20`,
      background: badgeBg,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            margin: '0 0 0.5rem 0',
            color: 'var(--text-primary)'
          }}>
            Status Subscription Kelas
          </h3>
          <p style={{ 
            color: 'var(--text-light)', 
            fontSize: '0.875rem',
            margin: 0
          }}>
            {dantonKelas || '-'}
          </p>
        </div>
        <span style={{
          display: 'inline-block',
          padding: '0.375rem 0.75rem',
          borderRadius: '0.5rem',
          background: badgeColor,
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          {badgeText}
        </span>
      </div>

      {endDate && (
        <div style={{ 
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'white',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-light)', 
            margin: '0 0 0.25rem 0' 
          }}>
            Berakhir pada:
          </p>
          <p style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: 0 
          }}>
            {format(endDate, 'EEEE, d MMMM yyyy, HH:mm', { locale: id })}
          </p>
          {daysText && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: badgeColor, 
              margin: '0.5rem 0 0 0',
              fontWeight: 600
            }}>
              {daysText}
            </p>
          )}
        </div>
      )}

      {(isExpired || isExpiringSoon || status === 'no_subscription') && (
        <div style={{
          padding: '0.75rem 1rem',
          background: badgeColor,
          color: 'white',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            ⚠️ {statusMessage || 'Subscription tidak aktif'}
          </p>
        </div>
      )}

      {isActive && daysRemaining !== null && daysRemaining > 7 && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#f0fdf4',
          color: '#166534',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          border: '1px solid #86efac'
        }}>
          <p style={{ margin: 0 }}>
            ✓ Subscription aktif. {daysText}
          </p>
        </div>
      )}
    </div>
  )
}

