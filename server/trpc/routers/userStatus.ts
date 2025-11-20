import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const userStatusRouter = createTRPCRouter({
  // Toggle thread completion
  toggleThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        isCompleted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isCompleted) {
        // Mark thread as completed
        await prisma.userStatus.upsert({
          where: {
            userId_threadId: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          },
          create: {
            userId: ctx.session.user.id,
            threadId: input.threadId,
            isCompleted: true,
          },
          update: {
            isCompleted: true,
          },
        })

        // Auto-check all comments when thread is checked
        const thread = await prisma.thread.findUnique({
          where: { id: input.threadId },
          select: {
            comments: {
              select: { id: true },
            },
          },
        })

        if (thread && thread.comments.length > 0) {
          // Mark all comments as completed
          await Promise.all(
            thread.comments.map(async (comment) => {
              await prisma.userStatus.upsert({
                where: {
                  userId_commentId: {
                    userId: ctx.session.user.id,
                    commentId: comment.id,
                  },
                },
                create: {
                  userId: ctx.session.user.id,
                  commentId: comment.id,
                  threadId: null, // Don't set threadId to avoid unique constraint conflict
                  isCompleted: true,
                },
                update: {
                  isCompleted: true,
                },
              })
            })
          )
        }
      } else {
        // Uncheck thread - remove from history if exists
        await prisma.userStatus.deleteMany({
          where: {
            userId: ctx.session.user.id,
            threadId: input.threadId,
          },
        })

        // Remove from history when thread is unchecked
        await prisma.history.deleteMany({
          where: {
            userId: ctx.session.user.id,
            threadId: input.threadId,
          },
        })

        return { success: true }
      }

      // Check if all comments are completed and move to history
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          comments: true,
        },
      })

      if (thread && input.isCompleted) {
        // If thread has no comments, consider all comments as completed
        // Otherwise, check if all comments are completed
        const allCommentsCompleted = 
          thread.comments.length === 0 || 
          thread.comments.every(async (comment) => {
            const status = await prisma.userStatus.findUnique({
              where: {
                userId_commentId: {
                  userId: ctx.session.user.id,
                  commentId: comment.id,
                },
              },
            })
            return status?.isCompleted ?? false
          })

        // Check if all comments are actually completed
        const commentsStatuses = await Promise.all(
          thread.comments.map(async (comment) => {
            const status = await prisma.userStatus.findUnique({
              where: {
                userId_commentId: {
                  userId: ctx.session.user.id,
                  commentId: comment.id,
                },
              },
            })
            return status?.isCompleted ?? false
          })
        )

        const allCompleted = 
          thread.comments.length === 0 || 
          commentsStatuses.every((status) => status === true)

        // Move to history if all comments are completed and thread is completed
        if (allCompleted) {
          await prisma.history.upsert({
            where: {
              userId_threadId: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
              },
            },
            create: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
              completedDate: new Date(),
            },
            update: {
              completedDate: new Date(),
            },
          })
        }
      }

      return { success: true }
    }),

  // Toggle comment completion
  toggleComment: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        commentId: z.string(),
        isCompleted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isCompleted) {
        // Don't set threadId for comment status to avoid unique constraint conflict
        // We can get threadId from comment relation if needed
        await prisma.userStatus.upsert({
          where: {
            userId_commentId: {
              userId: ctx.session.user.id,
              commentId: input.commentId,
            },
          },
          create: {
            userId: ctx.session.user.id,
            commentId: input.commentId,
            // Don't set threadId to avoid conflict with thread status unique constraint
            threadId: null,
            isCompleted: true,
          },
          update: {
            isCompleted: true,
          },
        })
      } else {
        await prisma.userStatus.deleteMany({
          where: {
            userId: ctx.session.user.id,
            commentId: input.commentId,
          },
        })
      }

      // Check if thread should be moved to history
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          comments: true,
        },
      })

      if (thread) {
        const threadStatus = await prisma.userStatus.findUnique({
          where: {
            userId_threadId: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          },
        })

        // Get all comment statuses for this thread
        const commentsStatuses = await Promise.all(
          thread.comments.map(async (comment) => {
            const status = await prisma.userStatus.findUnique({
              where: {
                userId_commentId: {
                  userId: ctx.session.user.id,
                  commentId: comment.id,
                },
              },
            })
            return status?.isCompleted ?? false
          })
        )

        // If thread has no comments, consider all comments as completed
        // Otherwise, check if all comments are completed
        const allCommentsCompleted = 
          thread.comments.length === 0 || 
          commentsStatuses.every((status) => status === true)
        const threadCompleted = threadStatus?.isCompleted ?? false

        // Auto-check thread if all comments are completed
        if (allCommentsCompleted && !threadCompleted) {
          await prisma.userStatus.upsert({
            where: {
              userId_threadId: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
              },
            },
            create: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
              isCompleted: true,
            },
            update: {
              isCompleted: true,
            },
          })

          // After auto-checking thread, move to history immediately
          // because all comments are completed and thread is now completed
          await prisma.history.upsert({
            where: {
              userId_threadId: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
              },
            },
            create: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
              completedDate: new Date(),
            },
            update: {
              completedDate: new Date(),
            },
          })
        } else if (allCommentsCompleted && threadCompleted) {
          // Move to history if:
          // 1. All comments are completed (or thread has no comments)
          // 2. Thread is also completed
          await prisma.history.upsert({
            where: {
              userId_threadId: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
              },
            },
            create: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
              completedDate: new Date(),
            },
            update: {
              completedDate: new Date(),
            },
          })
        } else {
          // Remove from history if thread or comments are unchecked
          await prisma.history.deleteMany({
            where: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          })
        }
      }

      return { success: true }
    }),

  // Get user statuses for a thread
  getThreadStatuses: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get thread status (where threadId matches and commentId is null)
      const threadStatus = await prisma.userStatus.findUnique({
        where: {
          userId_threadId: {
            userId: ctx.session.user.id,
            threadId: input.threadId,
          },
        },
      })

      // Get all comments for this thread
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        select: {
          comments: {
            select: { id: true },
          },
        },
      })

      // Get comment statuses (where commentId is in thread's comments)
      // Note: comment statuses don't have threadId set to avoid unique constraint conflict
      const commentStatuses = thread && thread.comments.length > 0
        ? await prisma.userStatus.findMany({
            where: {
              userId: ctx.session.user.id,
              commentId: {
                in: thread.comments.map((c) => c.id),
              },
            },
          })
        : []

      // Combine thread status and comment statuses
      const allStatuses = []
      if (threadStatus) {
        allStatuses.push(threadStatus)
      }
      allStatuses.push(...commentStatuses)

      return allStatuses
    }),
})

