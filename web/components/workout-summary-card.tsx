import Link from 'next/link'
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react'

interface WorkoutSummaryProps {
  count: number
  totalMinutes?: number
  prevWeekCount?: number
}

export function WorkoutSummaryCard({ count, totalMinutes = 0, prevWeekCount }: WorkoutSummaryProps) {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  const trendPct =
    prevWeekCount !== undefined && prevWeekCount > 0
      ? Math.round(((count - prevWeekCount) / prevWeekCount) * 100)
      : null

  return (
    <Link
      href="/workouts"
      className="block bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">WORKOUTS</span>
        <Dumbbell className="w-4 h-4 text-[hsl(var(--color-strain))]" />
      </div>

      {count > 0 ? (
        <>
          <div className="text-3xl font-bold text-text-primary leading-none">
            {count}
            <span className="text-sm font-normal text-text-secondary"> sessions</span>
          </div>
          {totalMinutes > 0 && (
            <p className="text-xs text-text-secondary mt-1">
              {hours > 0 ? `${hours}h ` : ''}
              {mins}m total · this week
            </p>
          )}
          {trendPct !== null && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                trendPct >= 0 ? 'text-green-500' : 'text-red-400'
              }`}
            >
              {trendPct >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {trendPct >= 0 ? '+' : ''}
                {trendPct}% vs last week
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <Dumbbell className="w-8 h-8 text-text-muted" />
          <p className="text-xs text-text-secondary mt-1">No workouts this week</p>
          <span className="mt-1 text-xs text-[hsl(var(--color-strain))] font-medium">Log workout →</span>
        </div>
      )}
    </Link>
  )
}
