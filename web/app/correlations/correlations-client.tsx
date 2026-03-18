'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DailySummary {
  date: string
  steps: number
  active_calories: number
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
  recovery_score: number | null
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0)
  const denX = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const denY = ys.reduce((s, y) => s + (y - my) ** 2, 0)
  const den = Math.sqrt(denX * denY)
  return den === 0 ? 0 : num / den
}

function strengthLabel(r: number): { label: string; color: string } {
  const abs = Math.abs(r)
  if (abs >= 0.6) return { label: 'Strong', color: r > 0 ? 'text-green-400' : 'text-red-400' }
  if (abs >= 0.35) return { label: 'Moderate', color: r > 0 ? 'text-blue-400' : 'text-orange-400' }
  if (abs >= 0.15) return { label: 'Weak', color: 'text-text-secondary' }
  return { label: 'None', color: 'text-text-secondary opacity-60' }
}

function directionText(r: number, xLabel: string, yLabel: string): string {
  const abs = Math.abs(r)
  if (abs < 0.15) return `No clear relationship detected between ${xLabel} and ${yLabel}.`
  const dir = r > 0 ? 'higher' : 'lower'
  const strength = abs >= 0.6 ? 'strongly' : abs >= 0.35 ? 'moderately' : 'weakly'
  return `Higher ${xLabel} is ${strength} associated with ${dir} ${yLabel}.`
}

interface CorrelationPair {
  label: string
  xLabel: string
  yLabel: string
  xUnit?: string
  yUnit?: string
  pairs: Array<{ x: number; y: number; date: string }>
  r: number
  dotColor: string
}

interface CorrelationsClientProps {
  summaries: DailySummary[]
}

