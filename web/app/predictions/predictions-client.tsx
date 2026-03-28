'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface DailySummary {
  date: string
  steps: number | null
  active_calories: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
}

interface Props {
  summaries: DailySummary[]
}

interface DataPoint {
  label: string
  actual: number | null
  predicted: number | null
  upper: number | null
  lower: number | null
}

function linearRegression(values: number[]): { slope: number; intercept: number; stddev: number } {
  const n = values.length
  const xs = values.map((_, i) => i)
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = values.reduce((a, b) => a + b, 0) / n
  const slope =
    xs.reduce((sum, x, i) => sum + (x - meanX) * (values[i] - meanY), 0) /
    xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  const intercept = meanY - slope * meanX
  const residuals = values.map((y, i) => y - (slope * i + intercept))
  const stddev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n)
  return { slope, intercept, stddev }
}

function buildForecast(
  raw: (number | null)[],
  histLabels: string[],
  futureLabels: string[]
): { data: DataPoint[]; slope: number; mean: number } | null {
  const usable = raw.filter((v): v is number => v !== null)
  if (usable.length < 3) return null

  const { slope, intercept, stddev } = linearRegression(usable)
  const mean = usable.reduce((a, b) => a + b, 0) / usable.length

  // Historical points — mark the last one as transition (connects to forecast line)
  const historical: DataPoint[] = raw.map((v, i) => {
    const isLast = i === raw.length - 1
    return {
      label: histLabels[i],
      actual: v,
      predicted: isLast ? v : null,
      upper: isLast && v !== null ? Math.round(v + stddev) : null,
      lower: isLast && v !== null ? Math.round(Math.max(0, v - stddev)) : null,
    }
  })

  const forecast: DataPoint[] = futureLabels.map((label, i) => {
    const predicted = Math.max(0, Math.round(intercept + slope * (usable.length + i)))
    return {
      label,
      actual: null,
      predicted,
      upper: Math.round(predicted + stddev),
      lower: Math.round(Math.max(0, predicted - stddev)),
    }
  })

  return { data: [...historical, ...forecast], slope, mean }
}

function trendBadge(slope: number, mean: number) {
  const threshold = mean * 0.015
  if (slope > threshold)
    return <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">↑ Improving</span>
  if (slope < -threshold)
    return <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">↓ Declining</span>
  return <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">→ Stable</span>
}

interface MetricCardProps {
  title: string
  unit: string
  color: string
  data: DataPoint[]
  slope: number
  mean: number
  splitIdx: number
  formatValue?: (v: number) => string
}

function MetricCard({ title, unit, color, data, slope, mean, splitIdx, formatValue }: MetricCardProps) {
  const fmt = formatValue ?? ((v: number) => String(v))

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        {trendBadge(slope, mean)}
      </div>
      <div className="flex gap-4 mb-2 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 inline-block" style={{ background: color }} /> Historical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ borderColor: color }} /> Forecast
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id={`band-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'var(--text-secondary)' }}
            interval={Math.floor(data.length / 5)}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'actual') return [`${fmt(value)} ${unit}`, 'Actual']
              if (name === 'predicted') return [`${fmt(value)} ${unit}`, 'Forecast']
              if (name === 'upper') return [`${fmt(value)} ${unit}`, '+1 σ']
              if (name === 'lower') return [`${fmt(value)} ${unit}`, '−1 σ']
              return [value, name]
            }}
          />
          {/* Today divider */}
          {data[splitIdx - 1] && (
            <ReferenceLine
              x={data[splitIdx - 1].label}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 2"
              label={{ value: 'Now', fontSize: 9, fill: 'var(--text-secondary)', position: 'insideTopRight' }}
            />
          )}
          {/* Confidence band — upper area */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill={`url(#band-${title})`}
            dot={false}
            activeDot={false}
            legendType="none"
          />
          {/* Confidence band — lower punch-out */}
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="var(--background)"
            dot={false}
            activeDot={false}
            legendType="none"
          />
          {/* Historical solid line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            legendType="none"
          />
          {/* Forecast dashed line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="5 3"
            strokeOpacity={0.7}
            dot={false}
            connectNulls={false}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PredictionsClient({ summaries }: Props) {
  // Use last 14 days for regression
  const window14 = summaries.slice(-14)

  const histLabels = window14.map((s) =>
    new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  const lastDate = window14.length > 0 ? new Date(window14[window14.length - 1].date + 'T00:00:00') : new Date()
  const futureLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i + 1)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const stepsForecast = buildForecast(window14.map((s) => s.steps), histLabels, futureLabels)
  const sleepForecast = buildForecast(window14.map((s) => s.sleep_duration_minutes), histLabels, futureLabels)
  const hrvForecast = buildForecast(window14.map((s) => s.avg_hrv), histLabels, futureLabels)

  const splitIdx = window14.length

  const hasData = stepsForecast || sleepForecast || hrvForecast

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <span className="text-xl">🔮</span>
          <h1 className="text-xl font-bold text-text-primary">7-Day Forecast</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {!hasData ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="text-4xl">📊</span>
            <p className="text-sm text-text-secondary max-w-xs">
              Not enough data yet. Sync at least 3 days of health data to see your forecast.
            </p>
          </div>
        ) : (
          <>
            {stepsForecast && (
              <MetricCard
                title="Steps"
                unit="steps"
                color="#3b82f6"
                data={stepsForecast.data}
                slope={stepsForecast.slope}
                mean={stepsForecast.mean}
                splitIdx={splitIdx}
                formatValue={(v) => v.toLocaleString()}
              />
            )}
            {sleepForecast && (
              <MetricCard
                title="Sleep"
                unit="min"
                color="#8b5cf6"
                data={sleepForecast.data}
                slope={sleepForecast.slope}
                mean={sleepForecast.mean}
                splitIdx={splitIdx}
                formatValue={(v) => `${Math.floor(v / 60)}h ${v % 60}m`}
              />
            )}
            {hrvForecast && (
              <MetricCard
                title="HRV"
                unit="ms"
                color="#10b981"
                data={hrvForecast.data}
                slope={hrvForecast.slope}
                mean={hrvForecast.mean}
                splitIdx={splitIdx}
              />
            )}
          </>
        )}

        <p className="text-xs text-text-secondary text-center px-4 pt-2">
          Predictions are estimates based on your 14-day trend. Not medical advice.
        </p>
      </main>
    </div>
  )
}
