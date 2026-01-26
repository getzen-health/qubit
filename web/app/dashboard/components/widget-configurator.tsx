'use client'

/**
 * Widget Configurator
 * UI for configuring dashboard widgets
 */

import { useState } from 'react'
import {
  Settings2,
  GripVertical,
  Check,
  X,
  RotateCcw,
  ChevronDown,
  Sparkles,
  Grid2x2,
  Zap,
  Flame,
  Moon,
  Heart,
  Footprints,
  Map,
  ArrowUpFromLine,
  Droplets,
  TrendingUp,
  Target,
  GitBranch,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgets } from '@/lib/widgets/widget-context'
import {
  type WidgetDefinition,
  type WidgetCategory,
  type WidgetSize,
  widgetRegistry,
  getWidgetsByCategory,
} from '@/lib/widgets/widget-registry'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  'grid-2x2': Grid2x2,
  zap: Zap,
  flame: Flame,
  moon: Moon,
  heart: Heart,
  footprints: Footprints,
  map: Map,
  stairs: ArrowUpFromLine,
  droplets: Droplets,
  'trending-up': TrendingUp,
  target: Target,
  'git-branch': GitBranch,
  'file-text': FileText,
}

const categoryLabels: Record<WidgetCategory, string> = {
  metrics: 'Core Metrics',
  activity: 'Activity',
  insights: 'Insights',
  analysis: 'Analysis',
}

const categoryOrder: WidgetCategory[] = ['metrics', 'activity', 'insights', 'analysis']

interface WidgetConfiguratorProps {
  isOpen: boolean
  onClose: () => void
}

export function WidgetConfigurator({ isOpen, onClose }: WidgetConfiguratorProps) {
  const {
    widgetConfigs,
    toggleWidget,
    setWidgetSize,
    resetToDefaults,
    isWidgetEnabled,
    isSaving,
    error,
  } = useWidgets()

  const [expandedCategory, setExpandedCategory] = useState<WidgetCategory | null>('metrics')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-text-primary">Customize Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status */}
        {(isSaving || error) && (
          <div
            className={cn(
              'px-4 py-2 text-sm',
              error ? 'bg-error/10 text-error' : 'bg-accent/10 text-accent'
            )}
          >
            {error ?? 'Saving...'}
          </div>
        )}

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto">
          {categoryOrder.map((category) => (
            <CategorySection
              key={category}
              category={category}
              widgets={getWidgetsByCategory(category)}
              isExpanded={expandedCategory === category}
              onToggle={() =>
                setExpandedCategory(expandedCategory === category ? null : category)
              }
              isWidgetEnabled={isWidgetEnabled}
              toggleWidget={toggleWidget}
              setWidgetSize={setWidgetSize}
              widgetConfigs={widgetConfigs}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-surface-secondary">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

interface CategorySectionProps {
  category: WidgetCategory
  widgets: WidgetDefinition[]
  isExpanded: boolean
  onToggle: () => void
  isWidgetEnabled: (id: string) => boolean
  toggleWidget: (id: string) => void
  setWidgetSize: (id: string, size: WidgetSize) => void
  widgetConfigs: { id: string; size: WidgetSize }[]
}

function CategorySection({
  category,
  widgets,
  isExpanded,
  onToggle,
  isWidgetEnabled,
  toggleWidget,
  setWidgetSize,
  widgetConfigs,
}: CategorySectionProps) {
  const enabledCount = widgets.filter((w) => isWidgetEnabled(w.id)).length

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors"
      >
        <span className="font-medium text-text-primary">{categoryLabels[category]}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            {enabledCount}/{widgets.length}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-tertiary transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="pb-2">
          {widgets.map((widget) => (
            <WidgetItem
              key={widget.id}
              widget={widget}
              isEnabled={isWidgetEnabled(widget.id)}
              onToggle={() => toggleWidget(widget.id)}
              currentSize={widgetConfigs.find((c) => c.id === widget.id)?.size ?? widget.defaultSize}
              onSizeChange={(size) => setWidgetSize(widget.id, size)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface WidgetItemProps {
  widget: WidgetDefinition
  isEnabled: boolean
  onToggle: () => void
  currentSize: WidgetSize
  onSizeChange: (size: WidgetSize) => void
}

function WidgetItem({
  widget,
  isEnabled,
  onToggle,
  currentSize,
  onSizeChange,
}: WidgetItemProps) {
  const Icon = iconMap[widget.icon] ?? Sparkles
  const [showSizeOptions, setShowSizeOptions] = useState(false)

  const sizeOptions: WidgetSize[] = ['small', 'medium', 'large', 'full']
  const availableSizes = sizeOptions.slice(sizeOptions.indexOf(widget.minSize))

  return (
    <div
      className={cn(
        'mx-2 px-3 py-2 rounded-lg transition-colors',
        isEnabled ? 'bg-accent/5' : 'hover:bg-surface-secondary'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab text-text-tertiary hover:text-text-secondary"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isEnabled ? 'bg-accent/10 text-accent' : 'bg-surface-secondary text-text-tertiary'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{widget.name}</p>
          <p className="text-xs text-text-secondary truncate">{widget.description}</p>
        </div>

        {/* Size selector */}
        {isEnabled && availableSizes.length > 1 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSizeOptions(!showSizeOptions)}
              className="px-2 py-1 text-xs font-medium text-text-secondary bg-surface-secondary rounded hover:bg-surface-tertiary transition-colors"
            >
              {currentSize}
            </button>
            {showSizeOptions && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      onSizeChange(size)
                      setShowSizeOptions(false)
                    }}
                    className={cn(
                      'block w-full px-3 py-1.5 text-xs text-left hover:bg-surface-secondary transition-colors first:rounded-t-lg last:rounded-b-lg',
                      currentSize === size
                        ? 'text-accent font-medium'
                        : 'text-text-secondary'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toggle */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            isEnabled
              ? 'bg-accent text-accent-foreground'
              : 'bg-surface-secondary text-text-tertiary hover:text-text-secondary'
          )}
        >
          {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

/**
 * Button to open the widget configurator
 */
export function WidgetConfigButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
        title="Customize dashboard"
      >
        <Settings2 className="w-5 h-5 text-text-secondary" />
      </button>
      <WidgetConfigurator isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
