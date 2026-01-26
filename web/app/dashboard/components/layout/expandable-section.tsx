'use client'

/**
 * Expandable Section Component
 * Collapsible content sections with smooth animations
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableSectionProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
  icon?: ReactNode
  badge?: string | number
  className?: string
}

export function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
  icon,
  badge,
  className,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className={cn('border-b border-border last:border-b-0', className)}>
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-secondary transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {icon && <span className="text-text-secondary">{icon}</span>}
        <span className="flex-1 text-left font-medium text-text-primary">
          {title}
        </span>
        {badge !== undefined && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn(
            'w-5 h-5 text-text-tertiary transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 animate-slide-down">{children}</div>
      )}
    </div>
  )
}

// Insight Card for AI insights stream
interface InsightCardProps {
  category: string
  title: string
  description: string
  icon: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  color?: 'recovery' | 'strain' | 'sleep' | 'heart' | 'activity' | 'default'
}

export function InsightCard({
  category,
  title,
  description,
  icon,
  action,
  color = 'default',
}: InsightCardProps) {
  const colorClasses = {
    recovery: 'bg-recovery/10 text-recovery',
    strain: 'bg-strain/10 text-strain',
    sleep: 'bg-sleep/10 text-sleep',
    heart: 'bg-heart/10 text-heart',
    activity: 'bg-activity/10 text-activity',
    default: 'bg-accent/10 text-accent',
  }

  return (
    <div className="p-4 border-b border-border-muted last:border-b-0">
      <div className="flex gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            colorClasses[color]
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-1">
            {category}
          </p>
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {title}
          </h3>
          <p className="text-sm text-text-secondary">{description}</p>
          {action && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-accent hover:underline"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Insights Stream Container
interface InsightsStreamProps {
  title?: string
  children: ReactNode
}

export function InsightsStream({
  title = 'AI Insights',
  children,
}: InsightsStreamProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-text-primary px-4 mb-4">
        {title}
      </h2>
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Empty state component
interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
        <span className="text-text-tertiary">{icon}</span>
      </div>
      <h3 className="text-base font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs">{description}</p>
      {action && (
        <button
          type="button"
          className="mt-4 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent rounded-lg hover:opacity-90 transition-opacity"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
