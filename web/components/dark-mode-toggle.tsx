'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme/theme-provider'
import { cn } from '@/lib/utils'

export function DarkModeToggle() {
  const { theme, setAppearanceMode, resolvedMode } = useTheme()

  const modes: Array<{ mode: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }> = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { mode: 'system', label: 'System', icon: <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">◐</div> },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-lg border border-border">
      {modes.map((item) => (
        <button
          key={item.mode}
          onClick={() => setAppearanceMode(item.mode)}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded transition-colors text-sm font-medium',
            theme.appearanceMode === item.mode
              ? 'bg-accent text-accent-foreground'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          )}
          title={`Switch to ${item.label} mode`}
        >
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
