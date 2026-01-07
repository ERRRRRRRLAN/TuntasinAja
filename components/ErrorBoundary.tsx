'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check if it's a network error
    const isNetworkError = error.message?.includes('ERR_NAME_NOT_RESOLVED') || 
                          error.message?.includes('Failed to fetch') ||
                          error.message?.includes('NetworkError') ||
                          error.message?.includes('Network request failed') ||
                          error.name === 'NetworkError' ||
                          error.name === 'TypeError'

    if (isNetworkError && this.state.retryCount < 3) {
      // Network error - will retry automatically
      const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000) // Exponential backoff, max 5s
      
      this.retryTimeout = setTimeout(() => {
        // Reset error boundary state to allow retry
        // Don't reload page, let React Query handle the retry
        this.setState(prevState => ({
          hasError: false,
          error: null,
          retryCount: prevState.retryCount + 1,
        }))
      }, retryDelay)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Check if it's a network error
      const isNetworkError = this.state.error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                            this.state.error?.message?.includes('Failed to fetch') ||
                            this.state.error?.message?.includes('NetworkError') ||
                            this.state.error?.message?.includes('Network request failed') ||
                            this.state.error?.name === 'NetworkError' ||
                            this.state.error?.name === 'TypeError'

      if (isNetworkError && this.state.retryCount < 3) {
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-primary, #ffffff)',
          }}>
            <h2 style={{ 
              marginBottom: '1rem', 
              color: 'var(--text, #000000)',
              fontSize: '1.25rem',
              fontWeight: 600,
            }}>
              Menghubungkan ke server...
            </h2>
            <p style={{ 
              color: 'var(--text-light, #666666)', 
              marginBottom: '2rem',
              fontSize: '0.875rem',
            }}>
              Sedang mencoba menghubungkan ulang. Mohon tunggu sebentar.
            </p>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--border, #e5e7eb)',
              borderTop: '4px solid var(--primary, #6366f1)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )
      }

      // For other errors or max retries reached
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-primary, #ffffff)',
        }}>
          <h2 style={{
            marginBottom: '1rem',
            color: 'var(--text, #000000)',
            fontSize: '1.25rem',
            fontWeight: 600,
          }}>
            Terjadi kesalahan
          </h2>
          <p style={{
            color: 'var(--text-light, #666666)',
            marginBottom: '2rem',
            fontSize: '0.875rem',
          }}>
            {this.state.error?.message || 'Terjadi kesalahan yang tidak diketahui'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, retryCount: 0 })
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Muat Ulang
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

