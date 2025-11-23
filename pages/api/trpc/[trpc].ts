import { createNextApiHandler } from '@trpc/server/adapters/next'
import { appRouter } from '@/server/trpc/root'
import { createTRPCContext } from '@/server/trpc/trpc'

export default createNextApiHandler({
  router: appRouter,
  createContext: (opts) => {
    return createTRPCContext(opts)
  },
  onError: ({ path, error, ctx }) => {
    // Always log errors for debugging
    const cookieHeader = ctx?.req?.headers?.cookie || ''
    
    // Log full error details
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, {
      message: error.message,
      code: error.code,
      cause: error.cause,
      stack: error.stack,
      hasSession: !!ctx?.session,
      userId: ctx?.session?.user?.id,
      hasCookie: !!cookieHeader,
      cookiePreview: cookieHeader.substring(0, 50),
    })
    
    // Also log the original error message for quick reference
    console.error(`   Error message: ${error.message}`)
    if (error.cause) {
      console.error(`   Error cause:`, error.cause)
    }
  },
})

