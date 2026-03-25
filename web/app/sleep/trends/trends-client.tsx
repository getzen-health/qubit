'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

export interface TrendEntry {
  date: string
  dateIso: string
  durationHours: number
  efficiency: number | null
  sleepScore: number | null
  deepMinutes: number
  remMinutes: number
  coreMinutes: number
  awakeMinutes: number
}

export interface TrendSummary {
  avgDuration: number
  avgEfficiency: number | null
  bestNight: { dateIso: string; dateLabel: string; score: number } | null
  trend: 'improving' | 'stable' | 'declining'
  totalNights: number
}

interface TrendsClientProps {
  trendData: TrendEntry[]
  summary: TrendSummary
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const STAGE_COLORS = {
  deep: '#6366f1',
  rem: '#a855f7',
  core: '#38bdf8',
  awake: '#f87171',
}

const TREND_ICON = { improving: '↑', stable: '→', declining: '↓' }
const TREND_COLOR = { improving: 'text-green-400', stable: 'text-blue-400', declining: 'text-red-400' }

function durationColor(hours: number): string {
  if (hours >= 7) return '#22c55e'
  if (hours >= 6) return '#f97316'
  return '#ef4444'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DurationDot(props: any) {
  const { cx, cy, value } = props as { cx: number; cy: number; value: number }
  if (cx == null || cy == null || value == null) return <g />
  return <circle cx={cx} cy={cy} r={3} fill={durationColor(value)} />
}

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

export function TrendsClient({ trendData, summary }: TrendsClientProps) {
  if (trendData.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📊</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          At least 5 nights of sleep data are needed to show trends. Keep syncing your Apple Watch!
        </p>
      </div>
    )
  }

  const stage14 = trendData.slice(-14)
  const hasStageData = stage14.some((d) => d.deepMinutes + d.remMinutes + d.coreMinutes > 0)
  const hasEfficiency = trendData.some((d) => d.efficiency !== null)

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-text-secondary mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-text-primary">{fmtHours(summary.avgDuration)}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">30-Day Trend</p>
            <p className={`text-2xl font-bold ${TREND_COLOR[summary.trend]}`}>
              {TREND_ICON[summary.trend]}
              <span className="text-base ml-1 capitalize">{summary.trend}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Avg Efficiency</p>
            <p className="text-2xl font-bold text-text-primary">
              {summary.avgEfficiency != null ? `${summary.avgEfficiency}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Best Night</p>
            <p className="text-lg font-bold text-text-primary leading-tight">
              {summary.bestNight ? summary.bestNight.dateLabel : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Duration trend line chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">Duration Trend (30 days)</h3>
        <div className="flex gap-4 mb-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥7h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> 6–7h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;6h
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[3, 11]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v: number) => `${v}h`}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [fmtHours(v), 'Duration']}
            />
            <ReferenceLine
              y={7.5}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 3"
              label={{ value: '7.5h goal', position: 'insideTopRight', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
            />
            <Line
              type="monotone"
              dataKey="durationHours"
              stroke="#64748b"
              strokeWidth={2}
              dot={DurationDot}
              activeDot={{ r: 4, fill: '#94a3b8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Efficiency area chart */}
      {hasEfficiency && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Sleep Efficiency (30 days)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trendData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[50, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v: number) => `${v}%`}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}%`, 'Efficiency']}
              />
              <ReferenceLine
                y={85}
                stroke="rgba(99,102,241,0.4)"
                strokeDasharray="4 3"
                label={{ value: '85% target', position: 'insideTopRight', fontSize: 9, fill: 'rgba(99,102,241,0.6)' }}
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#effGrad)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stage composition stacked bar – last 14 nights */}
      {hasStageData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Stage Composition (last 14 nights)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stage14} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => {
                  const labels: Record<string, string> = {
                    deepMinutes: 'Deep',
                    remMinutes: 'REM',
                    coreMinutes: 'Core',
                    awakeMinutes: 'Awake',
                  }
                  const h = Math.floor(v / 60)
                  const m = Math.round(v % 60)
                  return [h > 0 ? `${h}h ${m}m` : `${m}m`, labels[name] ?? name]
                }}
              />
              <Bar dataKey="deepMinutes" name="deep" stackId="s" fill={STAGE_COLORS.deep} />
              <Bar dataKey="remMinutes" name="rem" stackId="s" fill={STAGE_COLORS.rem} />
              <Bar dataKey="coreMinutes" name="core" stackId="s" fill={STAGE_COLORS.core} />
              <Bar dataKey="awakeMinutes" name="awake" stackId="s" fill={STAGE_COLORS.awake} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
            {(['Deep', 'REM', 'Core', 'Awake'] as const).map((name) => (
              <span key={name} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-sm inline-block"
                  style={{ backgroundColor: STAGE_COLORS[name.toLowerCase() as keyof typeof STAGE_COLORS] }}
                />
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
