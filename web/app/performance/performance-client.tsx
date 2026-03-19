'use client'

import type { PerformanceData, SportSnapshot } from './page'

interface Props {
  data: PerformanceData
}

function fmt0(n: number | null): string {
  if (n == null || n === 0) return '—'
  return Math.round(n).toLocaleString()
}

function fmt1(n: number): string { return n.toFixed(1) }

type Direction = 'up' | 'down' | 'same'

function delta(now: number | null, then: number | null, higherIsBetter: boolean): { pct: number | null; dir: Direction; positive: boolean } {
  if (now == null || then == null || then === 0) return { pct: null, dir: 'same', positive: true }
  const pct = Math.round(((now - then) / then) * 100)
  const dir: Direction = pct > 2 ? 'up' : pct < -2 ? 'down' : 'same'
  const positive = higherIsBetter ? dir === 'up' : dir === 'down'
  return { pct, dir, positive }
}

function Arrow({ dir, positive }: { dir: Direction; positive: boolean }) {
  if (dir === 'same') return <span className="text-text-secondary text-sm">→</span>
  const cls = positive ? 'text-green-500' : 'text-red-500'
  return <span className={`${cls} text-sm font-bold`}>{dir === 'up' ? '↑' : '↓'}</span>
}

function DeltaBadge({ pct, dir, positive }: { pct: number | null; dir: Direction; positive: boolean }) {
  if (pct == null || dir === 'same') return <span className="text-xs text-text-secondary">≈ same</span>
  const cls = positive ? 'text-green-500' : 'text-red-500'
  return <span className={`text-xs font-medium ${cls}`}>{pct > 0 ? '+' : ''}{pct}% YoY</span>
}

function SportCard({ s }: { s: SportSnapshot }) {
  // For pace sports, lower is better; for speed/duration/sessions, higher is better
  const isPace = s.metricLabel === 'avg pace' || s.metricLabel === 'pace /100m'
  const metricHIB = !isPace

  const sessionsDelta = delta(s.nowSessions, s.thenSessions, true)
  const metricDelta   = delta(s.nowAvgMetric, s.thenAvgMetric, metricHIB)
  const kmDelta       = delta(s.nowTotalKm, s.thenTotalKm, true)
  const minsDelta     = delta(s.nowTotalMins, s.thenTotalMins, true)

  const hasDistance = s.nowTotalKm > 0 || s.thenTotalKm > 0

  return (
    <div className="bg-surface-primary rounded-xl border border-border p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{s.icon}</span>
        <div>
          <p className="font-semibold text-text-primary">{s.sport}</p>
          <p className="text-xs text-text-secondary">Last 30d vs same period 1yr ago</p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Sessions */}
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Sessions</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-text-primary tabular-nums">{s.nowSessions}</span>
            <span className="text-xs text-text-secondary">vs {s.thenSessions}</span>
            <Arrow dir={sessionsDelta.dir} positive={sessionsDelta.positive} />
          </div>
          <DeltaBadge {...sessionsDelta} />
        </div>

        {/* Key metric */}
        {s.nowAvgMetric != null || s.thenAvgMetric != null ? (
          <div className="bg-surface-secondary rounded-lg p-3">
            <p className="text-xs text-text-secondary mb-1">{s.metricLabel}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-text-primary tabular-nums">
                {s.nowAvgMetric != null ? s.metricDisplay(s.nowAvgMetric) : '—'}
              </span>
              <Arrow dir={metricDelta.dir} positive={metricDelta.positive} />
            </div>
            {s.thenAvgMetric != null && (
              <p className="text-xs text-text-secondary">vs {s.metricDisplay(s.thenAvgMetric)} prior year</p>
            )}
            <DeltaBadge {...metricDelta} />
          </div>
        ) : (
          <div className="bg-surface-secondary rounded-lg p-3">
            <p className="text-xs text-text-secondary mb-1">Avg session</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-text-primary tabular-nums">
                {s.nowSessions > 0 ? `${Math.round(s.nowTotalMins / s.nowSessions)} min` : '—'}
              </span>
            </div>
            {s.thenSessions > 0 && <p className="text-xs text-text-secondary">vs {Math.round(s.thenTotalMins / s.thenSessions)} min prior year</p>}
          </div>
        )}

        {/* Volume km */}
        {hasDistance && (
          <div className="bg-surface-secondary rounded-lg p-3">
            <p className="text-xs text-text-secondary mb-1">Total km</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-text-primary tabular-nums">{fmt1(s.nowTotalKm)}</span>
              <span className="text-xs text-text-secondary">vs {fmt1(s.thenTotalKm)}</span>
              <Arrow dir={kmDelta.dir} positive={kmDelta.positive} />
            </div>
            <DeltaBadge {...kmDelta} />
          </div>
        )}

        {/* Volume mins */}
        <div className="bg-surface-secondary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Total mins</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-text-primary tabular-nums">{Math.round(s.nowTotalMins)}</span>
            <span className="text-xs text-text-secondary">vs {Math.round(s.thenTotalMins)}</span>
            <Arrow dir={minsDelta.dir} positive={minsDelta.positive} />
          </div>
          <DeltaBadge {...minsDelta} />
        </div>
      </div>
    </div>
  )
}

