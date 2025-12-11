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

const THEME_STORAGE_KEY = 'tuntasin-theme'

// Get initial theme from localStorage (runs on client only)
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'auto'
  
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved
    }
  } catch (e) {
    console.error('Error reading theme from localStorage:', e)
  }
  
  return 'auto'
}

// Calculate effective theme (light or dark)
function calculateEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'auto') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  
  // Initialize theme from localStorage immediately (before database load)
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => 
    calculateEffectiveTheme(getInitialTheme())
  )
  
  // Get user settings (for theme and animations)
  const { data: settings } = trpc.userSettings.get.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
  })

  // Update mutation
  const updateSettings = trpc.userSettings.update.useMutation()

  // Always use 'auto' theme - follow device theme
  // No need to sync from database since we always use auto
  useEffect(() => {
    // Force theme to 'auto' if it's not already
    if (theme !== 'auto') {
      setThemeState('auto')
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'auto')
      } catch (e) {
        console.error('Error saving theme to localStorage:', e)
      }
    }
  }, [theme])

  // Calculate effective theme based on user preference and system preference
  useEffect(() => {
    const newEffectiveTheme = calculateEffectiveTheme(theme)
    setEffectiveTheme(newEffectiveTheme)

    // Listen for system theme changes (only if auto mode)
    if (theme === 'auto' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  // Apply theme to document with smooth transition
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      // Add transition class for smooth color changes
      root.classList.add('theme-transition')
      
      // Apply theme
      if (effectiveTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      
      // Remove transition class after transition completes (prevents initial flash)
      const timeout = setTimeout(() => {
        root.classList.remove('theme-transition')
      }, 300)
      
      // Apply animations setting
      if (settings?.animationsEnabled === false) {
        root.classList.add('no-animations')
      } else {
        root.classList.remove('no-animations')
      }
      
      return () => clearTimeout(timeout)
    }
  }, [effectiveTheme, settings?.animationsEnabled])

  const setTheme = (newTheme: Theme) => {
    // Always use 'auto' theme - ignore manual changes
    // Theme will always follow device preference
    setThemeState('auto')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'auto')
    } catch (e) {
      console.error('Error saving theme to localStorage:', e)
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

