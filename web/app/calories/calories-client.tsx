'use client'

import Link from 'next/link'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

interface DayCalories {
  date: string
  burned: number
  consumed: number
}

interface CaloriesClientProps {
  days: DayCalories[]
  calorieTarget: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CaloriesClient({ days, calorieTarget }: CaloriesClientProps) {
  // Only include days with at least some data
  const withData = days.filter((d) => d.burned > 0 || d.consumed > 0)

  // Days with both burned and consumed
  const withBoth = withData.filter((d) => d.burned > 0 && d.consumed > 0)

  const hasBurned = withData.some((d) => d.burned > 0)
  const hasConsumed = withData.some((d) => d.consumed > 0)

  if (!hasBurned && !hasConsumed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🔥</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No calorie data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import activity data, and log meals in the Nutrition section to see your calorie balance.
        </p>
      </div>
    )
  }

  // Summary stats
  const totalBurned = withData.reduce((s, d) => s + d.burned, 0)
  const totalConsumed = withData.reduce((s, d) => s + d.consumed, 0)
  const avgBurned = withData.length > 0 ? Math.round(totalBurned / withData.length) : 0
  const avgConsumed = withData.length > 0 ? Math.round(totalConsumed / withData.length) : 0

  // 7-day rolling balance
  const rolling7 = withBoth.slice(-7)
  const week7Burned = rolling7.reduce((s, d) => s + d.burned, 0)
  const week7Consumed = rolling7.reduce((s, d) => s + d.consumed, 0)
  const week7Balance = week7Consumed - week7Burned // positive = surplus, negative = deficit

  // Chart data
  const chartData = withData.slice(-30).map((d) => ({
    date: fmtDate(d.date),
    burned: d.burned,
    consumed: d.consumed || undefined,
    balance: d.burned > 0 && d.consumed > 0 ? d.consumed - d.burned : undefined,
  }))

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {hasBurned && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-orange-400">{avgBurned.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Active Cal/Day</p>
          </div>
        )}
        {hasConsumed && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-green-400">{avgConsumed.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Intake/Day</p>
          </div>
        )}
        {withBoth.length >= 3 && (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-xl font-bold ${week7Balance > 300 ? 'text-yellow-400' : week7Balance < -300 ? 'text-blue-400' : 'text-green-400'}`}>
                {week7Balance > 0 ? '+' : ''}{week7Balance.toLocaleString()}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">7-Day Balance (kcal)</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-xl font-bold ${week7Balance < -500 ? 'text-blue-400' : week7Balance > 500 ? 'text-yellow-400' : 'text-green-400'}`}>
                {week7Balance < -200 ? 'Deficit' : week7Balance > 200 ? 'Surplus' : 'Balanced'}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Energy Status</p>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">
          {hasConsumed && hasBurned ? 'Intake vs. Active Burn (kcal)' : hasBurned ? 'Active Calories Burned' : 'Calories Consumed'}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  burned: 'Active Burned',
                  consumed: 'Consumed',
                }
                return [`${value.toLocaleString()} kcal`, labels[name] ?? name]
              }}
            />
            {hasBurned && <Bar dataKey="burned" fill="#f97316" opacity={0.7} radius={[2, 2, 0, 0]} name="burned" />}
            {hasConsumed && <Bar dataKey="consumed" fill="#22c55e" opacity={0.7} radius={[2, 2, 0, 0]} name="consumed" />}
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          {hasBurned && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-orange-400 opacity-70 inline-block rounded-sm" /> Active Burned
            </span>
          )}
          {hasConsumed && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-green-400 opacity-70 inline-block rounded-sm" /> Consumed
            </span>
          )}
        </div>
      </div>

      {/* Balance per day */}
      {withBoth.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Daily Balance (consumed − burned)</h2>
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={chartData.filter(d => d.balance !== undefined)} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toLocaleString()} kcal`, 'Balance']}
              />
              <Bar
                dataKey="balance"
                radius={[2, 2, 0, 0]}
                fill="#6366f1"
              />
              <Line
                type="monotone"
                dataKey={() => 0}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-1">Positive = surplus, negative = deficit (active calories only — resting not included)</p>
        </div>
      )}

      {!hasConsumed && (
        <div className="bg-surface rounded-xl border border-border p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary mb-1">Log meals to see balance</p>
          <p>Track your food intake in <Link href="/nutrition" className="text-accent underline">Nutrition</Link> to see how your intake compares to your activity burn.</p>
        </div>
      )}

      {!hasBurned && (
        <div className="bg-surface rounded-xl border border-border p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary mb-1">Sync your iPhone</p>
          <p>Activity data from Apple Health will appear here after syncing.</p>
        </div>
      )}
    </div>
  )
}
