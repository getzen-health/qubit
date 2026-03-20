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

interface ClimbingSession {
  id: string
  start_time: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
}

interface RockClimbingClientProps {
  sessions: ClimbingSession[]
}

// Brown / earth-tone palette
const BROWN        = '#92400e' // amber-800
const BROWN_MID    = '#b45309' // amber-700
const BROWN_LIGHT  = '#d97706' // amber-600
const BROWN_FADED  = 'rgba(146,64,14,0.40)'

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

// Duration bar colour: brown ≥90 min, tan ≥60 min, lighter otherwise
function durationColor(min: number): string {
  if (min >= 90) return BROWN
  if (min >= 60) return BROWN_MID
  return BROWN_LIGHT
}

export function RockClimbingClient({ sessions }: RockClimbingClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🧗</span>
        <h2 className="text-lg font-semibold text-text-primary">No climbing data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import climbing workouts from Apple Health. Start a Rock Climbing
          workout on your Apple Watch to begin tracking.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes  = sessions.reduce((s, w) => s + w.duration_minutes, 0)
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

  const peakHR = sessions.reduce((max, s) => {
    const hr = s.max_heart_rate ?? 0
    return hr > max ? hr : max
  }, 0)

  // ─── Weekly sessions bar chart (last 13 weeks) ───────────────────────────
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

  const maxWeeklyCount = Math.max(...weeklyCounts.map((w) => w.sessions), 1)

  // ─── Session duration bar chart (last 20 sessions) ───────────────────────
  const last20 = [...sessions].slice(-20)
  const durationData = last20.map((s) => ({
    date: fmtDate(s.start_time),
    duration: s.duration_minutes,
    color: durationColor(s.duration_minutes),
  }))
  // Avg duration reference line uses all sessions
  const avgDurationAll = totalMinutes / totalSessions

  // ─── Recent sessions (last 12) ───────────────────────────────────────────
  const recentSessions = [...sessions].reverse().slice(0, 12)

  return (
    <div className="space-y-6">
      {/* 90-day summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BROWN }}>
            {totalSessions}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BROWN }}>
            {totalHours}h
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BROWN_MID }}>
            {avgKcalPerMin !== null ? avgKcalPerMin.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg kcal/min</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BROWN_MID }}>
            {avgDuration} min
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>
            {avgHR !== null ? `${Math.round(avgHR)}` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR (bpm)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: BROWN_LIGHT }}>
            {peakHR > 0 ? peakHR : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Peak HR (bpm)</p>
        </div>
      </div>

      {/* Accent banner */}
      <div
        className="rounded-2xl border p-4 flex items-center justify-between"
        style={{ background: 'rgba(146,64,14,0.08)', borderColor: 'rgba(146,64,14,0.28)' }}
      >
        <div>
          <p className="text-xs text-text-secondary">90-Day Climbing Stats</p>
          <p className="text-base font-semibold mt-0.5" style={{ color: BROWN }}>
            {totalSessions} sessions &middot; {totalHours}h on the wall
          </p>
          {avgKcalPerMin !== null && (
            <p className="text-xs text-text-secondary mt-0.5">
              Burning ~{avgKcalPerMin.toFixed(1)} kcal/min on average
            </p>
          )}
        </div>
        <span className="text-4xl opacity-70">🧗</span>
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
            <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
              {weeklyCounts.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.sessions === maxWeeklyCount && entry.sessions > 0 ? BROWN : BROWN_FADED}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session duration bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Session Duration — Last {last20.length} Sessions
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: BROWN_LIGHT }} />
            &lt;60 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: BROWN_MID }} />
            60–89 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: BROWN }} />
            ≥90 min
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={durationData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
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
              unit=" m"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} min`, 'Duration']}
            />
            <ReferenceLine
              y={avgDurationAll}
              stroke={BROWN_MID}
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: `Avg ${Math.round(avgDurationAll)}m`,
                fill: BROWN_MID,
                fontSize: 10,
                position: 'insideTopRight',
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
                const kcalPerMin =
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
                      style={{ color: durationColor(s.duration_minutes) }}
                    >
                      {fmtDuration(s.duration_minutes)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-text-secondary">
                      {(s.active_calories ?? 0) > 0
                        ? `${Math.round(s.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-text-secondary">
                      {kcalPerMin !== null ? kcalPerMin.toFixed(1) : '—'}
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
          <p className="text-xs text-text-secondary text-center px-4 py-2">
            Showing 12 of {sessions.length} sessions
          </p>
        )}
      </div>
    </div>
  )
}
