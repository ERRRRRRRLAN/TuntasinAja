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
      console.log('🔔 Requesting notification permission...')
      notificationService.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted')
        } else {
          console.warn('⚠️ Notification permission:', permission)
          console.warn('💡 User needs to allow notifications in browser settings')
        }
      }).catch((error) => {
        console.error('❌ Error requesting notification permission:', error)
      })
    } else if (session && !notificationService.isSupported()) {
      console.warn('⚠️ Browser does not support notifications')
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
    if (!session) {
      return
    }

    if (!notifications) {
      console.log('📭 No notifications data yet')
      return
    }

    console.log(`📬 Checking ${notifications.length} notifications...`)

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    let unreadCount = 0
    let shownCount = 0

    for (const notification of notifications) {
      if (!notification.isRead) {
        unreadCount++
        
        if (!shownNotificationIds.current.has(notification.id)) {
          const notificationDate = new Date(notification.createdAt)
          
          // Only show notifications from the last 5 minutes that we haven't shown yet
          if (notificationDate > fiveMinutesAgo) {
            console.log(`🔔 Showing notification: ${notification.type} - ${notification.title}`)
            
            if (notification.type === 'new_thread' && notification.thread) {
              notificationService.showNewThreadNotification(
                notification.thread.title,
                notification.thread.author.name,
                notification.thread.id
              ).then(() => {
                console.log(`✅ Shown thread notification: ${notification.id}`)
                shownNotificationIds.current.add(notification.id)
                // Mark as read after showing
                markAsRead.mutate({ id: notification.id })
                shownCount++
              }).catch((error) => {
                console.error('❌ Error showing thread notification:', error)
              })
            } else if (notification.type === 'new_comment' && notification.comment && notification.thread) {
              notificationService.showNewCommentNotification(
                notification.thread.title,
                notification.comment.author.name,
                notification.thread.id
              ).then(() => {
                console.log(`✅ Shown comment notification: ${notification.id}`)
                shownNotificationIds.current.add(notification.id)
                // Mark as read after showing
                markAsRead.mutate({ id: notification.id })
                shownCount++
              }).catch((error) => {
                console.error('❌ Error showing comment notification:', error)
              })
            }
          } else {
            console.log(`⏰ Notification ${notification.id} is too old (${Math.round((now.getTime() - notificationDate.getTime()) / 60000)} minutes ago)`)
          }
        } else {
          console.log(`👁️ Notification ${notification.id} already shown`)
        }
      }
    }

    if (unreadCount > 0) {
      console.log(`📊 Found ${unreadCount} unread notifications, showing ${shownCount}`)
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

