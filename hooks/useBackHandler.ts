'use client'

import { useEffect, useRef, useState } from 'react'
// Capacitor will be loaded dynamically to avoid initialization errors
import { useBackButton } from './useBackButton'

/**
 * Hook untuk handle browser back button di mobile dan hardware back button di Android
 * @param isActive - apakah handler aktif
 * @param onBack - callback ketika back button ditekan
 */
export function useBackHandler(isActive: boolean, onBack: () => void) {
  const hasPushedState = useRef(false)
  const handlerId = useRef<string | null>(null)
  const [isNativePlatform, setIsNativePlatform] = useState(false)

  // Check if native platform (lazy load Capacitor)
  useEffect(() => {
    const checkNativePlatform = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        setIsNativePlatform(Capacitor.isNativePlatform())
      } catch (error) {
        // Silently fail - not native platform
        setIsNativePlatform(false)
      }
    }
    checkNativePlatform()
  }, [])

  // Use the new useBackButton hook for native platforms
  useBackButton(isActive && isNativePlatform, () => {
    if (isActive) {
      onBack()
      return true // Prevent default behavior
    }
    return false
  })

  // Setup untuk web browser - popstate event
  useEffect(() => {
    if (isNativePlatform) {
      // Native platform handled by useBackButton
      return
    }

    if (!isActive) {
      // Reset flag ketika tidak aktif
      if (hasPushedState.current && handlerId.current) {
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
      // Reset flags
      hasPushedState.current = false
      handlerId.current = null
    }
  }, [isActive, onBack])
}

