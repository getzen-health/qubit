'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Coffee, Moon, Clock, AlertTriangle, TrendingUp, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
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
  AreaChart,
  Area,
} from 'recharts'

// ─── Half-life model ──────────────────────────────────────────────────────────

const HALF_LIFE_HOURS = 5.5

/** mg of caffeine remaining `t` hours after a dose. */
function remaining(dose: number, t: number): number {
  return dose * Math.pow(0.5, t / HALF_LIFE_HOURS)
}

/** Total active caffeine at a given hour-of-day given a list of doses taken that same day. */
function activeAtHour(
  doses: { hourDecimal: number; mg: number }[],
  atHour: number
): number {
  return doses.reduce((sum, d) => {
    const elapsed = atHour - d.hourDecimal
    if (elapsed < 0) return sum
    return sum + remaining(d.mg, elapsed)
  }, 0)
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// Seed a realistic 30-day caffeine log
// Each entry: date, list of { hourDecimal, mg, label }
interface DoseEntry {
  hourDecimal: number
  mg: number
  label: string
}

interface DayRecord {
  date: string // YYYY-MM-DD
  doses: DoseEntry[]
}

function buildMockData(): DayRecord[] {
  // Base date: 30 days ending today (2026-03-19)
  const base = new Date('2026-02-18')
  const records: DayRecord[] = []

  // Patterns: most days have morning coffee + midday, some late afternoon
  const patterns: DoseEntry[][] = [
    // Light day
    [{ hourDecimal: 7.0, mg: 95, label: 'Coffee (7am)' }],
    // Standard day
    [
      { hourDecimal: 7.5, mg: 95, label: 'Coffee (7:30am)' },
      { hourDecimal: 12.0, mg: 95, label: 'Coffee (noon)' },
    ],
    // Double morning
    [
      { hourDecimal: 7.0, mg: 95, label: 'Coffee (7am)' },
      { hourDecimal: 9.0, mg: 40, label: 'Espresso (9am)' },
      { hourDecimal: 13.0, mg: 95, label: 'Coffee (1pm)' },
    ],
    // Late dose
    [
      { hourDecimal: 7.0, mg: 95, label: 'Coffee (7am)' },
      { hourDecimal: 12.5, mg: 95, label: 'Coffee (12:30pm)' },
      { hourDecimal: 15.0, mg: 80, label: 'Pre-workout (3pm)' },
    ],
    // Heavy day (>400mg)
    [
      { hourDecimal: 6.5, mg: 95, label: 'Coffee (6:30am)' },
      { hourDecimal: 9.5, mg: 150, label: 'Energy drink (9:30am)' },
      { hourDecimal: 13.0, mg: 95, label: 'Coffee (1pm)' },
      { hourDecimal: 15.5, mg: 80, label: 'Pre-workout (3:30pm)' },
    ],
    // Rest day / no caffeine
    [],
    // Minimal
    [{ hourDecimal: 8.0, mg: 80, label: 'Green tea (8am)' }],
  ]

  // Map day index to pattern
  const patternMap = [
    1, 1, 2, 2, 3, 1, 0, // week 1
    1, 2, 3, 3, 4, 1, 6, // week 2
    2, 1, 3, 2, 4, 0, 1, // week 3
    2, 3, 1, 3, 2, 1, 4, // week 4 + 2
    3, 1,
  ]

  for (let i = 0; i < 30; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    records.push({
      date: dateStr,
      doses: patterns[patternMap[i] ?? 1],
    })
  }

  return records
}

const MOCK_DATA = buildMockData()

// Pre-compute per-day totals and bedtime active
const BEDTIME_HOUR = 22 // 10pm

interface DaySummary {
  date: string
  label: string // e.g. "Feb 18"
  total: number
  activeAtBedtime: number
  lateDoses: number // doses after 2pm
  color: string
}

function computeDaySummaries(records: DayRecord[]): DaySummary[] {
  return records.map((r) => {
    const total = r.doses.reduce((s, d) => s + d.mg, 0)
    const active = Math.round(activeAtHour(r.doses, BEDTIME_HOUR))
    const late = r.doses.filter((d) => d.hourDecimal >= 14).length
    const color = total === 0
      ? '#6b7280' // gray for no caffeine
      : total < 300
        ? '#22c55e'   // green
        : total < 400
          ? '#f59e0b' // orange
          : '#ef4444' // red

    const d = new Date(r.date)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return { date: r.date, label, total, activeAtBedtime: active, lateDoses: late, color }
  })
}

const DAY_SUMMARIES = computeDaySummaries(MOCK_DATA)

// ─── Half-life demo day (section 4) ──────────────────────────────────────────

const DEMO_DOSES: DoseEntry[] = [
  { hourDecimal: 7.0, mg: 200, label: '200mg @ 7am' },
  { hourDecimal: 11.0, mg: 150, label: '150mg @ 11am' },
  { hourDecimal: 15.0, mg: 80, label: '80mg @ 3pm' },
]

function buildDecayCurve(
  doses: DoseEntry[],
  fromHour = 6,
  toHour = 24,
  step = 0.25
) {
  const points: { time: string; active: number; hour: number }[] = []
  for (let h = fromHour; h <= toHour; h += step) {
    const active = Math.round(activeAtHour(doses, h))
    const wholeHour = Math.floor(h)
    const mins = Math.round((h - wholeHour) * 60)
    const ampm = wholeHour >= 12 ? 'pm' : 'am'
    const displayH = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour
    const timeStr =
      mins === 0
        ? `${displayH}${ampm}`
        : `${displayH}:${mins.toString().padStart(2, '0')}${ampm}`
    points.push({ time: timeStr, active, hour: h })
  }
  return points
}

const DECAY_CURVE = buildDecayCurve(DEMO_DOSES)

// ─── Time-of-day histogram ────────────────────────────────────────────────────

function buildTODHistogram(records: DayRecord[]) {
  // Bins: 6am to 10pm in 1h slots
  const bins: { hour: string; count: number; isLate: boolean; hourNum: number }[] = []
  for (let h = 6; h <= 21; h++) {
    const ampm = h >= 12 ? 'pm' : 'am'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    bins.push({
      hour: `${displayH}${ampm}`,
      count: 0,
      isLate: h >= 14,
      hourNum: h,
    })
  }
  for (const r of records) {
    for (const d of r.doses) {
      const h = Math.floor(d.hourDecimal)
      const bin = bins.find((b) => b.hourNum === h)
      if (bin) bin.count++
    }
  }
  return bins
}

const TOD_HISTOGRAM = buildTODHistogram(MOCK_DATA)

// ─── Sleep correlation ────────────────────────────────────────────────────────

// Pre-computed stats (would normally come from joined sleep data)
const LOW_ACTIVE_STATS = { sleep: 7.8, hrv: 8.2, count: 18 }
const HIGH_ACTIVE_STATS = { sleep: 6.9, hrv: 7.1, count: 8 }

// ─── Aggregate stats ──────────────────────────────────────────────────────────

const daysWithData = DAY_SUMMARIES.filter((d) => d.total > 0)
const dailyAvg = Math.round(daysWithData.reduce((s, d) => s + d.total, 0) / (daysWithData.length || 1))
const daysOver400 = DAY_SUMMARIES.filter((d) => d.total > 400).length
const avgActiveAtBedtime = Math.round(
  daysWithData.reduce((s, d) => s + d.activeAtBedtime, 0) / (daysWithData.length || 1)
)
const totalLateDoses = DAY_SUMMARIES.reduce((s, d) => s + d.lateDoses, 0)

// Active caffeine on the demo day at 10pm
const demoActiveAtBedtime = Math.round(activeAtHour(DEMO_DOSES, BEDTIME_HOUR))

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function IntakeTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  const color = v < 300 ? '#22c55e' : v < 400 ? '#f59e0b' : '#ef4444'
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary mb-1">{label}</p>
      <p style={{ color }} className="font-semibold">{v}mg caffeine</p>
      {v > 400 && <p className="text-red-400 mt-0.5">Over FDA limit</p>}
    </div>
  )
}

