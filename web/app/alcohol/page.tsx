'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Wine,
  AlertTriangle,
  TrendingDown,
  Activity,
  Heart,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
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

// ─── Mock data generation ─────────────────────────────────────────────────────

/**
 * Build 90 days of daily drink counts.
 * Pattern: weekends heavier (Fri/Sat), weekdays mostly 0–2.
 * Targets avg ~6 drinks/week ≈ 0.86/day.
 */
function buildDailyData(): { date: string; label: string; dow: number; drinks: number; color: string }[] {
  // Today = 2026-03-19, so 90 days back = 2025-12-19
  const end = new Date('2026-03-19')
  const start = new Date(end)
  start.setDate(end.getDate() - 89)

  // Pre-defined pattern per weekday (0=Sun … 6=Sat)
  // Each week has ~6 drinks: Fri 2, Sat 3, one mid-week drink
  const baseByDow: Record<number, number[]> = {
    0: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2],  // Sun: 13 week values
    1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  // Mon
    2: [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],  // Tue
    3: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],  // Wed
    4: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],  // Thu
    5: [2, 3, 2, 1, 3, 2, 2, 3, 1, 2, 3, 2, 2],  // Fri
    6: [3, 2, 4, 2, 3, 2, 3, 5, 2, 3, 2, 3, 4],  // Sat
  }

  const result: { date: string; label: string; dow: number; drinks: number; color: string }[] = []
  let weekIndex = 0

  for (let i = 0; i < 90; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = d.getDay()

    // Track which "week slot" we're on for this day-of-week
    const slot = Math.floor(i / 7)
    const weekSlot = slot % 13

    const drinks = (baseByDow[dow]?.[weekSlot]) ?? 0
    weekIndex = slot

    const color =
      drinks === 0
        ? '#4b5563'        // gray — no drink
        : drinks <= 2
          ? '#22c55e'      // green — 1–2
          : drinks <= 4
            ? '#f97316'    // orange — 3–4
            : '#ef4444'    // red — 5+

    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const dateStr = d.toISOString().split('T')[0]
    result.push({ date: dateStr, label, dow, drinks, color })
  }

  // suppress lint warning
  void weekIndex
  return result
}

const DAILY_DATA = buildDailyData()

// ─── Weekly totals (13 weeks) ─────────────────────────────────────────────────

function buildWeeklyData() {
  const weeks: { week: string; total: number; color: string }[] = []
  for (let w = 0; w < 13; w++) {
    const slice = DAILY_DATA.slice(w * 7, w * 7 + 7)
    if (slice.length === 0) continue
    const total = slice.reduce((s, d) => s + d.drinks, 0)
    const color =
      total <= 7
        ? '#22c55e'    // green — low risk
        : total <= 14
          ? '#f97316'  // orange — moderate
          : '#ef4444'  // red — high risk

    // Label as the Monday of that week
    const monday = slice.find((d) => d.dow === 1) ?? slice[0]
    weeks.push({ week: monday.label, total, color })
  }
  return weeks
}

const WEEKLY_DATA = buildWeeklyData()

// ─── Day-of-week averages ─────────────────────────────────────────────────────

function buildDowData() {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return DAYS.map((name, dow) => {
    const matching = DAILY_DATA.filter((d) => d.dow === dow)
    const avg =
      matching.length > 0
        ? matching.reduce((s, d) => s + d.drinks, 0) / matching.length
        : 0
    return { name, avg: Math.round(avg * 10) / 10 }
  })
}

const DOW_DATA = buildDowData()

// ─── Aggregate stats ──────────────────────────────────────────────────────────

const totalDrinks = DAILY_DATA.reduce((s, d) => s + d.drinks, 0)
const daysWithDrinks = DAILY_DATA.filter((d) => d.drinks > 0).length
const weeklyAvg = Math.round((totalDrinks / 13) * 10) / 10
const drinkingDays = daysWithDrinks
const avgPerSession =
  daysWithDrinks > 0
    ? Math.round((totalDrinks / daysWithDrinks) * 10) / 10
    : 0

