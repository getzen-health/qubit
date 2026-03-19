'use client'

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

export interface DowEntry {
  label: string
  avg: number
  count: number
  isWeekend: boolean
}

export interface MonthEntry {
  label: string
  avg: number
  count: number
}

export interface HistEntry {
  label: string
  count: number
  isHighGoal: boolean
}

export interface CaloriePatternData {
  dowData: DowEntry[]
  monthData: MonthEntry[]
  histogram: HistEntry[]
  totalDays: number
  mean: number
  stddev: number
  cv: number
  calorieGoal: number | null
  goalHitRate: number | null
  goalHitDays: number | null
  bestDow: DowEntry | null
  worstDow: DowEntry | null
  weekdayAvg: number
  weekendAvg: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

function consistencyScore(cv: number): { score: number; label: string; color: string } {
  // CV for calories: 0=perfect, >0.8=very variable (wider range than steps since workout days spike high)
  const score = Math.max(0, Math.min(100, Math.round((1 - cv / 0.8) * 100)))
  if (score >= 80) return { score, label: 'Very Consistent', color: '#4ade80' }
  if (score >= 60) return { score, label: 'Consistent',      color: '#86efac' }
  if (score >= 40) return { score, label: 'Moderate',        color: '#facc15' }
  if (score >= 20) return { score, label: 'Variable',        color: '#fb923c' }
  return              { score, label: 'Highly Variable',  color: '#f87171' }
}

export function CaloriePatternsClient({ data }: { data: CaloriePatternData }) {
  const { dowData, monthData, histogram, totalDays, mean, stddev, cv, calorieGoal, goalHitRate, goalHitDays, bestDow, worstDow, weekdayAvg, weekendAvg } = data

  const consistency = consistencyScore(cv)

  const maxDay   = Math.max(...dowData.map(d => d.avg), 1)
  const weekdayMore = weekdayAvg >= weekendAvg

  if (totalDays < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">🔥</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync at least 7 days of activity data to see calorie burn patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">Daily Average</p>
          <p className="text-2xl font-bold text-orange-400">{mean.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-0.5">kcal active burn</p>
        </div>

        {goalHitRate !== null ? (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Goal Hit Rate</p>
            <p className="text-2xl font-bold text-text-primary">{goalHitRate}%</p>
            <p className="text-xs text-text-secondary mt-0.5">{goalHitDays} of {totalDays} days</p>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">Variability</p>
            <p className="text-2xl font-bold text-text-primary">±{stddev.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-0.5">kcal std dev</p>
          </div>
        )}

        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">Consistency</p>
          <p className="text-2xl font-bold" style={{ color: consistency.color }}>{consistency.score}</p>
          <p className="text-xs text-text-secondary mt-0.5">{consistency.label}</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">{weekdayMore ? 'Weekdays' : 'Weekends'} higher</p>
          <p className="text-2xl font-bold text-text-primary">
            +{Math.abs(weekdayAvg - weekendAvg).toLocaleString()}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">kcal difference</p>
        </div>
      </div>

      {/* Day-of-week chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Burn by Day of Week</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          Average active calories per weekday · reference line = overall mean
        </p>

        {bestDow && worstDow && (
          <div className="flex gap-4 mb-4">
            <div className="flex-1 rounded-lg bg-orange-500/10 border border-orange-500/20 p-2.5">
              <p className="text-xs text-orange-400 font-semibold">Most Active</p>
              <p className="text-sm font-bold text-text-primary mt-0.5">
                {bestDow.label} · {bestDow.avg.toLocaleString()} kcal
              </p>
            </div>
            <div className="flex-1 rounded-lg bg-surface-secondary border border-border p-2.5">
              <p className="text-xs text-text-secondary font-semibold">Least Active</p>
              <p className="text-sm font-bold text-text-primary mt-0.5">
                {worstDow.label} · {worstDow.avg.toLocaleString()} kcal
              </p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dowData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Avg active']}
            />
            <ReferenceLine y={mean} stroke="rgba(251,146,60,0.4)" strokeDasharray="4 2" />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}
              fill="rgba(251,146,60,0.5)"
              label={false}
              // Colour bars above/below mean differently
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Weekday vs weekend comparison */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Weekdays avg</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400"
                  style={{ width: `${(weekdayAvg / maxDay) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-primary w-12 text-right">
                {weekdayAvg.toLocaleString()}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Weekends avg</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(weekendAvg / maxDay) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-primary w-12 text-right">
                {weekendAvg.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly chart */}
      {monthData.some(m => m.count >= 3) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Averages</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">Seasonal calorie burn trends · months with &lt;3 days hidden</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthData.filter(m => m.count >= 3)} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Avg active']}
              />
              <Bar dataKey="avg" fill="rgba(251,146,60,0.65)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie distribution histogram */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Calorie Distribution</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">How often you hit each calorie range</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={histogram} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} days`, 'Frequency']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isHighGoal ? 'rgba(251,146,60,0.80)' : 'rgba(251,146,60,0.40)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {calorieGoal && (
          <p className="text-xs text-text-secondary opacity-60 mt-2 text-center">
            Darker bars = at or above your {calorieGoal.toLocaleString()} kcal goal
          </p>
        )}
      </div>

      {/* Consistency breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Consistency Analysis</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Consistency score</span>
              <span style={{ color: consistency.color }}>{consistency.label}</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${consistency.score}%`, background: consistency.color }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold w-12 text-right" style={{ color: consistency.color }}>
            {consistency.score}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-lg bg-surface-secondary p-2">
            <p className="text-text-secondary">Mean</p>
            <p className="font-semibold text-text-primary mt-0.5">{mean.toLocaleString()} kcal</p>
          </div>
          <div className="rounded-lg bg-surface-secondary p-2">
            <p className="text-text-secondary">Std Dev</p>
            <p className="font-semibold text-text-primary mt-0.5">±{stddev.toLocaleString()} kcal</p>
          </div>
          <div className="rounded-lg bg-surface-secondary p-2">
            <p className="text-text-secondary">CV</p>
            <p className="font-semibold text-text-primary mt-0.5">{(cv * 100).toFixed(0)}%</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary opacity-50 mt-3">
          High variability often reflects workout days spiking vs rest days — a healthy pattern for active people.
        </p>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalDays} days analysed · Active calories only (does not include BMR)
      </p>
    </div>
  )
}
