'use client'

import { useState, useCallback, useEffect } from 'react'
import NotificationPopup, { NotificationType } from './NotificationPopup'

interface NotificationItem {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

let notificationIdCounter = 0
const notificationListeners: Array<(notification: NotificationItem | null) => void> = []
let notificationQueue: NotificationItem[] = []
let currentNotification: NotificationItem | null = null

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

export const toast = {
  success: (message: string, duration?: number) => {
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { id, message, type: 'success', duration }
    
    // If there's already a notification showing, queue this one
    if (currentNotification) {
      notificationQueue.push(notification)
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
  error: (message: string, duration?: number) => {
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { id, message, type: 'error', duration }
    
    if (currentNotification) {
      notificationQueue.push(notification)
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
  warning: (message: string, duration?: number) => {
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { id, message, type: 'warning', duration }
    
    if (currentNotification) {
      notificationQueue.push(notification)
    } else {
      currentNotification = notification
      notifyListeners()
    }
  },
  info: (message: string, duration?: number) => {
    const id = `notification-${++notificationIdCounter}`
    const notification: NotificationItem = { id, message, type: 'info', duration }
    
    if (currentNotification) {
      notificationQueue.push(notification)
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

