interface ProgressSummaryCardProps {
  href: string
  emoji: string
  title: string
  value: string
  valueLabel?: string
  percentage: number
  footer: string
  barColor?: string
}

export function ProgressSummaryCard({
  href,
  emoji,
  title,
  value,
  valueLabel,
  percentage,
  footer,
  barColor = 'bg-primary',
}: ProgressSummaryCardProps) {
  const pct = Math.min(100, Math.max(0, Math.round(percentage)))
  return (
    <a href={href} className="block rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{emoji} {title}</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <p className="text-2xl font-bold">
        {value}
        {valueLabel && <span className="text-sm text-muted-foreground font-normal">{valueLabel}</span>}
      </p>
      <div className="mt-2 h-1.5 bg-muted rounded-full">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{footer}</p>
    </a>
  )
}
