import Link from 'next/link'
import { Moon, TrendingUp, TrendingDown } from 'lucide-react'

interface SleepRecord {
  duration_minutes?: number
}

interface SleepSummaryProps {
  /** Pass raw hours directly, or pass recentSleepRecords to compute duration */
  hours?: number
  quality?: number
  recentSleepRecords?: SleepRecord[]
}

export function SleepSummaryCard({ hours: hoursProp, recentSleepRecords }: SleepSummaryProps) {
  const durationMinutes =
    hoursProp !== undefined
      ? Math.round(hoursProp * 60)
      : (recentSleepRecords?.[0]?.duration_minutes ?? 0)

  const prevDurationMinutes = recentSleepRecords?.[1]?.duration_minutes ?? null

  const h = Math.floor(durationMinutes / 60)
  const m = Math.round(durationMinutes % 60)
  const hasData = durationMinutes > 0

  const trendPct =
    prevDurationMinutes && prevDurationMinutes > 0
      ? Math.round(((durationMinutes - prevDurationMinutes) / prevDurationMinutes) * 100)
      : null

  return (
    <Link
      href="/sleep"
      className="block bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">SLEEP</span>
        <Moon className="w-4 h-4 text-[hsl(var(--color-sleep))]" />
      </div>

      {hasData ? (
        <>
          <div className="text-3xl font-bold text-text-primary leading-none">
            {h}h<span className="text-xl font-semibold"> {m}m</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">Last night · Goal: 8h</p>
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
                {trendPct}% vs last night
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <Moon className="w-8 h-8 text-text-muted" />
          <p className="text-xs text-text-secondary mt-1">No sleep logged</p>
          <span className="mt-1 text-xs text-[hsl(var(--color-sleep))] font-medium">Log sleep →</span>
        </div>
      )}
    </Link>
  )
}
