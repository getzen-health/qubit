'use client'

import { useState } from 'react'
import { X, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Anomaly } from './page'

const SEVERITY_STYLES = {
  high: {
    border: 'border-red-500/40',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    icon: 'text-red-500',
    dot: 'bg-red-500',
    label: 'High',
  },
  medium: {
    border: 'border-orange-500/40',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    icon: 'text-orange-500',
    dot: 'bg-orange-500',
    label: 'Medium',
  },
  low: {
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    icon: 'text-yellow-500',
    dot: 'bg-yellow-500',
    label: 'Low',
  },
}

function formatMetricName(metric: string): string {
  return metric
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value: number, metric: string): string {
  if (metric.toLowerCase().includes('hr') || metric.toLowerCase().includes('heart_rate')) {
    return `${Math.round(value)} bpm`
  }
  if (metric.toLowerCase().includes('hrv')) {
    return `${Math.round(value)} ms`
  }
  if (metric.toLowerCase().includes('step')) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  if (metric.toLowerCase().includes('sleep')) {
    const hours = Math.floor(value / 60)
    const mins = Math.round(value % 60)
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return Math.round(value * 10) / 10 + ''
}

function formatDetectedAt(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

interface AnomalyCardProps {
  anomaly: Anomaly
}

export function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const [dismissed, setDismissed] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const styles = SEVERITY_STYLES[anomaly.severity] ?? SEVERITY_STYLES.low
  const isDown = anomaly.value < anomaly.avg_value
  const deviationPct = anomaly.avg_value !== 0
    ? Math.round(Math.abs((anomaly.value - anomaly.avg_value) / anomaly.avg_value) * 100)
    : 0

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      const supabase = createClient()
      await supabase
        .from('anomalies')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', anomaly.id)
      setDismissed(true)
    } catch {
      setDismissing(false)
    }
  }

  if (dismissed) return null

  return (
    <article
      className={cn(
        'rounded-2xl border bg-surface p-4 space-y-3 transition-opacity',
        styles.border,
        dismissing && 'opacity-40 pointer-events-none'
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border', styles.badge)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
            {styles.label}
          </span>
          <span className="text-xs font-semibold text-text-primary">{formatMetricName(anomaly.metric)}</span>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss alert"
          className="w-6 h-6 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric values */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          {isDown ? (
            <TrendingDown className={cn('w-4 h-4', styles.icon)} />
          ) : (
            <TrendingUp className={cn('w-4 h-4', styles.icon)} />
          )}
          <span className="font-semibold text-text-primary">{formatValue(anomaly.value, anomaly.metric)}</span>
          <span className="text-text-tertiary">vs avg</span>
          <span className="text-text-secondary">{formatValue(anomaly.avg_value, anomaly.metric)}</span>
        </div>
        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-md', styles.badge)}>
          {isDown ? '-' : '+'}{deviationPct}%
        </span>
      </div>

      {/* Claude explanation */}
      {anomaly.claude_explanation ? (
        <div className="flex gap-2 bg-surface-secondary rounded-xl px-3 py-2.5">
          <AlertTriangle className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', styles.icon)} />
          <p className="text-xs text-text-secondary leading-relaxed">{anomaly.claude_explanation}</p>
        </div>
      ) : null}

      {/* Timestamp */}
      <p className="text-[10px] text-text-tertiary">{formatDetectedAt(anomaly.detected_at)}</p>
    </article>
  )
}
