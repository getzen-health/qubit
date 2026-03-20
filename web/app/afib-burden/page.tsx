'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, AlertTriangle, BookOpen, FlaskConical } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  type TooltipProps,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────────

type BurdenCategory = 'minimal' | 'low' | 'moderate' | 'high' | 'veryHigh'

interface DayPoint {
  date: string       // "MMM D"
  dateIso: string    // YYYY-MM-DD
  burden: number     // %
  category: BurdenCategory
}

interface WeekAvg {
  label: string     // e.g. "Jan 6"
  avg: number       // %
  category: BurdenCategory
}

// ─── Category config ────────────────────────────────────────────────────────

interface CategoryConfig {
  label: string
  range: string
  color: string
  fillColor: string
  bgClass: string
  borderClass: string
  textClass: string
  bullet: string
}

const CATEGORY_CONFIG: Record<BurdenCategory, CategoryConfig> = {
  minimal: {
    label: 'Minimal',
    range: '< 0.5%',
    color: '#16a34a',
    fillColor: '#16a34a20',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderClass: 'border-green-200 dark:border-green-900/50',
    textClass: 'text-green-700 dark:text-green-400',
    bullet: '#16a34a',
  },
  low: {
    label: 'Low',
    range: '0.5–5%',
    color: '#0d9488',
    fillColor: '#0d948820',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-900/50',
    textClass: 'text-teal-700 dark:text-teal-400',
    bullet: '#0d9488',
  },
  moderate: {
    label: 'Moderate',
    range: '5–20%',
    color: '#f97316',
    fillColor: '#f9731620',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-900/50',
    textClass: 'text-orange-700 dark:text-orange-400',
    bullet: '#f97316',
  },
  high: {
    label: 'High',
    range: '20–50%',
    color: '#ef4444',
    fillColor: '#ef444420',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-900/50',
    textClass: 'text-red-700 dark:text-red-400',
    bullet: '#ef4444',
  },
  veryHigh: {
    label: 'Very High',
    range: '> 50%',
    color: '#7c3aed',
    fillColor: '#7c3aed20',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-900/50',
    textClass: 'text-purple-700 dark:text-purple-400',
    bullet: '#7c3aed',
  },
}

function classifyBurden(pct: number): BurdenCategory {
  if (pct < 0.5) return 'minimal'
  if (pct < 5) return 'low'
  if (pct < 20) return 'moderate'
  if (pct < 50) return 'high'
  return 'veryHigh'
}

function burdenColor(pct: number): string {
  return CATEGORY_CONFIG[classifyBurden(pct)].color
}

// ─── Mock Data Generation ──────────────────────────────────────────────────────

function generateMockData(): DayPoint[] {
  // End date: 2026-03-19 (today per system context)
  const endDate = new Date('2026-03-19')
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 89) // 90 days total

  const days: DayPoint[] = []

  // Paroxysmal AFib pattern: clusters of 2–5 days with burden, then quiet periods
  // Three clusters over 90 days
  const clusters = [
    { center: 15, spread: 2, peak: 6.8 },   // early cluster (~day 15)
    { center: 47, spread: 3, peak: 4.2 },   // mid cluster (~day 47)
    { center: 72, spread: 2, peak: 7.5 },   // late cluster (~day 72) — drives current reading
  ]

  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const dateIso = d.toISOString().split('T')[0]

    // Compute burden: sum Gaussian contributions from each cluster
    let burden = 0
    for (const cluster of clusters) {
      const dist = Math.abs(i - cluster.center)
      if (dist <= cluster.spread + 1) {
        // Gaussian bell: e^(-dist^2 / (2 * sigma^2))
        const sigma = cluster.spread * 0.8
        const contribution = cluster.peak * Math.exp(-(dist * dist) / (2 * sigma * sigma))
        burden += contribution
      }
    }

    // Add tiny random noise for realism (only on non-zero days)
    if (burden > 0.1) {
      burden += (Math.random() - 0.5) * 0.3
      burden = Math.max(0, burden)
    } else {
      // 60% of quiet days are truly 0; 40% have minimal trace ~0.05-0.15%
      burden = Math.random() < 0.6 ? 0 : Math.random() * 0.12
    }

    burden = Math.round(burden * 100) / 100

    days.push({
      date: dateStr,
      dateIso,
      burden,
      category: classifyBurden(burden),
    })
  }

  return days
}

function generateWeeklyAverages(days: DayPoint[]): WeekAvg[] {
  const weeks: WeekAvg[] = []
  // 8 most recent complete weeks, oldest first
  const totalDays = days.length  // 90
  // Use the last 56 days (8 weeks)
  const weekDays = days.slice(totalDays - 56)

  for (let w = 0; w < 8; w++) {
    const slice = weekDays.slice(w * 7, w * 7 + 7)
    const avg = slice.reduce((s, d) => s + d.burden, 0) / slice.length
    const roundedAvg = Math.round(avg * 100) / 100
    weeks.push({
      label: slice[0]?.date ?? `Week ${w + 1}`,
      avg: roundedAvg,
      category: classifyBurden(roundedAvg),
    })
  }
  return weeks
}