function DecayTooltip({ active, payload }: { active?: boolean; payload?: { payload: { time: string; active: number } }[] }) {
  if (!active || !payload?.length) return null
  const { time, active: mg } = payload[0].payload
  const color = mg < 30 ? '#22c55e' : mg < 80 ? '#f59e0b' : '#ef4444'
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary">{time}</p>
      <p style={{ color }} className="font-semibold">{mg}mg active</p>
    </div>
  )
}

function TODTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { isLate: boolean } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const { value, payload: data } = payload[0]
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary">{label}</p>
      <p className={data.isLate ? 'text-orange-400 font-semibold' : 'text-text-primary font-semibold'}>
        {value} dose{value !== 1 ? 's' : ''}
      </p>
      {data.isLate && <p className="text-orange-400/70 mt-0.5">After 2pm cutoff</p>}
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
  badgeColor: 'green' | 'orange' | 'red' | 'blue'
}

function StatCard({ icon, label, value, sub, badge, badgeColor }: StatCardProps) {
  const badgeClasses = {
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
  }
  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary">{icon}</span>
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

// ─── Science section ──────────────────────────────────────────────────────────

const SCIENCE_REFS = [
  {
    id: 'nehlig2010',
    title: 'Nehlig 2010 — Half-life model',
    body: 'Caffeine has a plasma half-life of approximately 5–6 hours (mean ~5.5h), meaning half the ingested dose is metabolised every 5.5 hours. Individual variation is significant (2–10h) depending on genetics, liver function, medications and pregnancy.',
  },
  {
    id: 'drake2013',
    title: 'Drake et al. 2013 — Sleep disruption',
    body: '200mg of caffeine consumed 6 hours before bedtime causes ~1 hour of lost sleep, even when the person reports no perceived sleep disruption. Caffeine consumed at bedtime itself reduces sleep by ~2h and delays onset by ~1h. Takeaway: stop caffeine 8–10h before your target sleep time.',
  },
  {
    id: 'spriet2014',
    title: 'Spriet 2014 — Performance benefits',
    body: 'Caffeine at 3–6 mg/kg body mass reliably improves endurance performance, time-to-exhaustion, and high-intensity work capacity. Doses above 9 mg/kg yield no additional benefit and increase adverse effects. For a 70kg person, the sweet spot is 210–420mg before exercise.',
  },
  {
    id: 'fda400',
    title: 'FDA — 400mg daily limit',
    body: 'The FDA considers 400mg/day safe for healthy adults. Single doses above 1200mg can be dangerous or fatal. Energy drink plus coffee combinations can push consumers over limits unknowingly.',
  },
  {
    id: 'timing',
    title: 'Optimal timing',
    body: "Delay your first caffeine 90–120 minutes after waking to avoid cortisol interference (cortisol is naturally highest just after waking). Cut off intake 8–10 hours before your target bedtime — for 10pm sleep that means no caffeine after 12–2pm. The body's adenosine pressure builds fastest between 1–3pm when an afternoon dose has greatest impact.",
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
            {openId === ref.id
              ? <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />}
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CaffeinePage() {
  const [selectedDemoDay, setSelectedDemoDay] = useState<{
    label: string
    doses: DoseEntry[]
    curve: { time: string; active: number; hour: number }[]
    activeAtBedtime: number
  }>({
    label: 'Sample day',
    doses: DEMO_DOSES,
    curve: DECAY_CURVE,
    activeAtBedtime: demoActiveAtBedtime,
  })

  // Allow user to click a bar to preview that day's curve
  const handleBarClick = (data: { date: string; label: string; total: number } | null) => {
    if (!data) return
    const record = MOCK_DATA.find((r) => r.date === data.date)
    if (!record || record.doses.length === 0) return
    const curve = buildDecayCurve(record.doses)
    const activeAtBedtime = Math.round(activeAtHour(record.doses, BEDTIME_HOUR))
    setSelectedDemoDay({ label: data.label, doses: record.doses, curve, activeAtBedtime })
  }

  // Tick marks on the decay chart x-axis (every 2h)
  const xAxisTicks = useMemo(
    () =>
      selectedDemoDay.curve
        .filter((p) => p.hour % 2 === 0 && p.hour >= 6 && p.hour <= 24)
        .map((p) => p.time),
    [selectedDemoDay.curve]
  )

  // Bedtime reference index on the decay chart
  const bedtimePoint = selectedDemoDay.curve.find((p) => p.hour === BEDTIME_HOUR)

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
            <h1 className="text-xl font-bold text-text-primary">Caffeine Analytics ☕</h1>
            <p className="text-sm text-text-secondary">Track intake, model sleep impact, optimize timing</p>
          </div>
          <Coffee className="w-5 h-5 text-amber-400 flex-shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── 1. Stat cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Coffee className="w-4 h-4" />}
            label="Daily Avg"
            value={`${dailyAvg}mg`}
            sub="30-day average"
            badge="Safe"
            badgeColor="green"
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Days over 400mg"
            value={`${daysOver400}/30`}
            sub="FDA limit exceedances"
            badge="Low"
            badgeColor="green"
          />
          <StatCard
            icon={<Moon className="w-4 h-4" />}
            label="Active at 10pm"
            value={`${avgActiveAtBedtime}mg`}
            sub="Avg active at bedtime"
            badge="Caution"
            badgeColor="orange"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Late doses"
            value={`${totalLateDoses}`}
            sub="Logs after 2pm"
            badge="Watch"
            badgeColor="orange"
          />
        </div>

        {/* ── 2. 30-day intake bar chart ────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">30-Day Daily Intake</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-3">Tap a bar to explore that day's half-life curve below</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={DAY_SUMMARIES}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload) {
                    handleBarClick(e.activePayload[0].payload as { date: string; label: string; total: number })
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<IntakeTooltip />} />
                <ReferenceLine
                  y={400}
                  stroke="rgba(239,68,68,0.5)"
                  strokeDasharray="4 4"
                  label={{ value: '400mg FDA', position: 'right', fontSize: 9, fill: 'rgba(239,68,68,0.6)' }}
                />
                <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={16}>
                  {DAY_SUMMARIES.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> &lt;300mg</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> 300–400mg</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> &gt;400mg</span>
            </div>
          </div>
        </div>

        {/* ── 3. Half-life decay demo (centerpiece) ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-text-primary">Half-Life Decay Curve</p>
            <span className="text-xs text-text-secondary ml-auto">{selectedDemoDay.label}</span>
          </div>

          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            {/* Dose summary */}
            <div className="flex flex-wrap gap-2">
              {selectedDemoDay.doses.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
                >
                  <Coffee className="w-3 h-3" />
                  {d.label} · {d.mg}mg
                </span>
              ))}
              {selectedDemoDay.doses.length === 0 && (
                <span className="text-xs text-text-secondary">No caffeine logged this day</span>
              )}
            </div>

            {/* Decay area chart */}
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={selectedDemoDay.curve}
                margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="caffeineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={xAxisTicks}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DecayTooltip />} />
                {/* Dose intake markers */}
                {selectedDemoDay.doses.map((d, i) => {
                  const h = d.hourDecimal
                  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
                  const ampm = h >= 12 ? 'pm' : 'am'
                  const wholeH = Math.floor(displayH)
                  const mins = Math.round((displayH - wholeH) * 60)
                  const label =
                    mins === 0
                      ? `${wholeH}${ampm}`
                      : `${wholeH}:${mins.toString().padStart(2, '0')}${ampm}`
                  return (
                    <ReferenceLine
                      key={i}
                      x={label}
                      stroke="rgba(245,158,11,0.5)"
                      strokeDasharray="3 3"
                    />
                  )
                })}
                {/* Bedtime marker */}
                {bedtimePoint && (
                  <ReferenceLine
                    x={bedtimePoint.time}
                    stroke="rgba(99,102,241,0.6)"
                    strokeDasharray="4 4"
                    label={{ value: '10pm', position: 'top', fontSize: 9, fill: 'rgba(99,102,241,0.8)' }}
                  />
                )}
                {/* 30mg "safe" threshold */}
                <ReferenceLine
                  y={30}
                  stroke="rgba(34,197,94,0.4)"
                  strokeDasharray="4 4"
                  label={{ value: '30mg safe', position: 'right', fontSize: 9, fill: 'rgba(34,197,94,0.6)' }}
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#caffeineGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#f59e0b' }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Bedtime summary callout */}
            <div className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              selectedDemoDay.activeAtBedtime < 30
                ? 'bg-green-500/5 border-green-500/20'
                : selectedDemoDay.activeAtBedtime < 80
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : 'bg-red-500/5 border-red-500/20'
            )}>
              <div className="flex items-center gap-2">
                <Moon className={cn(
                  'w-4 h-4',
                  selectedDemoDay.activeAtBedtime < 30
                    ? 'text-green-400'
                    : selectedDemoDay.activeAtBedtime < 80
                      ? 'text-orange-400'
                      : 'text-red-400'
                )} />
                <span className="text-sm text-text-primary">Active at 10pm</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-lg font-bold',
                  selectedDemoDay.activeAtBedtime < 30
                    ? 'text-green-400'
                    : selectedDemoDay.activeAtBedtime < 80
                      ? 'text-orange-400'
                      : 'text-red-400'
                )}>
                  {selectedDemoDay.activeAtBedtime}mg
                </span>
                <p className="text-xs text-text-secondary">
                  {selectedDemoDay.activeAtBedtime < 30 ? 'Good for sleep' : selectedDemoDay.activeAtBedtime < 80 ? 'Mild impact' : 'High sleep risk'}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary text-center">
              5.5-hour half-life model · Nehlig 2010 · amber lines = dose times · purple = bedtime
            </p>
          </div>
        </div>

        {/* ── 4. Time-of-day histogram ───────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">Intake Time-of-Day Pattern</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={TOD_HISTOGRAM}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<TODTooltip />} />
                <ReferenceLine
                  x="2pm"
                  stroke="rgba(249,115,22,0.5)"
                  strokeDasharray="4 4"
                  label={{ value: 'Cutoff', position: 'top', fontSize: 9, fill: 'rgba(249,115,22,0.7)' }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={18}>
                  {TOD_HISTOGRAM.map((entry, i) => (
                    <Cell key={i} fill={entry.isLate ? '#f97316' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" /> Before 2pm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" /> After 2pm (late)</span>
            </div>
          </div>
        </div>

        {/* ── 5. Sleep correlation ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">Sleep Correlation</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <p className="text-xs text-text-secondary">Comparing nights by active caffeine at bedtime (last 30 days)</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Low-caffeine nights */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">Low Active (&lt;30mg)</p>
                <p className="text-xs text-text-secondary">{LOW_ACTIVE_STATS.count} nights</p>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-text-secondary">Avg sleep</span>
                    <span className="text-base font-bold text-green-400">{LOW_ACTIVE_STATS.sleep}h</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-text-secondary">HRV baseline</span>
                    <span className="text-base font-bold text-green-400">{LOW_ACTIVE_STATS.hrv}</span>
                  </div>
                </div>
              </div>

              {/* High-caffeine nights */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">High Active (&gt;80mg)</p>
                <p className="text-xs text-text-secondary">{HIGH_ACTIVE_STATS.count} nights</p>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-text-secondary">Avg sleep</span>
                    <span className="text-base font-bold text-red-400">{HIGH_ACTIVE_STATS.sleep}h</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-text-secondary">HRV baseline</span>
                    <span className="text-base font-bold text-red-400">{HIGH_ACTIVE_STATS.hrv}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delta callout */}
            <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-xs text-text-secondary leading-snug">
                High bedtime caffeine correlates with{' '}
                <span className="text-orange-400 font-medium">
                  {(LOW_ACTIVE_STATS.sleep - HIGH_ACTIVE_STATS.sleep).toFixed(1)}h less sleep
                </span>{' '}
                and{' '}
                <span className="text-orange-400 font-medium">
                  {(LOW_ACTIVE_STATS.hrv - HIGH_ACTIVE_STATS.hrv).toFixed(1)} lower HRV
                </span>{' '}
                vs. low-caffeine nights.
              </p>
            </div>
          </div>
        </div>

        {/* ── 6. Science ────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-text-secondary" />
            <p className="text-sm font-semibold text-text-primary">The Science</p>
          </div>
          <ScienceAccordion />
        </div>

        {/* ── 7. Optimization tips ──────────────────────────────────────────── */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Timing Optimisation</p>
          <ul className="space-y-2">
            {[
              { icon: '⏰', text: 'First caffeine 90–120 min after waking to avoid cortisol overlap' },
              { icon: '🛑', text: 'Cut off 8–10h before bed — for 10pm sleep, last dose by 12–2pm' },
              { icon: '⚡', text: 'Performance dose: 3–6 mg/kg body weight, 30–60 min pre-exercise' },
              { icon: '📊', text: 'Stay under 400mg/day FDA limit for healthy adults' },
              { icon: '💊', text: 'Tolerance resets after 7–14 days of abstinence (Nehlig 2010)' },
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
