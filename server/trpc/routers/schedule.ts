import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { checkIsDanton } from '../trpc'
import { addDays, format, getDay, startOfDay } from 'date-fns'
import { id } from 'date-fns/locale'
import { getUTCDate } from '@/lib/date-utils'

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export const scheduleRouter = createTRPCRouter({
  // Get schedule for a kelas (all users can view)
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
        return []
      }

      const schedules = await (prisma as any).classSchedule.findMany({
        where: { kelas },
        orderBy: [
          { dayOfWeek: 'asc' },
          { subject: 'asc' },
        ],
      })

      return schedules
    }),

  // Get schedule for current user's kelas
  getMySchedule: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return []
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { kelas: true },
    })

    if (!user?.kelas) {
      return []
    }

    const schedules = await (prisma as any).classSchedule.findMany({
      where: { kelas: user.kelas },
      orderBy: [
        { dayOfWeek: 'asc' },
        { subject: 'asc' },
      ],
    })

    return schedules
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
    if (!ctx.session?.user) {
      return { tasks: [], subjects: [] }
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { kelas: true },
    })

    if (!user?.kelas) {
      return { tasks: [], subjects: [] }
    }

    // Get tomorrow's date and day of week (using Jakarta time)
    const now = getUTCDate()
    const tomorrow = addDays(now, 1)
    const tomorrowDay = getDay(tomorrow) // 0 = Sunday, 1 = Monday, etc.
    const tomorrowDayName = DAYS_OF_WEEK[tomorrowDay]

    // Get schedules for tomorrow
    const schedules = await (prisma as any).classSchedule.findMany({
      where: {
        kelas: user.kelas,
        dayOfWeek: tomorrowDayName,
      },
      select: { subject: true },
    })

    if (schedules.length === 0) {
      return { tasks: [], subjects: [] }
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

    // Filter threads that contain subject names in title
    const relevantTasks = threads.filter((thread) => {
      const titleUpper = thread.title.toUpperCase()
      return subjects.some((subject) => {
        const subjectUpper = subject.toUpperCase()
        return titleUpper.includes(subjectUpper)
      })
    })

    // Check which tasks are not completed by user
    const tasksWithStatus = await Promise.all(
      relevantTasks.map(async (thread) => {
        const userStatus = await prisma.userStatus.findUnique({
          where: {
            userId_threadId: {
              userId: ctx.session.user.id,
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

    return {
      tasks: incompleteTasks,
      subjects,
      tomorrow: format(tomorrow, 'EEEE, d MMMM yyyy', { locale: id }),
    }
  }),
})
