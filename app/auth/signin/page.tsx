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
      {/* Background with blurred circles */}
      <div className="signin-background-circles">
        <div className="signin-circle signin-circle-1"></div>
        <div className="signin-circle signin-circle-2"></div>
      </div>

      {/* Main Content */}
      <main className="signin-page-main">
        <div className="signin-page-container">
          <div className="signin-page-card">
            {/* Header */}
            <div className="signin-page-header-section">
              <h1 className="signin-page-title">Login</h1>
              <p className="signin-page-subtitle">Login untuk masuk kedalam TuntasinAja</p>
            </div>
            
            {error && (
              <div className="signin-page-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="signin-page-form">
              <div className="signin-form-group">
                <label htmlFor="email" className="signin-form-label">
                  Name
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => {
                    const inputValue = e.target.value
                    if (inputValue !== email) {
                      setEmail(inputValue)
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault()
                    const pastedText = e.clipboardData.getData('text')
                    if (pastedText) {
                      setEmail(pastedText)
                      const target = e.target as HTMLInputElement
                      if (target) {
                        target.value = pastedText
                      }
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement
                    if (target && target.value !== email) {
                      setEmail(target.value)
                    }
                  }}
                  className="signin-form-input"
                  placeholder="Enter your email"
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
                      const inputValue = e.target.value
                      if (inputValue !== password) {
                        setPassword(inputValue)
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault()
                      const pastedText = e.clipboardData.getData('text')
                      if (pastedText) {
                        setPassword(pastedText)
                        const target = e.target as HTMLInputElement
                        if (target) {
                          target.value = pastedText
                        }
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement
                      if (target && target.value !== password) {
                        setPassword(target.value)
                      }
                    }}
                    className="signin-form-input"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="signin-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={20} />
                    ) : (
                      <EyeIcon size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="signin-form-options">
                <a href="/faq" className="signin-faq-link">
                  FAQ untuk seputar login
                </a>
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
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}


