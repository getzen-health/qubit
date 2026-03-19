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
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts'

export interface DowWalkingStat {
  label: string
  count: number
  avgPct: number | null
  okPct: number | null
}

export interface MonthWalkingStat {
  label: string
  avgPct: number
  minPct: number
  okPct: number
  count: number
}

export interface TrendPoint {
  date: string
  pct: number
  rolling: number
}

export interface WalkingPatternData {
  totalDays: number
  avgPct: number
  minPct: number
  maxPct: number
  okCount: number
  lowCount: number
  veryLowCount: number
  trendDelta: number | null
  dowData: DowWalkingStat[]
  monthData: MonthWalkingStat[]
  trendData: TrendPoint[]
}

function wsColor(pct: number): string {
  if (pct >= 60) return '#22c55e'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

function wsTextClass(pct: number): string {
  if (pct >= 60) return 'text-green-400'
  if (pct >= 40) return 'text-amber-400'
  return 'text-red-400'
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function WalkingPatternsClient({ data }: { data: WalkingPatternData }) {
  const {
    totalDays, avgPct, minPct, maxPct,
    okCount, lowCount, veryLowCount,
    trendDelta, dowData, monthData, trendData,
  } = data

  const dowWithData = dowData.filter((d) => d.avgPct !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2
  const okPct = Math.round(okCount / totalDays * 100)
  const yDomain = [Math.max(0, minPct - 5), 100] as [number, number]

  const trendLabel = trendDelta === null ? null
    : trendDelta >= 2 ? { text: `+${trendDelta}% improving trend`, color: 'text-green-400' }
    : trendDelta <= -2 ? { text: `${trendDelta}% declining trend`, color: 'text-red-400' }
    : { text: 'Stable steadiness trend', color: 'text-text-secondary' }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${wsTextClass(avgPct)}`}>{avgPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Steadiness</p>
          <p className="text-xs text-text-secondary opacity-60">{totalDays} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{okPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">OK Range (≥60%)</p>
          <p className="text-xs text-text-secondary opacity-60">{okCount} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{minPct}–{maxPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Range</p>
          <p className="text-xs text-text-secondary opacity-60">past year</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {trendLabel ? (
            <>
              <p className={`text-base font-bold ${trendLabel.color}`}>{trendLabel.text.split(' ')[0]}</p>
              <p className="text-xs text-text-secondary mt-0.5">Trend</p>
              <p className="text-xs text-text-secondary opacity-60">first vs last 30 days</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-primary">—</p>
              <p className="text-xs text-text-secondary">Trend</p>
            </>
          )}
        </div>
      </div>

      {/* Zone breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-4">Zone Distribution</p>
        <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
          {okCount > 0 && <div className="bg-green-500/70 flex-none" style={{ width: `${okPct}%` }} />}
          {lowCount > 0 && <div className="bg-amber-500/70 flex-none" style={{ width: `${Math.round(lowCount / totalDays * 100)}%` }} />}
          {veryLowCount > 0 && <div className="bg-red-500/70 flex-none" style={{ width: `${Math.round(veryLowCount / totalDays * 100)}%` }} />}
        </div>
        <div className="space-y-2">
          {[
            { label: 'OK (≥ 60%)', count: okCount, color: 'bg-green-500/70', text: 'text-green-400' },
            { label: 'Low (40–59%)', count: lowCount, color: 'bg-amber-500/70', text: 'text-amber-400' },
            { label: 'Very Low (< 40%)', count: veryLowCount, color: 'bg-red-500/70', text: 'text-red-400' },
          ].map((z) => z.count > 0 && (
            <div key={z.label} className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full flex-none ${z.color}`} />
              <span className="text-xs text-text-primary flex-1">{z.label}</span>
              <span className={`text-xs font-semibold w-8 text-right ${z.text}`}>
                {Math.round(z.count / totalDays * 100)}%
              </span>
              <span className="text-xs text-text-secondary w-16 text-right opacity-60">{z.count} days</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend chart */}
      {trendData.length >= 14 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">90-Day Trend</p>
          {trendLabel && (
            <p className={`text-xs ${trendLabel.color} mb-3 opacity-80`}>{trendLabel.text}</p>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val}%`, name === 'rolling' ? '7-day avg' : 'Daily']}
                contentStyle={tooltipStyle}
                labelFormatter={(l) => l}
              />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: 'OK', fill: '#22c55e', fontSize: 10 }} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={0} fill="url(#wsGrad)" dot={false} />
              <Line type="monotone" dataKey="rolling" name="7-day avg" stroke="#22c55e" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average Steadiness by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Avg Steadiness']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Bar dataKey="avgPct" name="Avg Steadiness" fill="#22c55e" radius={[3, 3, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW ok% */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">OK Zone % by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of readings in OK zone (≥60%) on each day of week</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.okPct === null) return null
              const color = d.okPct >= 80 ? '#22c55e' : d.okPct >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.okPct}%`, backgroundColor: color + 'cc' }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.okPct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average Steadiness</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val}%`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.3} />
              <Line type="monotone" dataKey="avgPct" name="Avg Steadiness (%)" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="minPct" name="Min Steadiness (%)" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Walking Steadiness Reference</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-green-400 font-medium">≥ 60% — OK</span> · Normal gait stability, low fall risk</p>
          <p><span className="text-amber-400 font-medium">40–59% — Low</span> · Increased fall risk; consider balance exercises</p>
          <p><span className="text-red-400 font-medium">&lt; 40% — Very Low</span> · High fall risk; consult healthcare provider</p>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Measured by iPhone using accelerometer data during walks. Requires iOS 15+ on iPhone 8 or later. Score reflects stability of your walking pattern over the past 30 days of walking data.
        </p>
      </div>
    </div>
  )
}
