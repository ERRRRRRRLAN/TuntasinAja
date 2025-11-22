import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// This API route can be called by Vercel Cron Jobs or external cron services
// Auto-deletes threads that were COMPLETED more than 2 minutes ago (TESTING MODE)
// Only deletes threads that are already completed (have history entry)
// Threads that are not completed will remain in the database
// History remains stored for 30 days (separate cleanup)
// To set up Vercel Cron, add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/auto-delete-threads",
//     "schedule": "* * * * *" // Every minute (for testing)
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
    // TESTING MODE: 2 minutes instead of 24 hours
    const twoMinutesAgo = getUTCDate()
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2)

    // Find histories where thread was completed more than 2 minutes ago
    // Only delete threads that are already completed (have history with completedDate > 2 minutes)
    const oldHistories = await prisma.history.findMany({
      where: {
        completedDate: {
          lt: twoMinutesAgo, // Completed more than 2 minutes ago
        },
        threadId: {
          not: null as any, // Only threads that still exist (not already deleted)
        },
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
            comments: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    let deletedCount = 0
    const processedThreadIds = new Set<string>()

    // For each old history, delete the related thread (if not already processed)
    for (const history of oldHistories) {
      // Skip if thread doesn't exist or already processed
      if (!history.thread || processedThreadIds.has(history.thread.id)) {
        continue
      }

      const thread = history.thread
      processedThreadIds.add(thread.id)

      // Update all histories related to this thread
      // Set threadId to null explicitly to avoid unique constraint issues
      // This ensures history remains even after thread is deleted
      // Note: Denormalized data (threadTitle, threadAuthorId, threadAuthorName) 
      // should already be set when history was created
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
      message: `Successfully deleted ${deletedCount} completed thread(s) older than 2 minutes from completion date`,
    })
  } catch (error) {
    console.error('Error in auto-delete-threads cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

