'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [theme, setThemeState] = useState<Theme>('auto')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')
  
  // Get user settings (for theme and animations)
  const { data: settings, error: settingsError } = trpc.userSettings.get.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on error to prevent infinite loops
    onError: (error) => {
      // Silently handle errors - use default theme if settings can't be loaded
      console.warn('[ThemeProvider] Failed to load user settings:', error)
    },
  })

  // Update mutation
  const updateSettings = trpc.userSettings.update.useMutation({
    onError: (error) => {
      // Silently handle errors - theme change will still work locally
      console.warn('[ThemeProvider] Failed to update theme setting:', error)
    },
  })

  // Initialize theme from settings
  useEffect(() => {
    if (settings?.theme) {
      setThemeState(settings.theme as Theme)
    }
  }, [settings?.theme])

  // Calculate effective theme based on user preference and system preference
  useEffect(() => {
    const calculateEffectiveTheme = () => {
      if (theme === 'auto') {
        // Check system preference
        if (typeof window !== 'undefined') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          setEffectiveTheme(prefersDark ? 'dark' : 'light')
        } else {
          setEffectiveTheme('light')
        }
      } else {
        setEffectiveTheme(theme)
      }
    }

    calculateEffectiveTheme()

    // Listen for system theme changes
    if (theme === 'auto' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Apply theme and animations to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (effectiveTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      
      // Apply animations setting
      if (settings?.animationsEnabled === false) {
        root.classList.add('no-animations')
      } else {
        root.classList.remove('no-animations')
      }
    }
  }, [effectiveTheme, settings?.animationsEnabled])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    if (session) {
      updateSettings.mutate({ theme: newTheme })
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

