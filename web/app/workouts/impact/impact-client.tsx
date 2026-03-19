'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine,
} from 'recharts'

interface WorkoutPoint {
  date: string
  workoutType: string
  timing: string
  endHour: number
  durationMinutes: number
  avgHr: number | null
  nextHrv: number
  nextRecovery: number | null
  nextRhr: number | null
  nextSleep: number | null
}

interface Props {
  points: WorkoutPoint[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const TIMING_COLORS: Record<string, string> = {
  Morning: '#facc15',
  Afternoon: '#4ade80',
  Evening: '#fb923c',
  Night: '#f87171',
}

const TIMING_ORDER = ['Morning', 'Afternoon', 'Evening', 'Night']

function groupAvg<T>(items: T[], key: (t: T) => string, val: (t: T) => number): { group: string; avg: number; count: number }[] {
  const map = new Map<string, number[]>()
  for (const item of items) {
    const k = key(item)
    const arr = map.get(k) ?? []
    arr.push(val(item))
    map.set(k, arr)
  }
  return Array.from(map.entries())
    .map(([group, vals]) => ({ group, avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }))
    .sort((a, b) => b.avg - a.avg)
}

function workoutCategory(type: string): string {
  const lower = type.toLowerCase()
  if (lower.includes('run') || lower.includes('walk') || lower.includes('cycling') || lower.includes('hike') || lower.includes('rowing') || lower.includes('swim')) return 'Cardio'
  if (lower.includes('strength') || lower.includes('weight') || lower.includes('functional') || lower.includes('cross')) return 'Strength'
  if (lower.includes('hiit') || lower.includes('circuit') || lower.includes('interval')) return 'HIIT'
  if (lower.includes('yoga') || lower.includes('pilates') || lower.includes('stretch') || lower.includes('mindful')) return 'Mind-Body'
  return 'Other'
}

export function ImpactClient({ points }: Props) {
  if (points.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💪</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log at least 5 workouts with HRV data the following day to see how training affects your recovery.
        </p>
      </div>
    )
  }

  const overallAvgHrv = points.reduce((s, p) => s + p.nextHrv, 0) / points.length

  // Group by timing
  const timingGroups = groupAvg(points, (p) => p.timing, (p) => p.nextHrv)
    .sort((a, b) => TIMING_ORDER.indexOf(a.group) - TIMING_ORDER.indexOf(b.group))

  const bestTiming = timingGroups.reduce((best, g) => g.avg > best.avg ? g : best, timingGroups[0])

  // Group by workout type (top 6)
  const typeGroups = groupAvg(points.filter((p) => p.nextHrv > 0), (p) => p.workoutType, (p) => p.nextHrv)
    .filter((g) => g.count >= 2)
    .slice(0, 8)

  // Group by category
  const catGroups = groupAvg(points, (p) => workoutCategory(p.workoutType), (p) => p.nextHrv)
    .filter((g) => g.count >= 2)

  // Scatter: endHour vs nextHrv
  const scatterData = points.map((p) => ({
    x: p.endHour,
    y: Math.round(p.nextHrv),
    timing: p.timing,
    type: p.workoutType,
  }))

  const barColor = (avg: number) => {
    if (avg >= overallAvgHrv * 1.05) return '#4ade80'
    if (avg >= overallAvgHrv * 0.95) return '#facc15'
    return '#f87171'
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Workouts Analyzed', value: points.length.toString(), sub: 'last 90 days', color: 'text-text-primary' },
          { label: 'Avg Next-Day HRV', value: `${Math.round(overallAvgHrv)} ms`, sub: 'after workout', color: 'text-text-primary' },
          { label: 'Best Timing', value: bestTiming.group, sub: `${Math.round(bestTiming.avg)} ms avg HRV`, color: 'text-green-400' },
          {
            label: 'Best Type',
            value: typeGroups[0]?.group ?? '—',
            sub: typeGroups[0] ? `${Math.round(typeGroups[0].avg)} ms` : '—',
            color: 'text-blue-400',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Best timing banner */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="text-sm font-semibold text-green-400">
              {bestTiming.group} workouts → best recovery
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Your next-day HRV averages <strong className="text-text-primary">{Math.round(bestTiming.avg)} ms</strong> after {bestTiming.group.toLowerCase()} sessions
              (vs. {Math.round(overallAvgHrv)} ms overall). Schedule your harder efforts during this window.
            </p>
          </div>
        </div>
      </div>

      {/* HRV by timing */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Next-Day HRV by Workout Timing</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={timingGroups} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="group" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, props: { payload?: { count: number } }) => [
                `${Math.round(v)} ms · ${props.payload?.count ?? 0} workouts`,
                'Avg next-day HRV',
              ]}
            />
            <ReferenceLine y={overallAvgHrv} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3"
              label={{ value: `Avg ${Math.round(overallAvgHrv)}`, fill: '#888', fontSize: 9, position: 'insideTopLeft' }} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {timingGroups.map((g) => (
                <Cell key={g.group} fill={TIMING_COLORS[g.group] ?? '#888'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
          {TIMING_ORDER.map((t) => (
            <div key={t} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: TIMING_COLORS[t] }} />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* HRV by workout type */}
      {typeGroups.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Next-Day HRV by Workout Type</h2>
          <ResponsiveContainer width="100%" height={typeGroups.length * 36 + 40}>
            <BarChart data={typeGroups} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <YAxis type="category" dataKey="group" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} width={110} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, _: string, props: { payload?: { count: number } }) => [
                  `${Math.round(v)} ms · ${props.payload?.count ?? 0} sessions`,
                  'Avg next-day HRV',
                ]}
              />
              <ReferenceLine x={overallAvgHrv} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                {typeGroups.map((g) => (
                  <Cell key={g.group} fill={barColor(g.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Above avg</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-400" /> Near avg</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Below avg</div>
          </div>
        </div>
      )}

      {/* Scatter: end hour vs HRV */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-1">End Time vs Next-Day HRV</h2>
        <p className="text-xs text-text-secondary opacity-60 mb-3">Each dot = one workout. Color = time of day.</p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 23]}
              tickCount={12}
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v) => {
                if (v === 0) return '12am'
                if (v === 12) return '12pm'
                return v < 12 ? `${v}am` : `${v - 12}pm`
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [v, name === 'y' ? 'Next-day HRV (ms)' : 'End hour']}
              labelFormatter={() => ''}
            />
            <ReferenceLine y={Math.round(overallAvgHrv)} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
            <Scatter data={scatterData} shape="circle">
              {scatterData.map((d, i) => (
                <Cell key={i} fill={TIMING_COLORS[d.timing] ?? '#888'} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* HRV by category */}
      {catGroups.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Next-Day HRV by Category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {catGroups.map((g) => (
              <div key={g.group} className="text-center p-3 rounded-lg border border-border">
                <p className={`text-lg font-bold ${barColor(g.avg) === '#4ade80' ? 'text-green-400' : barColor(g.avg) === '#facc15' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(g.avg)} ms
                </p>
                <p className="text-xs font-medium text-text-primary mt-0.5">{g.group}</p>
                <p className="text-xs text-text-secondary opacity-60">{g.count} sessions</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">How to Read This</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p><span className="text-green-400 font-medium">Higher HRV = better recovery.</span> A higher next-day HRV after certain workout types or timings indicates your body tolerates those sessions well.</p>
          <p><span className="text-yellow-400 font-medium">Timing matters.</span> Intense late-evening workouts may suppress overnight HRV by elevating cortisol and delaying melatonin onset.</p>
          <p><span className="text-orange-400 font-medium">Workout type isn&apos;t everything.</span> Intensity within a category matters as much as the category. A light yoga session and a max-effort HIIT session are both in the same type but have opposite effects.</p>
          <p className="opacity-60 pt-1">Only workouts with HRV data the following morning are included. Data from the last 90 days.</p>
        </div>
      </div>
    </div>
  )
}
