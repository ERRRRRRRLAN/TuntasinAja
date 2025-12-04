import { z } from 'zod'
import { createTRPCRouter, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'

export const bulkOperationsRouter = createTRPCRouter({
  // Bulk edit user kelas
  bulkEditUserKelas: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()).min(1),
        kelas: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, kelas } = input
      const currentUserId = ctx.session?.user?.id

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, isAdmin: true },
          })

          if (!user) {
            failedCount++
            errors.push(`User dengan ID ${userId} tidak ditemukan`)
            continue
          }

          // Prevent editing admin
          if (user.isAdmin && userId !== currentUserId) {
            failedCount++
            errors.push(`${user.name}: Tidak dapat mengubah kelas admin`)
            continue
          }

          // Update kelas
          await prisma.user.update({
            where: { id: userId },
            data: { kelas },
          })

          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`User ID ${userId}: ${error.message || 'Terjadi kesalahan'}`)
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      }
    }),

  // Bulk set user permission
  bulkSetUserPermission: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()).min(1),
        permission: z.enum(['only_read', 'read_and_post_edit']),
      })
    )
    .mutation(async ({ input }) => {
      const { userIds, permission } = input

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true },
          })

          if (!user) {
            failedCount++
            errors.push(`User dengan ID ${userId} tidak ditemukan`)
            continue
          }

          // Upsert permission
          await prisma.userPermission.upsert({
            where: { userId },
            update: { permission },
            create: {
              userId,
              permission,
            },
          })

          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`User ID ${userId}: ${error.message || 'Terjadi kesalahan'}`)
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      }
    }),

  // Bulk extend subscription
  bulkExtendSubscription: adminProcedure
    .input(
      z.object({
        kelasList: z.array(z.string()).min(1),
        days: z.number().min(1).max(3650), // Max 10 years
      })
    )
    .mutation(async ({ input }) => {
      const { kelasList, days } = input

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const kelas of kelasList) {
        try {
          // Get current subscription
          const currentSubscription = await prisma.classSubscription.findUnique({
            where: { kelas },
          })

          const now = new Date()
          const daysInMs = days * 24 * 60 * 60 * 1000

          let newEndDate: Date
          if (currentSubscription) {
            // Extend from current end date
            newEndDate = new Date(currentSubscription.subscriptionEndDate.getTime() + daysInMs)
          } else {
            // Start from now
            newEndDate = new Date(now.getTime() + daysInMs)
          }

          // Upsert subscription
          await prisma.classSubscription.upsert({
            where: { kelas },
            update: {
              subscriptionEndDate: newEndDate,
            },
            create: {
              kelas,
              subscriptionEndDate: newEndDate,
            },
          })

          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`Kelas ${kelas}: ${error.message || 'Terjadi kesalahan'}`)
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      }
    }),

  // Bulk set subscription
  bulkSetSubscription: adminProcedure
    .input(
      z.object({
        kelasList: z.array(z.string()).min(1),
        days: z.number().min(1).max(3650),
      })
    )
    .mutation(async ({ input }) => {
      const { kelasList, days } = input

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      const now = new Date()
      const daysInMs = days * 24 * 60 * 60 * 1000
      const newEndDate = new Date(now.getTime() + daysInMs)

      for (const kelas of kelasList) {
        try {
          // Set subscription (reset from now)
          await prisma.classSubscription.upsert({
            where: { kelas },
            update: {
              subscriptionEndDate: newEndDate,
            },
            create: {
              kelas,
              subscriptionEndDate: newEndDate,
            },
          })

          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`Kelas ${kelas}: ${error.message || 'Terjadi kesalahan'}`)
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      }
    }),

  // Bulk expire subscription
  bulkExpireSubscription: adminProcedure
    .input(
      z.object({
        kelasList: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { kelasList } = input

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      const now = new Date()

      for (const kelas of kelasList) {
        try {
          // Set subscription to expired (yesterday)
          const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)

          await prisma.classSubscription.upsert({
            where: { kelas },
            update: {
              subscriptionEndDate: expiredDate,
            },
            create: {
              kelas,
              subscriptionEndDate: expiredDate,
            },
          })

          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`Kelas ${kelas}: ${error.message || 'Terjadi kesalahan'}`)
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      }
    }),

  // Bulk delete threads by date range and kelas
  bulkDeleteThreads: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        kelas: z.string().optional(),
        confirm: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { startDate, endDate, kelas, confirm } = input

      if (!confirm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Konfirmasi diperlukan untuk menghapus thread',
        })
      }

      // Build where clause
      const where: any = {}

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) {
          where.createdAt.gte = startDate
        }
        if (endDate) {
          where.createdAt.lte = endDate
        }
      }

      if (kelas) {
        where.author = {
          kelas,
        }
      }

      // Count threads to be deleted
      const count = await prisma.thread.count({ where })

      if (count === 0) {
        return {
          deleted: 0,
          message: 'Tidak ada thread yang sesuai dengan kriteria',
        }
      }

      // Delete threads (cascade will handle related data)
      await prisma.thread.deleteMany({ where })

      return {
        deleted: count,
        message: `Berhasil menghapus ${count} thread`,
      }
    }),

  // Bulk delete comments by date range
  bulkDeleteComments: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        confirm: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { startDate, endDate, confirm } = input

      if (!confirm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Konfirmasi diperlukan untuk menghapus comment',
        })
      }

      // Build where clause
      const where: any = {}

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) {
          where.createdAt.gte = startDate
        }
        if (endDate) {
          where.createdAt.lte = endDate
        }
      }

      // Count comments to be deleted
      const count = await prisma.comment.count({ where })

      if (count === 0) {
        return {
          deleted: 0,
          message: 'Tidak ada comment yang sesuai dengan kriteria',
        }
      }

      // Delete comments (cascade will handle related data)
      await prisma.comment.deleteMany({ where })

      return {
        deleted: count,
        message: `Berhasil menghapus ${count} comment`,
      }
    }),

  // Move users between kelas
  moveUsersBetweenKelas: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()).min(1),
        targetKelas: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, targetKelas } = input
      const currentUserId = ctx.session?.user?.id

      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, isAdmin: true, kelas: true },
          })

          if (!user) {
            failedCount++
            errors.push(`User dengan ID ${userId} tidak ditemukan`)
            continue
          }

          // Prevent moving admin
          if (user.isAdmin && userId !== currentUserId) {
            failedCount++
            errors.push(`${user.name}: Tidak dapat memindahkan admin`)
            continue
          }

          // Update kelas
          await prisma.user.update({
            where: { id: userId },
            data: { kelas: targetKelas },
          })

          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`User ID ${userId}: ${error.message || 'Terjadi kesalahan'}`)
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
        message: `Berhasil memindahkan ${successCount} user ke kelas ${targetKelas || 'null'}`,
      }
    }),

  // Cleanup orphaned user statuses
  cleanupOrphanedUserStatuses: adminProcedure
    .input(
      z.object({
        confirm: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { confirm } = input

      if (!confirm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Konfirmasi diperlukan untuk cleanup orphaned data',
        })
      }

      let deletedCount = 0

      try {
        // Delete user statuses with non-existent threadId
        const orphanedByThread = await prisma.$executeRaw`
          DELETE FROM user_statuses
          WHERE thread_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM threads WHERE threads.id = user_statuses.thread_id
          )
        `
        deletedCount += Number(orphanedByThread)

        // Delete user statuses with non-existent commentId
        const orphanedByComment = await prisma.$executeRaw`
          DELETE FROM user_statuses
          WHERE comment_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM comments WHERE comments.id = user_statuses.comment_id
          )
        `
        deletedCount += Number(orphanedByComment)
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error cleaning up orphaned data: ${error.message}`,
        })
      }

      return {
        deleted: deletedCount,
        message: `Berhasil menghapus ${deletedCount} orphaned user statuses`,
      }
    }),
})

