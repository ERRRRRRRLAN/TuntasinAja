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
    let userId: string | null = null

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
      userId = ctx.session.user.id
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

    // Filter out threads that are already completed by this user AND completion date > 24 hours
    // Thread remains visible in dashboard for 24 hours after completion
    // Thread remains in database until ALL users in the same kelas complete it
    if (userId && !isAdmin) {
      const { getUTCDate } = await import('@/lib/date-utils')
      const oneDayAgo = getUTCDate()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      // Get all completed thread IDs from history for this user where completion > 24 hours
      const completedThreadIds = await prisma.history.findMany({
        where: {
          userId: userId,
          threadId: {
            not: null, // Only threads that still exist
          },
          completedDate: {
            lt: oneDayAgo, // Completed more than 24 hours ago
          },
        },
        select: {
          threadId: true,
        },
      })

      const completedIds = new Set(
        completedThreadIds
          .map((h) => h.threadId)
          .filter((id): id is string => id !== null)
      )

      // Filter out completed threads for this user (only if completion > 2 minutes)
      return threads.filter((thread) => !completedIds.has(thread.id))
    }

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
      try {
        // Get user's kelas to filter threads by the same kelas
        const currentUser = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            kelas: true,
          },
        })

        const userKelas = currentUser?.kelas

        // Get today's date in Jakarta timezone, converted to UTC for database
        // This ensures we only check threads created TODAY, not yesterday or tomorrow
        const today = getJakartaTodayAsUTC() // 00:00:00 today in Jakarta (converted to UTC)
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000) // 00:00:00 tomorrow

        // Check if thread with same title exists ONLY for today's date AND same kelas
        // This prevents bug where thread from different kelas is found
        // Example: Thread MTK from X RPL 1 will NOT be found when creating thread from XI BC 1
        const existingThread = await prisma.thread.findFirst({
          where: {
            title: input.title,
            date: {
              gte: today,    // >= 00:00:00 today (Jakarta time, UTC stored)
              lt: tomorrow,  // < 00:00:00 tomorrow (Jakarta time, UTC stored)
            },
            // Only find threads from the same kelas
            // If userKelas is null, we still filter but it will only match threads from users with null kelas
            author: userKelas
              ? {
                  kelas: userKelas,
                }
              : {
                  kelas: null,
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
      } catch (error: any) {
        // Log detailed error for debugging
        console.error('[thread.create] Error creating thread:', {
          error: error.message,
          code: error.code,
          meta: error.meta,
          cause: error.cause,
          userId: ctx.session.user.id,
          title: input.title,
        })
        
        // If it's a unique constraint error, provide a more helpful message
        if (error.code === 'P2002') {
          throw new Error(
            `Thread dengan mata pelajaran "${input.title}" sudah ada untuk hari ini. ` +
            `Jika Anda dari kelas yang berbeda, pastikan constraint database sudah dihapus. ` +
            `Error detail: ${error.meta?.target || 'unknown constraint'}`
          )
        }
        
        // Re-throw the error with original message
        throw error
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

      // Get comment IDs before deleting thread
      const threadWithComments = await prisma.thread.findUnique({
        where: { id: thread.id },
        select: {
          comments: {
            select: { id: true },
          },
        },
      })

      const commentIds = threadWithComments?.comments.map((c) => c.id) || []

      // Delete UserStatus related to this thread (cascade should handle this, but we do it explicitly to be sure)
      await prisma.userStatus.deleteMany({
        where: {
          threadId: thread.id,
        },
      })

      // Delete UserStatus related to comments in this thread
      if (commentIds.length > 0) {
        await prisma.userStatus.deleteMany({
          where: {
            commentId: {
              in: commentIds,
            },
          },
        })
      }

      // Delete the thread (histories will remain with threadId = null)
      // Cascade delete should handle UserStatus, but we already deleted them explicitly above
      await prisma.thread.delete({
        where: { id: thread.id },
      })

      deletedCount++
    }

    return { deleted: deletedCount }
  }),
})

