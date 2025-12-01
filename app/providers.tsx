'use client'

import { SessionProvider } from 'next-auth/react'
import { trpc, trpcClient } from '@/lib/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup'
import StatusBarHandler from '@/components/StatusBarHandler'
import AppUpdateChecker from '@/components/AppUpdateChecker'
import { useNavigationHistory } from '@/hooks/useNavigationHistory'

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
        retry: 1,
      },
      mutations: {
        retry: 1,
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
          <StatusBarHandler />
          {children}
          <PushNotificationSetup />
          <AppUpdateChecker />
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

