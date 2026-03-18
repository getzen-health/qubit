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
} from 'recharts'

interface Session {
  start_time: string
  duration_minutes: number
  active_calories: number | null
  workout_type: string
  avg_heart_rate: number | null
}

interface DaySummary {
  date: string
  avg_hrv: number | null
  resting_heart_rate: number | null
  recovery_score: number | null
}

interface StrengthClientProps {
  sessions: Session[]
  summaries: DaySummary[]
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

function getMonday(date: Date): string {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}

export function StrengthClient({ sessions, summaries }: StrengthClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💪</span>
        <h2 className="text-lg font-semibold text-text-primary">No strength sessions yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync workouts logged as Strength Training, Functional Strength, or Core Training from Apple Health.
        </p>
      </div>
    )
  }

  // Aggregates
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, w) => s + w.duration_minutes, 0)
  const totalCalories = sessions.reduce((s, w) => s + (w.active_calories ?? 0), 0)
  const avgDuration = Math.round(totalMinutes / totalSessions)
  const avgCalories = totalCalories > 0 ? Math.round(totalCalories / sessions.filter((s) => s.active_calories).length) : null

  // Sessions per week
  const weekMap = new Map<string, { count: number; minutes: number; calories: number }>()
  for (const s of sessions) {
    const monday = getMonday(new Date(s.start_time))
    const w = weekMap.get(monday) ?? { count: 0, minutes: 0, calories: 0 }
    w.count++
    w.minutes += s.duration_minutes
    w.calories += s.active_calories ?? 0
    weekMap.set(monday, w)
  }

  const weekData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week: fmtDate(week + 'T00:00:00'),
      sessions: data.count,
      minutes: data.minutes,
      calories: Math.round(data.calories),
    }))

  const avgSessionsPerWeek = weekData.length > 0
    ? (weekData.reduce((s, w) => s + w.sessions, 0) / weekData.length).toFixed(1)
    : '0'

  // Duration trend
  const durationData = sessions.map((s) => ({
    date: fmtDate(s.start_time),
    minutes: s.duration_minutes,
    calories: s.active_calories ? Math.round(s.active_calories) : null,
  }))

  // Post-workout HRV: compare HRV the day after a strength session vs rest days
  const sessionDays = new Set(sessions.map((s) => s.start_time.slice(0, 10)))
  const dayAfterSessionDays = new Set(
    Array.from(sessionDays).map((d) => {
      const next = new Date(d + 'T00:00:00')
      next.setDate(next.getDate() + 1)
      return next.toISOString().slice(0, 10)
    })
  )

  const hrvValues = summaries.filter((s) => s.avg_hrv && s.avg_hrv > 0)
  const postWorkoutHrv = hrvValues
    .filter((s) => dayAfterSessionDays.has(s.date))
    .map((s) => s.avg_hrv!)
  const restDayHrv = hrvValues
    .filter((s) => !dayAfterSessionDays.has(s.date) && !sessionDays.has(s.date))
    .map((s) => s.avg_hrv!)

  const avgPostHrv = postWorkoutHrv.length > 0
    ? Math.round(postWorkoutHrv.reduce((a, b) => a + b, 0) / postWorkoutHrv.length)
    : null
  const avgRestHrv = restDayHrv.length > 0
    ? Math.round(restDayHrv.reduce((a, b) => a + b, 0) / restDayHrv.length)
    : null

  // Day-of-week distribution
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowCounts = Array(7).fill(0)
  for (const s of sessions) {
    dowCounts[new Date(s.start_time).getDay()]++
  }
  const dowData = DOW_LABELS.map((day, i) => ({ day, sessions: dowCounts[i] }))

  // Consistency: % of weeks with ≥2 strength sessions (common recommendation)
  const weeksWithTarget = weekData.filter((w) => w.sessions >= 2).length
  const consistencyPct = weekData.length > 0 ? Math.round((weeksWithTarget / weekData.length) * 100) : 0

  // Type breakdown
  const typeCounts: Record<string, number> = {}
  for (const s of sessions) {
    typeCounts[s.workout_type] = (typeCounts[s.workout_type] ?? 0) + 1
  }
  const typeList = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sessions', value: totalSessions, sub: '90 days' },
          { label: 'Per Week', value: avgSessionsPerWeek, sub: 'avg sessions' },
          { label: 'Avg Duration', value: fmtDuration(avgDuration), sub: 'per session' },
          { label: 'Consistency', value: `${consistencyPct}%`, sub: 'weeks with ≥2' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Consistency guidance */}
      <div className={`rounded-xl border p-4 ${consistencyPct >= 80 ? 'bg-green-500/10 border-green-500/20' : consistencyPct >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-surface border-border'}`}>
        <p className={`font-semibold text-sm ${consistencyPct >= 80 ? 'text-green-400' : consistencyPct >= 50 ? 'text-yellow-400' : 'text-text-secondary'}`}>
          {consistencyPct >= 80 ? 'Excellent consistency — 2+ sessions most weeks' :
           consistencyPct >= 50 ? 'Moderate consistency — try for 2+ sessions each week' :
           'Build consistency — aim for 2 strength sessions per week'}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          ACSM recommends 2–3 strength sessions per week for adults, with at least 48 hours between sessions for the same muscle groups.
        </p>
      </div>

      {/* Weekly sessions */}
      {weekData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Sessions per Week</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} domain={[0, 'dataMax + 1']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [v, name === 'sessions' ? 'Sessions' : name]} />
              <ReferenceLine y={2} stroke="rgba(74,222,128,0.3)" strokeDasharray="3 2" label={{ value: '2 target', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.5)' }} />
              <Bar dataKey="sessions" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Duration trend */}
      {durationData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Session Duration Trend</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={durationData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} min`, 'Duration']} />
              <ReferenceLine y={45} stroke="rgba(248,113,113,0.3)" strokeDasharray="3 2" />
              <Line type="monotone" dataKey="minutes" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: '#f87171' }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-1">Reference: 45 min = typical effective session</p>
        </div>
      )}

      {/* Day-of-week preference */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Preferred Training Days</h3>
        <div className="flex gap-1.5">
          {dowData.map(({ day, sessions: count }) => {
            const max = Math.max(...dowData.map((d) => d.sessions), 1)
            const height = Math.max(4, Math.round((count / max) * 60))
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end" style={{ height: 60 }}>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height,
                      backgroundColor: count > 0 ? '#f87171' : 'rgba(255,255,255,0.05)',
                      minWidth: 8,
                    }}
                  />
                </div>
                <p className="text-[10px] text-text-secondary">{day}</p>
                <p className="text-[10px] font-mono text-text-primary">{count}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Post-workout recovery */}
      {avgPostHrv !== null && avgRestHrv !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Recovery Impact</h3>
          <p className="text-xs text-text-secondary mb-3">HRV the day after a strength session vs. rest days</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{avgPostHrv}</p>
              <p className="text-xs text-text-secondary mt-0.5">Post-workout HRV</p>
              <p className="text-xs text-text-secondary opacity-60">{postWorkoutHrv.length} days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{avgRestHrv}</p>
              <p className="text-xs text-text-secondary mt-0.5">Rest day HRV</p>
              <p className="text-xs text-text-secondary opacity-60">{restDayHrv.length} days</p>
            </div>
          </div>
          {Math.abs(avgPostHrv - avgRestHrv) >= 3 && (
            <p className={`text-xs mt-3 ${avgPostHrv < avgRestHrv ? 'text-orange-400' : 'text-green-400'}`}>
              {avgPostHrv < avgRestHrv
                ? `Your HRV is ${avgRestHrv - avgPostHrv} ms lower the day after strength training — normal, reflecting recovery demand.`
                : `Your HRV is ${avgPostHrv - avgRestHrv} ms higher after strength days — suggesting good adaptation.`}
            </p>
          )}
        </div>
      )}

      {/* Workout type breakdown */}
      {typeList.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Workout Types</h3>
          <div className="space-y-2">
            {typeList.map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-primary">{type}</span>
                    <span className="text-text-secondary">{count} sessions</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{ width: `${(count / totalSessions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Sessions</h3>
        {sessions.slice(-10).reverse().map((s, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">💪</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{s.workout_type}</p>
              <p className="text-xs text-text-secondary">
                {fmtDate(s.start_time)} · {fmtDuration(s.duration_minutes)}
                {s.avg_heart_rate ? ` · ${Math.round(s.avg_heart_rate)} bpm avg` : ''}
              </p>
            </div>
            {s.active_calories && (
              <div className="text-right">
                <p className="text-sm font-bold text-red-400">{Math.round(s.active_calories)}</p>
                <p className="text-xs text-text-secondary">kcal</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
