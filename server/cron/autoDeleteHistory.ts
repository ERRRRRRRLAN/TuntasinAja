import { prisma } from '@/lib/prisma'

/**
 * Auto-delete history entries older than the user's specified days
 * This should be run as a cron job (e.g., daily)
 */
export async function autoDeleteHistory() {
  try {
    console.log('[AutoDeleteHistory] Starting auto-delete history job...')
    
    // Get all users with auto-delete enabled (autoDeleteHistoryDays > 0)
    const usersWithAutoDelete = await prisma.userSettings.findMany({
      where: {
        autoDeleteHistoryDays: {
          not: null,
          gt: 0,
        },
      },
      select: {
        userId: true,
        autoDeleteHistoryDays: true,
      },
    })

    console.log(`[AutoDeleteHistory] Found ${usersWithAutoDelete.length} users with auto-delete enabled`)

    let totalDeleted = 0

    for (const userSetting of usersWithAutoDelete) {
      const days = userSetting.autoDeleteHistoryDays!
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      // Delete history entries older than cutoff date for this user
      const result = await prisma.history.deleteMany({
        where: {
          userId: userSetting.userId,
          completedDate: {
            lt: cutoffDate,
          },
        },
      })

      totalDeleted += result.count
      console.log(`[AutoDeleteHistory] Deleted ${result.count} history entries for user ${userSetting.userId} (older than ${days} days)`)
    }

    console.log(`[AutoDeleteHistory] ✅ Job completed. Total deleted: ${totalDeleted}`)
    return {
      success: true,
      usersProcessed: usersWithAutoDelete.length,
      totalDeleted,
    }
  } catch (error) {
    console.error('[AutoDeleteHistory] ❌ Error in auto-delete history job:', error)
    throw error
  }
}

