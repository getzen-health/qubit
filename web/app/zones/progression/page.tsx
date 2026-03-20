'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Info } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

// ─── Zone config ──────────────────────────────────────────────────────────────

const ZONES = [
  {
    id: 1,
    name: 'Recovery',
    label: 'Z1',
    color: '#60a5fa',   // blue-400
    hrRange: '< 60% HRmax',
    bpm: '< 114 bpm',
    description: 'Very light, active recovery. Fat burning. Builds aerobic base without stress.',
    seilerCategory: 'low',
  },
  {
    id: 2,
    name: 'Aerobic Base',
    label: 'Z2',
    color: '#4ade80',   // green-400
    hrRange: '60–70% HRmax',
    bpm: '114–133 bpm',
    description: 'Conversational pace. Maximises mitochondrial density and fat oxidation. The cornerstone of endurance training.',
    seilerCategory: 'low',
  },
  {
    id: 3,
    name: 'Aerobic',
    label: 'Z3',
    color: '#facc15',   // yellow-400
    hrRange: '70–80% HRmax',
    bpm: '133–152 bpm',
    description: '"Junk miles" zone. Moderate effort that is too hard for recovery yet too easy for adaptation. Accumulates fatigue without proportional benefit.',
    seilerCategory: 'moderate',
  },
  {
    id: 4,
    name: 'Threshold',
    label: 'Z4',
    color: '#fb923c',   // orange-400
    hrRange: '80–90% HRmax',
    bpm: '152–171 bpm',
    description: 'Near lactate threshold. Builds speed and power. Hard effort sustainable for 30–60 min.',
    seilerCategory: 'high',
  },
  {
    id: 5,
    name: 'VO₂ Max',
    label: 'Z5',
    color: '#f87171',   // red-400
    hrRange: '> 90% HRmax',
    bpm: '> 171 bpm',
    description: 'Maximum intensity. Develops VO₂ max and neuromuscular power. Sustainable only in short bursts.',
    seilerCategory: 'high',
  },
] as const

type ZoneId = 1 | 2 | 3 | 4 | 5

// ─── Mock 12-month data (Apr 2025 → Mar 2026) ─────────────────────────────────
// Gradual shift toward 80/20 polarized training over the year.
// Total monthly volume grows from ~360 min to ~540 min.

interface MonthData {
  month: string
  z1: number
  z2: number
  z3: number
  z4: number
  z5: number
}

const MONTHLY_DATA: MonthData[] = [
  // Early months: too much Z3, under-polarized (~60% low)
  { month: 'Apr',  z1: 48,  z2: 168, z3: 90,  z4: 42,  z5: 12  },
  { month: 'May',  z1: 52,  z2: 175, z3: 88,  z4: 46,  z5: 14  },
  { month: 'Jun',  z1: 55,  z2: 182, z3: 82,  z4: 48,  z5: 16  },
  // Mid-year: shifting away from Z3, adding Z1/Z2
  { month: 'Jul',  z1: 62,  z2: 198, z3: 72,  z4: 50,  z5: 18  },
  { month: 'Aug',  z1: 68,  z2: 210, z3: 65,  z4: 54,  z5: 20  },
  { month: 'Sep',  z1: 72,  z2: 225, z3: 58,  z4: 52,  z5: 22  },
  // Late: approaching 80/20 polarized
  { month: 'Oct',  z1: 80,  z2: 238, z3: 48,  z4: 58,  z5: 24  },
  { month: 'Nov',  z1: 85,  z2: 248, z3: 40,  z4: 60,  z5: 26  },
  { month: 'Dec',  z1: 78,  z2: 232, z3: 42,  z4: 55,  z5: 22  }, // holiday dip
  // Final quarter: well-polarized (~78–82% low)
  { month: 'Jan',  z1: 88,  z2: 258, z3: 36,  z4: 62,  z5: 28  },
  { month: 'Feb',  z1: 92,  z2: 268, z3: 32,  z4: 65,  z5: 30  },
  { month: 'Mar',  z1: 96,  z2: 278, z3: 28,  z4: 68,  z5: 32  },
]

// ─── Derived aggregates ───────────────────────────────────────────────────────

function totalMinutes(d: MonthData) {
  return d.z1 + d.z2 + d.z3 + d.z4 + d.z5
}

function lowPct(d: MonthData) {
  return ((d.z1 + d.z2) / totalMinutes(d)) * 100
}

function highPct(d: MonthData) {
  return ((d.z4 + d.z5) / totalMinutes(d)) * 100
}

