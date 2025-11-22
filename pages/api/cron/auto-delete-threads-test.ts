import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Manual testing endpoint - bisa dipanggil langsung tanpa cron
// Untuk testing auto-delete dengan timer 2 menit
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional: Add authentication/authorization
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
    const oldHistories = await prisma.history.findMany({
      where: {
        completedDate: {
          lt: twoMinutesAgo,
        },
        threadId: {
          not: null as any,
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

    for (const history of oldHistories) {
      if (!history.thread || processedThreadIds.has(history.thread.id)) {
        continue
      }

      const thread = history.thread
      processedThreadIds.add(thread.id)

      // Update all histories related to this thread
      // Set threadId to null explicitly to avoid unique constraint issues
      await prisma.history.updateMany({
        where: {
          threadId: thread.id,
        },
        data: {
          threadId: null as any,
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
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in auto-delete-threads-test:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

