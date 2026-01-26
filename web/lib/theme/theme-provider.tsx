'use client'

/**
 * Theme Provider
 * Manages theme state and applies CSS variables
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

  // Load theme from storage on mount
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

  // Save theme to storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme))
  }, [theme])

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
