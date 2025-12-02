import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { sendNotificationToClass } from '@/server/trpc/routers/notification'
import { addDays, getDay, format, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { getUTCDate } from '@/lib/date-utils'

// Helper function to get tomorrow's day name
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

// This API route is called by external cron service (cron-job.org)
// Sends schedule reminder notifications at 9 PM (malam) - 21:00 WIB
// Setup in cron-job.org: Schedule 0 14 * * * (14:00 UTC = 21:00 WIB)

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
    const tomorrow = addDays(now, 1)
    const tomorrowDay = getDay(tomorrow) // 0 = Sunday, 1 = Monday, etc.
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowDay]
    const tomorrowFormatted = format(tomorrow, 'EEEE, d MMMM yyyy', { locale: id })

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

    // Process each kelas
    for (const [kelas, subjects] of Object.entries(schedulesByKelas)) {
      try {
        // Get today's threads for this kelas
        const today = startOfDay(now)
        const tomorrowStart = startOfDay(tomorrow)

        const threads = await prisma.thread.findMany({
          where: {
            author: {
              kelas: kelas,
            },
            date: {
              gte: today,
              lt: tomorrowStart,
            },
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        // Filter threads that match tomorrow's subjects
        const relevantTasks = threads.filter((thread) => {
          const titleUpper = thread.title.toUpperCase()
          return subjects.some((subject: string) => {
            const subjectUpper = subject.toUpperCase()
            return titleUpper.includes(subjectUpper)
          })
        })

        // Check if there are any incomplete tasks in the class
        const hasAnyIncompleteTasks = relevantTasks.length > 0

        // Build notification message
        const subjectsList = subjects.join(', ')

        let title = ''
        let body = ''

        if (hasAnyIncompleteTasks) {
          title = `⏰ Reminder Malam: Besok Ada Pelajaran!`
          body = `Besok (${tomorrowFormatted}) ada pelajaran: ${subjectsList}. Cek PR yang belum selesai dan segera selesaikan!`
        } else {
          title = `📅 Reminder Malam: Besok Ada Pelajaran`
          body = `Besok (${tomorrowFormatted}) ada pelajaran: ${subjectsList}. Jangan lupa persiapkan!`
        }

        // Create deep link with filter
        const filterSubjects = subjects.join(',')
        const deepLink = `/?filter=${encodeURIComponent(filterSubjects)}`
        
        // Send notification to class
        const result = await sendNotificationToClass(
          kelas,
          title,
          body,
          {
            type: 'schedule_reminder',
            filter: filterSubjects,
            deepLink: deepLink,
            tomorrow: tomorrowFormatted,
            subjects: subjectsList,
            hasIncompleteTasks: hasAnyIncompleteTasks ? 'true' : 'false',
          }
        )

        totalSent += result.successCount || 0
        totalFailed += result.failureCount || 0

        console.log(`[ScheduleReminder-Malam] Sent to ${kelas}:`, {
          subjects: subjectsList,
          hasIncompleteTasks: hasAnyIncompleteTasks,
          relevantTasksCount: relevantTasks.length,
          successCount: result.successCount,
          failureCount: result.failureCount,
        })
      } catch (error) {
        console.error(`[ScheduleReminder-Malam] Error processing kelas ${kelas}:`, error)
        // Continue with other classes
      }
    }

    return res.status(200).json({
      success: true,
      message: `Schedule reminder notifications sent (Malam)`,
      tomorrow: tomorrowFormatted,
      totalSent,
      totalFailed,
      processedClasses: Object.keys(schedulesByKelas).length,
    })
  } catch (error) {
    console.error('Error in schedule-reminder-malam cron:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

