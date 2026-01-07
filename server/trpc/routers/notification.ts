import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'
import { sendPushNotification, sendWebPushNotifications } from '@/lib/firebase-admin'
import { filterTokensBySettings, type NotificationType } from '@/server/utils/notificationSettings'
import logger, { createLogger } from '@/lib/logger'

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
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const log = createLogger({ component: 'NotificationRouter', requestId })
      
      log.debug({ 
        userId: ctx.session?.user?.id,
        sessionExists: !!ctx.session,
      }, 'Register token request started')
      
      // Validate session
      if (!ctx.session || !ctx.session.user || !ctx.session.user.id) {
        log.error({ session: ctx.session }, 'Invalid session')
        throw new Error('Invalid session: User not authenticated')
      }
      
      // Validate token
      if (!input.token || typeof input.token !== 'string' || input.token.trim().length === 0) {
        log.error({ tokenLength: input.token?.length }, 'Invalid token input')
        throw new Error('Invalid token: Token is required and must be a non-empty string')
      }

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
        
        if (existingToken) {
          const isSameUser = existingToken.userId === ctx.session.user.id
          log.debug({ 
            tokenId: existingToken.id,
            existingUserId: existingToken.userId,
            currentUserId: ctx.session.user.id,
            isSameUser,
          }, isSameUser ? 'Token exists for same user, will update' : 'Token exists for different user, will update ownership')
        } else {
          log.debug({}, 'No existing token found, will create new record')
        }

        // Upsert device token (user can have multiple devices)
        // This will update userId if token exists for different user
        const upsertStart = Date.now()
        
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
        
        const upsertDuration = Date.now() - upsertStart
        const totalDuration = Date.now() - startTime
        
        log.info({ 
          tokenId: result.id,
          userId: result.userId,
          userEmail: result.user.email,
          wasUpdated: !!existingToken,
          wasCreated: !existingToken,
          upsertDuration,
          totalDuration,
        }, 'Device token registered/updated successfully')

        return { success: true }
      } catch (error) {
        const duration = Date.now() - startTime
        
        log.error({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          userId: ctx.session?.user?.id,
          tokenLength: input.token?.length,
          duration,
        }, 'Error registering device token')
        
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

  // Register Web Push subscription
  registerWebPushToken: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string().min(1),
          auth: z.string().min(1),
        }),
        userAgent: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now()
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const log = createLogger({ component: 'NotificationRouter', requestId })
      
      log.debug({ 
        userId: ctx.session?.user?.id,
        endpoint: input.endpoint.substring(0, 50) + '...',
      }, 'Register Web Push token request started')
      
      // Validate session
      if (!ctx.session || !ctx.session.user || !ctx.session.user.id) {
        log.error({ session: ctx.session }, 'Invalid session')
        throw new Error('Invalid session: User not authenticated')
      }

      try {
        // Check if subscription already exists
        const existingSubscription = await prisma.webPushSubscription.findUnique({
          where: {
            endpoint: input.endpoint,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
        
        if (existingSubscription) {
          const isSameUser = existingSubscription.userId === ctx.session.user.id
          log.debug({ 
            subscriptionId: existingSubscription.id,
            existingUserId: existingSubscription.userId,
            currentUserId: ctx.session.user.id,
            isSameUser,
          }, isSameUser ? 'Web Push subscription exists for same user, will update' : 'Web Push subscription exists for different user, will update ownership')
        } else {
          log.debug({}, 'No existing Web Push subscription found, will create new record')
        }

        // Upsert Web Push subscription
        const upsertStart = Date.now()
        
        const result = await prisma.webPushSubscription.upsert({
          where: {
            endpoint: input.endpoint,
          },
          update: {
            userId: ctx.session.user.id, // Always update to current user
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            userAgent: input.userAgent || undefined, // Update userAgent if provided
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            endpoint: input.endpoint,
            p256dh: input.keys.p256dh,
            auth: input.keys.auth,
            userAgent: input.userAgent || null,
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
        
        const upsertDuration = Date.now() - upsertStart
        const totalDuration = Date.now() - startTime
        
        log.info({ 
          subscriptionId: result.id,
          userId: result.userId,
          userEmail: result.user.email,
          wasUpdated: !!existingSubscription,
          wasCreated: !existingSubscription,
          upsertDuration,
          totalDuration,
        }, 'Web Push subscription registered/updated successfully')

        return { success: true }
      } catch (error) {
        const duration = Date.now() - startTime
        
        log.error({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          userId: ctx.session?.user?.id,
          endpoint: input.endpoint?.substring(0, 50),
          duration,
        }, 'Error registering Web Push subscription')
        
        throw error
      }
    }),

  // Unregister Web Push subscription
  unregisterWebPushToken: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only delete if subscription belongs to current user
      await prisma.webPushSubscription.deleteMany({
        where: {
          endpoint: input.endpoint,
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
  data?: Record<string, string>,
  notificationType: NotificationType = 'task'
) {
  const notificationStart = Date.now()
  const log = createLogger({ component: 'sendNotificationToClass', kelas, notificationType })
  
  try {
    log.debug({ title, body }, 'Starting notification send')

    // Validate kelas parameter
    if (!kelas || typeof kelas !== 'string') {
      log.error({ kelas }, 'Invalid kelas parameter')
      throw new Error('Invalid kelas parameter')
    }

    // Trim and normalize kelas to ensure exact match
    const normalizedKelas = kelas.trim()

    // OPTIMIZATION: Get only device tokens (minimal select for speed)
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
        // Select user id (needed for filterTokensBySettings) and kelas (for validation)
        user: {
          select: {
            id: true, // Required for filterTokensBySettings
            kelas: true, // Needed for validation
          },
        },
      },
    })

    // Additional validation: filter out any tokens that don't match exactly
    const filteredTokens = deviceTokens.filter(dt => {
      const userKelas = dt.user.kelas?.trim()
      const matches = userKelas === normalizedKelas
      if (!matches) {
        log.warn({ 
          expectedKelas: normalizedKelas,
          actualKelas: userKelas,
        }, 'Filtered out token with mismatched kelas')
      }
      return matches
    })

    log.debug({ 
      totalFound: deviceTokens.length,
      afterFilter: filteredTokens.length,
    }, 'Found device tokens')

    if (filteredTokens.length === 0) {
      log.warn({ normalizedKelas }, 'No device tokens found for class')
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No device tokens found for this class',
      }
    }

    // Filter tokens based on user notification settings
    const tokensToSend = await filterTokensBySettings(filteredTokens, notificationType)
    
    if (tokensToSend.length === 0) {
      log.debug({}, 'No tokens to send after filtering by user settings')
      return {
        successCount: 0,
        failureCount: 0,
        message: 'No users eligible for notification based on their settings',
      }
    }

    log.debug({ 
      tokensToSend: tokensToSend.length,
      filteredFrom: filteredTokens.length,
    }, 'Sending notifications')
    
    // Send native push notifications (FCM)
    const nativeResult = await sendPushNotification(tokensToSend, title, body, data)
    
    // Also send Web Push notifications
    const webPushSubscriptions = await prisma.webPushSubscription.findMany({
      where: {
        user: {
          kelas: normalizedKelas,
          isAdmin: false,
        },
      },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
        userId: true,
      },
    })

    let webPushResult = { successCount: 0, failureCount: 0, expiredSubscriptions: [] as string[] }
    
    if (webPushSubscriptions.length > 0) {
      // Filter Web Push subscriptions by user settings
      const webPushTokensToSend = await filterTokensBySettings(
        webPushSubscriptions.map(sub => ({
          token: sub.endpoint,
          user: { id: sub.userId, kelas: normalizedKelas },
        })),
        notificationType
      )

      if (webPushTokensToSend.length > 0) {
        const subscriptionsToSend = webPushSubscriptions
          .filter(sub => webPushTokensToSend.includes(sub.endpoint))
          .map(sub => ({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }))

        webPushResult = await sendWebPushNotifications(subscriptionsToSend, title, body, data)

        // Delete expired subscriptions
        if (webPushResult.expiredSubscriptions.length > 0) {
          await prisma.webPushSubscription.deleteMany({
            where: {
              endpoint: {
                in: webPushResult.expiredSubscriptions,
              },
            },
          })
          log.info({ 
            deletedCount: webPushResult.expiredSubscriptions.length,
          }, 'Deleted expired Web Push subscriptions')
        }
      }
    }
    
    const totalDuration = Date.now() - notificationStart
    const totalSuccessCount = nativeResult.successCount + webPushResult.successCount
    const totalFailureCount = nativeResult.failureCount + webPushResult.failureCount
    
    log.info({ 
      nativeSuccess: nativeResult.successCount,
      nativeFailure: nativeResult.failureCount,
      webPushSuccess: webPushResult.successCount,
      webPushFailure: webPushResult.failureCount,
      totalSuccessCount,
      totalFailureCount,
      totalDuration,
    }, 'Notification send completed')

    return {
      successCount: totalSuccessCount,
      failureCount: totalFailureCount,
      nativeResult,
      webPushResult,
    }
  } catch (error) {
    const totalDuration = Date.now() - notificationStart
    log.error({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      totalDuration,
    }, 'Error sending notification to class')
    throw error
  }
}

