'use client'

import Link from 'next/link'
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'

// ─── Constants ────────────────────────────────────────────────────────────────

const CRITICAL_POWER = 285 // watts
const CP_80 = Math.round(CRITICAL_POWER * 0.8) // 228 W

// ─── Zone config ─────────────────────────────────────────────────────────────

interface Zone {
  id: number
  name: string
  label: string
  range: string
  min: number   // watts (absolute, derived from CP)
  max: number   // watts (Infinity = open-ended)
  color: string
  bg: string
  border: string
  text: string
  description: string
}

const ZONES: Zone[] = [
  {
    id: 1,
    name: 'Recovery',
    label: 'Z1',
    range: '< 80% CP',
    min: 0,
    max: Math.round(CRITICAL_POWER * 0.8) - 1,
    color: '#9ca3af',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    text: 'text-gray-400',
    description: 'Easy runs, active recovery',
  },
  {
    id: 2,
    name: 'Aerobic',
    label: 'Z2',
    range: '80–90% CP',
    min: Math.round(CRITICAL_POWER * 0.8),
    max: Math.round(CRITICAL_POWER * 0.9) - 1,
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    description: 'Aerobic base building',
  },
  {
    id: 3,
    name: 'Tempo',
    label: 'Z3',
    range: '90–100% CP',
    min: Math.round(CRITICAL_POWER * 0.9),
    max: CRITICAL_POWER - 1,
    color: '#22c55e',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    description: 'Lactate threshold',
  },
  {
    id: 4,
    name: 'Threshold',
    label: 'Z4',
    range: '100–110% CP',
    min: CRITICAL_POWER,
    max: Math.round(CRITICAL_POWER * 1.1) - 1,
    color: '#eab308',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    description: 'VO\u2082max development',
  },
  {
    id: 5,
    name: 'Speed',
    label: 'Z5',
    range: '> 110% CP',
    min: Math.round(CRITICAL_POWER * 1.1),
    max: Infinity,
    color: '#ef4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    description: 'Neuromuscular, race pace',
  },
]

