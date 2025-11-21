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
    console.error(
      `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
      error.code === 'UNAUTHORIZED' ? '(Session not found)' : '',
      {
        code: error.code,
        hasSession: !!ctx?.session,
        userId: ctx?.session?.user?.id,
        hasCookie: !!cookieHeader,
        cookiePreview: cookieHeader.substring(0, 50),
      }
    )
  },
})

