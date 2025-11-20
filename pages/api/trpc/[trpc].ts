import { createNextApiHandler } from '@trpc/server/adapters/next'
import { appRouter } from '@/server/trpc/root'
import { createTRPCContext } from '@/server/trpc/trpc'

export default createNextApiHandler({
  router: appRouter,
  createContext: (opts) => createTRPCContext(opts),
  onError:
    process.env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
          )
        }
      : undefined,
})

