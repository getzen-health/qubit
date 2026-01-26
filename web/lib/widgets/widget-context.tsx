'use client'

/**
 * Widget Context
 * Manages widget visibility and ordering state
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  type WidgetConfig,
  type WidgetSize,
  getDefaultWidgetConfig,
  mergeWidgetConfigs,
  getEnabledWidgets,
  widgetRegistry,
} from './widget-registry'

interface WidgetContextValue {
  /** All widget configurations */
  widgetConfigs: WidgetConfig[]
  /** Get enabled widgets sorted by order */
  enabledWidgets: ReturnType<typeof getEnabledWidgets>
  /** Toggle widget visibility */
  toggleWidget: (id: string) => void
  /** Set widget enabled state */
  setWidgetEnabled: (id: string, enabled: boolean) => void
  /** Reorder widgets */
  reorderWidgets: (startIndex: number, endIndex: number) => void
  /** Set widget size */
  setWidgetSize: (id: string, size: WidgetSize) => void
  /** Reset to defaults */
  resetToDefaults: () => void
  /** Check if widget is enabled */
  isWidgetEnabled: (id: string) => boolean
  /** Loading state */
  isLoading: boolean
  /** Save state */
  isSaving: boolean
  /** Save error */
  error: string | null
}

const WidgetContext = createContext<WidgetContextValue | null>(null)

const STORAGE_KEY = 'quarks-widget-config'

interface WidgetProviderProps {
  children: ReactNode
  /** Initial config from server/database */
  initialConfig?: Partial<WidgetConfig>[]
  /** Callback when config changes (for persistence) */
  onConfigChange?: (config: WidgetConfig[]) => Promise<void>
}

export function WidgetProvider({
  children,
  initialConfig,
  onConfigChange,
}: WidgetProviderProps) {
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(() => {
    if (initialConfig) {
      return mergeWidgetConfigs(initialConfig)
    }
    return getDefaultWidgetConfig()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<WidgetConfig>[]
        setWidgetConfigs(mergeWidgetConfigs(parsed))
      } catch {
        // Invalid stored config, use defaults
      }
    }
    setIsLoading(false)
  }, [])

  // Save to localStorage and optionally to server
  const saveConfig = useCallback(
    async (config: WidgetConfig[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))

      if (onConfigChange) {
        setIsSaving(true)
        setError(null)
        try {
          await onConfigChange(config)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to save configuration')
        } finally {
          setIsSaving(false)
        }
      }
    },
    [onConfigChange]
  )

  const toggleWidget = useCallback(
    (id: string) => {
      setWidgetConfigs((prev) => {
        const next = prev.map((c) =>
          c.id === id ? { ...c, enabled: !c.enabled } : c
        )
        saveConfig(next)
        return next
      })
    },
    [saveConfig]
  )

  const setWidgetEnabled = useCallback(
    (id: string, enabled: boolean) => {
      setWidgetConfigs((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, enabled } : c))
        saveConfig(next)
        return next
      })
    },
    [saveConfig]
  )

  const reorderWidgets = useCallback(
    (startIndex: number, endIndex: number) => {
      setWidgetConfigs((prev) => {
        const enabled = prev.filter((c) => c.enabled).sort((a, b) => a.order - b.order)
        const [removed] = enabled.splice(startIndex, 1)
        enabled.splice(endIndex, 0, removed)

        // Reassign orders for enabled widgets
        const enabledIds = new Set(enabled.map((c) => c.id))
        const next = prev.map((c) => {
          if (enabledIds.has(c.id)) {
            const newOrder = enabled.findIndex((e) => e.id === c.id)
            return { ...c, order: newOrder }
          }
          return c
        })

        saveConfig(next)
        return next
      })
    },
    [saveConfig]
  )

  const setWidgetSize = useCallback(
    (id: string, size: WidgetSize) => {
      const widget = widgetRegistry.find((w) => w.id === id)
      if (!widget) return

      // Validate size is at least minSize
      const sizeOrder: WidgetSize[] = ['small', 'medium', 'large', 'full']
      const minSizeIndex = sizeOrder.indexOf(widget.minSize)
      const requestedSizeIndex = sizeOrder.indexOf(size)
      const validSize = requestedSizeIndex >= minSizeIndex ? size : widget.minSize

      setWidgetConfigs((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, size: validSize } : c))
        saveConfig(next)
        return next
      })
    },
    [saveConfig]
  )

  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultWidgetConfig()
    setWidgetConfigs(defaults)
    saveConfig(defaults)
  }, [saveConfig])

  const isWidgetEnabled = useCallback(
    (id: string) => {
      return widgetConfigs.find((c) => c.id === id)?.enabled ?? false
    },
    [widgetConfigs]
  )

  const enabledWidgets = getEnabledWidgets(widgetConfigs)

  return (
    <WidgetContext.Provider
      value={{
        widgetConfigs,
        enabledWidgets,
        toggleWidget,
        setWidgetEnabled,
        reorderWidgets,
        setWidgetSize,
        resetToDefaults,
        isWidgetEnabled,
        isLoading,
        isSaving,
        error,
      }}
    >
      {children}
    </WidgetContext.Provider>
  )
}

export function useWidgets() {
  const context = useContext(WidgetContext)
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetProvider')
  }
  return context
}

/**
 * Hook to check if a specific widget is enabled
 */
export function useWidgetEnabled(id: string) {
  const { isWidgetEnabled } = useWidgets()
  return isWidgetEnabled(id)
}
