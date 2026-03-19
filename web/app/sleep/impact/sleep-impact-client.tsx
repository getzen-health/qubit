'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import type { SleepDay } from './page'

interface Props {
  days: SleepDay[]
  optimalBuckets: { hours: number; avgHrv: number; count: number }[]
  bestHrvBucket: { hours: number; avgHrv: number; count: number } | null
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtHours(h: number) {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  return min > 0 ? `${hrs}h ${min}m` : `${hrs}h`
}

// Pearson correlation
function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 5) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const denX = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0))
  const denY = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  return denX > 0 && denY > 0 ? num / (denX * denY) : null
}

function corrBadge(r: number | null): { label: string; color: string } {
  if (r === null) return { label: 'Insufficient data', color: 'text-text-secondary' }
  const abs = Math.abs(r)
  const dir = r > 0 ? '+' : '−'
  if (abs >= 0.5) return { label: `Strong ${r > 0 ? 'positive' : 'negative'} (r=${r.toFixed(2)})`, color: abs >= 0.5 && r > 0 ? 'text-green-400' : 'text-red-400' }
  if (abs >= 0.25) return { label: `Moderate (r=${r.toFixed(2)})`, color: r > 0 ? 'text-yellow-400' : 'text-orange-400' }
  return { label: `Weak (r=${r.toFixed(2)})`, color: 'text-text-secondary' }
}

