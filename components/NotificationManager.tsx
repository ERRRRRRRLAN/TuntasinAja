'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { notificationService } from '@/lib/notification-service'
import { trpc } from '@/lib/trpc'

export default function NotificationManager() {
  const { data: session } = useSession()
  const utils = trpc.useUtils()
  const notificationCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const lastNotificationCheck = useRef<Date | null>(null)
  const shownNotificationIds = useRef<Set<string>>(new Set())

  // Request notification permission on mount
  useEffect(() => {
    if (session && notificationService.isSupported()) {
      notificationService.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted')
        } else {
          console.warn('⚠️ Notification permission:', permission)
        }
      }).catch(console.error)
    }
  }, [session])

  // Use tRPC query hook for notifications
  const { data: notifications } = trpc.notification.getAll.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  })

  // Mutation for marking as read
  const markAsRead = trpc.notification.markAsRead.useMutation()

  // Check for new notifications and show browser notifications
  useEffect(() => {
    if (!session || !notifications) {
      return
    }

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    for (const notification of notifications) {
      if (!notification.isRead && !shownNotificationIds.current.has(notification.id)) {
        const notificationDate = new Date(notification.createdAt)
        
        // Only show notifications from the last 5 minutes that we haven't shown yet
        if (notificationDate > fiveMinutesAgo) {
          if (notification.type === 'new_thread' && notification.thread) {
            notificationService.showNewThreadNotification(
              notification.thread.title,
              notification.thread.author.name,
              notification.thread.id
            ).then(() => {
              shownNotificationIds.current.add(notification.id)
              // Mark as read after showing
              markAsRead.mutate({ id: notification.id })
            }).catch(console.error)
          } else if (notification.type === 'new_comment' && notification.comment && notification.thread) {
            notificationService.showNewCommentNotification(
              notification.thread.title,
              notification.comment.author.name,
              notification.thread.id
            ).then(() => {
              shownNotificationIds.current.add(notification.id)
              // Mark as read after showing
              markAsRead.mutate({ id: notification.id })
            }).catch(console.error)
          }
        }
      }
    }
  }, [session, notifications, markAsRead])

  // Get threads for daily reminder
  const { data: threads } = trpc.thread.getAll.useQuery(undefined, {
    enabled: !!session,
  })

  // Daily reminder - check once per day
  useEffect(() => {
    if (!session || !threads) {
      return
    }

    const checkDailyReminder = async () => {
      try {
        const now = new Date()
        const lastCheck = lastNotificationCheck.current

        // Check if we've already checked today
        if (lastCheck) {
          const lastCheckDate = new Date(lastCheck)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const lastCheckDay = new Date(
            lastCheckDate.getFullYear(),
            lastCheckDate.getMonth(),
            lastCheckDate.getDate()
          )

          if (lastCheckDay.getTime() === today.getTime()) {
            // Already checked today
            return
          }
        }

        // Count uncompleted threads (simplified - just count threads)
        // In a real scenario, you'd check UserStatus for each thread
        const uncompletedCount = threads.length

        // Show reminder at a specific time (e.g., 9 AM)
        const reminderHour = 9
        const currentHour = now.getHours()

        if (currentHour >= reminderHour) {
          await notificationService.showDailyReminder(uncompletedCount)
          lastNotificationCheck.current = now
        }
      } catch (error) {
        console.error('Error checking daily reminder:', error)
      }
    }

    // Check every hour
    const reminderInterval = setInterval(checkDailyReminder, 60 * 60 * 1000)
    checkDailyReminder() // Check immediately

    return () => {
      clearInterval(reminderInterval)
    }
  }, [session, threads])

  return null
}

