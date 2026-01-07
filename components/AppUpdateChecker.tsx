'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { toast } from './ui/ToastContainer'

interface VersionInfo {
  versionCode: number
  versionName: string
  downloadUrl: string
  releaseNotes?: string
  forceUpdate: boolean
  updateEnabled: boolean
}

export default function AppUpdateChecker() {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)

  // Get current app version
  const getCurrentVersion = async (): Promise<{ versionCode: number; versionName: string } | null> => {
    if (!Capacitor.isNativePlatform()) {
      return null
    }

    try {
      const info = await App.getInfo()
      
      // Try to get versionCode from injected window object (from native Android)
      let versionCode: number | null = null
      if (typeof window !== 'undefined' && (window as any).__APP_VERSION_CODE__) {
        versionCode = (window as any).__APP_VERSION_CODE__
        console.log('[AppUpdateChecker] Using injected versionCode from native:', versionCode)
      }
      
      // Fallback: calculate from versionName if not injected
      if (versionCode === null) {
        const versionParts = info.version.split('.')
        const major = parseInt(versionParts[0] || '1')
        const minor = parseInt(versionParts[1] || '0')
        
        // Calculate versionCode: (major - 1) * 10 + minor + 1
        // Example: 1.5 -> (1-1)*10 + 5 + 1 = 6
        // Example: 1.10 -> (1-1)*10 + 10 + 1 = 11
        versionCode = (major - 1) * 10 + minor + 1
        console.log('[AppUpdateChecker] Calculated versionCode from versionName:', versionCode)
      }
      
      console.log('[AppUpdateChecker] Current version:', {
        versionName: info.version,
        versionCode: versionCode,
        source: (window as any).__APP_VERSION_CODE__ ? 'native' : 'calculated',
      })
      
      return {
        versionCode: versionCode,
        versionName: info.version,
      }
    } catch (error) {
      console.error('[AppUpdateChecker] Error getting app info:', error)
      return null
    }
  }

  // Check for updates
  const checkForUpdates = async () => {
    // Only check on native platform
    if (!Capacitor.isNativePlatform()) {
      return
    }

    // Throttle: only check once per 5 minutes
    const now = Date.now()
    if (now - lastCheckTime < 5 * 60 * 1000) {
      return
    }

    try {
      const currentVersion = await getCurrentVersion()
      if (!currentVersion) {
        return
      }

      // Fetch latest version from API
      const response = await fetch('/api/app/version')
      if (!response.ok) {
        console.error('[AppUpdateChecker] Failed to fetch version info')
        return
      }

      const latestVersion: VersionInfo = await response.json()

      // Check if update is enabled and compare versions
      if (
        latestVersion.updateEnabled &&
        latestVersion.versionCode > currentVersion.versionCode
      ) {
        setUpdateInfo(latestVersion)
        setShowUpdateDialog(true)
        setLastCheckTime(now)
      } else if (!latestVersion.updateEnabled) {
        console.log('[AppUpdateChecker] Update notifications are disabled by server')
      }
    } catch (error) {
      console.error('[AppUpdateChecker] Error checking for updates:', error)
    }
  }

  // Download and install APK
  const downloadAndInstall = async () => {
    if (!updateInfo) return

    setIsDownloading(true)

    try {
      // Always download APK directly from public folder
      // Use tuntasinaja-livid.vercel.app/TuntasinAja.apk for direct download
      let downloadUrl = 'https://tuntasinaja-livid.vercel.app/TuntasinAja.apk'
      
      // If updateInfo has a downloadUrl, use it but ensure it points to the APK file
      if (updateInfo.downloadUrl) {
        // If it's already pointing to .apk file, use it
        if (updateInfo.downloadUrl.includes('.apk')) {
          downloadUrl = updateInfo.downloadUrl
          // Fix domain if wrong
          if (downloadUrl.includes('tuntasinaja.vercel.app') && !downloadUrl.includes('tuntasinaja-livid.vercel.app')) {
            downloadUrl = downloadUrl.replace('tuntasinaja.vercel.app', 'tuntasinaja-livid.vercel.app')
          }
        } else {
          // If it's pointing to API endpoint, change to direct APK file
          downloadUrl = 'https://tuntasinaja-livid.vercel.app/TuntasinAja.apk'
        }
      }

      console.log('[AppUpdateChecker] Download URL:', downloadUrl)

      if (Capacitor.getPlatform() === 'android') {
        // For Android, directly trigger download using Browser plugin
        try {
          const { Browser } = await import('@capacitor/browser')
          // Open download URL in system browser - Android will handle APK download automatically
          await Browser.open({
            url: downloadUrl,
            windowName: '_system',
          })
          console.log('[SUCCESS] Membuka browser untuk download APK...')
        } catch (browserError) {
          // Fallback: use window.open
          console.log('[AppUpdateChecker] Browser plugin not available, using window.open')
          window.open(downloadUrl, '_blank', 'noopener,noreferrer')
          console.log('[SUCCESS] Membuka browser untuk download APK...')
        }
        
        setShowUpdateDialog(false)
      } else {
        // For web, trigger direct download
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = 'TuntasinAja.apk'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('[SUCCESS] Download dimulai...')
        setShowUpdateDialog(false)
      }
    } catch (error) {
      console.error('[AppUpdateChecker] Error downloading update:', error)
      console.error('[ERROR] Gagal mengunduh update. Silakan coba lagi.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Check for updates on app start and when app comes to foreground
  useEffect(() => {
    // Initial check after a short delay
    const initialTimer = setTimeout(() => {
      checkForUpdates()
    }, 2000) // Wait 2 seconds after app load

    // Check when app comes to foreground
    let listener: any = null
    
    const setupListener = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          listener = await App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
              // Check for updates when app comes to foreground
              setTimeout(() => {
                checkForUpdates()
              }, 1000)
            }
          })
        } catch (error) {
          console.error('[AppUpdateChecker] Error setting up app state listener:', error)
        }
      }
    }

    setupListener()

    return () => {
      clearTimeout(initialTimer)
      if (listener) {
        listener.remove().catch((e: any) => {
          console.error('[AppUpdateChecker] Error removing listener:', e)
        })
      }
    }
  }, [])

  if (!showUpdateDialog || !updateInfo) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
      onClick={() => {
        if (!updateInfo.forceUpdate) {
          setShowUpdateDialog(false)
        }
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '1.5rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>
          Update Tersedia
        </h2>
        
        <p style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
          Versi <strong>{updateInfo.versionName}</strong> tersedia untuk diunduh.
        </p>

        {updateInfo.releaseNotes && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: '8px',
            fontSize: '0.875rem',
          }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Perubahan:</strong>
            <p style={{ margin: 0, lineHeight: '1.5', color: 'var(--text-light)' }}>
              {updateInfo.releaseNotes}
            </p>
          </div>
        )}

        {updateInfo.forceUpdate && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: 'rgb(239, 68, 68)',
          }}>
            ⚠️ Update wajib. Aplikasi mungkin tidak berfungsi dengan baik tanpa update ini.
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          {!updateInfo.forceUpdate && (
            <button
              onClick={() => setShowUpdateDialog(false)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
              }}
            >
              Nanti
            </button>
          )}
          <button
            onClick={downloadAndInstall}
            disabled={isDownloading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              opacity: isDownloading ? 0.6 : 1,
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.opacity = '0.9'
              }
            }}
            onMouseLeave={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            {isDownloading ? 'Mengunduh...' : 'Update Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