// Aggregate over all months
const ALL_TOTALS = {
  z1: MONTHLY_DATA.reduce((s, d) => s + d.z1, 0),
  z2: MONTHLY_DATA.reduce((s, d) => s + d.z2, 0),
  z3: MONTHLY_DATA.reduce((s, d) => s + d.z3, 0),
  z4: MONTHLY_DATA.reduce((s, d) => s + d.z4, 0),
  z5: MONTHLY_DATA.reduce((s, d) => s + d.z5, 0),
}
const GRAND_TOTAL = ALL_TOTALS.z1 + ALL_TOTALS.z2 + ALL_TOTALS.z3 + ALL_TOTALS.z4 + ALL_TOTALS.z5

const ZONE_TOTALS: { zone: typeof ZONES[number]; minutes: number; pct: number }[] = ZONES.map((z) => {
  const key = `z${z.id}` as keyof typeof ALL_TOTALS
  const minutes = ALL_TOTALS[key]
  return { zone: z, minutes, pct: (minutes / GRAND_TOTAL) * 100 }
})

const CURRENT_LOW_PCT = ((ALL_TOTALS.z1 + ALL_TOTALS.z2) / GRAND_TOTAL) * 100

// First-quarter vs last-quarter comparison
const FIRST_Q = MONTHLY_DATA.slice(0, 3)
const LAST_Q  = MONTHLY_DATA.slice(9, 12)

function qAvg(months: MonthData[], key: keyof MonthData) {
  return months.reduce((s, d) => s + (d[key] as number), 0) / months.length
}

interface TrendRow {
  zoneId: ZoneId
  label: string
  name: string
  color: string
  firstQ: number
  lastQ: number
  delta: number
}

const TREND_ROWS: TrendRow[] = ZONES.map((z) => {
  const key = `z${z.id}` as keyof MonthData
  const firstQ = qAvg(FIRST_Q, key)
  const lastQ  = qAvg(LAST_Q, key)
  return {
    zoneId: z.id as ZoneId,
    label: z.label,
    name: z.name,
    color: z.color,
    firstQ: Math.round(firstQ),
    lastQ:  Math.round(lastQ),
    delta:  Math.round(lastQ - firstQ),
  }
})

// Seiler targets
const SEILER_TARGETS: Record<ZoneId, string> = {
  1: '~30%',
  2: '~50%',
  3: '< 5%',
  4: '~10%',
  5: '~5%',
}

// ─── Recharts helpers ─────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtMin(m: number) {
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  mode: 'volume' | 'percent'
  data: MonthData[]
}

