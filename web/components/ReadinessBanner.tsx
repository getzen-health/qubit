import { createClient } from '@/lib/supabase/server'

interface DailySummaryRow {
  date: string
  avg_hrv: number | null
  resting_heart_rate: number | null
  sleep_quality_score: number | null
}

function computeFactors(row: DailySummaryRow) {
  const hrvScore =
    row.avg_hrv != null ? Math.min(row.avg_hrv / 65, 1) * 100 : null
  const rhrScore =
    row.resting_heart_rate != null
      ? Math.max(0, (80 - row.resting_heart_rate) / (80 - 40)) * 100
      : null
  const sleepScore =
    row.sleep_quality_score != null ? row.sleep_quality_score : null

  const availableFactors = [
    hrvScore != null ? hrvScore * 0.4 : null,
    sleepScore != null ? sleepScore * 0.3 : null,
    rhrScore != null ? rhrScore * 0.3 : null,
  ].filter((v): v is number => v !== null)

  if (availableFactors.length === 0) return null

  const totalWeight =
    (hrvScore != null ? 0.4 : 0) +
    (sleepScore != null ? 0.3 : 0) +
    (rhrScore != null ? 0.3 : 0)

  const score = Math.round(
    availableFactors.reduce((a, b) => a + b, 0) / totalWeight
  )

  return { score, hrvScore, sleepScore, rhrScore }
}

function ReadinessRing({
  score,
  color,
}: {
  score: number
  color: string
}) {
  const R = 36
  const circumference = 2 * Math.PI * R
  const dash = (score / 100) * circumference

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
      <circle
        cx="44"
        cy="44"
        r={R}
        fill="none"
        strokeWidth="6"
        className="stroke-surface-secondary"
      />
      <circle
        cx="44"
        cy="44"
        r={R}
        fill="none"
        strokeWidth="6"
        stroke={color}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform="rotate(-90, 44, 44)"
      />
    </svg>
  )
}

function FactorBar({
  label,
  value,
  color,
}: {
  label: string
  value: number | null
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-text-secondary mb-0.5">
        <span>{label}</span>
        <span>{value != null ? Math.round(value) : '—'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
        {value != null && (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(value, 100)}%`, background: color }}
          />
        )}
      </div>
    </div>
  )
}

export async function ReadinessBanner({ userId }: { userId: string }) {
  const supabase = await createClient()

  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('daily_summaries')
    .select('date, avg_hrv, resting_heart_rate, sleep_quality_score')
    .eq('user_id', userId)
    .in('date', [todayStr, yesterdayStr])
    .order('date', { ascending: false })

  const today =
    (data as DailySummaryRow[] | null)?.find((r) => r.date === todayStr) ??
    null
  const yesterday =
    (data as DailySummaryRow[] | null)?.find((r) => r.date === yesterdayStr) ??
    null

  if (!today || computeFactors(today) == null) {
    return (
      <div className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
        <span className="text-2xl">📡</span>
        <div>
          <p className="text-sm font-semibold text-text-primary">Readiness unavailable</p>
          <p className="text-xs text-text-secondary">Sync your iPhone to see today&apos;s readiness score.</p>
        </div>
      </div>
    )
  }

  const todayFactors = computeFactors(today)!

  const { score, hrvScore, sleepScore, rhrScore } = todayFactors
  const yesterdayResult = yesterday ? computeFactors(yesterday) : null
  const yesterdayScore = yesterdayResult?.score ?? null

  const label =
    score >= 85
      ? 'Peak'
      : score >= 70
        ? 'High'
        : score >= 50
          ? 'Moderate'
          : 'Low'

  const colorClass =
    score >= 70
      ? 'text-green-400'
      : score >= 50
        ? 'text-yellow-400'
        : 'text-red-400'

  const ringColor =
    score >= 70 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'

  const trendDelta =
    yesterdayScore != null ? score - yesterdayScore : 0
  const trendArrow =
    yesterdayScore == null ? '→' : trendDelta > 2 ? '↑' : trendDelta < -2 ? '↓' : '→'
  const trendClass =
    trendArrow === '↑'
      ? 'text-green-400'
      : trendArrow === '↓'
        ? 'text-red-400'
        : 'text-text-secondary'

  return (
    <div className="mb-6 bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center gap-4">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <ReadinessRing score={score} color={ringColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl font-bold leading-none ${colorClass}`}>
              {score}
            </span>
            <span className="text-[10px] text-text-secondary">/ 100</span>
          </div>
        </div>

        {/* Label + factor bars */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className={`text-base font-semibold ${colorClass}`}>
              {label}
            </span>
            <span className={`text-sm font-medium ${trendClass}`}>
              {trendArrow}
            </span>
            <span className="text-xs text-text-secondary ml-auto">
              Readiness
            </span>
          </div>

          <div className="space-y-2">
            <FactorBar label="HRV (40%)" value={hrvScore} color={ringColor} />
            <FactorBar
              label="Sleep (30%)"
              value={sleepScore}
              color={ringColor}
            />
            <FactorBar
              label="Recovery/RHR (30%)"
              value={rhrScore}
              color={ringColor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
