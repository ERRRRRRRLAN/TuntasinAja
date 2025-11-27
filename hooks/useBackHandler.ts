'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook untuk handle browser back button di mobile
 * @param isActive - apakah handler aktif
 * @param onBack - callback ketika back button ditekan
 */
export function useBackHandler(isActive: boolean, onBack: () => void) {
  const hasPushedState = useRef(false)
  const handlerId = useRef<string | null>(null)

  useEffect(() => {
    if (!isActive) {
      // Reset flag ketika tidak aktif
      if (hasPushedState.current && handlerId.current) {
        // Hanya remove listener, jangan cleanup history karena bisa trigger popstate
        hasPushedState.current = false
        handlerId.current = null
      }
      return
    }

    // Generate unique ID untuk handler ini
    if (!handlerId.current) {
      handlerId.current = `back-handler-${Date.now()}-${Math.random()}`
    }

    // Hanya push state sekali ketika dialog dibuka
    if (!hasPushedState.current) {
      // Push state untuk membuat history entry dengan unique ID
      window.history.pushState({ 
        modal: true, 
        handlerId: handlerId.current,
        timestamp: Date.now() 
      }, '')
      hasPushedState.current = true
    }

    const handlePopState = (event: PopStateEvent) => {
      // Hanya handle jika state kita yang di-pop
      const currentState = window.history.state
      if (hasPushedState.current && currentState?.handlerId === handlerId.current) {
        event.preventDefault()
        hasPushedState.current = false
        handlerId.current = null
        onBack()
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Jangan cleanup history di sini karena bisa trigger popstate
      // Biarkan dialog yang handle cleanup sendiri
      hasPushedState.current = false
      handlerId.current = null
    }
  }, [isActive, onBack])
}

