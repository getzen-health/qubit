'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

interface TennisSession {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface TennisClientProps {
  sessions: TennisSession[]
}

const TENNIS_COLOR = '#f59e0b'       // amber-400 (Tennis)
const TABLE_TENNIS_COLOR = '#f97316' // orange-500 (TableTennis)

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

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  })
}

function last12MonthKeys(): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function TennisClient({ sessions }: TennisClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🎾</span>
        <h2 className="text-lg font-semibold text-text-primary">No tennis data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import Tennis or Table Tennis workouts from Apple Health. Start a
          workout on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── 12-month window ──────────────────────────────────────────────────────
  const monthKeys = last12MonthKeys()
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  cutoff.setDate(1)
  cutoff.setHours(0, 0, 0, 0)
  const recentSessions = sessions.filter((s) => new Date(s.start_time) >= cutoff)

  const tennisSessions = recentSessions.filter((s) => s.workout_type === 'Tennis')
  const tableTennisSessions = recentSessions.filter((s) => s.workout_type === 'TableTennis')
  const hasBothTypes = tennisSessions.length > 0 && tableTennisSessions.length > 0

  // ─── Summary stats (12-month) ────────────────────────────────────────────
  const totalSessions = recentSessions.length
  const avgDuration =
    totalSessions > 0
      ? recentSessions.reduce((s, w) => s + w.duration_minutes, 0) / totalSessions
      : 0

  const sessionsWithCalories = recentSessions.filter((s) => (s.active_calories ?? 0) > 0)
  const avgKcal =
    sessionsWithCalories.length > 0
      ? sessionsWithCalories.reduce((s, w) => s + (w.active_calories ?? 0), 0) /
        sessionsWithCalories.length
      : null

  const sessionsWithHR = recentSessions.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((s, w) => s + (w.avg_heart_rate ?? 0), 0) / sessionsWithHR.length
      : null

  // ─── Monthly sessions bar chart (stacked if both types) ──────────────────
  const monthlyData = monthKeys.map((key) => {
    const label = monthLabel(key)
    const tennis = sessions.filter(
      (s) => monthKey(s.start_time) === key && s.workout_type === 'Tennis'
    ).length
    const tableTennis = sessions.filter(
      (s) => monthKey(s.start_time) === key && s.workout_type === 'TableTennis'
    ).length
    return { month: label, Tennis: tennis, TableTennis: tableTennis, total: tennis + tableTennis }
  })

  // ─── Recent sessions table (last 15 overall) ─────────────────────────────
  const recentTable = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TENNIS_COLOR }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions (12 mo)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TENNIS_COLOR }}>
            {totalSessions > 0 ? `${Math.round(avgDuration)} min` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TENNIS_COLOR }}>
            {avgKcal !== null ? `${Math.round(avgKcal)}` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TENNIS_COLOR }}>
            {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Sessions — Last 12 Months
          {hasBothTypes && (
            <span className="ml-1 opacity-70">(stacked by type)</span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
              formatter={(value: number, name: string) => [
                value,
                name === 'TableTennis' ? 'Table Tennis' : name,
              ]}
            />
            {hasBothTypes && (
              <Legend
                formatter={(value: string) =>
                  value === 'TableTennis' ? 'Table Tennis' : value
                }
                wrapperStyle={{ fontSize: 11 }}
              />
            )}
            {hasBothTypes ? (
              <>
                <Bar
                  dataKey="Tennis"
                  stackId="a"
                  fill={TENNIS_COLOR}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="TableTennis"
                  stackId="a"
                  fill={TABLE_TENNIS_COLOR}
                  radius={[3, 3, 0, 0]}
                />
              </>
            ) : (
              <Bar
                dataKey="total"
                fill={TENNIS_COLOR}
                radius={[3, 3, 0, 0]}
                name="Sessions"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
        {hasBothTypes && (
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: TENNIS_COLOR }}
              />
              Tennis
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: TABLE_TENNIS_COLOR }}
              />
              Table Tennis
            </span>
          </div>
        )}
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
              {recentTable.map((s, i) => {
                const isTableTennis = s.workout_type === 'TableTennis'
                const accentColor = isTableTennis ? TABLE_TENNIS_COLOR : TENNIS_COLOR
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
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          color: accentColor,
                          background: `${accentColor}20`,
                        }}
                      >
                        {isTableTennis ? 'Table Tennis' : 'Tennis'}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2.5 text-right tabular-nums font-medium"
                      style={{ color: accentColor }}
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
