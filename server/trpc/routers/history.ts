import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const historyRouter = createTRPCRouter({
  // Get user history
  getUserHistory: protectedProcedure.query(async ({ ctx }) => {
    const histories = await prisma.history.findMany({
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
              },
            },
          },
        },
      },
      orderBy: {
        completedDate: 'desc',
      },
    })

    return histories
  }),

  // Clean old history (for cron job)
  cleanOldHistory: protectedProcedure.mutation(async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.history.deleteMany({
      where: {
        completedDate: {
          lt: thirtyDaysAgo,
        },
      },
    })

    return { deleted: result.count }
  }),

  // Delete specific history entry
  deleteHistory: protectedProcedure
    .input(z.object({ historyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await prisma.history.deleteMany({
        where: {
          id: input.historyId,
          userId: ctx.session.user.id, // Ensure user can only delete their own history
        },
      })

      return { deleted: result.count > 0 }
    }),
})

