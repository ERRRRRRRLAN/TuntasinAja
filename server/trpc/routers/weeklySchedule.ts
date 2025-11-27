import { z } from 'zod'
import { createTRPCRouter, dantonProcedure, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

const MATA_PELAJARAN = [
  'Dasar BC',
  'Bahasa Inggris',
  'Seni Musik',
  'Koding dan Kecerdasan Artificial',
  'Matematika',
  'Mulok BK',
  'Mulok Batik',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Proj IPAS',
  'Sejarah',
  'PJOK',
  'PAI & BP',
  'Informatika',
  'PAI',
  'Pendidikan Kewarganegaraan Negara',
  'Dasar PPLG',
  'IPAS',
]

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_NAMES = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
}

export const weeklyScheduleRouter = createTRPCRouter({
  // Get weekly schedule for danton's class
  getSchedule: dantonProcedure.query(async ({ ctx }) => {
    const dantonKelas = ctx.dantonKelas

    const schedules = await prisma.weeklySchedule.findMany({
      where: {
        kelas: dantonKelas,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' },
      ],
    })

    // Group by day
    const scheduleByDay: Record<string, Array<{ period: number; subject: string; id: string }>> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    }

    schedules.forEach(schedule => {
      scheduleByDay[schedule.dayOfWeek].push({
        period: schedule.period,
        subject: schedule.subject,
        id: schedule.id,
      })
    })

    // Sort by period for each day
    Object.keys(scheduleByDay).forEach(day => {
      scheduleByDay[day].sort((a, b) => a.period - b.period)
    })

    return {
      kelas: dantonKelas,
      schedule: scheduleByDay,
      dayNames: DAY_NAMES,
    }
  }),

  // Set schedule for a specific day and period
  setSchedule: dantonProcedure
    .input(
      z.object({
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        period: z.number().int().min(1).max(10),
        subject: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dantonKelas = ctx.dantonKelas

      // Validate subject
      if (!MATA_PELAJARAN.includes(input.subject)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Mata pelajaran tidak valid',
        })
      }

      // Upsert schedule
      const schedule = await prisma.weeklySchedule.upsert({
        where: {
          kelas_dayOfWeek_period: {
            kelas: dantonKelas,
            dayOfWeek: input.dayOfWeek,
            period: input.period,
          },
        },
        create: {
          kelas: dantonKelas,
          dayOfWeek: input.dayOfWeek,
          period: input.period,
          subject: input.subject,
        },
        update: {
          subject: input.subject,
        },
      })

      return schedule
    }),

  // Delete schedule for a specific day and period
  deleteSchedule: dantonProcedure
    .input(
      z.object({
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        period: z.number().int().min(1).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dantonKelas = ctx.dantonKelas

      await prisma.weeklySchedule.deleteMany({
        where: {
          kelas: dantonKelas,
          dayOfWeek: input.dayOfWeek,
          period: input.period,
        },
      })

      return { success: true }
    }),

  // Get available subjects
  getSubjects: dantonProcedure.query(async () => {
    return MATA_PELAJARAN
  }),

  // Get schedule for regular user (read-only, based on their kelas)
  getUserSchedule: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get user's kelas
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kelas: true },
    })

    if (!user || !user.kelas) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User tidak memiliki kelas',
      })
    }

    const schedules = await prisma.weeklySchedule.findMany({
      where: {
        kelas: user.kelas,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' },
      ],
    })

    // Group by day
    const scheduleByDay: Record<string, Array<{ period: number; subject: string }>> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    }

    schedules.forEach(schedule => {
      scheduleByDay[schedule.dayOfWeek].push({
        period: schedule.period,
        subject: schedule.subject,
      })
    })

    // Sort by period for each day
    Object.keys(scheduleByDay).forEach(day => {
      scheduleByDay[day].sort((a, b) => a.period - b.period)
    })

    return {
      kelas: user.kelas,
      schedule: scheduleByDay,
      dayNames: DAY_NAMES,
    }
  }),
})

