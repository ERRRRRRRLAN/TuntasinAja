import { z } from 'zod'
import { createTRPCRouter, dantonProcedure, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getUTCDate } from '@/lib/date-utils'
import { TRPCError } from '@trpc/server'

const MAX_USERS_PER_CLASS = 40

export const dantonRouter = createTRPCRouter({
  // Get all users in danton's class with their permissions
  getClassUsers: dantonProcedure.query(async ({ ctx }) => {
    const dantonKelas = ctx.dantonKelas

    const users = await prisma.user.findMany({
      where: {
        kelas: dantonKelas,
        isAdmin: false, // Exclude admins
      },
      select: {
        id: true,
        name: true,
        email: true,
        kelas: true,
        isDanton: true,
        createdAt: true,
        permission: {
          select: {
            id: true,
            permission: true,
            canCreateAnnouncement: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Map users with default permission if not set
    return users.map(user => ({
      ...user,
      permission: user.permission?.permission || 'read_and_post_edit' as const,
      canCreateAnnouncement: user.permission?.canCreateAnnouncement || false,
    }))
  }),

  // Get class statistics
  getClassStats: dantonProcedure.query(async ({ ctx }) => {
    const dantonKelas = ctx.dantonKelas

    // Count users in class
    const userCount = await prisma.user.count({
      where: {
        kelas: dantonKelas,
        isAdmin: false,
      },
    })

    // Count threads by users in this class
    const threadCount = await prisma.thread.count({
      where: {
        author: {
          kelas: dantonKelas,
        },
      },
    })

    // Count comments by users in this class
    const commentCount = await prisma.comment.count({
      where: {
        author: {
          kelas: dantonKelas,
        },
      },
    })

    return {
      userCount,
      threadCount,
      commentCount,
      maxUsers: MAX_USERS_PER_CLASS,
      remainingSlots: MAX_USERS_PER_CLASS - userCount,
    }
  }),

  // Update user permission
  updateUserPermission: dantonProcedure
    .input(
      z.object({
        userId: z.string(),
        permission: z.enum(['only_read', 'read_and_post_edit']),
        canCreateAnnouncement: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dantonKelas = ctx.dantonKelas

      // Check if user exists and is in danton's class
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          kelas: true,
          isDanton: true,
          isAdmin: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User tidak ditemukan',
        })
      }

      // Validate: user must be in danton's class
      if (user.kelas !== dantonKelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat mengatur permission user di kelas Anda sendiri',
        })
      }

      // Prevent danton from changing their own permission
      if (user.isDanton) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Danton tidak dapat mengubah permission sendiri',
        })
      }

      // Prevent changing admin permission
      if (user.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tidak dapat mengubah permission admin',
        })
      }

      // Create or update permission
      await prisma.userPermission.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          permission: input.permission,
          canCreateAnnouncement: input.canCreateAnnouncement ?? false,
        },
        update: {
          permission: input.permission,
          ...(input.canCreateAnnouncement !== undefined && { canCreateAnnouncement: input.canCreateAnnouncement }),
        },
      })

      return { success: true }
    }),

  // Edit user data in class
  editUserData: dantonProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(3).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        kelas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dantonKelas = ctx.dantonKelas
      const { userId, password, ...updateData } = input

      // Check if user exists and is in danton's class
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          kelas: true,
          isDanton: true,
          isAdmin: true,
          email: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User tidak ditemukan',
        })
      }

      // Validate: user must be in danton's class (or moving to danton's class)
      const targetKelas = updateData.kelas || user.kelas
      if (user.kelas !== dantonKelas && targetKelas !== dantonKelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat mengedit user di kelas Anda sendiri',
        })
      }

      // Prevent danton from editing themselves
      if (user.isDanton) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Danton tidak dapat mengedit data sendiri',
        })
      }

      // Prevent editing admin
      if (user.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tidak dapat mengedit data admin',
        })
      }

      // Validate: cannot move user to different class (danton can only manage their class)
      if (updateData.kelas && updateData.kelas !== dantonKelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat mengatur user di kelas Anda sendiri',
        })
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email },
        })

        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email sudah digunakan oleh user lain',
          })
        }
      }

      // Prepare update data
      const dataToUpdate: any = {}

      if (updateData.name !== undefined) {
        dataToUpdate.name = updateData.name
      }

      if (updateData.email !== undefined) {
        dataToUpdate.email = updateData.email
      }

      if (updateData.kelas !== undefined) {
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
          kelas: true,
          createdAt: true,
        },
      })

      return updatedUser
    }),

  // Add user to class
  addUserToClass: dantonProcedure
    .input(
      z.object({
        name: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dantonKelas = ctx.dantonKelas

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email sudah terdaftar',
        })
      }

      // Check class capacity (max 40 users)
      const userCount = await prisma.user.count({
        where: {
          kelas: dantonKelas,
          isAdmin: false,
        },
      })

      if (userCount >= MAX_USERS_PER_CLASS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Kelas sudah penuh. Maksimal ${MAX_USERS_PER_CLASS} user per kelas.`,
        })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10)

      // Use Jakarta time for user creation
      const now = getUTCDate()

      // Create user with default permission (read_and_post_edit)
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          kelas: dantonKelas,
          isAdmin: false,
          isDanton: false,
          createdAt: now,
          permission: {
            create: {
              permission: 'read_and_post_edit',
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          kelas: true,
          createdAt: true,
        },
      })

      return user
    }),

  // Delete user from class (only if user is in danton's class)
  deleteUserFromClass: dantonProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dantonKelas = ctx.dantonKelas

      // Check if user exists and is in danton's class
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          kelas: true,
          isDanton: true,
          isAdmin: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User tidak ditemukan',
        })
      }

      // Validate: user must be in danton's class
      if (user.kelas !== dantonKelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat menghapus user di kelas Anda sendiri',
        })
      }

      // Prevent danton from deleting themselves
      if (user.isDanton) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Danton tidak dapat menghapus akun sendiri',
        })
      }

      // Prevent deleting admin
      if (user.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Tidak dapat menghapus admin',
        })
      }

      // Delete user (cascade will delete related data)
      await prisma.user.delete({
        where: { id: input.userId },
      })

      return { success: true }
    }),
})

