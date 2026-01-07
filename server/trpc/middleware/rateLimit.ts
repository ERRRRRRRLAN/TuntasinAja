import { TRPCError } from '@trpc/server'
import type { inferAsyncReturnType } from '@trpc/server'
import { createTRPCContext } from '../trpc'

type Context = inferAsyncReturnType<typeof createTRPCContext>

// In-memory rate limit store
// For production, consider using Redis with @upstash/ratelimit
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // 5 minutes

interface RateLimitOptions {
  maxRequests?: number // Default: 10
  windowMs?: number // Default: 10000 (10 seconds)
  identifier?: (ctx: Context) => string // Default: user ID or IP
  skipIf?: (ctx: Context) => boolean // Skip rate limiting if condition is true
}

/**
 * Rate limiting middleware for tRPC
 * 
 * @param options - Rate limit configuration
 * @returns tRPC middleware
 * 
 * @example
 * ```ts
 * const rateLimitedProcedure = publicProcedure.use(
 *   rateLimit({
 *     maxRequests: 10,
 *     windowMs: 10000,
 *   })
 * )
 * ```
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    maxRequests = 10,
    windowMs = 10000, // 10 seconds
    identifier,
    skipIf,
  } = options

  return async ({ ctx, next }: { ctx: Context; next: any }) => {
    // Skip rate limiting if condition is met
    if (skipIf && skipIf(ctx)) {
      return next()
    }

    // Get identifier (user ID or IP address)
    let key: string
    if (identifier) {
      key = identifier(ctx)
    } else {
      // Default: use user ID if authenticated, otherwise IP address
      if (ctx.session?.user?.id) {
        key = `user:${ctx.session.user.id}`
      } else {
        // Get IP address from request
        const ip = 
          (ctx.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          (ctx.req.headers['x-real-ip'] as string) ||
          ctx.req.socket?.remoteAddress ||
          'unknown'
        key = `ip:${ip}`
      }
    }

    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return next()
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Please try again in ${retryAfter} second(s).`,
        cause: {
          retryAfter,
          limit: maxRequests,
          window: windowMs,
        },
      })
    }

    // Increment count
    entry.count++
    rateLimitStore.set(key, entry)

    return next()
  }
}

/**
 * Rate limiting middleware specifically for mutations
 * More restrictive: 10 requests per 10 seconds
 */
export const mutationRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 10000, // 10 seconds
})

/**
 * Rate limiting middleware for queries
 * Less restrictive: 30 requests per 10 seconds
 */
export const queryRateLimit = rateLimit({
  maxRequests: 30,
  windowMs: 10000, // 10 seconds
})

/**
 * Rate limiting middleware for admin operations
 * More restrictive: 20 requests per 10 seconds
 */
export const adminRateLimit = rateLimit({
  maxRequests: 20,
  windowMs: 10000, // 10 seconds
  skipIf: (ctx) => {
    // Skip rate limiting for admin users (they need more flexibility)
    // This will be checked in the adminProcedure middleware
    return false // We'll check admin status in the procedure itself
  },
})

