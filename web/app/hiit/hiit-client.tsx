'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

interface Session {
  id: string
  start_time: string
  duration_minutes: number
  avg_heart_rate: number | null
  max_heart_rate: number | null
  active_calories: number | null
}

interface DailyHrv {
  date: string
  avg_hrv: number | null
}

interface HiitClientProps {
  sessions: Session[]
  dailyHrv: DailyHrv[]
  maxHr: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HiitClient({ sessions, dailyHrv, maxHr }: HiitClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">⚡</span>
        <h2 className="text-lg font-semibold text-text-primary">No HIIT sessions yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Log HIIT workouts in Apple Fitness or any app that writes to Apple Health under the
          &ldquo;High Intensity Interval Training&rdquo; category.
        </p>
      </div>
    )
  }

  const withHr = sessions.filter((s) => s.avg_heart_rate && s.avg_heart_rate > 0)
  const withCal = sessions.filter((s) => s.active_calories && s.active_calories > 0)

  const totalCalories = sessions.reduce((s, r) => s + (r.active_calories ?? 0), 0)
  const totalMinutes = sessions.reduce((s, r) => s + r.duration_minutes, 0)
  const avgDuration = Math.round(totalMinutes / sessions.length)
  const avgHr =
    withHr.length > 0
      ? Math.round(withHr.reduce((s, r) => s + r.avg_heart_rate!, 0) / withHr.length)
      : null
  const avgIntensity = avgHr ? Math.round((avgHr / maxHr) * 100) : null

  // Session trend chart data
  const sessionData = sessions.map((s) => ({
    date: fmtDate(s.start_time),
    duration: s.duration_minutes,
    calories: s.active_calories ?? null,
    hrPct: s.avg_heart_rate ? Math.round((s.avg_heart_rate / maxHr) * 100) : null,
  }))

  // Weekly session counts (last 12 weeks)
  const weekMap = new Map<string, number>()
  for (const s of sessions) {
    const week = getMonday(s.start_time.slice(0, 10))
    weekMap.set(week, (weekMap.get(week) ?? 0) + 1)
  }
  const weeklyData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week: fmtDate(week), count }))

  // Day of week distribution
  const dowCounts = Array(7).fill(0)
  for (const s of sessions) {
    const dow = new Date(s.start_time).getDay()
    dowCounts[dow]++
  }
  const dowData = DAY_LABELS.map((label, i) => ({ label, count: dowCounts[i] }))
  const maxDow = Math.max(...dowCounts)

  // Recovery impact: compare next-day HRV after HIIT vs non-HIIT days
  const hiitDates = new Set(sessions.map((s) => s.start_time.slice(0, 10)))
  const dayAfterHiitArr = sessions.map((s) => {
    const d = new Date(s.start_time.slice(0, 10) + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })
  const dayAfterHiit = new Set(dayAfterHiitArr)

  const hrvAfterHiit: number[] = []
  const hrvOtherDays: number[] = []
  for (const row of dailyHrv) {
    if (!row.avg_hrv) continue
    if (dayAfterHiit.has(row.date)) {
      hrvAfterHiit.push(row.avg_hrv)
    } else if (!hiitDates.has(row.date)) {
      hrvOtherDays.push(row.avg_hrv)
    }
  }

  const avgHrvAfterHiit =
    hrvAfterHiit.length > 0
      ? Math.round(hrvAfterHiit.reduce((a, b) => a + b, 0) / hrvAfterHiit.length)
      : null
  const avgHrvOther =
    hrvOtherDays.length > 0
      ? Math.round(hrvOtherDays.reduce((a, b) => a + b, 0) / hrvOtherDays.length)
      : null
  const hrvDiff =
    avgHrvAfterHiit !== null && avgHrvOther !== null ? avgHrvAfterHiit - avgHrvOther : null

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sessions', value: sessions.length, sub: '90 days' },
          {
            label: 'Avg Duration',
            value: fmtDuration(avgDuration),
            sub: `${fmtDuration(totalMinutes)} total`,
          },
          {
            label: 'Total Calories',
            value: `${Math.round(totalCalories).toLocaleString()}`,
            sub: `${withCal.length > 0 ? Math.round(totalCalories / withCal.length) : '—'} avg/session`,
          },
          ...(avgIntensity
            ? [
                {
                  label: 'Avg Intensity',
                  value: `${avgIntensity}%`,
                  sub: `${avgHr} bpm avg HR`,
                },
              ]
            : []),
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Weekly frequency */}
      {weeklyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Sessions</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={18}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}`, 'Sessions']}
              />
              <ReferenceLine y={2} stroke="rgba(250,204,21,0.4)" strokeDasharray="3 2" />
              <Bar dataKey="count" fill="#facc15" radius={[3, 3, 0, 0]}>
                {weeklyData.map((d, i) => (
                  <Cell key={i} fill={d.count >= 2 ? '#facc15' : '#f97316'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary text-center mt-1 opacity-60">
            Yellow = 2+ sessions/week · Orange = 1 session
          </p>
        </div>
      )}

      {/* Duration trend */}
      {sessionData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Session Duration</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={sessionData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
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
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} min`, 'Duration']}
              />
              <ReferenceLine
                y={30}
                stroke="rgba(250,204,21,0.35)"
                strokeDasharray="4 2"
                label={{ value: '30m', position: 'insideTopRight', fontSize: 9, fill: 'rgba(250,204,21,0.6)' }}
              />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#facc15"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#facc15' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* HR intensity trend */}
      {withHr.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Heart Rate Intensity</h3>
          <p className="text-xs text-text-secondary mb-3">
            Avg HR as % of max ({maxHr} bpm) — above 80% = true HIIT zone
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart
              data={sessionData.filter((d) => d.hrPct !== null)}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={30}
                tickFormatter={(v) => `${v}%`}
                domain={[60, 100]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}% max HR`, 'Intensity']}
              />
              <ReferenceLine
                y={80}
                stroke="rgba(239,68,68,0.4)"
                strokeDasharray="4 2"
                label={{ value: '80%', position: 'insideTopRight', fontSize: 9, fill: 'rgba(239,68,68,0.6)' }}
              />
              <ReferenceLine
                y={70}
                stroke="rgba(249,115,22,0.3)"
                strokeDasharray="3 2"
              />
              <Line
                type="monotone"
                dataKey="hrPct"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day of week preference */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Preferred Day</h3>
        <div className="flex items-end gap-1.5 h-16">
          {dowData.map(({ label, count }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: maxDow > 0 ? `${Math.max(4, Math.round((count / maxDow) * 56))}px` : '4px',
                  background: count === maxDow && count > 0 ? '#facc15' : 'rgba(250,204,21,0.3)',
                }}
              />
              <span className="text-[10px] text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery impact */}
      {avgHrvAfterHiit !== null && avgHrvOther !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Next-Day HRV Impact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-text-primary">{avgHrvAfterHiit}</p>
              <p className="text-xs text-text-secondary mt-1">Avg HRV day after HIIT</p>
              <p className="text-xs text-text-secondary opacity-60">ms</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-text-primary">{avgHrvOther}</p>
              <p className="text-xs text-text-secondary mt-1">Avg HRV other days</p>
              <p className="text-xs text-text-secondary opacity-60">ms</p>
            </div>
          </div>
          {hrvDiff !== null && (
            <div
              className="mt-3 rounded-lg p-3 text-center text-sm"
              style={{
                background: hrvDiff < -5 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                borderColor: hrvDiff < -5 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            >
              <span
                className="font-semibold"
                style={{ color: hrvDiff < -5 ? '#ef4444' : '#22c55e' }}
              >
                {hrvDiff > 0 ? '+' : ''}
                {hrvDiff} ms
              </span>{' '}
              <span className="text-text-secondary">
                {hrvDiff < -5
                  ? 'HRV dips after HIIT — normal stress response, ensure adequate recovery'
                  : hrvDiff > 5
                  ? 'HRV is higher after HIIT — your body adapts well to this intensity'
                  : 'Minimal HRV change after HIIT — well-managed intensity'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recent sessions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Recent Sessions
        </h3>
        {sessions
          .slice()
          .reverse()
          .slice(0, 8)
          .map((s, i) => {
            const intensity = s.avg_heart_rate ? Math.round((s.avg_heart_rate / maxHr) * 100) : null
            return (
              <div
                key={i}
                className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3"
              >
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {fmtDuration(s.duration_minutes)}
                    {s.active_calories ? ` · ${Math.round(s.active_calories)} cal` : ''}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {fmtDate(s.start_time)}
                    {s.avg_heart_rate ? ` · ${Math.round(s.avg_heart_rate)} bpm avg` : ''}
                  </p>
                </div>
                {intensity !== null && (
                  <div className="text-right">
                    <p
                      className="text-lg font-bold font-mono"
                      style={{ color: intensity >= 80 ? '#ef4444' : intensity >= 70 ? '#f97316' : '#facc15' }}
                    >
                      {intensity}%
                    </p>
                    <p className="text-xs text-text-secondary">max HR</p>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Reference */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">HIIT Intensity Zones</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { range: '> 80%', label: 'True HIIT zone', color: 'text-red-400' },
            { range: '70–80%', label: 'Threshold', color: 'text-orange-400' },
            { range: '60–70%', label: 'Tempo', color: 'text-yellow-400' },
            { range: '< 60%', label: 'Aerobic base', color: 'text-green-400' },
          ].map(({ range, label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-mono opacity-70">{range}</span>
              <span className={color}>{label}</span>
            </div>
          ))}
        </div>
        <p className="opacity-60 pt-1">
          Intensity = avg heart rate as % of your observed max ({maxHr} bpm). ACSM recommends
          2–3 HIIT sessions/week with 48h recovery between sessions.
        </p>
      </div>
    </div>
  )
}
