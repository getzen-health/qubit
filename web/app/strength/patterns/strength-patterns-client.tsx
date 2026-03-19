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

export interface StrengthStats {
  totalSessions: number
  avgDurationMins: number
  avgPerWeek: number
  busiestDay: string
  preferredTime: string
  longestSessionMins: number
  totalHours: number
}

export interface DowStrengthStat {
  label: string
  sessions: number
  totalMins: number
}

export interface WeeklyStrengthStat {
  label: string
  mins: number
  sessions: number
}

export interface MonthlyStrengthStat {
  label: string
  sessions: number
  mins: number
  cals: number
  avgHr: number | null
}

export interface TypeStrengthStat {
  type: string
  count: number
  pct: number
  avgMins: number
}

export interface DurationPoint {
  date: string
  mins: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function StrengthPatternsClient({
  stats,
  dowData,
  weeklyData,
  monthlyData,
  typeData,
  durationTrend,
  timeTotals,
}: {
  stats: StrengthStats
  dowData: DowStrengthStat[]
  weeklyData: WeeklyStrengthStat[]
  monthlyData: MonthlyStrengthStat[]
  typeData: TypeStrengthStat[]
  durationTrend: DurationPoint[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.sessions), 1)
  const avgWeeklyMins = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + w.mins, 0) / weeklyData.length)
    : 0
  const bestWeekMins = Math.max(...weeklyData.map((w) => w.mins), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)
  const avgDuration = durationTrend.length > 0
    ? Math.round(durationTrend.reduce((s, d) => s + d.mins, 0) / durationTrend.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions (90d)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{stats.avgPerWeek}</p>
          <p className="text-xs text-text-secondary mt-0.5">Per Week (avg)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.avgDurationMins} min</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-lg font-bold text-purple-400">{stats.totalHours}h</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Training</p>
          <p className="text-xs text-text-secondary opacity-50">Longest: {stats.longestSessionMins}m</p>
        </div>
      </div>

      {/* DOW distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Training Days</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you lift</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number) => [val, 'Sessions']}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell key={i} fill={d.sessions === maxDow ? '#ef4444' : 'rgba(239,68,68,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Peak day: <span className="text-red-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.sessions === 0).length > 0 && (
            <span>Rest days: <span className="font-medium">{dowData.filter((d) => d.sessions === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you train</p>
        <div className="space-y-3">
          {[
            { label: '🌅 Morning (5–11am)', val: timeTotals.morning, color: '#fbbf24' },
            { label: '☀️ Afternoon (12–5pm)', val: timeTotals.afternoon, color: '#f97316' },
            { label: '🌙 Evening (6–10pm)', val: timeTotals.evening, color: '#818cf8' },
          ].map(({ label, val, color }) => {
            const pct = val / totalTimeSession * 100
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-40 flex-none">{label}</span>
                <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color + '99' }} />
                </div>
                <span className="text-xs text-text-secondary w-8 text-right">{val}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-text-secondary mt-3 opacity-60">
          You mostly train in the <span className="font-medium">{stats.preferredTime}</span>.
        </p>
      </div>

      {/* Weekly volume chart */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Volume</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Minutes · last 12 weeks</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} min`, 'Volume']}
                contentStyle={tooltipStyle}
              />
              {avgWeeklyMins > 0 && (
                <ReferenceLine y={avgWeeklyMins} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3"
                  label={{ value: `avg ${avgWeeklyMins}m`, fill: 'rgba(255,255,255,0.4)', fontSize: 9, position: 'insideTopRight' }} />
              )}
              <Bar dataKey="mins" radius={[3, 3, 0, 0]}>
                {weeklyData.map((w, i) => (
                  <Cell key={i} fill={w.mins >= bestWeekMins * 0.85 ? '#ef4444' : 'rgba(239,68,68,0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-2 text-xs text-text-secondary">
            <span>Best: <span className="text-red-400 font-medium">{bestWeekMins} min</span></span>
            <span>Avg: <span className="font-medium">{avgWeeklyMins} min</span></span>
          </div>
        </div>
      )}

      {/* Monthly summary */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Summary</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="sessions" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="mins" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number, name: string) => [
                  name === 'sessions' ? `${val} sessions` : `${val} min`,
                  name === 'sessions' ? 'Sessions' : 'Volume',
                ]}
              />
              <Bar yAxisId="sessions" dataKey="sessions" fill="rgba(239,68,68,0.7)" radius={[3, 3, 0, 0]} name="sessions" />
              <Line yAxisId="mins" type="monotone" dataKey="mins" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} name="mins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session duration trend */}
      {durationTrend.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Session Duration Trend</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Are sessions getting longer or shorter?</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={durationTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                formatter={(val: number) => [`${val} min`, 'Duration']}
                contentStyle={tooltipStyle}
                labelFormatter={(l) => l}
              />
              <ReferenceLine y={avgDuration} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="mins" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2, fill: '#ef4444' }} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2 opacity-60">Average: {avgDuration} min/session</p>
        </div>
      )}

      {/* Workout type breakdown */}
      {typeData.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Session Types</p>
          <div className="space-y-2.5">
            {typeData.map(({ type, count, pct, avgMins }) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary flex-1 truncate">{type}</span>
                <div className="w-28 h-3 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'rgba(239,68,68,0.65)' }} />
                </div>
                <span className="text-xs text-text-secondary w-20 text-right">{pct}% · {avgMins}m avg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Strength Training Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-red-400 font-medium">Frequency</span> · 2–4 sessions/week for most goals with at least 48h rest per muscle group</p>
          <p><span className="text-orange-400 font-medium">Duration</span> · 45–75 min is optimal; beyond 90 min may reduce hormonal benefits</p>
          <p><span className="text-yellow-400 font-medium">Consistency</span> · Training the same days each week improves recovery adaptation</p>
          <p><span className="text-green-400 font-medium">Progressive overload</span> · Increase volume (sets × reps × weight) 5–10% per week</p>
        </div>
      </div>
    </div>
  )
}
