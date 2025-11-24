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

  // Request notification permission on mount
  useEffect(() => {
    if (session && notificationService.isSupported()) {
      notificationService.requestPermission().catch(console.error)
    }
  }, [session])

  // Check for new notifications periodically
  useEffect(() => {
    if (!session) {
      return
    }

    // Track which notifications we've already shown
    const shownNotificationIds = new Set<string>()

    // Check for unread notifications every 30 seconds
    const checkNotifications = async () => {
      try {
        const notifications = await utils.client.notification.getAll.query()

        // Show browser notifications for unread notifications that we haven't shown yet
        const now = new Date()
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

        for (const notification of notifications) {
          if (!notification.isRead && !shownNotificationIds.has(notification.id)) {
            const notificationDate = new Date(notification.createdAt)
            
            // Only show notifications from the last 5 minutes that we haven't shown yet
            if (notificationDate > fiveMinutesAgo) {
              if (notification.type === 'new_thread' && notification.thread) {
                await notificationService.showNewThreadNotification(
                  notification.thread.title,
                  notification.thread.author.name,
                  notification.thread.id
                )
                shownNotificationIds.add(notification.id)
                // Mark as read after showing
                await utils.client.notification.markAsRead.mutate({ id: notification.id })
              } else if (notification.type === 'new_comment' && notification.comment && notification.thread) {
                await notificationService.showNewCommentNotification(
                  notification.thread.title,
                  notification.comment.author.name,
                  notification.thread.id
                )
                shownNotificationIds.add(notification.id)
                // Mark as read after showing
                await utils.client.notification.markAsRead.mutate({ id: notification.id })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking notifications:', error)
      }
    }

    // Check immediately, then every 30 seconds
    checkNotifications()
    notificationCheckInterval.current = setInterval(checkNotifications, 30000)

    return () => {
      if (notificationCheckInterval.current) {
        clearInterval(notificationCheckInterval.current)
      }
    }
  }, [session, utils])

  // Daily reminder - check once per day
  useEffect(() => {
    if (!session) {
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

        // Get uncompleted tasks count
        const threads = await utils.client.thread.getAll.query()
        
        // Count uncompleted threads by checking UserStatus
        let uncompletedCount = 0
        for (const thread of threads) {
          // Check if user has completed this thread
          const statuses = await utils.client.userStatus.getThreadStatuses.query({ threadId: thread.id })
          const threadStatus = statuses.find(s => s.threadId === thread.id)
          
          if (!threadStatus || !threadStatus.isCompleted) {
            uncompletedCount++
          }
        }

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
  }, [session, utils])

  return null
}

