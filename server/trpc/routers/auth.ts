import { z } from 'zod'
import { createTRPCRouter, publicProcedure, adminProcedure, protectedProcedure } from '../trpc'
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

  // Get user profile (simplified - no stats)
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
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
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

  // Get current user data (kelas, isAdmin)
  getUserData: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return { kelas: null, isAdmin: false }
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { 
        kelas: true,
        isAdmin: true,
      },
    })

    return { 
      kelas: user?.kelas || null, 
      isAdmin: user?.isAdmin || false 
    }
  }),

  // Create user (Admin only)
  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
        isAdmin: z.boolean().optional().default(false),
        kelas: z.string().optional(),
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

      // Validate kelas for non-admin users
      if (!input.isAdmin && !input.kelas) {
        throw new Error('Kelas harus diisi untuk user non-admin')
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
          kelas: input.isAdmin ? null : input.kelas || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          kelas: true,
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
        kelas: true,
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

  // Update user (Admin only)
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(3).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        isAdmin: z.boolean().optional(),
        kelas: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, password, ...updateData } = input

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error('User tidak ditemukan')
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email },
        })

        if (existingUser) {
          throw new Error('Email sudah digunakan oleh user lain')
        }
      }

      // Validate kelas for non-admin users
      const willBeAdmin = updateData.isAdmin !== undefined ? updateData.isAdmin : user.isAdmin
      if (!willBeAdmin && updateData.kelas === null) {
        throw new Error('Kelas harus diisi untuk user non-admin')
      }

      // Prepare update data
      const dataToUpdate: any = {}

      if (updateData.name !== undefined) {
        dataToUpdate.name = updateData.name
      }

      if (updateData.email !== undefined) {
        dataToUpdate.email = updateData.email
      }

      if (updateData.isAdmin !== undefined) {
        dataToUpdate.isAdmin = updateData.isAdmin
        // If making user admin, remove kelas
        if (updateData.isAdmin) {
          dataToUpdate.kelas = null
        } else if (updateData.kelas !== undefined) {
          dataToUpdate.kelas = updateData.kelas
        }
      } else if (updateData.kelas !== undefined) {
        dataToUpdate.kelas = updateData.kelas
      }

      // Hash password if provided
      if (password) {
        dataToUpdate.passwordHash = await bcrypt.hash(password, 10)
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          kelas: true,
          createdAt: true,
        },
      })

      return updatedUser
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

