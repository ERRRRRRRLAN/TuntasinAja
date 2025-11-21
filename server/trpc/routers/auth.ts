import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authRouter = createTRPCRouter({
  // Register
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new Error('Email already registered')
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })

      return user
    }),

  // Get user profile
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          _count: {
            select: {
              threads: true,
              comments: true,
            },
          },
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const completedCount = await prisma.history.count({
        where: {
          userId: input.userId,
        },
      })

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        threadsCount: user._count.threads,
        commentsCount: user._count.comments,
        completedCount,
      }
    }),

  // Check if current user is admin
  isAdmin: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return { isAdmin: false }
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { isAdmin: true },
    })

    return { isAdmin: user?.isAdmin || false }
  }),
})

