import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { getToken } from 'next-auth/jwt'
import type { CreateNextContextOptions } from '@trpc/server/adapters/next'

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts
  
  // Get session from JWT token
  let session = null
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('[tRPC Context] NEXTAUTH_SECRET not found!')
      return { session: null, req, res }
    }

    const cookieHeader = req.headers.cookie || ''
    const hasCookie = cookieHeader.includes('next-auth.session-token') || cookieHeader.includes('__Secure-next-auth.session-token')
    
    // Log for debugging (only in production to avoid spam)
    if (process.env.NODE_ENV === 'production') {
      console.log('[tRPC Context] Cookie check:', {
        hasCookie,
        cookieLength: cookieHeader.length,
        nodeEnv: process.env.NODE_ENV,
        url: req.url,
      })
    }
    
    // Use getToken which works reliably in API routes
    // getToken will auto-detect cookie name (production vs development)
    const token = await getToken({ 
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    if (process.env.NODE_ENV === 'production') {
      console.log('[tRPC Context] Token result:', {
        hasToken: !!token,
        hasId: !!token?.id,
        hasName: !!token?.name,
        hasEmail: !!token?.email,
      })
    }
    
    if (token && token.id) {
      session = {
        user: {
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
        },
        expires: token.exp ? new Date((token.exp as number) * 1000).toISOString() : '',
      }
      
      if (process.env.NODE_ENV === 'production') {
        console.log('[tRPC Context] ✅ Session created for user:', token.id)
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.log('[tRPC Context] ❌ No valid session - token missing or invalid', {
          hasCookie,
          hasToken: !!token,
        })
      }
    }
  } catch (error) {
    // Log error for debugging
    console.error('[tRPC Context] ❌ Error getting session:', error)
    // If session cannot be retrieved, continue with null session
    // This is fine for public procedures like register
  }

  return {
    session: session || null,
    req,
    res,
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

