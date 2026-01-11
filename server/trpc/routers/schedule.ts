import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { checkIsKetua } from '../trpc'
import { addDays, format, getDay, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { getUTCDate, toJakartaDate } from '@/lib/date-utils'
import { sendNotificationToClass } from './notification'
import { sendPushNotification } from '@/lib/firebase-admin'

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

// Helper function to initialize weekly schedule template (Monday-Friday, empty)
async function initializeScheduleTemplate(kelas: string) {
  // Check if any schedule exists for this kelas
  const existingSchedules = await (prisma as any).classSchedule.findMany({
    where: { kelas },
    take: 1,
  })

  // If schedules already exist, don't initialize
  if (existingSchedules.length > 0) {
    return false
  }

  // Create empty schedule template for weekdays (Monday-Friday)
  // Note: We don't create actual schedule entries with empty subjects
  // Instead, we just ensure the structure is ready
  // The UI will show empty slots for each day
  return true
}

// Helper function to sync class_schedules for a specific kelas from weekly_schedules
async function syncClassScheduleForKelas(kelas: string) {
  try {
    // Get all weekly schedules for this kelas
    const weeklySchedules = await (prisma as any).weeklySchedule.findMany({
      where: { kelas },
      select: {
        dayOfWeek: true,
        subject: true,
      },
    })

    if (weeklySchedules.length === 0) {
      // If no weekly schedules, remove all class_schedules for this kelas
      await (prisma as any).classSchedule.deleteMany({
        where: { kelas },
      })
      return { synced: 0, deleted: 0 }
    }

    // Get unique combinations using a Set
    const uniqueSchedules = new Set<string>()
    const scheduleList: Array<{ dayOfWeek: string; subject: string }> = []

    weeklySchedules.forEach((schedule: { dayOfWeek: string; subject: string }) => {
      const key = `${schedule.dayOfWeek}|${schedule.subject}`
      if (!uniqueSchedules.has(key)) {
        uniqueSchedules.add(key)
        scheduleList.push(schedule)
      }
    })

    // Get existing class_schedules for this kelas
    const existingSchedules = await (prisma as any).classSchedule.findMany({
      where: { kelas },
      select: {
        dayOfWeek: true,
        subject: true,
      },
    })

    // Find schedules to delete (exist in class_schedules but not in weekly_schedules)
    const schedulesToDelete = existingSchedules.filter((existing: { dayOfWeek: string; subject: string }) => {
      const key = `${existing.dayOfWeek}|${existing.subject}`
      return !uniqueSchedules.has(key)
    })

    // Delete schedules that no longer exist in weekly_schedules
    for (const schedule of schedulesToDelete) {
      await (prisma as any).classSchedule.deleteMany({
        where: {
          kelas,
          dayOfWeek: schedule.dayOfWeek,
          subject: schedule.subject,
        },
      })
    }

    // Upsert schedules from weekly_schedules
    let syncedCount = 0
    for (const schedule of scheduleList) {
      try {
        await (prisma as any).classSchedule.upsert({
          where: {
            kelas_dayOfWeek_subject: {
              kelas,
              dayOfWeek: schedule.dayOfWeek,
              subject: schedule.subject,
            },
          },
          create: {
            kelas,
            dayOfWeek: schedule.dayOfWeek,
            subject: schedule.subject,
          },
          update: {
            updatedAt: getUTCDate(),
          },
        })
        syncedCount++
      } catch (error: any) {
        // Skip if error (shouldn't happen with upsert)
        console.error(`[syncClassScheduleForKelas] Error syncing schedule for ${kelas}:`, error)
      }
    }

    return {
      synced: syncedCount,
      deleted: schedulesToDelete.length,
    }
  } catch (error: any) {
    // Table doesn't exist - silently fail (migration not run yet)
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.warn(`[syncClassScheduleForKelas] Table doesn't exist yet, skipping sync for ${kelas}`)
      return { synced: 0, deleted: 0 }
    }
    throw error
  }
}