function HealthMarkerRow({
  label,
  now,
  then,
  unit,
  higherIsBetter,
  icon,
}: {
  label: string
  now: number | null
  then: number | null
  unit: string
  higherIsBetter: boolean
  icon: string
}) {
  const d = delta(now, then, higherIsBetter)
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary tabular-nums">
            {now != null ? `${fmt0(now)} ${unit}` : '—'}
          </p>
          <p className="text-xs text-text-secondary">
            vs {then != null ? `${fmt0(then)} ${unit}` : '—'} last year
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Arrow dir={d.dir} positive={d.positive} />
          <DeltaBadge {...d} />
        </div>
      </div>
    </div>
  )
}

function OverallSummary({ data }: { data: PerformanceData }) {
  const { nowWeeklyWorkouts, thenWeeklyWorkouts, nowWeeklyMins, thenWeeklyMins, nowDailySteps, thenDailySteps } = data

  const workoutsD = delta(nowWeeklyWorkouts, thenWeeklyWorkouts, true)
  const minsD = delta(nowWeeklyMins, thenWeeklyMins, true)
  const stepsD = delta(nowDailySteps, thenDailySteps, true)

  return (
    <div className="bg-surface-primary rounded-xl border border-border p-4">
      <h2 className="font-semibold text-text-primary mb-3">Training Volume (avg/week)</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-text-secondary mb-1">Workouts</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{fmt1(nowWeeklyWorkouts)}</p>
          <p className="text-xs text-text-secondary">vs {fmt1(thenWeeklyWorkouts)}</p>
          <DeltaBadge {...workoutsD} />
        </div>
        <div className="text-center">
          <p className="text-xs text-text-secondary mb-1">Minutes</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{Math.round(nowWeeklyMins)}</p>
          <p className="text-xs text-text-secondary">vs {Math.round(thenWeeklyMins)}</p>
          <DeltaBadge {...minsD} />
        </div>
        <div className="text-center">
          <p className="text-xs text-text-secondary mb-1">Daily Steps</p>
          <p className="text-xl font-bold text-text-primary tabular-nums">{fmt0(nowDailySteps)}</p>
          <p className="text-xs text-text-secondary">vs {fmt0(thenDailySteps)}</p>
          <DeltaBadge {...stepsD} />
        </div>
      </div>
    </div>
  )
}

export function PerformanceClient({ data }: Props) {
  const { sports, nowRHR, thenRHR, nowHRV, thenHRV } = data

  const hasCardioData = nowRHR != null || nowHRV != null

  return (
    <div className="space-y-6">
      {/* Overall summary */}
      <OverallSummary data={data} />

      {/* Cardio health markers */}
      {hasCardioData && (
        <div className="bg-surface-primary rounded-xl border border-border p-4">
          <h2 className="font-semibold text-text-primary mb-1">Cardiovascular Health Markers</h2>
          <p className="text-xs text-text-secondary mb-3">90-day averages: now vs 1 year ago</p>
          <HealthMarkerRow
            label="Resting Heart Rate"
            now={nowRHR}
            then={thenRHR}
            unit="bpm"
            higherIsBetter={false}
            icon="❤️"
          />
          <HealthMarkerRow
            label="HRV (Heart Rate Variability)"
            now={nowHRV}
            then={thenHRV}
            unit="ms"
            higherIsBetter={true}
            icon="〰️"
          />
        </div>
      )}

      {/* Sport-by-sport breakdown */}
      <div>
        <h2 className="font-semibold text-text-primary mb-3">Sport-by-Sport Breakdown</h2>
        <div className="space-y-4">
          {sports.length === 0 ? (
            <div className="bg-surface-primary rounded-xl border border-border p-8 text-center text-text-secondary">
              No workout data found for the comparison period.
            </div>
          ) : (
            sports.map((s) => <SportCard key={s.sport} s={s} />)
          )}
        </div>
      </div>

      {/* Interpretation guide */}
      <div className="bg-surface-primary rounded-xl border border-border p-4">
        <h3 className="font-semibold text-text-primary mb-2">How to Read This</h3>
        <ul className="text-sm text-text-secondary space-y-1.5">
          <li><span className="text-green-500 font-bold">↑ green</span> — improvement vs last year</li>
          <li><span className="text-red-500 font-bold">↓ red</span> — decline vs last year</li>
          <li><span className="text-text-secondary">→</span> — within 2% of last year (stable)</li>
          <li className="pt-1 text-xs">For pace metrics, a decline (slower pace) is shown red. For RHR, an increase is red.</li>
          <li className="text-xs">Comparison window: last 30 days vs the same 30-day window 12 months ago.</li>
        </ul>
      </div>
    </div>
  )
}
