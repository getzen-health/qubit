'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

export interface TrainingStats {
  totalSessions: number
  avgDurationMins: number
  avgPerWeek: number
  busiestDay: string
  preferredTime: string
  consistencyPct: number
}

export interface DowStat {
  label: string
  sessions: number
  totalMins: number
  avgCals: number
}

export interface HourStat {
  hour: number
  label: string
  sessions: number
}

export interface WeeklyStat {
  label: string
  mins: number
  sessions: number
  cals: number
}

export interface TypeStat {
  type: string
  count: number
  pct: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

function buildInsights(
  stats: TrainingStats,
  dowData: DowStat[],
  weeklyData: WeeklyStat[],
): string[] {
  const insights: string[] = []

  if (stats.consistencyPct >= 85) {
    insights.push(`You're highly consistent — training ${stats.consistencyPct}% of weeks. Great habit!`)
  } else if (stats.consistencyPct < 60) {
    insights.push(`Your training consistency is ${stats.consistencyPct}%. Try to build a more regular schedule.`)
  }

  const restDays = dowData.filter((d) => d.sessions === 0)
  if (restDays.length === 0) {
    insights.push('You train every day of the week. Consider scheduling a dedicated rest day for recovery.')
  } else if (restDays.length >= 3) {
    insights.push(`Your natural rest days are ${restDays.map((d) => d.label).join(', ')}. This allows good weekly recovery.`)
  }

  const timeMap: Record<string, string> = {
    morning: 'Morning workouts can improve energy and mood throughout the day.',
    afternoon: 'Afternoon training often aligns with peak physiological performance.',
    evening: 'Evening training may improve sleep quality if finished 2+ hours before bed.',
  }
  if (timeMap[stats.preferredTime]) {
    insights.push(`You prefer ${stats.preferredTime} workouts. ${timeMap[stats.preferredTime]}`)
  }

  if (weeklyData.length >= 4) {
    const last4 = weeklyData.slice(-4).map((w) => w.mins)
    const first4 = weeklyData.slice(0, 4).map((w) => w.mins)
    const recentAvg = last4.reduce((a, b) => a + b, 0) / last4.length
    const earlierAvg = first4.reduce((a, b) => a + b, 0) / first4.length
    if (recentAvg > earlierAvg * 1.2) {
      insights.push(`Your weekly volume has increased by ${Math.round((recentAvg - earlierAvg) / Math.max(1, earlierAvg) * 100)}% recently. Monitor for overtraining signs.`)
    } else if (recentAvg < earlierAvg * 0.7 && earlierAvg > 0) {
      insights.push('Your recent training volume is lower than earlier — consider whether this is intentional recovery or reduced motivation.')
    }
  }

  return insights
}

export function TrainingPatternsClient({
  stats,
  dowData,
  hourData,
  weeklyData,
  typeData,
  timeTotals,
}: {
  stats: TrainingStats
  dowData: DowStat[]
  hourData: HourStat[]
  weeklyData: WeeklyStat[]
  typeData: TypeStat[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.sessions), 1)
  const avgWeeklyMins = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + w.mins, 0) / weeklyData.length)
    : 0
  const bestWeekMins = Math.max(...weeklyData.map((w) => w.mins), 0)
  const currentWeekMins = weeklyData[weeklyData.length - 1]?.mins ?? 0
  const hourDataTrimmed = hourData.filter((h) => h.hour >= 5 && h.hour <= 22)
  const totalTimeSession = timeTotals.morning + timeTotals.afternoon + timeTotals.evening || 1

  const insights = buildInsights(stats, dowData, weeklyData)

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{stats.totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions (90d)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.avgPerWeek}</p>
          <p className="text-xs text-text-secondary mt-0.5">Per Week (avg)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.avgDurationMins} min</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-lg font-bold text-purple-400">{stats.busiestDay}</p>
          <p className="text-xs text-text-secondary mt-0.5">Busiest Day</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.consistencyPct}% weeks active</p>
        </div>
      </div>

      {/* DOW distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Distribution</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you train most often</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number, name: string) => [`${val}`, 'Sessions']}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="sessions" name="Sessions" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.sessions === maxDow ? '#f97316' : 'rgba(249,115,22,0.4)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Busiest: <span className="text-orange-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.sessions === 0).length > 0 && (
            <span>Rest days: <span className="font-medium">{dowData.filter((d) => d.sessions === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you prefer to train</p>
        <div className="space-y-3 mb-4">
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

        {/* Hourly sparkline */}
        <p className="text-xs text-text-secondary mb-2 opacity-60">Hourly distribution</p>
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={hourDataTrimmed} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 8 }} interval={2} />
            <YAxis hide />
            <Bar dataKey="sessions" fill="rgba(99,102,241,0.6)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-secondary mt-2 opacity-60">
          You mostly train in the <span className="font-medium">{stats.preferredTime}</span>.
        </p>
      </div>

      {/* Weekly volume */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Training Volume</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Minutes trained per week · last 12 weeks</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} min`, 'Volume']}
                contentStyle={tooltipStyle}
              />
              {avgWeeklyMins > 0 && (
                <ReferenceLine y={avgWeeklyMins} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3" label={{ value: `avg ${avgWeeklyMins}m`, fill: 'rgba(255,255,255,0.4)', fontSize: 9, position: 'insideTopRight' }} />
              )}
              <Bar dataKey="mins" name="Minutes" radius={[3, 3, 0, 0]}>
                {weeklyData.map((w, i) => (
                  <Cell key={i} fill={w.mins >= bestWeekMins * 0.85 ? '#f97316' : 'rgba(96,165,250,0.55)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-3 text-xs text-text-secondary">
            <span>Best: <span className="text-orange-400 font-medium">{bestWeekMins} min</span></span>
            <span>This week: <span className="font-medium">{currentWeekMins} min</span></span>
            <span>Avg: <span className="font-medium">{avgWeeklyMins} min</span></span>
          </div>
        </div>
      )}

      {/* Workout type breakdown */}
      {typeData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Workout Types</p>
          <div className="space-y-2">
            {typeData.map(({ type, count, pct }) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary flex-1 truncate">{type}</span>
                <div className="w-32 h-3 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-orange-400 opacity-70" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-text-secondary w-14 text-right">{pct}% ({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-yellow-400 mb-3">💡 Training Pattern Insights</p>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-60 mt-1.5 flex-none" />
                <p className="text-xs text-text-secondary">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
