'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
} from 'recharts'

interface SleepRecord {
  start_time: string
  end_time: string
  duration_minutes: number
  rem_minutes: number | null
  deep_minutes: number | null
  core_minutes: number | null
  awake_minutes: number | null
}

interface StagesClientProps {
  nights: SleepRecord[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const STAGE_COLORS = {
  deep: '#6366f1',
  rem: '#8b5cf6',
  core: '#38bdf8',
  awake: '#f87171',
}

// Optimal ranges (% of total sleep)
const OPTIMAL = {
  deep: { min: 13, max: 23, label: 'Deep (SWS)' },
  rem: { min: 20, max: 25, label: 'REM' },
  core: { min: 45, max: 60, label: 'Core' },
  awake: { min: 0, max: 7, label: 'Awake' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function stagePct(min: number | null, total: number): number {
  if (!min || total === 0) return 0
  return Math.round((min / total) * 100)
}

function stageScore(pct: number, min: number, max: number): { score: number; color: string } {
  if (pct >= min && pct <= max) return { score: 100, color: 'text-green-400' }
  const dist = pct < min ? min - pct : pct - max
  if (dist <= 5) return { score: 75, color: 'text-yellow-400' }
  if (dist <= 10) return { score: 50, color: 'text-orange-400' }
  return { score: 25, color: 'text-red-400' }
}

export function StagesClient({ nights }: StagesClientProps) {
  if (nights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌙</span>
        <h2 className="text-lg font-semibold text-text-primary">No stage data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch sleep stage data (deep, REM, core) requires watchOS 9+ with sleep tracking enabled for at least one night.
        </p>
      </div>
    )
  }

  // Compute averages
  const avgDeepPct = nights.reduce((s, n) => s + stagePct(n.deep_minutes, n.duration_minutes), 0) / nights.length
  const avgRemPct = nights.reduce((s, n) => s + stagePct(n.rem_minutes, n.duration_minutes), 0) / nights.length
  const avgCorePct = nights.reduce((s, n) => s + stagePct(n.core_minutes, n.duration_minutes), 0) / nights.length
  const avgAwakePct = nights.reduce((s, n) => s + stagePct(n.awake_minutes, n.duration_minutes), 0) / nights.length

  const avgDeepMin = nights.reduce((s, n) => s + (n.deep_minutes ?? 0), 0) / nights.length
  const avgRemMin = nights.reduce((s, n) => s + (n.rem_minutes ?? 0), 0) / nights.length

  // Per-night data for trend chart
  const trendData = nights.map((n) => ({
    date: fmtDate(n.start_time),
    deep: stagePct(n.deep_minutes, n.duration_minutes),
    rem: stagePct(n.rem_minutes, n.duration_minutes),
    core: stagePct(n.core_minutes, n.duration_minutes),
    awake: stagePct(n.awake_minutes, n.duration_minutes),
    total: n.duration_minutes,
  }))

  // Best nights by deep + REM
  const sorted = [...nights].sort((a, b) => {
    const aScore = stagePct(a.deep_minutes, a.duration_minutes) + stagePct(a.rem_minutes, a.duration_minutes)
    const bScore = stagePct(b.deep_minutes, b.duration_minutes) + stagePct(b.rem_minutes, b.duration_minutes)
    return bScore - aScore
  })
  const bestNight = sorted[0]
  const worstNight = sorted[sorted.length - 1]

  // Average composition bar data
  const compositionData = [
    { name: 'You', deep: Math.round(avgDeepPct), rem: Math.round(avgRemPct), core: Math.round(avgCorePct), awake: Math.round(avgAwakePct) },
    { name: 'Optimal', deep: 18, rem: 22, core: 52, awake: 5 },
  ]

  const deepS = stageScore(avgDeepPct, OPTIMAL.deep.min, OPTIMAL.deep.max)
  const remS = stageScore(avgRemPct, OPTIMAL.rem.min, OPTIMAL.rem.max)

  return (
    <div className="space-y-6">
      {/* Stage averages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'deep', label: 'Deep (SWS)', pct: avgDeepPct, min: avgDeepMin, color: STAGE_COLORS.deep, opt: OPTIMAL.deep },
          { key: 'rem', label: 'REM', pct: avgRemPct, min: avgRemMin, color: STAGE_COLORS.rem, opt: OPTIMAL.rem },
          { key: 'core', label: 'Core / Light', pct: avgCorePct, min: null, color: STAGE_COLORS.core, opt: OPTIMAL.core },
          { key: 'awake', label: 'Awake', pct: avgAwakePct, min: null, color: STAGE_COLORS.awake, opt: OPTIMAL.awake },
        ].map(({ key, label, pct, min, color, opt }) => {
          const s = stageScore(pct, opt.min, opt.max)
          return (
            <div key={key} className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">{label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{Math.round(pct)}%</p>
              {min !== null && <p className="text-xs text-text-secondary mt-0.5">{fmtMin(min)} avg</p>}
              <p className="text-xs opacity-50 mt-0.5">Target {opt.min}–{opt.max}%</p>
            </div>
          )
        })}
      </div>

      {/* Stage health summary */}
      <div className={`rounded-xl border p-4 space-y-1 ${
        deepS.score >= 75 && remS.score >= 75
          ? 'border-green-500/30 bg-green-500/5'
          : deepS.score < 50 || remS.score < 50
          ? 'border-orange-500/30 bg-orange-500/5'
          : 'border-yellow-500/30 bg-yellow-500/5'
      }`}>
        <p className="font-semibold text-sm text-text-primary">Stage Quality Assessment</p>
        <div className="flex gap-4 text-xs mt-2">
          <span className={deepS.color}>Deep SWS: {deepS.score < 75 ? `${Math.round(avgDeepPct)}% (target ${OPTIMAL.deep.min}–${OPTIMAL.deep.max}%)` : 'On target'}</span>
          <span className={remS.color}>REM: {remS.score < 75 ? `${Math.round(avgRemPct)}% (target ${OPTIMAL.rem.min}–${OPTIMAL.rem.max}%)` : 'On target'}</span>
        </div>
        {(deepS.score < 75 || remS.score < 75) && (
          <p className="text-xs text-text-secondary mt-2 opacity-70">
            {deepS.score < 75 && 'Deep sleep increases with consistent sleep timing, less alcohol, and cooler room temperature. '}
            {remS.score < 75 && 'REM sleep is maximized with longer total sleep duration and consistent wake time.'}
          </p>
        )}
      </div>

      {/* You vs Optimal comparison bar */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Your Mix vs. Optimal</h3>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart
            data={compositionData}
            layout="vertical"
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            barCategoryGap="20%"
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} width={48} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v}%`, name]} />
            <Bar dataKey="deep" name="Deep" stackId="a" fill={STAGE_COLORS.deep} />
            <Bar dataKey="rem" name="REM" stackId="a" fill={STAGE_COLORS.rem} />
            <Bar dataKey="core" name="Core" stackId="a" fill={STAGE_COLORS.core} />
            <Bar dataKey="awake" name="Awake" stackId="a" fill={STAGE_COLORS.awake} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
          {[['Deep', STAGE_COLORS.deep], ['REM', STAGE_COLORS.rem], ['Core', STAGE_COLORS.core], ['Awake', STAGE_COLORS.awake]].map(([name, color]) => (
            <span key={name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: color }} />
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Stage trend over time */}
      {trendData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Stage Trends (% of night)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 60]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}%`}
                width={32}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v}%`, name]} />
              <ReferenceLine y={18} stroke={`${STAGE_COLORS.deep}60`} strokeDasharray="4 3" />
              <ReferenceLine y={22} stroke={`${STAGE_COLORS.rem}60`} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="deep" name="Deep" stroke={STAGE_COLORS.deep} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rem" name="REM" stroke={STAGE_COLORS.rem} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="core" name="Core" stroke={STAGE_COLORS.core} strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
              <Line type="monotone" dataKey="awake" name="Awake" stroke={STAGE_COLORS.awake} strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / worst nights */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { night: bestNight, label: 'Best Night', icon: '⭐', border: 'border-green-500/30' },
          { night: worstNight, label: 'Lightest Night', icon: '💤', border: 'border-orange-500/30' },
        ].map(({ night, label, icon, border }) => (
          <div key={label} className={`bg-surface rounded-xl border ${border} p-4`}>
            <p className="text-xs font-medium text-text-secondary mb-2">{icon} {label}</p>
            <p className="text-sm font-semibold text-text-primary">{fmtDate(night.start_time)}</p>
            <div className="mt-2 space-y-0.5 text-xs text-text-secondary">
              <p>Deep: <strong className="text-indigo-400">{stagePct(night.deep_minutes, night.duration_minutes)}%</strong></p>
              <p>REM: <strong className="text-purple-400">{stagePct(night.rem_minutes, night.duration_minutes)}%</strong></p>
              <p>Total: {fmtMin(night.duration_minutes)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Understanding Sleep Stages</p>
        <div className="space-y-2">
          {[
            { name: 'Deep Sleep (SWS)', color: 'text-indigo-400', detail: 'Slow-wave sleep is the most physically restorative stage. Muscle repair, immune function, and memory consolidation all peak here. Target 13–23% of total sleep.' },
            { name: 'REM Sleep', color: 'text-purple-400', detail: 'Rapid eye movement sleep supports emotional processing, creativity, and long-term memory. More REM in the second half of the night. Target 20–25%.' },
            { name: 'Core / Light Sleep', color: 'text-sky-400', detail: 'Light NREM sleep acts as a transition between stages. It still plays a role in memory and is essential, making up 45–60% of a healthy night.' },
            { name: 'Awake Time', color: 'text-red-400', detail: 'Brief awakenings are normal. Under 7% of the night is typical. More awakenings may indicate sleep fragmentation, stress, or sleep apnea.' },
          ].map(({ name, color, detail }) => (
            <div key={name}>
              <p className={`font-medium ${color}`}>{name}</p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">Data from Apple Watch with watchOS 9+ sleep stages enabled. Measured using accelerometer and heart rate.</p>
      </div>
    </div>
  )
}
