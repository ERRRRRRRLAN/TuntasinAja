import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { getUTCDate } from '@/lib/date-utils'

export const feedbackRouter = createTRPCRouter({
  // Submit feedback (any logged in user)
  submit: protectedProcedure
    .input(
      z.object({
        content: z.string().min(10, 'Saran dan masukan harus minimal 10 karakter'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create feedback
      const feedback = await prisma.feedback.create({
        data: {
          userId: ctx.session.user.id,
          content: input.content.trim(),
          createdAt: getUTCDate(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              kelas: true,
            },
          },
        },
      })

      return feedback
    }),

  // Get all feedbacks (Admin only)
  getAll: adminProcedure.query(async () => {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            kelas: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return feedbacks
  }),

  // Mark feedback as read (Admin only)
  markAsRead: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.feedback.update({
        where: { id: input.id },
        data: { isRead: true },
      })

      return { success: true }
    }),

  // Mark feedback as unread (Admin only)
  markAsUnread: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.feedback.update({
        where: { id: input.id },
        data: { isRead: false },
      })

      return { success: true }
    }),

  // Delete feedback (Admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.feedback.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get unread count (Admin only)
  getUnreadCount: adminProcedure.query(async () => {
    const count = await prisma.feedback.count({
      where: {
        isRead: false,
      },
    })

    return { count }
  }),
})

