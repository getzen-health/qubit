'use client'

/**
 * AI Essence Component
 * Prominent AI-first summary at the top of the dashboard
 */

import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AIEssenceProps {
  recoveryScore: number
  strainScore: number
  primaryInsight: string
  secondaryInsight?: string
  recoveryTrend?: number
  strainTrend?: number
}

export function AIEssence({
  recoveryScore,
  strainScore,
  primaryInsight,
  secondaryInsight,
  recoveryTrend,
  strainTrend,
}: AIEssenceProps) {
  return (
    <div className="border-b border-border pb-6 mb-6">
      <div className="flex items-start gap-4">
        {/* AI Icon */}
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-accent-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Primary Insight */}
          <p className="text-lg text-text-primary font-medium leading-snug">
            {primaryInsight}
          </p>

          {/* Secondary Insight */}
          {secondaryInsight && (
            <p className="text-sm text-text-secondary mt-1">
              {secondaryInsight}
            </p>
          )}

          {/* Key Metrics */}
          <div className="flex items-center gap-6 mt-4">
            <MetricBadge
              label="Recovery"
              value={recoveryScore}
              unit="%"
              color="recovery"
              trend={recoveryTrend}
            />
            <MetricBadge
              label="Strain"
              value={strainScore.toFixed(1)}
              unit="/21"
              color="strain"
              trend={strainTrend}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetricBadgeProps {
  label: string
  value: string | number
  unit: string
  color: 'recovery' | 'strain' | 'sleep' | 'heart' | 'hrv'
  trend?: number
}

function MetricBadge({ label, value, unit, color, trend }: MetricBadgeProps) {
  const colorClasses = {
    recovery: 'text-recovery',
    strain: 'text-strain',
    sleep: 'text-sleep',
    heart: 'text-heart',
    hrv: 'text-hrv',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-base font-semibold ${colorClasses[color]}`}>
        {value}
        <span className="text-text-tertiary font-normal">{unit}</span>
      </span>
      {trend !== undefined && <TrendIndicator value={trend} />}
    </div>
  )
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center text-recovery text-xs">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        {Math.abs(value)}%
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="flex items-center text-error text-xs">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {Math.abs(value)}%
      </span>
    )
  }
  return (
    <span className="flex items-center text-text-muted text-xs">
      <Minus className="w-3 h-3" />
    </span>
  )
}