export function CorrelationsClient({ summaries }: CorrelationsClientProps) {
  // Build shifted pairs: prev day → next day
  const shiftedByDate = new Map(summaries.map((s) => [s.date, s]))
  function prevDayPairs(
    getX: (s: DailySummary) => number | null,
    getY: (s: DailySummary) => number | null
  ) {
    const pairs: Array<{ x: number; y: number; date: string }> = []
    for (let i = 1; i < summaries.length; i++) {
      const prev = summaries[i - 1]
      const curr = summaries[i]
      const x = getX(prev)
      const y = getY(curr)
      if (x != null && x > 0 && y != null && y > 0) {
        pairs.push({ x, y, date: curr.date })
      }
    }
    return pairs
  }

  function sameDayPairs(
    getX: (s: DailySummary) => number | null,
    getY: (s: DailySummary) => number | null
  ) {
    const pairs: Array<{ x: number; y: number; date: string }> = []
    for (const s of summaries) {
      const x = getX(s)
      const y = getY(s)
      if (x != null && x > 0 && y != null && y > 0) {
        pairs.push({ x, y, date: s.date })
      }
    }
    return pairs
  }

  const correlations: CorrelationPair[] = [
    (() => {
      const pairs = prevDayPairs(
        (s) => s.sleep_duration_minutes,
        (s) => s.avg_hrv
      )
      return {
        label: 'Sleep → Next Day HRV',
        xLabel: 'Sleep',
        yLabel: 'HRV',
        xUnit: 'h',
        yUnit: 'ms',
        pairs: pairs.map((p) => ({ ...p, x: parseFloat((p.x / 60).toFixed(2)) })),
        r: pearson(pairs.map((p) => p.x / 60), pairs.map((p) => p.y)),
        dotColor: '#3b82f6',
      }
    })(),
    (() => {
      const pairs = prevDayPairs(
        (s) => s.sleep_duration_minutes,
        (s) => s.recovery_score
      )
      return {
        label: 'Sleep → Next Day Recovery',
        xLabel: 'Sleep',
        yLabel: 'Recovery',
        xUnit: 'h',
        yUnit: '%',
        pairs: pairs.map((p) => ({ ...p, x: parseFloat((p.x / 60).toFixed(2)) })),
        r: pearson(pairs.map((p) => p.x / 60), pairs.map((p) => p.y)),
        dotColor: '#10b981',
      }
    })(),
    (() => {
      const pairs = sameDayPairs(
        (s) => s.avg_hrv,
        (s) => s.active_calories
      )
      return {
        label: 'HRV → Active Calories',
        xLabel: 'HRV',
        yLabel: 'Calories',
        xUnit: 'ms',
        yUnit: 'cal',
        pairs,
        r: pearson(pairs.map((p) => p.x), pairs.map((p) => p.y)),
        dotColor: '#f59e0b',
      }
    })(),
    (() => {
      const pairs = sameDayPairs(
        (s) => s.avg_hrv,
        (s) => s.steps
      )
      return {
        label: 'HRV → Steps',
        xLabel: 'HRV',
        yLabel: 'Steps',
        xUnit: 'ms',
        yUnit: '',
        pairs,
        r: pearson(pairs.map((p) => p.x), pairs.map((p) => p.y)),
        dotColor: '#8b5cf6',
      }
    })(),
    (() => {
      const pairs = sameDayPairs(
        (s) => s.resting_heart_rate,
        (s) => s.avg_hrv
      )
      return {
        label: 'Resting HR vs HRV',
        xLabel: 'Resting HR',
        yLabel: 'HRV',
        xUnit: 'bpm',
        yUnit: 'ms',
        pairs,
        r: pearson(pairs.map((p) => p.x), pairs.map((p) => p.y)),
        dotColor: '#ef4444',
      }
    })(),
    (() => {
      const pairs = sameDayPairs(
        (s) => s.recovery_score,
        (s) => s.active_calories
      )
      return {
        label: 'Recovery → Output',
        xLabel: 'Recovery',
        yLabel: 'Calories',
        xUnit: '%',
        yUnit: 'cal',
        pairs,
        r: pearson(pairs.map((p) => p.x), pairs.map((p) => p.y)),
        dotColor: '#ec4899',
      }
    })(),
  ]

  // Filter to correlations with enough data (≥15 pairs)
  const valid = correlations.filter((c) => c.pairs.length >= 15)
  const insufficient = correlations.filter((c) => c.pairs.length < 15)

  if (valid.length === 0) {
    return (
      <div className="text-center py-16 text-text-secondary">
        <p className="text-lg mb-2">Not enough data yet</p>
        <p className="text-sm">Correlations require at least 15 days of paired data. Keep syncing your health data!</p>
      </div>
    )
  }

  // Sort by |r| descending
  valid.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Based on your last 90 days of health data. Correlations reveal patterns in how your metrics influence each other.
      </p>

      {valid.map((corr) => {
        const { label, color } = strengthLabel(corr.r)
        return (
          <div key={corr.label} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-text-primary">{corr.label}</h3>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-xs font-bold ${color}`}>{label}</span>
                <span className="text-xs font-mono text-text-secondary">
                  r = {corr.r >= 0 ? '+' : ''}{corr.r.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              {directionText(corr.r, corr.xLabel, corr.yLabel)}
              {' '}<span className="opacity-60">({corr.pairs.length} data points)</span>
            </p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={corr.xLabel}
                    tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                    tickFormatter={(v) => corr.xUnit === 'h' ? `${v}h` : corr.xUnit === 'ms' ? `${v}` : corr.xUnit === 'bpm' ? `${v}` : String(v)}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={corr.yLabel}
                    tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                    width={35}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === corr.xLabel) return [`${value}${corr.xUnit ?? ''}`, corr.xLabel]
                      return [`${value}${corr.yUnit ?? ''}`, corr.yLabel]
                    }}
                    labelFormatter={() => ''}
                  />
                  <Scatter
                    data={corr.pairs}
                    fill={corr.dotColor}
                    fillOpacity={0.7}
                    r={3}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}

      {insufficient.length > 0 && (
        <div className="bg-surface-secondary rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-2">Needs more data</p>
          <div className="space-y-1">
            {insufficient.map((c) => (
              <p key={c.label} className="text-sm text-text-secondary">
                {c.label} — {c.pairs.length} / 15 days
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
