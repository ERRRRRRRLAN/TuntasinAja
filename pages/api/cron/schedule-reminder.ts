import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase-admin'
import { addDays, getDay, format, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { getUTCDate, toJakartaDate } from '@/lib/date-utils'

// Helper function to get tomorrow's day name
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

// This API route is called by external cron service (cron-job.org)
// Sends schedule reminder notifications every 3 hours
// Setup in cron-job.org: Schedule 0 */3 * * * (every 3 hours UTC)
// WIB is UTC+7, so:
// - 00:00 UTC = 07:00 WIB
// - 03:00 UTC = 10:00 WIB
// - 06:00 UTC = 13:00 WIB
// - 09:00 UTC = 16:00 WIB
// - 12:00 UTC = 19:00 WIB
// - 15:00 UTC = 22:00 WIB
// - 18:00 UTC = 01:00 WIB (next day)
// - 21:00 UTC = 04:00 WIB (next day)

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
    // Get current time in Jakarta timezone
    const now = getUTCDate()
    const nowJakarta = toJakartaDate(now)
    
    // Calculate tomorrow in Jakarta timezone
    // Add 1 day to Jakarta date, then create a new Date object
    const tomorrowJakarta = addDays(nowJakarta, 1)
    
    // Get day of week for tomorrow (in Jakarta timezone)
    const tomorrowDay = getDay(tomorrowJakarta) // 0 = Sunday, 1 = Monday, etc.
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowDay]
    
    // Format tomorrow date in Jakarta timezone
    const tomorrowFormatted = format(tomorrowJakarta, 'EEEE, d MMMM yyyy', { locale: id })

    // Get all classes that have schedules for tomorrow
    const schedules = await (prisma as any).classSchedule.findMany({
      where: {
        dayOfWeek: tomorrowDayName,
      },
      select: {
        kelas: true,
        subject: true,
      },
    })

    if (schedules.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No schedules found for tomorrow',
        tomorrow: tomorrowFormatted,
        sentCount: 0,
      })
    }

    // Group schedules by kelas
    const schedulesByKelas: Record<string, string[]> = {}
    schedules.forEach((schedule: { kelas: string; subject: string }) => {
      if (!schedulesByKelas[schedule.kelas]) {
        schedulesByKelas[schedule.kelas] = []
      }
      schedulesByKelas[schedule.kelas].push(schedule.subject)
    })

    let totalSent = 0
    let totalFailed = 0
    
    // Use Jakarta timezone for date calculations
    // Get today at midnight in Jakarta, then convert to UTC for database queries
    const todayJakarta = startOfDay(nowJakarta)
    const tomorrowStartJakarta = startOfDay(tomorrowJakarta)
    
    // For database queries, we need UTC dates
    // Convert Jakarta midnight to UTC (subtract 7 hours)
    const today = new Date(todayJakarta.getTime() - (7 * 60 * 60 * 1000))
    const tomorrowStart = new Date(tomorrowStartJakarta.getTime() - (7 * 60 * 60 * 1000))

    // Process each kelas
    for (const [kelas, subjects] of Object.entries(schedulesByKelas)) {
      try {
        // Get all device tokens for users in this kelas
        const deviceTokens = await prisma.deviceToken.findMany({
          where: {
            user: {
              kelas: kelas,
              isAdmin: false,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        if (deviceTokens.length === 0) {
          console.log(`[ScheduleReminder] No device tokens found for kelas ${kelas}`)
          continue
        }

        // Get threads for this kelas (not just today, but all active threads)
        // We'll filter by completion status per user later
        const threads = await prisma.thread.findMany({
          where: {
            author: {
              kelas: kelas,
            },
            // Don't filter by date - check all threads that might be relevant
            // We'll filter by subject match and completion status per user
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
          },
        })

        console.log(`[ScheduleReminder] Found ${threads.length} threads for kelas ${kelas}`)
        console.log(`[ScheduleReminder] Looking for subjects: ${subjects.join(', ')}`)

        const relevantThreads = threads.filter((thread) => {
          const titleUpper = thread.title.toUpperCase()
          const matches = subjects.some((subject: string) => {
            const subjectUpper = subject.toUpperCase()
            return titleUpper.includes(subjectUpper)
          })
          if (matches) {
            console.log(`[ScheduleReminder] Thread matches: "${thread.title}" matches subjects`)
          }
          return matches
        })

        console.log(`[ScheduleReminder] Found ${relevantThreads.length} relevant threads for kelas ${kelas}`)

        if (relevantThreads.length === 0) {
          // No relevant threads, skip notification for this class
          console.log(`[ScheduleReminder] No relevant threads found for kelas ${kelas}. Total threads: ${threads.length}, Subjects: ${subjects.join(', ')}`)
          continue
        }

        // Process each user individually to check their incomplete PRs
        // Group device tokens by user
        const tokensByUser = new Map<string, string[]>()
        deviceTokens.forEach((dt) => {
          const userId = dt.user.id
          if (!tokensByUser.has(userId)) {
            tokensByUser.set(userId, [])
          }
          tokensByUser.get(userId)!.push(dt.token)
        })

        for (const [userId, tokens] of tokensByUser.entries()) {
          const user = deviceTokens.find(dt => dt.user.id === userId)!.user

          try {
            // Get all comment IDs from relevant threads
            const allCommentIds = relevantThreads.flatMap((thread) =>
              thread.comments.map((comment) => comment.id)
            )

            if (allCommentIds.length === 0) {
              continue // No comments to check
            }

            // Get completed comment statuses for this user
            const completedStatuses = await prisma.userStatus.findMany({
              where: {
                userId: user.id,
                commentId: {
                  in: allCommentIds,
                },
                isCompleted: true,
              },
              select: {
                commentId: true,
              },
            })

            const completedCommentIds = new Set(
              completedStatuses.map((s) => s.commentId).filter((id): id is string => id !== null)
            )

            // Find incomplete PRs (threads with at least one incomplete comment)
            const incompletePRs = relevantThreads.filter((thread) => {
              // Check if thread has at least one incomplete comment
              return thread.comments.some((comment) => !completedCommentIds.has(comment.id))
            })

            if (incompletePRs.length === 0) {
              // All PRs are completed, skip notification for this user
              continue
            }

            // Group incomplete PRs by subject
            const prsBySubject: Record<string, Array<{ title: string; authorName: string }>> = {}
            const subjectsWithPR: string[] = []

            incompletePRs.forEach((thread) => {
              // Find which subject(s) this thread belongs to
              const titleUpper = thread.title.toUpperCase()
              subjects.forEach((subject: string) => {
                const subjectUpper = subject.toUpperCase()
                if (titleUpper.includes(subjectUpper)) {
                  if (!prsBySubject[subject]) {
                    prsBySubject[subject] = []
                    subjectsWithPR.push(subject)
                  }
                  // Avoid duplicates
                  if (!prsBySubject[subject].some(pr => pr.title === thread.title)) {
                    prsBySubject[subject].push({
                      title: thread.title,
                      authorName: thread.author.name,
                    })
                  }
                }
              })
            })

            if (subjectsWithPR.length === 0) {
              continue
            }

            // Build detailed notification message
            const subjectsList = subjectsWithPR.join(', ')
            const totalPRs = incompletePRs.length

            // Create detailed body with PR list
            let body = `Besok (${tomorrowFormatted}) ada pelajaran: ${subjectsList}.\n\n`
            body += `📋 Ada ${totalPRs} PR yang belum selesai:\n\n`

            // Add PR details grouped by subject
            subjectsWithPR.forEach((subject, index) => {
              const prs = prsBySubject[subject]
              if (prs.length > 0) {
                body += `📚 ${subject}:\n`
                prs.forEach((pr) => {
                  body += `  • ${pr.title} (oleh ${pr.authorName})\n`
                })
                if (index < subjectsWithPR.length - 1) {
                  body += '\n'
                }
              }
            })

            body += '\n⏰ Segera selesaikan PR sebelum pelajaran besok!'

            const title = `⏰ Reminder: Ada PR yang Belum Selesai!`

            // Create deep link with filter only for subjects that have incomplete PRs
            const filterSubjects = subjectsWithPR.join(',')
            const deepLink = `/?filter=${encodeURIComponent(filterSubjects)}`

            // Send notification to this user (all their devices)
            const result = await sendPushNotification(
              tokens,
              title,
              body,
              {
                type: 'schedule_reminder',
                filter: filterSubjects,
                deepLink: deepLink,
                tomorrow: tomorrowFormatted,
                subjects: subjectsList,
                hasIncompleteTasks: 'true',
                incompletePRsCount: String(totalPRs),
              }
            )

            totalSent += result.successCount
            totalFailed += result.failureCount

            console.log(`[ScheduleReminder] Sent to user ${user.name} (${kelas}):`, {
              subjects: subjectsList,
              incompletePRsCount: totalPRs,
              success: result.successCount > 0,
            })
          } catch (error) {
            console.error(`[ScheduleReminder] Error processing user ${user.id}:`, error)
            totalFailed++
            // Continue with other users
          }
        }
      } catch (error) {
        console.error(`[ScheduleReminder] Error processing kelas ${kelas}:`, error)
        // Continue with other classes
      }
    }

    return res.status(200).json({
      success: true,
      message: `Schedule reminder notifications sent (every 3 hours)`,
      tomorrow: tomorrowFormatted,
      totalSent,
      totalFailed,
      processedClasses: Object.keys(schedulesByKelas).length,
    })
  } catch (error) {
    console.error('Error in schedule-reminder cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
