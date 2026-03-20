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

interface WaterSportsClientProps {
  sessions: Session[]
}

const BLUE = '#3b82f6'

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

type SportKey = 'SurfingSports' | 'PaddleSports' | 'WaterFitness' | 'WaterSports'

const SPORT_LABELS: Record<SportKey, string> = {
  SurfingSports: 'Surfing',
  PaddleSports: 'Paddleboarding',
  WaterFitness: 'Water Fitness',
  WaterSports: 'Water Sports',
}

const SPORT_COLORS: Record<SportKey, string> = {
  SurfingSports: '#3b82f6',   // blue
  PaddleSports: '#14b8a6',    // teal
  WaterFitness: '#06b6d4',    // cyan
  WaterSports: '#6366f1',     // indigo
}

function sportLabel(type: string): string {
  return SPORT_LABELS[type as SportKey] ?? type
}

function sportColor(type: string): string {
  return SPORT_COLORS[type as SportKey] ?? BLUE
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function WaterSportsClient({ sessions }: WaterSportsClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏄</span>
        <h2 className="text-lg font-semibold text-text-primary">No water sports data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import surfing, paddleboarding, water fitness, and water sports
          workouts from Apple Health.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalDistanceKm = sessions.reduce((s, w) => s + (w.distance_meters ?? 0) / 1000, 0)
  const totalMinutes = sessions.reduce((s, w) => s + w.duration_minutes, 0)
  const avgDuration = Math.round(totalMinutes / totalSessions)

  const sessionsWithCal = sessions.filter((s) => (s.active_calories ?? 0) > 0)
  const avgKcal =
    sessionsWithCal.length > 0
      ? Math.round(
          sessionsWithCal.reduce((sum, s) => sum + (s.active_calories ?? 0), 0) /
            sessionsWithCal.length
        )
      : null

  const sessionsWithHR = sessions.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? Math.round(
          sessionsWithHR.reduce((sum, s) => sum + (s.avg_heart_rate ?? 0), 0) /
            sessionsWithHR.length
        )
      : null

  // ─── Sport breakdown ──────────────────────────────────────────────────────
  const sportCounts: Record<string, number> = {}
  for (const s of sessions) {
    sportCounts[s.workout_type] = (sportCounts[s.workout_type] ?? 0) + 1
  }
  const breakdownData = Object.entries(sportCounts)
    .map(([type, count]) => ({ name: sportLabel(type), count, color: sportColor(type) }))
    .sort((a, b) => b.count - a.count)

  // ─── Monthly sessions bar chart (last 12 months) ─────────────────────────
  const monthlySessions = (() => {
    const months: Map<string, number> = new Map()
    const now = new Date()
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

  // ─── Recent sessions (last 15) ────────────────────────────────────────────
  const recent = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BLUE }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">
            {totalDistanceKm.toFixed(1)} km
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total km</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-300">{avgDuration} min</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">
            {avgKcal !== null ? `${avgKcal}` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">
            {avgHR !== null ? `${avgHR} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Sport breakdown */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Sport Breakdown</h3>
        <div className="space-y-3">
          {breakdownData.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-28 shrink-0">{d.name}</span>
              <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((d.count / totalSessions) * 100)}%`,
                    backgroundColor: d.color,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-text-primary w-6 text-right shrink-0">
                {d.count}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-text-secondary">
          {breakdownData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} ({Math.round((d.count / totalSessions) * 100)}%)
            </div>
          ))}
        </div>
      </div>

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Sessions — Last 12 Months
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlySessions} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
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
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {monthlySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.count === Math.max(...monthlySessions.map((m) => m.count))
                      ? BLUE
                      : 'rgba(59,130,246,0.4)'
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
                <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Sport
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Duration
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  kcal
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((s) => {
                const color = sportColor(s.workout_type)
                const label = sportLabel(s.workout_type)
                return (
                  <tr key={s.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {new Date(s.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{
                          color,
                          backgroundColor: color + '22',
                          border: `1px solid ${color}44`,
                        }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
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
