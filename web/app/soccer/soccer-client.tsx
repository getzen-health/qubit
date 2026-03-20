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
} from 'recharts'

interface SoccerSession {
  id: string
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  active_calories?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
}

interface SoccerClientProps {
  sessions: SoccerSession[]
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

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function intensityColor(kcalPerMin: number): string {
  if (kcalPerMin < 6) return '#22c55e'   // green
  if (kcalPerMin < 9) return '#eab308'   // yellow
  if (kcalPerMin < 12) return '#f97316'  // orange
  return '#ef4444'                        // red
}

export function SoccerClient({ sessions }: SoccerClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">⚽</span>
        <h2 className="text-lg font-semibold text-text-primary">No soccer data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import soccer workouts from Apple Health. Start a Soccer workout on
          your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── 12-month window ──────────────────────────────────────────────────────
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const sessionsLast12 = sessions.filter(
    (s) => new Date(s.start_time) >= twelveMonthsAgo
  )

  // ─── Summary stats (12-month) ─────────────────────────────────────────────
  const totalSessions = sessionsLast12.length
  const totalDistanceKm = sessionsLast12.reduce(
    (s, w) => s + (w.distance_meters ?? 0) / 1000,
    0
  )
  const totalMinutes = sessionsLast12.reduce((s, w) => s + w.duration_minutes, 0)
  const avgDuration = totalSessions > 0 ? totalMinutes / totalSessions : 0

  const sessionsWithCal = sessionsLast12.filter(
    (s) => (s.active_calories ?? 0) > 0 && s.duration_minutes > 0
  )
  const avgKcal =
    sessionsWithCal.length > 0
      ? sessionsWithCal.reduce((sum, s) => sum + (s.active_calories ?? 0), 0) /
        sessionsWithCal.length
      : null

  const sessionsWithHR = sessionsLast12.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((sum, s) => sum + (s.avg_heart_rate ?? 0), 0) /
        sessionsWithHR.length
      : null

  const peakHREver =
    sessions.reduce((max, s) => Math.max(max, s.max_heart_rate ?? 0), 0) || null

  // ─── Monthly sessions bar chart (last 12 months) ──────────────────────────
  const monthlyCounts = (() => {
    const months: Map<string, number> = new Map()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.set(monthLabel(d), 0)
    }
    for (const s of sessions) {
      const d = new Date(s.start_time)
      const label = monthLabel(d)
      if (months.has(label)) {
        months.set(label, (months.get(label) ?? 0) + 1)
      }
    }
    return Array.from(months.entries()).map(([month, count]) => ({ month, count }))
  })()

  // ─── Calorie intensity bar chart (last 20 sessions with calories) ─────────
  const intensityData = sessionsWithCal
    .slice(-20)
    .map((s) => {
      const kcalPerMin = (s.active_calories ?? 0) / s.duration_minutes
      return {
        date: fmtDate(s.start_time),
        kcalPerMin: +kcalPerMin.toFixed(2),
        color: intensityColor(kcalPerMin),
      }
    })

  // ─── Recent sessions (last 20) ────────────────────────────────────────────
  const recentSessions = [...sessions].reverse().slice(0, 20)

  return (
    <div className="space-y-6">
      {/* Summary cards — 12-month */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {totalDistanceKm.toFixed(1)} km
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-300">
            {Math.round(avgDuration)} min
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-lime-400">
            {avgKcal !== null ? Math.round(avgKcal) : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">
            {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-red-400">
            {peakHREver !== null ? `${peakHREver} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Peak HR Ever</p>
        </div>
      </div>
      <p className="text-xs text-text-secondary -mt-3 text-right opacity-60">
        Summary based on last 12 months
      </p>

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Sessions — Last 12 Months
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyCounts} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
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
              width={20}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="count" fill={GREEN} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calorie intensity chart */}
      {intensityData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">
            Calorie Burn Intensity (kcal/min) — Last 20 Sessions
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              &lt;6 — Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              6–9 — Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              9–12 — High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              &gt;12 — Very High
            </span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={intensityData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
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
                width={28}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(1)} kcal/min`, 'Intensity']}
              />
              <Bar dataKey="kcalPerMin" radius={[3, 3, 0, 0]}>
                {intensityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
                  Duration
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Calories
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Distance
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Avg HR
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Peak HR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentSessions.map((s) => {
                const distKm = (s.distance_meters ?? 0) / 1000
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-surface-secondary/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {new Date(s.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-xs font-medium tabular-nums"
                      style={{ color: GREEN }}
                    >
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {distKm > 0 ? `${distKm.toFixed(2)} km` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {(s.avg_heart_rate ?? 0) > 0 ? `${s.avg_heart_rate} bpm` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums">
                      {(s.max_heart_rate ?? 0) > 0 ? (
                        <span className="text-red-400">{s.max_heart_rate} bpm</span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {sessions.length > 20 && (
          <p className="text-xs text-text-secondary text-center px-4 py-2">
            Showing 20 of {sessions.length} sessions
          </p>
        )}
      </div>
    </div>
  )
}
