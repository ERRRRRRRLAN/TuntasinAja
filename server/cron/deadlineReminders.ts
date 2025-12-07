import { prisma } from '@/lib/prisma'
import { sendNotificationToClass } from '@/server/trpc/routers/notification'
import { getJakartaTodayAsUTC, toJakartaDate } from '@/lib/date-utils'
import { format, parse, addDays, isBefore, isAfter } from 'date-fns'

/**
 * Send deadline reminders to users based on their reminderTime setting
 * This should be run as a cron job (e.g., every 30 minutes or hourly)
 */
export async function sendDeadlineReminders() {
  try {
    console.log('[DeadlineReminders] Starting deadline reminder job...')
    
    const now = new Date()
    const jakartaNow = toJakartaDate(now)
    const currentTime = format(jakartaNow, 'HH:mm')
    
    console.log(`[DeadlineReminders] Current time (Jakarta): ${currentTime}`)
    
    // Get all users with deadline reminders enabled
    const usersWithReminders = await prisma.userSettings.findMany({
      where: {
        deadlineReminderEnabled: true,
        reminderTime: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            kelas: true,
            email: true,
          },
        },
      },
    })

    console.log(`[DeadlineReminders] Found ${usersWithReminders.length} users with deadline reminders enabled`)

    let totalSent = 0

    for (const userSetting of usersWithReminders) {
      const reminderTime = userSetting.reminderTime!
      const user = userSetting.user
      
      // Check if current time matches reminder time (within 30 minute window)
      const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
      const reminderDateTime = parse(reminderTime, 'HH:mm', new Date())
      const currentDateTime = parse(currentTime, 'HH:mm', new Date())
      
      // Calculate time difference in minutes
      const reminderMinutes = reminderHour * 60 + reminderMinute
      const currentMinutes = parseInt(format(jakartaNow, 'HH')) * 60 + parseInt(format(jakartaNow, 'mm'))
      
      // Check if we're within 30 minutes of reminder time
      const timeDiff = Math.abs(currentMinutes - reminderMinutes)
      if (timeDiff > 30) {
        continue // Skip if not within 30 minute window
      }
      
      if (!user.kelas) {
        console.log(`[DeadlineReminders] Skipping user ${user.id} - no kelas`)
        continue
      }

      // Get threads for this user's kelas that have upcoming deadlines (within next 24 hours)
      const tomorrow = addDays(jakartaNow, 1)
      const threads = await prisma.thread.findMany({
        where: {
          author: {
            kelas: user.kelas,
          },
          dueDate: {
            gte: jakartaNow,
            lte: tomorrow,
          },
        },
        include: {
          author: {
            select: {
              name: true,
              kelas: true,
            },
          },
        },
      })

      // Check if user has completed these threads
      const completedThreadIds = await prisma.history.findMany({
        where: {
          userId: user.id,
          threadId: {
            in: threads.map(t => t.id),
          },
        },
        select: {
          threadId: true,
        },
      })

      const completedIds = new Set(completedThreadIds.map(h => h.threadId).filter((id): id is string => id !== null))
      const uncompletedThreads = threads.filter(t => !completedIds.has(t.id))

      if (uncompletedThreads.length === 0) {
        continue // No uncompleted threads with upcoming deadlines
      }

      // Send notification to this user's class
      const threadTitles = uncompletedThreads.map(t => t.title).slice(0, 3) // Limit to 3 titles
      const title = 'Pengingat Deadline'
      const body = uncompletedThreads.length === 1
        ? `Tugas "${threadTitles[0]}" deadline besok!`
        : `${uncompletedThreads.length} tugas deadline besok: ${threadTitles.join(', ')}${uncompletedThreads.length > 3 ? '...' : ''}`

      try {
        await sendNotificationToClass(
          user.kelas,
          title,
          body,
          {
            type: 'deadline_reminder',
            threadIds: uncompletedThreads.map(t => t.id).join(','),
          },
          'deadline'
        )
        totalSent++
        console.log(`[DeadlineReminders] ✅ Sent reminder to class ${user.kelas} for ${uncompletedThreads.length} tasks`)
      } catch (error) {
        console.error(`[DeadlineReminders] ❌ Error sending reminder to class ${user.kelas}:`, error)
      }
    }

    console.log(`[DeadlineReminders] ✅ Job completed. Total reminders sent: ${totalSent}`)
    return {
      success: true,
      usersProcessed: usersWithReminders.length,
      totalSent,
    }
  } catch (error) {
    console.error('[DeadlineReminders] ❌ Error in deadline reminder job:', error)
    throw error
  }
}

