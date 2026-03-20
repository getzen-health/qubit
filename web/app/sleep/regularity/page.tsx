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
import { BottomNav } from '@/components/bottom-nav'

// ─── Constants ────────────────────────────────────────────────────────────────

const SRI_SCORE = 79
const NIGHTS_ANALYZED = 58

// ─── Mock data ────────────────────────────────────────────────────────────────

// 8 weeks of weekly SRI values (oldest → newest)
const WEEKLY_SRI: { week: string; sri: number }[] = [
  { week: 'Jan 20', sri: 72 },
  { week: 'Jan 27', sri: 75 },
  { week: 'Feb 3',  sri: 74 },
  { week: 'Feb 10', sri: 78 },
  { week: 'Feb 17', sri: 81 },
  { week: 'Feb 24', sri: 80 },
  { week: 'Mar 3',  sri: 84 },
  { week: 'Mar 10', sri: 79 },
]

// 6 weeks × 7 days calendar heatmap (Sun → Sat)
// Each cell: match rate 0–100. -1 = future/no data.
// Mostly yellow/green with a few orange cells.
const HEATMAP_WEEKS: { label: string; days: number[] }[] = [
  { label: 'Feb 3',  days: [82, 79, 88, 75, 91, 68, 85] },
  { label: 'Feb 10', days: [76, 85, 80, 92, 72, 88, 78] },
  { label: 'Feb 17', days: [90, 83, 77, 86, 81, 65, 89] },
  { label: 'Feb 24', days: [74, 91, 84, 79, 88, 82, 76] },
  { label: 'Mar 3',  days: [87, 75, 93, 80, 84, 78, 91] },
  { label: 'Mar 10', days: [82, 88, 76, 85, 79, -1, -1] },
]

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// ─── Types & Helpers ──────────────────────────────────────────────────────────

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

// ─── Derived stats ────────────────────────────────────────────────────────────

const currentClass = classifySRI(SRI_SCORE)
const classColor = CLASS_COLOR[currentClass]

const allRates = HEATMAP_WEEKS.flatMap((w) => w.days.filter((d) => d >= 0))
const avgMatchRate = Math.round(allRates.reduce((s, v) => s + v, 0) / allRates.length)

const bestWeek = Math.max(...WEEKLY_SRI.map((w) => w.sri))
const worstWeek = Math.min(...WEEKLY_SRI.map((w) => w.sri))

// Count average match rate by weekday index (0=Sun)
const weekdayTotals = [0, 0, 0, 0, 0, 0, 0]
const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
HEATMAP_WEEKS.forEach((week) => {
  week.days.forEach((rate, i) => {
    if (rate >= 0) {
      weekdayTotals[i] += rate
      weekdayCounts[i]++
    }
  })
})
const weekdayAvgs = weekdayTotals.map((t, i) => (weekdayCounts[i] > 0 ? t / weekdayCounts[i] : 0))
const bestDayIdx = weekdayAvgs.indexOf(Math.max(...weekdayAvgs))
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── SVG Circular Gauge ───────────────────────────────────────────────────────

