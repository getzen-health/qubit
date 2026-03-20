'use client'

import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

interface Run {
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
}

interface AerobicDecouplingClientProps {
  runs: Run[]
}

// ── Decoupling formula ────────────────────────────────────────────────────────
function computeDecoupling(run: Run): number {
  const avgHR = run.avg_heart_rate ?? 0
  const maxHR = run.max_heart_rate ?? 0
  const hrRatio = avgHR > 0 && maxHR > avgHR ? maxHR / avgHR : 1.08
  const durationFactor = Math.min(run.duration_minutes / 120, 1.5)
  const raw = Math.max(0, (hrRatio - 1.0) * 100 * 0.7 * durationFactor)
  return Math.min(raw, 20)
}

// ── Aerobic level classification ─────────────────────────────────────────────
type AerobicLevel = 'excellent' | 'good' | 'moderate' | 'poor'

function aerobicLevel(pct: number): AerobicLevel {
  if (pct < 5) return 'excellent'
  if (pct < 7) return 'good'
  if (pct < 10) return 'moderate'
  return 'poor'
}

const LEVEL_COLORS: Record<AerobicLevel, string> = {
  excellent: '#2dd4bf',  // teal
  good: '#22c55e',       // green
  moderate: '#eab308',   // yellow
  poor: '#f97316',       // orange
}

const LEVEL_LABELS: Record<AerobicLevel, string> = {
  excellent: 'Excellent',
  good: 'Good',
  moderate: 'Moderate',
  poor: 'Poor',
}

