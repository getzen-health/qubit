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
import { Scale } from 'lucide-react'

interface DaySummary {
  date: string
  weight_kg: number
  body_fat_percent?: number | null
}

interface BodyClientProps {
  summaries: DaySummary[]
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BodyClient({ summaries }: BodyClientProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Scale className="w-10 h-10 text-text-secondary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">No weight data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import body weight from Apple Health.
        </p>
      </div>
    )
  }

  const weights = summaries.map((s) => s.weight_kg)
  const latest = weights[weights.length - 1]
  const earliest = weights[0]
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const change = latest - earliest
  const changeSign = change >= 0 ? '+' : ''

  const chartData = summaries.map((s, i) => {
    const slice = summaries.slice(Math.max(0, i - 29), i + 1)
    const avg = slice.reduce((a, b) => a + b.weight_kg, 0) / slice.length
    return {
      date: fmtDate(s.date),
      weight: +s.weight_kg.toFixed(1),
      avg: +avg.toFixed(1),
    }
  })

  const tooltipStyle = {
    background: 'var(--color-surface, #1a1a1a)',
    border: '1px solid var(--color-border, #333)',
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Current', value: `${latest.toFixed(1)} kg`, color: 'text-text-primary' },
          { label: 'Change', value: `${changeSign}${change.toFixed(1)} kg`, color: change <= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Average', value: `${avgWeight.toFixed(1)} kg`, color: 'text-blue-400' },
          { label: 'Range', value: `${minWeight.toFixed(1)}–${maxWeight.toFixed(1)}`, color: 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Weight chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Weight (kg)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [
                `${value} kg`,
                name === 'weight' ? 'Weight' : '30d avg',
              ]}
            />
            <ReferenceLine
              y={avgWeight}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 3"
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#60a5fa"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#60a5fa' }}
              activeDot={{ r: 4 }}
            />
            {summaries.length > 14 && (
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {summaries.length > 14 && (
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Daily
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-400 inline-block" /> 30d avg
            </span>
          </div>
        )}
      </div>

      {/* Body fat chart (if data available) */}
      {summaries.some((s) => (s.body_fat_percent ?? 0) > 0) && (() => {
        const bfData = summaries
          .filter((s) => (s.body_fat_percent ?? 0) > 0)
          .map((s) => ({ date: fmtDate(s.date), bf: +((s.body_fat_percent ?? 0).toFixed(1)) }))
        const latestBf = bfData[bfData.length - 1]?.bf
        return (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-text-secondary">Body Fat %</h2>
              {latestBf && <span className="text-sm font-semibold text-text-primary">{latestBf}%</span>}
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={bfData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Body Fat']} />
                <Line type="monotone" dataKey="bf" stroke="#a78bfa" strokeWidth={1.5} dot={{ r: 2, fill: '#a78bfa' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })()}

      {/* Measurement list */}
      <div className="space-y-2">
        {[...summaries].reverse().map((s) => (
          <div
            key={s.date}
            className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between"
          >
            <p className="text-sm font-medium text-text-primary">
              {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="text-right">
              <p className="text-blue-400 font-semibold">{s.weight_kg.toFixed(1)} kg</p>
              {(s.body_fat_percent ?? 0) > 0 && (
                <p className="text-xs text-purple-400">{s.body_fat_percent!.toFixed(1)}% fat</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
