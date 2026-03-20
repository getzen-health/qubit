'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

interface HandwashingEvent {
  id: string
  start_time: string
  value: number
  source?: string | null
}

interface HandwashingClientProps {
  events: HandwashingEvent[]
}

const TEAL = '#14b8a6'
const TEAL_DIM = 'rgba(20,184,166,0.35)'
const WHO_TARGET = 8

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

type HygieneLevel = 'Excellent' | 'Good' | 'Fair' | 'Low'

function hygieneLevel(avgPerDay: number): HygieneLevel {
  if (avgPerDay >= 8) return 'Excellent'
  if (avgPerDay >= 5) return 'Good'
  if (avgPerDay >= 2) return 'Fair'
  return 'Low'
}

const HYGIENE_COLOR: Record<HygieneLevel, string> = {
  Excellent: '#14b8a6',
  Good: '#22c55e',
  Fair: '#facc15',
  Low: '#f87171',
}

// Compute current streak of days meeting ≥ WHO_TARGET handwashes
function computeStreak(dailyMap: Map<string, number>): number {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = dailyMap.get(key) ?? 0
    if (count >= WHO_TARGET) {
      streak++
    } else if (i === 0) {
      // Allow today to not be counted yet — check yesterday
      continue
    } else {
      break
    }
  }
  return streak
}

export function HandwashingClient({ events }: HandwashingClientProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🧼</span>
        <h2 className="text-lg font-semibold text-text-primary">No handwashing data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch Series 6+ with watchOS 7+ automatically detects handwashing events and
          writes them to Apple Health. Sync your iPhone to see your data here.
        </p>
      </div>
    )
  }

  // ─── Build daily map (last 30 days) ─────────────────────────────────────
  const now = new Date()
  const dailyMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    dailyMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const e of events) {
    const key = e.start_time.slice(0, 10)
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1)
    }
  }

  // ─── Summary stats ─────────────────────────────────────────────────────
  const totalEvents = events.length
  const activeDays = [...dailyMap.values()].filter((v) => v > 0).length
  const dailyAvg = activeDays > 0 ? totalEvents / 30 : 0
  const streak = computeStreak(dailyMap)
  const level = hygieneLevel(dailyAvg)
  const levelColor = HYGIENE_COLOR[level]

  // ─── Daily events chart data ────────────────────────────────────────────
  const dailyData = [...dailyMap.entries()].map(([date, count]) => ({
    date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    count,
    meetsTarget: count >= WHO_TARGET,
  }))

  const dailyMax = Math.max(...dailyData.map((d) => d.count))

  // ─── Time-of-day histogram ──────────────────────────────────────────────
  const timeBuckets = [
    { label: 'Morning', range: '5–9 AM', min: 5, max: 9, count: 0 },
    { label: 'Mid-AM', range: '9–12 PM', min: 9, max: 12, count: 0 },
    { label: 'Afternoon', range: '12–5 PM', min: 12, max: 17, count: 0 },
    { label: 'Evening', range: '5–9 PM', min: 17, max: 21, count: 0 },
    { label: 'Night', range: '9 PM+', min: 21, max: 29, count: 0 },
  ]
  for (const e of events) {
    const hour = new Date(e.start_time).getHours()
    const h = hour < 5 ? hour + 24 : hour
    for (const bucket of timeBuckets) {
      if (h >= bucket.min && h < bucket.max) {
        bucket.count++
        break
      }
    }
  }
  const todMax = Math.max(...timeBuckets.map((b) => b.count))
  const todData = timeBuckets.map((b) => ({ label: b.label, range: b.range, count: b.count }))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TEAL }}>
            {totalEvents}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Events</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TEAL }}>
            {dailyAvg.toFixed(1)}/day
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Daily Average</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{streak}d</p>
          <p className="text-xs text-text-secondary mt-0.5">Streak (≥{WHO_TARGET}/day)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: levelColor }}>
            {level}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Hygiene Level</p>
        </div>
      </div>

      {/* Hygiene level banner */}
      <div
        className="rounded-2xl border p-4 flex items-center justify-between"
        style={{ background: levelColor + '0d', borderColor: levelColor + '44' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: levelColor }}>
            Hygiene Level
          </p>
          <p className="text-xl font-bold text-text-primary mt-0.5">{level}</p>
          <p className="text-xs text-text-secondary mt-1">
            {dailyAvg.toFixed(1)} washes/day average · WHO target: {WHO_TARGET}/day
          </p>
          <div className="flex gap-2 flex-wrap mt-2">
            {(['Low', 'Fair', 'Good', 'Excellent'] as HygieneLevel[]).map((l) => (
              <span
                key={l}
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  color: l === level ? HYGIENE_COLOR[l] : undefined,
                  borderColor: l === level ? HYGIENE_COLOR[l] + '88' : 'var(--color-border)',
                  background: l === level ? HYGIENE_COLOR[l] + '22' : undefined,
                  fontWeight: l === level ? 600 : 400,
                  opacity: l === level ? 1 : 0.5,
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <span className="text-4xl opacity-60">🧼</span>
      </div>

      {/* Daily events bar chart with WHO target line */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary">Daily Handwashing Events</h3>
          <span
            className="text-xs rounded-full px-2 py-0.5 border"
            style={{ color: TEAL, borderColor: TEAL + '44', background: TEAL + '11' }}
          >
            WHO target: {WHO_TARGET}/day
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
              allowDecimals={false}
              domain={[0, Math.max(dailyMax + 2, WHO_TARGET + 2)]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Handwashes']}
            />
            <ReferenceLine
              y={WHO_TARGET}
              stroke={TEAL}
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{
                value: `WHO ${WHO_TARGET}/day`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: TEAL,
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {dailyData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.meetsTarget ? TEAL : TEAL_DIM}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-secondary text-center mt-1 opacity-60">
          Teal bars = met WHO target · Dim bars = below target
        </p>
      </div>

      {/* Time-of-day histogram */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Time of Day</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={todData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, props: { payload?: { range: string } }) => [
                `${v} events`,
                props.payload?.range ?? '',
              ]}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {todData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === todMax && todMax > 0 ? TEAL : TEAL_DIM}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary opacity-70">
          {todData.map((b) => (
            <span key={b.label}>
              {b.label}: {b.range}
            </span>
          ))}
        </div>
      </div>

      {/* Science card */}
      <div className="bg-surface rounded-2xl border border-teal-500/30 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-700/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide">
              CDC &amp; WHO Guidelines
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Proper handwashing is one of the most effective ways to prevent the spread of
            infections. The CDC recommends washing hands with soap and water for at least 20
            seconds. The WHO promotes 8 or more handwashing events per day as a target for
            good hand hygiene.
          </p>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            <li className="flex gap-2">
              <span className="text-teal-400 shrink-0">•</span>
              <span>
                <strong className="text-text-primary">Disease prevention:</strong> Handwashing
                can reduce diarrheal illness by up to 40% and respiratory infections by up to
                21% (CDC).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-400 shrink-0">•</span>
              <span>
                <strong className="text-text-primary">Key moments:</strong> Before eating, after
                using the toilet, after coughing/sneezing, after touching animals, and before
                and after caring for someone who is sick.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-400 shrink-0">•</span>
              <span>
                <strong className="text-text-primary">Apple Watch detection:</strong> Series 6+
                running watchOS 7+ uses the accelerometer and microphone to automatically detect
                handwashing motions and tracks 20-second wash durations.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
