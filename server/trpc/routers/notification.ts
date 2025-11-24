import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const notificationRouter = createTRPCRouter({
  // Get all notifications for current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        thread: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                kelas: true,
              },
            },
          },
        },
        comment: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                kelas: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    })

    return notifications
  }),

  // Get unread notifications count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
    })

    return count
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await prisma.notification.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Ensure user owns this notification
        },
        data: {
          isRead: true,
        },
      })

      return notification
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return { success: true }
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.notification.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Ensure user owns this notification
        },
      })

      return { success: true }
    }),
})

