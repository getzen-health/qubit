'use client'

import Link from 'next/link'
import { ArrowLeft, Waves } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
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
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────────

type DepthCategory = 'Snorkelling' | 'Open Water' | 'Advanced' | 'Deep'

interface Dive {
  id: string
  date: string        // ISO date string
  maxDepth: number    // metres
  waterTemp: number   // °C
  duration: number    // minutes
  category: DepthCategory
}

// ─── Depth category helpers ────────────────────────────────────────────────────

function getCategory(depth: number): DepthCategory {
  if (depth < 5) return 'Snorkelling'
  if (depth < 18) return 'Open Water'
  if (depth < 30) return 'Advanced'
  return 'Deep'
}

interface CategoryStyle {
  hex: string
  badgeBg: string
  badgeText: string
  rowBg: string
}

const CATEGORY_STYLE: Record<DepthCategory, CategoryStyle> = {
  Snorkelling: {
    hex: '#06b6d4',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    rowBg: 'bg-cyan-50/40 dark:bg-cyan-950/20',
  },
  'Open Water': {
    hex: '#3b82f6',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    rowBg: 'bg-blue-50/40 dark:bg-blue-950/20',
  },
  Advanced: {
    hex: '#6366f1',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    rowBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
  },
  Deep: {
    hex: '#a855f7',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    rowBg: 'bg-purple-50/40 dark:bg-purple-950/20',
  },
}

// ─── Mock data — 8 dives over 90 days, oldest → newest ────────────────────────

const MOCK_DIVES: Dive[] = [
  // Snorkelling sessions (shallow, warm water)
  { id: '1', date: '2025-12-20', maxDepth: 3.2, waterTemp: 27, duration: 45, category: 'Snorkelling' },
  { id: '2', date: '2025-12-28', maxDepth: 4.1, waterTemp: 27, duration: 52, category: 'Snorkelling' },
  // Open Water dives (mid depth progression)
  { id: '3', date: '2026-01-05', maxDepth: 8.4,  waterTemp: 23, duration: 38, category: 'Open Water' },
  { id: '4', date: '2026-01-14', maxDepth: 11.7, waterTemp: 22, duration: 41, category: 'Open Water' },
  { id: '5', date: '2026-01-22', maxDepth: 13.2, waterTemp: 22, duration: 44, category: 'Open Water' },
  { id: '6', date: '2026-02-01', maxDepth: 15.0, waterTemp: 24, duration: 46, category: 'Open Water' },
  // Advanced dives (deep progression)
  { id: '7', date: '2026-02-18', maxDepth: 20.3, waterTemp: 19, duration: 35, category: 'Advanced' },
  { id: '8', date: '2026-03-08', maxDepth: 22.1, waterTemp: 19, duration: 33, category: 'Advanced' },
]

// ─── NDL reference data ────────────────────────────────────────────────────────

const NDL_TABLE = [
  {
    category: 'Snorkelling' as DepthCategory,
    range: '0–5 m',
    ndl: 'No limit',
    note: 'Breath-hold only; no nitrogen loading.',
  },
  {
    category: 'Open Water' as DepthCategory,
    range: '5–18 m',
    ndl: '~56 min at 18 m',
    note: 'PADI Open Water certified depth ceiling.',
  },
  {
    category: 'Advanced' as DepthCategory,
    range: '18–30 m',
    ndl: '~20 min at 30 m',
    note: 'Requires Advanced Open Water certification.',
  },
  {
    category: 'Deep' as DepthCategory,
    range: '30–40 m',
    ndl: '9 min; deco risk',
    note: 'Deep Diver specialty; mandatory safety stops.',
  },
]

// ─── Tooltip style ─────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #0f172a)',
  border: '1px solid rgba(6,182,212,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric' })
}