export const scheduleRouter = createTRPCRouter({
  // Get schedule for a kelas (all users can view)
  // Returns schedule grouped by day of week (Monday-Friday)
  getByKelas: publicProcedure
    .input(z.object({ kelas: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let kelas = input.kelas

      // If kelas not provided, get from user session
      if (!kelas && ctx.session?.user) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { kelas: true },
        })
        kelas = user?.kelas || undefined
      }

      if (!kelas) {
        return {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        }
      }

      const schedules = await (prisma as any).classSchedule.findMany({
        where: { kelas },
        orderBy: [
          { dayOfWeek: 'asc' },
          { subject: 'asc' },
        ],
      })

      // Group schedules by day of week
      const grouped: Record<string, any[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      }

      schedules.forEach((schedule: any) => {
        if (grouped[schedule.dayOfWeek]) {
          grouped[schedule.dayOfWeek].push(schedule)
        }
      })

      return grouped
    }),

  // Get schedule for current user's kelas
  // Returns schedule grouped by day of week (Monday-Friday)
  getMySchedule: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { kelas: true },
    })

    if (!user?.kelas) {
      return {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      }
    }

    const schedules = await (prisma as any).classSchedule.findMany({
      where: { kelas: user.kelas },
      orderBy: [
        { dayOfWeek: 'asc' },
        { subject: 'asc' },
      ],
    })

    // Group schedules by day of week
    const grouped: Record<string, any[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    }

    schedules.forEach((schedule: any) => {
      if (grouped[schedule.dayOfWeek]) {
        grouped[schedule.dayOfWeek].push(schedule)
      }
    })

    return grouped
  }),

  // Sync schedules from weekly_schedules to class_schedules (Admin only)
  // This ensures class_schedules is populated from existing weekly_schedules data
  syncFromWeeklySchedule: adminProcedure.mutation(async () => {
    try {
      // Get all weekly schedules
      const weeklySchedules = await (prisma as any).weeklySchedule.findMany({
        select: {
          kelas: true,
          dayOfWeek: true,
          subject: true,
        },
      })

      if (weeklySchedules.length === 0) {
        return {
          success: true,
          message: 'No weekly schedules found to sync',
          syncedCount: 0,
          skippedCount: 0,
          totalWeeklySchedules: 0,
        }
      }

      // Get unique combinations using a Set
      const uniqueSchedules = new Set<string>()
      const scheduleList: Array<{ kelas: string; dayOfWeek: string; subject: string }> = []

      weeklySchedules.forEach((schedule: { kelas: string; dayOfWeek: string; subject: string }) => {
        const key = `${schedule.kelas}|${schedule.dayOfWeek}|${schedule.subject}`
        if (!uniqueSchedules.has(key)) {
          uniqueSchedules.add(key)
          scheduleList.push(schedule)
        }
      })

      let syncedCount = 0
      let skippedCount = 0

      // Insert each unique combination into class_schedules
      for (const schedule of scheduleList) {
        try {
          await (prisma as any).classSchedule.upsert({
            where: {
              kelas_dayOfWeek_subject: {
                kelas: schedule.kelas,
                dayOfWeek: schedule.dayOfWeek,
                subject: schedule.subject,
              },
            },
            create: {
              kelas: schedule.kelas,
              dayOfWeek: schedule.dayOfWeek,
              subject: schedule.subject,
            },
            update: {
              // Update timestamp if already exists
              updatedAt: getUTCDate(),
            },
          })
          syncedCount++
        } catch (error: any) {
          // Skip if unique constraint violation (already exists)
          if (error?.code === 'P2002') {
            skippedCount++
            continue
          }
          throw error
        }
      }

      return {
        success: true,
        message: `Synced ${syncedCount} schedules from weekly_schedules to class_schedules`,
        syncedCount,
        skippedCount,
        totalWeeklySchedules: weeklySchedules.length,
        uniqueSchedules: scheduleList.length,
      }
    } catch (error: any) {
      // Table doesn't exist - need to run migration
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Tabel weekly_schedules atau class_schedules belum ada di database. Silakan jalankan migration SQL terlebih dahulu.',
        })
      }
      throw error
    }
  }),

  // Create schedule (ketua only)
  create: protectedProcedure
    .input(
      z.object({
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        subject: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { isKetua, kelas } = await checkIsKetua(ctx.session.user.id)

      if (!isKetua || !kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Hanya ketua yang dapat membuat jadwal.',
        })
      }

      // Check if schedule already exists
      const existing = await (prisma as any).classSchedule.findUnique({
        where: {
          kelas_dayOfWeek_subject: {
            kelas,
            dayOfWeek: input.dayOfWeek,
            subject: input.subject.trim(),
          },
        },
      })

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Jadwal untuk mata pelajaran ini sudah ada di hari tersebut.',
        })
      }

      const schedule = await (prisma as any).classSchedule.create({
        data: {
          kelas,
          dayOfWeek: input.dayOfWeek,
          subject: input.subject.trim(),
        },
      })

      return schedule
    }),

  // Delete schedule (ketua only)
  delete: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { isKetua, kelas } = await checkIsKetua(ctx.session.user.id)

      if (!isKetua || !kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Hanya ketua yang dapat menghapus jadwal.',
        })
      }

      const schedule = await (prisma as any).classSchedule.findUnique({
        where: { id: input.scheduleId },
      })

      if (!schedule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Jadwal tidak ditemukan.',
        })
      }

      if (schedule.kelas !== kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat menghapus jadwal dari kelas Anda sendiri.',
        })
      }

      await (prisma as any).classSchedule.delete({
        where: { id: input.scheduleId },
      })

      return { success: true }
    }),

  // Get reminder tasks (tasks for tomorrow's subjects)
  getReminderTasks: publicProcedure.query(async ({ ctx }) => {
    // Get tomorrow's date first (needed for all return statements)
    // Use Jakarta timezone for correct date calculation
    const now = getUTCDate()
    const nowJakarta = toJakartaDate(now)
    const tomorrowJakarta = addDays(nowJakarta, 1)
    const tomorrowFormatted = format(tomorrowJakarta, 'EEEE, d MMMM yyyy', { locale: id })

    if (!ctx.session?.user) {
      return { tasks: [], subjects: [], tomorrow: tomorrowFormatted }
    }

    const userId = ctx.session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kelas: true },
    })

    if (!user?.kelas) {
      return { tasks: [], subjects: [], tomorrow: tomorrowFormatted }
    }

    // Get tomorrow's day of week (using Jakarta time)
    const tomorrowDay = getDay(tomorrowJakarta) // 0 = Sunday, 1 = Monday, etc.
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowDay]

    // Debug logging
    console.log('[getReminderTasks]', {
      userId,
      kelas: user.kelas,
      now: now.toISOString(),
      tomorrow: tomorrowJakarta.toISOString(),
      tomorrowDay,
      tomorrowDayName,
    })

    // Get schedules for tomorrow
    const schedules = await (prisma as any).classSchedule.findMany({
      where: {
        kelas: user.kelas,
        dayOfWeek: tomorrowDayName,
      },
      select: { subject: true },
    })

    console.log('[getReminderTasks] schedules found:', schedules.length)

    if (schedules.length === 0) {
      return { tasks: [], subjects: [], tomorrow: tomorrowFormatted }
    }

    const subjects = schedules.map((s: any) => s.subject)

    // Get threads from today (tasks that were created today)
    // Use Jakarta timezone for date calculations
    const todayJakarta = startOfDay(nowJakarta)
    const tomorrowStartJakarta = startOfDay(tomorrowJakarta)
    
    // For database queries, we need UTC dates
    // Convert Jakarta midnight to UTC (subtract 7 hours)
    const today = new Date(todayJakarta.getTime() - (7 * 60 * 60 * 1000))
    const tomorrowStart = new Date(tomorrowStartJakarta.getTime() - (7 * 60 * 60 * 1000))

    const threads = await prisma.thread.findMany({
      where: {
        author: {
          kelas: user.kelas,
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

    console.log('[getReminderTasks] threads found today:', threads.length)

    // Filter threads that contain subject names in title
    const relevantTasks = threads.filter((thread) => {
      const titleUpper = thread.title.toUpperCase()
      return subjects.some((subject: string) => {
        const subjectUpper = subject.toUpperCase()
        return titleUpper.includes(subjectUpper)
      })
    })

    console.log('[getReminderTasks] relevant tasks (matching subjects):', relevantTasks.length)

    // Check which tasks are not completed by user
    const tasksWithStatus = await Promise.all(
      relevantTasks.map(async (thread) => {
        const userStatus = await prisma.userStatus.findUnique({
          where: {
            userId_threadId: {
              userId: userId,
              threadId: thread.id,
            },
          },
        })

        return {
          threadId: thread.id,
          threadTitle: thread.title,
          threadDate: thread.date,
          authorName: thread.author.name,
          isCompleted: userStatus?.isCompleted || false,
        }
      })
    )

    // Only return incomplete tasks
    const incompleteTasks = tasksWithStatus.filter((task) => !task.isCompleted)

    console.log('[getReminderTasks] incomplete tasks:', incompleteTasks.length)

    const result = {
      tasks: incompleteTasks,
      subjects,
      tomorrow: tomorrowFormatted,
    }

    console.log('[getReminderTasks] returning:', {
      tasksCount: result.tasks.length,
      subjectsCount: result.subjects.length,
      tomorrow: result.tomorrow,
    })

    return result
  }),

  // Test reminder notification (Admin only) - for testing purposes
  // Uses the same logic as the cron job: checks incomplete PRs per user and sends detailed notifications
  testReminder: adminProcedure.mutation(async () => {
    // Get current time in Jakarta timezone
    const now = getUTCDate()
    const nowJakarta = toJakartaDate(now)
    
    // Calculate tomorrow in Jakarta timezone
    const tomorrowJakarta = addDays(nowJakarta, 1)
    
    // Get day of week for tomorrow (in Jakarta timezone)
    const tomorrowDay = getDay(tomorrowJakarta)
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowDay]
    
    // Format tomorrow date in Jakarta timezone
    const tomorrowFormatted = format(tomorrowJakarta, 'EEEE, d MMMM yyyy', { locale: id })

    // Get all classes that have schedules for tomorrow
    // Check if table exists first
    let schedules
    try {
      schedules = await (prisma as any).classSchedule.findMany({
        where: {
          dayOfWeek: tomorrowDayName,
        },
        select: {
          kelas: true,
          subject: true,
        },
      })
    } catch (error: any) {
      // Table doesn't exist - need to run migration
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Tabel class_schedules belum ada di database. Silakan jalankan migration SQL terlebih dahulu. Lihat file: scripts/migrate-class-schedule-production.sql',
        })
      }
      throw error
    }

    if (schedules.length === 0) {
      return {
        success: true,
        message: 'No schedules found for tomorrow',
        tomorrow: tomorrowFormatted,
        sentCount: 0,
        processedClasses: 0,
      }
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
          console.log(`[TestReminder] No device tokens found for kelas ${kelas}`)
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

        console.log(`[TestReminder] Found ${threads.length} threads for kelas ${kelas}`)
        console.log(`[TestReminder] Looking for subjects: ${subjects.join(', ')}`)

        // Filter threads that match tomorrow's subjects
        const relevantThreads = threads.filter((thread) => {
          const titleUpper = thread.title.toUpperCase()
          const matches = subjects.some((subject: string) => {
            const subjectUpper = subject.toUpperCase()
            return titleUpper.includes(subjectUpper)
          })
          if (matches) {
            console.log(`[TestReminder] Thread matches: "${thread.title}" matches subjects`)
          }
          return matches
        })

        console.log(`[TestReminder] Found ${relevantThreads.length} relevant threads for kelas ${kelas}`)

        if (relevantThreads.length === 0) {
          // No relevant threads, skip notification for this class
          console.log(`[TestReminder] No relevant threads found for kelas ${kelas}. Total threads: ${threads.length}, Subjects: ${subjects.join(', ')}`)
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

            console.log(`[TestReminder] Sent to user ${user.name} (${kelas}):`, {
              subjects: subjectsList,
              incompletePRsCount: totalPRs,
              success: result.successCount > 0,
            })
          } catch (error) {
            console.error(`[TestReminder] Error processing user ${user.id}:`, error)
            totalFailed++
            // Continue with other users
          }
        }
      } catch (error) {
        console.error(`[TestReminder] Error processing kelas ${kelas}:`, error)
        // Continue with other classes
      }
    }

    return {
      success: true,
      message: `Test reminder notifications sent (every 3 hours logic)`,
      tomorrow: tomorrowFormatted,
      totalSent,
      totalFailed,
      processedClasses: Object.keys(schedulesByKelas).length,
    }
  }),
})
