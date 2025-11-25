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
    
    // Add classes without subscription
    const result = subscriptions.map((sub: any) => ({
      ...sub,
      ...checkClassSubscription(sub.kelas),
    }))

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

    return result
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
})

