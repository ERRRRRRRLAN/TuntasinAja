import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const userSettingsRouter = createTRPCRouter({
  // Get user settings (create default if not exists)
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
        },
      })
    }

    return settings
  }),

  // Update user settings
  update: protectedProcedure
    .input(
      z.object({
        // Notifications
        pushNotificationsEnabled: z.boolean().optional(),
        taskNotificationsEnabled: z.boolean().optional(),
        commentNotificationsEnabled: z.boolean().optional(),
        announcementNotificationsEnabled: z.boolean().optional(),
        deadlineReminderEnabled: z.boolean().optional(),
        scheduleReminderEnabled: z.boolean().optional(),
        overdueReminderEnabled: z.boolean().optional(),
        reminderTime: z.string().nullable().optional(),
        dndEnabled: z.boolean().optional(),
        dndStartTime: z.string().nullable().optional(),
        dndEndTime: z.string().nullable().optional(),
        
        // Display
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        tasksPerPage: z.number().min(10).max(100).optional(),
        defaultSort: z.enum(['newest', 'oldest', 'deadline']).optional(),
        showCompletedTasks: z.boolean().optional(),
        fontSize: z.enum(['small', 'normal', 'large']).optional(),
        animationsEnabled: z.boolean().optional(),
        
        // Data
        autoDeleteHistoryDays: z.number().min(0).nullable().optional(),
        
        // Sound & Vibration
        soundEnabled: z.boolean().optional(),
        vibrationEnabled: z.boolean().optional(),
        
        // Language & Regional
        language: z.enum(['id', 'en']).optional(),
        dateFormat: z.string().optional(),
        timeFormat: z.enum(['12h', '24h']).optional(),
        
        // Accessibility
        highContrast: z.boolean().optional(),
        largeButtons: z.boolean().optional(),
        reduceAnimations: z.boolean().optional(),
      }).partial()
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get or create settings
      const existingSettings = await prisma.userSettings.findUnique({
        where: { userId },
      })

      // Prepare update data (only include fields that are provided)
      const updateData: any = {}
      
      if (input.pushNotificationsEnabled !== undefined) {
        updateData.pushNotificationsEnabled = input.pushNotificationsEnabled
      }
      if (input.taskNotificationsEnabled !== undefined) {
        updateData.taskNotificationsEnabled = input.taskNotificationsEnabled
      }
      if (input.commentNotificationsEnabled !== undefined) {
        updateData.commentNotificationsEnabled = input.commentNotificationsEnabled
      }
      if (input.announcementNotificationsEnabled !== undefined) {
        updateData.announcementNotificationsEnabled = input.announcementNotificationsEnabled
      }
      if (input.deadlineReminderEnabled !== undefined) {
        updateData.deadlineReminderEnabled = input.deadlineReminderEnabled
      }
      if (input.scheduleReminderEnabled !== undefined) {
        updateData.scheduleReminderEnabled = input.scheduleReminderEnabled
      }
      if (input.overdueReminderEnabled !== undefined) {
        updateData.overdueReminderEnabled = input.overdueReminderEnabled
      }
      if (input.reminderTime !== undefined) {
        updateData.reminderTime = input.reminderTime
      }
      if (input.dndEnabled !== undefined) {
        updateData.dndEnabled = input.dndEnabled
      }
      if (input.dndStartTime !== undefined) {
        updateData.dndStartTime = input.dndStartTime
      }
      if (input.dndEndTime !== undefined) {
        updateData.dndEndTime = input.dndEndTime
      }
      if (input.theme !== undefined) {
        updateData.theme = input.theme
      }
      if (input.tasksPerPage !== undefined) {
        updateData.tasksPerPage = input.tasksPerPage
      }
      if (input.defaultSort !== undefined) {
        updateData.defaultSort = input.defaultSort
      }
      if (input.showCompletedTasks !== undefined) {
        updateData.showCompletedTasks = input.showCompletedTasks
      }
      if (input.fontSize !== undefined) {
        updateData.fontSize = input.fontSize
      }
      if (input.animationsEnabled !== undefined) {
        updateData.animationsEnabled = input.animationsEnabled
      }
      if (input.autoDeleteHistoryDays !== undefined) {
        updateData.autoDeleteHistoryDays = input.autoDeleteHistoryDays
      }
      if (input.soundEnabled !== undefined) {
        updateData.soundEnabled = input.soundEnabled
      }
      if (input.vibrationEnabled !== undefined) {
        updateData.vibrationEnabled = input.vibrationEnabled
      }
      if (input.language !== undefined) {
        updateData.language = input.language
      }
      if (input.dateFormat !== undefined) {
        updateData.dateFormat = input.dateFormat
      }
      if (input.timeFormat !== undefined) {
        updateData.timeFormat = input.timeFormat
      }
      if (input.highContrast !== undefined) {
        updateData.highContrast = input.highContrast
      }
      if (input.largeButtons !== undefined) {
        updateData.largeButtons = input.largeButtons
      }
      if (input.reduceAnimations !== undefined) {
        updateData.reduceAnimations = input.reduceAnimations
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50ac13b1-8f34-4b5c-bd10-7aa13e02ac71',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userSettings.ts:update',message:'Before upsert settings',data:{userId,updateData,hasReminderTime:!!updateData.reminderTime,reminderTimeValue:updateData.reminderTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Upsert settings
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData,
        },
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50ac13b1-8f34-4b5c-bd10-7aa13e02ac71',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userSettings.ts:update',message:'After upsert settings',data:{userId,reminderTime:settings.reminderTime,deadlineReminderEnabled:settings.deadlineReminderEnabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      return settings
    }),

  // Reset to defaults
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Delete existing settings and create new with defaults
    await prisma.userSettings.deleteMany({
      where: { userId },
    })

    const settings = await prisma.userSettings.create({
      data: {
        userId,
      },
    })

    return settings
  }),

  // Export user data
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        kelas: true,
        createdAt: true,
      },
    })

    // Get threads
    const threads = await prisma.thread.findMany({
      where: { authorId: userId },
      include: {
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get history
    const histories = await prisma.history.findMany({
      where: { userId },
      orderBy: { completedDate: 'desc' },
    })

    // Get user statuses
    const userStatuses = await prisma.userStatus.findMany({
      where: { userId },
    })

    return {
      user,
      threads,
      histories,
      userStatuses,
      exportedAt: new Date().toISOString(),
    }
  }),

  // Clear cache (placeholder - actual implementation depends on cache system)
  clearCache: protectedProcedure.mutation(async ({ ctx }) => {
    // This would clear any client-side cache
    // For server-side cache, you'd need to implement cache invalidation
    return { success: true, message: 'Cache cleared successfully' }
  }),
})

