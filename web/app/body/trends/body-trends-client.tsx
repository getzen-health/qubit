'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, Cell, ReferenceLine,
} from 'recharts'

export interface DowWeightStat {
  label: string
  count: number
  avgWeight: number | null
  diffFromAvg: number | null
}

export interface MonthWeightStat {
  label: string
  count: number
  avgWeight: number
  minWeight: number
  maxWeight: number
  avgBf: number | null
}

export interface BodyTrendData {
  totalMeasurements: number
  latest: number
  earliest: number
  minWeight: number
  maxWeight: number
  avgWeight: number
  totalChange: number
  weeklyChange: number | null
  change30: number | null
  weeklySlope: number  // kg/week from linear regression
  trendDir: 'gaining' | 'losing' | 'maintaining'
  latestBf: number | null
  earliestBf: number | null
  bfChange: number | null
  dowData: DowWeightStat[]
  monthData: MonthWeightStat[]
  weightGoal: number | null
  projectedGoalDate: string | null
}

function signStr(val: number, unit = 'kg') {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)} ${unit}`
}

function TrendBadge({ dir }: { dir: 'gaining' | 'losing' | 'maintaining' }) {
  const cfg = {
    gaining:    { label: 'Gaining',    color: 'text-red-400',    bg: 'bg-red-500/10',    dot: '🔺' },
    losing:     { label: 'Losing',     color: 'text-green-400',  bg: 'bg-green-500/10',  dot: '🔻' },
    maintaining:{ label: 'Stable',     color: 'text-blue-400',   bg: 'bg-blue-500/10',   dot: '➡️' },
  }[dir]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.dot} {cfg.label}
    </span>
  )
}

export function BodyTrendsClient({ data }: { data: BodyTrendData }) {
  const {
    totalMeasurements, latest, earliest, minWeight, maxWeight, avgWeight,
    totalChange, weeklyChange, change30, weeklySlope, trendDir,
    latestBf, earliestBf, bfChange, dowData, monthData,
    weightGoal, projectedGoalDate,
  } = data

  const dowWithData = dowData.filter((d) => d.avgWeight !== null && d.count > 0)
  const maxDiff = Math.max(...dowWithData.map((d) => Math.abs(d.diffFromAvg ?? 0)), 0.1)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Current', value: `${latest.toFixed(1)} kg`, color: 'text-blue-400' },
          { label: 'Change (total)', value: signStr(totalChange), color: totalChange <= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Average', value: `${avgWeight.toFixed(1)} kg`, color: 'text-text-primary' },
          { label: 'Range', value: `${minWeight.toFixed(1)}–${maxWeight.toFixed(1)}`, color: 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Rate of change */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Rate of Change</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">Last 7 days</p>
            <p className={`text-lg font-bold ${weeklyChange === null ? 'text-text-secondary' : weeklyChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {weeklyChange !== null ? signStr(weeklyChange) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">Last 30 days</p>
            <p className={`text-lg font-bold ${change30 === null ? 'text-text-secondary' : change30 > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {change30 !== null ? signStr(change30) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">Trend</p>
            <div className="flex justify-center">
              <TrendBadge dir={trendDir} />
            </div>
            <p className="text-xs text-text-secondary mt-1">{weeklySlope.toFixed(2)} kg/wk</p>
          </div>
        </div>
      </div>

      {/* Body fat summary */}
      {latestBf !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Body Fat %</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary mb-1">Current</p>
              <p className="text-xl font-bold text-purple-400">{latestBf.toFixed(1)}%</p>
            </div>
            {earliestBf !== null && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Started</p>
                <p className="text-xl font-bold text-text-primary">{earliestBf.toFixed(1)}%</p>
              </div>
            )}
            {bfChange !== null && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Change</p>
                <p className={`text-xl font-bold ${bfChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {bfChange >= 0 ? '+' : ''}{bfChange.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOW patterns */}
      {dowWithData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weight by Day of Week</p>
          <p className="text-xs text-text-secondary mb-4">Deviation from your average ({avgWeight.toFixed(1)} kg) — negative means lighter that day</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              const diff = d.diffFromAvg
              if (diff === null) return null
              const pct = Math.abs(diff) / maxDiff
              const isPos = diff > 0
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 flex items-center">
                    {/* negative side */}
                    <div className="flex-1 flex justify-end">
                      {!isPos && diff !== 0 && (
                        <div
                          className="h-4 rounded-l-sm bg-green-500/70"
                          style={{ width: `${pct * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="w-px h-5 bg-border mx-1" />
                    {/* positive side */}
                    <div className="flex-1">
                      {isPos && diff !== 0 && (
                        <div
                          className="h-4 rounded-r-sm bg-red-500/70"
                          style={{ width: `${pct * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium w-16 text-right ${isPos ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-text-secondary'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)} kg
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-text-secondary mt-3 opacity-60">
            Green = lighter than avg · Red = heavier than avg
          </p>
        </div>
      )}

      {/* Monthly trend */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Weight</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val.toFixed(2)} kg`, name]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              {(monthData.some((m) => m.avgBf !== null) || weightGoal) && (
                <Legend wrapperStyle={{ fontSize: 11 }} />
              )}
              <Line type="monotone" dataKey="avgWeight" name="Avg Weight (kg)" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
              {monthData.some((m) => m.avgBf !== null) && (
                <Line type="monotone" dataKey="avgBf" name="Body Fat %" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" yAxisId={1} />
              )}
              {weightGoal && (
                <ReferenceLine y={weightGoal} stroke="#a3e635" strokeDasharray="5 5" label={{ value: `Goal: ${weightGoal.toFixed(1)} kg`, position: 'insideTopRight', offset: -5, fill: '#a3e635', fontSize: 11 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
          {weightGoal && projectedGoalDate && (
            <div className="mt-4 p-3 bg-lime-500/10 border border-lime-500/30 rounded-lg">
              <p className="text-sm text-lime-400">
                📅 At this rate, you'll reach your goal by <span className="font-semibold">{projectedGoalDate}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Monthly table */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-semibold text-text-primary">Monthly Summary</p>
          </div>
          <div className="divide-y divide-border">
            {[...monthData].reverse().map((m) => (
              <div key={m.label} className="flex items-center px-4 py-3">
                <div className="w-10 text-sm font-medium text-text-secondary">{m.label}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-400">{m.avgWeight.toFixed(1)} kg avg</p>
                  <p className="text-xs text-text-secondary">{m.minWeight.toFixed(1)}–{m.maxWeight.toFixed(1)} kg range</p>
                </div>
                <div className="text-right">
                  {m.avgBf !== null && (
                    <p className="text-sm text-purple-400">{m.avgBf.toFixed(1)}% fat</p>
                  )}
                  <p className="text-xs text-text-secondary">{m.count} readings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
