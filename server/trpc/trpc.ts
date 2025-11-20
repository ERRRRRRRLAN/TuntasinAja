import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { getToken } from 'next-auth/jwt'
import type { CreateNextContextOptions } from '@trpc/server/adapters/next'
import type { IncomingMessage } from 'http'

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req } = opts
  
  // Get session from JWT token (works in API routes)
  let session = null
  try {
    if (process.env.NEXTAUTH_SECRET) {
      const token = await getToken({ 
        req: req as IncomingMessage & { cookies: Partial<Record<string, string>> }, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      if (token) {
        session = {
          user: {
            id: token.id as string,
            name: token.name as string,
            email: token.email as string,
          },
          expires: token.exp ? new Date((token.exp as number) * 1000).toISOString() : '',
        }
      }
    }
  } catch (error) {
    // If session cannot be retrieved, continue with null session
    // This is fine for public procedures like register
    // console.error('Error getting session:', error)
  }

  return {
    session: session || null,
    req,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthenticated)

