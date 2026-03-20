'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

interface Session {
  id: string
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface OpenWaterClientProps {
  sessions: Session[]
}

const CYAN = '#06b6d4'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Pace in seconds per 100m
function pacePer100m(durationMin: number, distanceMeters: number): number {
  if (distanceMeters <= 0) return 0
  return (durationMin * 60) / (distanceMeters / 100)
}

// Format pace as mm:ss /100m
function fmtPace(secsPer100m: number): string {
  const min = Math.floor(secsPer100m / 60)
  const sec = Math.round(secsPer100m % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function OpenWaterClient({ sessions }: OpenWaterClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🌊</span>
        <h2 className="text-lg font-semibold text-text-primary">No open water swim data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import open water swimming workouts from Apple Health. Sessions with
          distances over 200 m appear here.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const sessionsWithDist = sessions.filter((s) => (s.distance_meters ?? 0) > 0)
  const totalDistanceKm =
    sessionsWithDist.reduce((sum, s) => sum + (s.distance_meters ?? 0), 0) / 1000

  const paceValues = sessionsWithDist.map((s) =>
    pacePer100m(s.duration_minutes, s.distance_meters ?? 0)
  )
  const avgPaceSecs =
    paceValues.length > 0 ? paceValues.reduce((a, b) => a + b, 0) / paceValues.length : null
  const bestPaceSecs = paceValues.length > 0 ? Math.min(...paceValues) : null

  const sessionsWithHR = sessions.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? Math.round(
          sessionsWithHR.reduce((sum, s) => sum + (s.avg_heart_rate ?? 0), 0) /
            sessionsWithHR.length
        )
      : null

  // ─── Pace trend line chart ─────────────────────────────────────────────────
  const paceTrendData = sessionsWithDist.map((s) => {
    const secs = pacePer100m(s.duration_minutes, s.distance_meters ?? 0)
    return {
      date: fmtDate(s.start_time),
      paceSecs: +secs.toFixed(1),
      paceLabel: fmtPace(secs),
    }
  })

  const paceMin = paceTrendData.length
    ? Math.max(0, Math.min(...paceTrendData.map((d) => d.paceSecs)) - 5)
    : 0
  const paceMax = paceTrendData.length
    ? Math.max(...paceTrendData.map((d) => d.paceSecs)) + 5
    : 120

  // ─── Monthly distance bar chart (last 12 months) ──────────────────────────
  const monthlyDistance = (() => {
    const months: Map<string, number> = new Map()
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.set(monthLabel(d), 0)
    }
    for (const s of sessions) {
      const label = monthLabel(new Date(s.start_time))
      if (months.has(label)) {
        months.set(
          label,
          (months.get(label) ?? 0) + (s.distance_meters ?? 0) / 1000
        )
      }
    }
    return Array.from(months.entries()).map(([month, distKm]) => ({
      month,
      distKm: +distKm.toFixed(2),
    }))
  })()

  // ─── Recent sessions (last 15) ────────────────────────────────────────────
  const recent = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: CYAN }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-cyan-300">
            {totalDistanceKm.toFixed(1)} km
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total km</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-sky-400">
            {avgPaceSecs !== null ? `${fmtPace(avgPaceSecs)}/100m` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Pace</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">
            {bestPaceSecs !== null ? `${fmtPace(bestPaceSecs)}/100m` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Best Pace</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {avgHR !== null ? `${avgHR} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Pace trend line chart */}
      {paceTrendData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Pace Trend — per 100 m (lower = faster)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={paceTrendData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
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
                dataKey="paceSecs"
                domain={[paceMin, paceMax]}
                reversed
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={36}
                tickFormatter={(v: number) => fmtPace(v)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(_: number, __: string, props: { payload?: { paceLabel: string } }) => [
                  props.payload?.paceLabel ?? '',
                  '/100 m',
                ]}
                labelFormatter={(label: string) => label}
              />
              <Line
                type="monotone"
                dataKey="paceSecs"
                stroke={CYAN}
                strokeWidth={2}
                dot={{ r: 3, fill: CYAN, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary text-center mt-1 opacity-70">
            Y-axis inverted — lower position = faster pace
          </p>
        </div>
      )}

      {/* Monthly distance bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Distance (km) — Last 12 Months
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyDistance} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={32}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v.toFixed(2)} km`, 'Distance']}
            />
            <Bar dataKey="distKm" radius={[3, 3, 0, 0]}>
              {monthlyDistance.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.distKm === Math.max(...monthlyDistance.map((m) => m.distKm))
                      ? CYAN
                      : 'rgba(6,182,212,0.4)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Date
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  km
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Duration
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  /100 m
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((s) => {
                const distKm = (s.distance_meters ?? 0) / 1000
                const hasDist = distKm > 0
                const pace = hasDist
                  ? pacePer100m(s.duration_minutes, s.distance_meters ?? 0)
                  : null
                return (
                  <tr key={s.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {new Date(s.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-xs font-medium tabular-nums"
                      style={{ color: CYAN }}
                    >
                      {hasDist ? `${distKm.toFixed(2)} km` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {pace !== null ? `${fmtPace(pace)}/100m` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {(s.avg_heart_rate ?? 0) > 0
                        ? `${Math.round(s.avg_heart_rate!)} bpm`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {sessions.length > 15 && (
          <p className="text-xs text-text-secondary text-center px-4 py-2">
            Showing 15 of {sessions.length} sessions
          </p>
        )}
      </div>
    </div>
  )
}
