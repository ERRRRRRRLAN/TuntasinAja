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
      const tomorrowEnd = new Date(tomorrow)
      tomorrowEnd.setHours(23, 59, 59, 999)
      
      const threads = await prisma.thread.findMany({
        where: {
          author: {
            kelas: user.kelas,
          },
          deadline: {
            gte: jakartaNow,
            lte: tomorrowEnd,
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

      // Get comments (sub-tasks) with deadline from threads in user's kelas
      const comments = await prisma.comment.findMany({
        where: {
          thread: {
            author: {
              kelas: user.kelas,
            },
          },
          deadline: {
            gte: jakartaNow,
            lte: tomorrowEnd,
          },
        },
        include: {
          thread: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  name: true,
                  kelas: true,
                },
              },
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

      const completedThreadIdSet = new Set(completedThreadIds.map(h => h.threadId).filter((id): id is string => id !== null))
      const uncompletedThreads = threads.filter(t => !completedThreadIdSet.has(t.id))

      // Check if user has completed these comments (sub-tasks)
      const completedCommentIds = await prisma.userStatus.findMany({
        where: {
          userId: user.id,
          commentId: {
            in: comments.map(c => c.id),
          },
          isCompleted: true,
        },
        select: {
          commentId: true,
        },
      })

      const completedCommentIdSet = new Set(completedCommentIds.map(s => s.commentId).filter((id): id is string => id !== null))
      const uncompletedComments = comments.filter(c => !completedCommentIdSet.has(c.id))

      // Combine threads and comments for notification
      const allUncompleted = [
        ...uncompletedThreads.map(t => ({ type: 'thread' as const, id: t.id, title: t.title })),
        ...uncompletedComments.map(c => ({ type: 'comment' as const, id: c.id, title: `${c.thread.title} - ${c.content.substring(0, 30)}${c.content.length > 30 ? '...' : ''}` })),
      ]

      if (allUncompleted.length === 0) {
        continue // No uncompleted tasks with upcoming deadlines
      }

      // Send notification to this user's class
      const taskTitles = allUncompleted.map(t => t.title).slice(0, 3) // Limit to 3 titles
      const title = 'Pengingat Deadline'
      const body = allUncompleted.length === 1
        ? `Tugas "${taskTitles[0]}" deadline besok!`
        : `${allUncompleted.length} tugas deadline besok: ${taskTitles.join(', ')}${allUncompleted.length > 3 ? '...' : ''}`

      try {
        await sendNotificationToClass(
          user.kelas,
          title,
          body,
          {
            type: 'deadline_reminder',
            threadIds: allUncompleted.filter(t => t.type === 'thread').map(t => t.id).join(','),
            commentIds: allUncompleted.filter(t => t.type === 'comment').map(t => t.id).join(','),
          },
          'deadline'
        )
        totalSent++
        console.log(`[DeadlineReminders] ✅ Sent reminder to class ${user.kelas} for ${allUncompleted.length} tasks (${uncompletedThreads.length} threads, ${uncompletedComments.length} comments)`)
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
