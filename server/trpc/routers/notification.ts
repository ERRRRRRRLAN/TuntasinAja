import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase-admin'
import { filterTokensBySettings, type NotificationType } from '@/server/utils/notificationSettings'

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
      const startTime = Date.now()
      console.log('[NotificationRouter] ========== REGISTER TOKEN START ==========')
      console.log('[NotificationRouter] Registering device token:', {
        userId: ctx.session.user.id,
        userName: ctx.session.user.name,
        userEmail: ctx.session.user.email,
        userKelas: ctx.session.user.kelas,
        tokenLength: input.token.length,
        tokenPrefix: input.token.substring(0, 30) + '...',
        tokenSuffix: '...' + input.token.substring(input.token.length - 10),
        deviceInfo: input.deviceInfo,
        timestamp: new Date().toISOString(),
      })

      try {
        // Check if token already exists with different user
        const existingToken = await prisma.deviceToken.findUnique({
          where: {
            token: input.token,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                kelas: true,
              },
            },
          },
        })

        if (existingToken && existingToken.userId !== ctx.session.user.id) {
          console.log('[NotificationRouter] 🔄 Token exists for different user, updating:', {
            oldUserId: existingToken.userId,
            oldUserName: existingToken.user.name,
            oldUserEmail: existingToken.user.email,
            oldUserKelas: existingToken.user.kelas,
            newUserId: ctx.session.user.id,
            newUserName: ctx.session.user.name,
            newUserEmail: ctx.session.user.email,
            tokenPrefix: input.token.substring(0, 20) + '...',
          })
        }

        // Upsert device token (user can have multiple devices)
        // This will update userId if token exists for different user
        const result = await prisma.deviceToken.upsert({
          where: {
            token: input.token,
          },
          update: {
            userId: ctx.session.user.id, // Always update to current user
            deviceInfo: input.deviceInfo,
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            token: input.token,
            deviceInfo: input.deviceInfo,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                kelas: true,
              },
            },
          },
        })

        const duration = Date.now() - startTime
        console.log('[NotificationRouter] ✅ Device token registered/updated successfully:', {
          id: result.id,
          userId: result.userId,
          userName: result.user.name,
          userEmail: result.user.email,
          userKelas: result.user.kelas,
          deviceInfo: result.deviceInfo,
          wasUpdated: !!existingToken,
          previousUserId: existingToken?.userId,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          duration: `${duration}ms`,
        })
        console.log('[NotificationRouter] ========== REGISTER TOKEN SUCCESS ==========')

        return { success: true }
      } catch (error) {
        const duration = Date.now() - startTime
        console.error('[NotificationRouter] ========== REGISTER TOKEN ERROR ==========')
        console.error('[NotificationRouter] ❌ Error registering device token:', {
          error,
          errorType: typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name,
          tokenLength: input.token.length,
          tokenPrefix: input.token.substring(0, 30) + '...',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        })
        console.error('[NotificationRouter] ========== REGISTER TOKEN ERROR END ==========')
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

  // Check if current user has device token registered
  checkDeviceToken: protectedProcedure.query(async ({ ctx }) => {
    const deviceToken = await prisma.deviceToken.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
      select: {
        token: true,
        deviceInfo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return deviceToken
  }),
})

// Helper function to send notification to users in a class
export async function sendNotificationToClass(
  kelas: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  notificationType: NotificationType = 'task'
) {
  try {
    console.log('[sendNotificationToClass] Starting notification send:', {
      kelas,
      title,
      body,
    })

    // Validate kelas parameter
    if (!kelas || typeof kelas !== 'string') {
      console.error('[sendNotificationToClass] ❌ Invalid kelas parameter:', kelas)
      throw new Error('Invalid kelas parameter')
    }

    // Trim and normalize kelas to ensure exact match
    const normalizedKelas = kelas.trim()

    console.log('[sendNotificationToClass] Querying device tokens for class:', {
      originalKelas: kelas,
      normalizedKelas: normalizedKelas,
      kelasLength: normalizedKelas.length,
    })

    // Get all device tokens for users in this class
    // Use exact match with trimmed kelas
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        user: {
          kelas: normalizedKelas, // Exact match with normalized kelas
          isAdmin: false, // Don't send to admin
        },
      },
      select: {
        token: true,
        user: {
          select: {
            id: true,
            name: true,
            kelas: true,
            email: true,
          },
        },
      },
    })

    // Additional validation: filter out any tokens that don't match exactly
    const filteredTokens = deviceTokens.filter(dt => {
      const userKelas = dt.user.kelas?.trim()
      const matches = userKelas === normalizedKelas
      if (!matches) {
        console.warn('[sendNotificationToClass] ⚠️ Filtered out token with mismatched kelas:', {
          tokenPrefix: dt.token.substring(0, 20) + '...',
          userName: dt.user.name,
          expectedKelas: normalizedKelas,
          actualKelas: userKelas,
        })
      }
      return matches
    })

    console.log('[sendNotificationToClass] Found device tokens:', {
      totalFound: deviceTokens.length,
      afterFilter: filteredTokens.length,
      tokens: filteredTokens.map(dt => ({
        tokenPrefix: dt.token.substring(0, 20) + '...',
        userName: dt.user.name,
        userEmail: dt.user.email,
        userKelas: dt.user.kelas,
        matches: dt.user.kelas?.trim() === normalizedKelas,
      })),
    })

    if (filteredTokens.length === 0) {
      console.warn('[sendNotificationToClass] ⚠️ No device tokens found for class:', normalizedKelas)
      // Also check if there are users in this class without tokens
      const usersInClass = await prisma.user.findMany({
        where: {
          kelas: normalizedKelas,
          isAdmin: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          kelas: true,
        },
      })
      console.log('[sendNotificationToClass] Users in class (without tokens):', {
        count: usersInClass.length,
        users: usersInClass.map(u => ({ 
          name: u.name, 
          email: u.email,
          kelas: u.kelas,
          matches: u.kelas?.trim() === normalizedKelas,
        })),
      })
      
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No device tokens found for this class',
      }
    }

    // Filter tokens based on user notification settings
    const tokensToSend = await filterTokensBySettings(filteredTokens, notificationType)
    
    if (tokensToSend.length === 0) {
      console.log('[sendNotificationToClass] No tokens to send after filtering by user settings')
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No users eligible for notification based on their settings',
      }
    }

    console.log('[sendNotificationToClass] Sending to', tokensToSend.length, 'devices (filtered from', filteredTokens.length, 'total)')
    const result = await sendPushNotification(tokensToSend, title, body, data)
    
    console.log('[sendNotificationToClass] ✅ Notification send result:', {
      successCount: result.successCount,
      failureCount: result.failureCount,
    })

    return result
  } catch (error) {
    console.error('[sendNotificationToClass] ❌ Error sending notification to class:', error)
    throw error
  }
}

