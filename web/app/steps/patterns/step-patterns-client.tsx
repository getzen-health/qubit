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
}

export interface PatternData {
  dowData: DowEntry[]
  monthData: MonthEntry[]
  histogram: HistEntry[]
  totalDays: number
  mean: number
  stddev: number
  cv: number          // 0=perfectly consistent, 1=highly variable
  goalHitRate: number
  goalHitDays: number
  stepGoal: number
  bestDow: DowEntry | null
  worstDow: DowEntry | null
  weekdayAvg: number
  weekendAvg: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`
}

function consistencyLabel(cv: number) {
  if (cv <= 0.25) return { label: 'Very Consistent', color: 'text-green-400' }
  if (cv <= 0.45) return { label: 'Fairly Consistent', color: 'text-yellow-400' }
  if (cv <= 0.65) return { label: 'Somewhat Variable', color: 'text-orange-400' }
  return { label: 'Highly Variable', color: 'text-red-400' }
}

function consistencyScore(cv: number) {
  // Map cv to 0-100 (lower cv = higher score)
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: string
}

function StatCard({ label, value, sub, color = 'text-green-400' }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs text-text-secondary font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5 opacity-70">{sub}</p>}
    </div>
  )
}

export function StepPatternsClient({ data }: { data: PatternData }) {
  if (data.totalDays < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">🚶</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync at least 7 days of step data to see your activity patterns.
        </p>
      </div>
    )
  }

  const consistency = consistencyLabel(data.cv)
  const consScore   = consistencyScore(data.cv)
  const weekdayHigher = data.weekdayAvg >= data.weekendAvg

  // Annotate dow bars with color based on above/below mean
  const dowChartData = data.dowData.map(d => ({
    ...d,
    fill: d.avg >= data.mean ? '#4ade80' : '#94a3b8',
  }))

  // Filter months with data
  const monthsWithData = data.monthData.filter(m => m.count >= 3)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Daily Average"
          value={fmtK(data.mean)}
          sub="steps · last 12 months"
          color="text-green-400"
        />
        <StatCard
          label="Goal Hit Rate"
          value={`${data.goalHitRate}%`}
          sub={`${data.goalHitDays} of ${data.totalDays} days ≥ ${fmtK(data.stepGoal)}`}
          color={data.goalHitRate >= 70 ? 'text-green-400' : data.goalHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}
        />
        <StatCard
          label="Consistency"
          value={`${consScore}/100`}
          sub={consistency.label}
          color={consistency.color}
        />
        <StatCard
          label={weekdayHigher ? 'More Active On' : 'More Active On'}
          value={weekdayHigher ? 'Weekdays' : 'Weekends'}
          sub={weekdayHigher
            ? `${fmtK(data.weekdayAvg)} vs ${fmtK(data.weekendAvg)} avg`
            : `${fmtK(data.weekendAvg)} vs ${fmtK(data.weekdayAvg)} avg`}
          color="text-blue-400"
        />
      </div>

      {/* Day-of-week chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-1">Steps by Day of Week</h2>
        <p className="text-xs text-text-secondary opacity-60 mb-4">
          Average daily steps · green = above your mean of {fmtK(data.mean)}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dowChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtK}
            />
            <ReferenceLine
              y={data.mean}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 4"
              label={{ value: 'avg', fill: '#888', fontSize: 10, position: 'insideTopRight' }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v.toLocaleString()} steps`, 'Avg']}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]} fill="#4ade80" />
          </BarChart>
        </ResponsiveContainer>

        {/* Best/worst day callouts */}
        {(data.bestDow || data.worstDow) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {data.bestDow && (
              <div className="bg-green-500/10 rounded-lg p-3">
                <p className="text-xs text-green-400 font-medium">Most Active Day</p>
                <p className="text-base font-bold text-green-400">{data.bestDow.label}</p>
                <p className="text-xs text-text-secondary">{data.bestDow.avg.toLocaleString()} avg steps</p>
              </div>
            )}
            {data.worstDow && (
              <div className="bg-surface-secondary rounded-lg p-3">
                <p className="text-xs text-text-secondary font-medium">Least Active Day</p>
                <p className="text-base font-bold text-text-primary">{data.worstDow.label}</p>
                <p className="text-xs text-text-secondary">{data.worstDow.avg.toLocaleString()} avg steps</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weekday vs Weekend comparison */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Weekday vs Weekend</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Weekday Average', value: data.weekdayAvg, color: 'bg-blue-500', isHigher: weekdayHigher },
            { label: 'Weekend Average', value: data.weekendAvg, color: 'bg-purple-500', isHigher: !weekdayHigher },
          ].map(({ label, value, color, isHigher }) => (
            <div key={label} className="space-y-2">
              <p className="text-xs text-text-secondary">{label}</p>
              <p className={`text-2xl font-bold ${isHigher ? 'text-text-primary' : 'text-text-secondary'}`}>
                {value.toLocaleString()}
              </p>
              <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${Math.min(100, (value / Math.max(data.weekdayAvg, data.weekendAvg, 1)) * 100)}%` }}
                />
              </div>
              {isHigher && (
                <p className="text-xs text-green-400 font-medium">
                  +{Math.round(Math.abs(data.weekdayAvg - data.weekendAvg)).toLocaleString()} more
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly pattern */}
      {monthsWithData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary mb-1">Steps by Month</h2>
          <p className="text-xs text-text-secondary opacity-60 mb-4">Seasonal activity patterns</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthsWithData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtK}
              />
              <ReferenceLine
                y={data.mean}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} steps`, 'Avg']}
              />
              <Bar dataKey="avg" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Step distribution histogram */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-1">Step Count Distribution</h2>
        <p className="text-xs text-text-secondary opacity-60 mb-4">
          How many days in each step bucket · {data.totalDays} days total
        </p>
        <div className="space-y-2">
          {data.histogram.map(bucket => {
            const pct = data.totalDays > 0 ? (bucket.count / data.totalDays) * 100 : 0
            const isGoalBucket = bucket.label.includes('10') || bucket.label.includes('12') || bucket.label.includes('15')
            return (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-14 shrink-0 text-right">{bucket.label}</span>
                <div className="flex-1 h-5 bg-surface-secondary rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${isGoalBucket ? 'bg-green-500' : 'bg-blue-500/60'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary w-12 shrink-0">
                  {bucket.count}d ({Math.round(pct)}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Consistency insight */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary">Consistency Analysis</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Variable</span>
              <span>Consistent</span>
            </div>
            <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${consScore >= 70 ? 'bg-green-500' : consScore >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                style={{ width: `${consScore}%` }}
              />
            </div>
          </div>
          <span className={`text-lg font-bold ${consistency.color}`}>{consScore}</span>
        </div>
        <p className="text-xs text-text-secondary">
          {consistency.label} · Standard deviation: {data.stddev.toLocaleString()} steps
        </p>
        <p className="text-xs text-text-secondary opacity-70">
          {data.cv <= 0.35
            ? 'Your step counts are steady day-to-day. Consistent movement builds lasting habits.'
            : data.cv <= 0.55
            ? 'Moderate day-to-day variation. Some variation is healthy — it shows active days and planned rest.'
            : 'High day-to-day variation suggests your activity is irregular. Try to build a consistent daily movement routine.'}
        </p>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        Last 12 months of step data · {data.totalDays} days analysed
      </p>
    </div>
  )
}