// WHO: ≤14 drinks/week women, ≤21 men — we use 14/week as the shown limit
const whoCompliant = weeklyAvg * 7 <= 14

// ─── Tooltip components ───────────────────────────────────────────────────────

interface DailyTooltipProps {
  active?: boolean
  payload?: { value: number; payload: { label: string; color: string } }[]
}

function DailyTooltip({ active, payload }: DailyTooltipProps) {
  if (!active || !payload?.length) return null
  const { value, payload: data } = payload[0]
  const label = data.label
  const riskLabel =
    value === 0 ? 'Alcohol-free' : value <= 2 ? 'Low risk' : value <= 4 ? 'Moderate' : 'Heavy'
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary mb-1">{label}</p>
      <p style={{ color: data.color }} className="font-semibold">
        {value} drink{value !== 1 ? 's' : ''}
      </p>
      <p className="text-text-secondary/70 mt-0.5">{riskLabel}</p>
    </div>
  )
}

interface WeeklyTooltipProps {
  active?: boolean
  payload?: { value: number; payload: { week: string; color: string } }[]
}

function WeeklyTooltip({ active, payload }: WeeklyTooltipProps) {
  if (!active || !payload?.length) return null
  const { value, payload: data } = payload[0]
  const riskLabel = value <= 7 ? 'Low risk' : value <= 14 ? 'Moderate risk' : 'High risk'
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary mb-1">Week of {data.week}</p>
      <p style={{ color: data.color }} className="font-semibold">
        {value} drinks
      </p>
      <p className="text-text-secondary/70 mt-0.5">{riskLabel}</p>
    </div>
  )
}

interface DowTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function DowTooltip({ active, payload, label }: DowTooltipProps) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary mb-1">{label}</p>
      <p className="text-blue-400 font-semibold">{v} drinks avg</p>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  badge: string
  badgeColor: 'green' | 'orange' | 'red' | 'purple'
}

function StatCard({ icon, label, value, sub, badge, badgeColor }: StatCardProps) {
  const badgeClasses: Record<string, string> = {
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
  }
  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-purple-400">{icon}</span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', badgeClasses[badgeColor])}>
          {badge}
        </span>
      </div>
      <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
      <p className="text-xs text-text-secondary leading-snug">{label}</p>
      <p className="text-xs text-text-secondary/60">{sub}</p>
    </div>
  )
}

// ─── Science accordion ────────────────────────────────────────────────────────

const SCIENCE_REFS = [
  {
    id: 'who2023',
    title: 'WHO 2023 — No safe level of alcohol',
    body: 'The World Health Organization (2023) concluded that no level of alcohol consumption is safe for human health. Even low-to-moderate consumption is associated with increased risk of certain cancers, cardiovascular events, and neurological harm. The statement reversed previous guidance that suggested light drinking was neutral or beneficial.',
  },
  {
    id: 'colrain2014',
    title: 'Colrain et al. 2014 — HRV suppression',
    body: 'Colrain and colleagues (2014) demonstrated that alcohol consumption suppresses cardiac vagal activity, leading to measurable reductions in HRV during sleep. Even moderate intake the same evening reduces RMSSD and SDNN metrics during the overnight period, reflecting sympathetic nervous system activation and reduced parasympathetic tone.',
  },
  {
    id: 'roehrs2001',
    title: 'Roehrs & Roth 2001 — Sleep architecture disruption',
    body: 'Roehrs & Roth (2001) showed that alcohol alters sleep architecture in a dose-dependent manner: it increases slow-wave sleep in the first half of the night while suppressing REM sleep and causing rebound arousal in the second half. The net effect is fragmented, less restorative sleep, elevated next-day RHR, and suppressed next-day HRV.',
  },
  {
    id: 'rhr',
    title: 'RHR elevation after drinking',
    body: 'Alcohol causes peripheral vasodilation and compensatory sympathetic activation, raising resting heart rate. Studies consistently show next-morning RHR elevated by 4–7 bpm after ≥2 standard drinks. This elevation typically resolves within 24–36 hours but can mask recovery signals in fitness apps during that window.',
  },
]

