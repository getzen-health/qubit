'use client'

/**
 * Theme Provider
 * Manages theme state and applies CSS variables.
 * Persists to both localStorage (fast, no-flash) and Supabase (cross-device sync).
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  type ThemeConfig,
  type AppearanceMode,
  defaultThemeConfig,
  STORAGE_KEYS,
} from './theme-config'
import { createClient } from '@/lib/supabase/client'
import { syncThemeFromServer, saveThemeToServer } from '@/lib/theme'

interface ThemeContextValue {
  theme: ThemeConfig
  resolvedMode: 'light' | 'dark'
  setAppearanceMode: (mode: AppearanceMode) => void
  setAccentColor: (h: number, s: number, l: number) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: ThemeConfig
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(
    defaultTheme ?? defaultThemeConfig
  )
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light')

  // Load theme from localStorage on mount (fast — avoids flash)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.theme)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ThemeConfig
        setTheme(parsed)
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save theme to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme))
  }, [theme])

  // Sync theme from Supabase when the user's auth session is available.
  // If the server value differs from localStorage, apply and persist it locally.
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return
      try {
        const serverMode = await syncThemeFromServer(supabase, session.user.id)
        setTheme((prev) => {
          if (prev.appearanceMode === serverMode) return prev
          const updated = { ...prev, appearanceMode: serverMode }
          localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(updated))
          return updated
        })
      } catch {
        // Non-critical — fall back to locally stored theme
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Resolve system preference
  useEffect(() => {
    const updateResolvedMode = () => {
      if (theme.appearanceMode === 'system') {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
        setResolvedMode(prefersDark ? 'dark' : 'light')
      } else {
        setResolvedMode(theme.appearanceMode)
      }
    }

    updateResolvedMode()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateResolvedMode)
    return () => mediaQuery.removeEventListener('change', updateResolvedMode)
  }, [theme.appearanceMode])

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement

    // Accent color
    root.style.setProperty('--accent-h', String(theme.accentHue))
    root.style.setProperty('--accent-s', `${theme.accentSaturation}%`)
    root.style.setProperty('--accent-l', `${theme.accentLightness}%`)

    // Dark mode class
    if (resolvedMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, resolvedMode])

  const setAppearanceMode = useCallback((mode: AppearanceMode) => {
    setTheme((prev) => ({ ...prev, appearanceMode: mode }))
    // Fire-and-forget save to Supabase
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        saveThemeToServer(supabase, data.user.id, mode).catch(() => {})
      }
    })
  }, [])

  const setAccentColor = useCallback((h: number, s: number, l: number) => {
    setTheme((prev) => ({
      ...prev,
      accentHue: h,
      accentSaturation: s,
      accentLightness: l,
    }))
  }, [])

  const resetTheme = useCallback(() => {
    setTheme(defaultThemeConfig)
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedMode,
        setAppearanceMode,
        setAccentColor,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
