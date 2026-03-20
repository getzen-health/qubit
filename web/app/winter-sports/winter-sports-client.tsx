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

interface WinterSession {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface WinterSportsClientProps {
  sessions: WinterSession[]
}

// ─── Sport config ────────────────────────────────────────────────────────────
const SPORT_CONFIG: Record<string, { label: string; color: string }> = {
  DownhillSkiing: { label: 'Downhill Skiing', color: '#3b82f6' },   // blue
  CrossCountrySkiing: { label: 'Cross-Country', color: '#22d3ee' }, // cyan
  Snowboarding: { label: 'Snowboarding', color: '#f97316' },        // orange
  SnowSports: { label: 'Snow Sports', color: '#6ee7b7' },           // mint
  SkatingSports: { label: 'Ice Skating', color: '#a78bfa' },        // purple
}

const ICE_BLUE = '#3b82f6'

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

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' })
}

export function WinterSportsClient({ sessions }: WinterSportsClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">⛷️</span>
        <h2 className="text-lg font-semibold text-text-primary">No winter sports data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import winter sports workouts from Apple Health. Start a skiing,
          snowboarding, or skating workout on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── All-time summary stats ───────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, w) => s + w.duration_minutes, 0)
  const avgDuration = totalMinutes / totalSessions

  const sessionsWithCalories = sessions.filter((s) => (s.active_calories ?? 0) > 0)
  const avgKcal =
    sessionsWithCalories.length > 0
      ? sessionsWithCalories.reduce((sum, s) => sum + (s.active_calories ?? 0), 0) /
        sessionsWithCalories.length
      : null

  const sessionsWithHR = sessions.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((sum, s) => sum + (s.avg_heart_rate ?? 0), 0) / sessionsWithHR.length
      : null

  // ─── Sport breakdown ──────────────────────────────────────────────────────
  const sportCounts: Record<string, number> = {}
  for (const s of sessions) {
    sportCounts[s.workout_type] = (sportCounts[s.workout_type] ?? 0) + 1
  }
  const sportBreakdown = Object.entries(sportCounts)
    .map(([type, count]) => ({
      type,
      label: SPORT_CONFIG[type]?.label ?? type,
      color: SPORT_CONFIG[type]?.color ?? ICE_BLUE,
      count,
      pct: Math.round((count / totalSessions) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  // ─── Monthly sessions bar chart (last 24 months) ─────────────────────────
  const monthlySessions = (() => {
    const months: Map<string, number> = new Map()
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
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

  const maxMonthlyCount = Math.max(...monthlySessions.map((m) => m.count))

  // ─── Recent sessions table (last 15) ─────────────────────────────────────
  const recentSessions = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* All-time summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ICE_BLUE }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ICE_BLUE }}>
            {Math.round(avgDuration)} min
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ICE_BLUE }}>
            {avgKcal !== null ? `${Math.round(avgKcal)}` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ICE_BLUE }}>
            {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Sport breakdown bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Sport Breakdown</h3>
        <div className="space-y-3">
          {sportBreakdown.map((sport) => (
            <div key={sport.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: sport.color }}>
                  {sport.label}
                </span>
                <span className="text-xs text-text-secondary tabular-nums">
                  {sport.count} session{sport.count !== 1 ? 's' : ''} · {sport.pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${sport.pct}%`, background: sport.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Monthly Sessions — Last 2 Years
        </h3>
        <p className="text-xs text-text-secondary mb-3 opacity-70">
          Seasonal sport — expect data only in winter months
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlySessions} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
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
              {monthlySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.count > 0 && entry.count === maxMonthlyCount
                      ? ICE_BLUE
                      : entry.count > 0
                      ? 'rgba(59,130,246,0.5)'
                      : 'rgba(59,130,246,0.1)'
                  }
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
                <th className="text-left text-xs text-text-secondary font-medium px-3 py-2">
                  Sport
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Duration
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  kcal
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s, i) => {
                const cfg = SPORT_CONFIG[s.workout_type]
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-text-primary whitespace-nowrap">
                      {new Date(s.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          color: cfg?.color ?? ICE_BLUE,
                          background: `${cfg?.color ?? ICE_BLUE}20`,
                        }}
                      >
                        {cfg?.label ?? s.workout_type}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2.5 text-right tabular-nums font-medium"
                      style={{ color: ICE_BLUE }}
                    >
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
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
