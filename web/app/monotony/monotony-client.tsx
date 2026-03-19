'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import type { MonotonyData, WeekMetrics, Zone } from './page'

interface Props {
  data: MonotonyData
}

// ─── Zone config ──────────────────────────────────────────────────────────────

const ZONE_CONFIG: Record<Zone, { label: string; color: string; range: string; description: string }> = {
  excellent: {
    label: 'Excellent',
    color: '#22c55e',
    range: '< 1.5',
    description: 'High variety in daily training stress. Minimal injury risk.',
  },
  good: {
    label: 'Good',
    color: '#14b8a6',
    range: '1.5 – 2.0',
    description: 'Reasonable training variety. Sustainable with adequate recovery.',
  },
  elevated: {
    label: 'Elevated',
    color: '#f97316',
    range: '2.0 – 2.5',
    description: 'Training is becoming repetitive. Watch for early fatigue signals.',
  },
  high: {
    label: 'High',
    color: '#ef4444',
    range: '> 2.5',
    description: 'Monotonous load — elevated risk of overtraining and illness.',
  },
}

const ZONE_ORDER: Zone[] = ['excellent', 'good', 'elevated', 'high']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtMonotony(n: number): string {
  return n.toFixed(2)
}

function fmtStrain(n: number): string {
  return Math.round(n).toLocaleString()
}

// ─── Tooltip: Monotony bar ────────────────────────────────────────────────────

function MonotonyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; payload: WeekMetrics }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const w = payload[0]?.payload
  if (!w) return null
  const cfg = ZONE_CONFIG[w.zone]
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm min-w-[170px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-gray-500 dark:text-gray-400 tabular-nums">
        Monotony: <span className="font-medium text-gray-800 dark:text-gray-200">{fmtMonotony(w.monotony)}</span>
      </p>
      <p className="text-gray-500 dark:text-gray-400 tabular-nums">
        Strain: <span className="font-medium text-gray-800 dark:text-gray-200">{fmtStrain(w.strain)}</span>
      </p>
      <p className="mt-1 text-xs font-medium" style={{ color: cfg.color }}>
        {cfg.label}
      </p>
    </div>
  )
}

// ─── Tooltip: Strain line ─────────────────────────────────────────────────────

function StrainTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; payload: WeekMetrics }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const w = payload[0]?.payload
  if (!w) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-gray-500 dark:text-gray-400 tabular-nums">
        Strain: <span className="font-medium text-gray-800 dark:text-gray-200">{fmtStrain(w.strain)}</span>
      </p>
      <p className="text-gray-500 dark:text-gray-400 tabular-nums">
        Load: <span className="font-medium text-gray-800 dark:text-gray-200">{Math.round(w.weeklyLoad)} min</span>
      </p>
    </div>
  )
}

// ─── Main Client Component ─────────────────────────────────────────────────────

