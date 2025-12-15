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
      // Prevent admin from checking/unchecking threads
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { isAdmin: true },
      })
      
      if ((user as any)?.isAdmin) {
        throw new Error('Admin tidak dapat mencentang thread. Admin hanya dapat melihat statistik pengerjaan.')
      }
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

      // Always create/update history when thread is checked
      // This is necessary for the 24-hour hide feature to work
      if (input.isCompleted) {
        const thread = await prisma.thread.findUnique({
          where: { id: input.threadId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        if (thread) {
          // Find existing history (if threadId is not null)
          const existingHistory = await prisma.history.findFirst({
            where: {
              userId: ctx.session.user.id,
              threadId: input.threadId,
            },
          })

          if (existingHistory) {
            // History already exists - don't update completedDate to preserve the original completion time
            // Only update denormalized data in case thread info changed
            // This ensures the 24-hour timer is calculated from the first completion time
            await prisma.history.update({
              where: { id: existingHistory.id },
              data: {
                // Keep completedDate as is - don't reset the 24-hour timer
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
              },
            })
          }

          // Check if this user is the last one to complete the thread
          // If yes and oldest completion > 24 hours, delete thread immediately
          // This check applies to both new and existing history
          const threadWithAuthor = await prisma.thread.findUnique({
            where: { id: input.threadId },
            include: {
              author: {
                select: {
                  kelas: true,
                },
              },
              histories: {
                select: {
                  userId: true,
                  completedDate: true,
                },
              },
            },
          })

          if (threadWithAuthor && (threadWithAuthor.author as any)?.kelas) {
            const authorKelas = (threadWithAuthor.author as any).kelas

            // Get all users in the same kelas
            const usersInSameKelas = await prisma.user.findMany({
              where: {
                kelas: authorKelas,
                isAdmin: false,
              } as any,
              select: {
                id: true,
              },
            })

            const userIdsInKelas = new Set(usersInSameKelas.map((u) => u.id))
            const completedUserIds = new Set(
              threadWithAuthor.histories.map((h: { userId: string }) => h.userId)
            )

            // Check if ALL users in the same kelas have completed the thread
            const allUsersCompleted = Array.from(userIdsInKelas).every((userId) =>
              completedUserIds.has(userId)
            )

            if (allUsersCompleted) {
              // Get oldest completion date
              const completionDates = threadWithAuthor.histories.map(
                (h: { completedDate: Date }) => new Date(h.completedDate)
              )
              const oldestCompletion =
                completionDates.length > 0
                  ? new Date(Math.min(...completionDates.map((d) => d.getTime())))
                  : null

              // Calculate 24 hours ago
              const now = getUTCDate()
              const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

              // If oldest completion is older than 24 hours, delete thread immediately
              if (oldestCompletion && oldestCompletion < twentyFourHoursAgo) {
                // Update all histories to set threadId to null
                await prisma.history.updateMany({
                  where: {
                    threadId: input.threadId,
                  },
                  data: {
                    threadId: null as any,
                  },
                })

                // Get comment IDs
                const threadWithComments = await prisma.thread.findUnique({
                  where: { id: input.threadId },
                  select: {
                    comments: {
                      select: { id: true },
                    },
                  },
                })

                const commentIds = threadWithComments?.comments.map((c) => c.id) || []

                // Delete UserStatus related to this thread
                await prisma.userStatus.deleteMany({
                  where: {
                    threadId: input.threadId,
                  },
                })

                // Delete UserStatus related to comments
                if (commentIds.length > 0) {
                  await prisma.userStatus.deleteMany({
                    where: {
                      commentId: {
                        in: commentIds,
                      },
                    },
                  })
                }

                // Delete the thread (histories remain with threadId = null)
                await prisma.thread.delete({
                  where: { id: input.threadId },
                })
              }
            }
          }

          if (!existingHistory) {
            // Create new history - always create when thread is checked for the first time
            // This ensures the 24-hour hide feature works correctly
            await prisma.history.create({
              data: {
                userId: ctx.session.user.id,
                threadId: input.threadId,
                threadTitle: thread.title,
                threadAuthorId: thread.author.id,
                threadAuthorName: thread.author.name,
                completedDate: getUTCDate(), // Set completion date to now (first time check)
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
      // Prevent admin from checking/unchecking comments
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { isAdmin: true },
      })
      
      if ((user as any)?.isAdmin) {
        throw new Error('Admin tidak dapat mencentang comment. Admin hanya dapat melihat statistik pengerjaan.')
      }

      // Check if this is a group task and get group members
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        select: {
          isGroupTask: true,
          groupMembers: {
            select: {
              userId: true,
            },
          },
        },
      })

      const isGroupTask = thread?.isGroupTask || false
      const groupMemberIds = isGroupTask ? thread?.groupMembers.map(m => m.userId) || [] : []

      // For group tasks: shared completion (all members see the same status)
      // For individual tasks: only update current user's status
      const userIdsToUpdate = isGroupTask && groupMemberIds.length > 0
        ? groupMemberIds
        : [ctx.session.user.id]

      if (input.isCompleted) {
        // Mark comment as completed for all relevant users
        await Promise.all(
          userIdsToUpdate.map(userId =>
            prisma.userStatus.upsert({
              where: {
                userId_commentId: {
                  userId: userId,
                  commentId: input.commentId,
                },
              },
              create: {
                userId: userId,
                commentId: input.commentId,
                threadId: null,
                isCompleted: true,
              },
              update: {
                isCompleted: true,
              },
            })
          )
        )
      } else {
        // Unmark comment for all relevant users
        await prisma.userStatus.deleteMany({
          where: {
            userId: {
              in: userIdsToUpdate,
            },
            commentId: input.commentId,
          },
        })
      }

      // Check if thread should be moved to history
      const threadWithDetails = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          comments: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          groupMembers: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (threadWithDetails) {
        // For group tasks, use same userIdsToUpdate as above
        // For individual tasks, only check current user
        const usersToCheck = isGroupTask && groupMemberIds.length > 0
          ? groupMemberIds
          : [ctx.session.user.id]

        // Check for EACH user if we should auto-complete thread
        for (const userId of usersToCheck) {
          const threadStatus = await prisma.userStatus.findUnique({
            where: {
              userId_threadId: {
                userId: userId,
                threadId: input.threadId,
              },
            },
          })

          // Get all comment statuses for this thread for this user
          const commentsStatuses = await Promise.all(
            threadWithDetails.comments.map(async (comment) => {
              const status = await prisma.userStatus.findUnique({
                where: {
                  userId_commentId: {
                    userId: userId,
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
            threadWithDetails.comments.length === 0 || 
            commentsStatuses.every((status) => status === true)
          const threadCompleted = threadStatus?.isCompleted ?? false

          // Auto-check thread if all comments are completed
          if (allCommentsCompleted && !threadCompleted) {
            await prisma.userStatus.upsert({
              where: {
                userId_threadId: {
                  userId: userId,
                  threadId: input.threadId,
                },
              },
              create: {
                userId: userId,
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
              userId: userId,
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
                threadTitle: threadWithDetails.title,
                threadAuthorId: threadWithDetails.author.id,
                threadAuthorName: threadWithDetails.author.name,
              },
            })
            } else {
              // Create new history
              await prisma.history.create({
                data: {
                  userId: userId,
                  threadId: input.threadId,
                  threadTitle: threadWithDetails.title,
                  threadAuthorId: threadWithDetails.author.id,
                  threadAuthorName: threadWithDetails.author.name,
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
                userId: userId,
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
                  threadTitle: threadWithDetails.title,
                  threadAuthorId: threadWithDetails.author.id,
                  threadAuthorName: threadWithDetails.author.name,
                },
              })
            } else {
              // Create new history
              await prisma.history.create({
                data: {
                  userId: userId,
                  threadId: input.threadId,
                  threadTitle: threadWithDetails.title,
                  threadAuthorId: threadWithDetails.author.id,
                  threadAuthorName: threadWithDetails.author.name,
                  completedDate: getUTCDate(),
                },
              })
            }
          } else {
            // Remove from history if thread or comments are unchecked
            await prisma.history.deleteMany({
              where: {
                userId: userId,
                threadId: input.threadId,
              },
            })
          }
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

    // Build where clause for filtering (same logic as thread.getAll)
    const whereClause = isAdmin
      ? undefined // Admin sees all
      : userId && userKelas
      ? {
          OR: [
            // Individual tasks from same kelas
            {
              isGroupTask: false,
              author: {
                kelas: userKelas,
              },
            },
            // Group tasks where user is a member
            {
              isGroupTask: true,
              groupMembers: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        }
      : userKelas
      ? {
          // Fallback: only show tasks from same kelas (if not logged in)
          author: {
            kelas: userKelas,
          },
        }
      : undefined // Public sees all

    // Get all threads visible to this user (same logic as thread.getAll)
    const threads = await prisma.thread.findMany({
      where: whereClause,
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

  // Get overdue tasks (uncompleted tasks older than 7 days)
  // Disabled for admin users (admin doesn't have kelas)
  getOverdueTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kelas: true, isAdmin: true },
    })
    
    // Return empty array for admin users (admin doesn't have kelas)
    if ((user as any)?.isAdmin) {
      return { overdueTasks: [] }
    }
    
    const userKelas = user?.kelas || null
    
    // If user doesn't have kelas, return empty array
    if (!userKelas) {
      return { overdueTasks: [] }
    }
    
    const sevenDaysAgo = getUTCDate()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const threads = await prisma.thread.findMany({
      where: {
        author: {
          kelas: userKelas,
        },
      },
      include: {
        author: {
          select: { id: true, name: true, kelas: true },
        },
        comments: {
          select: { id: true, content: true },
        },
      },
    })

    const overdueTasks = []
    for (const thread of threads) {
      const threadDate = new Date(thread.createdAt)
      if (threadDate < sevenDaysAgo) {
        const threadStatus = await prisma.userStatus.findUnique({
          where: {
            userId_threadId: {
              userId: userId,
              threadId: thread.id,
            },
          },
        })
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

