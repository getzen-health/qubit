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

interface DanceSession {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface DanceClientProps {
  sessions: DanceSession[]
}

const PINK = '#ec4899'

const TYPE_META: Record<string, { label: string; color: string }> = {
  Dance: { label: 'Dance', color: '#ec4899' },
  SocialDance: { label: 'Social Dance', color: '#a855f7' },
  StepTraining: { label: 'Step Training', color: '#f43f5e' },
}

function typeLabel(workoutType: string): string {
  return TYPE_META[workoutType]?.label ?? workoutType
}

function typeColor(workoutType: string): string {
  return TYPE_META[workoutType]?.color ?? PINK
}

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
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function DanceClient({ sessions }: DanceClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💃</span>
        <h2 className="text-lg font-semibold text-text-primary">No dance data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import dance workouts from Apple Health. Start a Dance, Social Dance,
          or Step Training workout on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
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

  // ─── Monthly sessions bar chart (last 12 months) ────────────────────────
  const monthlySessions = (() => {
    const months: Map<string, number> = new Map()
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.set(monthLabel(d), 0)
    }
    for (const s of sessions) {
      const label = monthLabel(new Date(s.start_time))
      if (months.has(label)) {
        months.set(label, (months.get(label) ?? 0) + 1)
      }
    }
    return Array.from(months.entries()).map(([month, count]) => ({ month, count }))
  })()

  // ─── Activity type breakdown ─────────────────────────────────────────────
  const typeCounts: Record<string, number> = {}
  for (const s of sessions) {
    typeCounts[s.workout_type] = (typeCounts[s.workout_type] ?? 0) + 1
  }
  const typeBreakdown = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      label: typeLabel(type),
      count,
      color: typeColor(type),
      pct: Math.round((count / totalSessions) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  // ─── Recent sessions (last 15) ───────────────────────────────────────────
  const recentSessions = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PINK }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PINK }}>
            {Math.round(avgDuration)} min
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PINK }}>
            {avgKcal !== null ? `${Math.round(avgKcal)} kcal` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: PINK }}>
            {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Sessions — Last 12 Months
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlySessions} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
            />
            <Bar dataKey="count" fill={PINK} radius={[3, 3, 0, 0]}>
              {monthlySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.count === Math.max(...monthlySessions.map((m) => m.count))
                      ? PINK
                      : 'rgba(236,72,153,0.45)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity type breakdown */}
      {typeBreakdown.length > 1 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Activity Type Breakdown</h3>
          <div className="space-y-3">
            {typeBreakdown.map((t) => (
              <div key={t.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: t.color }}>
                    {t.label}
                  </span>
                  <span className="text-xs text-text-secondary tabular-nums">
                    {t.count} session{t.count !== 1 ? 's' : ''} · {t.pct}%
                  </span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${t.pct}%`, background: t.color, opacity: 0.85 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity type breakdown (single type — compact pill) */}
      {typeBreakdown.length === 1 && (
        <div className="flex flex-wrap gap-2">
          {typeBreakdown.map((t) => (
            <span
              key={t.type}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44` }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: t.color }}
              />
              {t.label} · {t.count} session{t.count !== 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}

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
                  Type
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
                const color = typeColor(s.workout_type)
                const label = typeLabel(s.workout_type)
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
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${color}22`, color }}
                      >
                        {label}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2.5 text-right tabular-nums font-medium"
                      style={{ color }}
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
