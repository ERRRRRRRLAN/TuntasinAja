import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { getUTCDate } from '@/lib/date-utils'

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
          author: {
            select: {
              id: true,
              name: true,
            },
          },
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
          // Find existing history (if threadId is not null)
          const existingHistory = await prisma.history.findFirst({
            where: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          })

          if (existingHistory) {
            // Update existing history
            await prisma.history.update({
              where: { id: existingHistory.id },
              data: {
                completedDate: getUTCDate(),
                // Update denormalized data in case thread info changed
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
              },
            })
          } else {
            // Create new history
            await prisma.history.create({
              data: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
                completedDate: getUTCDate(),
              },
            })
          }
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
          author: {
            select: {
              id: true,
              name: true,
            },
          },
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
          // Find existing history (if threadId is not null)
          const existingHistory = await prisma.history.findFirst({
            where: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          })

          if (existingHistory) {
            // Update existing history
            await prisma.history.update({
              where: { id: existingHistory.id },
              data: {
                completedDate: getUTCDate(),
                // Update denormalized data in case thread info changed
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
              },
            })
          } else {
            // Create new history
            await prisma.history.create({
              data: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
                completedDate: getUTCDate(),
              },
            })
          }
        } else if (allCommentsCompleted && threadCompleted) {
          // Move to history if:
          // 1. All comments are completed (or thread has no comments)
          // 2. Thread is also completed
          // Find existing history (if threadId is not null)
          const existingHistory = await prisma.history.findFirst({
            where: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          })

          if (existingHistory) {
            // Update existing history
            await prisma.history.update({
              where: { id: existingHistory.id },
              data: {
                completedDate: getUTCDate(),
                // Update denormalized data in case thread info changed
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
              },
            })
          } else {
            // Create new history
            await prisma.history.create({
              data: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
                completedDate: getUTCDate(),
              },
            })
          }
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

  // Get uncompleted comments count for current user
  getUncompletedCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get all threads that are visible to this user (based on kelas)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kelas: true,
        isAdmin: true,
      },
    })

    const userKelas = user?.kelas || null
    const isAdmin = user?.isAdmin || false

    // Get all threads visible to this user (same logic as thread.getAll)
    const threads = await prisma.thread.findMany({
      where: isAdmin
        ? undefined // Admin sees all
        : userKelas
        ? {
            author: {
              kelas: userKelas,
            },
          }
        : undefined,
      select: {
        id: true,
        comments: {
          select: {
            id: true,
          },
        },
      },
    })

    // Get all comment IDs from visible threads
    const allCommentIds = threads.flatMap((thread) =>
      thread.comments.map((comment) => comment.id)
    )

    if (allCommentIds.length === 0) {
      return { uncompletedCount: 0 }
    }

    // Get all completed comment statuses for this user
    const completedStatuses = await prisma.userStatus.findMany({
      where: {
        userId: userId,
        commentId: {
          in: allCommentIds,
        },
        isCompleted: true,
      },
      select: {
        commentId: true,
      },
    })

    const completedCommentIds = new Set(
      completedStatuses.map((s) => s.commentId).filter((id): id is string => id !== null)
    )

    // Count uncompleted comments (comments that exist but are not completed)
    const uncompletedCount = allCommentIds.filter(
      (commentId) => !completedCommentIds.has(commentId)
    ).length

    return { uncompletedCount }
  }),

  // Cleanup orphaned UserStatus (for cron job)
  cleanupOrphanedStatuses: protectedProcedure.mutation(async () => {
    let deletedCount = 0

    // Cleanup UserStatus with threadId that doesn't exist
    const orphanedThreadStatuses = await prisma.userStatus.findMany({
      where: {
        threadId: {
          not: null,
        },
      },
      select: {
        id: true,
        threadId: true,
      },
    })

    // Check which threadIds don't exist
    const validThreadIds = await prisma.thread.findMany({
      select: { id: true },
    })
    const validThreadIdSet = new Set(validThreadIds.map((t) => t.id))

    const orphanedThreadStatusIds = orphanedThreadStatuses
      .filter((status) => status.threadId && !validThreadIdSet.has(status.threadId))
      .map((status) => status.id)

    if (orphanedThreadStatusIds.length > 0) {
      const result = await prisma.userStatus.deleteMany({
        where: {
          id: {
            in: orphanedThreadStatusIds,
          },
        },
      })
      deletedCount += result.count
    }

    // Cleanup UserStatus with commentId that doesn't exist
    const orphanedCommentStatuses = await prisma.userStatus.findMany({
      where: {
        commentId: {
          not: null,
        },
      },
      select: {
        id: true,
        commentId: true,
      },
    })

    // Check which commentIds don't exist
    const validCommentIds = await prisma.comment.findMany({
      select: { id: true },
    })
    const validCommentIdSet = new Set(validCommentIds.map((c) => c.id))

    const orphanedCommentStatusIds = orphanedCommentStatuses
      .filter((status) => status.commentId && !validCommentIdSet.has(status.commentId))
      .map((status) => status.id)

    if (orphanedCommentStatusIds.length > 0) {
      const result = await prisma.userStatus.deleteMany({
        where: {
          id: {
            in: orphanedCommentStatusIds,
          },
        },
      })
      deletedCount += result.count
    }

    // Cleanup old UserStatus (older than 30 days and not completed)
    // This is optional - only cleanup if status is old and not completed
    const thirtyDaysAgo = getUTCDate()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const oldIncompleteStatuses = await prisma.userStatus.deleteMany({
      where: {
        isCompleted: false,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    })

    deletedCount += oldIncompleteStatuses.count

    return { deleted: deletedCount }
  }),

  // Get overdue incomplete tasks (older than 7 days)
  getOverdueTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kelas: true,
        isAdmin: true,
      },
    })

    const userKelas = user?.kelas || null
    const isAdmin = user?.isAdmin || false

    // Calculate date 7 days ago
    const sevenDaysAgo = getUTCDate()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get all threads visible to this user
    const threads = await prisma.thread.findMany({
      where: isAdmin
        ? undefined // Admin sees all
        : userKelas
        ? {
            author: {
              kelas: userKelas,
            },
          }
        : undefined,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            kelas: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    })

    // Filter threads that:
    // 1. Are older than 7 days (based on createdAt)
    // 2. Are not completed by this user
    const overdueTasks: Array<{
      threadId: string
      threadTitle: string
      threadDate: Date
      authorName: string
      daysOverdue: number
    }> = []

    for (const thread of threads) {
      // Check if thread is older than 7 days
      const threadDate = new Date(thread.createdAt)
      if (threadDate < sevenDaysAgo) {
        // Check if thread is not completed by this user
        const threadStatus = await prisma.userStatus.findUnique({
          where: {
            userId_threadId: {
              userId: userId,
              threadId: thread.id,
            },
          },
        })

        // If thread is not completed, add to overdue list
        if (!threadStatus || !threadStatus.isCompleted) {
          const daysOverdue = Math.floor(
            (getUTCDate().getTime() - threadDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          overdueTasks.push({
            threadId: thread.id,
            threadTitle: thread.title,
            threadDate: threadDate,
            authorName: thread.author.name,
            daysOverdue: daysOverdue,
          })
        }
      }
    }

    return { overdueTasks }
  }),
})

