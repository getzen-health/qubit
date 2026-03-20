'use client'

import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type IntensityTier = 'moderate' | 'high' | 'extreme'

interface IntervalSession {
  id: string
  date: string
  sport: string
  durationMinutes: number
  avgHR: number
  maxHR: number
  spread: number
  tier: IntensityTier
}

interface MonthlyVolume {
  month: string
  sessions: number
  avgSpread: number
}

// ─── Intensity tier config ────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  IntensityTier,
  { label: string; badgeBg: string; badgeText: string; color: string }
> = {
  moderate: {
    label: 'Moderate',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950/50',
    badgeText: 'text-yellow-700 dark:text-yellow-400',
    color: '#eab308',
  },
  high: {
    label: 'High',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/50',
    badgeText: 'text-orange-700 dark:text-orange-400',
    color: '#f97316',
  },
  extreme: {
    label: 'Extreme',
    badgeBg: 'bg-red-100 dark:bg-red-950/50',
    badgeText: 'text-red-700 dark:text-red-400',
    color: '#ef4444',
  },
}

function classifySpread(spread: number): IntensityTier {
  if (spread > 40) return 'extreme'
  if (spread > 30) return 'high'
  return 'moderate'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// ~45 interval sessions over 12 months (Mar 2025 – Feb 2026)
// Mix: Running 40%, HIIT 35%, Cycling 25%
// avg HR spread ~27 bpm, avgHR ~148 bpm, maxHR ~177 bpm

const RAW_SESSIONS: Array<{
  id: string
  date: string
  sport: string
  durationMinutes: number
  avgHR: number
  maxHR: number
}> = [
  // March 2025
  { id: 's1',  date: '2025-03-04', sport: 'Running', durationMinutes: 42, avgHR: 147, maxHR: 178 },
  { id: 's2',  date: '2025-03-12', sport: 'HIIT',    durationMinutes: 35, avgHR: 152, maxHR: 185 },
  { id: 's3',  date: '2025-03-21', sport: 'Cycling',  durationMinutes: 55, avgHR: 143, maxHR: 171 },
  // April 2025
  { id: 's4',  date: '2025-04-02', sport: 'HIIT',    durationMinutes: 30, avgHR: 155, maxHR: 187 },
  { id: 's5',  date: '2025-04-10', sport: 'Running', durationMinutes: 45, avgHR: 149, maxHR: 174 },
  { id: 's6',  date: '2025-04-18', sport: 'Cycling',  durationMinutes: 60, avgHR: 141, maxHR: 168 },
  { id: 's7',  date: '2025-04-26', sport: 'HIIT',    durationMinutes: 32, avgHR: 156, maxHR: 186 },
  // May 2025
  { id: 's8',  date: '2025-05-05', sport: 'Running', durationMinutes: 48, avgHR: 150, maxHR: 179 },
  { id: 's9',  date: '2025-05-13', sport: 'HIIT',    durationMinutes: 38, avgHR: 153, maxHR: 184 },
  { id: 's10', date: '2025-05-22', sport: 'Cycling',  durationMinutes: 52, avgHR: 144, maxHR: 172 },
  // June 2025
  { id: 's11', date: '2025-06-03', sport: 'Running', durationMinutes: 44, avgHR: 148, maxHR: 176 },
  { id: 's12', date: '2025-06-11', sport: 'HIIT',    durationMinutes: 33, avgHR: 157, maxHR: 191 },
  { id: 's13', date: '2025-06-19', sport: 'Cycling',  durationMinutes: 58, avgHR: 142, maxHR: 170 },
  { id: 's14', date: '2025-06-27', sport: 'Running', durationMinutes: 46, avgHR: 151, maxHR: 178 },
  // July 2025
  { id: 's15', date: '2025-07-04', sport: 'HIIT',    durationMinutes: 36, avgHR: 154, maxHR: 188 },
  { id: 's16', date: '2025-07-12', sport: 'Running', durationMinutes: 50, avgHR: 146, maxHR: 172 },
  { id: 's17', date: '2025-07-20', sport: 'Cycling',  durationMinutes: 62, avgHR: 140, maxHR: 165 },
  { id: 's18', date: '2025-07-29', sport: 'HIIT',    durationMinutes: 34, avgHR: 158, maxHR: 192 },
  // August 2025
  { id: 's19', date: '2025-08-06', sport: 'Running', durationMinutes: 47, avgHR: 149, maxHR: 176 },
  { id: 's20', date: '2025-08-14', sport: 'HIIT',    durationMinutes: 31, avgHR: 155, maxHR: 186 },
  { id: 's21', date: '2025-08-22', sport: 'Cycling',  durationMinutes: 56, avgHR: 143, maxHR: 169 },
  // September 2025
  { id: 's22', date: '2025-09-03', sport: 'Running', durationMinutes: 43, avgHR: 150, maxHR: 177 },
  { id: 's23', date: '2025-09-11', sport: 'HIIT',    durationMinutes: 37, avgHR: 152, maxHR: 183 },
  { id: 's24', date: '2025-09-19', sport: 'Cycling',  durationMinutes: 54, avgHR: 145, maxHR: 173 },
  { id: 's25', date: '2025-09-27', sport: 'Running', durationMinutes: 49, avgHR: 147, maxHR: 175 },
  // October 2025
  { id: 's26', date: '2025-10-07', sport: 'HIIT',    durationMinutes: 32, avgHR: 156, maxHR: 190 },
  { id: 's27', date: '2025-10-15', sport: 'Running', durationMinutes: 45, avgHR: 148, maxHR: 176 },
  { id: 's28', date: '2025-10-23', sport: 'Cycling',  durationMinutes: 57, avgHR: 142, maxHR: 168 },
  // November 2025
  { id: 's29', date: '2025-11-04', sport: 'Running', durationMinutes: 44, avgHR: 151, maxHR: 179 },
  { id: 's30', date: '2025-11-12', sport: 'HIIT',    durationMinutes: 35, avgHR: 154, maxHR: 186 },
  { id: 's31', date: '2025-11-20', sport: 'Cycling',  durationMinutes: 53, avgHR: 143, maxHR: 170 },
  { id: 's32', date: '2025-11-28', sport: 'HIIT',    durationMinutes: 30, avgHR: 157, maxHR: 189 },
  // December 2025
  { id: 's33', date: '2025-12-05', sport: 'Running', durationMinutes: 46, avgHR: 148, maxHR: 174 },
  { id: 's34', date: '2025-12-13', sport: 'HIIT',    durationMinutes: 38, avgHR: 153, maxHR: 185 },
  { id: 's35', date: '2025-12-21', sport: 'Cycling',  durationMinutes: 59, avgHR: 141, maxHR: 167 },
  // January 2026
  { id: 's36', date: '2026-01-04', sport: 'Running', durationMinutes: 48, avgHR: 150, maxHR: 178 },
  { id: 's37', date: '2026-01-12', sport: 'HIIT',    durationMinutes: 33, avgHR: 155, maxHR: 187 },
  { id: 's38', date: '2026-01-20', sport: 'Cycling',  durationMinutes: 55, avgHR: 144, maxHR: 172 },
  { id: 's39', date: '2026-01-28', sport: 'Running', durationMinutes: 42, avgHR: 147, maxHR: 175 },
  // February 2026
  { id: 's40', date: '2026-02-05', sport: 'HIIT',    durationMinutes: 36, avgHR: 156, maxHR: 191 },
  { id: 's41', date: '2026-02-13', sport: 'Running', durationMinutes: 50, avgHR: 149, maxHR: 177 },
  { id: 's42', date: '2026-02-21', sport: 'Cycling',  durationMinutes: 61, avgHR: 140, maxHR: 165 },
  // March 2026 (current month)
  { id: 's43', date: '2026-03-04', sport: 'HIIT',    durationMinutes: 34, avgHR: 157, maxHR: 192 },
  { id: 's44', date: '2026-03-11', sport: 'Running', durationMinutes: 47, avgHR: 150, maxHR: 179 },
  { id: 's45', date: '2026-03-18', sport: 'Cycling',  durationMinutes: 54, avgHR: 143, maxHR: 171 },
]

const ALL_SESSIONS: IntervalSession[] = RAW_SESSIONS.map((s) => {
  const spread = s.maxHR - s.avgHR
  return { ...s, spread, tier: classifySpread(spread) }
})

// Monthly volume (12-month window Mar 2025 – Feb 2026, plus partial Mar 2026)
const MONTH_KEYS = [
  'Mar \'25', 'Apr \'25', 'May \'25', 'Jun \'25', 'Jul \'25', 'Aug \'25',
  'Sep \'25', 'Oct \'25', 'Nov \'25', 'Dec \'25', 'Jan \'26', 'Feb \'26',
]

function buildMonthlyData(): MonthlyVolume[] {
  const buckets: Record<string, { count: number; spreadSum: number }> = {}

  for (const key of MONTH_KEYS) {
    buckets[key] = { count: 0, spreadSum: 0 }
  }

  const monthMap: Record<string, string> = {
    '2025-03': "Mar '25", '2025-04': "Apr '25", '2025-05': "May '25",
    '2025-06': "Jun '25", '2025-07': "Jul '25", '2025-08': "Aug '25",
    '2025-09': "Sep '25", '2025-10': "Oct '25", '2025-11': "Nov '25",
    '2025-12': "Dec '25", '2026-01': "Jan '26", '2026-02': "Feb '26",
  }

  for (const s of ALL_SESSIONS) {
    const ym = s.date.slice(0, 7)
    const key = monthMap[ym]
    if (!key) continue
    buckets[key].count += 1
    buckets[key].spreadSum += s.spread
  }

  return MONTH_KEYS.map((month) => {
    const b = buckets[month]
    return {
      month,
      sessions: b.count,
      avgSpread: b.count > 0 ? Math.round(b.spreadSum / b.count) : 0,
    }
  })
}

const MONTHLY_DATA = buildMonthlyData()

// ─── Derived summary stats ────────────────────────────────────────────────────

const TOTAL_SESSIONS = ALL_SESSIONS.length
const AVG_SPREAD =
  Math.round(
    (ALL_SESSIONS.reduce((s, r) => s + r.spread, 0) / ALL_SESSIONS.length) * 10
  ) / 10
// Work:rest ratio ~1.8:1 is static domain knowledge for mock data
const WORK_REST_RATIO = '1.8:1'

// Recent 10 sessions (newest first)
const RECENT_SESSIONS = [...ALL_SESSIONS]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 10)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

