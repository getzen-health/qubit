'use client'

import dynamic from 'next/dynamic'
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Dot,
} from 'recharts'

const LineChart = dynamic(() => import('recharts').then((m) => ({ default: m.LineChart })), { ssr: false })
const BarChart = dynamic(() => import('recharts').then((m) => ({ default: m.BarChart })), { ssr: false })

interface VO2Reading {
  time: string
  value: number
}

interface VO2MaxClientProps {
  readings: VO2Reading[]
}

// Color thresholds (ml/kg/min)
// Superior ≥55, Excellent ≥48, Good ≥42, Above Avg ≥36, Average ≥30, Below Avg ≥25, Poor <25
const FITNESS_LEVELS = [
  { label: 'Superior',   min: 55, color: '#a855f7', textClass: 'text-purple-400',  bgClass: 'bg-purple-500/10 border-purple-500/30'  },
  { label: 'Excellent',  min: 48, color: '#22c55e', textClass: 'text-green-400',   bgClass: 'bg-green-500/10 border-green-500/30'    },
  { label: 'Good',       min: 42, color: '#14b8a6', textClass: 'text-teal-400',    bgClass: 'bg-teal-500/10 border-teal-500/30'      },
  { label: 'Above Avg',  min: 36, color: '#6ee7b7', textClass: 'text-emerald-300', bgClass: 'bg-emerald-500/10 border-emerald-500/30' },
  { label: 'Average',    min: 30, color: '#eab308', textClass: 'text-yellow-400',  bgClass: 'bg-yellow-500/10 border-yellow-500/30'  },
  { label: 'Below Avg',  min: 25, color: '#f97316', textClass: 'text-orange-400',  bgClass: 'bg-orange-500/10 border-orange-500/30'  },
  { label: 'Poor',       min: 0,  color: '#ef4444', textClass: 'text-red-400',     bgClass: 'bg-red-500/10 border-red-500/30'        },
] as const

type FitnessLevel = (typeof FITNESS_LEVELS)[number]

