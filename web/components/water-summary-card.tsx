interface WaterSummaryProps { totalMl: number; goalMl?: number }
export function WaterSummaryCard({ totalMl, goalMl = 2000 }: WaterSummaryProps) {
  const pct = Math.min(100, Math.round((totalMl / goalMl) * 100))
  return (
    <a href="/water" className="block rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">💧 Water</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <p className="text-2xl font-bold text-blue-500">{totalMl}<span className="text-sm text-muted-foreground font-normal">ml</span></p>
      <div className="mt-2 h-1.5 bg-muted rounded-full">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">Goal: {goalMl}ml</p>
    </a>
  )
}
