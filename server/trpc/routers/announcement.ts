import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { getUTCDate } from '@/lib/date-utils'
import { TRPCError } from '@trpc/server'
import { addHours, addDays, isBefore } from 'date-fns'
import { checkIsDanton, getUserPermission } from '../trpc'
import { checkClassSubscription } from './subscription'

export const announcementRouter = createTRPCRouter({
  // Get all approved announcements for user's kelas
  getAll: publicProcedure.query(async ({ ctx }) => {
    const now = getUTCDate()
    
    // Get user's kelas if logged in
    let userKelas: string | null = null
    if (ctx.session?.user) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          isAdmin: true,
          isDanton: true,
        },
      }) as any
      
      if (user?.isAdmin) {
        // Admin can see all announcements
        const announcements = await (prisma as any).announcement.findMany({
          where: {
            expiresAt: {
              gt: now, // Not expired
            },
            isApproved: true,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        return announcements
      }
      
      userKelas = user?.kelas || null
    }

    // Get announcements for user's kelas (only approved and not expired)
    const announcements = await (prisma as any).announcement.findMany({
      where: {
        kelas: userKelas || undefined,
        expiresAt: {
          gt: now, // Not expired
        },
        isApproved: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return announcements
  }),

  // Create announcement (Danton: auto-approved, User: as request)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        expiresInHours: z.number().int().min(1).max(8760), // Max 1 year (365 days * 24 hours)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check user permission
      const permission = await getUserPermission(ctx.session.user.id)
      if (permission === 'only_read') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya memiliki izin membaca. Tidak dapat membuat announcement.',
        })
      }

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          isAdmin: true,
          isDanton: true,
        },
      }) as any

      if (!user?.kelas && !user?.isAdmin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Anda harus memiliki kelas untuk membuat announcement.',
        })
      }

      // Check subscription status (skip for admin)
      if (!user?.isAdmin && user?.kelas) {
        const subscriptionStatus = await checkClassSubscription(user.kelas)
        if (!subscriptionStatus.isActive) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Subscription untuk kelas ${user.kelas} sudah habis. Tidak dapat membuat announcement.`,
          })
        }
      }

      const now = getUTCDate()
      const expiresAt = addHours(now, input.expiresInHours)

      // If user is danton or admin, auto-approve. Otherwise, create as request
      const isApproved = user?.isDanton === true || user?.isAdmin === true

      const announcement = await (prisma as any).announcement.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
          kelas: user?.kelas || '',
          expiresAt,
          isApproved,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return {
        ...announcement,
        message: isApproved 
          ? 'Announcement berhasil dibuat!' 
          : 'Request announcement telah dikirim ke danton. Tunggu persetujuan.',
      }
    }),

  // Get announcement requests for danton's kelas
  getRequests: protectedProcedure.query(async ({ ctx }) => {
    const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)

    if (!isDanton || !kelas) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Hanya danton yang dapat melihat request announcements.',
      })
    }

    const now = getUTCDate()

    const requests = await (prisma as any).announcement.findMany({
      where: {
        kelas,
        isApproved: false,
        expiresAt: {
          gt: now, // Only show not expired requests
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return requests
  }),

  // Approve announcement request (Danton only)
  approveRequest: protectedProcedure
    .input(z.object({ announcementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)

      if (!isDanton || !kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Hanya danton yang dapat menyetujui request announcements.',
        })
      }

      const announcement = await (prisma as any).announcement.findUnique({
        where: { id: input.announcementId },
      })

      if (!announcement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement tidak ditemukan.',
        })
      }

      if (announcement.kelas !== kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat menyetujui request dari kelas Anda sendiri.',
        })
      }

      if (announcement.isApproved) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Announcement sudah disetujui.',
        })
      }

      const updated = await (prisma as any).announcement.update({
        where: { id: input.announcementId },
        data: {
          isApproved: true,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return updated
    }),

  // Reject/Delete announcement request (Danton only)
  rejectRequest: protectedProcedure
    .input(z.object({ announcementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)

      if (!isDanton || !kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Hanya danton yang dapat menolak request announcements.',
        })
      }

      const announcement = await (prisma as any).announcement.findUnique({
        where: { id: input.announcementId },
      })

      if (!announcement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement tidak ditemukan.',
        })
      }

      if (announcement.kelas !== kelas) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda hanya dapat menolak request dari kelas Anda sendiri.',
        })
      }

      await (prisma as any).announcement.delete({
        where: { id: input.announcementId },
      })

      return { success: true }
    }),

  // Delete announcement (Author or Danton only)
  delete: protectedProcedure
    .input(z.object({ announcementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const announcement = await (prisma as any).announcement.findUnique({
        where: { id: input.announcementId },
      })

      if (!announcement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement tidak ditemukan.',
        })
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          isAdmin: true,
        },
      }) as any

      const isAdmin = user?.isAdmin === true

      // Check if user is danton
      const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)
      const isDantonOfSameClass = isDanton && kelas === announcement.kelas

      // Check if user is the author
      const isAuthor = announcement.authorId === ctx.session.user.id

      if (!isAdmin && !isDantonOfSameClass && !isAuthor) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda tidak memiliki izin untuk menghapus announcement ini.',
        })
      }

      await (prisma as any).announcement.delete({
        where: { id: input.announcementId },
      })

      return { success: true }
    }),

  // Update announcement (Author or Danton only)
  update: protectedProcedure
    .input(
      z.object({
        announcementId: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        expiresInHours: z.number().int().min(1).max(8760).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const announcement = await (prisma as any).announcement.findUnique({
        where: { id: input.announcementId },
      })

      if (!announcement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement tidak ditemukan.',
        })
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          isAdmin: true,
        },
      }) as any

      const isAdmin = user?.isAdmin === true

      // Check if user is danton
      const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)
      const isDantonOfSameClass = isDanton && kelas === announcement.kelas

      // Check if user is the author
      const isAuthor = announcement.authorId === ctx.session.user.id

      if (!isAdmin && !isDantonOfSameClass && !isAuthor) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda tidak memiliki izin untuk mengedit announcement ini.',
        })
      }

      const updateData: any = {}

      if (input.title) updateData.title = input.title
      if (input.content) updateData.content = input.content
      if (input.expiresInHours !== undefined) {
        const now = getUTCDate()
        updateData.expiresAt = addHours(now, input.expiresInHours)
      }

      const updated = await (prisma as any).announcement.update({
        where: { id: input.announcementId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return updated
    }),

  // Get request count for danton (for badge notification)
  getRequestCount: protectedProcedure.query(async ({ ctx }) => {
    const { isDanton, kelas } = await checkIsDanton(ctx.session.user.id)

    if (!isDanton || !kelas) {
      return 0
    }

    const now = getUTCDate()

    const count = await (prisma as any).announcement.count({
      where: {
        kelas,
        isApproved: false,
        expiresAt: {
          gt: now, // Only count not expired requests
        },
      },
    })

    return count
  }),
})

