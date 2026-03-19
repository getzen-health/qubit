'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

interface HourData {
  hour: number
  avg: number | null
  min: number | null
  max: number | null
  count: number
}

interface Props {
  hourlyAvg: HourData[]
  workoutHours: number[]
  totalReadings: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtHour(h: number) {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function hrColor(bpm: number | null): string {
  if (bpm === null) return '#374151'
  if (bpm < 60)  return '#60a5fa' // blue — low / sleep
  if (bpm < 75)  return '#4ade80' // green — resting
  if (bpm < 95)  return '#facc15' // yellow — light activity
  if (bpm < 120) return '#fb923c' // orange — moderate
  return '#f87171'                // red — intense
}

interface CustomBarProps {
  x?: number; y?: number; width?: number; height?: number
  hour: number; avg: number | null
  workoutHours: number[]
}

function CustomBar(props: CustomBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, avg, hour, workoutHours } = props
  const color = hrColor(avg)
  const isWorkoutHour = workoutHours.includes(hour)
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />
      {isWorkoutHour && (
        <rect x={x} y={y - 4} width={width} height={4} fill="rgba(251,146,60,0.6)" rx={1} />
      )}
    </g>
  )
}

export function HRPatternsClient({ hourlyAvg, workoutHours, totalReadings }: Props) {
  if (totalReadings === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">❤️</span>
        <h2 className="text-lg font-semibold text-text-primary">No heart rate data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch continuously measures heart rate. Make sure background heart rate monitoring is enabled and sync your iPhone.
        </p>
      </div>
    )
  }

  const validHours = hourlyAvg.filter((h) => h.avg !== null && h.count >= 2)

  // Find notable hours
  const sleepHours = hourlyAvg.filter((h) => h.hour >= 0 && h.hour <= 5 && h.avg !== null)
  const avgSleep = sleepHours.length
    ? Math.round(sleepHours.reduce((s, h) => s + h.avg!, 0) / sleepHours.length)
    : null

  const activeHours = hourlyAvg.filter((h) => h.hour >= 8 && h.hour <= 20 && h.avg !== null)
  const peakHour = activeHours.reduce<HourData | null>(
    (best, h) => (h.avg !== null && (!best || h.avg! > best.avg!)) ? h : best,
    null
  )
  const lowestHour = hourlyAvg.reduce<HourData | null>(
    (best, h) => (h.avg !== null && h.count >= 2 && (!best || h.avg! < best.avg!)) ? h : best,
    null
  )

  const morningRiseHour = hourlyAvg.find((h) => h.hour >= 5 && h.hour <= 9 && h.avg !== null && h.avg > (avgSleep ?? 0) + 5)

  const chartData = hourlyAvg.map((h) => ({
    hour: h.hour,
    label: fmtHour(h.hour),
    avg: h.avg ?? 0,
    rawAvg: h.avg,
    count: h.count,
  }))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Sleep HR',
            value: avgSleep ? `${avgSleep} bpm` : '—',
            sub: '12am–5am avg',
            color: 'text-blue-400',
          },
          {
            label: 'Lowest Hour',
            value: lowestHour?.avg ? `${lowestHour.avg} bpm` : '—',
            sub: lowestHour ? fmtHour(lowestHour.hour) : '—',
            color: 'text-green-400',
          },
          {
            label: 'Peak Hour',
            value: peakHour?.avg ? `${peakHour.avg} bpm` : '—',
            sub: peakHour ? fmtHour(peakHour.hour) : '—',
            color: 'text-red-400',
          },
          {
            label: 'Readings',
            value: totalReadings.toLocaleString(),
            sub: 'Last 14 days',
            color: 'text-text-primary',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* 24-hour bar chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-secondary">Average Heart Rate by Hour of Day</h2>
          {workoutHours.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-orange-400">
              <div className="w-3 h-1.5 rounded bg-orange-400/60" />
              Workout hours
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, props: { payload?: { count: number } }) => [
                `${v} bpm · ${props.payload?.count ?? 0} readings`,
                'Avg HR',
              ]}
              labelFormatter={(label) => `${label}`}
            />
            {avgSleep && (
              <ReferenceLine
                y={avgSleep}
                stroke="rgba(96,165,250,0.3)"
                strokeDasharray="4 3"
                label={{ value: `Sleep avg ${avgSleep}`, fill: '#60a5fa', fontSize: 9, position: 'insideTopLeft' }}
              />
            )}
            <Bar dataKey="avg" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={hrColor(entry.rawAvg)}
                  opacity={entry.count < 2 ? 0.2 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-secondary">
          {[
            { color: '#60a5fa', label: '< 60 bpm (sleep/deep rest)' },
            { color: '#4ade80', label: '60–74 (resting)' },
            { color: '#facc15', label: '75–94 (light activity)' },
            { color: '#fb923c', label: '95–119 (moderate)' },
            { color: '#f87171', label: '≥ 120 (intense)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Hourly table for data-dense view */}
      {validHours.length >= 12 && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-text-secondary">Hourly Breakdown</h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <div className="text-text-secondary font-medium">Hour</div>
            <div className="text-text-secondary font-medium">Avg HR</div>
            <div className="text-text-secondary font-medium">Readings</div>
            {hourlyAvg
              .filter((h) => h.avg !== null && h.count >= 2)
              .map((h) => (
                <>
                  <div key={`h-${h.hour}`} className="text-text-secondary">{fmtHour(h.hour)}</div>
                  <div key={`v-${h.hour}`} style={{ color: hrColor(h.avg) }} className="font-medium">{h.avg} bpm</div>
                  <div key={`c-${h.hour}`} className="text-text-secondary opacity-60">{h.count}</div>
                </>
              ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">Reading Your Pattern</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p><span className="text-blue-400 font-medium">Sleep dip:</span> The lowest HR zone (typically 12am–5am) shows your parasympathetic activity during sleep. A lower sleeping HR relative to resting HR is healthy.</p>
          <p><span className="text-yellow-400 font-medium">Morning rise:</span> HR naturally climbs as cortisol peaks (6–9am). A sharp morning spike may indicate poor sleep or high stress.</p>
          {morningRiseHour && <p><span className="text-green-400 font-medium">Your rise:</span> Your HR begins climbing at ~{fmtHour(morningRiseHour.hour)}, suggesting your natural wake time aligns with this window.</p>}
          <p><span className="text-orange-400 font-medium">Workout peaks:</span> Orange markers show hours when you typically exercise, explaining elevated HR during those hours.</p>
          <p className="opacity-60 pt-1">Data averaged across the last 14 days. Hours with fewer than 2 readings are shown with reduced opacity.</p>
        </div>
      </div>
    </div>
  )
}
