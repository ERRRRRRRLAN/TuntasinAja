'use client'

import { useState, useCallback, useEffect } from 'react'
import NotificationPopup, { NotificationType } from './NotificationPopup'

interface NotificationItem {
  id: string
  message: string
  type: NotificationType
  duration?: number
  timestamp: number
}

let notificationIdCounter = 0
const notificationListeners: Array<(notification: NotificationItem | null) => void> = []
let notificationQueue: NotificationItem[] = []
let currentNotification: NotificationItem | null = null

// Spam prevention: track recent notifications
const recentNotifications: Map<string, number> = new Map()
const DEBOUNCE_TIME = 1000 // 1 second debounce for same message
const MAX_QUEUE_SIZE = 10 // Maximum queue size to prevent memory issues

const notifyListeners = () => {
  notificationListeners.forEach(listener => listener(currentNotification))
}

const showNextNotification = () => {
  if (notificationQueue.length > 0) {
    currentNotification = notificationQueue.shift() || null
  } else {
    currentNotification = null
  }
  notifyListeners()
}

// Check if notification should be throttled (spam prevention)
const shouldThrottle = (message: string, type: NotificationType): boolean => {
  const key = `${type}:${message}`
  const now = Date.now()
  const lastShown = recentNotifications.get(key)
  
  if (lastShown && (now - lastShown) < DEBOUNCE_TIME) {
    return true // Throttle: same notification shown too recently
  }
  
  // Update timestamp
  recentNotifications.set(key, now)
  
  // Clean up old entries (older than 5 seconds)
  for (const [k, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > 5000) {
      recentNotifications.delete(k)
    }
  }
  
  return false
}

// Merge duplicate notifications in queue
const mergeDuplicateInQueue = (notification: NotificationItem) => {
  const existingIndex = notificationQueue.findIndex(
    n => n.message === notification.message && n.type === notification.type
  )
  
  if (existingIndex !== -1) {
    // Replace existing with new one (to update timestamp)
    notificationQueue[existingIndex] = notification
    return true
  }
  
  return false
}

export const toast = {
  success: (message: string, duration?: number) => {
    // Spam prevention: throttle duplicate notifications
    if (shouldThrottle(message, 'success')) {
      return
    }
    
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { 
      id, 
      message, 
      type: 'success', 
      duration,
      timestamp: Date.now()
    }
    
    // If there's already a notification showing, queue this one
    if (currentNotification) {
      // Try to merge duplicate in queue first
      if (!mergeDuplicateInQueue(notification)) {
        // Prevent queue overflow
        if (notificationQueue.length >= MAX_QUEUE_SIZE) {
          // Remove oldest notification from queue
          notificationQueue.shift()
        }
      notificationQueue.push(notification)
      }
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
  error: (message: string, duration?: number) => {
    // Don't throttle errors - they're important
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { 
      id, 
      message, 
      type: 'error', 
      duration,
      timestamp: Date.now()
    }
    
    if (currentNotification) {
      if (!mergeDuplicateInQueue(notification)) {
        if (notificationQueue.length >= MAX_QUEUE_SIZE) {
          notificationQueue.shift()
        }
      notificationQueue.push(notification)
      }
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
  warning: (message: string, duration?: number) => {
    if (shouldThrottle(message, 'warning')) {
      return
    }
    
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { 
      id, 
      message, 
      type: 'warning', 
      duration,
      timestamp: Date.now()
    }
    
    if (currentNotification) {
      if (!mergeDuplicateInQueue(notification)) {
        if (notificationQueue.length >= MAX_QUEUE_SIZE) {
          notificationQueue.shift()
        }
      notificationQueue.push(notification)
      }
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
  info: (message: string, duration?: number) => {
    if (shouldThrottle(message, 'info')) {
      return
    }
    
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { 
      id, 
      message, 
      type: 'info', 
      duration,
      timestamp: Date.now()
    }
    
    if (currentNotification) {
      if (!mergeDuplicateInQueue(notification)) {
        if (notificationQueue.length >= MAX_QUEUE_SIZE) {
          notificationQueue.shift()
        }
      notificationQueue.push(notification)
      }
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
}

export default function ToastContainer() {
  const [notification, setNotification] = useState<NotificationItem | null>(null)

  useEffect(() => {
    const listener = (notification: NotificationItem | null) => {
      setNotification(notification)
    }
    notificationListeners.push(listener)
    setNotification(currentNotification)

    return () => {
      const index = notificationListeners.indexOf(listener)
      if (index > -1) {
        notificationListeners.splice(index, 1)
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    showNextNotification()
  }, [])

  return (
    <>
      {notification && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={handleClose}
        />
      )}
    </>
  )
}

