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

    // Use filtered tokens only
    const tokens = filteredTokens.map((dt: { token: string }) => dt.token)
    console.log('[sendNotificationToClass] Sending to', tokens.length, 'devices')
    const result = await sendPushNotification(tokens, title, body, data)
    
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

