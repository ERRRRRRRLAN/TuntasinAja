'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { InfoIcon, DownloadIcon } from '@/components/ui/Icons'

export default function AboutSettings() {
  const { data: session } = trpc.auth.getUserData.useQuery(undefined, {
    enabled: false,
  })

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '1.5rem', 
        fontSize: '1.25rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        ℹ️ Tentang & Bantuan
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* App Version */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontWeight: 500,
            marginBottom: '0.25rem',
            fontSize: '0.95rem',
            color: 'var(--text)',
          }}>
            Versi Aplikasi
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginTop: '0.25rem',
          }}>
            TuntasinAja v1.5.0
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginTop: '0.25rem',
          }}>
            Platform Tugas Sekolah
          </div>
        </div>

        {/* Changelog */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontWeight: 500,
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            color: 'var(--text)',
          }}>
            Changelog
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '0.75rem',
          }}>
            Lihat daftar perubahan versi terbaru
          </div>
          <a
            href="/CHANGELOG-WHATSAPP.md"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary)'
            }}
          >
            Lihat Changelog →
          </a>
        </div>

        {/* FAQ */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontWeight: 500,
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            color: 'var(--text)',
          }}>
            FAQ
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '0.75rem',
          }}>
            Pertanyaan yang sering diajukan
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            fontStyle: 'italic',
          }}>
            FAQ akan tersedia segera
          </div>
        </div>

        {/* Contact Support */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontWeight: 500,
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            color: 'var(--text)',
          }}>
            Kontak Support
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '0.75rem',
          }}>
            Butuh bantuan? Hubungi kami
          </div>
          <a
            href="mailto:support@tuntasinaja.com"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
            }}
          >
            support@tuntasinaja.com
          </a>
        </div>

        {/* Tutorial */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontWeight: 500,
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            color: 'var(--text)',
          }}>
            Tutorial
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '0.75rem',
          }}>
            Panduan penggunaan aplikasi
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            fontStyle: 'italic',
          }}>
            Tutorial akan tersedia segera
          </div>
        </div>

        {/* Rate App */}
        <div style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            fontWeight: 500,
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            color: 'var(--text)',
          }}>
            Rate Aplikasi
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            marginBottom: '0.75rem',
          }}>
            Beri rating di Play Store
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-light)',
            fontStyle: 'italic',
          }}>
            Link akan tersedia segera
          </div>
        </div>
      </div>
    </div>
  )
}

