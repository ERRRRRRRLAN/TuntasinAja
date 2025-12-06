'use client'

import { SessionProvider } from 'next-auth/react'
import { trpc, trpcClient } from '@/lib/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup'
import StatusBarHandler from '@/components/StatusBarHandler'
import AppUpdateChecker from '@/components/AppUpdateChecker'
import NetworkStatus from '@/components/NetworkStatus'
import NetworkErrorHandler from '@/components/NetworkErrorHandler'
import SessionRefreshHandler from '@/components/SessionRefreshHandler'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

// Setup global back button handler for Android
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  import('@/hooks/useBackButton').then((module) => {
    // This will trigger the setup in useBackButton.ts
    console.log('[Providers] Back button handler module loaded')
  }).catch((e) => {
    console.error('[Providers] Error loading back button handler:', e)
  })
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
          <SessionRefreshHandler />
          <ServiceWorkerRegistration />
          <StatusBarHandler />
          <NetworkStatus />
          <NetworkErrorHandler />
          {children}
          <PushNotificationSetup />
          <AppUpdateChecker />
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

