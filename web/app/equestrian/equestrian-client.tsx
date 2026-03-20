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
  ReferenceLine,
} from 'recharts'

interface EquestrianSession {
  id: string
  start_time: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface EquestrianClientProps {
  sessions: EquestrianSession[]
}

// Brown / earth-tone palette
const BROWN_DARK   = '#78350f' // Tailwind brown-800
const BROWN_MID    = '#92400e' // amber-900
const BROWN_LIGHT  = '#b45309' // amber-700
const BROWN_FAINT  = 'rgba(120,53,15,0.45)'

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
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function durationColor(min: number): string {
  if (min >= 120) return BROWN_DARK   // dark brown — long session
  return BROWN_LIGHT                  // medium brown — shorter session
}

export function EquestrianClient({ sessions }: EquestrianClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🐴</span>
        <h2 className="text-lg font-semibold text-text-primary">No equestrian data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import equestrian workouts from Apple Health. Start an Equestrian
          Sports workout on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes  = sessions.reduce((s, r) => s + r.duration_minutes, 0)
  const totalHours    = +(totalMinutes / 60).toFixed(1)
  const avgDuration   = Math.round(totalMinutes / totalSessions)

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

  const sessionsWithHR = sessions.filter((s) => (s.avg_heart_rate ?? 0) > 0)
  const avgHR =
    sessionsWithHR.length > 0
      ? sessionsWithHR.reduce((sum, s) => sum + (s.avg_heart_rate ?? 0), 0) / sessionsWithHR.length
      : null

  // ─── Monthly sessions (last 6 months) ────────────────────────────────────
  const monthlySessions = (() => {
    const now = new Date()
    const months: Map<string, number> = new Map()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.set(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), 0)
    }
    for (const s of sessions) {
      const key = monthKey(s.start_time)
      if (months.has(key)) {
        months.set(key, (months.get(key) ?? 0) + 1)
      }
    }
    return Array.from(months.entries()).map(([month, count]) => ({ month, count }))
  })()

  // ─── Session duration — last 20 sessions ─────────────────────────────────
  const durationData = [...sessions]
    .reverse()
    .slice(0, 20)
    .reverse()
    .map((s) => ({
      date:     fmtDate(s.start_time),
      duration: s.duration_minutes,
      color:    durationColor(s.duration_minutes),
    }))

  const avgDurationLine = Math.round(
    durationData.reduce((sum, d) => sum + d.duration, 0) / durationData.length
  )

  // ─── Recent sessions (last 12) ────────────────────────────────────────────
  const recentSessions = [...sessions].reverse().slice(0, 12)

  return (
    <div className="space-y-6">
      {/* Hero summary card */}
      <div
        className="rounded-2xl border p-5 flex items-center gap-4"
        style={{
          background: 'rgba(120,53,15,0.10)',
          borderColor: 'rgba(120,53,15,0.30)',
        }}
      >
        <span className="text-5xl opacity-80">🐴</span>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-5">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>{totalSessions}</p>
            <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>{totalHours}h</p>
            <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>{avgDuration} min</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>
              {avgKcalPerMin !== null ? avgKcalPerMin.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg kcal/min</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>
              {avgHR !== null ? `${Math.round(avgHR)} bpm` : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg HR</p>
          </div>
        </div>
      </div>

      {/* Monthly sessions bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Monthly Sessions — Last 6 Months
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlySessions} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
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
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {monthlySessions.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.count === Math.max(...monthlySessions.map((m) => m.count))
                      ? BROWN_MID
                      : BROWN_FAINT
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session duration bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Session Duration — Last 20 Sessions
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: BROWN_DARK }}
            />
            ≥120 min — Long ride
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: BROWN_LIGHT }}
            />
            &lt;120 min — Standard session
          </span>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={durationData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
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
              domain={[0, 200]}
              tickFormatter={(v: number) => `${v}m`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} min`, 'Duration']}
            />
            <ReferenceLine
              y={avgDurationLine}
              stroke={BROWN_FAINT}
              strokeDasharray="5 3"
              label={{
                value: `avg ${avgDurationLine}m`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'var(--color-text-secondary)',
              }}
            />
            <Bar dataKey="duration" radius={[3, 3, 0, 0]}>
              {durationData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
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
                  Duration
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  kcal
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  kcal/min
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentSessions.map((s, i) => {
                const kpm =
                  (s.active_calories ?? 0) > 0 && s.duration_minutes > 0
                    ? (s.active_calories ?? 0) / s.duration_minutes
                    : null
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-surface-secondary/40 transition-colors ${
                      i % 2 === 1 ? 'bg-surface-secondary/20' : ''
                    }`}
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
                      style={{ color: BROWN_LIGHT }}
                    >
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-text-secondary">
                      {kpm !== null ? kpm.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums text-text-secondary">
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
        {sessions.length > 12 && (
          <p className="text-xs text-text-secondary text-center px-4 py-2 border-t border-border">
            Showing 12 of {sessions.length} sessions
          </p>
        )}
      </div>
    </div>
  )
}
