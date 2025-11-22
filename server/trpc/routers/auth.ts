import { z } from 'zod'
import { createTRPCRouter, publicProcedure, adminProcedure } from '../trpc'
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

      // Count completed tasks from userStatus, not from history
      // This ensures the count doesn't decrease when history is deleted
      // Only count thread statuses that are completed (not comment statuses)
      const completedCount = await prisma.userStatus.count({
        where: {
          userId: input.userId,
          threadId: {
            not: null, // Only count thread completions, not comment completions
          },
          isCompleted: true,
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

  // Create user (Admin only)
  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
        isAdmin: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new Error('Email sudah terdaftar')
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          isAdmin: input.isAdmin || false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          createdAt: true,
        },
      })

      return user
    }),

  // Get all users (Admin only)
  getAllUsers: adminProcedure.query(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return users
  }),

  // Delete user (Admin only)
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Prevent admin from deleting themselves
      if (input.userId === ctx.session?.user?.id) {
        throw new Error('Tidak dapat menghapus akun sendiri')
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      })

      if (!user) {
        throw new Error('User tidak ditemukan')
      }

      // Delete user (cascade will delete related threads, comments, etc.)
      await prisma.user.delete({
        where: { id: input.userId },
      })

      return { success: true }
    }),
})

