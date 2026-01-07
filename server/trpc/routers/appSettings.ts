import { z } from 'zod'
import { createTRPCRouter, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const appSettingsRouter = createTRPCRouter({
  // Get app settings
  getSettings: adminProcedure.query(async () => {
    const settings = await prisma.appSettings.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert array to object for easier access
    const settingsMap: Record<string, string> = {}
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value
    })

    return settingsMap
  }),

  // Get specific setting by key
  getSetting: adminProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const setting = await prisma.appSettings.findUnique({
        where: { key: input.key },
      })

      return setting?.value || null
    }),

  // Set/Update app setting
  setSetting: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const setting = await prisma.appSettings.upsert({
        where: { key: input.key },
        update: {
          value: input.value,
          description: input.description,
          updatedAt: new Date(),
        },
        create: {
          key: input.key,
          value: input.value,
          description: input.description,
        },
      })

      return setting
    }),

  // Get update enabled status
  getUpdateEnabled: adminProcedure.query(async () => {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'updateEnabled' },
    })

    // Return true if not set (default behavior)
    if (!setting) {
      return true
    }

    return setting.value === 'true'
  }),

  // Set update enabled status
  setUpdateEnabled: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const setting = await prisma.appSettings.upsert({
        where: { key: 'updateEnabled' },
        update: {
          value: input.enabled ? 'true' : 'false',
          description: 'Control whether users can see update notifications',
          updatedAt: new Date(),
        },
        create: {
          key: 'updateEnabled',
          value: input.enabled ? 'true' : 'false',
          description: 'Control whether users can see update notifications',
        },
      })

      return setting
    }),
})

