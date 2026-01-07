import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only initialize Prisma if DATABASE_URL is available
// This prevents build errors when DATABASE_URL is not set during build time
const getPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    // During build, if DATABASE_URL is not available, return a mock client
    // This is safe because Prisma won't be used during build for client-side code
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[Prisma] DATABASE_URL not found. Prisma Client will not be initialized.')
    }
    // Return a proxy that throws helpful error if used
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          'Prisma Client is not initialized. DATABASE_URL environment variable is required.'
        )
      },
    })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

