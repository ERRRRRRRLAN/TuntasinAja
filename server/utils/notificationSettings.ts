import { prisma } from '@/lib/prisma'

export type NotificationType = 
  | 'task'           // New task/thread created
  | 'comment'        // New comment/sub-task created
  | 'announcement'   // New announcement
  | 'deadline'       // Deadline reminder
  | 'schedule'       // Schedule reminder
  | 'overdue'        // Overdue task reminder

/**
 * Check if user should receive notification based on their settings
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    // Get user settings (with defaults if not exists)
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    // If no settings, use defaults (all enabled)
    if (!settings) {
      return true
    }

    // Check if push notifications are enabled globally
    if (!settings.pushNotificationsEnabled) {
      console.log(`[shouldSendNotification] Push notifications disabled for user ${userId}`)
      return false
    }

    // Check notification type specific settings
    switch (notificationType) {
      case 'task':
        if (!settings.taskNotificationsEnabled) {
          console.log(`[shouldSendNotification] Task notifications disabled for user ${userId}`)
          return false
        }
        break
      
      case 'comment':
        if (!settings.commentNotificationsEnabled) {
          console.log(`[shouldSendNotification] Comment notifications disabled for user ${userId}`)
          return false
        }
        break
      
      case 'announcement':
        if (!settings.announcementNotificationsEnabled) {
          console.log(`[shouldSendNotification] Announcement notifications disabled for user ${userId}`)
          return false
        }
        break
      
      case 'deadline':
        if (!settings.deadlineReminderEnabled) {
          console.log(`[shouldSendNotification] Deadline reminders disabled for user ${userId}`)
          return false
        }
        break
      
      case 'schedule':
        if (!settings.scheduleReminderEnabled) {
          console.log(`[shouldSendNotification] Schedule reminders disabled for user ${userId}`)
          return false
        }
        break
      
      case 'overdue':
        if (!settings.overdueReminderEnabled) {
          console.log(`[shouldSendNotification] Overdue reminders disabled for user ${userId}`)
          return false
        }
        break
    }

    // Check Do Not Disturb
    if (settings.dndEnabled && settings.dndStartTime && settings.dndEndTime) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      const startTime = settings.dndStartTime
      const endTime = settings.dndEndTime
      
      // Handle DND that spans midnight (e.g., 22:00 - 07:00)
      const isInDNDPeriod = (() => {
        if (startTime > endTime) {
          // DND spans midnight
          return currentTime >= startTime || currentTime <= endTime
        } else {
          // DND within same day
          return currentTime >= startTime && currentTime <= endTime
        }
      })()

      if (isInDNDPeriod) {
        console.log(`[shouldSendNotification] User ${userId} is in Do Not Disturb period (${startTime} - ${endTime}), current time: ${currentTime}`)
        return false
      }
    }

    return true
  } catch (error) {
    console.error(`[shouldSendNotification] Error checking settings for user ${userId}:`, error)
    // On error, default to allowing notification (fail open)
    return true
  }
}

/**
 * Filter device tokens based on user notification settings
 */
export async function filterTokensBySettings(
  tokens: Array<{ token: string; user: { id: string } }>,
  notificationType: NotificationType
): Promise<string[]> {
  const filteredTokens: string[] = []

  for (const item of tokens) {
    const shouldSend = await shouldSendNotification(item.user.id, notificationType)
    if (shouldSend) {
      filteredTokens.push(item.token)
    } else {
      console.log(`[filterTokensBySettings] Filtered out token for user ${item.user.id} (notification type: ${notificationType})`)
    }
  }

  return filteredTokens
}

