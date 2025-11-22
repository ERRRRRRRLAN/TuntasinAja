import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// This API route can be called by Vercel Cron Jobs or external cron services
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
        comments: {
          select: {
            id: true,
          },
        },
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

      // Get comment IDs
      const commentIds = thread.comments?.map((c) => c.id) || []

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

    return res.status(200).json({
      success: true,
      deleted: deletedCount,
      message: `Successfully deleted ${deletedCount} thread(s) older than 1 day`,
    })
  } catch (error) {
    console.error('Error in auto-delete-threads cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

