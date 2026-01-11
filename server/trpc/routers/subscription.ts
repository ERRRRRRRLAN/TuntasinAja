import { z } from 'zod'
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { getUTCDate } from '@/lib/date-utils'
import { TRPCError } from '@trpc/server'
import { addDays, differenceInDays, differenceInHours, isAfter, isBefore } from 'date-fns'

// Helper function to check subscription status
export const checkClassSubscription = async (kelas: string | null): Promise<{
  isActive: boolean
  isExpired: boolean
  isExpiringSoon: boolean
  daysRemaining: number | null
  hoursRemaining: number | null
  endDate: Date | null
  status: 'active' | 'expiring_soon' | 'expired' | 'no_subscription'
}> => {
  if (!kelas) {
    return {
      isActive: false,
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining: null,
      hoursRemaining: null,
      endDate: null,
      status: 'no_subscription',
    }
  }

  const subscription = await (prisma as any).classSubscription.findUnique({
    where: { kelas },
  })

  if (!subscription) {
    return {
      isActive: false,
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining: null,
      hoursRemaining: null,
      endDate: null,
      status: 'no_subscription',
    }
  }

  const now = getUTCDate()
  const endDate = new Date(subscription.subscriptionEndDate)
  const isExpired = isBefore(endDate, now)
  const daysRemaining = differenceInDays(endDate, now)
  const hoursRemaining = differenceInHours(endDate, now)
  const isExpiringSoon = !isExpired && daysRemaining <= 7 && daysRemaining > 0

  let status: 'active' | 'expiring_soon' | 'expired' | 'no_subscription'
  if (isExpired) {
    status = 'expired'
  } else if (isExpiringSoon) {
    status = 'expiring_soon'
  } else {
    status = 'active'
  }

  return {
    isActive: !isExpired,
    isExpired,
    isExpiringSoon,
    daysRemaining: isExpired ? 0 : daysRemaining,
    hoursRemaining: isExpired ? 0 : hoursRemaining,
    endDate,
    status,
  }
}

