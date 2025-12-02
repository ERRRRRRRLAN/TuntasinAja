import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { getJakartaTodayAsUTC, getUTCDate } from '@/lib/date-utils'
import { getUserPermission, checkIsDanton } from '../trpc'
import { checkClassSubscription } from './subscription'
import { sendNotificationToClass } from './notification'

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

    // Filter out threads that are already completed by this user
    // Check both userStatus (immediate) and history (for threads completed > 24 hours ago)
    // Thread remains visible in dashboard for 24 hours after completion
    // Thread remains in database until ALL users in the same kelas complete it
    if (userId && !isAdmin) {
      const { getUTCDate } = await import('@/lib/date-utils')
      const oneDayAgo = getUTCDate()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      // Get all completed thread IDs from userStatus (immediate check - for newly completed threads)
      const completedUserStatuses = await prisma.userStatus.findMany({
        where: {
          userId: userId,
          threadId: {
            not: null,
          },
          commentId: null, // Only thread statuses, not comment statuses
          isCompleted: true,
        },
        select: {
          threadId: true,
        },
      })

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

      // Combine both sets of completed thread IDs
      const completedIds = new Set<string>()
      completedUserStatuses.forEach((status) => {
        if (status.threadId) {
          completedIds.add(status.threadId)
        }
      })
      completedThreadIds.forEach((h) => {
        if (h.threadId) {
          completedIds.add(h.threadId)
        }
      })

      // Filter out completed threads for this user
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
        // Check user permission - only_read users cannot create threads
        const permission = await getUserPermission(ctx.session.user.id)
        if (permission === 'only_read') {
          throw new Error('Anda hanya memiliki izin membaca. Tidak dapat membuat thread baru.')
        }

        // Get user's kelas to filter threads by the same kelas
        const currentUser = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            kelas: true,
            isAdmin: true,
          },
        }) as any

        const userKelas = currentUser?.kelas
        const isAdmin = currentUser?.isAdmin || false

        // Check subscription status (skip for admin)
        if (!isAdmin && userKelas) {
          const subscriptionStatus = await checkClassSubscription(userKelas)
          if (!subscriptionStatus.isActive) {
            throw new Error(`Subscription untuk kelas ${userKelas} sudah habis. Tidak dapat membuat thread baru.`)
          }
        }

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
            // Get comment author info
            const commentAuthor = await prisma.user.findUnique({
              where: { id: ctx.session.user.id },
              select: {
                kelas: true,
                name: true,
              },
            })

            // Use Jakarta time for comment creation
            const now = getUTCDate()
            const comment = await prisma.comment.create({
              data: {
                threadId: existingThread.id,
                authorId: ctx.session.user.id,
                content: input.comment,
                createdAt: now,
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

            // Send notification for new sub tugas (comment)
            if (userKelas && !isAdmin) {
              try {
                await sendNotificationToClass(
                  userKelas,
                  'Sub Tugas Baru',
                  `${commentAuthor?.name || 'Seseorang'} menambahkan sub tugas baru di ${existingThread.title}`,
                  {
                    type: 'new_comment',
                    threadId: existingThread.id,
                    threadTitle: existingThread.title,
                  }
                )
              } catch (error) {
                console.error('Error sending notification for new comment:', error)
                // Don't throw - notification failure shouldn't break comment creation
              }
            }

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
                kelas: true,
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

        // Send notification for new thread
        if (userKelas && !isAdmin) {
          try {
            // Validate and normalize kelas before sending
            const normalizedKelas = userKelas.trim()
            
            // Double-check thread author's kelas matches
            const threadAuthorKelas = thread.author.kelas?.trim()
            if (threadAuthorKelas !== normalizedKelas) {
              console.error('[ThreadRouter] ⚠️ Kelas mismatch detected!', {
                userKelas: normalizedKelas,
                threadAuthorKelas: threadAuthorKelas,
                authorId: thread.author.id,
                authorName: thread.author.name,
              })
              // Still proceed, but log the mismatch
            }

            const authorName = thread.author.name
            console.log('[ThreadRouter] Sending notification for new thread:', {
              kelas: normalizedKelas,
              threadAuthorKelas: threadAuthorKelas,
              authorName,
              authorId: thread.author.id,
              threadTitle: thread.title,
              threadId: thread.id,
            })
            const result = await sendNotificationToClass(
              normalizedKelas, // Use normalized kelas
              'Tugas Baru',
              `${authorName} membuat tugas baru: ${thread.title}`,
              {
                type: 'new_thread',
                threadId: thread.id,
                threadTitle: thread.title,
              }
            )
            console.log('[ThreadRouter] Notification result:', result)
          } catch (error) {
            console.error('[ThreadRouter] ❌ Error sending notification for new thread:', error)
            // Don't throw - notification failure shouldn't break thread creation
          }
        } else {
          console.log('[ThreadRouter] Skipping notification:', {
            hasKelas: !!userKelas,
            isAdmin,
            userKelas,
          })
        }

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
      // Check user permission - only_read users cannot add comments
      const permission = await getUserPermission(ctx.session.user.id)
      if (permission === 'only_read') {
        throw new Error('Anda hanya memiliki izin membaca. Tidak dapat menambahkan komentar.')
      }

      // Get user info first to check subscription
      const currentUser = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          isAdmin: true,
        },
      }) as any

      const userKelas = currentUser?.kelas
      const isAdmin = currentUser?.isAdmin || false

      // Check subscription status (skip for admin)
      if (!isAdmin && userKelas) {
        const subscriptionStatus = await checkClassSubscription(userKelas)
        if (!subscriptionStatus.isActive) {
          throw new Error(`Subscription untuk kelas ${userKelas} sudah habis. Tidak dapat menambahkan komentar.`)
        }
      }

      // Get thread info first
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              kelas: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread not found')
      }

      // Get comment author info
      const commentAuthor = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          name: true,
        },
      })

      // Use Jakarta time for comment creation
      const now = getUTCDate()
      const comment = await prisma.comment.create({
        data: {
          threadId: input.threadId,
          authorId: ctx.session.user.id,
          content: input.content,
          createdAt: now,
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

      // Send notification for new sub tugas (comment)
      // Only send if comment author is from the same class as thread author
      const threadAuthorKelas = thread.author.kelas?.trim()
      const normalizedUserKelas = userKelas?.trim()
      
      // Use exact match with trimmed values
      if (threadAuthorKelas && normalizedUserKelas === threadAuthorKelas && !isAdmin) {
        try {
          console.log('[ThreadRouter] Sending notification for new comment:', {
            threadAuthorKelas: threadAuthorKelas,
            userKelas: normalizedUserKelas,
            matches: normalizedUserKelas === threadAuthorKelas,
            threadId: thread.id,
            threadTitle: thread.title,
          })
          await sendNotificationToClass(
            threadAuthorKelas, // Use normalized kelas
            'Sub Tugas Baru',
            `${commentAuthor?.name || 'Seseorang'} menambahkan sub tugas baru di ${thread.title}`,
            {
              type: 'new_comment',
              threadId: thread.id,
              threadTitle: thread.title,
            }
          )
        } catch (error) {
          console.error('[ThreadRouter] ❌ Error sending notification for new comment:', error)
          // Don't throw - notification failure shouldn't break comment creation
        }
      } else {
        console.log('[ThreadRouter] Skipping notification for comment:', {
          hasThreadAuthorKelas: !!threadAuthorKelas,
          hasUserKelas: !!normalizedUserKelas,
          matches: normalizedUserKelas === threadAuthorKelas,
          isAdmin,
        })
      }

      return comment
    }),

  // Delete thread (Author only or Admin)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get thread data before deletion to preserve in history
      const thread = await prisma.thread.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              isAdmin: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread not found')
      }

      // Check if user is admin or danton of the same class
      const currentUser = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          isAdmin: true,
          isDanton: true,
          kelas: true,
        },
      }) as any

      const isAdmin = currentUser?.isAdmin || false
      const isDanton = currentUser?.isDanton || false
      const userKelas = currentUser?.kelas || null

      // Get thread author's kelas
      const threadAuthor = await prisma.user.findUnique({
        where: { id: thread.authorId },
        select: { kelas: true },
      })
      const threadAuthorKelas = threadAuthor?.kelas || null

      // Only allow deletion if:
      // 1. User is the author, OR
      // 2. User is admin, OR
      // 3. User is danton of the same class as thread author
      const isDantonOfSameClass = isDanton && userKelas === threadAuthorKelas && userKelas !== null

      if (thread.authorId !== ctx.session.user.id && !isAdmin && !isDantonOfSameClass) {
        throw new Error('Anda tidak memiliki izin untuk menghapus thread ini')
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

  // Edit comment (Author of comment only)
  editComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1, 'Konten komentar tidak boleh kosong'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check user permission - only_read users cannot edit comments
        const permission = await getUserPermission(ctx.session.user.id)
        if (permission === 'only_read') {
          throw new Error('Anda hanya memiliki izin membaca. Tidak dapat mengedit komentar.')
        }

        // Get user info to check subscription
        const currentUser = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            kelas: true,
            isAdmin: true,
          },
        }) as any

        const userKelas = currentUser?.kelas
        const isAdmin = currentUser?.isAdmin || false

        // Check subscription status (skip for admin)
        if (!isAdmin && userKelas) {
          const subscriptionStatus = await checkClassSubscription(userKelas)
          if (!subscriptionStatus.isActive) {
            throw new Error(`Subscription untuk kelas ${userKelas} sudah habis. Tidak dapat mengedit komentar.`)
          }
        }

        // Get comment with author info
        const comment = await prisma.comment.findUnique({
          where: { id: input.id },
          include: {
            author: {
              select: {
                id: true,
              },
            },
          },
        })

        if (!comment) {
          throw new Error('Komentar tidak ditemukan')
        }

        // Only allow edit if user is the author of the comment
        if (comment.authorId !== ctx.session.user.id) {
          throw new Error('Anda tidak memiliki izin untuk mengedit komentar ini')
        }

        // Validate content
        if (!input.content.trim()) {
          throw new Error('Konten komentar tidak boleh kosong')
        }

        // Update comment with Jakarta time
        const now = getUTCDate()
        const updatedComment = await prisma.comment.update({
          where: { id: input.id },
          data: {
            content: input.content.trim(),
            updatedAt: now,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                kelas: true,
              },
            },
          },
        })

        return updatedComment
      } catch (error: any) {
        // Log error for debugging
        console.error('[thread.editComment] Error editing comment:', {
          error: error.message,
          code: error.code,
          commentId: input.id,
          userId: ctx.session.user.id,
        })

        // Re-throw with user-friendly message
        throw new Error(error.message || 'Gagal mengedit komentar. Silakan coba lagi.')
      }
    }),

  // Delete comment (Author of comment OR author of thread OR Admin)
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get comment with thread and authors info
      const comment = await prisma.comment.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
            },
          },
          thread: {
            include: {
              author: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })

      if (!comment) {
        throw new Error('Comment not found')
      }

      // Check if user is admin or danton of the same class
      const currentUser = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          isAdmin: true,
          isDanton: true,
          kelas: true,
        },
      }) as any

      const isAdmin = currentUser?.isAdmin || false
      const isDanton = currentUser?.isDanton || false
      const userKelas = currentUser?.kelas || null

      // Get comment author's kelas
      const commentAuthor = await prisma.user.findUnique({
        where: { id: comment.authorId },
        select: { kelas: true },
      })
      const commentAuthorKelas = commentAuthor?.kelas || null

      // Allow deletion if:
      // 1. User is the author of the comment, OR
      // 2. User is the author of the thread, OR
      // 3. User is admin, OR
      // 4. User is danton of the same class as comment author
      const isCommentAuthor = comment.authorId === ctx.session.user.id
      const isThreadAuthor = comment.thread.authorId === ctx.session.user.id
      const isDantonOfSameClass = isDanton && userKelas === commentAuthorKelas && userKelas !== null

      if (!isCommentAuthor && !isThreadAuthor && !isAdmin && !isDantonOfSameClass) {
        throw new Error('Anda tidak memiliki izin untuk menghapus komentar ini')
      }

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

  // Get thread completion statistics (Admin only)
  getCompletionStats: adminProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input }) => {
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              kelas: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread not found')
      }

      const authorKelas = (thread.author as any)?.kelas

      if (!authorKelas) {
        // Thread by admin or no kelas - return empty stats
        return {
          completedCount: 0,
          totalCount: 0,
          completedUsers: [],
        }
      }

      // Get all users in the same kelas (excluding admins)
      const totalUsers = await prisma.user.findMany({
        where: {
          kelas: authorKelas,
          isAdmin: false,
        },
        select: {
          id: true,
        },
      })

      // Get all users who have completed this thread (have history)
      const completedHistories = await prisma.history.findMany({
        where: {
          threadId: input.threadId,
        },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        distinct: ['userId'],
      })

      const completedUsers = completedHistories.map((h) => ({
        id: h.user.id,
        name: h.user.name,
      }))

      return {
        completedCount: completedUsers.length,
        totalCount: totalUsers.length,
        completedUsers: completedUsers.sort((a, b) => a.name.localeCompare(b.name)),
      }
    }),
})
