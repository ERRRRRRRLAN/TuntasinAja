'use client'

import { useState, useCallback, useEffect } from 'react'
import Toast, { ToastType } from './Toast'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let toastIdCounter = 0
const toastListeners: Array<(toasts: ToastItem[]) => void> = []
let toasts: ToastItem[] = []

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]))
}

export const toast = {
  success: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`
    toasts.push({ id, message, type: 'success', duration })
    notifyListeners()
  },
  error: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`
    toasts.push({ id, message, type: 'error', duration })
    notifyListeners()
  },
  warning: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`
    toasts.push({ id, message, type: 'warning', duration })
    notifyListeners()
  },
  info: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`
    toasts.push({ id, message, type: 'info', duration })
    notifyListeners()
  },
}

export default function ToastContainer() {
  const [toastList, setToastList] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => {
      setToastList(newToasts)
    }
    toastListeners.push(listener)
    setToastList([...toasts])

    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) {
        toastListeners.splice(index, 1)
      }
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    notifyListeners()
  }, [])

  return (
    <div className="toast-container">
      {toastList.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

