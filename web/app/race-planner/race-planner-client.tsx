'use client'

import { useState } from 'react'
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

type RaceDistance = '5K' | '10K' | 'Half' | 'Marathon'

interface DistanceConfig {
  label: string
  peakKm: number
  color: string
  fullName: string
  distanceKm: number
}

const DISTANCES: Record<RaceDistance, DistanceConfig> = {
  '5K': { label: '5K', fullName: '5 Kilometres', peakKm: 40, color: '#22c55e', distanceKm: 5 },
  '10K': { label: '10K', fullName: '10 Kilometres', peakKm: 55, color: '#3b82f6', distanceKm: 10 },
  'Half': { label: 'Half', fullName: 'Half Marathon', peakKm: 70, color: '#f97316', distanceKm: 21.1 },
  'Marathon': { label: 'Marathon', fullName: 'Marathon', peakKm: 90, color: '#ef4444', distanceKm: 42.2 },
}

const PLAN_WEEKS = 16

interface WeekPlan {
  week: number
  km: number
  type: 'build' | 'cutback' | 'taper' | 'race'
}

function buildPlan(peakKm: number): WeekPlan[] {
  // 16-week plan: build weeks 1-12, taper weeks 13-16
  // Cutback every 4th week (week 4, 8, 12 in build phase)
  // Taper: weeks 13, 14, 15 drop progressively, week 16 is race week (~20%)
  const plan: WeekPlan[] = []

  // Build up to peak over 12 weeks
  // Week 12 = peak, week 1 = ~50% of peak
  // Every 4th week is a cutback at ~75% of that week's target
  const buildWeeks = 12
  for (let w = 1; w <= buildWeeks; w++) {
    const isCutback = w % 4 === 0
    // Linear ramp from 50% to 100% of peak over 12 weeks
    const rampFraction = 0.5 + (0.5 * (w - 1)) / (buildWeeks - 1)
    const base = peakKm * rampFraction
    const km = isCutback ? base * 0.75 : base
    plan.push({ week: w, km: Math.round(km), type: isCutback ? 'cutback' : 'build' })
  }

  // Taper: weeks 13, 14, 15 (75%, 60%, 40% of peak), week 16 race
  plan.push({ week: 13, km: Math.round(peakKm * 0.75), type: 'taper' })
  plan.push({ week: 14, km: Math.round(peakKm * 0.60), type: 'taper' })
  plan.push({ week: 15, km: Math.round(peakKm * 0.40), type: 'taper' })
  plan.push({ week: 16, km: Math.round(peakKm * 0.20), type: 'race' })

  return plan
}

function weeksUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const raceDate = new Date(dateStr)
  if (isNaN(raceDate.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffMs = raceDate.getTime() - now.getTime()
  return Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))
}

function typeLabel(type: WeekPlan['type']): string {
  switch (type) {
    case 'build': return 'Build'
    case 'cutback': return 'Cutback'
    case 'taper': return 'Taper'
    case 'race': return 'Race Week'
  }
}