function getFitnessLevel(vo2: number): FitnessLevel {
  return (
    (FITNESS_LEVELS.find((l) => vo2 >= l.min) as FitnessLevel | undefined) ??
    FITNESS_LEVELS[FITNESS_LEVELS.length - 1]
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short' })
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

export function VO2MaxClient({ readings }: VO2MaxClientProps) {
  if (readings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🫁</span>
        <h2 className="text-lg font-semibold text-text-primary">No VO₂ Max data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apple Watch estimates VO₂ Max during outdoor walks, runs, and hikes. Sync your iPhone
          after an outdoor workout to start tracking.
        </p>
      </div>
    )
  }

  // ── Deduplicate to one reading per day (latest) ─────────────────────────────
  const byDay: Record<string, number> = {}
  for (const r of readings) {
    const day = r.time.slice(0, 10)
    byDay[day] = r.value
  }

  const dailyData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: fmtDate(date + 'T12:00:00'),
      rawDate: date,
      value: +value.toFixed(1),
      color: getFitnessLevel(value).color,
    }))

  // ── Current + 6-month-ago stats ─────────────────────────────────────────────
  const current = dailyData[dailyData.length - 1].value
  const currentLevel = getFitnessLevel(current)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10)

  // Find the closest reading on or before 6 months ago
  const pastEntries = dailyData.filter((d) => d.rawDate <= sixMonthsAgoStr)
  const sixMonthValue =
    pastEntries.length > 0 ? pastEntries[pastEntries.length - 1].value : null
  const sixMonthChange =
    sixMonthValue !== null ? +(current - sixMonthValue).toFixed(1) : null

  // ── Monthly averages (color-coded) ──────────────────────────────────────────
  const monthMap = new Map<string, number[]>()
  for (const d of dailyData) {
    const key = d.rawDate.slice(0, 7) // YYYY-MM
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(d.value)
  }
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length
      const rounded = +avg.toFixed(1)
      return {
        month: fmtMonth(key),
        avg: rounded,
        color: getFitnessLevel(rounded).color,
      }
    })

  // ── Y-axis domain for line chart ────────────────────────────────────────────
  const allValues = dailyData.map((d) => d.value)
  const yMin = Math.max(0, Math.floor(Math.min(...allValues)) - 3)
  const yMax = Math.ceil(Math.max(...allValues)) + 3

  return (
    <div className="space-y-6">

      {/* ── Hero: current VO₂ Max ── */}
      <div className={`rounded-2xl border p-6 text-center ${currentLevel.bgClass}`}>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
          Current VO₂ Max
        </p>
        <p className={`text-6xl font-bold tabular-nums ${currentLevel.textClass}`}>
          {current.toFixed(1)}
        </p>
        <p className="text-sm text-text-secondary mt-1">ml/kg/min</p>
        <div
          className="inline-block mt-3 px-4 py-1 rounded-full text-sm font-semibold"
          style={{ background: currentLevel.color + '22', color: currentLevel.color }}
        >
          {currentLevel.label}
        </div>
      </div>

      {/* ── Stats card ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p
            className="text-xl font-bold tabular-nums"
            style={{ color: currentLevel.color }}
          >
            {current.toFixed(1)}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Current</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-xl font-bold tabular-nums text-text-secondary">
            {sixMonthValue !== null ? sixMonthValue.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">6 Months Ago</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          {sixMonthChange !== null ? (
            <p
              className="text-xl font-bold tabular-nums"
              style={{ color: sixMonthChange > 0 ? '#22c55e' : sixMonthChange < 0 ? '#ef4444' : '#94a3b8' }}
            >
              {sixMonthChange > 0 ? '+' : ''}{sixMonthChange.toFixed(1)}
            </p>
          ) : (
            <p className="text-xl font-bold tabular-nums text-text-secondary">—</p>
          )}
          <p className="text-xs text-text-secondary mt-0.5">6-Month Change</p>
        </div>
      </div>

      {/* ── Line chart: all readings over past year ── */}
      {dailyData.length >= 2 && (
        <div role="img" aria-label="VO2 max trend over the past year" className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            VO₂ Max — Past Year
          </h3>
          <p className="sr-only">Your current VO₂ max is {current.toFixed(1)} ml/kg/min, rated {currentLevel.label}.</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={28}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(1)} ml/kg/min`, 'VO₂ Max']}
              />
              {/* Fitness zone reference lines */}
              <ReferenceLine y={55} stroke="rgba(168,85,247,0.25)" strokeDasharray="4 3" label={{ value: 'Superior', position: 'insideTopRight', fontSize: 9, fill: 'rgba(168,85,247,0.5)' }} />
              <ReferenceLine y={48} stroke="rgba(34,197,94,0.2)"  strokeDasharray="4 3" />
              <ReferenceLine y={42} stroke="rgba(20,184,166,0.2)" strokeDasharray="4 3" />
              <ReferenceLine y={36} stroke="rgba(110,231,183,0.2)" strokeDasharray="4 3" />
              <ReferenceLine y={30} stroke="rgba(234,179,8,0.2)"  strokeDasharray="4 3" />
              <ReferenceLine y={25} stroke="rgba(249,115,22,0.2)" strokeDasharray="4 3" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={<Dot r={4} fill="#22d3ee" stroke="#22d3ee" />}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Monthly average bar chart (color-coded by fitness level) ── */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Monthly Average
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={28}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(1)} ml/kg/min`, 'Avg VO₂ Max']}
              />
              <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
            {FITNESS_LEVELS.map((lvl) => (
              <span key={lvl.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: lvl.color }}
                />
                {lvl.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Fitness level scale ── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Fitness Categories</h3>
        <div className="space-y-1.5">
          {FITNESS_LEVELS.map((lvl, i) => {
            const nextMin = i > 0 ? FITNESS_LEVELS[i - 1].min : null
            const range =
              nextMin !== null
                ? `${lvl.min}–${nextMin - 1} ml/kg/min`
                : `≥ ${lvl.min} ml/kg/min`
            const isActive =
              current >= lvl.min && (i === 0 || current < FITNESS_LEVELS[i - 1].min)
            return (
              <div
                key={lvl.label}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  isActive ? `${lvl.bgClass} border` : 'bg-surface-secondary/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: lvl.color }}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isActive ? lvl.textClass : 'text-text-secondary'
                    }`}
                  >
                    {lvl.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-text-secondary opacity-70">← you</span>
                  )}
                </div>
                <span
                  className={`text-xs tabular-nums ${
                    isActive ? lvl.textClass : 'text-text-secondary'
                  }`}
                >
                  {range}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Science card ── */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Why VO₂ Max Matters</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          VO₂ max is the maximum rate at which your body can consume oxygen during exercise — the
          gold standard measure of cardiorespiratory fitness. Higher values reflect a more efficient
          heart, lungs, and muscles.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          A large study published in{' '}
          <span className="text-text-primary font-medium">JAMA Network Open</span> found that low
          cardiorespiratory fitness (estimated via VO₂ max) is one of the strongest independent
          predictors of all-cause and cardiovascular mortality — comparable in magnitude to
          traditional risk factors like smoking, diabetes, and hypertension. Each 1 ml/kg/min
          increase in VO₂ max is associated with roughly a 2–3% reduction in cardiovascular risk.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Apple Watch estimates your VO₂ max using the{' '}
          <span className="text-text-primary font-medium">Firstbeat algorithm</span>, which
          combines heart rate response and GPS-derived pace during outdoor walks, runs, and hikes.
          The estimate is validated against lab-measured VO₂ max with a mean absolute error of
          approximately 5–10%. Consistent cardio training — especially zone 2 steady-state and
          interval work — is the most effective way to improve it.
        </p>
        <p className="text-xs text-text-secondary opacity-60">
          Reference: Mandsager et al., JAMA Network Open (2018). Firstbeat Technologies, Cardio
          Fitness Score methodology.
        </p>
      </div>
    </div>
  )
}
