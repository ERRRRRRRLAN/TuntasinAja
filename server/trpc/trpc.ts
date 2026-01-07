import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { getToken } from 'next-auth/jwt'
import type { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { getUserFriendlyMessage, AppError } from '@/lib/error-handler'

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts
  
  // Get session from JWT token
  let session = null
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      logger.error({ component: 'tRPC Context' }, 'NEXTAUTH_SECRET not found!')
      return { session: null, req, res }
    }

    const cookieHeader = req.headers.cookie || ''
    const hasCookie = cookieHeader.includes('next-auth.session-token') || cookieHeader.includes('__Secure-next-auth.session-token')
    
    // Use getToken which works reliably in API routes
    // getToken will auto-detect cookie name (production vs development)
    const token = await getToken({ 
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    if (token && token.id) {
      session = {
        user: {
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
        },
        expires: token.exp ? new Date((token.exp as number) * 1000).toISOString() : '',
      }
      
      logger.debug({ 
        component: 'tRPC Context',
        userId: token.id,
        hasCookie,
      }, 'Session created successfully')
    } else {
      logger.debug({ 
        component: 'tRPC Context',
          hasCookie,
          hasToken: !!token,
      }, 'No valid session - token missing or invalid')
    }
  } catch (error) {
    // Log error for debugging
    logger.error({ 
      component: 'tRPC Context',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 'Error getting session')
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
    // Get user-friendly error message
    const userMessage = getUserFriendlyMessage(error)
    
    // Check if error is AppError (has code property with ErrorCode type)
    const isAppError = error && typeof error === 'object' && 'code' in error && 'statusCode' in error && 'userMessage' in error
    
    return {
      ...shape,
      message: userMessage, // Override with user-friendly message
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
        // Include error code if it's an AppError
        ...(isAppError && {
          code: (error as AppError).code,
          statusCode: (error as AppError).statusCode,
        }),
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

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
  })

  // Type assertion needed until schema is pushed to database
  const isAdmin = (user as any)?.isAdmin === true

  if (!isAdmin) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Admin access required' 
    })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const adminProcedure = t.procedure.use(isAuthenticated).use(isAdmin)

// Import rate limiting middleware
import { mutationRateLimit, queryRateLimit, adminRateLimit } from './middleware/rateLimit'

// Rate-limited procedures
// Use these instead of publicProcedure/protectedProcedure/adminProcedure for mutations
export const rateLimitedProcedure = t.procedure.use(mutationRateLimit)
export const rateLimitedProtectedProcedure = t.procedure.use(isAuthenticated).use(mutationRateLimit)
export const rateLimitedQueryProcedure = t.procedure.use(queryRateLimit)
export const rateLimitedAdminProcedure = t.procedure.use(isAuthenticated).use(isAdmin).use(adminRateLimit)

// Helper function to check if user is danton
export const checkIsDanton = async (userId: string): Promise<{ isDanton: boolean; kelas: string | null }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isDanton: true,
      kelas: true,
    },
  }) as any // Type assertion until Prisma Client is fully regenerated

  return {
    isDanton: user?.isDanton === true,
    kelas: user?.kelas || null,
  }
}

// Helper function to check user permission
export const getUserPermission = async (userId: string): Promise<'only_read' | 'read_and_post_edit'> => {
  const permission = await (prisma as any).userPermission.findUnique({
    where: { userId },
    select: { permission: true },
  }) // Type assertion until Prisma Client is fully regenerated

  // Default permission is read_and_post_edit if not set
  return permission?.permission || 'read_and_post_edit'
}

// Middleware to check if user is danton
const isDanton = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const { isDanton: userIsDanton, kelas } = await checkIsDanton(ctx.session.user.id)

  if (!userIsDanton || !kelas) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Danton access required' 
    })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      dantonKelas: kelas,
    },
  })
})

export const dantonProcedure = t.procedure.use(isAuthenticated).use(isDanton)

