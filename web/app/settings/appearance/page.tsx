'use client'

/**
 * Appearance Settings Page
 * Theme, accent color, and display mode configuration
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme } from '@/lib/theme/theme-provider'
import { ColorPicker } from '@/components/ui/color-picker'
import { cn } from '@/lib/utils'

type AppearanceMode = 'light' | 'dark' | 'system'

const appearanceModes: { mode: AppearanceMode; label: string; icon: typeof Sun }[] = [
  { mode: 'system', label: 'System', icon: Monitor },
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
]

export default function AppearanceSettingsPage() {
  const { theme, setAppearanceMode, setAccentColor } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Auto-clear success message
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  const handleAppearanceChange = (mode: AppearanceMode) => {
    setAppearanceMode(mode)
    showSaveSuccess()
  }

  const handleAccentColorChange = (color: { h: number; s: number; l: number }) => {
    setAccentColor(color.h, color.s, color.l)
    showSaveSuccess()
  }

  const showSaveSuccess = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Appearance</h1>
          {(isSaving || saveSuccess) && (
            <span className="ml-auto text-sm text-accent">
              {isSaving ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Appearance Mode */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Theme</h2>
            <p className="text-sm text-text-secondary">
              Choose how GetZen looks on your device
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {appearanceModes.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleAppearanceChange(mode)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                  theme.appearanceMode === mode
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-surface hover:bg-surface-secondary'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    theme.appearanceMode === mode
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-secondary text-text-secondary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    theme.appearanceMode === mode
                      ? 'text-accent'
                      : 'text-text-secondary'
                  )}
                >
                  {label}
                </span>
                {theme.appearanceMode === mode && (
                  <Check className="w-4 h-4 text-accent" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Accent Color */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Accent Color</h2>
            <p className="text-sm text-text-secondary">
              Customize your interface color
            </p>
          </div>

          <div className="p-4 bg-surface rounded-lg border border-border">
            <ColorPicker
              value={{
                h: theme.accentHue,
                s: theme.accentSaturation,
                l: theme.accentLightness,
              }}
              onChange={handleAccentColorChange}
            />
          </div>
        </section>

        {/* Preview */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Preview</h2>
          <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold">k</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">GetZen Health</p>
                <p className="text-sm text-text-secondary">Your health companion</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium"
              >
                Primary Button
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-accent text-accent rounded-lg font-medium"
              >
                Secondary
              </button>
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-1 bg-recovery/10 text-recovery text-sm rounded">
                Recovery
              </span>
              <span className="px-2 py-1 bg-strain/10 text-strain text-sm rounded">
                Strain
              </span>
              <span className="px-2 py-1 bg-sleep/10 text-sleep text-sm rounded">
                Sleep
              </span>
              <span className="px-2 py-1 bg-heart/10 text-heart text-sm rounded">
                Heart
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
