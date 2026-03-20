'use client'

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface RacquetSession {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface RacquetClientProps {
  sessions: RacquetSession[]
}

// Sport color palette
const SPORT_COLORS: Record<string, string> = {
  Pickleball:  '#22c55e', // green
  Badminton:   '#eab308', // yellow
  Racquetball: '#3b82f6', // blue
  Squash:      '#f97316', // orange
}

const SPORT_LABELS: Record<string, string> = {
  Pickleball:  'Pickleball',
  Badminton:   'Badminton',
  Racquetball: 'Racquetball',
  Squash:      'Squash',
}

const ALL_SPORTS = ['Pickleball', 'Badminton', 'Racquetball', 'Squash'] as const

const GREEN = '#22c55e'

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

function sportColor(type: string): string {
  return SPORT_COLORS[type] ?? '#94a3b8'
}

export function RacquetClient({ sessions }: RacquetClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏸</span>
        <h2 className="text-lg font-semibold text-text-primary">No racquet sport data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import Pickleball, Badminton, Racquetball, or Squash workouts from
          Apple Health. Start a workout on your Apple Watch to begin tracking.
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
  const recent12m = sessions.filter((s) => new Date(s.start_time) >= cutoff)

  // ─── Summary stats (12-month) ────────────────────────────────────────────
  const totalSessions = recent12m.length
  const avgDuration =
    totalSessions > 0
      ? recent12m.reduce((s, w) => s + w.duration_minutes, 0) / totalSessions
      : 0

  const sessionsWithCalories = recent12m.filter((s) => (s.active_calories ?? 0) > 0)
  const avgKcal =
    sessionsWithCalories.length > 0
      ? sessionsWithCalories.reduce((s, w) => s + (w.active_calories ?? 0), 0) /
        sessionsWithCalories.length
      : null

  const sessionsWithHR = recent12m.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((s, w) => s + (w.avg_heart_rate ?? 0), 0) / sessionsWithHR.length
      : null

  // ─── Sport breakdown (all-time counts) ───────────────────────────────────
  const sportCounts = ALL_SPORTS.map((sport) => ({
    sport,
    count: sessions.filter((s) => s.workout_type === sport).length,
  })).filter((d) => d.count > 0)

  const totalCount = sportCounts.reduce((s, d) => s + d.count, 0)
  const sportBreakdown = sportCounts.map((d) => ({
    ...d,
    pct: totalCount > 0 ? ((d.count / totalCount) * 100).toFixed(1) : '0.0',
    color: sportColor(d.sport),
  }))

  const activeSports = ALL_SPORTS.filter((s) =>
    sessions.some((r) => r.workout_type === s)
  )
  const hasMultipleSports = activeSports.length > 1

  // ─── Monthly sessions bar chart (stacked by sport) ───────────────────────
  const monthlyData = monthKeys.map((key) => {
    const label = monthLabel(key)
    const entry: Record<string, string | number> = { month: label }
    let total = 0
    for (const sport of ALL_SPORTS) {
      const count = sessions.filter(
        (s) => monthKey(s.start_time) === key && s.workout_type === sport
      ).length
      entry[sport] = count
      total += count
    }
    entry.total = total
    return entry
  })

  // ─── Recent sessions (last 15 overall) ───────────────────────────────────
  const recentTable = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions (12 mo)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {totalSessions > 0 ? `${Math.round(avgDuration)} min` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {avgKcal !== null ? `${Math.round(avgKcal)}` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
        </div>
      </div>

      {/* Sport breakdown */}
      {sportBreakdown.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            Sport Breakdown (All-Time)
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Pie chart */}
            <div className="shrink-0">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={sportBreakdown}
                    dataKey="count"
                    nameKey="sport"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {sportBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      `${value} sessions`,
                      SPORT_LABELS[name] ?? name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend rows */}
            <div className="flex-1 w-full space-y-2.5">
              {sportBreakdown.map((d) => (
                <div key={d.sport} className="flex items-center gap-3">
                  <span
                    className="shrink-0 w-3 h-3 rounded-sm"
                    style={{ background: d.color }}
                  />
                  <span className="flex-1 text-sm text-text-primary">{SPORT_LABELS[d.sport]}</span>
                  <span className="text-sm tabular-nums text-text-secondary">{d.count}</span>
                  <span
                    className="text-xs font-medium tabular-nums w-12 text-right"
                    style={{ color: d.color }}
                  >
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Sessions — Last 12 Months
          {hasMultipleSports && (
            <span className="ml-1 opacity-70">(stacked by sport)</span>
          )}
        </h3>
        <ResponsiveContainer width="100%" height={165}>
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
              formatter={(value: number, name: string) => [value, SPORT_LABELS[name] ?? name]}
            />
            {hasMultipleSports ? (
              <>
                {activeSports.map((sport, idx) => (
                  <Bar
                    key={sport}
                    dataKey={sport}
                    stackId="a"
                    fill={sportColor(sport)}
                    radius={
                      idx === activeSports.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]
                    }
                  />
                ))}
              </>
            ) : (
              <Bar dataKey="total" fill={GREEN} radius={[3, 3, 0, 0]} name="Sessions" />
            )}
          </BarChart>
        </ResponsiveContainer>

        {hasMultipleSports && (
          <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
            {activeSports.map((sport) => (
              <span key={sport} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: sportColor(sport) }}
                />
                {SPORT_LABELS[sport]}
              </span>
            ))}
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
              {recentTable.map((s, i) => {
                const color = sportColor(s.workout_type)
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
                          color,
                          background: `${color}20`,
                        }}
                      >
                        {SPORT_LABELS[s.workout_type] ?? s.workout_type}
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
