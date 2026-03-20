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

interface MartialArtsSession {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
}

interface MartialArtsClientProps {
  sessions: MartialArtsSession[]
}

const RED = '#ef4444'
const RED_DIM = 'rgba(239,68,68,0.4)'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const SPORT_COLORS: Record<string, string> = {
  Kickboxing: '#ef4444',   // red
  MartialArts: '#f97316', // orange
  Boxing: '#ec4899',      // pink
  Wrestling: '#3b82f6',   // blue
}

const SPORT_LABELS: Record<string, string> = {
  Kickboxing: 'Kickboxing',
  MartialArts: 'Martial Arts',
  Boxing: 'Boxing',
  Wrestling: 'Wrestling',
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

function kcalPerMin(session: MartialArtsSession): number | null {
  if (!session.active_calories || session.active_calories <= 0) return null
  if (session.duration_minutes <= 0) return null
  return session.active_calories / session.duration_minutes
}

export function MartialArtsClient({ sessions }: MartialArtsClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🥊</span>
        <h2 className="text-lg font-semibold text-text-primary">No combat sports data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import martial arts workouts from Apple Health. Log Kickboxing,
          Boxing, Wrestling, or Martial Arts on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── Summary stats ─────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const avgDuration =
    sessions.reduce((s, w) => s + w.duration_minutes, 0) / totalSessions

  const sessionsWithCalories = sessions.filter((s) => (s.active_calories ?? 0) > 0)
  const avgKcalPerMin =
    sessionsWithCalories.length > 0
      ? sessionsWithCalories.reduce((sum, s) => sum + (s.active_calories! / s.duration_minutes), 0) /
        sessionsWithCalories.length
      : null

  const peakHR = sessions.reduce((max, s) => {
    const hr = s.max_heart_rate ?? 0
    return hr > max ? hr : max
  }, 0)

  // ─── Weekly sessions bar chart (last 13 weeks) ──────────────────────────
  const weeklySessions = (() => {
    const weeks: Map<string, number> = new Map()
    const now = new Date()
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.set(weekLabel(d), 0)
    }
    for (const s of sessions) {
      const label = weekLabel(new Date(s.start_time))
      if (weeks.has(label)) {
        weeks.set(label, (weeks.get(label) ?? 0) + 1)
      }
    }
    return Array.from(weeks.entries()).map(([week, count]) => ({ week, count }))
  })()

  const weeklyMax = Math.max(...weeklySessions.map((w) => w.count))

  // ─── Calorie intensity per session (last 20) ────────────────────────────
  const intensityData = sessionsWithCalories
    .slice(-20)
    .map((s) => ({
      date: fmtDate(s.start_time),
      kpm: +(s.active_calories! / s.duration_minutes).toFixed(2),
      type: s.workout_type,
    }))

  // ─── Recent sessions (last 15) ──────────────────────────────────────────
  const recentSessions = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: RED }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: RED }}>
            {Math.round(avgDuration)} min
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: RED }}>
            {avgKcalPerMin !== null ? `${avgKcalPerMin.toFixed(1)}` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal/min</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: RED }}>
            {peakHR > 0 ? `${peakHR} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Peak HR Ever</p>
        </div>
      </div>

      {/* Peak HR banner */}
      {peakHR > 0 && (
        <div
          className="rounded-2xl border p-4 flex items-center justify-between"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
        >
          <div>
            <p className="text-xs text-text-secondary">Peak Heart Rate (90 days)</p>
            <p className="text-3xl font-bold mt-0.5" style={{ color: RED }}>
              {peakHR} bpm
            </p>
          </div>
          <span className="text-4xl opacity-60">❤️‍🔥</span>
        </div>
      )}

      {/* Weekly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Weekly Sessions — Last 13 Weeks
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklySessions} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
            />
            <Bar dataKey="count" fill={RED} radius={[3, 3, 0, 0]}>
              {weeklySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count === weeklyMax && weeklyMax > 0 ? RED : RED_DIM}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calorie intensity chart */}
      {intensityData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Calorie Intensity (kcal/min) — Recent Sessions
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={intensityData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} kcal/min`, 'Intensity']}
              />
              <Bar dataKey="kpm" radius={[3, 3, 0, 0]}>
                {intensityData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={SPORT_COLORS[entry.type] ?? RED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Sport legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {Object.entries(SPORT_LABELS).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: SPORT_COLORS[key] }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Session table */}
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
                  kcal/min
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s, i) => {
                const kpm = kcalPerMin(s)
                const sportColor = SPORT_COLORS[s.workout_type] ?? RED
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
                        className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          color: sportColor,
                          background: sportColor + '1a',
                          border: `1px solid ${sportColor}44`,
                        }}
                      >
                        {SPORT_LABELS[s.workout_type] ?? s.workout_type}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2.5 text-right tabular-nums font-medium"
                      style={{ color: RED }}
                    >
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {kpm !== null ? kpm.toFixed(1) : '—'}
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