function ndlAtDepth(depth: number): string {
  if (depth < 5) return '∞'
  if (depth < 18) return `~${Math.round(56 - (depth - 5) * 2.8)} min`
  if (depth < 30) return `~${Math.round(20 - (depth - 18) * 1.2)} min`
  return `~${Math.round(9 - (depth - 30) * 0.3)} min`
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: DepthCategory }) {
  const s = CATEGORY_STYLE[category]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.badgeBg} ${s.badgeText}`}>
      {category}
    </span>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DivingPage() {
  // ── Derived stats ────────────────────────────────────────────────────────────
  const deepest = MOCK_DIVES.reduce((a, b) => (a.maxDepth > b.maxDepth ? a : b))
  const deepestCategory = getCategory(deepest.maxDepth)
  const totalDives = MOCK_DIVES.length
  const avgMaxDepth = MOCK_DIVES.reduce((s, d) => s + d.maxDepth, 0) / totalDives
  const avgWaterTemp = MOCK_DIVES.reduce((s, d) => s + d.waterTemp, 0) / totalDives
  const ndlAtDeepest = ndlAtDepth(deepest.maxDepth)

  // ── Chart data (oldest first) ────────────────────────────────────────────────
  const chartData = MOCK_DIVES.map((d) => ({
    date: fmtDate(d.date),
    depth: d.maxDepth,
    category: d.category,
    hex: CATEGORY_STYLE[d.category].hex,
  }))

  // ── Recent dives (newest first, last 10) ─────────────────────────────────────
  const recentDives = [...MOCK_DIVES].reverse().slice(0, 10)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-cyan-100 dark:border-cyan-900/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Diving Analytics</h1>
            <p className="text-sm text-cyan-600 dark:text-cyan-400">
              underwaterDepth · waterTemperature · Apple Watch Ultra
            </p>
          </div>
          <Waves className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* ── 1. Hero card ── */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-200 dark:border-cyan-900/40 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/40 dark:via-blue-950/40 dark:to-indigo-950/50 p-5">
          {/* Decorative wave overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-20"
            style={{
              backgroundImage: `radial-gradient(ellipse at 80% 20%, #06b6d4 0%, transparent 55%),
                                radial-gradient(ellipse at 20% 80%, #6366f1 0%, transparent 55%)`,
            }}
          />

          <div className="relative flex items-start gap-4">
            {/* Ocean wave icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan-500/20 dark:bg-cyan-400/10 flex items-center justify-center">
              <Waves className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1">
                Deepest dive
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-5xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {deepest.maxDepth.toFixed(1)}
                  <span className="text-2xl font-medium text-gray-500 dark:text-gray-400 ml-1">m</span>
                </span>
                <CategoryBadge category={deepestCategory} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {fmtDate(deepest.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Total dives" value={String(totalDives)} unit="" color="text-cyan-600 dark:text-cyan-400" />
            <StatTile label="Avg max depth" value={avgMaxDepth.toFixed(1)} unit=" m" color="text-blue-600 dark:text-blue-400" />
            <StatTile label="Avg water temp" value={avgWaterTemp.toFixed(1)} unit=" °C" color="text-indigo-600 dark:text-indigo-400" />
            <StatTile label="NDL at deepest" value={ndlAtDeepest} unit="" color="text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        {/* ── 2. Depth history chart ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Depth History — Last 90 Days
            </h2>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
            {(Object.entries(CATEGORY_STYLE) as [DepthCategory, CategoryStyle][]).map(([cat, s]) => (
              <span key={cat} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: s.hex }} />
                {cat}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                className="text-gray-400 dark:text-gray-500"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                width={28}
                tickLine={false}
                axisLine={false}
                domain={[0, 35]}
                tickFormatter={(v: number) => `${v}m`}
                className="text-gray-400 dark:text-gray-500"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, _name: string, props: { payload?: { category: DepthCategory } }) => [
                  `${v} m — ${props.payload?.category ?? ''}`,
                  'Max depth',
                ]}
              />
              {/* Reference lines for certification depth limits */}
              <ReferenceLine
                y={18}
                stroke="#3b82f6"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: 'OW 18 m', position: 'insideTopRight', fontSize: 9, fill: '#3b82f6' }}
              />
              <ReferenceLine
                y={30}
                stroke="#6366f1"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{ value: 'Adv 30 m', position: 'insideTopRight', fontSize: 9, fill: '#6366f1' }}
              />
              <Bar dataKey="depth" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.hex} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 3. Dive log table ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Dive Log — Last 10 Dives
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Max depth</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Water temp</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentDives.map((dive) => {
                  const s = CATEGORY_STYLE[dive.category]
                  return (
                    <tr key={dive.id} className={`transition-colors ${s.rowBg}`}>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {fmtDate(dive.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2.5">
                        <CategoryBadge category={dive.category} />
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums" style={{ color: s.hex }}>
                        {dive.maxDepth.toFixed(1)} m
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                        {dive.waterTemp} °C
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                        {dive.duration} min
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 4. NDL reference card ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              No-Decompression Limits (NDL) Reference
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Maximum bottom time without mandatory decompression stops · PADI tables
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {NDL_TABLE.map((row) => {
              const s = CATEGORY_STYLE[row.category]
              return (
                <div key={row.category} className={`flex items-center gap-4 px-4 py-3 ${s.rowBg}`}>
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{row.category}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{row.range}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{row.note}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold tabular-nums" style={{ color: s.hex }}>{row.ndl}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 5. Science card ── */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            The Science of Diving
          </h2>

          <ScienceRow
            title="Pressure & Nitrogen Narcosis"
            body="Water pressure increases by 1 atm for every 10 m of depth — at 30 m you experience 4 atm. The elevated partial pressure of nitrogen causes narcosis (the 'rapture of the deep'), typically onset at 30–40 m, impairing judgment and coordination."
            accent="cyan"
          />
          <ScienceRow
            title="No-Decompression Limits"
            body="NDLs define the maximum time at a given depth before nitrogen saturation requires mandatory decompression stops on ascent. Exceeding the NDL risks Decompression Sickness (DCS — 'the bends'), caused by nitrogen bubbles forming in tissues."
            accent="blue"
          />
          <ScienceRow
            title="Water Temperature & Thermoregulation"
            body="Water conducts heat approximately 25× faster than air. Even at 24°C (75°F) a diver can experience hypothermia on longer dives. A wetsuit is recommended below 18°C (64°F); a drysuit below 10°C (50°F)."
            accent="indigo"
          />
          <ScienceRow
            title="Apple Watch Ultra"
            body="Apple Watch Ultra is EN13319 compliant, rated to 100 m / 10 atm. When paired with the Oceanic+ app it records continuous depth profiles, water temperature, and dive time directly to HealthKit via the underwaterDepth and waterTemperature data types (iOS 16+)."
            accent="purple"
          />

          {/* Safety warning */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Safety notice
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">
              Never dive beyond your certification level. Always dive with a buddy. Respect NDL limits — no dive profile is worth decompression sickness. When in doubt, ascend early and conservatively.
            </p>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}

// ─── Reusable sub-components ───────────────────────────────────────────────────

function StatTile({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: string
  unit: string
  color: string
}) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-white/80 dark:border-gray-700/30 px-3 py-2.5 text-center">
      <p className={`text-xl font-bold tabular-nums ${color}`}>
        {value}
        {unit && <span className="text-sm font-medium ml-0.5">{unit}</span>}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

type AccentColor = 'cyan' | 'blue' | 'indigo' | 'purple'

const ACCENT_CLASSES: Record<AccentColor, { dot: string; title: string }> = {
  cyan:   { dot: 'bg-cyan-400',   title: 'text-cyan-800 dark:text-cyan-300' },
  blue:   { dot: 'bg-blue-400',   title: 'text-blue-800 dark:text-blue-300' },
  indigo: { dot: 'bg-indigo-400', title: 'text-indigo-800 dark:text-indigo-300' },
  purple: { dot: 'bg-purple-400', title: 'text-purple-800 dark:text-purple-300' },
}

function ScienceRow({
  title,
  body,
  accent,
}: {
  title: string
  body: string
  accent: AccentColor
}) {
  const cls = ACCENT_CLASSES[accent]
  return (
    <div className="flex gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cls.dot}`} />
      <div>
        <p className={`text-xs font-semibold ${cls.title}`}>{title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