export const subscriptionRouter = createTRPCRouter({
  // Get subscription for a specific class (Admin & Danton)
  getClassSubscription: protectedProcedure
    .input(z.object({ kelas: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let targetKelas = input.kelas

      // If no kelas provided, get from current user's kelas (for danton)
      if (!targetKelas) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { kelas: true, isAdmin: true },
        }) as any

        if (!user?.isAdmin && !user?.kelas) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Kelas tidak ditemukan',
          })
        }

        targetKelas = user?.kelas || null
      }

      if (!targetKelas) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Kelas harus diisi',
        })
      }

      const subscription = await (prisma as any).classSubscription.findUnique({
        where: { kelas: targetKelas },
      })

      if (!subscription) {
        return {
          kelas: targetKelas,
          subscriptionEndDate: null,
          status: 'no_subscription' as const,
          isActive: false,
          isExpired: true,
          isExpiringSoon: false,
          daysRemaining: null,
          hoursRemaining: null,
        }
      }

      const subscriptionStatus = await checkClassSubscription(targetKelas)

      return {
        kelas: targetKelas,
        subscriptionEndDate: subscription.subscriptionEndDate,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        ...subscriptionStatus,
      }
    }),

  // Get all class subscriptions (Admin only)
  getAllClassSubscriptions: adminProcedure.query(async () => {
    const subscriptions = await (prisma as any).classSubscription.findMany({
      orderBy: {
        subscriptionEndDate: 'asc',
      },
    })

    // Get unique kelas from users
    const allKelas = await prisma.user.findMany({
      where: {
        kelas: { not: null },
        isAdmin: false,
      },
      select: {
        kelas: true,
      },
      distinct: ['kelas'],
    })

    const subscribedKelas = new Set(subscriptions.map((s: any) => s.kelas))

    // Add classes without subscription - await checkClassSubscription
    const result = await Promise.all(
      subscriptions.map(async (sub: any) => {
        const status = await checkClassSubscription(sub.kelas)
        return {
          ...sub,
          ...status,
        }
      })
    )

    // Add classes without subscription
    for (const user of allKelas) {
      if (user.kelas && !subscribedKelas.has(user.kelas)) {
        result.push({
          kelas: user.kelas,
          subscriptionEndDate: null,
          status: 'no_subscription' as const,
          isActive: false,
          isExpired: true,
          isExpiringSoon: false,
          daysRemaining: null,
          hoursRemaining: null,
        })
      }
    }

    // Get class info (school)
    const classNames = result.map((r) => r.kelas).filter((k): k is string => !!k)
    const classesInfo = await prisma.class.findMany({
      where: {
        name: { in: classNames },
      },
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
    })

    // Create map of kelas -> school name (take first if duplicates for now, or join?)
    // In legacy system, kelas string might be unique enough or we just take the one available.
    const classSchoolMap = new Map<string, string>()
    classesInfo.forEach((c) => {
      // If multiple schools have same class name, this might overwrite. 
      // Ideally subscription should be linked to schoolId too.
      // But for now, we display what we find.
      classSchoolMap.set(c.name, c.school.name)
    })

    return result.map((item) => ({
      ...item,
      schoolName: classSchoolMap.get(item.kelas || '') || null,
    }))
  }),

  // Set subscription for a class (Admin only)
  // If subscription already exists, extend from current endDate
  setClassSubscription: adminProcedure
    .input(
      z.object({
        kelas: z.string(),
        days: z.number().int().min(1).max(3650), // Max 10 years
      })
    )
    .mutation(async ({ input }) => {
      const { kelas, days } = input

      // Check if subscription already exists
      const existing = await (prisma as any).classSubscription.findUnique({
        where: { kelas },
      })

      const now = getUTCDate()
      let endDate: Date

      if (existing) {
        // Extend from existing endDate (not from now)
        const currentEndDate = new Date(existing.subscriptionEndDate)
        // If already expired, start from now. Otherwise extend from endDate
        if (isBefore(currentEndDate, now)) {
          endDate = addDays(now, days)
        } else {
          endDate = addDays(currentEndDate, days)
        }
      } else {
        // Create new subscription starting from now
        endDate = addDays(now, days)
      }

      // Upsert subscription
      const subscription = await (prisma as any).classSubscription.upsert({
        where: { kelas },
        create: {
          kelas,
          subscriptionEndDate: endDate,
        },
        update: {
          subscriptionEndDate: endDate,
        },
      })

      const subscriptionStatus = await checkClassSubscription(kelas)

      return {
        ...subscription,
        ...subscriptionStatus,
      }
    }),

  // Extend subscription for a class (Admin only)
  // Add days to existing endDate
  extendClassSubscription: adminProcedure
    .input(
      z.object({
        kelas: z.string(),
        days: z.number().int().min(1).max(3650),
      })
    )
    .mutation(async ({ input }) => {
      const { kelas, days } = input

      const existing = await (prisma as any).classSubscription.findUnique({
        where: { kelas },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription untuk kelas ini belum ada. Gunakan setClassSubscription untuk membuat subscription baru.',
        })
      }

      const now = getUTCDate()
      const currentEndDate = new Date(existing.subscriptionEndDate)

      // If already expired, extend from now. Otherwise extend from endDate
      let newEndDate: Date
      if (isBefore(currentEndDate, now)) {
        newEndDate = addDays(now, days)
      } else {
        newEndDate = addDays(currentEndDate, days)
      }

      const subscription = await (prisma as any).classSubscription.update({
        where: { kelas },
        data: {
          subscriptionEndDate: newEndDate,
        },
      })

      const subscriptionStatus = await checkClassSubscription(kelas)

      return {
        ...subscription,
        ...subscriptionStatus,
      }
    }),

  // Update subscription for a class (Admin only)
  // Flexible: can extend, reduce, or set forcefully
  updateClassSubscription: adminProcedure
    .input(
      z.object({
        kelas: z.string(),
        action: z.enum(['set', 'extend', 'reduce']),
        days: z.number().int().min(-3650).max(3650), // Can be negative for reduce
        forceFromNow: z.boolean().optional().default(false), // For set: force from now instead of extending
      })
    )
    .mutation(async ({ input }) => {
      const { kelas, action, days, forceFromNow } = input

      const existing = await (prisma as any).classSubscription.findUnique({
        where: { kelas },
      })

      const now = getUTCDate()
      let newEndDate: Date

      if (action === 'set') {
        // Set subscription: from now (if forceFromNow or no existing) or extend from existing
        if (forceFromNow || !existing) {
          // Set from now
          newEndDate = addDays(now, days)
        } else {
          // Extend from existing endDate (or now if expired)
          const currentEndDate = new Date(existing.subscriptionEndDate)
          if (isBefore(currentEndDate, now)) {
            newEndDate = addDays(now, days)
          } else {
            newEndDate = addDays(currentEndDate, days)
          }
        }
      } else if (action === 'extend') {
        // Extend: add days (must be positive)
        if (days <= 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Untuk extend, jumlah hari harus positif. Gunakan action "reduce" untuk mengurangi.',
          })
        }
        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subscription untuk kelas ini belum ada. Gunakan action "set" untuk membuat subscription baru.',
          })
        }
        const currentEndDate = new Date(existing.subscriptionEndDate)
        if (isBefore(currentEndDate, now)) {
          newEndDate = addDays(now, days)
        } else {
          newEndDate = addDays(currentEndDate, days)
        }
      } else if (action === 'reduce') {
        // Reduce: subtract days (must be negative or will be treated as negative)
        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subscription untuk kelas ini belum ada. Tidak dapat mengurangi subscription yang tidak ada.',
          })
        }
        const currentEndDate = new Date(existing.subscriptionEndDate)
        const reduceDays = days < 0 ? Math.abs(days) : days // Ensure positive for subtraction
        newEndDate = addDays(currentEndDate, -reduceDays)

        // Prevent setting endDate before now (minimum is now)
        if (isBefore(newEndDate, now)) {
          newEndDate = now
        }
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Action tidak valid',
        })
      }

      // Upsert subscription
      const subscription = await (prisma as any).classSubscription.upsert({
        where: { kelas },
        create: {
          kelas,
          subscriptionEndDate: newEndDate,
        },
        update: {
          subscriptionEndDate: newEndDate,
        },
      })

      const subscriptionStatus = await checkClassSubscription(kelas)

      return {
        ...subscription,
        ...subscriptionStatus,
      }
    }),
})

