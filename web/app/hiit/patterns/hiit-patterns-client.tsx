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

export interface HiitStats {
  totalSessions: number
  avgDurationMins: number
  avgPerWeek: number
  totalHours: number
  longestSessionMins: number
  avgHrOverall: number | null
  totalCalories: number
  busiestDay: string
  preferredTime: string
}

export interface DowHiitStat {
  label: string
  sessions: number
  totalMins: number
}

export interface WeeklyHiitStat {
  label: string
  mins: number
  sessions: number
}

export interface MonthlyHiitStat {
  label: string
  key: string
  sessions: number
  mins: number
  cals: number
  avgHr: number | null
  maxHr: number | null
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

export function HiitPatternsClient({
  stats,
  dowData,
  weeklyData,
  monthlyData,
  durationTrend,
  timeTotals,
}: {
  stats: HiitStats
  dowData: DowHiitStat[]
  weeklyData: WeeklyHiitStat[]
  monthlyData: MonthlyHiitStat[]
  durationTrend: DurationPoint[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.sessions), 1)
  const avgWeeklyMins = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + w.mins, 0) / weeklyData.length)
    : 0
  const bestWeekMins = Math.max(...weeklyData.map((w) => w.mins), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)
  const avgDurationTrend = durationTrend.length > 0
    ? Math.round(durationTrend.reduce((s, d) => s + d.mins, 0) / durationTrend.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions (1yr)</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.avgDurationMins} min</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
          <p className="text-xs text-text-secondary opacity-50">Longest: {stats.longestSessionMins}m</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-orange-400">{stats.avgHrOverall ?? '—'} bpm</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Heart Rate</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-lg font-bold text-red-400">{stats.totalCalories.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Calories</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.totalHours}h total</p>
        </div>
      </div>

      {/* DOW distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Training Days</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you do HIIT</p>
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
                <Cell key={i} fill={d.sessions === maxDow ? '#eab308' : 'rgba(234,179,8,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Peak day: <span className="text-yellow-400 font-medium">{stats.busiestDay}</span></span>
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

      {/* Weekly volume */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Volume</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Minutes · last 16 weeks</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={1} />
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
                  <Cell key={i} fill={w.mins >= bestWeekMins * 0.85 ? '#eab308' : 'rgba(234,179,8,0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-2 text-xs text-text-secondary">
            <span>Best: <span className="text-yellow-400 font-medium">{bestWeekMins} min</span></span>
            <span>Avg: <span className="font-medium">{avgWeeklyMins} min</span></span>
          </div>
        </div>
      )}

      {/* Monthly summary */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Volume</p>
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
              <Bar yAxisId="sessions" dataKey="sessions" fill="rgba(234,179,8,0.7)" radius={[3, 3, 0, 0]} name="sessions" />
              <Line yAxisId="mins" type="monotone" dataKey="mins" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="mins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Heart rate trend */}
      {monthlyData.filter((m) => m.avgHr != null).length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Avg Heart Rate</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Higher HR = more intense sessions</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [`${val} bpm`, 'Avg HR']}
              />
              <Line type="monotone" dataKey="avgHr" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session duration trend */}
      {durationTrend.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Session Duration Trend</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Are sessions getting longer or shorter?</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={durationTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 3', 'dataMax + 3']} />
              <Tooltip
                formatter={(val: number) => [`${val} min`, 'Duration']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={avgDurationTrend} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="mins" stroke="#eab308" strokeWidth={1.5} dot={{ r: 2, fill: '#eab308' }} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2 opacity-60">Average: {avgDurationTrend} min/session</p>
        </div>
      )}

      {/* Monthly breakdown table */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <p className="text-sm font-semibold text-text-primary p-4 pb-3">Monthly Breakdown</p>
          <div className="divide-y divide-border">
            {[...monthlyData].reverse().map((m) => (
              <div key={m.key} className="flex items-center px-4 py-3">
                <span className="text-sm text-text-secondary w-8">{m.label}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400">{m.sessions} sessions</p>
                  <p className="text-xs text-text-secondary opacity-60">{Math.round(m.mins / 60)}h {m.mins % 60}m · {m.cals.toLocaleString()} cal</p>
                </div>
                <div className="text-right">
                  {m.avgHr && (
                    <p className="text-xs text-orange-400 font-medium">{m.avgHr} bpm avg</p>
                  )}
                  {m.maxHr && (
                    <p className="text-xs text-text-secondary opacity-60">max {m.maxHr} bpm</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">HIIT Training Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-yellow-400 font-medium">Frequency</span> · 2–3 HIIT sessions/week max — more isn't better due to CNS demand</p>
          <p><span className="text-amber-400 font-medium">Recovery</span> · Allow 48h between sessions; HRV drop &gt;15% signals incomplete recovery</p>
          <p><span className="text-orange-400 font-medium">Duration</span> · True HIIT is 15–30 min; longer sessions drift into moderate-intensity cardio</p>
          <p><span className="text-red-400 font-medium">Intensity</span> · Work intervals at 85–95% max HR; rest until HR drops below 65%</p>
        </div>
      </div>
    </div>
  )
}
