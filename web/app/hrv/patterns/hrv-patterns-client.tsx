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
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from 'recharts'

export interface HrvPatternStats {
  totalDays: number
  avgHrv: number
  minHrv: number
  maxHrv: number
  elevatedCount: number
  normalCount: number
  lowCount: number
  trendDelta: number | null
  baseline: number
}

export interface DowHrvStat {
  label: string
  avgHrv: number | null
  count: number
  aboveBaselinePct: number | null
}

export interface MonthHrvStat {
  label: string
  avgHrv: number
  minHrv: number
  maxHrv: number
  count: number
}

export interface SleepPair {
  sleepHours: number
  hrv: number
}

export interface TrendPoint {
  date: string
  hrv: number
  rolling: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

function hrvColor(hrv: number, baseline: number): string {
  const ratio = hrv / baseline
  if (ratio >= 1.15) return '#a855f7' // elevated — purple
  if (ratio >= 0.85) return '#22c55e' // normal — green
  return '#ef4444'                     // low — red
}

function trendLabel(delta: number | null) {
  if (delta === null) return null
  if (delta >= 2) return { text: `+${delta} ms improving`, color: 'text-green-400' }
  if (delta <= -2) return { text: `${delta} ms declining`, color: 'text-red-400' }
  return { text: 'Stable trend', color: 'text-text-secondary' }
}

export function HrvPatternsClient({
  stats,
  dowData,
  monthData,
  sleepPairs,
  trendData,
}: {
  stats: HrvPatternStats
  dowData: DowHrvStat[]
  monthData: MonthHrvStat[]
  sleepPairs: SleepPair[]
  trendData: TrendPoint[]
}) {
  const { totalDays, avgHrv, minHrv, maxHrv, elevatedCount, normalCount, lowCount, trendDelta, baseline } = stats
  const trend = trendLabel(trendDelta)
  const dowWithData = dowData.filter((d) => d.avgHrv !== null && d.count > 0)
  const yDomain = [Math.max(0, minHrv - 5), maxHrv + 5] as [number, number]

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{avgHrv} ms</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HRV (baseline)</p>
          <p className="text-xs text-text-secondary opacity-60">{totalDays} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {Math.round((normalCount + elevatedCount) / totalDays * 100)}%
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Near/Above Baseline</p>
          <p className="text-xs text-text-secondary opacity-60">{normalCount + elevatedCount} days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{minHrv}–{maxHrv}</p>
          <p className="text-xs text-text-secondary mt-0.5">Range (ms)</p>
          <p className="text-xs text-text-secondary opacity-60">past year</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          {trend ? (
            <>
              <p className={`text-base font-bold ${trend.color}`}>{trend.text.split(' ')[0]}</p>
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
        <p className="text-sm font-semibold text-text-primary mb-4">Zone Distribution vs Personal Baseline</p>
        <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
          {elevatedCount > 0 && (
            <div className="bg-purple-500/70 flex-none" style={{ width: `${Math.round(elevatedCount / totalDays * 100)}%` }} />
          )}
          {normalCount > 0 && (
            <div className="bg-green-500/70 flex-none" style={{ width: `${Math.round(normalCount / totalDays * 100)}%` }} />
          )}
          {lowCount > 0 && (
            <div className="bg-red-500/70 flex-none" style={{ width: `${Math.round(lowCount / totalDays * 100)}%` }} />
          )}
        </div>
        <div className="space-y-2">
          {[
            { label: `Elevated (≥ ${Math.round(baseline * 1.15)} ms)`, count: elevatedCount, color: 'bg-purple-500/70', text: 'text-purple-400' },
            { label: `Normal (${Math.round(baseline * 0.85)}–${Math.round(baseline * 1.15)} ms)`, count: normalCount, color: 'bg-green-500/70', text: 'text-green-400' },
            { label: `Low (< ${Math.round(baseline * 0.85)} ms)`, count: lowCount, color: 'bg-red-500/70', text: 'text-red-400' },
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

      {/* 90-day trend chart */}
      {trendData.length >= 14 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">90-Day Trend</p>
          {trend && (
            <p className={`text-xs ${trend.color} mb-3 opacity-80`}>{trend.text}</p>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} ms`, name === 'rolling' ? '7-day avg' : 'Daily']}
                contentStyle={tooltipStyle}
                labelFormatter={(l) => l}
              />
              <ReferenceLine y={baseline} stroke="#a855f7" strokeDasharray="4 2" strokeOpacity={0.5}
                label={{ value: 'Baseline', fill: '#a855f7', fontSize: 10, position: 'insideTopLeft' }} />
              <Area type="monotone" dataKey="hrv" stroke="#a855f7" strokeWidth={0} fill="url(#hrvGrad)" dot={false} />
              <Line type="monotone" dataKey="rolling" name="7-day avg" stroke="#a855f7" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average HRV by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} ms`, 'Avg HRV']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={baseline} stroke="#a855f7" strokeDasharray="4 2" strokeOpacity={0.5} />
              <Bar dataKey="avgHrv" name="Avg HRV" fill="#a855f7" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW above-baseline % */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Above-Baseline Days by Day of Week</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of readings at or above your personal baseline</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.aboveBaselinePct === null) return null
              const color = d.aboveBaselinePct >= 60 ? '#22c55e' : d.aboveBaselinePct >= 40 ? '#f59e0b' : '#ef4444'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.aboveBaselinePct}%`, backgroundColor: color + 'cc' }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.aboveBaselinePct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {monthData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly HRV Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [`${val} ms`, name]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={baseline} stroke="#a855f7" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="avgHrv" name="Avg HRV (ms)" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="minHrv" name="Min HRV (ms)" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep vs HRV scatter */}
      {sleepPairs.length >= 10 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Sleep Duration vs HRV</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">More sleep typically correlates with higher HRV</p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="sleepHours"
                name="Sleep"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis dataKey="hrv" name="HRV" type="number" domain={yDomain} tick={{ fontSize: 10 }} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(val: number, name: string) => [name === 'hrv' ? `${val} ms` : `${val}h`, name === 'hrv' ? 'HRV' : 'Sleep']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={baseline} stroke="#a855f7" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Scatter data={sleepPairs} fill="#a855f7" fillOpacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Understanding Your HRV Zones</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-purple-400 font-medium">Elevated (≥ +15% baseline)</span> · Excellent recovery, high readiness for training</p>
          <p><span className="text-green-400 font-medium">Normal (±15% baseline)</span> · Good recovery, proceed with planned activities</p>
          <p><span className="text-red-400 font-medium">Low (&lt; −15% baseline)</span> · Reduced recovery, consider lighter training or rest</p>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Your personal baseline is the average of all available HRV readings ({stats.totalDays} days).
          HRV is measured by Apple Watch during sleep and reflects autonomic nervous system activity.
        </p>
      </div>
    </div>
  )
}
