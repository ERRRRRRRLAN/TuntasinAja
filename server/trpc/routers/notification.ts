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
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      console.log('')
      console.log('='.repeat(80))
      console.log(`[NotificationRouter] [${requestId}] ========== REGISTER TOKEN START ==========`)
      console.log('='.repeat(80))
      console.log(`[NotificationRouter] [${requestId}] Timestamp: ${new Date().toISOString()}`)
      console.log(`[NotificationRouter] [${requestId}] Request ID: ${requestId}`)
      
      // Log session details
      console.log(`[NotificationRouter] [${requestId}] Session Info:`, {
        userId: ctx.session?.user?.id || 'MISSING',
        userName: ctx.session?.user?.name || 'MISSING',
        userEmail: ctx.session?.user?.email || 'MISSING',
        sessionExists: !!ctx.session,
        userExists: !!ctx.session?.user,
      })
      
      // Validate session
      if (!ctx.session || !ctx.session.user || !ctx.session.user.id) {
        console.error(`[NotificationRouter] [${requestId}] ❌ INVALID SESSION!`)
        console.error(`[NotificationRouter] [${requestId}] Session object:`, JSON.stringify(ctx.session, null, 2))
        throw new Error('Invalid session: User not authenticated')
      }
      
      // Log input details
      console.log(`[NotificationRouter] [${requestId}] Input Token Info:`, {
        tokenLength: input.token?.length || 0,
        tokenIsString: typeof input.token === 'string',
        tokenIsEmpty: !input.token || input.token.trim().length === 0,
        tokenPrefix: input.token ? input.token.substring(0, 30) + '...' : 'NULL',
        tokenSuffix: input.token && input.token.length > 10 ? '...' + input.token.substring(input.token.length - 10) : 'TOO_SHORT',
        deviceInfo: input.deviceInfo || 'NOT_PROVIDED',
      })
      
      // Validate token
      if (!input.token || typeof input.token !== 'string' || input.token.trim().length === 0) {
        console.error(`[NotificationRouter] [${requestId}] ❌ INVALID TOKEN INPUT!`)
        console.error(`[NotificationRouter] [${requestId}] Token value:`, input.token)
        throw new Error('Invalid token: Token is required and must be a non-empty string')
      }

      try {
        console.log(`[NotificationRouter] [${requestId}] Step 1: Checking database connection...`)
        const dbCheckStart = Date.now()
        
        // Check if token already exists with different user
        console.log(`[NotificationRouter] [${requestId}] Step 2: Querying existing token from database...`)
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
        
        const dbCheckDuration = Date.now() - dbCheckStart
        console.log(`[NotificationRouter] [${requestId}] Database query completed in ${dbCheckDuration}ms`)
        
        if (existingToken) {
          console.log(`[NotificationRouter] [${requestId}] Existing token found:`, {
            tokenId: existingToken.id,
            existingUserId: existingToken.userId,
            existingUserName: existingToken.user.name,
            existingUserEmail: existingToken.user.email,
            existingUserKelas: existingToken.user.kelas,
            currentUserId: ctx.session.user.id,
            currentUserName: ctx.session.user.name,
            isSameUser: existingToken.userId === ctx.session.user.id,
            createdAt: existingToken.createdAt,
            updatedAt: existingToken.updatedAt,
          })
          
          if (existingToken.userId !== ctx.session.user.id) {
            console.log(`[NotificationRouter] [${requestId}] 🔄 Token exists for DIFFERENT user, will update ownership`)
          } else {
            console.log(`[NotificationRouter] [${requestId}] ✅ Token exists for SAME user, will update metadata`)
          }
        } else {
          console.log(`[NotificationRouter] [${requestId}] ✅ No existing token found, will create new record`)
        }

        // Upsert device token (user can have multiple devices)
        // This will update userId if token exists for different user
        console.log(`[NotificationRouter] [${requestId}] Step 3: Upserting device token to database...`)
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
        
        console.log('')
        console.log('='.repeat(80))
        console.log(`[NotificationRouter] [${requestId}] ✅ DEVICE TOKEN REGISTERED/UPDATED SUCCESSFULLY`)
        console.log('='.repeat(80))
        console.log(`[NotificationRouter] [${requestId}] Result Details:`, {
          tokenId: result.id,
          userId: result.userId,
          userName: result.user.name,
          userEmail: result.user.email,
          userKelas: result.user.kelas || 'NULL',
          deviceInfo: result.deviceInfo || 'NULL',
          wasUpdated: !!existingToken,
          wasCreated: !existingToken,
          previousUserId: existingToken?.userId || 'N/A',
          previousUserName: existingToken?.user.name || 'N/A',
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          upsertDuration: `${upsertDuration}ms`,
          totalDuration: `${totalDuration}ms`,
        })
        
        // Verify the record was actually saved
        console.log(`[NotificationRouter] [${requestId}] Step 4: Verifying saved record...`)
        const verifyStart = Date.now()
        const verifyRecord = await prisma.deviceToken.findUnique({
          where: { token: input.token },
          include: { user: { select: { id: true, name: true, email: true, kelas: true } } }
        })
        const verifyDuration = Date.now() - verifyStart
        
        if (verifyRecord) {
          console.log(`[NotificationRouter] [${requestId}] ✅ Verification successful:`, {
            verified: true,
            verifiedUserId: verifyRecord.userId,
            verifiedUserName: verifyRecord.user.name,
            matchesRequest: verifyRecord.userId === ctx.session.user.id,
            verifyDuration: `${verifyDuration}ms`,
          })
        } else {
          console.error(`[NotificationRouter] [${requestId}] ❌ VERIFICATION FAILED: Record not found after upsert!`)
        }
        
        console.log(`[NotificationRouter] [${requestId}] ========== REGISTER TOKEN SUCCESS ==========`)
        console.log('='.repeat(80))
        console.log('')

        return { success: true }
      } catch (error) {
        const duration = Date.now() - startTime
        
        console.error('')
        console.error('='.repeat(80))
        console.error(`[NotificationRouter] [${requestId}] ❌ ========== REGISTER TOKEN ERROR ==========`)
        console.error('='.repeat(80))
        console.error(`[NotificationRouter] [${requestId}] Error Details:`, {
          requestId,
          errorType: typeof error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorString: String(error),
          errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        })
        console.error(`[NotificationRouter] [${requestId}] Context:`, {
          userId: ctx.session?.user?.id || 'MISSING',
          userName: ctx.session?.user?.name || 'MISSING',
          userEmail: ctx.session?.user?.email || 'MISSING',
          tokenLength: input.token?.length || 0,
          tokenPrefix: input.token ? input.token.substring(0, 30) + '...' : 'NULL',
          deviceInfo: input.deviceInfo || 'NOT_PROVIDED',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        })
        console.error(`[NotificationRouter] [${requestId}] ========== REGISTER TOKEN ERROR END ==========`)
        console.error('='.repeat(80))
        console.error('')
        
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