function ScienceAccordion() {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      {SCIENCE_REFS.map((ref) => (
        <div key={ref.id} className="bg-surface rounded-xl border border-border overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
            onClick={() => setOpenId(openId === ref.id ? null : ref.id)}
          >
            <span className="text-sm font-medium text-text-primary">{ref.title}</span>
            {openId === ref.id ? (
              <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
            )}
          </button>
          {openId === ref.id && (
            <div className="px-4 pb-4">
              <p className="text-sm text-text-secondary leading-relaxed">{ref.body}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Biomarker impact data ────────────────────────────────────────────────────

const BIOMARKER_ROWS = [
  {
    metric: 'HRV (RMSSD)',
    afterDrinking: 52,
    alcoholFree: 61,
    unit: 'ms',
    delta: -9,
    direction: 'down', // lower is worse for HRV
  },
  {
    metric: 'Resting HR',
    afterDrinking: 58,
    alcoholFree: 53,
    unit: 'bpm',
    delta: +5,
    direction: 'up', // higher is worse for RHR
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AlcoholPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Alcohol Tracker 🍷</h1>
            <p className="text-sm text-text-secondary">
              WHO guidelines, biometric impact &amp; drinking patterns
            </p>
          </div>
          <Wine className="w-5 h-5 text-purple-400 flex-shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── 1. Stat cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Wine className="w-4 h-4" />}
            label="Weekly Avg"
            value={`${weeklyAvg} drinks`}
            sub="13-week rolling average"
            badge="Low risk"
            badgeColor="green"
          />
          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Days with Drinks"
            value={`${drinkingDays}/90`}
            sub="Past 90 days"
            badge="Moderate"
            badgeColor="orange"
          />
          <StatCard
            icon={<TrendingDown className="w-4 h-4" />}
            label="Avg Per Session"
            value={`${avgPerSession} drinks`}
            sub="On days you drink"
            badge="Within norm"
            badgeColor="purple"
          />
          <StatCard
            icon={<Heart className="w-4 h-4" />}
            label="WHO Status"
            value={whoCompliant ? '≤14/wk' : '>14/wk'}
            sub="WHO weekly guideline"
            badge={whoCompliant ? 'Within limit' : 'Over limit'}
            badgeColor={whoCompliant ? 'green' : 'red'}
          />
        </div>

        {/* ── 2. 90-day daily drink count ───────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-text-primary">90-Day Daily Drink Count</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={DAILY_DATA}
                margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={13}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 6]}
                />
                <Tooltip content={<DailyTooltip />} />
                {/* Light drinking threshold */}
                <ReferenceLine
                  y={2}
                  stroke="rgba(34,197,94,0.45)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Light (2)',
                    position: 'insideTopRight',
                    fontSize: 9,
                    fill: 'rgba(34,197,94,0.7)',
                  }}
                />
                {/* Heavy drinking threshold */}
                <ReferenceLine
                  y={4}
                  stroke="rgba(239,68,68,0.45)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Heavy (4)',
                    position: 'insideTopRight',
                    fontSize: 9,
                    fill: 'rgba(239,68,68,0.7)',
                  }}
                />
                <Bar dataKey="drinks" radius={[2, 2, 0, 0]} maxBarSize={8}>
                  {DAILY_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />
                1–2 (low)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" />
                3–4 (moderate)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
                5+ (heavy)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-gray-600 inline-block" />
                0 (alcohol-free)
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. 13-week weekly totals ──────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-text-primary">Weekly Totals — 13 Weeks</p>
            <span className="ml-auto text-xs text-purple-400 border border-purple-400/30 rounded-full px-2 py-0.5">
              WHO: ≤14/wk
            </span>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={WEEKLY_DATA}
                margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<WeeklyTooltip />} />
                <ReferenceLine
                  y={7}
                  stroke="rgba(34,197,94,0.4)"
                  strokeDasharray="4 3"
                  label={{
                    value: 'Low (7)',
                    position: 'insideTopRight',
                    fontSize: 9,
                    fill: 'rgba(34,197,94,0.65)',
                  }}
                />
                <ReferenceLine
                  y={14}
                  stroke="rgba(239,68,68,0.4)"
                  strokeDasharray="4 3"
                  label={{
                    value: 'WHO limit (14)',
                    position: 'insideTopRight',
                    fontSize: 9,
                    fill: 'rgba(239,68,68,0.7)',
                  }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {WEEKLY_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />
                ≤7 (low risk)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" />
                8–14 (moderate)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
                &gt;14 (high)
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. Day-of-week pattern ────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-semibold text-text-primary">Avg Drinks by Day of Week</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={DOW_DATA}
                margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={true}
                  domain={[0, 4]}
                />
                <Tooltip content={<DowTooltip />} />
                <Bar dataKey="avg" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-text-secondary mt-2 text-center">
              Friday &amp; Saturday pattern reflects typical weekend-heavy consumption
            </p>
          </div>
        </div>

        {/* ── 5. Biomarker impact table ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-text-primary">Next-Day Biomarker Impact</p>
          </div>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-purple-500/5">
              <p className="text-xs text-text-secondary">
                Comparing nights with ≥1 drink vs. alcohol-free nights (90-day average)
              </p>
            </div>
            {/* Table header */}
            <div className="grid grid-cols-4 px-4 py-2.5 border-b border-border text-xs font-medium text-text-secondary">
              <span>Metric</span>
              <span className="text-center">After Drinking</span>
              <span className="text-center">Alcohol-Free</span>
              <span className="text-right">Change</span>
            </div>
            {/* Rows */}
            {BIOMARKER_ROWS.map((row) => {
              const isWorse = row.direction === 'down' ? row.delta < 0 : row.delta > 0
              return (
                <div
                  key={row.metric}
                  className="grid grid-cols-4 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-surface-secondary/40 transition-colors"
                >
                  <span className="text-sm font-medium text-text-primary">{row.metric}</span>
                  <div className="text-center">
                    <span className={cn('text-sm font-bold', isWorse ? 'text-red-400' : 'text-green-400')}>
                      {row.afterDrinking}
                      <span className="text-xs font-normal text-text-secondary ml-0.5">{row.unit}</span>
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-text-primary">
                      {row.alcoholFree}
                      <span className="text-xs font-normal text-text-secondary ml-0.5">{row.unit}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-400">
                      {row.delta > 0 ? '+' : ''}{row.delta}{row.unit}
                    </span>
                    <p className="text-xs text-text-secondary/70">
                      {isWorse ? 'worse' : 'better'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Impact callout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">HRV Impact</p>
              <p className="text-2xl font-bold text-red-400">–9ms</p>
              <p className="text-xs text-text-secondary leading-snug">
                52ms after drinking vs. 61ms alcohol-free nights
              </p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">RHR Impact</p>
              <p className="text-2xl font-bold text-red-400">+5 bpm</p>
              <p className="text-xs text-text-secondary leading-snug">
                58 bpm after drinking vs. 53 bpm alcohol-free nights
              </p>
            </div>
          </div>

          {/* Warning callout */}
          <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-snug">
              Even modest alcohol consumption the night before suppresses next-morning HRV by
              ~15% and elevates RHR, masking true recovery status. Consider marking drinking
              nights in your recovery log.
            </p>
          </div>
        </div>

        {/* ── 6. Science ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">The Science</p>
          </div>
          <ScienceAccordion />
        </div>

        {/* ── 7. WHO guidelines callout ─────────────────────────────────── */}
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
            WHO Drinking Guidelines
          </p>
          <ul className="space-y-2">
            {[
              { icon: '🚫', text: 'WHO 2023: No level of alcohol consumption is safe for health' },
              { icon: '📊', text: 'Historical low-risk guidance: ≤14 standard drinks/week for women, ≤21 for men' },
              { icon: '🍷', text: 'One standard drink ≈ 14g pure alcohol (e.g. 150ml wine, 355ml beer, 44ml spirits)' },
              { icon: '📅', text: 'Aim for ≥2 alcohol-free days per week to reduce tolerance and health risk' },
              { icon: '💤', text: 'Avoid alcohol 3+ hours before sleep to protect REM and HRV recovery' },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
