import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getUTCDate } from '@/lib/date-utils'

/**
 * Daily Reminder Cron Job
 * 
 * This endpoint should be called daily (e.g., via Vercel Cron or external cron service)
 * to send daily reminder notifications to all users about their uncompleted tasks.
 * 
 * Usage:
 * - Set up a cron job to call this endpoint once per day (e.g., at 9 AM)
 * - Example: https://your-domain.com/api/cron/daily-reminder
 * - Add authorization header if needed: Authorization: Bearer YOUR_SECRET_TOKEN
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Optional: Add authentication to prevent unauthorized access
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  const expectedToken = process.env.CRON_SECRET_TOKEN

  if (expectedToken && authToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = getUTCDate()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        kelas: true,
      },
    })

    let notificationsCreated = 0

    for (const user of users) {
      // Get all threads for this user's kelas
      const threads = await prisma.thread.findMany({
        where: user.kelas
          ? {
              author: {
                kelas: user.kelas,
              },
              createdAt: {
                gte: oneDayAgo, // Only threads from last 24 hours
              },
            }
          : {
              createdAt: {
                gte: oneDayAgo,
              },
            },
        include: {
          _count: {
            select: {
              comments: true,
            },
          },
        },
      })

      // Count uncompleted tasks
      // A task is uncompleted if:
      // 1. User hasn't marked the thread as completed (no UserStatus with isCompleted=true)
      // 2. Thread was created in the last 24 hours
      let uncompletedCount = 0

      for (const thread of threads) {
        // Check if user has completed this thread
        const userStatus = await prisma.userStatus.findFirst({
          where: {
            userId: user.id,
            threadId: thread.id,
            isCompleted: true,
          },
        })

        if (!userStatus) {
          uncompletedCount++
        }
      }

      // Create daily reminder notification if there are uncompleted tasks
      if (uncompletedCount > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'daily_reminder',
            title: 'Pengingat Tugas Harian',
            message: `Anda memiliki ${uncompletedCount} tugas yang belum dikerjakan`,
            isRead: false,
          },
        })
        notificationsCreated++
      }
    }

    return res.status(200).json({
      success: true,
      message: `Daily reminders created for ${notificationsCreated} users`,
      notificationsCreated,
      totalUsers: users.length,
    })
  } catch (error: any) {
    console.error('Error creating daily reminders:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    })
  }
}

