/**
 * Browser Notification Service
 * Handles browser notification permissions and displays notifications
 */

export class NotificationService {
  private static instance: NotificationService | null = null
  private permission: NotificationPermission = 'default'

  private constructor() {
    if (typeof window !== 'undefined') {
      this.permission = Notification.permission
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return 'denied'
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission()
    }

    return this.permission
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  /**
   * Check if permission is granted
   */
  hasPermission(): boolean {
    return this.permission === 'granted'
  }

  /**
   * Show a notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    console.log(`🔔 Attempting to show notification: ${title}`)
    
    if (!this.isSupported()) {
      console.warn('❌ Notifications are not supported in this browser')
      return
    }

    // Check current permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission
    }

    if (this.permission !== 'granted') {
      console.log(`⚠️ Permission is ${this.permission}, requesting...`)
      const newPermission = await this.requestPermission()
      if (newPermission !== 'granted') {
        console.warn(`❌ Notification permission denied: ${newPermission}`)
        console.warn('💡 User needs to allow notifications in browser settings')
        return
      }
      console.log('✅ Permission granted after request')
    }

    try {
      // Show notification
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: options?.tag || 'tuntasinaja-notification',
        requireInteraction: false,
        ...options,
      })

      console.log(`✅ Notification shown: ${title}`)

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle click
      notification.onclick = () => {
        console.log('👆 Notification clicked')
        window.focus()
        notification.close()
        if (options?.data?.url) {
          window.location.href = options.data.url
        }
      }

      // Handle errors
      notification.onerror = (error) => {
        console.error('❌ Notification error:', error)
      }
    } catch (error) {
      console.error('❌ Error creating notification:', error)
      throw error
    }
  }

  /**
   * Show daily reminder notification
   */
  async showDailyReminder(uncompletedCount: number): Promise<void> {
    const message =
      uncompletedCount === 0
        ? 'Semua tugas sudah selesai! 🎉'
        : `Anda memiliki ${uncompletedCount} tugas yang belum dikerjakan`

    await this.showNotification('Pengingat Tugas Harian', {
      body: message,
      tag: 'daily-reminder',
      data: {
        url: '/',
      },
    })
  }

  /**
   * Show new thread notification
   */
  async showNewThreadNotification(threadTitle: string, authorName: string, threadId: string): Promise<void> {
    await this.showNotification('PR Baru', {
      body: `${authorName} membuat PR baru: ${threadTitle}`,
      tag: `thread-${threadId}`,
      data: {
        url: `/?thread=${threadId}`,
      },
    })
  }

  /**
   * Show new comment notification
   */
  async showNewCommentNotification(threadTitle: string, authorName: string, threadId: string): Promise<void> {
    await this.showNotification('Sub Tugas Baru', {
      body: `${authorName} menambahkan sub tugas pada: ${threadTitle}`,
      tag: `comment-${threadId}`,
      data: {
        url: `/?thread=${threadId}`,
      },
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

