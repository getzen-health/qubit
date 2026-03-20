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

interface Session {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  distance_meters?: number | null
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface StairClimbingClientProps {
  sessions: Session[]
}

const ORANGE = '#f97316'

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

function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function intensityColor(kcalPerMin: number): string {
  if (kcalPerMin < 6) return '#22c55e'
  if (kcalPerMin < 8) return '#eab308'
  if (kcalPerMin < 10) return '#f97316'
  return '#ef4444'
}

export function StairClimbingClient({ sessions }: StairClimbingClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🪜</span>
        <h2 className="text-lg font-semibold text-text-primary">No stair climbing data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import stair climbing workouts from Apple Health. Apple Watch logs
          these automatically when you start a stair climber workout.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, r) => s + r.duration_minutes, 0)
  const totalHours = +(totalMinutes / 60).toFixed(1)
  const avgDuration = Math.round(totalMinutes / totalSessions)

  const sessionsWithCal = sessions.filter(
    (s) => (s.active_calories ?? 0) > 0 && s.duration_minutes > 0
  )
  const avgKcalPerMin =
    sessionsWithCal.length > 0
      ? sessionsWithCal.reduce(
          (sum, s) => sum + (s.active_calories ?? 0) / s.duration_minutes,
          0
        ) / sessionsWithCal.length
      : null

  // ─── Weekly sessions (last 13 weeks) ──────────────────────────────────────
  const now = new Date()
  const todayDow = now.getDay()
  const daysSinceMonday = (todayDow + 6) % 7
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - daysSinceMonday)
  thisMonday.setHours(0, 0, 0, 0)

  const weeklyCounts: { week: string; sessions: number }[] = []
  for (let w = 12; w >= 0; w--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = sessions.filter((r) => {
      const d = new Date(r.start_time)
      return d >= weekStart && d < weekEnd
    }).length

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeklyCounts.push({ week: label, sessions: count })
  }

  // ─── Calorie intensity per session ────────────────────────────────────────
  const intensityData = sessionsWithCal.map((s) => {
    const kcalPerMin = (s.active_calories ?? 0) / s.duration_minutes
    return {
      date: fmtDate(s.start_time),
      kcalPerMin: +kcalPerMin.toFixed(2),
      color: intensityColor(kcalPerMin),
    }
  })

  // ─── Recent sessions (last 15) ────────────────────────────────────────────
  const recent = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{totalHours}h</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-300">{avgDuration} min</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-red-400">
            {avgKcalPerMin !== null ? `${avgKcalPerMin.toFixed(1)} kcal/m` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Intensity</p>
        </div>
      </div>

      {/* Weekly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Weekly Sessions — Last 13 Weeks
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyCounts} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
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
              width={20}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
              labelFormatter={(label: string) => `Week of ${label}`}
            />
            <Bar dataKey="sessions" fill={ORANGE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calorie burn intensity chart */}
      {intensityData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">
            Calorie Burn Intensity (kcal/min per session)
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              &lt;6 — Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              6–8 — Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ORANGE }} />
              8–10 — High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              &gt;10 — Very High
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
                  kcal/min
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  HR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((s) => {
                const kcalPerMin =
                  (s.active_calories ?? 0) > 0 && s.duration_minutes > 0
                    ? (s.active_calories ?? 0) / s.duration_minutes
                    : null
                const color = kcalPerMin !== null ? intensityColor(kcalPerMin) : undefined
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
                    <td className="px-3 py-2.5 text-right text-xs text-text-primary font-medium">
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-xs font-medium tabular-nums"
                      style={{ color: color ?? 'var(--color-text-secondary)' }}
                    >
                      {kcalPerMin !== null ? kcalPerMin.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-secondary">
                      {s.avg_heart_rate && s.avg_heart_rate > 0
                        ? `${s.avg_heart_rate} bpm`
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
