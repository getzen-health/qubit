'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'

export interface DowMindfulStat {
  label: string
  count: number
  avgMinutes: number | null
  totalMinutes: number
}

export interface DurationDist {
  label: string
  count: number
  pct: number
}

export interface MonthMindfulStat {
  label: string
  sessions: number
  totalMinutes: number
  avgMinutes: number
}

export interface TimePeriodMindful {
  label: string
  icon: string
  time: string
  count: number
  avgMinutes: number | null
  pct: number
}

export interface MindfulnessPatternData {
  totalSessions: number
  totalMinutes: number
  avgMinutes: number
  avgSessionsPerWeek: number
  currentStreak: number
  longestStreak: number
  consistencyPct: number
  bestDow: string | null
  dowData: DowMindfulStat[]
  durationDist: DurationDist[]
  monthData: MonthMindfulStat[]
  timePeriods: TimePeriodMindful[]
}

function fmtMin(m: number) {
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function MindfulnessPatternsClient({ data }: { data: MindfulnessPatternData }) {
  const {
    totalSessions, totalMinutes, avgMinutes, avgSessionsPerWeek,
    currentStreak, longestStreak, consistencyPct, bestDow,
    dowData, durationDist, monthData, timePeriods,
  } = data

  const dowWithData = dowData.filter((d) => d.count > 0)
  const hasMonthData = monthData.length >= 2

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
          <p className="text-xs text-text-secondary opacity-60">{avgSessionsPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">{fmtMin(totalMinutes)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Time</p>
          <p className="text-xs text-text-secondary opacity-60">{fmtMin(avgMinutes)} avg session</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{currentStreak}</p>
          <p className="text-xs text-text-secondary mt-0.5">Day Streak</p>
          <p className="text-xs text-text-secondary opacity-60">Best: {longestStreak} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${consistencyPct >= 70 ? 'text-green-400' : consistencyPct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {consistencyPct}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Consistency</p>
          <p className="text-xs text-text-secondary opacity-60">Weeks with sessions</p>
        </div>
      </div>

      {/* Highlights */}
      {bestDow && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Insights</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
              <span className="text-2xl">🧘</span>
              <div>
                <p className="text-xs text-text-secondary">Most mindful day</p>
                <p className="text-sm font-semibold text-text-primary">{bestDow}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-xs text-text-secondary">Avg session length</p>
                <p className="text-sm font-semibold text-text-primary">{fmtMin(avgMinutes)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consistency bar */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-text-primary">Weekly Consistency</p>
          <p className="text-sm font-bold text-teal-400">{consistencyPct}%</p>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-500/70 transition-all"
            style={{ width: `${consistencyPct}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1 opacity-60">
          Practised in {consistencyPct}% of weeks over the past year
        </p>
      </div>

      {/* Time of day */}
      {timePeriods.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Preferred Time of Day</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {timePeriods.map((p) => (
              <div key={p.label} className="text-center">
                <p className="text-xl mb-1">{p.icon}</p>
                <p className="text-xs text-text-secondary">{p.label}</p>
                <p className="text-xs text-text-secondary opacity-60 mb-1">{p.time}</p>
                <p className="text-sm font-bold text-teal-400">{p.pct}%</p>
                <p className="text-xs text-text-secondary opacity-60">{p.count} sessions</p>
                {p.avgMinutes !== null && (
                  <p className="text-xs text-text-secondary opacity-60">{fmtMin(p.avgMinutes)} avg</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration distribution */}
      {durationDist.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Session Duration Distribution</p>
          <div className="space-y-2">
            {durationDist.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-14 text-right">{d.label}</span>
                <div className="flex-1 bg-surface-secondary rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500/60"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary w-8 text-right">{d.pct}%</span>
                <span className="text-xs text-text-secondary w-6 text-right opacity-60">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOW bar chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Sessions by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                formatter={(val: number, name: string) => [
                  name === 'avgMinutes' ? `${val}m` : val,
                  name === 'avgMinutes' ? 'Avg Duration' : 'Sessions',
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" name="Sessions" fill="#14b8a6" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW avg duration */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Avg Duration by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">Minutes per session on each day</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.avgMinutes === null) return null
              const maxAvg = Math.max(...dowData.filter((x) => x.avgMinutes !== null).map((x) => x.avgMinutes!))
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500/50"
                      style={{ width: `${(d.avgMinutes / maxAvg) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary w-12 text-right">{fmtMin(d.avgMinutes)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [
                  name === 'totalMinutes' ? fmtMin(val) : val,
                  name === 'totalMinutes' ? 'Total Time' : 'Sessions',
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalMinutes"
                name="Total Minutes"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray="5 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