const TEAL = '#2dd4bf'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Monday week label for a date
function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function AerobicDecouplingClient({ runs }: AerobicDecouplingClientProps) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏃</span>
        <h2 className="text-lg font-semibold text-text-primary">No long runs yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Aerobic decoupling is calculated from running workouts of 30 minutes or longer. Sync
          your Apple Health data to see your aerobic fitness trend.
        </p>
      </div>
    )
  }

  // ── Compute decoupling for each run ─────────────────────────────────────────
  const enriched = runs.map((r) => {
    const decoupling = +computeDecoupling(r).toFixed(2)
    const level = aerobicLevel(decoupling)
    return { ...r, decoupling, level }
  })

  // ── Summary stats ────────────────────────────────────────────────────────────
  const avgDecoupling =
    enriched.reduce((s, r) => s + r.decoupling, 0) / enriched.length

  const overallLevel = aerobicLevel(avgDecoupling)

  // Trend: compare average of first half vs second half
  const half = Math.floor(enriched.length / 2)
  const firstHalfAvg =
    half > 0
      ? enriched.slice(0, half).reduce((s, r) => s + r.decoupling, 0) / half
      : avgDecoupling
  const secondHalfAvg =
    enriched.length - half > 0
      ? enriched.slice(half).reduce((s, r) => s + r.decoupling, 0) / (enriched.length - half)
      : avgDecoupling
  const trendDelta = secondHalfAvg - firstHalfAvg
  const trendLabel =
    enriched.length < 4
      ? 'Not enough data'
      : trendDelta < -0.5
      ? 'Improving'
      : trendDelta > 0.5
      ? 'Declining'
      : 'Stable'
  const trendColor =
    trendLabel === 'Improving' ? '#22c55e' : trendLabel === 'Declining' ? '#f97316' : TEAL

  // ── Scatter chart data ───────────────────────────────────────────────────────
  const scatterData = enriched.map((r) => ({
    date: fmtDate(r.start_time),
    decoupling: r.decoupling,
    level: r.level,
  }))

  // ── Weekly average bar chart (last 13 weeks) ─────────────────────────────────
  const weeklyMap = new Map<string, { sum: number; count: number }>()
  const now = new Date()
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    weeklyMap.set(weekLabel(d), { sum: 0, count: 0 })
  }
  for (const r of enriched) {
    const label = weekLabel(new Date(r.start_time))
    if (weeklyMap.has(label)) {
      const entry = weeklyMap.get(label)!
      weeklyMap.set(label, { sum: entry.sum + r.decoupling, count: entry.count + 1 })
    }
  }
  const weeklyData = Array.from(weeklyMap.entries()).map(([week, { sum, count }]) => ({
    week,
    avg: count > 0 ? +(sum / count).toFixed(2) : 0,
    hasData: count > 0,
  }))

  return (
    <div className="space-y-6">
      {/* Estimation notice banner */}
      <div
        className="rounded-xl border px-4 py-3 flex items-start gap-3"
        style={{
          background: 'rgba(45,212,191,0.07)',
          borderColor: 'rgba(45,212,191,0.25)',
        }}
      >
        <span className="text-teal-400 text-lg leading-none mt-0.5">ℹ</span>
        <p className="text-xs text-text-secondary leading-relaxed">
          <span className="text-text-primary font-medium">Estimated values — </span>
          True aerobic decoupling requires first-half vs second-half heart rate &amp; pace data
          within each run. These figures are computed from per-workout averages and max heart
          rates as a proxy. Use as a directional trend only.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: LEVEL_COLORS[overallLevel] }}
          >
            {avgDecoupling.toFixed(1)}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Decoupling</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p
            className="text-2xl font-bold"
            style={{ color: LEVEL_COLORS[overallLevel] }}
          >
            {LEVEL_LABELS[overallLevel]}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Aerobic Level</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: trendColor }}>
            {trendLabel}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Trend</p>
        </div>
      </div>

      {/* Decoupling trend scatter chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Decoupling per Run (%)
        </h3>
        {/* Level legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {(Object.keys(LEVEL_COLORS) as AerobicLevel[]).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1 text-xs text-text-secondary">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: LEVEL_COLORS[lvl] }}
              />
              {LEVEL_LABELS[lvl]}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              type="category"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              dataKey="decoupling"
              type="number"
              domain={[0, 22]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={32}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ReferenceLine
              y={5}
              stroke="rgba(34,197,94,0.5)"
              strokeDasharray="4 3"
              label={{
                value: '5%',
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'rgba(34,197,94,0.7)',
              }}
            />
            <ReferenceLine
              y={10}
              stroke="rgba(249,115,22,0.5)"
              strokeDasharray="4 3"
              label={{
                value: '10%',
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'rgba(249,115,22,0.7)',
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, 'Decoupling']}
              labelFormatter={(label: string) => label}
            />
            <Scatter data={scatterData} opacity={0.9}>
              {scatterData.map((entry, i) => (
                <Cell key={i} fill={LEVEL_COLORS[entry.level]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly average bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Weekly Average Decoupling — Last 13 Weeks
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={32}
              domain={[0, 20]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) =>
                v > 0 ? [`${v.toFixed(1)}%`, 'Avg Decoupling'] : ['No data', '']
              }
            />
            <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
              {weeklyData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.hasData ? LEVEL_COLORS[aerobicLevel(entry.avg)] : 'rgba(255,255,255,0.08)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Science card */}
      <div
        className="rounded-2xl border p-4 space-y-3"
        style={{
          background: 'rgba(45,212,191,0.07)',
          borderColor: 'rgba(45,212,191,0.25)',
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: TEAL }}>
          What is Aerobic Decoupling?
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Aerobic decoupling measures cardiac drift — the tendency for heart rate to rise relative
          to pace as a run progresses, even when effort stays constant. It is calculated as the
          difference in the pace:HR ratio between the first and second halves of a run,
          expressed as a percentage.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl border p-3 space-y-1"
            style={{ borderColor: 'rgba(45,212,191,0.2)' }}
          >
            <p className="text-xs font-semibold" style={{ color: TEAL }}>
              MAF Training
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              The MAF (Maximum Aerobic Function) method by Dr. Phil Maffetone uses a low
              heart-rate ceiling (180 − age) to build aerobic base and minimise decoupling.
            </p>
          </div>
          <div
            className="rounded-xl border p-3 space-y-1"
            style={{ borderColor: 'rgba(45,212,191,0.2)' }}
          >
            <p className="text-xs font-semibold" style={{ color: TEAL }}>
              Target: &lt; 5%
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              A decoupling below 5% on a long run indicates strong aerobic fitness. Above 10%
              suggests the run was too fast or conditions too demanding for your current base.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 pt-1">
          {(Object.keys(LEVEL_LABELS) as AerobicLevel[]).map((lvl) => (
            <div key={lvl} className="text-center space-y-1">
              <div
                className="mx-auto w-3 h-3 rounded-full"
                style={{ background: LEVEL_COLORS[lvl] }}
              />
              <p className="text-xs font-medium" style={{ color: LEVEL_COLORS[lvl] }}>
                {LEVEL_LABELS[lvl]}
              </p>
              <p className="text-xs text-text-secondary">
                {lvl === 'excellent' && '< 5%'}
                {lvl === 'good' && '5–7%'}
                {lvl === 'moderate' && '7–10%'}
                {lvl === 'poor' && '> 10%'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
