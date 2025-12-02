import { z } from 'zod'
import { createTRPCRouter, dantonProcedure, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { getUTCDate } from '@/lib/date-utils'

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_NAMES = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
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

export const weeklyScheduleRouter = createTRPCRouter({
  // Get weekly schedule for danton's class
  getSchedule: dantonProcedure.query(async ({ ctx }) => {
    const dantonKelas = ctx.dantonKelas

    const schedules = await (prisma as any).weeklySchedule.findMany({
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

    schedules.forEach((schedule: any) => {
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

      // Validate subject exists in database for this class
      const subjectExists = await (prisma as any).classSubject.findFirst({
        where: {
          kelas: dantonKelas,
          subject: input.subject,
        },
      })

      if (!subjectExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Mata pelajaran tidak valid atau tidak tersedia untuk kelas ini',
        })
      }

      // Upsert schedule
      const schedule = await (prisma as any).weeklySchedule.upsert({
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

      // Auto-sync to class_schedules
      try {
        await syncClassScheduleForKelas(dantonKelas)
      } catch (error) {
        // Log error but don't fail the mutation
        console.error(`[weeklySchedule.setSchedule] Error syncing class_schedules for ${dantonKelas}:`, error)
      }

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

      await (prisma as any).weeklySchedule.deleteMany({
        where: {
          kelas: dantonKelas,
          dayOfWeek: input.dayOfWeek,
          period: input.period,
        },
      })

      // Auto-sync to class_schedules
      try {
        await syncClassScheduleForKelas(dantonKelas)
      } catch (error) {
        // Log error but don't fail the mutation
        console.error(`[weeklySchedule.deleteSchedule] Error syncing class_schedules for ${dantonKelas}:`, error)
      }

      return { success: true }
    }),

  // Get available subjects for danton's class
  getSubjects: dantonProcedure.query(async ({ ctx }) => {
    const dantonKelas = ctx.dantonKelas

    const subjects = await (prisma as any).classSubject.findMany({
      where: { kelas: dantonKelas },
      orderBy: { subject: 'asc' },
      select: {
        subject: true,
      },
    })

    // Return array of subject names
    return subjects.map((s: any) => s.subject)
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

    const schedules = await (prisma as any).weeklySchedule.findMany({
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

    schedules.forEach((schedule: any) => {
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

