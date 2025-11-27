import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { checkIsDanton } from '../trpc'
import { addDays, format, getDay, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { getUTCDate } from '@/lib/date-utils'

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

  // Create schedule (Danton only)
  create: protectedProcedure
    .input(
      z.object({
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        subject: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)

      if (!isDanton || !kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Hanya danton yang dapat membuat jadwal.',
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

  // Delete schedule (Danton only)
  delete: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)

      if (!isDanton || !kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Hanya danton yang dapat menghapus jadwal.',
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
    const now = getUTCDate()
    const tomorrow = addDays(now, 1)
    const tomorrowFormatted = format(tomorrow, 'EEEE, d MMMM yyyy', { locale: id })

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
    const tomorrowDay = getDay(tomorrow) // 0 = Sunday, 1 = Monday, etc.
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowDay]

    // Debug logging
    console.log('[getReminderTasks]', {
      userId,
      kelas: user.kelas,
      now: now.toISOString(),
      tomorrow: tomorrow.toISOString(),
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
    const today = startOfDay(now)
    const tomorrowStart = startOfDay(tomorrow)

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
})
