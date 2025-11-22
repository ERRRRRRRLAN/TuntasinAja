import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getUTCDate } from '@/lib/date-utils'

// This API route can be called by Vercel Cron Jobs or external cron services
// To set up Vercel Cron, add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/cleanup-user-statuses",
//     "schedule": "0 2 * * *" // Every day at 2 AM
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
      .map((status) => status.id!)

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
      .map((status) => status.id!)

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

    // Cleanup old incomplete UserStatus (older than 30 days and not completed)
    // This helps free up space from statuses that were never completed
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

    return res.status(200).json({
      success: true,
      deleted: deletedCount,
      message: `Successfully cleaned up ${deletedCount} orphaned/incomplete UserStatus record(s)`,
    })
  } catch (error) {
    console.error('Error in cleanup-user-statuses cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

