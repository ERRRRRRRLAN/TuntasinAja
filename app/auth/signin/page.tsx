'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'

export default function SignInPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect jika sudah login
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/')
      router.refresh()
    }
  }, [status, session, router])

  // Show loading jika sedang check session
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#e8f0f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: 'var(--text-light)' }}>Memuat...</p>
      </div>
    )
  }

  // Don't render form if already authenticated (will redirect)
  if (status === 'authenticated') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/',
      })

      if (result?.error) {
        setError('Email atau password salah!')
      } else if (result?.ok) {
        // Wait a bit to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/')
        router.refresh()
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div style={{
      minHeight: '100vh',
      background: '#e8f0f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              position: 'relative',
              width: '40px',
              height: '40px'
            }}>
              <div style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                background: '#10b981',
                top: 0,
                left: 0,
                zIndex: 3,
                transform: 'rotate(-5deg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}></div>
              <div style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                background: '#ef4444',
                top: '4px',
                left: '8px',
                zIndex: 2,
                transform: 'rotate(2deg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}></div>
              <div style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                background: '#3b82f6',
                top: '8px',
                left: '16px',
                zIndex: 1,
                transform: 'rotate(5deg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}></div>
            </div>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e40af'
            }}>TuntasinAja</span>
          </div>
          <nav style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <a href="#" style={{
              color: '#475569',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}>Tugas</a>
            <a href="#" style={{
              color: '#475569',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}>History</a>
            <a href="#" style={{
              color: '#475569',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}>Profil</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '2.5rem',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '1.5rem',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>Masuk ke TuntasinAja</h1>
            
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

            <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  fontSize: '0.95rem'
                }}>Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  fontSize: '0.95rem'
                }}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '0.5rem'
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

          </div>
        </div>
      </main>
    </div>
  )
}


