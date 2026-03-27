'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  /** Icon element to display (e.g. <Moon className="w-4 h-4" />) */
  icon: ReactNode
  /** Short uppercase label shown above the value */
  label: string
  /** Primary display value */
  value: string | number
  /** Optional unit shown next to the value (e.g. "bpm", "steps") */
  unit?: string
  /**
   * Percentage trend vs baseline.
   * positive = improving, negative = declining, undefined = no trend shown.
   */
  trend?: number
  /** Contextual label for the trend line, e.g. "vs yesterday" */
  trendLabel?: string
  /** Tailwind color class for the icon, e.g. "text-[hsl(var(--color-sleep))]" */
  iconColorClass?: string
  /** Optional subtext below the value */
  sublabel?: string
  /** Wraps the card in a link when provided */
  href?: string
  className?: string
}

export function MetricCard({
  icon,
  label,
  value,
  unit,
  trend,
  trendLabel = 'vs yesterday',
  iconColorClass,
  sublabel,
  href,
  className,
}: MetricCardProps) {
  const hasTrend = trend !== undefined && trend !== 0
  const trendUp = hasTrend && trend > 0
  const trendDown = hasTrend && trend < 0

  const card = (
    <div
      className={cn(
        'bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow',
        href && 'cursor-pointer',
        className,
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </span>
        <span className={cn('flex-shrink-0', iconColorClass ?? 'text-text-secondary')}>
          {icon}
        </span>
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-text-primary leading-none">{value}</span>
        {unit && (
          <span className="text-sm text-text-secondary">{unit}</span>
        )}
      </div>

      {/* Optional sublabel */}
      {sublabel && (
        <p className="text-xs text-text-secondary mt-1">{sublabel}</p>
      )}

      {/* Trend indicator */}
      {hasTrend && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            trendUp && 'text-green-500',
            trendDown && 'text-red-400',
            !trendUp && !trendDown && 'text-text-secondary',
          )}
        >
          {trendUp ? (
            <TrendingUp className="w-3 h-3 flex-shrink-0" />
          ) : trendDown ? (
            <TrendingDown className="w-3 h-3 flex-shrink-0" />
          ) : (
            <Minus className="w-3 h-3 flex-shrink-0" />
          )}
          <span>
            {trend > 0 ? '+' : ''}
            {trend}% {trendLabel}
          </span>
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{card}</Link> : card
}