function CircularGauge({ value, max = 100 }: { value: number; max?: number }) {
  const radius = 72
  const strokeWidth = 12
  const cx = 96
  const cy = 96
  const circumference = Math.PI * radius // semicircle

  // Arc goes from 7 o'clock (210°) to 5 o'clock (330°) = 240° sweep
  const startAngle = 210  // degrees
  const sweepAngle = 240
  const pct = Math.min(1, Math.max(0, value / max))
  const filledAngle = sweepAngle * pct

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const s = polarToCartesian(cx, cy, r, startDeg)
    const e = polarToCartesian(cx, cy, r, endDeg)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  const trackPath = describeArc(cx, cy, radius, startAngle, startAngle + sweepAngle)
  const valuePath = describeArc(cx, cy, radius, startAngle, startAngle + filledAngle)

  // Gradient stops: red → orange → yellow → green
  const gradientId = 'sriGaugeGradient'

  return (
    <svg width={192} height={160} viewBox="0 0 192 160" className="mx-auto">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
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
      <div className="relative h-4 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #ef4444, #f97316 33%, #eab308 57%, #22c55e 87%)' }}
      >
        {/* marker */}
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SleepRegularityPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Sleep Regularity Index</h1>
            <p className="text-sm text-text-secondary">60-Night Circadian Consistency</p>
          </div>
          <Moon className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── SRI Score Card ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-6 ${CLASS_BG[currentClass]} relative overflow-hidden`}>
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: `radial-gradient(ellipse at top, ${classColor}22 0%, transparent 70%)` }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary text-center mb-2">
              Your SRI Score · {NIGHTS_ANALYZED} nights analyzed
            </p>

            <CircularGauge value={SRI_SCORE} />

            <div className="text-center mt-2">
              <span className={`text-2xl font-bold ${CLASS_TEXT[currentClass]}`}>
                {currentClass}
              </span>
              <p className="text-xs text-text-secondary mt-1">
                SRI {SRI_SCORE} — sleep/wake pattern matched {SRI_SCORE}% of same-time-of-day comparisons
              </p>
            </div>
          </div>
        </div>

        {/* ── Reference Scale ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">SRI Classification Scale</h3>
          <ReferenceScale value={SRI_SCORE} />
        </div>

        {/* ── Weekly SRI Trend ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-text-secondary">Weekly SRI Trend</h3>
            <TrendingUp className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-xs text-text-secondary mb-3">8-week rolling average</p>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={WEEKLY_SRI} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
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
                domain={[65, 90]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                tickCount={6}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`SRI ${v}`, 'Weekly SRI']}
                labelFormatter={(l: string) => `Week of ${l}`}
              />
              {/* Regular threshold reference line */}
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
            {HEATMAP_WEEKS.map((week) => (
              <div key={week.label} className="grid grid-cols-8 gap-1 items-center">
                <div className="text-xs text-text-secondary text-right pr-1.5 leading-none"
                  style={{ fontSize: 9 }}>
                  {week.label}
                </div>
                {week.days.map((rate, i) => (
                  <div
                    key={i}
                    title={rate >= 0 ? `${rate}%` : 'No data'}
                    className={`h-7 rounded-md ${heatmapColor(rate)} flex items-center justify-center transition-opacity`}
                  >
                    {rate >= 0 && (
                      <span className="text-white text-opacity-90 font-semibold"
                        style={{ fontSize: 9 }}>
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
            <p className="text-2xl font-bold text-yellow-400">{avgMatchRate}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Match Rate</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{FULL_DAY_NAMES[bestDayIdx]}</p>
            <p className="text-xs text-text-secondary mt-0.5">Most Regular Day</p>
          </div>
        </div>

        {/* ── Science Card ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-indigo-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-600/5 pointer-events-none" />
          <div className="relative space-y-4">

            {/* Title */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                The Science of Sleep Regularity
              </h3>
            </div>

            {/* What is SRI */}
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

            {/* Citations grid */}
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

              {/* SRI vs Social Jet Lag */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-300 mb-1">SRI vs Social Jet Lag</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Social jet lag measures the weekday vs weekend shift in sleep timing (a single
                  number in hours). SRI captures <em>day-to-day variability across all nights</em>{' '}
                  — making it more sensitive to gradual circadian drift, shift work, and erratic
                  schedules that affect every night, not just weekends.
                </p>
              </div>

              {/* Mortality context */}
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

            {/* Improvement tips */}
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
                    <span className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0 mt-0.5"
                      style={{ fontSize: 9, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Science footer */}
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-indigo-300 font-medium">References:</span>{' '}
                Phillips AJK et al. (2017). Irregular sleep/wake patterns are associated with
                poorer academic performance and delayed circadian and sleep/wake timing.{' '}
                <em>J Biol Rhythms</em> 32(5), 425–438. — Phillips AJK et al. (2021). Irregular
                sleep and mortality: a population-based study. <em>Scientific Reports</em> 11,
                11876. Data shown uses mock values for demonstration purposes.
              </p>
            </div>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
