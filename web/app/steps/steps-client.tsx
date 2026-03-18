'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Activity } from 'lucide-react'

interface DaySummary {
  date: string
  steps: number
  active_calories?: number | null
  distance_meters?: number | null
}

interface StepsClientProps {
  summaries: DaySummary[]
}

const DEFAULT_STEP_GOAL = 10000

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function StepsClient({ summaries }: StepsClientProps) {
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL)

  useEffect(() => {
    const stored = localStorage.getItem('kquarks_step_goal')
    if (stored) setStepGoal(Number(stored))
  }, [])

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Activity className="w-10 h-10 text-text-secondary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">No activity data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import step data from Apple Health.
        </p>
      </div>
    )
  }

  const withSteps = summaries.filter((s) => s.steps > 0)
  const chartData = withSteps.map((s) => ({
    date: fmtDate(s.date),
    steps: s.steps,
    metGoal: s.steps >= stepGoal,
  }))

  const avg7 = withSteps.slice(-7).reduce((a, b) => a + b.steps, 0) / Math.max(withSteps.slice(-7).length, 1)
  const avg30 = withSteps.reduce((a, b) => a + b.steps, 0) / Math.max(withSteps.length, 1)
  const totalCal = withSteps.reduce((a, b) => a + (b.active_calories ?? 0), 0)
  const totalKm = withSteps.reduce((a, b) => a + (b.distance_meters ?? 0), 0) / 1000
  const goalDays = withSteps.filter((s) => s.steps >= stepGoal).length

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
          { label: '7d Avg', value: Math.round(avg7).toLocaleString(), color: 'text-green-400' },
          { label: '30d Avg', value: Math.round(avg30).toLocaleString(), color: 'text-blue-400' },
          { label: 'Goal Days', value: `${goalDays} / ${withSteps.length}`, color: 'text-accent' },
          { label: 'Total Distance', value: `${totalKm.toFixed(0)} km`, color: 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Steps bar chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Daily Steps</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [value.toLocaleString(), 'Steps']}
            />
            <ReferenceLine
              y={stepGoal}
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="4 3"
              label={{ value: `${stepGoal.toLocaleString()} goal`, position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            />
            <Bar dataKey="steps" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.metGoal ? '#22c55e' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Met goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Under goal
          </span>
        </div>
      </div>

      {/* Calorie chart */}
      {totalCal > 0 && (() => {
        const calData = withSteps
          .filter((s) => (s.active_calories ?? 0) > 0)
          .map((s) => ({ date: fmtDate(s.date), cal: Math.round(s.active_calories!) }))
        if (calData.length < 2) return null
        return (
          <div className="bg-surface rounded-xl border border-border p-4">
            <h2 className="text-sm font-medium text-text-secondary mb-1">Active Calories</h2>
            <p className="text-xs text-text-secondary mb-3">30-day total: {Math.round(totalCal).toLocaleString()} cal</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={calData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value} cal`, 'Active Cal']}
                />
                <Bar dataKey="cal" fill="#f97316" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })()}

      {/* Day list */}
      <div className="space-y-2">
        {[...withSteps].reverse().map((s) => {
          const metGoal = s.steps >= stepGoal
          return (
            <div
              key={s.date}
              className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                {s.distance_meters && s.distance_meters > 0 && (
                  <p className="text-xs text-text-secondary">{(s.distance_meters / 1000).toFixed(1)} km</p>
                )}
              </div>
              <div className="text-right">
                <p className={`font-semibold ${metGoal ? 'text-green-400' : 'text-blue-400'}`}>
                  {s.steps.toLocaleString()}
                </p>
                {s.active_calories && s.active_calories > 0 && (
                  <p className="text-xs text-text-secondary">{Math.round(s.active_calories)} cal</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
