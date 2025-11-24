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
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser')
      return
    }

    if (this.permission !== 'granted') {
      const newPermission = await this.requestPermission()
      if (newPermission !== 'granted') {
        console.warn('Notification permission denied')
        return
      }
    }

    // Show notification
    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: options?.tag || 'tuntasinaja-notification',
      requireInteraction: false,
      ...options,
    })

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Handle click
    notification.onclick = () => {
      window.focus()
      notification.close()
      if (options?.data?.url) {
        window.location.href = options.data.url
      }
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