// ─── Static mock data (computed once) ─────────────────────────────────────────

const MOCK_DAYS = generateMockData()
const MOCK_WEEKLY = generateWeeklyAverages(MOCK_DAYS)

// Current burden = last day
const CURRENT_BURDEN = 2.3
const CURRENT_CATEGORY: BurdenCategory = 'low'
const LAST_MEASURED = 'Mar 18, 2026'

// Stats
const DAYS_WITH_AFIB = MOCK_DAYS.filter((d) => d.burden >= 0.5).length
const AVG_BURDEN = Math.round((MOCK_DAYS.reduce((s, d) => s + d.burden, 0) / MOCK_DAYS.length) * 100) / 100
const PEAK_BURDEN = Math.max(...MOCK_DAYS.map((d) => d.burden))

// Chart data: show every 3rd day label, keep all data points
const CHART_DATA = MOCK_DAYS.map((d, i) => ({
  ...d,
  displayDate: i % 14 === 0 || i === MOCK_DAYS.length - 1 ? d.date : '',
}))

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

interface ChartPayload {
  burden: number
  date: string
  category: BurdenCategory
}

function BurdenTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload as ChartPayload
  if (!data) return null
  const cfg = CATEGORY_CONFIG[data.category]

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-xl text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{data.date}</p>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
        <span className="text-gray-500 dark:text-gray-400">Burden:</span>
        <span className="font-semibold tabular-nums" style={{ color: cfg.color }}>
          {data.burden.toFixed(2)}%
        </span>
      </div>
      <p className={`text-xs mt-1 font-medium ${cfg.textClass}`}>{cfg.label}</p>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold tabular-nums leading-tight" style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AFibBurdenPage() {
  const currentCfg = CATEGORY_CONFIG[CURRENT_CATEGORY]
  const peakCategory = classifyBurden(PEAK_BURDEN)
  const avgCategory = classifyBurden(AVG_BURDEN)
  const maxWeeklyAvg = Math.max(...MOCK_WEEKLY.map((w) => w.avg), 0.1) // avoid div-by-zero

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Sticky Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/cardiac"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to cardiac"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AFib Burden</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-wide">
                Medical
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Daily atrial fibrillation burden &amp; stroke risk context
            </p>
          </div>
          <Heart className="w-5 h-5 text-red-400 shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">

        {/* ── Medical Disclaimer Banner ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
            <span className="font-semibold">Medical notice:</span> This information is for monitoring purposes only. Atrial fibrillation requires physician management. Contact your doctor if you have any concerns.
          </p>
        </div>

        {/* ── Current Burden Card ────────────────────────────────────────────── */}
        <div className={`rounded-2xl border ${currentCfg.borderClass} ${currentCfg.bgClass} p-5`}>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Current AFib Burden
          </p>
          <div className="flex items-end gap-3 mb-2">
            <p
              className="text-6xl font-extrabold tabular-nums leading-none"
              style={{ color: currentCfg.color }}
            >
              {CURRENT_BURDEN.toFixed(1)}
            </p>
            <p className="text-3xl font-bold text-gray-400 dark:text-gray-500 leading-none pb-1">%</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: currentCfg.color + '18',
                color: currentCfg.color,
                border: `1px solid ${currentCfg.color}30`,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCfg.color }} />
              {currentCfg.label} ({currentCfg.range})
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Last measured: {LAST_MEASURED}
          </p>
        </div>

        {/* ── 90-Day Area Chart ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">90-Day Daily Burden</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Percentage of time in atrial fibrillation each day
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {(['minimal', 'low', 'moderate', 'high', 'veryHigh'] as BurdenCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat]
              return (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {cfg.label} {cfg.range}
                  </span>
                </div>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA} margin={{ left: -14, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="afibGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.07}
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 9, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax) + 1, 10)]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <ReferenceLine
                y={5}
                stroke="#f97316"
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{ value: '5%', position: 'right', fontSize: 8, fill: '#f97316' }}
              />
              <ReferenceLine
                y={20}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{ value: '20%', position: 'right', fontSize: 8, fill: '#ef4444' }}
              />
              <Tooltip content={<BurdenTooltip />} cursor={{ stroke: '#ef4444', strokeOpacity: 0.15 }} />
              <Area
                type="monotone"
                dataKey="burden"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#afibGradient)"
                dot={(props: { cx: number; cy: number; payload: ChartPayload }) => {
                  const { cx, cy, payload } = props
                  if (payload.burden < 0.05) return <g key={`dot-${cx}-${cy}`} />
                  return (
                    <circle
                      key={`dot-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={2.5}
                      fill={burdenColor(payload.burden)}
                      stroke="white"
                      strokeWidth={1}
                      opacity={0.85}
                    />
                  )
                }}
                activeDot={{ r: 4, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 8-Week Weekly Averages ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">8-Week Weekly Averages</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Mean daily AFib burden per week</p>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {MOCK_WEEKLY.map((week, i) => {
              const cfg = CATEGORY_CONFIG[week.category]
              const barWidth = maxWeeklyAvg > 0 ? (week.avg / maxWeeklyAvg) * 100 : 0
              return (
                <li key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-14 shrink-0 tabular-nums">
                    {week.label}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: cfg.color,
                        opacity: week.avg === 0 ? 0.2 : 1,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums w-10 text-right shrink-0"
                    style={{ color: week.avg < 0.05 ? undefined : cfg.color }}
                  >
                    {week.avg < 0.01 ? '0%' : `${week.avg.toFixed(1)}%`}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Avg burden"
            value={`${AVG_BURDEN.toFixed(2)}%`}
            sub={CATEGORY_CONFIG[avgCategory].label}
            color={CATEGORY_CONFIG[avgCategory].color}
          />
          <StatCard
            label="Peak burden"
            value={`${PEAK_BURDEN.toFixed(1)}%`}
            sub={CATEGORY_CONFIG[peakCategory].label}
            color={CATEGORY_CONFIG[peakCategory].color}
          />
          <StatCard
            label="Days detected"
            value={String(DAYS_WITH_AFIB)}
            sub="of 90 days"
            color={DAYS_WITH_AFIB > 0 ? '#ef4444' : '#16a34a'}
          />
        </div>

        {/* ── Stroke Risk Context Card ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Stroke Risk Context</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">AFib burden categories · clinical context</p>
            </div>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(
              [
                ['minimal', 'Lowest observed stroke risk increment from burden. Rhythm may be incidental or sub-clinical.'],
                ['low', 'Modest association with stroke risk. Physician monitoring typically sufficient at this range.'],
                ['moderate', 'Meaningful stroke risk elevation. Anticoagulation decision depends on CHA₂DS₂-VASc score.'],
                ['high', 'Significant burden. Most guidelines recommend anticoagulation consideration regardless of symptoms.'],
                ['veryHigh', 'Persistent/permanent AFib territory. Strong anticoagulation indication in most patients.'],
              ] as [BurdenCategory, string][]
            ).map(([cat, desc]) => {
              const cfg = CATEGORY_CONFIG[cat]
              const isCurrentCategory = cat === CURRENT_CATEGORY
              return (
                <li
                  key={cat}
                  className={`px-4 py-3 flex gap-3 items-start transition-colors ${
                    isCurrentCategory ? `${cfg.bgClass}` : ''
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${cfg.textClass}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                        {cfg.range}
                      </span>
                      {isCurrentCategory && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                          style={{
                            backgroundColor: cfg.color + '20',
                            color: cfg.color,
                            border: `1px solid ${cfg.color}40`,
                          }}
                        >
                          You are here
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                      {desc}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Science Card ───────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">The Science</h2>
          </div>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <div className={`rounded-xl p-3 border ${CATEGORY_CONFIG.low.bgClass} ${CATEGORY_CONFIG.low.borderClass}`}>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Apple Heart Study · Perez et al. 2019
              </p>
              <p className="text-xs leading-relaxed">
                Study of <strong className="text-gray-800 dark:text-gray-200">419,093 participants</strong> used Apple Watch photoplethysmography to identify irregular pulse. Those with irregular pulses confirmed as AFib had significantly elevated stroke risk, demonstrating consumer wearables can identify clinically meaningful arrhythmia burden at scale.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                <em>N Engl J Med 2019;381:1909–1917</em>
              </p>
            </div>

            <p>
              <strong className="text-gray-800 dark:text-gray-200">AFib burden</strong> — the percentage of time spent in atrial fibrillation — is increasingly recognized as a more nuanced predictor of stroke risk than a simple present/absent diagnosis. Apple Watch Series 4+ with ECG features can track this continuously.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Burden categories &amp; clinical context</p>
              {(
                [
                  ['< 0.5%', 'Sub-clinical or incidental. Risk increment minimal but not zero.'],
                  ['0.5–5%', 'Paroxysmal pattern. Increasing evidence of stroke risk even at low burden.'],
                  ['5–20%', 'Moderate burden. Associated with heart failure risk and structural remodeling.'],
                  ['> 20%', 'High/persistent burden. Anticoagulation strongly indicated in most risk profiles.'],
                ] as [string, string][]
              ).map(([range, note]) => (
                <div key={range} className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <span className="shrink-0 font-mono font-semibold text-gray-700 dark:text-gray-300 w-16">{range}</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Anticoagulation threshold context
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Current guidelines (AHA/ESC) recommend anticoagulation decisions based on the <strong className="text-gray-700 dark:text-gray-300">CHA₂DS₂-VASc score</strong> regardless of whether AFib is paroxysmal, persistent, or permanent. There is growing evidence that even subclinical AFib (&lt; 5% burden) at higher CHA₂DS₂-VASc scores warrants anticoagulation consideration.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <BookOpen className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              AFib burden data is derived from Apple Watch ECG and irregular rhythm notifications. This is <strong>not a medical diagnosis</strong>. All clinical decisions — including anticoagulation — must be made in consultation with a qualified physician.
            </p>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
