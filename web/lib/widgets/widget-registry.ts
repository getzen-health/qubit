/**
 * Widget Registry
 * Defines all available dashboard widgets with metadata
 */

export type WidgetCategory = 'metrics' | 'activity' | 'insights' | 'analysis'

export type WidgetSize = 'small' | 'medium' | 'large' | 'full'

export interface WidgetDefinition {
  id: string
  name: string
  description: string
  category: WidgetCategory
  defaultSize: WidgetSize
  minSize: WidgetSize
  icon: string
  defaultEnabled: boolean
  defaultOrder: number
}

/**
 * All available dashboard widgets
 */
export const widgetRegistry: WidgetDefinition[] = [
  // Metrics widgets
  {
    id: 'ai-essence',
    name: 'AI Essence',
    description: 'Recovery, strain, and AI insights summary',
    category: 'metrics',
    defaultSize: 'full',
    minSize: 'medium',
    icon: 'sparkles',
    defaultEnabled: true,
    defaultOrder: 0,
  },
  {
    id: 'quick-stats',
    name: 'Quick Stats',
    description: 'At-a-glance metrics grid',
    category: 'metrics',
    defaultSize: 'full',
    minSize: 'medium',
    icon: 'grid-2x2',
    defaultEnabled: true,
    defaultOrder: 1,
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description: 'Daily recovery score with details',
    category: 'metrics',
    defaultSize: 'medium',
    minSize: 'small',
    icon: 'zap',
    defaultEnabled: true,
    defaultOrder: 2,
  },
  {
    id: 'strain',
    name: 'Strain',
    description: 'Daily strain score with breakdown',
    category: 'metrics',
    defaultSize: 'medium',
    minSize: 'small',
    icon: 'flame',
    defaultEnabled: true,
    defaultOrder: 3,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Sleep duration and stages',
    category: 'metrics',
    defaultSize: 'medium',
    minSize: 'small',
    icon: 'moon',
    defaultEnabled: true,
    defaultOrder: 4,
  },
  {
    id: 'heart-rate',
    name: 'Heart Rate',
    description: 'Resting HR and HRV',
    category: 'metrics',
    defaultSize: 'medium',
    minSize: 'small',
    icon: 'heart',
    defaultEnabled: true,
    defaultOrder: 5,
  },

  // Activity widgets
  {
    id: 'steps',
    name: 'Steps',
    description: 'Daily step count and goal progress',
    category: 'activity',
    defaultSize: 'small',
    minSize: 'small',
    icon: 'footprints',
    defaultEnabled: true,
    defaultOrder: 6,
  },
  {
    id: 'calories',
    name: 'Calories',
    description: 'Active calories burned',
    category: 'activity',
    defaultSize: 'small',
    minSize: 'small',
    icon: 'flame',
    defaultEnabled: true,
    defaultOrder: 7,
  },
  {
    id: 'distance',
    name: 'Distance',
    description: 'Walking/running distance',
    category: 'activity',
    defaultSize: 'small',
    minSize: 'small',
    icon: 'map',
    defaultEnabled: false,
    defaultOrder: 8,
  },
  {
    id: 'floors',
    name: 'Floors Climbed',
    description: 'Floors/flights climbed',
    category: 'activity',
    defaultSize: 'small',
    minSize: 'small',
    icon: 'stairs',
    defaultEnabled: false,
    defaultOrder: 9,
  },
  {
    id: 'water',
    name: 'Water',
    description: 'Water intake tracking',
    category: 'activity',
    defaultSize: 'small',
    minSize: 'small',
    icon: 'droplets',
    defaultEnabled: true,
    defaultOrder: 10,
  },

  // Insights widgets
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'Personalized health insights',
    category: 'insights',
    defaultSize: 'full',
    minSize: 'medium',
    icon: 'sparkles',
    defaultEnabled: true,
    defaultOrder: 11,
  },
  {
    id: 'trends',
    name: 'Trends',
    description: 'Weekly/monthly trend charts',
    category: 'insights',
    defaultSize: 'large',
    minSize: 'medium',
    icon: 'trending-up',
    defaultEnabled: false,
    defaultOrder: 12,
  },
  {
    id: 'streaks',
    name: 'Streaks & Goals',
    description: 'Goal streaks and achievements',
    category: 'insights',
    defaultSize: 'medium',
    minSize: 'small',
    icon: 'target',
    defaultEnabled: false,
    defaultOrder: 13,
  },

  // Analysis widgets
  {
    id: 'correlations',
    name: 'Correlations',
    description: 'Discover metric correlations',
    category: 'analysis',
    defaultSize: 'large',
    minSize: 'medium',
    icon: 'git-branch',
    defaultEnabled: false,
    defaultOrder: 14,
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    description: 'Summarized weekly health report',
    category: 'analysis',
    defaultSize: 'full',
    minSize: 'large',
    icon: 'file-text',
    defaultEnabled: false,
    defaultOrder: 15,
  },
]

/**
 * Get widget by ID
 */
export function getWidget(id: string): WidgetDefinition | undefined {
  return widgetRegistry.find((w) => w.id === id)
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return widgetRegistry.filter((w) => w.category === category)
}

/**
 * Get default widget configuration
 */
export function getDefaultWidgetConfig(): WidgetConfig[] {
  return widgetRegistry.map((widget) => ({
    id: widget.id,
    enabled: widget.defaultEnabled,
    order: widget.defaultOrder,
    size: widget.defaultSize,
  }))
}

/**
 * User's widget configuration
 */
export interface WidgetConfig {
  id: string
  enabled: boolean
  order: number
  size: WidgetSize
}

/**
 * Merge user config with registry defaults
 */
export function mergeWidgetConfigs(userConfig: Partial<WidgetConfig>[]): WidgetConfig[] {
  const defaults = getDefaultWidgetConfig()

  return defaults.map((defaultConfig) => {
    const userOverride = userConfig.find((c) => c.id === defaultConfig.id)
    if (userOverride) {
      return { ...defaultConfig, ...userOverride }
    }
    return defaultConfig
  })
}

/**
 * Get enabled widgets sorted by order
 */
export function getEnabledWidgets(config: WidgetConfig[]): (WidgetDefinition & WidgetConfig)[] {
  return config
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const widget = getWidget(c.id)
      if (!widget) return null
      return { ...widget, ...c }
    })
    .filter((w): w is WidgetDefinition & WidgetConfig => w !== null)
}
