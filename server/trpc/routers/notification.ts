import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase-admin'

export const notificationRouter = createTRPCRouter({
  // Register device token
  registerToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        deviceInfo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('[NotificationRouter] Registering device token:', {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name,
        tokenPrefix: input.token.substring(0, 20) + '...',
        deviceInfo: input.deviceInfo,
      })

      try {
        // Upsert device token (user can have multiple devices)
        const result = await prisma.deviceToken.upsert({
          where: {
            token: input.token,
          },
          update: {
            userId: ctx.session.user.id,
            deviceInfo: input.deviceInfo,
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            token: input.token,
            deviceInfo: input.deviceInfo,
          },
        })

        console.log('[NotificationRouter] ✅ Device token registered successfully:', {
          id: result.id,
          userId: result.userId,
          deviceInfo: result.deviceInfo,
        })

        return { success: true }
      } catch (error) {
        console.error('[NotificationRouter] ❌ Error registering device token:', error)
        throw error
      }
    }),

  // Unregister device token
  unregisterToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only delete if token belongs to current user
      await prisma.deviceToken.deleteMany({
        where: {
          token: input.token,
          userId: ctx.session.user.id,
        },
      })

      return { success: true }
    }),
})

// Helper function to send notification to users in a class
export async function sendNotificationToClass(
  kelas: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    // Get all device tokens for users in this class
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        user: {
          kelas,
          isAdmin: false, // Don't send to admin
        },
      },
      select: {
        token: true,
      },
    })

    if (deviceTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No device tokens found for this class',
      }
    }

    const tokens = deviceTokens.map((dt: { token: string }) => dt.token)
    const result = await sendPushNotification(tokens, title, body, data)

    return result
  } catch (error) {
    console.error('Error sending notification to class:', error)
    throw error
  }
}