function CustomTooltip({ active, payload, label, mode, data }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const monthData = data.find((d) => d.month === label)
  const total = monthData ? totalMinutes(monthData) : 1
  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-xs shadow-lg space-y-1 min-w-[140px]">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {[...payload].reverse().map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-text-secondary">{entry.name}</span>
          </div>
          <span className="font-mono text-text-primary">
            {mode === 'volume'
              ? fmtMin(entry.value)
              : `${Math.round((entry.value / total) * 100)}%`}
          </span>
        </div>
      ))}
      {mode === 'volume' && (
        <div className="pt-1 mt-1 border-t border-border flex justify-between">
          <span className="text-text-secondary">Total</span>
          <span className="font-mono text-text-primary">{fmtMin(total)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZoneProgressionPage() {
  const [mode, setMode] = useState<'volume' | 'percent'>('volume')
  const [showScience, setShowScience] = useState(false)
  const [showDefs, setShowDefs] = useState(false)

  // For percentage mode we normalise each month to 100%
  const chartData = MONTHLY_DATA.map((d) => {
    if (mode === 'volume') return d
    const total = totalMinutes(d)
    return {
      month: d.month,
      z1: (d.z1 / total) * 100,
      z2: (d.z2 / total) * 100,
      z3: (d.z3 / total) * 100,
      z4: (d.z4 / total) * 100,
      z5: (d.z5 / total) * 100,
    }
  })

  const lowPctNow = Math.round(CURRENT_LOW_PCT)
  const quarterTrend = Math.round(lowPct(LAST_Q[2]) - lowPct(FIRST_Q[0]))

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/zones"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to training zones"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Zone Progression</h1>
            <p className="text-sm text-text-secondary">
              Track how your training intensity distribution evolves month by month
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-text-secondary shrink-0" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Polarization score card ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                Polarization Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-text-primary">{lowPctNow}%</span>
                <span className="text-sm text-text-secondary">low-intensity (Z1+Z2)</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  Near ideal
                </span>
                <span className="text-xs text-text-secondary">
                  Target: <span className="font-semibold text-text-primary">80%</span> (Seiler)
                </span>
              </div>
            </div>

            {/* Radial-ish progress ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-border,#333)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke="#4ade80" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - lowPctNow / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-text-primary">{lowPctNow}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-text-secondary">Aerobic base trend</p>
              <p className="font-semibold text-green-400 flex items-center gap-1 mt-0.5">
                <span>↗</span>
                +{quarterTrend}% this quarter
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">High-intensity share</p>
              <p className="font-semibold text-orange-400 mt-0.5">
                {Math.round(((ALL_TOTALS.z4 + ALL_TOTALS.z5) / GRAND_TOTAL) * 100)}% (Z4+Z5)
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Z3 "junk miles"</p>
              <p className="font-semibold text-yellow-400 mt-0.5">
                {Math.round((ALL_TOTALS.z3 / GRAND_TOTAL) * 100)}% (target: &lt;5%)
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Total training time</p>
              <p className="font-semibold text-text-primary mt-0.5">{fmtMin(GRAND_TOTAL)}</p>
            </div>
          </div>
        </div>

        {/* ── Stacked bar chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-semibold text-text-primary">Monthly Zone Distribution</h2>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs">
              <button
                onClick={() => setMode('volume')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  mode === 'volume'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setMode('percent')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  mode === 'percent'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                % Share
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary,#888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }}
                width={32}
                tickFormatter={mode === 'percent' ? (v) => `${Math.round(v)}%` : (v) => String(Math.round(v))}
              />
              <Tooltip
                content={<CustomTooltip mode={mode} data={MONTHLY_DATA} />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              {/* Stack from Z1 at bottom */}
              <Bar dataKey="z1" stackId="a" fill={ZONES[0].color} name="Z1 Recovery" />
              <Bar dataKey="z2" stackId="a" fill={ZONES[1].color} name="Z2 Aerobic Base" />
              <Bar dataKey="z3" stackId="a" fill={ZONES[2].color} name="Z3 Aerobic" />
              <Bar dataKey="z4" stackId="a" fill={ZONES[3].color} name="Z4 Threshold" />
              <Bar dataKey="z5" stackId="a" fill={ZONES[4].color} name="Z5 VO₂ Max" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {ZONES.map((z) => (
              <div key={z.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: z.color }} />
                <span>{z.label} {z.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Overall breakdown table ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Overall Breakdown (12 months)</h2>
          </div>
          <div className="divide-y divide-border">
            {ZONE_TOTALS.map(({ zone, minutes, pct }) => (
              <div key={zone.id} className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: zone.color + '22',
                      color: zone.color,
                      border: `1px solid ${zone.color}44`,
                    }}
                  >
                    {zone.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary">{zone.label} — {zone.name}</span>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="font-mono font-semibold text-text-primary">{fmtMin(minutes)}</span>
                        <span className="font-mono">{Math.round(pct)}%</span>
                        <span className="font-mono text-text-secondary/60">Seiler: {SEILER_TARGETS[zone.id as ZoneId]}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden ml-10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: zone.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trend table: first 3 vs last 3 months ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Quarterly Trend</h2>
            <p className="text-xs text-text-secondary mt-0.5">Avg minutes per month — first 3 vs last 3 months</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-secondary">
                  <th className="px-4 py-2.5 text-left font-medium">Zone</th>
                  <th className="px-4 py-2.5 text-right font-medium">Apr–Jun avg</th>
                  <th className="px-4 py-2.5 text-right font-medium">Jan–Mar avg</th>
                  <th className="px-4 py-2.5 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TREND_ROWS.map((row) => {
                  const up = row.delta > 0
                  const neutral = row.delta === 0
                  // For Z3, going down is good; for Z1/Z2/Z4/Z5, up is (generally) good
                  const isPositive =
                    row.zoneId === 3 ? !up : up
                  const deltaColor = neutral
                    ? 'text-text-secondary'
                    : isPositive
                    ? 'text-green-400'
                    : 'text-red-400'

                  return (
                    <tr key={row.zoneId}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              backgroundColor: row.color + '22',
                              color: row.color,
                              border: `1px solid ${row.color}44`,
                            }}
                          >
                            {row.zoneId}
                          </div>
                          <span className="text-text-primary font-medium">{row.label} {row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">{fmtMin(row.firstQ)}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary font-medium">{fmtMin(row.lastQ)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${deltaColor}`}>
                        {row.delta === 0 ? '—' : `${up ? '+' : ''}${fmtMin(Math.abs(row.delta))}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Science section ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowScience((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-secondary transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <h2 className="text-sm font-semibold text-text-primary">The Science of Polarized Training</h2>
            </div>
            <span className="text-text-secondary text-lg leading-none">{showScience ? '−' : '+'}</span>
          </button>

          {showScience && (
            <div className="px-4 pb-4 border-t border-border space-y-4 text-xs text-text-secondary pt-4">

              <div>
                <p className="font-semibold text-text-primary text-sm mb-1">
                  Seiler's 80/20 Rule (2010)
                </p>
                <p className="leading-relaxed">
                  Stephen Seiler's landmark 2010 research analysed elite endurance athletes across rowing, cycling,
                  cross-country skiing, and running. He found a consistent pattern: roughly 80% of training sessions
                  were performed at low intensity (below the first ventilatory threshold, VT1) and only ~20% at high
                  intensity (above VT2). This polarized distribution produced superior adaptations compared to
                  moderate-intensity approaches.
                </p>
              </div>

              <div>
                <p className="font-semibold text-text-primary text-sm mb-1">
                  Zone 2 and Mitochondrial Density
                </p>
                <p className="leading-relaxed">
                  Zone 2 training (60–70% HRmax) maximally stimulates mitochondrial biogenesis via the PGC-1α
                  pathway. With more mitochondria per muscle fibre, athletes oxidise fat more efficiently, spare
                  glycogen, and clear lactate faster — the physiological foundation of aerobic base. Dr Iñigo San
                  Millán's research with elite cyclists showed that Zone 2 capacity is one of the strongest
                  predictors of metabolic health and endurance performance.
                </p>
              </div>

              <div>
                <p className="font-semibold text-text-primary text-sm mb-1">
                  Why Zone 3 is "Junk Miles"
                </p>
                <p className="leading-relaxed">
                  Zone 3 sits between the two lactate thresholds — it is too hard to promote recovery and
                  fat-burning adaptations, yet too easy to drive meaningful VO₂ max or speed gains. Athletes who
                  cluster training here accumulate high fatigue with sub-optimal return on investment. This is the
                  "grey zone" or "moderate-intensity trap" described by Seiler and Tønnessen (2009).
                </p>
              </div>

              <div>
                <p className="font-semibold text-text-primary text-sm mb-1">
                  Pyramidal vs Polarized
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs mt-1 border-collapse">
                    <thead>
                      <tr className="text-text-secondary">
                        <th className="text-left pr-4 py-1 font-medium">Model</th>
                        <th className="text-right pr-4 py-1 font-medium">Low (Z1–Z2)</th>
                        <th className="text-right pr-4 py-1 font-medium">Moderate (Z3)</th>
                        <th className="text-right py-1 font-medium">High (Z4–Z5)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="pr-4 py-1.5 text-text-primary font-medium">Pyramidal</td>
                        <td className="pr-4 py-1.5 text-right">~70%</td>
                        <td className="pr-4 py-1.5 text-right">~20%</td>
                        <td className="py-1.5 text-right">~10%</td>
                      </tr>
                      <tr>
                        <td className="pr-4 py-1.5 text-text-primary font-medium">Polarized</td>
                        <td className="pr-4 py-1.5 text-right">~80%</td>
                        <td className="pr-4 py-1.5 text-right">~5%</td>
                        <td className="py-1.5 text-right">~15%</td>
                      </tr>
                      <tr>
                        <td className="pr-4 py-1.5 text-text-primary font-medium">Your current</td>
                        <td className="pr-4 py-1.5 text-right text-green-400 font-semibold">
                          {Math.round(CURRENT_LOW_PCT)}%
                        </td>
                        <td className="pr-4 py-1.5 text-right text-yellow-400 font-semibold">
                          {Math.round((ALL_TOTALS.z3 / GRAND_TOTAL) * 100)}%
                        </td>
                        <td className="py-1.5 text-right text-orange-400 font-semibold">
                          {Math.round(((ALL_TOTALS.z4 + ALL_TOTALS.z5) / GRAND_TOTAL) * 100)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="opacity-50 pt-2 border-t border-border">
                Sources: Seiler & Tønnessen (2009), Seiler (2010), San Millán & Brooks (2018), Stöggl &
                Sperlich (2014 meta-analysis).
              </p>
            </div>
          )}
        </div>

        {/* ── Zone definitions ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowDefs((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-secondary transition-colors"
          >
            <h2 className="text-sm font-semibold text-text-primary">Zone Definitions</h2>
            <span className="text-text-secondary text-lg leading-none">{showDefs ? '−' : '+'}</span>
          </button>

          {showDefs && (
            <div className="border-t border-border divide-y divide-border">
              {ZONES.map((z) => (
                <div key={z.id} className="px-4 py-3 flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                    style={{
                      backgroundColor: z.color + '22',
                      color: z.color,
                      border: `1px solid ${z.color}44`,
                    }}
                  >
                    {z.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: z.color }}>
                        {z.label} — {z.name}
                      </p>
                      <span className="text-xs font-mono text-text-secondary">{z.bpm}</span>
                    </div>
                    <p className="text-xs text-text-secondary font-medium mt-0.5">{z.hrRange} HRmax</p>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{z.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
