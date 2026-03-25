'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, TrendingUp, Calendar, Moon } from 'lucide-react'
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklySRIPoint {
  week: string
  sri: number | null
}

export interface HeatmapWeek {
  label: string
  days: number[]
}

export interface RegularityClientProps {
  weeklySRI: WeeklySRIPoint[]
  heatmapWeeks: HeatmapWeek[]
  avgSRI: number
  nightsAnalyzed: number
  consistencyPct: number
  avgSleepDurationHours: number
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SRIClass = 'Regular' | 'Moderate' | 'Irregular' | 'Very Irregular'

function classifySRI(sri: number): SRIClass {
  if (sri >= 87) return 'Regular'
  if (sri >= 70) return 'Moderate'
  if (sri >= 50) return 'Irregular'
  return 'Very Irregular'
}

const CLASS_COLOR: Record<SRIClass, string> = {
  Regular: '#22c55e',
  Moderate: '#eab308',
  Irregular: '#f97316',
  'Very Irregular': '#ef4444',
}

const CLASS_BG: Record<SRIClass, string> = {
  Regular: 'bg-green-500/10 border-green-500/30',
  Moderate: 'bg-yellow-500/10 border-yellow-500/30',
  Irregular: 'bg-orange-500/10 border-orange-500/30',
  'Very Irregular': 'bg-red-500/10 border-red-500/30',
}

const CLASS_TEXT: Record<SRIClass, string> = {
  Regular: 'text-green-400',
  Moderate: 'text-yellow-400',
  Irregular: 'text-orange-400',
  'Very Irregular': 'text-red-400',
}

function heatmapColor(rate: number): string {
  if (rate < 0) return 'bg-surface-secondary opacity-30'
  if (rate >= 87) return 'bg-green-500/70'
  if (rate >= 70) return 'bg-yellow-500/70'
  if (rate >= 50) return 'bg-orange-500/70'
  return 'bg-red-500/70'
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── SVG Circular Gauge ───────────────────────────────────────────────────────

function CircularGauge({ value, classColor }: { value: number; classColor: string }) {
  const radius = 72
  const strokeWidth = 12
  const cx = 96
  const cy = 96
  const startAngle = 210
  const sweepAngle = 240
  const pct = Math.min(1, Math.max(0, value / 100))
  const filledAngle = sweepAngle * pct

  function polarToCartesian(pcx: number, pcy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: pcx + r * Math.cos(rad), y: pcy + r * Math.sin(rad) }
  }

  function describeArc(acx: number, acy: number, r: number, startDeg: number, endDeg: number) {
    const s = polarToCartesian(acx, acy, r, startDeg)
    const e = polarToCartesian(acx, acy, r, endDeg)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  const trackPath = describeArc(cx, cy, radius, startAngle, startAngle + sweepAngle)
  const valuePath = describeArc(cx, cy, radius, startAngle, startAngle + filledAngle)

  return (
    <svg width={192} height={160} viewBox="0 0 192 160" className="mx-auto">
      <defs>
        <linearGradient id="sriGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="33%"  stopColor="#f97316" />
          <stop offset="66%"  stopColor="#eab308" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Filled arc */}
      <path
        d={valuePath}
        fill="none"
        stroke={classColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${classColor}66)` }}
      />

      {/* Score */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={38}
        fontWeight="700"
        fill={classColor}
        fontFamily="inherit"
      >
        {value}
      </text>

      {/* Label */}
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fill="var(--color-text-secondary, #888)"
        fontFamily="inherit"
      >
        out of 100
      </text>

      {/* Min / Max labels */}
      <text x={22} y={148} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)" fontFamily="inherit">0</text>
      <text x={170} y={148} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)" fontFamily="inherit">100</text>
    </svg>
  )
}

// ─── Reference Scale ──────────────────────────────────────────────────────────

function ReferenceScale({ value }: { value: number }) {
  const pct = (value / 100) * 100
  return (
    <div className="space-y-1.5">
      <div
        className="relative h-4 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #ef4444, #f97316 33%, #eab308 57%, #22c55e 87%)' }}
      >
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow-lg"
          style={{ left: `calc(${pct}% - 1px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-secondary px-0.5">
        <span>0</span>
        <span>50</span>
        <span>70</span>
        <span>87</span>
        <span>100</span>
      </div>
      <div className="flex justify-between text-xs px-0.5">
        <span className="text-red-400">Very Irregular</span>
        <span className="text-orange-400">Irregular</span>
        <span className="text-yellow-400">Moderate</span>
        <span className="text-green-400">Regular</span>
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function RegularityClient({
  weeklySRI,
  heatmapWeeks,
  avgSRI,
  nightsAnalyzed,
  consistencyPct,
  avgSleepDurationHours,
}: RegularityClientProps) {
  const currentClass = classifySRI(avgSRI)
  const classColor = CLASS_COLOR[currentClass]

  // Derived stats
  const nonNullSRIs = weeklySRI.filter((w) => w.sri !== null).map((w) => w.sri!)
  const bestWeek = nonNullSRIs.length > 0 ? Math.max(...nonNullSRIs) : 0
  const worstWeek = nonNullSRIs.length > 0 ? Math.min(...nonNullSRIs) : 0

  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0]
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  heatmapWeeks.forEach((week) => {
    week.days.forEach((rate, i) => {
      if (rate >= 0) {
        weekdayTotals[i] += rate
        weekdayCounts[i]++
      }
    })
  })
  const weekdayAvgs = weekdayTotals.map((t, i) => (weekdayCounts[i] > 0 ? t / weekdayCounts[i] : 0))
  const bestDayIdx = weekdayAvgs.indexOf(Math.max(...weekdayAvgs))

  // Dynamic Y-axis domain for the SRI chart
  const sriDomainMin = nonNullSRIs.length > 0
    ? Math.max(0, Math.floor((Math.min(...nonNullSRIs) - 10) / 10) * 10)
    : 0

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

      {/* ── SRI Score Card ──────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-6 ${CLASS_BG[currentClass]} relative overflow-hidden`}>
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: `radial-gradient(ellipse at top, ${classColor}22 0%, transparent 70%)` }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary text-center mb-2">
            Your SRI Score · {nightsAnalyzed} nights analyzed
          </p>

          <CircularGauge value={avgSRI} classColor={classColor} />

          <div className="text-center mt-2">
            <span className={`text-2xl font-bold ${CLASS_TEXT[currentClass]}`}>
              {currentClass}
            </span>
            <p className="text-xs text-text-secondary mt-1">
              SRI {avgSRI} — sleep/wake pattern matched {avgSRI}% of same-time-of-day comparisons
            </p>
          </div>
        </div>
      </div>

      {/* ── Reference Scale ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">SRI Classification Scale</h3>
        <ReferenceScale value={avgSRI} />
      </div>

      {/* ── Weekly SRI Trend ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-text-secondary">Weekly SRI Trend</h3>
          <TrendingUp className="w-4 h-4 text-text-secondary" />
        </div>
        <p className="text-xs text-text-secondary mb-3">12-week rolling average</p>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklySRI} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="sriLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[sriDomainMin, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              tickCount={6}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`SRI ${v}`, 'Weekly SRI']}
              labelFormatter={(l: string) => `Week of ${l}`}
            />
            <ReferenceLine
              y={87}
              stroke="#22c55e"
              strokeDasharray="6 3"
              strokeOpacity={0.7}
              label={{
                value: 'Regular threshold (87)',
                position: 'insideTopRight',
                fontSize: 9,
                fill: '#22c55e',
                opacity: 0.8,
              }}
            />
            <Line
              type="monotone"
              dataKey="sri"
              stroke="url(#sriLine)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#22c55e' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Night-to-Night Match Rate Calendar ──────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-text-secondary">Night-to-Night Match Rate</h3>
          <Calendar className="w-4 h-4 text-text-secondary" />
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Each cell = probability that sleep/wake state at that time matched 24 h prior
        </p>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-8 gap-1 mb-1">
          <div className="text-xs text-text-secondary text-right pr-1.5 pt-0.5" />
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="text-xs text-center text-text-secondary font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-1">
          {heatmapWeeks.map((week) => (
            <div key={week.label} className="grid grid-cols-8 gap-1 items-center">
              <div
                className="text-xs text-text-secondary text-right pr-1.5 leading-none"
                style={{ fontSize: 9 }}
              >
                {week.label}
              </div>
              {week.days.map((rate, i) => (
                <div
                  key={i}
                  title={rate >= 0 ? `${rate}%` : 'No data'}
                  className={`h-7 rounded-md ${heatmapColor(rate)} flex items-center justify-center transition-opacity`}
                >
                  {rate >= 0 && (
                    <span
                      className="text-white text-opacity-90 font-semibold"
                      style={{ fontSize: 9 }}
                    >
                      {rate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mt-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-500/70 inline-block" />
            Regular ≥87%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-500/70 inline-block" />
            Moderate 70–87%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500/70 inline-block" />
            Irregular 50–70%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/70 inline-block" />
            Very Irregular &lt;50%
          </span>
        </div>
      </div>

      {/* ── Key Stats Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{bestWeek}</p>
          <p className="text-xs text-text-secondary mt-0.5">Best Week SRI</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{worstWeek}</p>
          <p className="text-xs text-text-secondary mt-0.5">Worst Week SRI</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{consistencyPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Bedtime Consistency</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{avgSleepDurationHours}h</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Sleep Duration</p>
        </div>
      </div>

      {/* ── Most Regular Day ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">Most Regular Day</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">
            {FULL_DAY_NAMES[bestDayIdx]}
          </p>
        </div>
        <Moon className="w-6 h-6 text-text-secondary" />
      </div>

      {/* ── Science Card ─────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-indigo-500/30 p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-600/5 pointer-events-none" />
        <div className="relative space-y-4">

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
              The Science of Sleep Regularity
            </h3>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-indigo-300">What is the SRI?</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              The Sleep Regularity Index (SRI) quantifies how consistently a person maintains
              the same sleep/wake pattern from one 24-hour period to the next. Formally, it is
              the probability (0–100) that the sleep/wake state at any given clock time <em>T</em>
              {' '}matches the state at exactly <em>T + 24 h</em>, averaged over all minutes and
              all consecutive day pairs in the analysis window.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-indigo-300 mb-1">
                Phillips et al. 2017 · J Biol Rhythms
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Introduced and validated the SRI metric in 61 healthy adults using wrist
                actigraphy. Showed SRI captures circadian regularity independently of sleep
                duration or efficiency.
              </p>
            </div>
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-violet-300 mb-1">
                Phillips et al. 2021 · Scientific Reports
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Applied SRI to 60,977 UK Biobank participants. Lowest SRI quartile had a{' '}
                <span className="text-red-400 font-semibold">48% higher all-cause mortality risk</span>,
                independent of sleep duration, age, BMI, and physical activity.
              </p>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-300 mb-1">SRI vs Social Jet Lag</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Social jet lag measures the weekday vs weekend shift in sleep timing (a single
                number in hours). SRI captures <em>day-to-day variability across all nights</em>{' '}
                — making it more sensitive to gradual circadian drift, shift work, and erratic
                schedules that affect every night, not just weekends.
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-300 mb-1">Why Regularity Matters</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Irregular sleep disrupts circadian clock gene expression, impairs glucose
                metabolism, elevates inflammatory markers, and is linked to depression,
                cardiovascular disease, and metabolic syndrome — effects that emerge even with
                adequate total sleep duration.
              </p>
            </div>
          </div>

          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-300 mb-2">How to Improve Your SRI</p>
            <ul className="space-y-1.5">
              {[
                'Anchor your wake time — keeping the same rise time every day (including weekends) is the most powerful lever for SRI.',
                'Get morning light within 30 minutes of waking to reinforce your circadian clock.',
                'Limit alcohol within 3 hours of bedtime — alcohol fragments sleep and disrupts the second half of the night.',
                'Avoid large shifts in bedtime across weekdays and weekends (>1 h shift noticeably reduces SRI).',
                'If you travel across time zones, re-anchor your wake time first before adjusting bedtime.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0 mt-0.5"
                    style={{ fontSize: 9, fontWeight: 700 }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-indigo-300 font-medium">References:</span>{' '}
              Phillips AJK et al. (2017). Irregular sleep/wake patterns are associated with
              poorer academic performance and delayed circadian and sleep/wake timing.{' '}
              <em>J Biol Rhythms</em> 32(5), 425–438. — Phillips AJK et al. (2021). Irregular
              sleep and mortality: a population-based study. <em>Scientific Reports</em> 11,
              11876.
            </p>
          </div>
        </div>
      </div>

    </main>
  )
}
