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
  ReferenceLine,
} from 'recharts'

interface WeeklyChartsProps {
  summaries: Array<{
    date: string
    steps: number
    active_calories: number
    sleep_duration_minutes?: number
    resting_heart_rate?: number
    avg_hrv?: number
    recovery_score?: number
    strain_score?: number
  }>
  stepGoal?: number
  calGoal?: number
  weightData?: Array<{ date: string; weight_kg: number }>
}

export function WeeklyCharts({ summaries, stepGoal = 10000, calGoal = 500, weightData }: WeeklyChartsProps) {
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
    avgHrv: s.avg_hrv ?? null,
    recoveryScore: s.recovery_score ?? null,
    strainScore: s.strain_score ?? null,
  }))

  const hasSleepData = chartData.some((d) => d.sleepHours !== null)
  const hasHRData = chartData.some((d) => d.restingHR !== null)
  const hasHRVData = chartData.some((d) => d.avgHrv !== null)
  const hasRecoveryData = chartData.some((d) => d.recoveryScore !== null && d.recoveryScore > 0)
  const hasStrainData = chartData.some((d) => d.strainScore !== null && d.strainScore > 0)

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
            <ReferenceLine
              y={stepGoal}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 3"
              label={{ value: `${(stepGoal / 1000).toFixed(0)}k goal`, position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            />
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
            <ReferenceLine
              y={calGoal}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 3"
              label={{ value: `${calGoal} cal goal`, position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            />
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

      {/* HRV */}
      {hasHRVData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">
            HRV (ms)
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
                formatter={(value: number) => [`${value} ms`, 'HRV']}
              />
              <Line
                type="monotone"
                dataKey="avgHrv"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Recovery Score */}
      {hasRecoveryData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Recovery (%)</h3>
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
                formatter={(value: number) => [`${value}%`, 'Recovery']}
              />
              <Line
                type="monotone"
                dataKey="recoveryScore"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Strain Score */}
      {hasStrainData && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Strain (/21)</h3>
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
                formatter={(value: number) => [`${value}/21`, 'Strain']}
              />
              <Bar dataKey="strainScore" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Weight (30-day trend) */}
      {weightData && weightData.length >= 3 && (() => {
        const wChartData = [...weightData].reverse().map((d) => ({
          date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: +d.weight_kg.toFixed(1),
        }))
        return (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Body Weight (kg)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={wChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface, #1a1a1a)',
                    border: '1px solid var(--color-border, #333)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })()}
    </div>
  )
}
