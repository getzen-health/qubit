'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface WeeklyChartsProps {
  summaries: Array<{
    date: string
    steps: number
    active_calories: number
    sleep_duration_minutes?: number
    resting_heart_rate?: number
  }>
}

export function WeeklyCharts({ summaries }: WeeklyChartsProps) {
  // Reverse to ascending order (oldest → newest left → right)
  // Append T00:00:00 to force local-time parsing and avoid UTC day-shift
  const chartData = [...summaries].reverse().map((s) => ({
    day: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
    }),
    steps: s.steps,
    activeCalories: s.active_calories,
    sleepHours: s.sleep_duration_minutes
      ? +(s.sleep_duration_minutes / 60).toFixed(1)
      : null,
    restingHR: s.resting_heart_rate ?? null,
  }))

  const hasSleepData = chartData.some((d) => d.sleepHours !== null)
  const hasHRData = chartData.some((d) => d.restingHR !== null)

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-2">Steps</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface, #1a1a1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Steps']}
            />
            <Bar dataKey="steps" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Calories */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-2">Active Calories</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface, #1a1a1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value} cal`, 'Active Calories']}
            />
            <Bar dataKey="activeCalories" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep */}
      {hasSleepData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Sleep (hours)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #1a1a1a)',
                  border: '1px solid var(--color-border, #333)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value}h`, 'Sleep']}
              />
              <Bar dataKey="sleepHours" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resting Heart Rate */}
      {hasHRData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            Resting Heart Rate (bpm)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #1a1a1a)',
                  border: '1px solid var(--color-border, #333)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} bpm`, 'Resting HR']}
              />
              <Line
                type="monotone"
                dataKey="restingHR"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
