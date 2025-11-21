import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const threadRouter = createTRPCRouter({
  // Get all threads
  getAll: publicProcedure.query(async () => {
    const threads = await prisma.thread.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return threads
  }),

  // Get thread by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const thread = await prisma.thread.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread not found')
      }

      return thread
    }),

  // Create thread
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if thread with same title and date exists
      const existingThread = await prisma.thread.findFirst({
        where: {
          title: input.title,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (existingThread) {
        // If comment provided, add as comment
        if (input.comment) {
          const comment = await prisma.comment.create({
            data: {
              threadId: existingThread.id,
              authorId: ctx.session.user.id,
              content: input.comment,
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })

          return {
            type: 'comment' as const,
            thread: existingThread,
            comment,
          }
        }

        throw new Error('Thread already exists for today')
      }

      // Create new thread
      const thread = await prisma.thread.create({
        data: {
          title: input.title,
          authorId: ctx.session.user.id,
          date: today,
          comments: input.comment
            ? {
                create: {
                  authorId: ctx.session.user.id,
                  content: input.comment,
                },
              }
            : undefined,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
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
      })

      return {
        type: 'thread' as const,
        thread,
      }
    }),

  // Add comment to thread
  addComment: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await prisma.comment.create({
        data: {
          threadId: input.threadId,
          authorId: ctx.session.user.id,
          content: input.content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return comment
    }),

  // Delete thread (Admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.thread.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Delete comment (Admin only)
  deleteComment: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.comment.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})

