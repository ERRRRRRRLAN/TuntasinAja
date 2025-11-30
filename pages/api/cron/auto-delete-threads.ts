import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// This API route can be called by Vercel Cron Jobs or external cron services
// Auto-deletes threads that were COMPLETED more than 24 hours ago
// Only deletes threads that are already completed (have history entry)
// Threads that are not completed will remain in the database
// History remains stored for 30 days (separate cleanup)
// To set up Vercel Cron, add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/auto-delete-threads",
//     "schedule": "0 0 * * *" // Every day at midnight
//   }]
// }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional: Add authentication/authorization
  // For Vercel Cron, you can check the Authorization header
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { getUTCDate } = await import('@/lib/date-utils')
    const oneDayAgo = getUTCDate()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // Find all threads that have at least one history entry older than 24 hours
    // We need to check if ALL users in the same kelas have completed the thread
    const threadsWithOldHistories = await prisma.thread.findMany({
      where: {
        histories: {
          some: {
            completedDate: {
              lt: oneDayAgo, // At least one user completed more than 24 hours ago
            },
          },
        },
      },
      include: {
        author: true,
        comments: {
          select: {
            id: true,
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

    let deletedCount = 0

    // For each thread, check if ALL users in the same kelas have completed it
    for (const thread of threadsWithOldHistories) {
      // Get author with kelas (using type assertion because Prisma client may need regeneration)
      const author = await prisma.user.findUnique({
        where: { id: thread.authorId },
        select: {
          kelas: true,
        } as any,
      }) as { kelas: string | null } | null

      // Skip if thread author has no kelas (admin or public thread)
      if (!author || !author.kelas) {
        continue
      }

      // Get all users in the same kelas as thread author
      const usersInSameKelas = await prisma.user.findMany({
        where: {
          kelas: author.kelas,
          isAdmin: false, // Exclude admins
        } as any,
        select: {
          id: true,
        },
      })

      const userIdsInKelas = new Set(usersInSameKelas.map((u) => u.id))

      // Get all users who have completed this thread (have history)
      const completedUserIds = new Set(
        thread.histories.map((h: { userId: string }) => h.userId)
      )

      // Check if ALL users in the same kelas have completed the thread
      const allUsersCompleted = Array.from(userIdsInKelas).every((userId) =>
        completedUserIds.has(userId)
      )

      if (!allUsersCompleted) {
        continue
      }

      // Check if at least the oldest completion is older than 24 hours
      // This ensures that the thread has been completed by all users for at least 24 hours
      const completionDates = thread.histories.map((h: { completedDate: Date }) => 
        new Date(h.completedDate)
      )
      const oldestCompletion = completionDates.length > 0 
        ? new Date(Math.min(...completionDates.map(d => d.getTime())))
        : null

      // Only delete if oldest completion is older than 24 hours
      // This allows deletion even if some users completed it recently (within 24h)
      // as long as at least one user completed it more than 24 hours ago
      if (!oldestCompletion || oldestCompletion >= oneDayAgo) {
        continue
      }

      // Update all histories related to this thread
      // Set threadId to null explicitly to avoid unique constraint issues
      // This ensures history remains even after thread is deleted
      await prisma.history.updateMany({
        where: {
          threadId: thread.id,
        },
        data: {
          threadId: null as any, // Set to null explicitly before deleting thread
        },
      })

      // Get comment IDs
      const commentIds = thread.comments?.map((c: { id: string }) => c.id) || []

      // Delete UserStatus related to this thread
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
      // Comments will be deleted via cascade
      await prisma.thread.delete({
        where: { id: thread.id },
      })

      deletedCount++
    }

    return res.status(200).json({
      success: true,
      deleted: deletedCount,
      message: `Successfully deleted ${deletedCount} completed thread(s) older than 24 hours from completion date`,
    })
  } catch (error) {
    console.error('Error in auto-delete-threads cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

