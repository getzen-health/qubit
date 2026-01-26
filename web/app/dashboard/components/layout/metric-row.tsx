'use client'

/**
 * Metric Row Component
 * Expandable inline metric display for the stream-based layout
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricRowProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  sublabel?: string
  trend?: number
  trendLabel?: string
  color?: 'recovery' | 'strain' | 'sleep' | 'heart' | 'hrv' | 'activity' | 'glucose' | 'default'
  expandContent?: ReactNode
  onClick?: () => void
}

export function MetricRow({
  icon,
  label,
  value,
  unit,
  sublabel,
  trend,
  trendLabel,
  color = 'default',
  expandContent,
  onClick,
}: MetricRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const colorClasses = {
    recovery: 'text-recovery',
    strain: 'text-strain',
    sleep: 'text-sleep',
    heart: 'text-heart',
    hrv: 'text-hrv',
    activity: 'text-activity',
    glucose: 'text-glucose',
    default: 'text-accent',
  }

  const iconBgClasses = {
    recovery: 'bg-recovery/10',
    strain: 'bg-strain/10',
    sleep: 'bg-sleep/10',
    heart: 'bg-heart/10',
    hrv: 'bg-hrv/10',
    activity: 'bg-activity/10',
    glucose: 'bg-glucose/10',
    default: 'bg-accent/10',
  }

  const handleClick = () => {
    if (expandContent) {
      setIsExpanded(!isExpanded)
    }
    onClick?.()
  }

  const isExpandable = !!expandContent

  return (
    <div className="border-b border-border-muted last:border-b-0">
      {/* Main Row */}
      <button
        type="button"
        className={cn(
          'w-full flex items-center gap-4 px-4 py-3 transition-colors',
          isExpandable && 'hover:bg-surface-secondary cursor-pointer',
          !isExpandable && 'cursor-default'
        )}
        onClick={handleClick}
        disabled={!isExpandable && !onClick}
      >
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBgClasses[color]
          )}
        >
          <span className={colorClasses[color]}>{icon}</span>
        </div>

        {/* Label & Sublabel */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm text-text-secondary font-medium">{label}</p>
          {sublabel && (
            <p className="text-xs text-text-tertiary truncate">{sublabel}</p>
          )}
        </div>

        {/* Value */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-lg font-semibold text-text-primary">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-text-tertiary ml-0.5">{unit}</span>
            )}
          </div>

          {/* Trend */}
          {trend !== undefined && (
            <TrendIndicator value={trend} label={trendLabel} />
          )}

          {/* Expand Indicator */}
          {isExpandable && (
            <ChevronDown
              className={cn(
                'w-5 h-5 text-text-tertiary transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && expandContent && (
        <div className="px-4 pb-4 animate-slide-down">
          <div className="ml-14 pt-2">{expandContent}</div>
        </div>
      )}
    </div>
  )
}

function TrendIndicator({ value, label }: { value: number; label?: string }) {
  const displayLabel = label ?? `${Math.abs(value)}%`

  if (value > 0) {
    return (
      <div className="flex items-center gap-1 text-recovery">
        <TrendingUp className="w-4 h-4" />
        <span className="text-xs font-medium">{displayLabel}</span>
      </div>
    )
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-1 text-error">
        <TrendingDown className="w-4 h-4" />
        <span className="text-xs font-medium">{displayLabel}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-text-muted">
      <Minus className="w-4 h-4" />
      <span className="text-xs font-medium">--</span>
    </div>
  )
}

// Compact variant for secondary metrics
interface MetricRowCompactProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  color?: MetricRowProps['color']
}

export function MetricRowCompact({
  icon,
  label,
  value,
  unit,
  color = 'default',
}: MetricRowCompactProps) {
  const colorClasses = {
    recovery: 'text-recovery',
    strain: 'text-strain',
    sleep: 'text-sleep',
    heart: 'text-heart',
    hrv: 'text-hrv',
    activity: 'text-activity',
    glucose: 'text-glucose',
    default: 'text-accent',
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <span className={cn('w-5 h-5', colorClasses[color])}>{icon}</span>
      <span className="text-sm text-text-secondary flex-1">{label}</span>
      <span className="text-sm font-medium text-text-primary">
        {value}
        {unit && <span className="text-text-tertiary ml-0.5">{unit}</span>}
      </span>
    </div>
  )
}
