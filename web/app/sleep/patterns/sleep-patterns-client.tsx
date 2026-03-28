'use client'

import { SummaryCard } from '@/components/ui/summary-card'
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
  avgMins: number
  count: number
  isWeekend: boolean
}

export interface MonthEntry {
  label: string
  avgMins: number
  count: number
}

export interface HistEntry {
  label: string
  count: number
  isOptimal: boolean
}

export interface SleepPatternData {
  dowData: DowEntry[]
  monthData: MonthEntry[]
  histogram: HistEntry[]
  totalDays: number
  meanMins: number
  stddevMins: number
  cv: number
  goalHitRate: number
  goalHitDays: number
  sleepGoalMinutes: number
  bestDow: DowEntry | null
  worstDow: DowEntry | null
  weeknightAvg: number
  weekendAvg: number
  avgBedtimeStr: string | null
  avgDeepMins: number | null
  avgRemMins: number | null
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtMins(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

function consistencyLabel(cv: number) {
  if (cv <= 0.12) return { label: 'Very Consistent', color: 'text-green-400' }
  if (cv <= 0.20) return { label: 'Fairly Consistent', color: 'text-yellow-400' }
  if (cv <= 0.30) return { label: 'Somewhat Variable', color: 'text-orange-400' }
  return { label: 'Highly Variable', color: 'text-red-400' }
}

function consistencyScore(cv: number) {
  // Sleep CV is smaller than step CV — scale accordingly (max meaningful CV ≈ 0.40)
  return Math.max(0, Math.min(100, Math.round((1 - cv / 0.40) * 100)))
}


export function SleepPatternsClient({ data }: { data: SleepPatternData }) {
  if (data.totalDays < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">😴</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync at least 7 nights of sleep data to see your patterns.
        </p>
      </div>
    )
  }

  const consistency = consistencyLabel(data.cv)
  const consScore   = consistencyScore(data.cv)
  const weekendLonger = data.weekendAvg > data.weeknightAvg
  const socialJetLag  = Math.abs(data.weekendAvg - data.weeknightAvg)

  const dowChartData = data.dowData.map(d => ({
    ...d,
    fill: d.avgMins >= data.meanMins ? '#818cf8' : '#94a3b8',
  }))

  const monthsWithData = data.monthData.filter(m => m.count >= 3)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          title="Avg Sleep"
          value={fmtMins(data.meanMins)}
          subtitle="per night · 6 months"
          colorClass="text-indigo-400"
        />
        <SummaryCard
          title="Goal Hit Rate"
          value={`${data.goalHitRate}%`}
          subtitle={`${data.goalHitDays} of ${data.totalDays} nights ≥ ${fmtMins(data.sleepGoalMinutes)}`}
          colorClass={data.goalHitRate >= 70 ? 'text-green-400' : data.goalHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}
        />
        <SummaryCard
          title="Consistency"
          value={`${consScore}/100`}
          subtitle={consistency.label}
          colorClass={consistency.color}
        />
        {data.avgBedtimeStr ? (
          <SummaryCard
            title="Avg Bedtime"
            value={data.avgBedtimeStr}
            subtitle="typical sleep start"
            colorClass="text-purple-400"
          />
        ) : (
          <SummaryCard
            title="Sleep Variation"
            value={`±${fmtMins(data.stddevMins)}`}
            subtitle="standard deviation"
            colorClass="text-orange-400"
          />
        )}
      </div>

      {/* Day-of-week chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-1">Sleep by Day of Week</h2>
        <p className="text-xs text-text-secondary opacity-60 mb-4">
          Average sleep duration · indigo = above your mean of {fmtMins(data.meanMins)}
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
              tickFormatter={(v: number) => `${Math.floor(v / 60)}h`}
            />
            <ReferenceLine
              y={data.meanMins}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 4"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [fmtMins(v), 'Avg']}
            />
            <Bar dataKey="avgMins" radius={[4, 4, 0, 0]} fill="#818cf8" />
          </BarChart>
        </ResponsiveContainer>

        {(data.bestDow || data.worstDow) && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {data.bestDow && (
              <div className="bg-indigo-500/10 rounded-lg p-3">
                <p className="text-xs text-indigo-400 font-medium">Best Sleep Night</p>
                <p className="text-base font-bold text-indigo-400">{data.bestDow.label}night</p>
                <p className="text-xs text-text-secondary">{fmtMins(data.bestDow.avgMins)} avg</p>
              </div>
            )}
            {data.worstDow && (
              <div className="bg-surface-secondary rounded-lg p-3">
                <p className="text-xs text-text-secondary font-medium">Shortest Sleep Night</p>
                <p className="text-base font-bold text-text-primary">{data.worstDow.label}night</p>
                <p className="text-xs text-text-secondary">{fmtMins(data.worstDow.avgMins)} avg</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weeknight vs weekend (social jet lag) */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-1">Weeknight vs Weekend</h2>
        {socialJetLag >= 30 && (
          <p className="text-xs text-orange-400 mb-3">
            Social jet lag: {fmtMins(socialJetLag)} sleep difference — this can disrupt your circadian rhythm.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Weeknight Avg', value: data.weeknightAvg, isLonger: !weekendLonger },
            { label: 'Weekend Avg',   value: data.weekendAvg,   isLonger: weekendLonger  },
          ].map(({ label, value, isLonger }) => (
            <div key={label} className="space-y-2">
              <p className="text-xs text-text-secondary">{label}</p>
              <p className={`text-2xl font-bold ${isLonger ? 'text-indigo-400' : 'text-text-secondary'}`}>
                {fmtMins(value)}
              </p>
              <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, (value / Math.max(data.weeknightAvg, data.weekendAvg, 1)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {socialJetLag < 30 && (
          <p className="text-xs text-green-400 mt-3">
            Great schedule consistency! Less than 30 min difference between weeknights and weekends.
          </p>
        )}
      </div>

      {/* Monthly pattern */}
      {monthsWithData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary mb-1">Sleep by Month</h2>
          <p className="text-xs text-text-secondary opacity-60 mb-4">Seasonal sleep patterns</p>
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
                tickFormatter={(v: number) => `${Math.floor(v / 60)}h`}
              />
              <ReferenceLine y={data.meanMins} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtMins(v), 'Avg']}
              />
              <Bar dataKey="avgMins" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Duration histogram */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-1">Sleep Duration Distribution</h2>
        <p className="text-xs text-text-secondary opacity-60 mb-4">
          How many nights in each range · {data.totalDays} nights total
        </p>
        <div className="space-y-2">
          {data.histogram.map(bucket => {
            const pct = data.totalDays > 0 ? (bucket.count / data.totalDays) * 100 : 0
            return (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-12 shrink-0 text-right">{bucket.label}</span>
                <div className="flex-1 h-5 bg-surface-secondary rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${bucket.isOptimal ? 'bg-indigo-500' : 'bg-indigo-500/40'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary w-14 shrink-0">
                  {bucket.count}n ({Math.round(pct)}%)
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-indigo-400 mt-3">
          Darker bars (7–9h) are the recommended range for most adults.
        </p>
      </div>

      {/* Deep + REM averages */}
      {(data.avgDeepMins !== null || data.avgRemMins !== null) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Average Stage Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.avgDeepMins !== null && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Deep Sleep</p>
                <p className="text-2xl font-bold text-blue-400">{fmtMins(data.avgDeepMins)}</p>
                <p className="text-xs text-text-secondary opacity-60">
                  {data.meanMins > 0 ? `${Math.round((data.avgDeepMins / data.meanMins) * 100)}% of sleep` : ''}
                </p>
                <p className="text-xs text-text-secondary opacity-50 mt-1">Optimal: 13–23%</p>
              </div>
            )}
            {data.avgRemMins !== null && (
              <div>
                <p className="text-xs text-text-secondary mb-1">REM Sleep</p>
                <p className="text-2xl font-bold text-purple-400">{fmtMins(data.avgRemMins)}</p>
                <p className="text-xs text-text-secondary opacity-60">
                  {data.meanMins > 0 ? `${Math.round((data.avgRemMins / data.meanMins) * 100)}% of sleep` : ''}
                </p>
                <p className="text-xs text-text-secondary opacity-50 mt-1">Optimal: 20–25%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consistency insight */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-secondary">Consistency Score</h2>
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
          {consistency.label} · ±{fmtMins(data.stddevMins)} standard deviation
        </p>
        <p className="text-xs text-text-secondary opacity-70">
          {data.cv <= 0.15
            ? 'Excellent sleep schedule! Consistent timing helps regulate your circadian rhythm and improves sleep quality over time.'
            : data.cv <= 0.25
            ? 'Good consistency. Minor night-to-night variation is normal — you\'re building healthy sleep habits.'
            : 'High variability in sleep duration. Irregular sleep patterns can affect mood, metabolism, and cognitive performance.'}
        </p>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        Last 6 months of sleep data · {data.totalDays} nights analysed
      </p>
    </div>
  )
}
