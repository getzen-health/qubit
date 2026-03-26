interface WorkoutSummaryProps { count: number; totalMinutes?: number }
export function WorkoutSummaryCard({ count, totalMinutes = 0 }: WorkoutSummaryProps) {
  return (
    <a href="/workouts" className="block rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">🏃 Workouts</span>
        <span className="text-xs text-muted-foreground">this week</span>
      </div>
      <p className="text-2xl font-bold">{count}<span className="text-sm text-muted-foreground font-normal"> sessions</span></p>
      {totalMinutes > 0 && <p className="text-xs text-muted-foreground mt-1">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m total</p>}
    </a>
  )
}
