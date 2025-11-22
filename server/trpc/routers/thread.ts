import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { getJakartaTodayAsUTC, getUTCDate } from '@/lib/date-utils'

export const threadRouter = createTRPCRouter({
  // Get all threads
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Get user info if logged in
    let userKelas: string | null = null
    let isAdmin = false

    if (ctx.session?.user) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          isAdmin: true,
        },
      })
      userKelas = user?.kelas || null
      isAdmin = user?.isAdmin || false
    }

    // If user is admin, show all threads
    // If user is logged in with kelas, filter by kelas
    // If user is not logged in, show all threads (public view)
    const threads = await prisma.thread.findMany({
      where: isAdmin
        ? undefined // Admin sees all
        : userKelas
        ? {
            // Filter by kelas of thread author
            author: {
              kelas: userKelas,
            },
          }
        : undefined, // Public sees all
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            kelas: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                kelas: true,
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
      // Get today's date in Jakarta timezone, converted to UTC for database
      const today = getJakartaTodayAsUTC()
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

      // Check if thread with same title and date exists
      const existingThread = await prisma.thread.findFirst({
        where: {
          title: input.title,
          date: {
            gte: today,
            lt: tomorrow,
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
      // Explicitly set createdAt to current time in Jakarta timezone
      const now = getUTCDate()
      const thread = await prisma.thread.create({
        data: {
          title: input.title,
          authorId: ctx.session.user.id,
          date: today,
          createdAt: now,
          comments: input.comment
            ? {
                create: {
                  authorId: ctx.session.user.id,
                  content: input.comment,
                  createdAt: now,
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
      // Get thread data before deletion to preserve in history
      const thread = await prisma.thread.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread not found')
      }

      // Update all histories related to this thread with denormalized data
      // Set threadId to null explicitly to avoid unique constraint issues
      // This ensures history remains even after thread is deleted
      await prisma.history.updateMany({
        where: {
          threadId: input.id,
        },
        data: {
          threadTitle: thread.title,
          threadAuthorId: thread.author.id,
          threadAuthorName: thread.author.name,
          threadId: null, // Set to null explicitly before deleting thread
        },
      })

      // Delete the thread (histories will remain with threadId = null)
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

  // Auto-delete threads older than 1 day (for cron job)
  autoDeleteOldThreads: publicProcedure.mutation(async () => {
    const oneDayAgo = getUTCDate()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // Find threads older than 1 day
    const oldThreads = await prisma.thread.findMany({
      where: {
        createdAt: {
          lt: oneDayAgo,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        histories: true,
      },
    })

    let deletedCount = 0

    // For each old thread, update histories to store thread data before deletion
    for (const thread of oldThreads) {
      // Update all histories related to this thread with denormalized data
      // Set threadId to null explicitly to avoid unique constraint issues
      await prisma.history.updateMany({
        where: {
          threadId: thread.id,
        },
        data: {
          threadTitle: thread.title,
          threadAuthorId: thread.author.id,
          threadAuthorName: thread.author.name,
          threadId: null, // Set to null explicitly before deleting thread
        },
      })

      // Delete the thread (histories will remain with threadId = null)
      await prisma.thread.delete({
        where: { id: thread.id },
      })

      deletedCount++
    }

    return { deleted: deletedCount }
  }),
})

