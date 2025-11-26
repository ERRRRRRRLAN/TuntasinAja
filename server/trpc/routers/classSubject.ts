import { z } from 'zod'
import { createTRPCRouter, adminProcedure, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

export const classSubjectRouter = createTRPCRouter({
  // Get subjects for a specific class (User can get their own class subjects)
  getClassSubjects: publicProcedure
    .input(z.object({ kelas: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let targetKelas = input.kelas

      // If no kelas provided, get from current user's kelas
      if (!targetKelas && ctx.session?.user) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { kelas: true },
        }) as any

        targetKelas = user?.kelas || null
      }

      if (!targetKelas) {
        // Return empty array if no kelas
        return []
      }

      const subjects = await (prisma as any).classSubject.findMany({
        where: { kelas: targetKelas },
        orderBy: { subject: 'asc' },
        select: {
          id: true,
          kelas: true,
          subject: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return subjects
    }),

  // Get all class subjects grouped by kelas (Admin only)
  getAllClassSubjects: adminProcedure.query(async () => {
    const subjects = await (prisma as any).classSubject.findMany({
      orderBy: [
        { kelas: 'asc' },
        { subject: 'asc' },
      ],
      select: {
        id: true,
        kelas: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Group by kelas
    const grouped: Record<string, typeof subjects> = {}
    for (const subject of subjects) {
      if (!grouped[subject.kelas]) {
        grouped[subject.kelas] = []
      }
      grouped[subject.kelas].push(subject)
    }

    return grouped
  }),

  // Add subject to a class (Admin only)
  addClassSubject: adminProcedure
    .input(
      z.object({
        kelas: z.string().min(1),
        subject: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { kelas, subject } = input

      // Check if already exists
      const existing = await (prisma as any).classSubject.findFirst({
        where: {
          kelas,
          subject,
        },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Mata pelajaran "${subject}" sudah ada untuk kelas "${kelas}"`,
        })
      }

      const newSubject = await (prisma as any).classSubject.create({
        data: {
          kelas,
          subject,
        },
        select: {
          id: true,
          kelas: true,
          subject: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return newSubject
    }),

  // Remove subject from a class (Admin only)
  removeClassSubject: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input

      const subject = await (prisma as any).classSubject.findUnique({
        where: { id },
      })

      if (!subject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Mata pelajaran tidak ditemukan',
        })
      }

      await (prisma as any).classSubject.delete({
        where: { id },
      })

      return { success: true }
    }),

  // Bulk add subjects to a class (Admin only)
  bulkAddClassSubjects: adminProcedure
    .input(
      z.object({
        kelas: z.string().min(1),
        subjects: z.array(z.string().min(1)),
      })
    )
    .mutation(async ({ input }) => {
      const { kelas, subjects } = input

      // Get existing subjects for this class
      const existing = await (prisma as any).classSubject.findMany({
        where: { kelas },
        select: { subject: true },
      })

      const existingSubjects = new Set(existing.map((e: any) => e.subject))
      const newSubjects = subjects.filter(s => !existingSubjects.has(s))

      if (newSubjects.length === 0) {
        return {
          added: 0,
          skipped: subjects.length,
          message: 'Semua mata pelajaran sudah ada',
        }
      }

      // Create new subjects
      const created = await Promise.all(
        newSubjects.map(subject =>
          (prisma as any).classSubject.create({
            data: {
              kelas,
              subject,
            },
            select: {
              id: true,
              kelas: true,
              subject: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        )
      )

      return {
        added: created.length,
        skipped: subjects.length - created.length,
        subjects: created,
      }
    }),
})

