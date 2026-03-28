import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  subtitle?: string
  className?: string
  /** Tailwind color class applied to the value, e.g. 'text-green-500' */
  colorClass?: string
}

export function SummaryCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  subtitle,
  className,
  colorClass,
}: SummaryCardProps) {
  return (
    <div className={cn('bg-surface border border-border rounded-2xl shadow-sm', className)}>
      <div className="pb-1 px-5 pt-5">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {title}
        </p>
      </div>
      <div className="px-5 pb-5">
        <div className={cn('text-2xl font-bold', colorClass)}>
          {value}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
          )}
        </div>
        {trendValue && (
          <p
            className={cn(
              'text-xs mt-1',
              trend === 'up'
                ? 'text-green-500'
                : trend === 'down'
                  ? 'text-red-500'
                  : 'text-muted-foreground',
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </p>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
