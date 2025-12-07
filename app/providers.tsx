'use client'

import { SessionProvider } from 'next-auth/react'
import { trpc, trpcClient } from '@/lib/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
// Capacitor will be loaded dynamically to avoid initialization errors
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup'
import StatusBarHandler from '@/components/StatusBarHandler'
import AppUpdateChecker from '@/components/AppUpdateChecker'
import NetworkStatus from '@/components/NetworkStatus'
import NetworkErrorHandler from '@/components/NetworkErrorHandler'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { UnsavedChangesProvider } from '@/components/providers/UnsavedChangesProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Setup global back button handler for Android
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure Capacitor is fully initialized
  setTimeout(() => {
    // Use dynamic import instead of require to avoid module-level errors
    import('@capacitor/core').then((capacitorModule) => {
      if (capacitorModule.Capacitor && capacitorModule.Capacitor.isNativePlatform()) {
        import('@/hooks/useBackButton').then((module) => {
          // This will trigger the setup in useBackButton.ts
          console.log('[Providers] Back button handler module loaded')
        }).catch((e) => {
          // Silently fail - back button handler is optional
          console.warn('[Providers] Could not load back button handler:', e)
        })
      }
    }).catch((e) => {
      // Silently fail - Capacitor might not be available (web build)
      console.warn('[Providers] Capacitor not available, skipping back button handler:', e)
    })
  }, 100)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Retry network errors up to 3 times
          const isNetworkError = error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                               error?.message?.includes('Failed to fetch') ||
                               error?.message?.includes('NetworkError') ||
                               error?.message?.includes('Network request failed') ||
                               error?.name === 'NetworkError' ||
                               error?.name === 'TypeError'
          
          if (isNetworkError) {
            return failureCount < 3
          }
          // For other errors, retry once
          return failureCount < 1
        },
        retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff, max 30s
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Retry network errors once
          const isNetworkError = error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                               error?.message?.includes('Failed to fetch') ||
                               error?.message?.includes('NetworkError') ||
                               error?.message?.includes('Network request failed') ||
                               error?.name === 'NetworkError' ||
                               error?.name === 'TypeError'
          
          if (isNetworkError) {
            return failureCount < 1
          }
          return false
        },
        retryDelay: 1000,
      },
    },
  }))

  // Track navigation history for back button
  useNavigationHistory()

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider 
          refetchInterval={5 * 60}
          refetchOnWindowFocus={true}
        >
          <ThemeProvider>
            <UnsavedChangesProvider>
              <ErrorBoundary fallback={null}>
                <ServiceWorkerRegistration />
              </ErrorBoundary>
              <ErrorBoundary fallback={null}>
                <StatusBarHandler />
              </ErrorBoundary>
              <ErrorBoundary fallback={null}>
                <NetworkStatus />
              </ErrorBoundary>
              <ErrorBoundary fallback={null}>
                <NetworkErrorHandler />
              </ErrorBoundary>
              {children}
              <ErrorBoundary fallback={null}>
                <PushNotificationSetup />
              </ErrorBoundary>
              <ErrorBoundary fallback={null}>
                <AppUpdateChecker />
              </ErrorBoundary>
            </UnsavedChangesProvider>
          </ThemeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

