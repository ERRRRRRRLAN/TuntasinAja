import { z } from 'zod'
import { createTRPCRouter, adminProcedure, dantonProcedure, protectedProcedure, publicProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { sendNotificationToClass } from './notification'

export const announcementRouter = createTRPCRouter({
  // Get all announcements for current user
  getAll: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id
    let userKelas: string | null = null
    let isAdmin = false

    if (ctx.session?.user) {
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          isAdmin: true,
        },
      })
      userKelas = user?.kelas || null
      isAdmin = user?.isAdmin || false
    }

    const now = new Date()

      // Get announcements that match user's context
      const announcements = await prisma.announcement.findMany({
      where: {
        AND: [
          {
            OR: [
              // Global announcements
              { targetType: 'global' as const },
              // Class-specific announcements (if user has kelas)
              ...(userKelas ? [{ targetType: 'class' as const, targetKelas: userKelas }] : []),
              // Subject-specific announcements (if user has kelas)
              ...(userKelas ? [{ targetType: 'subject' as const, targetKelas: userKelas }] : []),
            ],
          },
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
              ],
            },
          ],
        },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reads: userId
          ? {
              where: {
                userId: userId,
              },
            }
          : false,
      },
      orderBy: [
        { isPinned: 'desc' }, // Pinned first
        { priority: 'desc' }, // Urgent first
        { createdAt: 'desc' }, // Newest first
      ],
    })

    // Mark which announcements are read
    const announcementsWithReadStatus = announcements.map((announcement) => {
      const isRead = userId ? announcement.reads.length > 0 : false
      return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        authorId: announcement.authorId,
        author: announcement.author, // Explicitly include author
        targetType: announcement.targetType,
        targetKelas: announcement.targetKelas,
        targetSubject: announcement.targetSubject,
        priority: announcement.priority,
        isPinned: announcement.isPinned,
        expiresAt: announcement.expiresAt,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt,
        isRead,
      }
    })

    return announcementsWithReadStatus
  }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kelas: true,
        isAdmin: true,
      },
    })
    const userKelas = user?.kelas || null
    const isAdmin = user?.isAdmin || false

    const now = new Date()

    // Get all relevant announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        AND: [
          {
            OR: [
              { targetType: 'global' as const },
              ...(userKelas ? [{ targetType: 'class' as const, targetKelas: userKelas }] : []),
              ...(userKelas ? [{ targetType: 'subject' as const, targetKelas: userKelas }] : []),
            ],
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      select: {
        id: true,
      },
    })

    // Get read announcements
    const readAnnouncements = await prisma.announcementRead.findMany({
      where: {
        userId: userId,
        announcementId: {
          in: announcements.map((a) => a.id),
        },
      },
      select: {
        announcementId: true,
      },
    })

    const readIds = new Set(readAnnouncements.map((r) => r.announcementId))
    const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length

    return { unreadCount }
  }),

  // Mark announcement as read
  markAsRead: protectedProcedure
    .input(z.object({ announcementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check if already read
      const existingRead = await prisma.announcementRead.findUnique({
        where: {
          announcementId_userId: {
            announcementId: input.announcementId,
            userId: userId,
          },
        },
      })

      if (existingRead) {
        return { success: true, alreadyRead: true }
      }

      // Mark as read
      await prisma.announcementRead.create({
        data: {
          announcementId: input.announcementId,
          userId: userId,
        },
      })

      return { success: true, alreadyRead: false }
    }),

  // Create announcement (Admin, Danton, or User with permission)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(5000),
        targetType: z.enum(['global', 'class', 'subject']),
        targetKelas: z.string().optional(),
        targetSubject: z.string().optional(),
        priority: z.enum(['urgent', 'normal', 'low']).default('normal'),
        isPinned: z.boolean().default(false),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check if user is admin, danton, or has permission
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isAdmin: true,
          isDanton: true,
          kelas: true,
          permission: {
            select: {
              canCreateAnnouncement: true,
            },
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const canCreate = user.isAdmin || user.isDanton || user.permission?.canCreateAnnouncement === true

      if (!canCreate) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Anda tidak memiliki izin untuk membuat pengumuman. Hubungi admin atau danton untuk mendapatkan izin.',
        })
      }

      // Admin can create global or any class announcement
      // Danton and users with permission can only create class-specific announcement for their class
      if (!user.isAdmin) {
        // Danton and users with permission can only create for their own class
        if (input.targetType === 'class' && input.targetKelas && input.targetKelas !== user.kelas) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Anda hanya dapat membuat pengumuman untuk kelas Anda sendiri',
          })
        }

        if (input.targetType === 'global') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Hanya admin yang dapat membuat pengumuman global',
          })
        }

        // Ensure targetKelas is set to user's kelas if not provided
        if (!input.targetKelas && user.kelas) {
          input.targetKelas = user.kelas
        }
      }

      // Validate target fields
      if (input.targetType === 'class' && !input.targetKelas) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'targetKelas is required for class announcements',
        })
      }

      if (input.targetType === 'subject' && (!input.targetKelas || !input.targetSubject)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'targetKelas and targetSubject are required for subject announcements',
        })
      }

      // Prepare data for announcement creation
      // For global announcements, targetKelas and targetSubject must be null
      // For class/subject announcements, ensure targetKelas is set
      const announcementData: {
        title: string
        content: string
        authorId: string
        targetType: 'global' | 'class' | 'subject'
        targetKelas: string | null
        targetSubject: string | null
        priority: 'urgent' | 'normal' | 'low'
        isPinned: boolean
        expiresAt: Date | null
      } = {
        title: input.title,
        content: input.content,
        authorId: userId,
        targetType: input.targetType,
        targetKelas: input.targetType === 'global' ? null : (input.targetKelas || null),
        targetSubject: input.targetType === 'subject' ? (input.targetSubject || null) : null,
        priority: input.priority,
        isPinned: input.isPinned,
        expiresAt: input.expiresAt || null,
      }

      // Create announcement
      const announcement = await prisma.announcement.create({
        data: announcementData,
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

      // Send push notification to target users
      if (input.targetType === 'global') {
        // Send to all users (admin only)
        // This would require getting all device tokens
        // For now, we'll skip global notifications or implement separately
      } else if (input.targetType === 'class' && input.targetKelas) {
        await sendNotificationToClass(
          input.targetKelas,
          `📢 ${input.title}`,
          input.content.substring(0, 100) + (input.content.length > 100 ? '...' : ''),
          {
            type: 'announcement',
            announcementId: announcement.id,
            priority: input.priority,
          }
        )
      }

      return announcement
    }),

  // Update announcement (Admin or Danton - only their own class)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).max(5000).optional(),
        priority: z.enum(['urgent', 'normal', 'low']).optional(),
        isPinned: z.boolean().optional(),
        expiresAt: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { id, ...updateData } = input

      // Get announcement
      const announcement = await prisma.announcement.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              isAdmin: true,
              isDanton: true,
              kelas: true,
            },
          },
        },
      })

      if (!announcement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement not found',
        })
      }

      // Check permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isAdmin: true,
          isDanton: true,
          kelas: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Admin can update any announcement
      // Danton can only update their own class announcements
      if (!user.isAdmin) {
        if (!user.isDanton) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admin or danton can update announcements',
          })
        }

        if (announcement.targetKelas !== user.kelas) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Danton can only update announcements for their own class',
          })
        }
      }

      // Update announcement
      const updated = await prisma.announcement.update({
        where: { id: input.id },
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

  // Delete announcement (Admin or Danton - only their own class)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get announcement
      const announcement = await prisma.announcement.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              isAdmin: true,
              isDanton: true,
              kelas: true,
            },
          },
        },
      })

      if (!announcement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement not found',
        })
      }

      // Check permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isAdmin: true,
          isDanton: true,
          kelas: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Admin can delete any announcement
      // Danton can only delete their own class announcements
      if (!user.isAdmin) {
        if (!user.isDanton) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admin or danton can delete announcements',
          })
        }

        if (announcement.targetKelas !== user.kelas) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Danton can only delete announcements for their own class',
          })
        }
      }

      // Delete announcement (cascade will delete reads)
      await prisma.announcement.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get all announcements for management (Admin or Danton)
  getAllForManagement: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isAdmin: true,
        isDanton: true,
        kelas: true,
        permission: {
          select: {
            canCreateAnnouncement: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    const canManage = user.isAdmin || user.isDanton || user.permission?.canCreateAnnouncement === true

    if (!canManage) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki izin untuk melihat daftar pengumuman',
      })
    }

    const whereClause = user.isAdmin
      ? undefined // Admin sees all
      : {
          // Danton sees only their class
          targetKelas: user.kelas,
        }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            reads: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return announcements
  }),
})

