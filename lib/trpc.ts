'use client'

import { createTRPCReact, httpBatchLink } from '@trpc/react-query'
import superjson from 'superjson'
import type { AppRouter } from '@/server/trpc/root'
import { Capacitor } from '@capacitor/core'

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Check if running in Capacitor native app
    if (Capacitor.isNativePlatform()) {
      // Use Vercel URL for native app (from capacitor.config.ts)
      return 'https://tuntasinaja-livid.vercel.app'
    }
    
    // Check if running in localhost (development)
    const origin = window.location.origin
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('capacitor://')) {
      // Development or Capacitor local: use Vercel URL
      return 'https://tuntasinaja-livid.vercel.app'
    }
    
    // Production web: use current origin
    return origin
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
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const maxRetries = 3
        let lastError: Error | null = null

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(input, {
              ...init,
              credentials: 'include', // Important: include cookies
            })
            
            // If response is ok, return it
            if (response.ok || attempt === maxRetries) {
              return response
            }
            
            // If not ok and not last attempt, throw to trigger retry
            if (!response.ok && attempt < maxRetries) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            return response
          } catch (error: any) {
            lastError = error
            
            // Check if it's a network error
            const isNetworkError = error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                                 error.message?.includes('Failed to fetch') ||
                                 error.message?.includes('NetworkError') ||
                                 error.message?.includes('Network request failed') ||
                                 error.name === 'NetworkError' ||
                                 error.name === 'TypeError'

            // Only retry network errors
            if (isNetworkError && attempt < maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              const delay = Math.min(1000 * Math.pow(2, attempt), 4000)
              await new Promise(resolve => setTimeout(resolve, delay))
              continue
            }
            
            // For non-network errors or max retries reached, throw
            throw error
          }
        }
        
        // Should never reach here, but just in case
        throw lastError || new Error('Failed to fetch')
      },
    }),
  ],
  transformer: superjson,
})

