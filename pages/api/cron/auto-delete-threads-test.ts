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

    // Find all threads that have at least one history entry older than 2 minutes
    // We need to check if ALL users in the same kelas have completed the thread
    const threadsWithOldHistories = await prisma.thread.findMany({
      where: {
        histories: {
          some: {
            completedDate: {
              lt: twoMinutesAgo, // At least one user completed more than 2 minutes ago
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

      // Also check if all completions are older than 2 minutes
      const allCompletionsOld = thread.histories.every(
        (h: { completedDate: Date }) => h.completedDate < twoMinutesAgo
      )

      // Only delete if ALL users in kelas have completed AND all completions are old enough
      if (!allUsersCompleted || !allCompletionsOld) {
        continue
      }

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
      const commentIds = (thread.comments as Array<{ id: string }>)?.map((c) => c.id) || []

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

