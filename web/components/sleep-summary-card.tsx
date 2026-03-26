interface SleepSummaryProps { hours: number; quality?: number }
export function SleepSummaryCard({ hours, quality }: SleepSummaryProps) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  const color = hours >= 7 ? 'text-blue-500' : hours >= 6 ? 'text-yellow-500' : 'text-red-500'
  return (
    <a href="/sleep" className="block rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">🌙 Sleep</span>
        {quality && <span className="text-xs text-muted-foreground">{'⭐'.repeat(quality)}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{h}h<span className="text-sm font-normal">{m}m</span></p>
      <p className="text-xs text-muted-foreground mt-1">Last night · Goal: 8h</p>
    </a>
  )
}
