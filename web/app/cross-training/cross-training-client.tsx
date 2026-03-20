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

interface CrossTrainingSession {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface CrossTrainingClientProps {
  sessions: CrossTrainingSession[]
}

const RED = '#ef4444'
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

function kcalPerMin(session: CrossTrainingSession): number | null {
  if (!session.active_calories || session.active_calories <= 0) return null
  if (session.duration_minutes <= 0) return null
  return session.active_calories / session.duration_minutes
}

function intensityColor(kpm: number): string {
  if (kpm < 6) return '#fbbf24'   // amber — light effort
  if (kpm < 9) return '#f97316'   // orange — moderate
  if (kpm < 12) return '#ef4444'  // red — hard
  return '#b91c1c'                 // dark red — very hard
}

export function CrossTrainingClient({ sessions }: CrossTrainingClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">⚡</span>
        <h2 className="text-lg font-semibold text-text-primary">No cross-training data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import cross-training and mixed cardio workouts from Apple Health.
          Log a CrossTraining or MixedCardio workout on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── 90-day summary stats ─────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, w) => s + w.duration_minutes, 0)
  const totalHours = totalMinutes / 60

  const sessionsWithCalories = sessions.filter(
    (s) => (s.active_calories ?? 0) > 0 && s.duration_minutes > 0
  )
  const avgKcalPerMin =
    sessionsWithCalories.length > 0
      ? sessionsWithCalories.reduce(
          (sum, s) => sum + (s.active_calories! / s.duration_minutes),
          0
        ) / sessionsWithCalories.length
      : null

  const sessionsWithHR = sessions.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((sum, s) => sum + s.avg_heart_rate!, 0) / sessionsWithHR.length
      : null

  // ─── Weekly sessions bar chart (last 90 days = ~13 weeks) ────────────────
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

  // ─── Calorie intensity scatter ────────────────────────────────────────────
  const scatterData = sessions
    .map((s) => {
      const kpm = kcalPerMin(s)
      if (kpm === null) return null
      return {
        date: fmtDate(s.start_time),
        duration: s.duration_minutes,
        kpm: +kpm.toFixed(2),
        calories: Math.round(s.active_calories ?? 0),
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)

  // ─── Recent sessions (last 15) ────────────────────────────────────────────
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
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {totalHours.toFixed(1)} h
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: RED }}>
            {avgKcalPerMin !== null ? avgKcalPerMin.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal/min</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Weekly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Weekly Sessions — Last 90 Days
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
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {weeklySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.count === Math.max(...weeklySessions.map((w) => w.count))
                      ? RED
                      : ORANGE
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Calorie intensity scatter chart */}
      {scatterData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">
            Calorie Intensity per Session
          </h3>
          <p className="text-xs text-text-secondary mb-3 opacity-70">
            Each dot is a session. Color = kcal/min intensity.
          </p>
          <ResponsiveContainer width="100%" height={160}>
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
                dataKey="kpm"
                type="number"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={36}
                tickFormatter={(v: number) => `${v.toFixed(1)}`}
                label={{
                  value: 'kcal/min',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 12,
                  style: { fontSize: 10, fill: 'var(--color-text-secondary)' },
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number, name: string) => {
                  if (name === 'kpm') return [`${value.toFixed(1)} kcal/min`, 'Intensity']
                  if (name === 'calories') return [`${value} kcal`, 'Calories']
                  return [value, name]
                }}
                labelFormatter={(label: string) => label}
              />
              <Scatter data={scatterData} opacity={0.9}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={intensityColor(entry.kpm)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" /> &lt;6 kcal/min
            </span>
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" /> 6–9
            </span>
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> 9–12
            </span>
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-800" /> &gt;12
            </span>
          </div>
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
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Duration
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Calories
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  kcal/min
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s, i) => {
                const kpm = kcalPerMin(s)
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
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium" style={{ color: RED }}>
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {kpm !== null ? (
                        <span style={{ color: intensityColor(kpm) }}>
                          {kpm.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {(s.avg_heart_rate ?? 0) > 0 ? `${Math.round(s.avg_heart_rate!)} bpm` : '—'}
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
