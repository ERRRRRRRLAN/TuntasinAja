'use client'

import { SessionProvider } from 'next-auth/react'
import { trpc, trpcClient } from '@/lib/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider 
          refetchInterval={5 * 60}
          refetchOnWindowFocus={true}
        >
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

