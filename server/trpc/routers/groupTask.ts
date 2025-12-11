import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const groupTaskRouter = createTRPCRouter({
  // Search users by name for autocomplete (same kelas, exclude current user, admin, already added)
  searchUsersByName: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        query: z.string().min(1), // Nama yang diketik user
      })
    )
    .query(async ({ ctx, input }) => {
      // Get thread with author info
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              id: true,
              kelas: true,
            },
          },
          groupMembers: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread tidak ditemukan')
      }

      // Verify user is thread author
      if (thread.authorId !== ctx.session.user.id) {
        throw new Error('Hanya pembuat thread yang bisa mencari anggota')
      }

      // Verify thread is group task
      if (!thread.isGroupTask) {
        throw new Error('Thread ini bukan tugas kelompok')
      }

      if (!thread.author.kelas) {
        throw new Error('Pembuat thread tidak memiliki kelas')
      }

      // Get existing member IDs
      const existingMemberIds = new Set(thread.groupMembers.map((m) => m.userId))

      // Search users by name (case-insensitive, contains match)
      const users = await prisma.user.findMany({
        where: {
          kelas: thread.author.kelas,
          isAdmin: false,
          id: { not: ctx.session.user.id }, // Exclude current user
          id: { notIn: Array.from(existingMemberIds) }, // Exclude already added
          name: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: 'asc' },
        take: 20, // Limit results
      })

      return users
    }),

  // Create group (add members by name)
  createGroup: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        userNames: z.array(z.string().min(1)), // Array of names (bukan userIds)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get thread with author and existing members
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              id: true,
              kelas: true,
            },
          },
          groupMembers: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread tidak ditemukan')
      }

      // Validate: user is thread author
      if (thread.authorId !== ctx.session.user.id) {
        throw new Error('Hanya pembuat thread yang bisa membuat kelompok')
      }

      // Validate: thread is group task
      if (!thread.isGroupTask) {
        throw new Error('Thread ini bukan tugas kelompok')
      }

      if (!thread.author.kelas) {
        throw new Error('Pembuat thread tidak memiliki kelas')
      }

      // Validate: minimal 1 anggota
      if (input.userNames.length === 0) {
        throw new Error('Pilih minimal 1 anggota untuk membuat kelompok')
      }

      // Validate: maxGroupMembers
      const maxMembers = thread.maxGroupMembers || 50
      const currentMemberCount = thread.groupMembers.length
      const newMemberCount = input.userNames.length
      const creatorIncluded = thread.groupMembers.some((m) => m.userId === thread.authorId)

      // Calculate total after adding: current + new + creator (if not already included)
      const totalAfterAdd = currentMemberCount + newMemberCount + (creatorIncluded ? 0 : 1)

      if (totalAfterAdd > maxMembers) {
        const availableSlots = maxMembers - currentMemberCount - (creatorIncluded ? 0 : 1)
        throw new Error(
          `Jumlah anggota melebihi batas maksimal (${maxMembers} anggota). Anda sudah memiliki ${currentMemberCount} anggota, dan hanya bisa menambahkan ${availableSlots} anggota lagi.`
        )
      }

      // Get existing member IDs
      const existingMemberIds = new Set(thread.groupMembers.map((m) => m.userId))

      // Find users by exact name match (case-insensitive)
      const users = await prisma.user.findMany({
        where: {
          kelas: thread.author.kelas,
          isAdmin: false,
          id: { not: ctx.session.user.id }, // Exclude current user
          id: { notIn: Array.from(existingMemberIds) }, // Exclude already added
          name: {
            in: input.userNames,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
        },
      })

      // Check if all names were found
      const foundNames = new Set(users.map((u) => u.name.toLowerCase()))
      const notFoundNames = input.userNames.filter(
        (name) => !foundNames.has(name.toLowerCase())
      )

      if (notFoundNames.length > 0) {
        throw new Error(
          `User bernama "${notFoundNames[0]}" tidak ada. Pastikan nama yang Anda ketik sesuai dengan nama di database.`
        )
      }

      // Get user IDs
      const userIds = users.map((u) => u.id)

      // Auto-add creator as member if not already included
      if (!creatorIncluded) {
        userIds.push(thread.authorId)
      }

      // Add members (batch insert)
      await prisma.groupMember.createMany({
        data: userIds.map((userId) => ({
          threadId: input.threadId,
          userId,
          addedBy: ctx.session.user.id,
        })),
        skipDuplicates: true,
      })

      return {
        success: true,
        added: users.length,
        totalMembers: currentMemberCount + users.length + (creatorIncluded ? 0 : 1),
      }
    }),

  // Get group members
  getGroupMembers: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access (either is member or is thread author or is admin)
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              id: true,
            },
          },
          groupMembers: {
            where: {
              userId: ctx.session.user.id,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread tidak ditemukan')
      }

      // Check if user is member, author, or admin
      const isMember = thread.groupMembers.length > 0
      const isAuthor = thread.authorId === ctx.session.user.id

      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { isAdmin: true },
      })
      const isAdmin = user?.isAdmin || false

      if (!isMember && !isAuthor && !isAdmin) {
        throw new Error('Anda tidak memiliki akses ke kelompok ini')
      }

      // Get all members with user info
      const members = await prisma.groupMember.findMany({
        where: { threadId: input.threadId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { addedAt: 'asc' },
      })

      return members
    }),

  // Remove member (only thread author)
  removeMember: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get thread
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              id: true,
            },
          },
          groupMembers: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread tidak ditemukan')
      }

      // Validate: user is thread author
      if (thread.authorId !== ctx.session.user.id) {
        throw new Error('Hanya pembuat thread yang bisa menghapus anggota')
      }

      // Validate: not removing creator (minimal pembuat harus tetap ada)
      if (input.userId === thread.authorId) {
        throw new Error('Tidak bisa menghapus pembuat thread dari kelompok')
      }

      // Validate: user is a member
      const isMember = thread.groupMembers.some((m) => m.userId === input.userId)
      if (!isMember) {
        throw new Error('User ini bukan anggota kelompok')
      }

      // Remove member
      await prisma.groupMember.delete({
        where: {
          threadId_userId: {
            threadId: input.threadId,
            userId: input.userId,
          },
        },
      })

      return { success: true }
    }),

  // Add members (for manage group - same logic as createGroup but for existing group)
  addMembers: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        userNames: z.array(z.string().min(1)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get thread with existing members
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              id: true,
              kelas: true,
            },
          },
          groupMembers: {
            select: {
              userId: true,
            },
          },
        },
      })

      if (!thread) {
        throw new Error('Thread tidak ditemukan')
      }

      // Validate: user is thread author
      if (thread.authorId !== ctx.session.user.id) {
        throw new Error('Hanya pembuat thread yang bisa menambahkan anggota')
      }

      if (!thread.author.kelas) {
        throw new Error('Pembuat thread tidak memiliki kelas')
      }

      // Validate: maxGroupMembers
      const maxMembers = thread.maxGroupMembers || 50
      const currentMemberCount = thread.groupMembers.length
      const newMemberCount = input.userNames.length

      if (currentMemberCount + newMemberCount > maxMembers) {
        throw new Error(
          `Jumlah anggota melebihi batas maksimal (${maxMembers} anggota). Anda sudah memiliki ${currentMemberCount} anggota, dan mencoba menambahkan ${newMemberCount} anggota baru.`
        )
      }

      // Get existing member IDs
      const existingMemberIds = new Set(thread.groupMembers.map((m) => m.userId))

      // Find users by exact name match
      const users = await prisma.user.findMany({
        where: {
          kelas: thread.author.kelas,
          isAdmin: false,
          id: { not: ctx.session.user.id },
          id: { notIn: Array.from(existingMemberIds) },
          name: {
            in: input.userNames,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
        },
      })

      // Check if all names were found
      const foundNames = new Set(users.map((u) => u.name.toLowerCase()))
      const notFoundNames = input.userNames.filter(
        (name) => !foundNames.has(name.toLowerCase())
      )

      if (notFoundNames.length > 0) {
        throw new Error(
          `User bernama "${notFoundNames[0]}" tidak ada. Pastikan nama yang Anda ketik sesuai dengan nama di database.`
        )
      }

      // Add members
      await prisma.groupMember.createMany({
        data: users.map((user) => ({
          threadId: input.threadId,
          userId: user.id,
          addedBy: ctx.session.user.id,
        })),
        skipDuplicates: true,
      })

      return {
        success: true,
        added: users.length,
        totalMembers: currentMemberCount + users.length,
      }
    }),
})

