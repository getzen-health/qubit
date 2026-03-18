'use client'

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

interface DaylightReading {
  date: string
  value: number // minutes
}

interface DaylightClientProps {
  readings: DaylightReading[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const GOAL = 30 // WHO recommended minimum minutes

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMinutes(m: number) {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

function barColor(minutes: number) {
  if (minutes >= 60) return '#fbbf24' // amber — great
  if (minutes >= GOAL) return '#4ade80' // green — good
  return '#6366f1' // indigo — low
}

export function DaylightClient({ readings }: DaylightClientProps) {
  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">☀️</span>
        <h2 className="text-lg font-semibold text-text-primary">No daylight data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          iPhone tracks time spent in bright outdoor light (≥ 1000 lux) automatically. Sync your iPhone to import this data.
        </p>
        <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary max-w-xs text-left space-y-1.5">
          <p className="font-semibold text-text-primary">Requirements</p>
          <p>• iPhone with iOS 17.0 or later</p>
          <p>• Carried with you outdoors</p>
          <p>• Motion & Fitness access enabled</p>
        </div>
      </div>
    )
  }

  const values = readings.map((r) => r.value)
  const total = values.reduce((a, b) => a + b, 0)
  const avg = Math.round(total / values.length)
  const best = Math.max(...values)
  const goalDays = values.filter((v) => v >= GOAL).length
  const latest = readings[readings.length - 1]

  const chartData = readings.map((r) => ({
    date: fmtDate(r.date),
    minutes: r.value,
  }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${latest.value >= GOAL ? 'text-green-400' : 'text-indigo-400'}`}>
            {fmtMinutes(latest.value)}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Yesterday</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${avg >= GOAL ? 'text-green-400' : 'text-indigo-400'}`}>
            {fmtMinutes(avg)}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Daily Avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{fmtMinutes(best)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Best Day</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${goalDays >= readings.length * 0.7 ? 'text-green-400' : 'text-orange-400'}`}>
            {goalDays}/{readings.length}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Goal Days (30m)</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Daily Daylight Exposure</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v: number) => `${v}m`}
              width={32}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [fmtMinutes(v), 'Daylight']}
            />
            <ReferenceLine
              y={GOAL}
              stroke="rgba(74,222,128,0.4)"
              strokeDasharray="4 3"
              label={{ value: '30m goal', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.6)' }}
            />
            <Bar dataKey="minutes" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.minutes)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day list */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Daily Breakdown</h2>
        {[...readings].reverse().slice(0, 30).map((r) => {
          const date = new Date(r.date + 'T00:00:00')
          const pct = Math.min(r.value / 120, 1) * 100 // 2h = full bar
          return (
            <div key={r.date} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-text-primary w-24 shrink-0">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor(r.value) }}
                />
              </div>
              <span className={`text-sm font-semibold w-14 text-right ${r.value >= GOAL ? 'text-green-400' : 'text-indigo-400'}`}>
                {fmtMinutes(r.value)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">Why daylight matters</p>
        <p>Bright outdoor light (≥ 1000 lux) suppresses melatonin, synchronises your circadian clock, and boosts alertness. Even on cloudy days, outdoor light is 10–100x brighter than indoor lighting.</p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { icon: '🟣', range: '< 30 min', desc: 'Low — circadian disruption risk' },
            { icon: '🟢', range: '30–60 min', desc: 'Good — meets daily minimum' },
            { icon: '🟡', range: '60+ min', desc: 'Excellent — strong circadian signal' },
          ].map(({ icon, range, desc }) => (
            <div key={range} className="space-y-0.5">
              <p>{icon} <span className="font-mono">{range}</span></p>
              <p className="opacity-70">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