export function MonotonyClient({ data }: Props) {
  const {
    weekMetrics,
    currentMonotony,
    currentStrain,
    currentZone,
    avgMonotony,
    peakStrain,
  } = data

  // Need at least 2 weeks with activity
  const activeWeeks = weekMetrics.filter((w) => w.weeklyLoad > 0)
  if (activeWeeks.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Not Enough Data</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Monotony analysis requires at least 2 weeks of workout history. Keep training and check back soon.
        </p>
      </div>
    )
  }

  const currentCfg = ZONE_CONFIG[currentZone]

  // Build chart data with abbreviated week label
  const chartData = weekMetrics.map((w) => ({
    ...w,
    label: fmtDate(w.monday),
  }))

  // Max monotony for y-axis headroom
  const maxMonotony = Math.max(...weekMetrics.map((w) => w.monotony), 2.5)
  const yMax = Math.ceil(maxMonotony * 10 + 1) / 10

  // Recent 8 weeks for table (most recent first)
  const tableRows = [...weekMetrics].reverse().slice(0, 8)

  return (
    <div className="space-y-4">

      {/* ── Summary Card ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Current Week
        </p>

        {/* Two large metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Monotony</p>
            <p
              className="text-3xl font-bold tabular-nums leading-none"
              style={{ color: currentCfg.color }}
            >
              {fmtMonotony(currentMonotony)}
            </p>
            <p className="text-xs mt-1.5 font-semibold" style={{ color: currentCfg.color }}>
              {currentCfg.label}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Strain</p>
            <p className="text-3xl font-bold tabular-nums leading-none text-purple-600 dark:text-purple-400">
              {fmtStrain(currentStrain)}
            </p>
            <p className="text-xs mt-1.5 text-gray-400 dark:text-gray-500">load × monotony</p>
          </div>
        </div>

        {/* Zone legend bar */}
        <div className="mb-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Monotony zones</p>
          <div className="flex rounded-lg overflow-hidden h-5">
            {ZONE_ORDER.map((zone) => {
              const cfg = ZONE_CONFIG[zone]
              const isActive = zone === currentZone
              return (
                <div
                  key={zone}
                  className="flex-1 flex items-center justify-center transition-opacity"
                  style={{
                    backgroundColor: cfg.color,
                    opacity: isActive ? 1 : 0.3,
                  }}
                  title={`${cfg.label} (${cfg.range})`}
                >
                  {isActive && (
                    <span className="text-white text-[10px] font-bold px-1 leading-none">
                      {cfg.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">0</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">1.5</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">2.0</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">2.5+</span>
          </div>
        </div>

        {/* Zone description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {currentCfg.description}
        </p>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">12-wk avg monotony</p>
            <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {fmtMonotony(avgMonotony)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Peak strain (12 wk)</p>
            <p className="text-lg font-bold tabular-nums text-purple-600 dark:text-purple-400">
              {fmtStrain(peakStrain)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Monotony Bar Chart ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Weekly Monotony</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">12 weeks · bars colored by zone</p>

        {/* Zone color legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4">
          {ZONE_ORDER.map((zone) => {
            const cfg = ZONE_CONFIG[zone]
            return (
              <div key={zone} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cfg.label} ({cfg.range})
                </span>
              </div>
            )
          })}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ left: -18, bottom: 0 }} barCategoryGap="12%">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'currentColor' }}
              interval={1}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              allowDecimals
              domain={[0, yMax]}
            />
            <Tooltip content={<MonotonyTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
            {/* Reference lines at zone boundaries */}
            <ReferenceLine
              y={2.0}
              stroke="#f97316"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{
                value: '2.0',
                fill: '#f97316',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />
            <ReferenceLine
              y={2.5}
              stroke="#ef4444"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{
                value: '2.5',
                fill: '#ef4444',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />
            <Bar dataKey="monotony" name="Monotony" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`mono-cell-${index}`}
                  fill={ZONE_CONFIG[entry.zone].color}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Strain Line Chart ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Weekly Strain</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">12 weeks · load × monotony</p>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'currentColor' }}
              interval={1}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<StrainTooltip />} cursor={{ stroke: '#9333ea', strokeWidth: 1, strokeOpacity: 0.3 }} />
            {/* Average strain reference line */}
            {activeWeeks.length > 0 && (
              <ReferenceLine
                y={activeWeeks.reduce((a, w) => a + w.strain, 0) / activeWeeks.length}
                stroke="#9333ea"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                label={{
                  value: 'avg',
                  fill: '#9333ea',
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="strain"
              name="Strain"
              stroke="#9333ea"
              strokeWidth={2}
              fill="url(#strainGradient)"
              dot={{ r: 3, fill: '#9333ea', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#9333ea', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 8-week Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Weeks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 text-xs border-b border-gray-100 dark:border-gray-800">
                <th className="text-left pb-2 font-medium">Week</th>
                <th className="text-right pb-2 font-medium">Load (min)</th>
                <th className="text-right pb-2 font-medium">Monotony</th>
                <th className="text-right pb-2 font-medium">Strain</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((week, i) => {
                const zoneCfg = ZONE_CONFIG[week.zone]
                return (
                  <tr
                    key={week.monday}
                    className={i % 2 === 0 ? '' : 'bg-gray-50/60 dark:bg-gray-800/40'}
                  >
                    <td className="py-2 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      {fmtDate(week.monday)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs font-medium text-gray-900 dark:text-gray-100">
                      {Math.round(week.weeklyLoad)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs">
                      {week.weeklyLoad === 0 ? (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      ) : (
                        <span
                          className="font-semibold px-1.5 py-0.5 rounded-full text-[11px]"
                          style={{ backgroundColor: zoneCfg.color + '22', color: zoneCfg.color }}
                        >
                          {fmtMonotony(week.monotony)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs font-medium text-purple-600 dark:text-purple-400">
                      {week.weeklyLoad === 0 ? (
                        <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>
                      ) : (
                        fmtStrain(week.strain)
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Science Card ──────────────────────────────────────────────────────── */}
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 text-sm">
          The Science
        </h3>
        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          <div>
            <p className="font-medium mb-0.5">Monotony</p>
            <p className="text-blue-700 dark:text-blue-400">
              Monotony = mean daily load ÷ standard deviation of daily load over 7 days.
              A high value means your training is very uniform — little variation between days.
              Low values reflect well-varied training with hard days and easy days alternating.
            </p>
          </div>
          <div>
            <p className="font-medium mb-0.5">Strain</p>
            <p className="text-blue-700 dark:text-blue-400">
              Strain = weekly total load × monotony. It captures not just how much you trained
              but how repetitively you did it. A high-volume week with varied intensity
              produces less strain than the same volume crammed into identical daily sessions.
            </p>
          </div>
          <div>
            <p className="font-medium mb-0.5">Why it matters</p>
            <p className="text-blue-700 dark:text-blue-400">
              Spikes in monotony are among the strongest predictors of illness and overuse injury onset.
              Aim to keep weekly monotony below 2.0 by alternating hard and easy days,
              scheduling one full rest day, and periodically reducing total load.
            </p>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-500 pt-1 border-t border-blue-100 dark:border-blue-900/50">
            Coggan &amp; Foster, 1996. Training load quantification and performance prediction.
          </p>
        </div>
      </div>

    </div>
  )
}
