'use client'

/**
 * Data Stream Component
 * Main container for the stream-based dashboard layout
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataStreamProps {
  children: ReactNode
  className?: string
}

export function DataStream({ children, className }: DataStreamProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-lg border border-border overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  )
}

interface DataStreamSectionProps {
  title: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function DataStreamSection({
  title,
  children,
  className,
  action,
}: DataStreamSectionProps) {
  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

interface DataStreamHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function DataStreamHeader({
  title,
  subtitle,
  action,
}: DataStreamHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-border">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

interface DataStreamDividerProps {
  label?: string
}

export function DataStreamDivider({ label }: DataStreamDividerProps) {
  if (label) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    )
  }
  return <div className="h-px bg-border mx-4" />
}

// Quick Stats Grid
interface QuickStatsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function QuickStatsGrid({ children, columns = 4 }: QuickStatsGridProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4 px-4 py-4', colClasses[columns])}>
      {children}
    </div>
  )
}

interface QuickStatProps {
  label: string
  value: string | number
  unit?: string
  trend?: number
  color?: 'recovery' | 'strain' | 'sleep' | 'heart' | 'activity' | 'default'
}

export function QuickStat({
  label,
  value,
  unit,
  trend,
  color = 'default',
}: QuickStatProps) {
  const colorClasses = {
    recovery: 'text-recovery',
    strain: 'text-strain',
    sleep: 'text-sleep',
    heart: 'text-heart',
    activity: 'text-activity',
    default: 'text-text-primary',
  }

  return (
    <div className="p-3 rounded-lg bg-surface-secondary">
      <p className="text-xs text-text-tertiary font-medium mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-xl font-bold', colorClasses[color])}>
          {value}
        </span>
        {unit && <span className="text-sm text-text-tertiary">{unit}</span>}
        {trend !== undefined && (
          <span
            className={cn(
              'text-xs ml-1',
              trend > 0 ? 'text-recovery' : trend < 0 ? 'text-error' : 'text-text-muted'
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  )
}