function getZone(watts: number): Zone {
  return ZONES.find((z) => watts >= z.min && watts <= z.max) ?? ZONES[0]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

interface RunRecord {
  date: string        // ISO date
  durationMin: number
  avgWatts: number
  normWatts: number
  peakWatts: number
  zone: Zone
}

function buildMockRuns(): RunRecord[] {
  // 28 sessions spread over last 90 days, latest first
  const base = new Date()
  const sessions: Array<{
    daysAgo: number
    avgWatts: number
    durMin: number
    peakWatts: number
  }> = [
    { daysAgo: 1,  avgWatts: 271, durMin: 48, peakWatts: 312 },
    { daysAgo: 3,  avgWatts: 232, durMin: 65, peakWatts: 268 },
    { daysAgo: 5,  avgWatts: 289, durMin: 42, peakWatts: 341 },
    { daysAgo: 7,  avgWatts: 228, durMin: 72, peakWatts: 259 },
    { daysAgo: 9,  avgWatts: 263, durMin: 50, peakWatts: 298 },
    { daysAgo: 11, avgWatts: 305, durMin: 35, peakWatts: 348 },
    { daysAgo: 13, avgWatts: 238, durMin: 60, peakWatts: 271 },
    { daysAgo: 15, avgWatts: 276, durMin: 45, peakWatts: 317 },
    { daysAgo: 17, avgWatts: 225, durMin: 80, peakWatts: 256 },
    { daysAgo: 20, avgWatts: 294, durMin: 40, peakWatts: 336 },
    { daysAgo: 22, avgWatts: 233, durMin: 68, peakWatts: 265 },
    { daysAgo: 24, avgWatts: 258, durMin: 52, peakWatts: 291 },
    { daysAgo: 27, avgWatts: 310, durMin: 33, peakWatts: 350 },
    { daysAgo: 29, avgWatts: 229, durMin: 75, peakWatts: 262 },
    { daysAgo: 31, avgWatts: 267, durMin: 47, peakWatts: 305 },
    { daysAgo: 34, avgWatts: 222, durMin: 85, peakWatts: 254 },
    { daysAgo: 36, avgWatts: 283, durMin: 44, peakWatts: 323 },
    { daysAgo: 39, avgWatts: 248, durMin: 55, peakWatts: 279 },
    { daysAgo: 41, avgWatts: 298, durMin: 38, peakWatts: 340 },
    { daysAgo: 44, avgWatts: 231, durMin: 70, peakWatts: 263 },
    { daysAgo: 47, avgWatts: 260, durMin: 50, peakWatts: 292 },
    { daysAgo: 50, avgWatts: 220, durMin: 90, peakWatts: 250 },
    { daysAgo: 53, avgWatts: 278, durMin: 43, peakWatts: 314 },
    { daysAgo: 57, avgWatts: 244, durMin: 58, peakWatts: 277 },
    { daysAgo: 61, avgWatts: 255, durMin: 48, peakWatts: 285 },
    { daysAgo: 67, avgWatts: 238, durMin: 65, peakWatts: 268 },
    { daysAgo: 74, avgWatts: 248, durMin: 55, peakWatts: 279 },
    { daysAgo: 83, avgWatts: 235, durMin: 62, peakWatts: 265 },
  ]

  return sessions.map(({ daysAgo, avgWatts, durMin, peakWatts }) => {
    const d = new Date(base)
    d.setDate(d.getDate() - daysAgo)
    const date = d.toISOString().slice(0, 10)
    // NP is always slightly higher than avg (6-12% variation for variable efforts)
    const normWatts = Math.round(avgWatts * (1 + (Math.abs(Math.sin(daysAgo)) * 0.07 + 0.04)))
    return {
      date,
      durationMin: durMin,
      avgWatts,
      normWatts,
      peakWatts,
      zone: getZone(avgWatts),
    }
  })
}

const RUNS = buildMockRuns()
const TOTAL_SESSIONS = RUNS.length

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtDateFull(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
  padding: '8px 12px',
}

// ─── Computed stats ───────────────────────────────────────────────────────────

const allAvg = RUNS.map((r) => r.avgWatts)
const avgPower = Math.round(allAvg.reduce((a, b) => a + b, 0) / allAvg.length)
const peakPower = Math.max(...RUNS.map((r) => r.peakWatts))

// Trend: last-month avg vs first-month avg
const lastMonthRuns = RUNS.filter((r) => {
  const d = new Date(r.date + 'T00:00:00')
  const ref = new Date()
  return (ref.getTime() - d.getTime()) / 86400000 <= 30
})
const firstMonthRuns = RUNS.filter((r) => {
  const d = new Date(r.date + 'T00:00:00')
  const ref = new Date()
  const daysAgo = (ref.getTime() - d.getTime()) / 86400000
  return daysAgo >= 60 && daysAgo <= 90
})
const lastMonthAvg = lastMonthRuns.length
  ? Math.round(lastMonthRuns.reduce((s, r) => s + r.avgWatts, 0) / lastMonthRuns.length)
  : avgPower
const firstMonthAvg = firstMonthRuns.length
  ? Math.round(firstMonthRuns.reduce((s, r) => s + r.avgWatts, 0) / firstMonthRuns.length)
  : avgPower
const trendDelta = lastMonthAvg - firstMonthAvg
const trendPct = firstMonthAvg > 0 ? Math.round((trendDelta / firstMonthAvg) * 100) : 0

// Zone distribution
const zoneDist = ZONES.map((z) => {
  const count = RUNS.filter((r) => r.zone.id === z.id).length
  const pct = Math.round((count / TOTAL_SESSIONS) * 100)
  return { zone: z, count, pct }
})

// CP zone badge
const cpZone = getZone(CRITICAL_POWER)

// Scatter data (numeric x = days-ago from today, but we use ms epoch for proper axis)
const scatterData = [...RUNS].reverse().map((r) => ({
  x: new Date(r.date + 'T00:00:00').getTime(),
  y: r.avgWatts,
  zone: r.zone,
  date: r.date,
  normWatts: r.normWatts,
  peakWatts: r.peakWatts,
  durationMin: r.durationMin,
}))

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface ScatterPayload {
  x?: number
  y?: number
  date?: string
  zone?: Zone
  normWatts?: number
  peakWatts?: number
  durationMin?: number
}

function PowerTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ScatterPayload }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const z = d.zone
  return (
    <div
      style={{
        background: '#111',
        border: `1px solid ${z?.color ?? '#555'}`,
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        minWidth: 160,
      }}
    >
      {d.date && (
        <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 6 }}>
          {fmtDateFull(d.date)}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{ color: '#94a3b8' }}>
          Avg power:{' '}
          <span style={{ color: z?.color ?? '#f97316', fontWeight: 700 }}>{d.y}W</span>
        </p>
        <p style={{ color: '#94a3b8' }}>
          Norm power: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{d.normWatts}W</span>
        </p>
        <p style={{ color: '#94a3b8' }}>
          Peak: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{d.peakWatts}W</span>
        </p>
        <p style={{ color: '#94a3b8' }}>
          Duration: <span style={{ color: '#e2e8f0' }}>{fmtDuration(d.durationMin ?? 0)}</span>
        </p>
        {z && (
          <p
            style={{
              color: z.color,
              fontWeight: 600,
              marginTop: 4,
              paddingTop: 4,
              borderTop: '1px solid #2a2a2a',
            }}
          >
            {z.label} {z.name}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZoneBadge({ zone }: { zone: Zone }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
      style={{ backgroundColor: zone.color + '22', color: zone.color, border: `1px solid ${zone.color}44` }}
    >
      {zone.label}
    </span>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function RunningPowerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Running Power</h1>
            <p className="text-sm text-text-secondary">Apple Watch Ultra · Stryd · {TOTAL_SESSIONS} sessions</p>
          </div>
          <Zap className="w-5 h-5 text-amber-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero stat ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1c0f00 0%, #0f172a 60%, #0a0a0a 100%)',
            borderColor: '#f97316' + '33',
          }}
        >
          {/* Electric glow effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 30% 50%, #f9731611 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <p className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest mb-1">
              Critical Power (CP)
            </p>
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <span className="text-7xl font-black tabular-nums" style={{ color: '#fb923c' }}>
                  {CRITICAL_POWER}
                </span>
                <span className="text-2xl font-bold text-amber-400/60 ml-1">W</span>
              </div>
              <div className="flex flex-col gap-2 mb-1">
                <ZoneBadge zone={cpZone} />
                <span className="text-xs text-text-secondary">{TOTAL_SESSIONS} sessions · 90 days</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-text-secondary">80% CP</span>
                <span className="ml-1.5 font-bold text-blue-400">{CP_80}W</span>
                <span className="ml-1 text-text-secondary text-xs">aerobic floor</span>
              </div>
              <div>
                <span className="text-text-secondary">110% CP</span>
                <span className="ml-1.5 font-bold text-red-400">{Math.round(CRITICAL_POWER * 1.1)}W</span>
                <span className="ml-1 text-text-secondary text-xs">speed zone entry</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-amber-400 tabular-nums">{avgPower}W</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Power</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-400 tabular-nums">{peakPower}W</p>
            <p className="text-xs text-text-secondary mt-0.5">Peak Power</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <p
                className="text-2xl font-bold tabular-nums"
                style={{ color: trendDelta > 0 ? '#22c55e' : trendDelta < 0 ? '#ef4444' : '#9ca3af' }}
              >
                {trendDelta > 0 ? '+' : ''}{trendDelta}W
              </p>
              {trendDelta > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400 mb-1" />
              ) : trendDelta < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400 mb-1" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400 mb-1" />
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Power Trend{' '}
              <span style={{ color: trendDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                ({trendPct > 0 ? '+' : ''}{trendPct}%)
              </span>
            </p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-amber-300 tabular-nums">{TOTAL_SESSIONS}</p>
            <p className="text-xs text-text-secondary mt-0.5">Runs</p>
          </div>
        </div>

        {/* ── Power zones reference card ─────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Power Zones</h2>
          <p className="text-xs text-text-secondary mb-4">Based on Critical Power (CP = {CRITICAL_POWER}W)</p>
          <div className="space-y-2">
            {ZONES.map((z) => (
              <div
                key={z.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${z.bg} ${z.border}`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: z.color }}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-bold text-xs shrink-0" style={{ color: z.color }}>
                    {z.label}
                  </span>
                  <span className={`text-sm font-semibold ${z.text} shrink-0`}>{z.name}</span>
                  <span className="text-xs text-text-secondary hidden sm:inline shrink-0">{z.range}</span>
                  <span className="text-xs text-text-secondary truncate">{z.description}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-mono tabular-nums text-text-secondary">
                    {z.max === Infinity
                      ? `≥${z.min}W`
                      : z.min === 0
                      ? `< ${z.max + 1}W`
                      : `${z.min}–${z.max}W`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Power trend scatter chart ──────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">Power Trend</h2>
          <p className="text-xs text-text-secondary mb-4">
            Each dot = one run · coloured by zone · 90 days
          </p>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {ZONES.map((z) => (
              <div key={z.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                <span className="text-xs text-text-secondary">{z.label} {z.name}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                tickCount={6}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={[200, 370]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}W`}
                width={40}
              />
              {/* CP reference line */}
              <ReferenceLine
                y={CRITICAL_POWER}
                stroke="#f97316"
                strokeDasharray="6 3"
                strokeOpacity={0.7}
                label={{
                  value: `CP ${CRITICAL_POWER}W`,
                  position: 'right',
                  fontSize: 9,
                  fill: '#f97316',
                  dy: -4,
                }}
              />
              {/* 80% CP reference line */}
              <ReferenceLine
                y={CP_80}
                stroke="#3b82f6"
                strokeDasharray="6 3"
                strokeOpacity={0.6}
                label={{
                  value: `80% CP ${CP_80}W`,
                  position: 'right',
                  fontSize: 9,
                  fill: '#3b82f6',
                  dy: -4,
                }}
              />
              <Tooltip
                content={<PowerTooltip />}
                cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
              />
              <Scatter
                data={scatterData}
                shape={(props: {
                  cx?: number
                  cy?: number
                  payload?: { zone?: Zone }
                }) => {
                  const { cx = 0, cy = 0, payload } = props
                  const z = payload?.zone ?? ZONES[0]
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={z.color}
                      fillOpacity={0.85}
                      stroke={z.color}
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                    />
                  )
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── Zone distribution bars ─────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Zone Distribution</h2>
          <p className="text-xs text-text-secondary mb-4">Runs by avg power zone</p>
          <div className="space-y-3">
            {zoneDist.map(({ zone: z, count, pct }) => (
              <div key={z.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                    <span className="text-sm font-medium" style={{ color: z.color }}>
                      {z.label} {z.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary tabular-nums">{count} runs</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: z.color }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: z.color, opacity: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent runs table ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Recent Runs</h2>
            <p className="text-xs text-text-secondary">Last 8 sessions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary whitespace-nowrap">
                    Duration
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary whitespace-nowrap">
                    Avg W
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary whitespace-nowrap">
                    NP
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary whitespace-nowrap">
                    Peak W
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary whitespace-nowrap">
                    Zone
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RUNS.slice(0, 8).map((r, i) => (
                  <tr key={i} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {fmtDateFull(r.date)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                      {fmtDuration(r.durationMin)}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right text-xs font-bold tabular-nums"
                      style={{ color: r.zone.color }}
                    >
                      {r.avgWatts}W
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {r.normWatts}W
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {r.peakWatts}W
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ZoneBadge zone={r.zone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Science card ───────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            The Science of Running Power
          </h2>
          <div className="space-y-3">

            {/* Finding 1 */}
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2.5">
                <div
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-amber-900"
                  style={{ backgroundColor: '#f59e0b' }}
                >
                  1
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-300 mb-0.5">
                    More precise than HR
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Power responds <strong className="text-text-primary">instantly</strong> to changes in effort, while heart rate lags 30–60 seconds behind.
                    Snyder &amp; Parmenter (2009) demonstrated that power-based pacing delivers tighter effort control than heart rate in field conditions.
                  </p>
                </div>
              </div>
            </div>

            {/* Finding 2 */}
            <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3">
              <div className="flex items-start gap-2.5">
                <div
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-orange-900"
                  style={{ backgroundColor: '#f97316' }}
                >
                  2
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-300 mb-0.5">
                    Power pacing reduces variability
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Binder (2020) found that runners using power targets showed{' '}
                    <strong className="text-text-primary">12% lower pace variability</strong> compared to heart rate pacing, especially on undulating courses where HR lags on uphills and over-responds on downhills.
                  </p>
                </div>
              </div>
            </div>

            {/* Finding 3 */}
            <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-3">
              <div className="flex items-start gap-2.5">
                <div
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-yellow-900"
                  style={{ backgroundColor: '#eab308' }}
                >
                  3
                </div>
                <div>
                  <p className="text-xs font-semibold text-yellow-300 mb-0.5">
                    Critical Power (CP)
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    CP is the highest power you can sustain for approximately{' '}
                    <strong className="text-text-primary">~40 minutes</strong>. It demarcates the boundary between heavy and severe exercise intensity domains.
                    Improving CP produces a directly proportional improvement in race pace at all distances from 5K to marathon.
                  </p>
                </div>
              </div>
            </div>

            {/* Finding 4 */}
            <div className="rounded-xl border border-green-500/15 bg-green-500/5 p-3">
              <div className="flex items-start gap-2.5">
                <div
                  className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-green-900"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  4
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-300 mb-0.5">
                    Normalized Power (NP)
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    NP is a weighted average that reflects the true metabolic cost of a variable-effort run.
                    Because physiological stress scales non-linearly with power, NP is always{' '}
                    <strong className="text-text-primary">higher than average power</strong> — the greater the variability, the larger the gap. Use the ratio NP/avg power (Variability Index) to gauge effort distribution quality.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <p className="mt-4 pt-4 border-t border-border text-xs text-text-secondary leading-relaxed">
            Critical Power displayed is estimated from recent workout distribution. For a precise CP test, perform a 3-minute all-out effort followed by a 20-minute TT on flat ground. Consult a sports scientist for clinical assessment.
          </p>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