export function SleepImpactClient({ days, optimalBuckets, bestHrvBucket }: Props) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">😴</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Need at least a few nights of sleep data plus next-day HRV readings to calculate sleep impact.
          Sync your iPhone to get started.
        </p>
      </div>
    )
  }

  // Scatter: sleep hours vs next-day HRV
  const hrvScatter = days.filter((d) => d.nextHrv !== null).map((d) => ({
    hours: +d.sleepHours.toFixed(1),
    hrv: d.nextHrv!,
    date: d.date,
    workout: d.hadWorkout,
  }))

  // Scatter: sleep hours vs next-day steps
  const stepsScatter = days.filter((d) => d.nextSteps !== null).map((d) => ({
    hours: +d.sleepHours.toFixed(1),
    steps: d.nextSteps!,
    date: d.date,
  }))

  // Correlations
  const hrv_r = pearson(hrvScatter.map((d) => d.hours), hrvScatter.map((d) => d.hrv))
  const steps_r = pearson(stepsScatter.map((d) => d.hours), stepsScatter.map((d) => d.steps))

  // Sleep duration over time
  const trendData = days.map((d) => ({ date: fmtDate(d.date), hours: +d.sleepHours.toFixed(1), hrv: d.nextHrv }))

  const avgSleep = days.reduce((s, d) => s + d.sleepHours, 0) / days.length
  const avgHrv = days.filter((d) => d.nextHrv).length > 0
    ? days.filter((d) => d.nextHrv).reduce((s, d) => s + d.nextHrv!, 0) / days.filter((d) => d.nextHrv).length
    : null

  const hrvBadge = corrBadge(hrv_r)
  const stepsBadge = corrBadge(steps_r)

  return (
    <div className="space-y-6">
      {/* Optimal sleep insight */}
      {bestHrvBucket && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-blue-400">
                Your HRV is highest after {fmtHours(bestHrvBucket.hours)}–{fmtHours(bestHrvBucket.hours + 0.5)} of sleep
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Average next-day HRV: {bestHrvBucket.avgHrv} ms (from {bestHrvBucket.count} nights)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Nights Analyzed', value: `${days.length}`, sub: 'with next-day data' },
          { label: 'Avg Sleep', value: fmtHours(avgSleep), sub: '90-day average' },
          { label: 'Sleep → HRV', value: hrvBadge.label.split(' (')[0], sub: `r=${hrv_r?.toFixed(2) ?? '—'}`, color: hrvBadge.color },
          { label: 'Sleep → Steps', value: stepsBadge.label.split(' (')[0], sub: `r=${steps_r?.toFixed(2) ?? '—'}`, color: stepsBadge.color },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-lg font-bold leading-tight ${color ?? 'text-text-primary'}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* HRV by sleep bucket — optimal window chart */}
      {optimalBuckets.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Avg Next-Day HRV by Sleep Duration</h2>
          <p className="text-xs text-text-secondary mb-3">
            Find your personal optimal sleep window — where YOUR HRV peaks
          </p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={optimalBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="hours"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${v} ms`,
                  'Avg HRV',
                ]}
                labelFormatter={(v) => `${v}h sleep`}
              />
              <Bar dataKey="avgHrv" radius={[4, 4, 0, 0]}>
                {optimalBuckets.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d === bestHrvBucket ? '#22c55e' : '#6366f1'}
                    opacity={d === bestHrvBucket ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {bestHrvBucket && (
            <p className="text-xs text-text-secondary text-center mt-2">
              <span className="text-green-400 font-medium">Green bar</span> = your optimal sleep duration
            </p>
          )}
        </div>
      )}

      {/* Sleep hours vs next-day HRV scatter */}
      {hrvScatter.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Sleep Hours → Next-Day HRV</h2>
          <p className={`text-xs mb-3 font-medium ${hrvBadge.color}`}>{hrvBadge.label}</p>
          <ResponsiveContainer width="100%" height={160}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="hours"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}h`}
                label={{ value: 'Sleep', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#888' }}
              />
              <YAxis
                dataKey="hrv"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: number, name: string) => [
                  name === 'hours' ? `${v}h` : `${v} ms`,
                  name === 'hours' ? 'Sleep' : 'HRV',
                ]}
              />
              <ReferenceLine x={7} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <ReferenceLine x={8} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <Scatter
                data={hrvScatter}
                fill="#818cf8"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-2 text-xs text-text-secondary">
            <div>Vertical lines at 7h and 8h</div>
          </div>
        </div>
      )}

      {/* Sleep hours vs next-day steps scatter */}
      {stepsScatter.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Sleep Hours → Next-Day Activity</h2>
          <p className={`text-xs mb-3 font-medium ${stepsBadge.color}`}>{stepsBadge.label}</p>
          <ResponsiveContainer width="100%" height={140}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="hours"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}h`}
                label={{ value: 'Sleep', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#888' }}
              />
              <YAxis
                dataKey="steps"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                label={{ value: 'Steps', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: number, name: string) => [
                  name === 'hours' ? `${v}h` : `${v.toLocaleString()} steps`,
                  name === 'hours' ? 'Sleep' : 'Steps',
                ]}
              />
              <Scatter data={stepsScatter} fill="#fbbf24" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep duration trend */}
      {trendData.length >= 7 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Sleep Duration Over Time</h2>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[4, 11]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}h`, 'Sleep']}
              />
              <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.4} />
              <ReferenceLine y={9} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.4} />
              <ReferenceLine y={avgSleep} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5"><div className="w-3 h-px bg-green-500 opacity-50" />7–9h optimal</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-px bg-white opacity-20" />Your avg ({fmtHours(avgSleep)})</div>
          </div>
        </div>
      )}

      {/* Key takeaways */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">How to Use This</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            <span className="text-indigo-400 font-medium">Sleep → HRV:</span> If there&apos;s a positive correlation,
            longer/better sleep predicts higher HRV recovery the next day. Use this to plan hard training days after nights of known good sleep.
          </p>
          <p>
            <span className="text-yellow-400 font-medium">Sleep → Steps:</span> A positive correlation here suggests you&apos;re more active
            on days after better sleep — a sign that sleep quality gates your energy levels for physical activity.
          </p>
          <p>
            <span className="text-green-400 font-medium">Optimal window:</span> The green bar shows where YOUR HRV is highest.
            This is your personal optimal sleep duration — different from the population average of 7–9 hours.
          </p>
          <p className="opacity-60 pt-1">
            Correlation ≠ causation. Many factors influence next-day HRV and steps. Use these patterns as guidelines,
            not hard rules.
          </p>
        </div>
      </div>
    </div>
  )
}
