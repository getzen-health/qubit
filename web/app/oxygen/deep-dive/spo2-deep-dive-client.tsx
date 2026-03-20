'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpO2Status = 'normal' | 'borderline' | 'low' | 'veryLow'

export interface DailySpO2Reading {
  date: string
  avg: number
  min: number
  readings: number
  status: SpO2Status
}

export interface SpO2Data {
  avg30d: number
  latestReading: number
  lowestReading: number
  sleepAvg: number
  daysBelowThreshold: number
  latestStatus: SpO2Status
  daily: DailySpO2Reading[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE   = '#3B82F6'
const GREEN  = '#22c55e'
const YELLOW = '#eab308'
const ORANGE = '#f97316'
const RED    = '#ef4444'

const BLUE_MUTED = 'rgba(59,130,246,0.25)'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: SpO2Status): string {
  if (status === 'normal')     return BLUE
  if (status === 'borderline') return YELLOW
  if (status === 'low')        return ORANGE
  return RED
}

function statusLabel(status: SpO2Status): string {
  if (status === 'normal')     return 'Normal'
  if (status === 'borderline') return 'Borderline'
  if (status === 'low')        return 'Low'
  return 'Very Low'
}

function statusTextClass(status: SpO2Status): string {
  if (status === 'normal')     return 'text-blue-400'
  if (status === 'borderline') return 'text-yellow-400'
  if (status === 'low')        return 'text-orange-400'
  return 'text-red-400'
}

function statusBgClass(status: SpO2Status): string {
  if (status === 'normal')     return 'bg-blue-500/10'
  if (status === 'borderline') return 'bg-yellow-500/10'
  if (status === 'low')        return 'bg-orange-500/10'
  return 'bg-red-500/10'
}

// ─── Custom dot for line chart (colored by status) ───────────────────────────

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: DailySpO2Reading
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

// ─── Reference ranges ────────────────────────────────────────────────────────

const REFERENCE_RANGES = [
  {
    range: '≥ 95%',
    label: 'Normal — healthy blood oxygen saturation',
    bgOpacity: 'bg-blue-500/10',
    textClass: 'text-blue-400',
  },
  {
    range: '92–94%',
    label: 'Borderline — consider consulting a healthcare provider',
    bgOpacity: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
  },
  {
    range: '88–91%',
    label: 'Low — medical evaluation recommended',
    bgOpacity: 'bg-orange-500/10',
    textClass: 'text-orange-400',
  },
  {
    range: '< 88%',
    label: 'Very Low — seek medical attention',
    bgOpacity: 'bg-red-500/10',
    textClass: 'text-red-400',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function SpO2DeepDiveClient({ data }: { data: SpO2Data }) {
  const {
    avg30d,
    latestReading,
    lowestReading,
    sleepAvg,
    daysBelowThreshold,
    latestStatus,
    daily,
  } = data

  // Table: last 14 days (most recent first)
  const tableRows = [...daily].reverse().slice(0, 14)

  // Chart: ascending (oldest first, left to right)
  const chartData = [...daily]

  return (
    <div className="space-y-6">

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.22)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              30-Day Average SpO₂
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold" style={{ color: BLUE }}>
                {avg30d.toFixed(1)}
              </p>
              <p className="text-sm text-text-secondary">%</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold mt-1 ${statusTextClass(latestStatus)}`}
            style={{
              background: `${statusColor(latestStatus)}20`,
              border: `1px solid ${statusColor(latestStatus)}40`,
            }}
          >
            {statusLabel(latestStatus)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary">{latestReading.toFixed(1)}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Latest Reading</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-orange-400">{lowestReading.toFixed(1)}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Lowest 30d</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-300">{sleepAvg.toFixed(1)}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Sleep Average</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${daysBelowThreshold > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {daysBelowThreshold}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Days Below 95%</p>
          </div>
        </div>
      </div>

      {/* ── 30-day trend line chart ───────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">30-Day Trend</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Dots colored by status — blue: normal · yellow: borderline · orange: low · red: very low
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              domain={[85, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val.toFixed(1)}%`, 'SpO₂']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            {/* 95% normal threshold — green dashed */}
            <ReferenceLine
              y={95}
              stroke={GREEN}
              strokeDasharray="5 3"
              strokeOpacity={0.55}
              label={{ value: '95% Normal', fill: GREEN, fontSize: 9, position: 'insideTopRight' }}
            />
            {/* 92% borderline threshold — orange dashed */}
            <ReferenceLine
              y={92}
              stroke={ORANGE}
              strokeDasharray="5 3"
              strokeOpacity={0.55}
              label={{ value: '92% Borderline', fill: ORANGE, fontSize: 9, position: 'insideBottomRight' }}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke={BLUE_MUTED}
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: BLUE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Daily log table ───────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Daily Log</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">Last 14 days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-xs font-medium text-text-secondary">Date</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-text-secondary">Avg %</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-text-secondary">Min %</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-text-secondary">Readings</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableRows.map((row) => (
                <tr key={row.date} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-4 py-2.5 text-text-primary font-medium">{row.date}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-primary">
                    {row.avg.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {row.min.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {row.readings}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusTextClass(row.status)} ${statusBgClass(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reference ranges card ─────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Reference Ranges</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">
            Blood oxygen saturation (SpO₂) thresholds
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
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-text-secondary opacity-60 leading-relaxed">
            Apple Watch measures SpO₂ using optical sensors on the wrist. Accuracy may be affected
            by skin tone, wrist position, movement, and cold temperatures. Results should be
            interpreted as trends rather than clinical-grade measurements. Consult a healthcare
            provider for medical concerns.
          </p>
        </div>
      </div>

    </div>
  )
}
