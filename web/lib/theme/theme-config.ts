/**
 * Theme Configuration Types and Defaults
 */

import { accentPresets } from './colors'

export type AppearanceMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  appearanceMode: AppearanceMode
  accentHue: number
  accentSaturation: number
  accentLightness: number
}

export const defaultThemeConfig: ThemeConfig = {
  appearanceMode: 'system',
  accentHue: accentPresets[0].h,      // Purple
  accentSaturation: accentPresets[0].s,
  accentLightness: accentPresets[0].l,
}

export interface WidgetConfig {
  id: string
  visible: boolean
  order: number
}

export interface UserPreferences {
  theme: ThemeConfig
  widgets: WidgetConfig[]
}

export const defaultUserPreferences: UserPreferences = {
  theme: defaultThemeConfig,
  widgets: [],
}

// Storage keys
export const STORAGE_KEYS = {
  theme: 'quarks-theme',
  widgets: 'quarks-widgets',
  preferences: 'quarks-preferences',
} as const
