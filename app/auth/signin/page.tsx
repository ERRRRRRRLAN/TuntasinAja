'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { BookIcon, EyeIcon, EyeOffIcon } from '@/components/ui/Icons'

export default function SignInPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      <div className="signin-page-wrapper">
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-light)',
          fontSize: '1rem'
        }}>
          <p>Memuat...</p>
        </div>
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
    <div className="signin-page-wrapper">
      {/* Simple Header - Only Logo and Title */}
      <header className="signin-page-header">
        <div className="signin-page-header-content">
          <div className="signin-page-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src="/logo.svg" 
              alt="TuntasinAja Logo" 
              style={{ 
                width: '32px', 
                height: '32px', 
                flexShrink: 0,
                objectFit: 'contain'
              }} 
            />
            <span className="signin-page-logo-text">TuntasinAja</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="signin-page-main">
        <div className="signin-page-container">
          <div className="signin-page-card">
            <div className="signin-page-welcome">
              <h1 className="signin-page-title">Kumpulan Tugas SMKN 6 Tangerang Selatan</h1>
              <p className="signin-page-subtitle">Masuk ke akun Anda untuk melanjutkan</p>
            </div>
            
            {error && (
              <div className="signin-page-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="signin-page-form">
              <div className="signin-form-group">
                <label htmlFor="email" className="signin-form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => {
                    // Ensure value is saved when user leaves field (Android clipboard fix)
                    const inputValue = e.target.value
                    if (inputValue !== email) {
                      setEmail(inputValue)
                    }
                  }}
                  onPaste={(e) => {
                    // Handle paste event explicitly for Android
                    e.preventDefault()
                    const pastedText = e.clipboardData.getData('text')
                    if (pastedText) {
                      setEmail(pastedText)
                      // Also update the input value directly for Android WebView
                      const target = e.target as HTMLInputElement
                      if (target) {
                        target.value = pastedText
                      }
                    }
                  }}
                  onInput={(e) => {
                    // Fallback handler for Android WebView
                    const target = e.target as HTMLInputElement
                    if (target && target.value !== email) {
                      setEmail(target.value)
                    }
                  }}
                  className="signin-form-input"
                  placeholder="nama@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="signin-form-group">
                <label htmlFor="password" className="signin-form-label">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={(e) => {
                      // Ensure value is saved when user leaves field (Android clipboard fix)
                      const inputValue = e.target.value
                      if (inputValue !== password) {
                        setPassword(inputValue)
                      }
                    }}
                    onPaste={(e) => {
                      // Handle paste event explicitly for Android
                      e.preventDefault()
                      const pastedText = e.clipboardData.getData('text')
                      if (pastedText) {
                        setPassword(pastedText)
                        // Also update the input value directly for Android WebView
                        const target = e.target as HTMLInputElement
                        if (target) {
                          target.value = pastedText
                        }
                      }
                    }}
                    onInput={(e) => {
                      // Fallback handler for Android WebView
                      const target = e.target as HTMLInputElement
                      if (target && target.value !== password) {
                        setPassword(target.value)
                      }
                    }}
                    className="signin-form-input"
                    placeholder="Masukkan password Anda"
                    required
                    disabled={isLoading}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="signin-password-toggle"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} />
                    ) : (
                      <EyeIcon size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="signin-form-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="signin-button-loading">
                    <span className="signin-spinner"></span>
                    Memproses...
                  </span>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}


