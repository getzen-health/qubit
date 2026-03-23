'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts'

export interface SteadinessData {
  latest: number
  latestZone: 'ok' | 'low' | 'very_low'
  avgPct: number
  minPct: number
  maxPct: number
  n: number
  trendVsLastWeek: number | null
  trendData: { date: string; pct: number }[]
  dowData: { label: string; avg: number | null; count: number }[]
  monthData: { label: string; avg: number; count: number }[]
  okDays: number
  lowDays: number
  veryLowDays: number
}

const ZONE_CONFIG = {
  ok: { label: 'OK', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  low: { label: 'Low', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  very_low: { label: 'Very Low', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
}

function zoneColor(pct: number): string {
  if (pct >= 60) return '#22c55e'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function WalkingSteadinessClient({ data }: { data: SteadinessData }) {
  const {
    latest, latestZone, avgPct, minPct, maxPct, n,
    trendVsLastWeek, trendData, dowData, monthData,
    okDays, lowDays, veryLowDays,
  } = data

  const zone = ZONE_CONFIG[latestZone]
  const totalZoneDays = okDays + lowDays + veryLowDays

  const chartData = trendData.map((r) => ({
    ...r,
    label: fmtDate(r.date),
    color: zoneColor(r.pct),
  }))

  const dowWithData = dowData.filter((d) => d.avg !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className={`rounded-2xl border p-5 ${zone.bg} ${zone.border}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Latest Reading
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-bold ${zone.text}`}>{latest}</span>
              <span className="text-xl text-text-secondary">%</span>
            </div>
            <p className={`text-sm font-semibold mt-1 ${zone.text}`}>{zone.label}</p>
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-lg font-bold text-text-primary">{avgPct}%</p>
              <p className="text-xs text-text-secondary">90-day avg</p>
            </div>
            {trendVsLastWeek !== null && (
              <div>
                <p className={`text-sm font-semibold ${trendVsLastWeek >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {trendVsLastWeek >= 0 ? '+' : ''}{trendVsLastWeek}%
                </p>
                <p className="text-xs text-text-secondary">vs last week</p>
              </div>
            )}
          </div>
        </div>

        {/* Gauge bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>0%</span>
            <span className="text-amber-400">40% Low</span>
            <span className="text-green-400">60% OK</span>
            <span>100%</span>
          </div>
          <div className="relative h-3 bg-surface-secondary rounded-full overflow-hidden">
            {/* zone bands */}
            <div className="absolute inset-0 flex">
              <div className="h-full bg-red-500/20" style={{ width: '40%' }} />
              <div className="h-full bg-amber-500/20" style={{ width: '20%' }} />
              <div className="h-full bg-green-500/20" style={{ width: '40%' }} />
            </div>
            {/* current marker */}
            <div
              className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow"
              style={{ left: `calc(${latest}% - 3px)` }}
            />
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{n}</p>
          <p className="text-xs text-text-secondary mt-0.5">Days tracked</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{minPct}–{maxPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Range</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-primary">{avgPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Average</p>
        </div>
      </div>

      {/* Zone breakdown */}
      {totalZoneDays > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Zone Breakdown</p>
          <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
            {okDays > 0 && (
              <div className="bg-green-500/70" style={{ width: `${(okDays / totalZoneDays) * 100}%` }} />
            )}
            {lowDays > 0 && (
              <div className="bg-amber-500/70" style={{ width: `${(lowDays / totalZoneDays) * 100}%` }} />
            )}
            {veryLowDays > 0 && (
              <div className="bg-red-500/70" style={{ width: `${(veryLowDays / totalZoneDays) * 100}%` }} />
            )}
          </div>
          <div className="space-y-2">
            {[
              { label: 'OK (≥ 60%)', days: okDays, color: 'bg-green-500/70', textColor: 'text-green-400' },
              { label: 'Low (40–59%)', days: lowDays, color: 'bg-amber-500/70', textColor: 'text-amber-400' },
              { label: 'Very Low (< 40%)', days: veryLowDays, color: 'bg-red-500/70', textColor: 'text-red-400' },
            ].map((z) => z.days > 0 && (
              <div key={z.label} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full flex-none ${z.color}`} />
                <span className="text-xs text-text-primary flex-1">{z.label}</span>
                <span className={`text-xs font-semibold w-8 text-right ${z.textColor}`}>
                  {Math.round((z.days / totalZoneDays) * 100)}%
                </span>
                <span className="text-xs text-text-secondary w-10 text-right opacity-60">{z.days}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend chart */}
      {trendData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">90-Day Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[Math.max(0, Math.min(...trendData.map((r) => r.pct)) - 10), 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Steadiness']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'OK', fill: '#22c55e', fontSize: 10 }} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Low', fill: '#f59e0b', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="pct"
                name="Steadiness"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Avg Steadiness']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Bar dataKey="avg" name="Avg Steadiness (%)" radius={[3, 3, 0, 0]}>
                {dowWithData.map((d, i) => (
                  <rect key={i} fill={d.avg !== null ? zoneColor(d.avg) : '#6b7280'} opacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Average</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Avg Steadiness']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="avg" name="Avg Steadiness (%)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">About Walking Steadiness</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs">
            <span className="text-green-400 mt-0.5">●</span>
            <span className="text-text-secondary"><span className="text-text-primary font-medium">OK (≥ 60%)</span> — Normal gait stability, low fall risk</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="text-amber-400 mt-0.5">●</span>
            <span className="text-text-secondary"><span className="text-text-primary font-medium">Low (40–59%)</span> — Reduced stability, elevated fall risk</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="text-red-400 mt-0.5">●</span>
            <span className="text-text-secondary"><span className="text-text-primary font-medium">{'Very Low (< 40%)'}</span> — Significantly reduced stability, high fall risk</span>
          </div>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Measured automatically by iPhone using motion sensors during walking. Requires iPhone in pocket or hand. Available on iOS 15+.
        </p>
      </div>
    </div>
  )
}