interface VolumeTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: MonthlyVolume }>
  label?: string
}

function VolumeTooltip({ active, payload, label }: VolumeTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-gray-500 dark:text-gray-400">
        Sessions:{' '}
        <span className="font-medium text-orange-600 dark:text-orange-400">
          {payload[0].value}
        </span>
      </p>
    </div>
  )
}

interface SpreadTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: MonthlyVolume }>
  label?: string
}

function SpreadTooltip({ active, payload, label }: SpreadTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-gray-500 dark:text-gray-400">
        Avg HR spread:{' '}
        <span className="font-medium text-orange-500 dark:text-orange-400">
          {payload[0].value} bpm
        </span>
      </p>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-1 flex-1">
      <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-400 leading-tight">
        {value}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntervalDetectorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Interval Detector
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Auto-detecting interval structure from HR patterns
            </p>
          </div>
          <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">

        {/* ── Summary stats ─────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <StatCard
            label="Interval Sessions"
            value={String(TOTAL_SESSIONS)}
            sub="last 12 months"
          />
          <StatCard
            label="Avg HR Spread"
            value={`${AVG_SPREAD} bpm`}
            sub="max − avg HR"
          />
          <StatCard
            label="Work:Rest Ratio"
            value={WORK_REST_RATIO}
            sub="effort vs recovery"
          />
        </div>

        {/* ── Detection legend ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Intensity Classification
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
            Sessions with HR spread (max HR − avg HR) &gt; 20 bpm are classified as interval sessions.
            Wider spreads indicate pronounced effort peaks with deeper recovery valleys.
          </p>
          <div className="space-y-2">
            {(
              [
                ['moderate', '20–30 bpm spread — structured tempo or threshold intervals'],
                ['high', '30–40 bpm spread — classic VO₂max intervals or sprint sets'],
                ['extreme', '> 40 bpm spread — repeated all-out efforts (Wingate-style / HIIT)'],
              ] as [IntensityTier, string][]
            ).map(([tier, desc]) => {
              const cfg = TIER_CONFIG[tier]
              return (
                <div
                  key={tier}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2 bg-gray-50 dark:bg-gray-800"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                      {desc}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Monthly interval volume bar chart ─────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
            Monthly Interval Volume
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Session count per month · all sports
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={MONTHLY_DATA}
              margin={{ left: -18, right: 4, top: 4, bottom: 0 }}
              barSize={14}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 8, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, 6]}
              />
              <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.04 }} />
              <Bar dataKey="sessions" fill="#f97316" radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── HR spread trend area chart ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
            HR Spread Trend
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Monthly avg HR spread (bpm) · higher = more intense intervals
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={MONTHLY_DATA}
              margin={{ left: -14, right: 4, top: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 8, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                domain={[15, 40]}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip content={<SpreadTooltip />} cursor={{ stroke: '#f97316', strokeOpacity: 0.2 }} />
              <Area
                type="monotone"
                dataKey="avgSpread"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#spreadGrad)"
                dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#f97316', strokeWidth: 0 }}
                name="Avg HR Spread"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Intensity reference bands legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {(
              [
                ['moderate', '20–30 bpm'],
                ['high', '30–40 bpm'],
                ['extreme', '>40 bpm'],
              ] as [IntensityTier, string][]
            ).map(([tier, range]) => {
              const cfg = TIER_CONFIG[tier]
              return (
                <div key={tier} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {cfg.label}: {range}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Recent interval sessions table ────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Recent Interval Sessions
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Last 10 detected sessions · spread &gt; 20 bpm
            </p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-1.5 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            {['Date', 'Sport', 'Dur.', 'Avg', 'Max', 'Tier'].map((h, i) => (
              <p
                key={h}
                className={`text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}
              >
                {h}
              </p>
            ))}
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {RECENT_SESSIONS.map((s) => {
              const cfg = TIER_CONFIG[s.tier]
              return (
                <li
                  key={s.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-1.5 px-4 py-3 items-center"
                >
                  {/* Date */}
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {fmtDate(s.date)}
                  </span>

                  {/* Sport */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-right tabular-nums">
                    {s.sport}
                  </span>

                  {/* Duration */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-right tabular-nums">
                    {fmtDuration(s.durationMinutes)}
                  </span>

                  {/* Avg HR */}
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-right tabular-nums">
                    {s.avgHR}
                  </span>

                  {/* Max HR */}
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-right tabular-nums">
                    {s.maxHR}
                  </span>

                  {/* Intensity badge */}
                  <span
                    className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}
                  >
                    {cfg.label}
                  </span>
                </li>
              )
            })}
          </ul>

          {/* Spread column subheader */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              Avg / Max columns show heart rate in bpm · Spread = Max − Avg
            </p>
          </div>
        </div>

        {/* ── Science callout ───────────────────────────────────────────────── */}
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                Science: HIIT Taxonomy (Buchheit &amp; Laursen 2013)
              </h2>
              <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                Buchheit &amp; Laursen 2013 (<em>Sports Medicine</em>, 2-part review) defined HIIT taxonomy:
                short intervals (≤30 s), long intervals (2–4 min), and repeated sprints. HR spread
                (max − avg) is a proxy for interval intensity — wide spreads indicate pronounced
                effort peaks with recovery valleys.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
