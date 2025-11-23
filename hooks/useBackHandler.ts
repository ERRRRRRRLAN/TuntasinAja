'use client'

import { useEffect } from 'react'

/**
 * Hook untuk handle browser back button di mobile
 * @param isActive - apakah handler aktif
 * @param onBack - callback ketika back button ditekan
 */
export function useBackHandler(isActive: boolean, onBack: () => void) {
  useEffect(() => {
    if (!isActive) return

    // Push state untuk membuat history entry
    window.history.pushState({ modal: true }, '')

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      onBack()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Cleanup: remove history entry jika masih ada
      if (window.history.state?.modal) {
        window.history.back()
      }
    }
  }, [isActive, onBack])
}

