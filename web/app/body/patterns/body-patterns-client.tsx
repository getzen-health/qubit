'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  AreaChart,
  Area,
} from 'recharts'

export interface BodyPatternStats {
  latest: number
  earliest: number
  avg: number
  minWeight: number
  maxWeight: number
  totalChange: number
  weeklyChange: number | null
  change30: number | null
  weeklySlope: number
  trendDir: 'gaining' | 'losing' | 'maintaining'
  latestBf: number | null
  earliestBf: number | null
  bfChange: number | null
  totalMeasurements: number
}

export interface DowWeightStat {
  label: string
  avgWeight: number | null
  count: number
  diffFromAvg: number | null
}

export interface MonthWeightStat {
  label: string
  key: string
  avgWeight: number
  minWeight: number
  maxWeight: number
  avgBf: number | null
  count: number
}

export interface WeightTrendPoint {
  date: string
  weight: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

function signed(val: number, decimals = 1): string {
  return (val >= 0 ? '+' : '') + val.toFixed(decimals)
}

function trendLabel(dir: string): { text: string; color: string } {
  if (dir === 'gaining') return { text: 'Gaining', color: 'text-red-400' }
  if (dir === 'losing') return { text: 'Losing', color: 'text-green-400' }
  return { text: 'Maintaining', color: 'text-blue-400' }
}

export function BodyPatternsClient({
  stats,
  dowData,
  monthData,
  trendData,
}: {
  stats: BodyPatternStats
  dowData: DowWeightStat[]
  monthData: MonthWeightStat[]
  trendData: WeightTrendPoint[]
}) {
  const { latest, avg, minWeight, maxWeight, totalChange, weeklyChange, change30, weeklySlope, trendDir, latestBf, earliestBf, bfChange } = stats
  const trend = trendLabel(trendDir)
  const yDomain = [Math.floor(minWeight - 1), Math.ceil(maxWeight + 1)] as [number, number]
  const dowWithData = dowData.filter((d) => d.avgWeight !== null && d.count > 0)
  const maxDiff = Math.max(...dowWithData.map((d) => Math.abs(d.diffFromAvg ?? 0)), 0.01)

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{latest.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Current (kg)</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${totalChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {signed(totalChange)} kg
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Total Change</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{avg.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Year Average</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{minWeight.toFixed(1)}–{maxWeight.toFixed(1)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Range (kg)</p>
        </div>
      </div>

      {/* Rate of change */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Rate of Change</p>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="text-center px-4">
            <p className="text-xs text-text-secondary mb-1">Last 7 days</p>
            {weeklyChange != null ? (
              <p className={`text-lg font-bold ${weeklyChange > 0 ? 'text-red-400' : weeklyChange < 0 ? 'text-green-400' : 'text-text-secondary'}`}>
                {signed(weeklyChange)} kg
              </p>
            ) : (
              <p className="text-lg font-bold text-text-secondary">—</p>
            )}
          </div>
          <div className="text-center px-4">
            <p className="text-xs text-text-secondary mb-1">Last 30 days</p>
            {change30 != null ? (
              <p className={`text-lg font-bold ${change30 > 0 ? 'text-red-400' : change30 < 0 ? 'text-green-400' : 'text-text-secondary'}`}>
                {signed(change30)} kg
              </p>
            ) : (
              <p className="text-lg font-bold text-text-secondary">—</p>
            )}
          </div>
          <div className="text-center px-4">
            <p className="text-xs text-text-secondary mb-1">Trend</p>
            <p className={`text-base font-bold ${trend.color}`}>{trend.text}</p>
            <p className="text-xs text-text-secondary opacity-70">{signed(weeklySlope, 2)} kg/wk</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary opacity-50 mt-3 text-center">
          ±0.05 kg/week = maintaining · beyond = gaining or losing
        </p>
      </div>

      {/* Body fat (if available) */}
      {latestBf != null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Body Fat %</p>
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center px-4">
              <p className="text-xs text-text-secondary mb-1">Current</p>
              <p className="text-lg font-bold text-purple-400">{latestBf.toFixed(1)}%</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-text-secondary mb-1">Started</p>
              <p className="text-lg font-bold text-text-primary">{earliestBf != null ? earliestBf.toFixed(1) + '%' : '—'}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-text-secondary mb-1">Change</p>
              {bfChange != null ? (
                <p className={`text-lg font-bold ${bfChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {signed(bfChange, 1)}%
                </p>
              ) : (
                <p className="text-lg font-bold text-text-secondary">—</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 90-day trend chart */}
      {trendData.length >= 14 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">90-Day Trend</p>
          <p className={`text-xs mb-3 opacity-80 ${trend.color}`}>{trend.text} · {signed(weeklySlope, 2)} kg/week</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} kg`, 'Weight']}
                contentStyle={tooltipStyle}
                labelFormatter={(l) => l}
              />
              <ReferenceLine y={avg} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Area type="monotone" dataKey="weight" stroke="#60a5fa" strokeWidth={1.5} fill="url(#weightGrad)" dot={false} activeDot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW diverging bar chart */}
      {dowWithData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weight by Day of Week</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Deviation from {avg.toFixed(1)} kg average</p>
          <div className="space-y-2">
            {dowData.filter((d) => d.count > 0).map((d) => {
              const diff = d.diffFromAvg ?? 0
              const pct = Math.abs(diff) / maxDiff * 50 // 50% = max bar width from center
              const isPos = diff > 0
              return (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-7">{d.label}</span>
                  <div className="flex-1 flex items-center h-5 relative">
                    {/* center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                    {isPos ? (
                      <div
                        className="absolute top-1 bottom-1 rounded-sm"
                        style={{ left: '50%', width: `${pct}%`, backgroundColor: '#f87171cc' }}
                      />
                    ) : diff < 0 ? (
                      <div
                        className="absolute top-1 bottom-1 rounded-sm"
                        style={{ right: `${50}%`, width: `${pct}%`, backgroundColor: '#4ade80cc' }}
                      />
                    ) : null}
                  </div>
                  <span className={`text-xs font-medium w-14 text-right ${isPos ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-text-secondary'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)} kg
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-text-secondary opacity-40 mt-3">Green = lighter · Red = heavier than your average</p>
        </div>
      )}

      {/* Monthly trend chart */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Weight</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number, name: string) => [`${val} kg`, name === 'avgBf' ? 'Avg BF%' : name === 'avgWeight' ? 'Avg Weight' : name]}
              />
              <Line type="monotone" dataKey="avgWeight" name="Avg Weight" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
              {monthData.some((m) => m.avgBf != null) && (
                <Line type="monotone" dataKey="avgBf" name="Avg BF%" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
          {monthData.some((m) => m.avgBf != null) && (
            <div className="flex gap-4 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Weight (kg)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-px border-t border-dashed border-purple-400 inline-block" /> Body fat %</span>
            </div>
          )}
        </div>
      )}

      {/* Monthly summary table */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <p className="text-sm font-semibold text-text-primary p-4 pb-3">Monthly Summary</p>
          <div className="divide-y divide-border">
            {[...monthData].reverse().map((m) => (
              <div key={m.key} className="flex items-center px-4 py-3">
                <span className="text-sm text-text-secondary w-8">{m.label}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-400">{m.avgWeight.toFixed(1)} kg avg</p>
                  <p className="text-xs text-text-secondary opacity-60">{m.minWeight.toFixed(1)}–{m.maxWeight.toFixed(1)} kg range</p>
                </div>
                <div className="text-right">
                  {m.avgBf != null && (
                    <p className="text-xs text-purple-400">{m.avgBf.toFixed(1)}% fat</p>
                  )}
                  <p className="text-xs text-text-secondary opacity-50">{m.count} readings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Healthy Rate of Change</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-green-400 font-medium">Gradual loss</span> · 0.25–0.5 kg/week is sustainable</p>
          <p><span className="text-blue-400 font-medium">Maintaining</span> · Less than ±0.05 kg/week variance</p>
          <p><span className="text-orange-400 font-medium">Muscle gain</span> · 0.1–0.25 kg/week (with strength training)</p>
          <p><span className="text-red-400 font-medium">Rapid change</span> · More than 1 kg/week may indicate water retention or unsustainable deficit</p>
        </div>
        <p className="text-xs text-text-secondary opacity-50 mt-3">
          Daily weight fluctuates 0.5–2 kg due to hydration, food, and sleep timing. Use trends over weeks, not single readings.
        </p>
      </div>
    </div>
  )
}
