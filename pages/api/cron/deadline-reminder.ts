import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase-admin'
import { format, differenceInHours, differenceInMinutes } from 'date-fns'
import { id } from 'date-fns/locale'
import { getUTCDate, toJakartaDate } from '@/lib/date-utils'

// This API route is called by external cron service (cron-job.org)
// Sends deadline reminder notifications
// Setup in cron-job.org: Schedule */30 * * * * (every 30 minutes UTC)
// This ensures we catch deadlines at 1 day, 6 hours, and 1 hour before

interface DeadlineItem {
  id: string
  title: string
  deadline: Date
  authorKelas: string | null
  type: 'thread' | 'comment'
  threadId?: string
  threadTitle?: string
}

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
    const now = getUTCDate()
    const nowJakarta = toJakartaDate(now)
    
    // Get all threads with deadline
    const threadsWithDeadline = await prisma.thread.findMany({
      where: {
        deadline: {
          not: null,
          gte: now, // Only future deadlines
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            kelas: true,
            isAdmin: true,
          },
        },
      },
    })

    // Get all comments with deadline
    const commentsWithDeadline = await prisma.comment.findMany({
      where: {
        deadline: {
          not: null,
          gte: now, // Only future deadlines
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            kelas: true,
            isAdmin: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Combine all deadline items
    const deadlineItems: DeadlineItem[] = []

    // Add threads
    for (const thread of threadsWithDeadline) {
      if (thread.deadline && thread.author.kelas && !thread.author.isAdmin) {
        deadlineItems.push({
          id: thread.id,
          title: thread.title,
          deadline: thread.deadline,
          authorKelas: thread.author.kelas,
          type: 'thread',
        })
      }
    }

    // Add comments
    for (const comment of commentsWithDeadline) {
      if (comment.deadline && comment.author.kelas && !comment.author.isAdmin && comment.thread) {
        deadlineItems.push({
          id: comment.id,
          title: comment.thread.title,
          deadline: comment.deadline,
          authorKelas: comment.author.kelas,
          type: 'comment',
          threadId: comment.thread.id,
          threadTitle: comment.thread.title,
        })
      }
    }

    if (deadlineItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No deadlines found',
        sentCount: 0,
      })
    }

    let totalSent = 0
    let totalFailed = 0
    const notificationsSent: string[] = [] // Track sent notifications to avoid duplicates

    // Process each deadline item
    for (const item of deadlineItems) {
      try {
        const deadlineJakarta = toJakartaDate(item.deadline)
        const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta)
        const minutesUntilDeadline = differenceInMinutes(deadlineJakarta, nowJakarta)

        // Determine which notification to send
        // Use ranges with small margins to avoid duplicates when cron runs multiple times
        let notificationType: '1day' | '6hours' | '1hour' | null = null
        let timeRemaining = ''

        if (hoursUntilDeadline <= 1.5 && hoursUntilDeadline > 0.5) {
          // 1 hour remaining (between 90 minutes and 30 minutes)
          // This range ensures we send notification once when deadline is ~1 hour away
          notificationType = '1hour'
          const hours = Math.floor(hoursUntilDeadline)
          const minutes = minutesUntilDeadline % 60
          if (hours > 0) {
            timeRemaining = `${hours} jam ${minutes} menit`
          } else {
            timeRemaining = `${minutes} menit`
          }
        } else if (hoursUntilDeadline <= 6.5 && hoursUntilDeadline > 5.5) {
          // 6 hours remaining (between 6.5 hours and 5.5 hours)
          // This range ensures we send notification once when deadline is ~6 hours away
          notificationType = '6hours'
          timeRemaining = `${Math.floor(hoursUntilDeadline)} jam`
        } else if (hoursUntilDeadline <= 24.5 && hoursUntilDeadline > 23.5) {
          // 1 day remaining (between 24.5 hours and 23.5 hours)
          // This range ensures we send notification once when deadline is ~24 hours away
          notificationType = '1day'
          const days = Math.floor(hoursUntilDeadline / 24)
          const hours = Math.floor(hoursUntilDeadline % 24)
          if (days > 0) {
            timeRemaining = `${days} hari ${hours} jam`
          } else {
            timeRemaining = `${hours} jam`
          }
        }

        // Skip if no notification needed
        if (!notificationType || !item.authorKelas) {
          continue
        }

        // Create unique key for this notification to avoid duplicates
        const notificationKey = `${item.id}-${notificationType}`
        if (notificationsSent.includes(notificationKey)) {
          continue
        }

        // Get all device tokens for users in this kelas
        // Send notification to all users in the class, not just the author
        const deviceTokens = await prisma.deviceToken.findMany({
          where: {
            user: {
              kelas: item.authorKelas,
              isAdmin: false,
            },
          },
          select: {
            token: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        if (deviceTokens.length === 0) {
          console.log(`[DeadlineReminder] No device tokens found for kelas: ${item.authorKelas}`)
          continue
        }

        // Prepare notification message
        const itemType = item.type === 'thread' ? 'Tugas' : 'Sub Tugas'
        const title = `⏰ Deadline ${itemType}`
        let body = ''
        
        if (notificationType === '1day') {
          body = `Deadline ${itemType.toLowerCase()} "${item.title}" tinggal ${timeRemaining} lagi!`
        } else if (notificationType === '6hours') {
          body = `Deadline ${itemType.toLowerCase()} "${item.title}" tinggal ${timeRemaining} lagi!`
        } else if (notificationType === '1hour') {
          body = `Deadline ${itemType.toLowerCase()} "${item.title}" tinggal ${timeRemaining} lagi! Segera selesaikan!`
        }

        // Prepare deep link data
        const data: Record<string, string> = {
          type: 'deadline_reminder',
          itemType: item.type,
          itemId: item.id,
          deadline: item.deadline.toISOString(),
        }

        if (item.type === 'comment' && item.threadId) {
          data.threadId = item.threadId
          data.threadTitle = item.threadTitle || ''
        }

        // Send notification
        const tokens = deviceTokens.map(dt => dt.token)
        const result = await sendPushNotification(tokens, title, body, data)

        totalSent += result.successCount
        totalFailed += result.failureCount
        notificationsSent.push(notificationKey)

        console.log(`[DeadlineReminder] Sent ${notificationType} notification for ${item.title} to ${result.successCount} users in ${item.authorKelas}`)
      } catch (error) {
        console.error(`[DeadlineReminder] Error processing deadline for ${item.title}:`, error)
        totalFailed++
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Deadline reminders processed',
      sentCount: totalSent,
      failedCount: totalFailed,
      totalDeadlines: deadlineItems.length,
      notificationsSent: notificationsSent.length,
    })
  } catch (error) {
    console.error('[DeadlineReminder] Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