function typeColor(type: WeekPlan['type'], distColor: string): string {
  switch (type) {
    case 'cutback': return '#64748b'
    case 'taper': return '#94a3b8'
    case 'race': return '#f59e0b'
    default: return distColor
  }
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

export function RacePlannerClient() {
  const [distance, setDistance] = useState<RaceDistance>('Half')
  const [raceDate, setRaceDate] = useState('')

  const config = DISTANCES[distance]
  const plan = buildPlan(config.peakKm)
  const weeksRemaining = weeksUntil(raceDate)

  const chartData = plan.map((w) => ({
    ...w,
    label: `W${w.week}`,
    color: typeColor(w.type, config.color),
  }))

  return (
    <div className="space-y-6">
      {/* Distance picker */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Race Distance</h3>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(DISTANCES) as RaceDistance[]).map((d) => {
            const cfg = DISTANCES[d]
            const isActive = distance === d
            return (
              <button
                key={d}
                onClick={() => setDistance(d)}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-200"
                style={{
                  backgroundColor: isActive ? cfg.color + '22' : undefined,
                  borderColor: isActive ? cfg.color : 'var(--color-border)',
                  color: isActive ? cfg.color : 'var(--color-text-secondary)',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Race date input */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <label className="text-sm font-medium text-text-secondary block mb-2">
          Race Date
        </label>
        <input
          type="date"
          value={raceDate}
          onChange={(e) => setRaceDate(e.target.value)}
          className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{ '--tw-ring-color': config.color } as React.CSSProperties}
        />
      </div>

      {/* Countdown card */}
      {raceDate && weeksRemaining !== null && (
        <div
          className="rounded-2xl border p-5 relative overflow-hidden"
          style={{ borderColor: config.color + '44' }}
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, ${config.color}, transparent)` }}
          />
          <div className="relative text-center space-y-1">
            <p
              className="text-5xl font-black tabular-nums"
              style={{ color: config.color }}
            >
              {weeksRemaining > 0 ? weeksRemaining : 0}
            </p>
            <p className="text-sm text-text-secondary">
              {weeksRemaining > 0
                ? `weeks until your ${config.fullName}`
                : weeksRemaining === 0
                ? `Race day — good luck!`
                : `Race date has passed`}
            </p>
            {weeksRemaining > 0 && weeksRemaining < PLAN_WEEKS && (
              <p className="text-xs text-text-secondary opacity-70 mt-1">
                You are in week {PLAN_WEEKS - weeksRemaining + 1} of this 16-week plan
              </p>
            )}
            {weeksRemaining >= PLAN_WEEKS && (
              <p className="text-xs text-text-secondary opacity-70 mt-1">
                Enough time to complete a full 16-week training block
              </p>
            )}
          </div>
        </div>
      )}

      {/* Weekly volume chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary">
            Weekly Volume — {config.fullName}
          </h3>
          <span
            className="text-xs border rounded-full px-2 py-0.5"
            style={{ color: config.color, borderColor: config.color + '44' }}
          >
            Peak: {config.peakKm} km
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, props: { payload?: WeekPlan }) => [
                `${v} km — ${typeLabel(props.payload?.type ?? 'build')}`,
                'Weekly Volume',
              ]}
              labelFormatter={(label: string) => `Week ${label.replace('W', '')}`}
            />
            <ReferenceLine
              y={config.peakKm}
              stroke={config.color}
              strokeDasharray="4 3"
              strokeOpacity={0.4}
            />
            <Bar dataKey="km" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: config.color }} />
            Build
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
            Cutback
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            Taper
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Race Week
          </span>
        </div>
      </div>

      {/* Week-by-week table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Week-by-Week Plan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Week
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Volume (km)
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Phase
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  % of Peak
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plan.map((w) => {
                const color = typeColor(w.type, config.color)
                const pct = Math.round((w.km / config.peakKm) * 100)
                const isCurrentWeek =
                  raceDate &&
                  weeksRemaining !== null &&
                  weeksRemaining > 0 &&
                  w.week === PLAN_WEEKS - weeksRemaining + 1
                return (
                  <tr
                    key={w.week}
                    className={`hover:bg-surface-secondary/40 transition-colors ${isCurrentWeek ? 'bg-surface-secondary/60' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-xs text-text-secondary">
                      {isCurrentWeek && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5"
                          style={{ backgroundColor: config.color }}
                        />
                      )}
                      Week {w.week}
                    </td>
                    <td
                      className="px-4 py-2.5 text-right text-xs font-bold tabular-nums"
                      style={{ color }}
                    >
                      {w.km} km
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ color, backgroundColor: color + '22', border: `1px solid ${color}44` }}
                      >
                        {typeLabel(w.type)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-secondary">
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info card */}
      <div
        className="rounded-2xl border p-4 relative overflow-hidden"
        style={{ borderColor: config.color + '33' }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${config.color}, transparent)` }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: config.color }}>
              Plan Structure
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            This 16-week plan follows the 10% rule — weekly mileage increases by roughly 10% each
            build week. Every 4th week is a recovery cutback at 75% volume to absorb adaptations.
            The final 3 weeks taper to 75%, 60%, and 40% of peak, with race week at 20%.
          </p>
        </div>
      </div>
    </div>
  )
}
