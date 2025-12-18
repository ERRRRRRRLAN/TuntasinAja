import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// This API route can be called by Vercel Cron Jobs or external cron services
// Auto-deletes threads and comments that have passed their deadline + 1 hour grace period
// - Deletes comments that have passed their deadline by at least 1 hour
// - Deletes threads that have passed their deadline by at least 1 hour OR if all their comments have expired
// History remains stored (not deleted) - especially for completed tasks
// To set up Vercel Cron, add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/auto-delete-expired-threads",
//     "schedule": "0 * * * *" // Every hour
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
    
    // Calculate 1 hour ago from now (grace period)
    const oneHourAgo = new Date(now)
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    let deletedThreadCount = 0
    let deletedCommentCount = 0

    // Step 1: Find all threads that have passed their deadline + 1 hour grace period
    // First, get threads with deadline that expired at least 1 hour ago
    const expiredThreads = await prisma.thread.findMany({
      where: {
        deadline: {
          not: null,
          lt: oneHourAgo, // Deadline is in the past by at least 1 hour
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
            deadline: true,
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

    // Step 2: Find threads that don't have deadline but all their comments have expired
    // Get all threads that have at least one comment with deadline
    const threadsWithComments = await prisma.thread.findMany({
      where: {
        deadline: null, // Thread itself doesn't have deadline
        comments: {
          some: {
            deadline: {
              not: null, // Has at least one comment with deadline
            },
          },
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
            deadline: true,
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

    // Filter threads where all comments with deadline have expired (+ 1 hour grace period)
    // If a thread has comments without deadline, it won't be deleted (only comments with deadline count)
    const threadsWithAllExpiredComments = threadsWithComments.filter((thread) => {
      if (thread.comments.length === 0) return false // Skip threads with no comments
      
      // Get all comments with deadline
      const commentsWithDeadline = thread.comments.filter((c) => c.deadline !== null)
      
      // If thread has no comments with deadline, don't delete it
      if (commentsWithDeadline.length === 0) return false
      
      // Check if ALL comments with deadline have expired by at least 1 hour
      // If all comments with deadline are expired + 1 hour, delete the thread
      // Comments without deadline don't count (they don't expire)
      const allDeadlinesExpired = commentsWithDeadline.every((comment) => {
        if (!comment.deadline) return false // Should not happen, but just in case
        return new Date(comment.deadline) < oneHourAgo
      })
      
      return allDeadlinesExpired
    })

    // Combine both lists
    const allExpiredThreads = [...expiredThreads, ...threadsWithAllExpiredComments]
    
    // Step 3: Find standalone expired comments (comments in threads that are NOT expired)
    // These are comments that have expired deadline + 1 hour but their thread is not expired
    const allThreadIds = allExpiredThreads.map((t) => t.id)
    const expiredComments = await prisma.comment.findMany({
      where: {
        deadline: {
          not: null,
          lt: oneHourAgo, // Deadline is in the past by at least 1 hour
        },
        threadId: {
          notIn: allThreadIds, // Not in threads that will be deleted
        },
      },
      select: {
        id: true,
      },
    })

    // Step 4: Delete standalone expired comments (those not in expired threads)
    const standaloneExpiredCommentIds = expiredComments.map((c) => c.id)
    if (standaloneExpiredCommentIds.length > 0) {
      // Delete UserStatus related to expired comments
      await prisma.userStatus.deleteMany({
        where: {
          commentId: {
            in: standaloneExpiredCommentIds,
          },
        },
      })

      // Delete expired comments
      await prisma.comment.deleteMany({
        where: {
          id: {
            in: standaloneExpiredCommentIds,
          },
        },
      })

      deletedCommentCount = standaloneExpiredCommentIds.length
    }

    // Step 5: Delete expired threads (but preserve history)
    for (const thread of allExpiredThreads) {
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

      // Get all comment IDs in this thread (will be deleted via cascade)
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

      deletedThreadCount++
    }

    return res.status(200).json({
      success: true,
      deleted: {
        threads: deletedThreadCount,
        comments: deletedCommentCount,
      },
      message: `Successfully deleted ${deletedThreadCount} expired thread(s) and ${deletedCommentCount} expired comment(s) that passed deadline by at least 1 hour. History preserved for completed tasks.`,
    })
  } catch (error) {
    console.error('Error in auto-delete-expired-threads cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

