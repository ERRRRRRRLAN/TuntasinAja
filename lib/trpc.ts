'use client'

import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import superjson from 'superjson'
import type { AppRouter } from '@/server/trpc/root'

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin
  }
  // Server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      // Ensure cookies are sent with requests
      fetch: (url: string, options?: RequestInit) => {
        return fetch(url, {
          ...options,
          credentials: 'include', // Important: include cookies
        })
      },
    }),
  ],
  transformer: superjson,
})

