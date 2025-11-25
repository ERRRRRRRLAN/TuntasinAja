'use client'

import { useState, useEffect } from 'react'
import { useClassSubscription } from '@/hooks/useClassSubscription'
import { useDanton } from '@/hooks/useDanton'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CheckIcon, XIcon, AlertTriangleIcon, InfoIcon } from '@/components/ui/Icons'

export default function SubscriptionStatusCard() {
  const { kelas: dantonKelas } = useDanton()
  const { subscription, isActive, isExpired, isExpiringSoon, daysRemaining, hoursRemaining, status, endDate, isLoading } = useClassSubscription(dantonKelas || undefined)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    return () => setIsVisible(false)
  }, [])

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
  let badgeColor = 'var(--text-light)' // neutral for expired
  let badgeBg = 'var(--bg-secondary)'
  let badgeText = 'Habis'
  let statusMessage = ''
  let daysText = ''
  let StatusIcon = XIcon

  if (status === 'active') {
    badgeColor = 'var(--text-primary)'
    badgeBg = 'var(--bg-secondary)'
    badgeText = 'Aktif'
    StatusIcon = CheckIcon
    if (daysRemaining !== null) {
      daysText = `${daysRemaining} hari tersisa`
    }
  } else if (status === 'expiring_soon') {
    badgeColor = 'var(--text-primary)'
    badgeBg = 'var(--bg-secondary)'
    badgeText = 'Akan Berakhir'
    StatusIcon = AlertTriangleIcon
    if (daysRemaining !== null) {
      daysText = `${daysRemaining} hari tersisa`
      statusMessage = `Subscription akan berakhir dalam ${daysRemaining} hari. Hubungi admin untuk memperpanjang.`
    }
  } else if (status === 'expired') {
    badgeColor = 'var(--text-light)'
    badgeBg = 'var(--bg-secondary)'
    badgeText = 'Habis'
    StatusIcon = XIcon
    statusMessage = 'Subscription sudah habis. Fitur kelas telah dinonaktifkan. Hubungi admin untuk memperpanjang subscription.'
  } else {
    // no_subscription
    badgeColor = 'var(--text-light)'
    badgeBg = 'var(--bg-secondary)'
    badgeText = 'Tidak Ada Subscription'
    StatusIcon = InfoIcon
    statusMessage = 'Kelas ini belum memiliki subscription. Hubungi admin untuk mengaktifkan subscription.'
  }

  return (
    <div className={`card subscription-fade-in`} style={{ 
      border: `1px solid var(--border)`,
      background: 'var(--bg-primary)',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.2s ease-out'
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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '0.5rem',
          background: badgeBg,
          color: badgeColor,
          fontSize: '0.75rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          border: `1px solid var(--border)`
        }}>
          <StatusIcon size={14} style={{ color: badgeColor, flexShrink: 0 }} />
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
              color: 'var(--text-light)', 
              margin: '0.5rem 0 0 0',
              fontWeight: 500
            }}>
              {daysText}
            </p>
          )}
        </div>
      )}

      {(isExpired || isExpiringSoon || status === 'no_subscription') && (
        <div className="subscription-fade-in" style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <AlertTriangleIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '0.125rem' }} />
          <p style={{ margin: 0, fontWeight: 400 }}>
            {statusMessage || 'Subscription tidak aktif'}
          </p>
        </div>
      )}

      {isActive && daysRemaining !== null && daysRemaining > 7 && (
        <div className="subscription-fade-in" style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <CheckIcon size={16} style={{ color: 'var(--text-light)', flexShrink: 0, marginTop: '0.125rem' }} />
          <p style={{ margin: 0, fontWeight: 400 }}>
            Subscription aktif. {daysText}
          </p>
        </div>
      )}
    </div>
  )
}

