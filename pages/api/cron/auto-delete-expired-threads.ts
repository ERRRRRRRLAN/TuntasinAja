import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// This API route can be called by Vercel Cron Jobs or external cron services
// Auto-deletes threads that have passed their deadline
// History remains stored (not deleted)
// To set up Vercel Cron, add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/auto-delete-expired-threads",
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
    const now = getUTCDate()

    // Find all threads that have passed their deadline
    // Only threads with deadline that is not null and is in the past
    const expiredThreads = await prisma.thread.findMany({
      where: {
        deadline: {
          not: null,
          lt: now, // Deadline is in the past
        },
      },
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
        histories: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    })

    let deletedCount = 0

    // For each expired thread, update histories and delete thread
    for (const thread of expiredThreads) {
      // Update all histories related to this thread with denormalized data
      // Set threadId to null explicitly to avoid unique constraint issues
      // This ensures history remains even after thread is deleted
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
      const commentIds = thread.comments.map((c) => c.id)

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
      message: `Successfully deleted ${deletedCount} expired thread(s) that have passed their deadline`,
    })
  } catch (error) {
    console.error('Error in auto-delete-expired-threads cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

