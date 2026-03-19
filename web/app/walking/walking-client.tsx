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
} from 'recharts'

interface Walk {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  distance_meters?: number | null
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface WalkingClientProps {
  walks: Walk[]
}

const GREEN = '#22c55e'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Format pace in min:ss /km from seconds-per-km
function fmtPaceSecs(secsPerKm: number) {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// Compute pace in seconds/km from duration_minutes and distance_meters
function computePaceSecs(durationMin: number, distanceMeters: number): number {
  if (distanceMeters <= 0) return 0
  const distKm = distanceMeters / 1000
  return (durationMin * 60) / distKm
}

// Get the Monday-week start label for a date
function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WalkingClient({ walks }: WalkingClientProps) {
  if (walks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🚶</span>
        <h2 className="text-lg font-semibold text-text-primary">No walking data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import walking workouts from Apple Health. Apple Watch logs walks
          automatically when you start a workout.
        </p>
      </div>
    )
  }

  // ─── Summary stats ───────────────────────────────────────────────────────────
  const totalSessions = walks.length
  const totalDistanceKm = walks.reduce((s, w) => s + (w.distance_meters ?? 0) / 1000, 0)
  const totalMinutes = walks.reduce((s, w) => s + w.duration_minutes, 0)
  const totalHours = totalMinutes / 60

  const walksWithDist = walks.filter((w) => (w.distance_meters ?? 0) > 0)
  const avgPaceSecs =
    walksWithDist.length > 0
      ? walksWithDist.reduce(
          (s, w) => s + computePaceSecs(w.duration_minutes, w.distance_meters ?? 0),
          0
        ) / walksWithDist.length
      : null

  // ─── Weekly volume chart (last 13 weeks) ──────────────────────────────────
  const weeklyVolume = (() => {
    const weeks: Map<string, number> = new Map()
    const now = new Date()
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.set(weekLabel(d), 0)
    }
    for (const w of walks) {
      const label = weekLabel(new Date(w.start_time))
      if (weeks.has(label)) {
        weeks.set(label, (weeks.get(label) ?? 0) + (w.distance_meters ?? 0) / 1000)
      }
    }
    return Array.from(weeks.entries()).map(([week, distKm]) => ({
      week,
      distKm: +distKm.toFixed(2),
    }))
  })()

  // ─── Pace trend (sessions with distance > 0) ─────────────────────────────
  const paceTrendData = walksWithDist.map((w) => ({
    date: fmtDate(w.start_time),
    paceSecs: +computePaceSecs(w.duration_minutes, w.distance_meters ?? 0).toFixed(0),
    paceLabel: fmtPaceSecs(
      computePaceSecs(w.duration_minutes, w.distance_meters ?? 0)
    ),
  }))

  const paceMin = paceTrendData.length
    ? Math.min(...paceTrendData.map((d) => d.paceSecs)) - 15
    : 0
  const paceMax = paceTrendData.length
    ? Math.max(...paceTrendData.map((d) => d.paceSecs)) + 15
    : 600

  // ─── Day-of-week distribution ─────────────────────────────────────────────
  const dowCounts = Array(7).fill(0) as number[]
  for (const w of walks) {
    const dow = new Date(w.start_time).getDay()
    dowCounts[dow]++
  }
  const dowData = DAY_NAMES.map((name, i) => ({ day: name, count: dowCounts[i] }))

  // ─── Recent sessions table (last 15) ─────────────────────────────────────
  const recentWalks = [...walks].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {totalDistanceKm.toFixed(1)} km
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {totalHours.toFixed(1)} h
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Time</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {avgPaceSecs !== null ? `${fmtPaceSecs(avgPaceSecs)}/km` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Pace</p>
        </div>
      </div>

      {/* Weekly distance volume bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Weekly Distance (km) — Last 13 Weeks
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyVolume} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
              width={30}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v.toFixed(1)} km`, 'Distance']}
            />
            <Bar dataKey="distKm" fill={GREEN} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pace trend chart */}
      {paceTrendData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Pace Over Time (min/km)
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <ScatterChart margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
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
                dataKey="paceSecs"
                type="number"
                domain={[paceMin, paceMax]}
                reversed
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={36}
                tickFormatter={(v: number) => fmtPaceSecs(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(_: number, __: string, props: { payload?: { paceLabel: string } }) => [
                  props.payload?.paceLabel ?? '',
                  'Pace',
                ]}
                labelFormatter={(label: string) => label}
              />
              <Scatter data={paceTrendData} fill={GREEN} opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary text-center mt-1 opacity-70">
            Lower = faster pace (Y-axis inverted)
          </p>
        </div>
      )}

      {/* Day-of-week distribution */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Sessions by Day of Week
        </h3>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={dowData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
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
              formatter={(v: number) => [v, 'Sessions']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {dowData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === Math.max(...dowData.map((d) => d.count)) ? GREEN : '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-text-secondary">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2">
                  Date
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Distance
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Pace
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Duration
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">
                  Calories
                </th>
              </tr>
            </thead>
            <tbody>
              {recentWalks.map((w, i) => {
                const distKm = (w.distance_meters ?? 0) / 1000
                const hasDistance = distKm > 0
                const paceSecs = hasDistance
                  ? computePaceSecs(w.duration_minutes, w.distance_meters ?? 0)
                  : null
                const date = new Date(w.start_time)
                return (
                  <tr
                    key={w.id}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-text-primary whitespace-nowrap">
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: GREEN }}>
                      {hasDistance ? `${distKm.toFixed(2)} km` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {paceSecs !== null ? `${fmtPaceSecs(paceSecs)}/km` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {fmtDuration(w.duration_minutes)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {(w.active_calories ?? 0) > 0
                        ? `${Math.round(w.active_calories!)} kcal`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {walks.length > 15 && (
          <p className="text-xs text-text-secondary text-center px-4 py-2">
            Showing 15 of {walks.length} sessions
          </p>
        )}
      </div>
    </div>
  )
}
