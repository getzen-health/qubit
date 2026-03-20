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
  Dot,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RateStatus = 'normal' | 'elevated' | 'high'

export interface DailyReading {
  date: string
  rate: number
  status: RateStatus
  baseline: number
}

export interface WeeklyAvg {
  week: string
  avg: number
  risk: RateStatus
}

export interface BreathingRateData {
  latestRate: number
  latestStatus: RateStatus
  baseline: number
  deltaVsBaseline: number
  lowest30d: number
  highest30d: number
  daily: DailyReading[]
  weekly: WeeklyAvg[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL   = '#2dd4bf'
const GREEN  = '#4ade80'
const YELLOW = '#facc15'
const ORANGE = '#fb923c'
const TEAL_MUTED = 'rgba(45,212,191,0.25)'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: RateStatus): string {
  if (status === 'normal')   return GREEN
  if (status === 'elevated') return YELLOW
  return ORANGE
}

function statusLabel(status: RateStatus): string {
  if (status === 'normal')   return 'Normal'
  if (status === 'elevated') return 'Elevated'
  return 'High'
}

function statusTextClass(status: RateStatus): string {
  if (status === 'normal')   return 'text-green-400'
  if (status === 'elevated') return 'text-yellow-400'
  return 'text-orange-400'
}

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}`
  return delta.toFixed(1)
}

// ─── Custom dot for line chart (colored by status) ───────────────────────────

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: DailyReading
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={statusColor(payload.status)}
      stroke="var(--color-surface, #1a1a1a)"
      strokeWidth={1.5}
    />
  )
}

// ─── Reference ranges table rows ─────────────────────────────────────────────

const REFERENCE_RANGES = [
  { range: '< 10 br/min',  label: 'Below normal',                       color: '#818cf8', bgOpacity: 'bg-indigo-500/10',  textClass: 'text-indigo-400' },
  { range: '12–16 br/min', label: 'Optimal',                            color: GREEN,     bgOpacity: 'bg-green-500/10',   textClass: 'text-green-400' },
  { range: '16–20 br/min', label: 'Normal',                             color: TEAL,      bgOpacity: 'bg-teal-500/10',    textClass: 'text-teal-400' },
  { range: '20–25 br/min', label: 'Slightly elevated — check for illness', color: YELLOW,  bgOpacity: 'bg-yellow-500/10',  textClass: 'text-yellow-400' },
  { range: '> 25 br/min',  label: 'Elevated — illness / fever / stress', color: ORANGE,   bgOpacity: 'bg-orange-500/10',  textClass: 'text-orange-400' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function BreathingRateClient({ data }: { data: BreathingRateData }) {
  const {
    latestRate,
    latestStatus,
    baseline,
    deltaVsBaseline,
    lowest30d,
    highest30d,
    daily,
    weekly,
  } = data

  // Y-axis domain padded around the data range
  const allRates = daily.map((d) => d.rate)
  const yMin = Math.max(8, Math.floor(Math.min(...allRates)) - 1)
  const yMax = Math.min(28, Math.ceil(Math.max(...allRates)) + 1)

  return (
    <div className="space-y-6">

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(45,212,191,0.07)', borderColor: 'rgba(45,212,191,0.22)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              Latest Nightly Rate
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold" style={{ color: TEAL }}>
                {latestRate.toFixed(1)}
              </p>
              <p className="text-sm text-text-secondary">br/min</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold mt-1 ${statusTextClass(latestStatus)}`}
            style={{ background: `${statusColor(latestStatus)}20`, border: `1px solid ${statusColor(latestStatus)}40` }}
          >
            {statusLabel(latestStatus)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary">{baseline.toFixed(1)}</p>
            <p className="text-xs text-text-secondary mt-0.5">30d Baseline</p>
            <p className="text-xs text-text-secondary opacity-50">br/min</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${statusTextClass(latestStatus)}`}>
              {deltaLabel(deltaVsBaseline)}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">vs Baseline</p>
            <p className="text-xs text-text-secondary opacity-50">br/min · normal</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-indigo-400">{lowest30d.toFixed(1)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Lowest 30d</p>
            <p className="text-xs text-text-secondary opacity-50">br/min</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-orange-400">{highest30d.toFixed(1)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Highest 30d</p>
            <p className="text-xs text-text-secondary opacity-50">br/min</p>
          </div>
        </div>
      </div>

      {/* ── 30-day trend line chart ───────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">30-Day Nightly Trend</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Dots colored by status — green: normal · yellow: elevated · orange: high
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val.toFixed(1)} br/min`, 'Breathing Rate']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            {/* Upper normal reference */}
            <ReferenceLine
              y={20}
              stroke={ORANGE}
              strokeDasharray="5 3"
              strokeOpacity={0.45}
              label={{ value: 'Upper normal (20)', fill: ORANGE, fontSize: 9, position: 'insideTopRight' }}
            />
            {/* Dashed baseline */}
            <ReferenceLine
              y={baseline}
              stroke={TEAL}
              strokeDasharray="6 3"
              strokeOpacity={0.55}
              label={{ value: `Baseline ${baseline}`, fill: TEAL, fontSize: 9, position: 'insideBottomRight' }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={TEAL_MUTED}
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: TEAL }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Weekly average bar chart ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Weekly Average</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Bars colored by risk level — green: normal · yellow: elevated · orange: high
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[Math.max(8, baseline - 3), Math.min(28, highest30d + 2)]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val.toFixed(1)} br/min`, 'Weekly Avg']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <ReferenceLine
              y={baseline}
              stroke={TEAL}
              strokeDasharray="5 3"
              strokeOpacity={0.5}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {weekly.map((entry, i) => (
                <Cell key={i} fill={statusColor(entry.risk)} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Reference ranges table ────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Reference Ranges</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">
            Adult resting / nightly respiratory rate
          </p>
        </div>
        <div className="divide-y divide-border">
          {REFERENCE_RANGES.map(({ range, label, bgOpacity, textClass }) => (
            <div
              key={range}
              className={`flex items-center justify-between px-4 py-3 ${bgOpacity}`}
            >
              <div>
                <p className={`text-sm font-semibold tabular-nums ${textClass}`}>{range}</p>
                <p className="text-xs text-text-secondary mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Illness signal alert ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.28)' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-none mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-orange-400 mb-1">Illness Signal</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Consistent elevation &gt;2 br/min above your baseline for 3+ nights is a meaningful
              signal — monitor for illness symptoms. Your recent 5-night bout (17–18.4 br/min)
              matched this pattern.
            </p>
            <p className="text-xs text-text-secondary mt-3 opacity-60">
              Apple Watch accuracy vs clinical: ~90% via accelerometer motion during sleep. Best
              interpreted as a relative trend rather than an absolute clinical measurement.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
