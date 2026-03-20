'use client'

import Link from 'next/link'
import { ArrowLeft, Footprints, TrendingUp, FlaskConical, Target } from 'lucide-react'
import {
  ComposedChart,
  Scatter,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Cell,
  ScatterChart,
  ZAxis,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────────

type CadenceZone = 'slow' | 'building' | 'optimal' | 'elite'

interface RunPoint {
  date: string        // YYYY-MM-DD
  dateLabel: string   // "Jan 6"
  dayIndex: number    // 0–89 (day in 90-day window)
  cadence: number     // spm
  paceMin: number     // pace in decimal minutes per km (e.g. 5.25 = 5:15/km)
  zone: CadenceZone
}

interface PaceScatterPoint {
  pace: number        // decimal min/km
  cadence: number
  zone: CadenceZone
}

// ─── Zone helpers ──────────────────────────────────────────────────────────────

function classifyZone(spm: number): CadenceZone {
  if (spm < 155) return 'slow'
  if (spm < 165) return 'building'
  if (spm <= 175) return 'optimal'
  return 'elite'
}

const ZONE_CONFIG: Record<CadenceZone, { label: string; color: string; textColor: string; emoji: string }> = {
  slow:     { label: 'Slow',     color: '#ef4444', textColor: 'text-red-400',    emoji: '🐢' },
  building: { label: 'Building', color: '#f97316', textColor: 'text-orange-400', emoji: '🚶' },
  optimal:  { label: 'Optimal',  color: '#22c55e', textColor: 'text-green-400',  emoji: '🏃' },
  elite:    { label: 'Elite',    color: '#3b82f6', textColor: 'text-blue-400',   emoji: '⚡' },
}

function zoneDotColor(zone: CadenceZone): string {
  return ZONE_CONFIG[zone].color
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
// 34 runs over 90 days (Dec 20 2025 – Mar 20 2026). Slight upward trend,
// average ~168 spm, 67% in optimal zone (165–175).

const RAW_RUNS: Array<{ date: string; cadence: number; paceMin: number }> = [
  { date: '2025-12-20', cadence: 161, paceMin: 5.75 },
  { date: '2025-12-22', cadence: 158, paceMin: 6.25 },
  { date: '2025-12-24', cadence: 163, paceMin: 6.00 },
  { date: '2025-12-27', cadence: 160, paceMin: 5.90 },
  { date: '2025-12-29', cadence: 165, paceMin: 5.50 },
  { date: '2025-12-31', cadence: 162, paceMin: 6.10 },
  { date: '2026-01-02', cadence: 164, paceMin: 5.80 },
  { date: '2026-01-05', cadence: 166, paceMin: 5.30 },
  { date: '2026-01-07', cadence: 168, paceMin: 5.20 },
  { date: '2026-01-09', cadence: 165, paceMin: 5.60 },
  { date: '2026-01-12', cadence: 170, paceMin: 4.85 },
  { date: '2026-01-14', cadence: 167, paceMin: 5.45 },
  { date: '2026-01-17', cadence: 172, paceMin: 4.75 },
  { date: '2026-01-19', cadence: 168, paceMin: 5.25 },
  { date: '2026-01-22', cadence: 166, paceMin: 5.55 },
  { date: '2026-01-25', cadence: 171, paceMin: 4.90 },
  { date: '2026-01-27', cadence: 169, paceMin: 5.10 },
  { date: '2026-01-30', cadence: 174, paceMin: 4.60 },
  { date: '2026-02-02', cadence: 170, paceMin: 5.00 },
  { date: '2026-02-05', cadence: 168, paceMin: 5.30 },
  { date: '2026-02-08', cadence: 173, paceMin: 4.70 },
  { date: '2026-02-10', cadence: 175, paceMin: 4.55 },
  { date: '2026-02-13', cadence: 170, paceMin: 5.05 },
  { date: '2026-02-16', cadence: 168, paceMin: 5.40 },
  { date: '2026-02-19', cadence: 176, paceMin: 4.40 },
  { date: '2026-02-22', cadence: 172, paceMin: 4.80 },
  { date: '2026-02-25', cadence: 169, paceMin: 5.15 },
  { date: '2026-02-28', cadence: 174, paceMin: 4.65 },
  { date: '2026-03-03', cadence: 170, paceMin: 5.00 },
  { date: '2026-03-06', cadence: 177, paceMin: 4.33 },
  { date: '2026-03-10', cadence: 173, paceMin: 4.72 },
  { date: '2026-03-13', cadence: 171, paceMin: 4.95 },
  { date: '2026-03-17', cadence: 175, paceMin: 4.50 },
  { date: '2026-03-20', cadence: 172, paceMin: 4.83 },
]

const START_DATE = new Date('2025-12-20')

function dayIndex(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - START_DATE.getTime()) / 86400000)
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const RUNS: RunPoint[] = RAW_RUNS.map((r) => ({
  date: r.date,
  dateLabel: fmtDateShort(r.date),
  dayIndex: dayIndex(r.date),
  cadence: r.cadence,
  paceMin: r.paceMin,
  zone: classifyZone(r.cadence),
}))

// ─── Derived stats ─────────────────────────────────────────────────────────────

const avgCadence = Math.round(RUNS.reduce((s, r) => s + r.cadence, 0) / RUNS.length)
const optimalCount = RUNS.filter((r) => r.zone === 'optimal').length
const optimalPct = Math.round((optimalCount / RUNS.length) * 100)
const deltaVsTarget = avgCadence - 170
const deltaSign = deltaVsTarget >= 0 ? '+' : ''

// Trend: compare first 11 runs (first ~30 days) vs last 11 runs
const firstElevenAvg = Math.round(RUNS.slice(0, 11).reduce((s, r) => s + r.cadence, 0) / 11)
const lastElevenAvg = Math.round(RUNS.slice(-11).reduce((s, r) => s + r.cadence, 0) / 11)
const trendDelta = +(lastElevenAvg - firstElevenAvg).toFixed(1)
const trendSign = trendDelta >= 0 ? '+' : ''

// Zone of current average
const currentZone = classifyZone(avgCadence)
const zoneConf = ZONE_CONFIG[currentZone]

// Trend chart: scatter points + line data (use linear trend line overlay)
// For the line, compute simple linear regression over dayIndex → cadence
const n = RUNS.length
const sumX = RUNS.reduce((s, r) => s + r.dayIndex, 0)
const sumY = RUNS.reduce((s, r) => s + r.cadence, 0)
const sumXY = RUNS.reduce((s, r) => s + r.dayIndex * r.cadence, 0)
const sumX2 = RUNS.reduce((s, r) => s + r.dayIndex * r.dayIndex, 0)
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
const intercept = (sumY - slope * sumX) / n

const TREND_LINE = [
  { dayIndex: 0,  cadence: Math.round(intercept) },
  { dayIndex: 90, cadence: Math.round(intercept + slope * 90) },
]

// Distribution buckets
const DIST_BUCKETS = [
  { label: '<150',     min: 0,   max: 150, zone: 'slow'     as CadenceZone },
  { label: '150–160',  min: 150, max: 160, zone: 'slow'     as CadenceZone },
  { label: '160–165',  min: 160, max: 165, zone: 'building' as CadenceZone },
  { label: '165–170',  min: 165, max: 170, zone: 'optimal'  as CadenceZone },
  { label: '170–175',  min: 170, max: 175, zone: 'optimal'  as CadenceZone },
  { label: '175–180',  min: 175, max: 180, zone: 'elite'    as CadenceZone },
  { label: '>180',     min: 180, max: 999, zone: 'elite'    as CadenceZone },
]

const DIST_DATA = DIST_BUCKETS.map((b) => ({
  ...b,
  count: RUNS.filter((r) => r.cadence >= b.min && r.cadence < b.max).length,
}))

// Cadence vs pace scatter
const PACE_SCATTER: PaceScatterPoint[] = RUNS.map((r) => ({
  pace: r.paceMin,
  cadence: r.cadence,
  zone: r.zone,
}))

// ─── Pace formatter ───────────────────────────────────────────────────────────

function fmtPaceDecimal(decMin: number): string {
  const m = Math.floor(decMin)
  const s = Math.round((decMin - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

interface TrendTooltipPayload {
  name?: string
  value?: number
  payload?: { date: string; cadence: number; zone: CadenceZone }
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: TrendTooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d?.date) return null
  const zc = ZONE_CONFIG[d.zone]
  return (
    <div
      style={{
        background: 'rgba(12,12,18,0.97)',
        border: `1px solid ${zc.color}44`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <p style={{ color: zc.color, fontWeight: 700, marginBottom: 4 }}>
        {zc.emoji} {fmtDateShort(d.date)}
      </p>
      <p style={{ color: '#ccc' }}>{d.cadence} spm</p>
      <p style={{ color: zc.color }}>{zc.label} zone</p>
    </div>
  )
}

interface DistTooltipPayload {
  payload?: { label: string; count: number; zone: CadenceZone }
}

function DistTooltip({ active, payload }: { active?: boolean; payload?: DistTooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const zc = ZONE_CONFIG[d.zone]
  return (
    <div
      style={{
        background: 'rgba(12,12,18,0.97)',
        border: `1px solid ${zc.color}44`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <p style={{ color: zc.color, fontWeight: 700 }}>{d.label} spm</p>
      <p style={{ color: '#ccc' }}>{d.count} run{d.count !== 1 ? 's' : ''}</p>
      <p style={{ color: zc.color }}>{zc.label}</p>
    </div>
  )
}

interface PaceTooltipPayload {
  payload?: PaceScatterPoint
}

function PaceTooltip({ active, payload }: { active?: boolean; payload?: PaceTooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const zc = ZONE_CONFIG[d.zone]
  return (
    <div
      style={{
        background: 'rgba(12,12,18,0.97)',
        border: `1px solid ${zc.color}44`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <p style={{ color: zc.color, fontWeight: 700 }}>{zc.emoji} {zc.label}</p>
      <p style={{ color: '#ccc' }}>Cadence: {d.cadence} spm</p>
      <p style={{ color: '#ccc' }}>Pace: {fmtPaceDecimal(d.pace)} /km</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunningCadencePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Footprints className="w-5 h-5 text-green-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-primary truncate">Cadence Optimizer</h1>
              <p className="text-sm text-text-secondary truncate">
                Step rate analysis · target 165–175 spm
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #052e16 0%, #166534 40%, #15803d 70%, #22c55e 100%)',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,0.3) 24px,rgba(255,255,255,0.3) 25px),' +
              'repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,0.3) 24px,rgba(255,255,255,0.3) 25px)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2 opacity-80"
            style={{ color: '#bbf7d0', fontFamily: 'ui-monospace, monospace' }}
          >
            Running Biomechanics · Steps Per Minute
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
          >
            Running Cadence
          </h2>
          <p className="text-white/80 text-sm max-w-md leading-relaxed">
            Cadence is the single most trainable running gait variable. Higher step rates
            reduce overstriding, lower impact loading, and cut injury risk — without sacrificing speed.
          </p>
          {/* Decorative metronome lines */}
          <div className="absolute right-4 top-0 bottom-0 flex items-center gap-1.5 opacity-20 hidden sm:flex">
            {[32, 44, 56, 48, 64, 52, 68, 56, 48, 40].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{ height: h, background: 'rgba(255,255,255,0.9)' }}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Zone Badge ── */}
        <div
          className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{
            background: `${zoneConf.color}12`,
            borderColor: `${zoneConf.color}40`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `${zoneConf.color}22` }}
            >
              {zoneConf.emoji}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1">
                Current Average
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-4xl font-black leading-none"
                  style={{ color: zoneConf.color, fontFamily: 'ui-monospace, monospace' }}
                >
                  {avgCadence}
                </span>
                <span className="text-lg font-semibold text-text-secondary">spm</span>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${zoneConf.color}22`, color: zoneConf.color }}
                >
                  {zoneConf.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:items-end">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-text-secondary" />
              <span className="text-xs text-text-secondary">vs 170 spm target</span>
            </div>
            <span
              className="text-2xl font-black"
              style={{
                fontFamily: 'ui-monospace, monospace',
                color: deltaVsTarget >= 0 ? '#22c55e' : '#f97316',
              }}
            >
              {deltaSign}{deltaVsTarget} spm
            </span>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">

          {/* Avg Cadence */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
            <Footprints className="w-5 h-5 text-green-400" />
            <div>
              <p
                className="text-3xl font-black text-green-400 leading-none"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {avgCadence}
              </p>
              <p className="text-xs font-medium text-text-primary mt-1">Avg Cadence</p>
              <p className="text-xs text-text-secondary opacity-70 mt-0.5">steps per min</p>
            </div>
          </div>

          {/* % In Optimal */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <p
                className="text-3xl font-black text-emerald-400 leading-none"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {optimalPct}%
              </p>
              <p className="text-xs font-medium text-text-primary mt-1">In Optimal Zone</p>
              <p className="text-xs text-text-secondary opacity-70 mt-0.5">165–175 spm</p>
            </div>
          </div>

          {/* Runs Analysed */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-400" />
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <div>
              <p
                className="text-3xl font-black text-teal-400 leading-none"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {RUNS.length}
              </p>
              <p className="text-xs font-medium text-text-primary mt-1">Runs Analysed</p>
              <p className="text-xs text-text-secondary opacity-70 mt-0.5">last 90 days</p>
            </div>
          </div>
        </div>

        {/* ── Trend Direction Banner ── */}
        <div
          className="rounded-2xl border border-border p-4 flex items-start sm:items-center gap-3"
          style={{ background: trendDelta > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(249,115,22,0.06)' }}
        >
          <TrendingUp
            className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0"
            style={{ color: trendDelta > 0 ? '#22c55e' : '#f97316' }}
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">
              <span style={{ color: trendDelta > 0 ? '#22c55e' : '#f97316', fontFamily: 'ui-monospace, monospace' }}>
                {trendSign}{trendDelta} spm
              </span>{' '}
              vs 3 months ago
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {trendDelta > 0
                ? 'Moving toward optimal — your cadence is improving consistently.'
                : 'Cadence has dipped slightly — focus on quick, light footfalls.'}
              {' '}First-month avg {firstElevenAvg} spm → recent avg {lastElevenAvg} spm.
            </p>
          </div>
        </div>

        {/* ── Cadence Trend Chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Cadence Trend — 90 Days</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Each dot is one run, coloured by zone. Green band = optimal 165–175 spm. Dashed line = 170 spm target.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {(Object.entries(ZONE_CONFIG) as [CadenceZone, typeof ZONE_CONFIG[CadenceZone]][]).map(([z, conf]) => (
              <div key={z} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: conf.color }} />
                {conf.emoji} {conf.label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                type="number"
                dataKey="dayIndex"
                domain={[0, 90]}
                tickFormatter={(v: number) => {
                  const d = new Date(START_DATE)
                  d.setDate(d.getDate() + v)
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 15, 30, 45, 60, 75, 90]}
              />
              <YAxis
                domain={[148, 185]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                tickFormatter={(v: number) => `${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />

              {/* Optimal zone reference band */}
              <ReferenceArea y1={165} y2={175} fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.2)" strokeWidth={1} />

              {/* Target dashed line */}
              <ReferenceLine y={170} stroke="#22c55e" strokeDasharray="5 4" strokeWidth={1.5} strokeOpacity={0.6} />

              {/* Trend line */}
              <Line
                data={TREND_LINE}
                type="linear"
                dataKey="cadence"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1.5}
                dot={false}
                legendType="none"
                isAnimationActive={false}
              />

              {/* Scatter points — one per zone layer for colour control */}
              {(['slow', 'building', 'optimal', 'elite'] as CadenceZone[]).map((z) => (
                <Scatter
                  key={z}
                  data={RUNS.filter((r) => r.zone === z)}
                  fill={ZONE_CONFIG[z].color}
                  opacity={0.85}
                  isAnimationActive={false}
                >
                  {RUNS.filter((r) => r.zone === z).map((r, i) => (
                    <Cell key={i} fill={ZONE_CONFIG[z].color} />
                  ))}
                </Scatter>
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── Distribution Chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Cadence Distribution</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              How many runs fall into each cadence bucket across the last 90 days.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={DIST_DATA}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<DistTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />

              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                {DIST_DATA.map((b, i) => (
                  <Cell key={i} fill={zoneDotColor(b.zone)} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Bucket zone legend */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(ZONE_CONFIG) as [CadenceZone, typeof ZONE_CONFIG[CadenceZone]][]).map(([z, conf]) => {
              const bucketCount = DIST_DATA.filter((b) => b.zone === z).reduce((s, b) => s + b.count, 0)
              return (
                <div
                  key={z}
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: `${conf.color}12`, borderLeft: `3px solid ${conf.color}` }}
                >
                  <p className="font-semibold" style={{ color: conf.color }}>
                    {conf.emoji} {conf.label}
                  </p>
                  <p className="text-text-secondary mt-0.5">{bucketCount} run{bucketCount !== 1 ? 's' : ''}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Cadence vs Pace Scatter ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Cadence vs Pace</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Each dot = one run. X axis = pace (min/km), Y axis = cadence (spm).
              Faster paces generally produce higher cadence.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="pace"
                name="pace"
                domain={[4.0, 7.75]}
                reversed
                tickFormatter={(v: number) => fmtPaceDecimal(v)}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Pace (min/km)',
                  position: 'insideBottom',
                  offset: -2,
                  fontSize: 10,
                  fill: 'var(--color-text-secondary,#888)',
                }}
                height={40}
              />
              <YAxis
                type="number"
                dataKey="cadence"
                name="cadence"
                domain={[150, 185]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Cadence (spm)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 14,
                  fontSize: 10,
                  fill: 'var(--color-text-secondary,#888)',
                }}
              />
              <ZAxis range={[36, 36]} />
              <Tooltip content={<PaceTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />

              {/* Optimal band */}
              <ReferenceArea y1={165} y2={175} fill="rgba(34,197,94,0.07)" stroke="rgba(34,197,94,0.18)" strokeWidth={1} />
              <ReferenceLine y={170} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} strokeOpacity={0.5} />

              {/* One Scatter per zone for colour */}
              {(['slow', 'building', 'optimal', 'elite'] as CadenceZone[]).map((z) => (
                <Scatter
                  key={z}
                  data={PACE_SCATTER.filter((p) => p.zone === z)}
                  fill={ZONE_CONFIG[z].color}
                  fillOpacity={0.8}
                  isAnimationActive={false}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── Zone Reference Card ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Footprints className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-text-primary">Cadence Zones</h2>
          </div>
          <div className="divide-y divide-border">
            {(Object.entries(ZONE_CONFIG) as [CadenceZone, typeof ZONE_CONFIG[CadenceZone]][]).map(([z, conf]) => {
              const rangeLabel =
                z === 'slow' ? '< 155 spm' :
                z === 'building' ? '155–165 spm' :
                z === 'optimal' ? '165–175 spm' :
                '> 175 spm'
              const desc =
                z === 'slow' ? 'Overstriding likely. Long ground contact, high impact loading per step.' :
                z === 'building' ? 'Making progress. Shorten stride slightly, aim for quicker turnover.' :
                z === 'optimal' ? 'Target zone. Minimises impact forces and knee/hip loading.' :
                'Elite territory. Short contact time, exceptional neuromuscular efficiency.'
              const isTarget = z === 'optimal'
              return (
                <div
                  key={z}
                  className="px-5 py-4 flex items-start gap-4"
                  style={isTarget ? { background: 'rgba(34,197,94,0.04)' } : undefined}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${conf.color}18` }}
                  >
                    {conf.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: conf.color }}>
                        {conf.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${conf.color}18`, color: conf.color, fontFamily: 'ui-monospace,monospace' }}
                      >
                        {rangeLabel}
                      </span>
                      {isTarget && (
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">TARGET</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science Callout ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2 border-b"
            style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.08)' }}
          >
            <FlaskConical className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-green-400">The Science</h2>
          </div>

          <div className="px-5 py-5 space-y-4 text-xs text-text-secondary leading-relaxed">

            <div>
              <p className="font-semibold text-text-primary mb-1">
                Heiderscheit et al. 2011 — Med Sci Sports Exerc
              </p>
              <p>
                Increasing preferred cadence by 5–10% significantly reduces energy absorption
                at the knee (−20%) and hip (−34%) joints during each stance phase. The
                reduction in stride length shortens the moment arm for ground reaction forces,
                directly lowering patellofemoral and iliotibial band stress — the two most
                common running overuse injuries.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary mb-1">
                Schubert et al. 2014
              </p>
              <p>
                Analysed impact mechanics across a range of cadences and found 170 spm
                minimises vertical loading rate and peak impact force. Cadence below 160 spm
                was associated with measurably higher tibial shock, regardless of shoe
                cushioning or running surface.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary mb-1">
                Nelson et al. 2019
              </p>
              <p>
                Prospective cohort study of recreational runners: those maintaining ≥ 164 spm
                had significantly lower injury rates across 6 months of training. Effect
                remained significant after controlling for weekly mileage, experience level,
                and footwear. Cadence emerged as a stronger predictor of injury risk than
                foot-strike pattern alone.
              </p>
            </div>

            <div
              className="rounded-lg p-3 mt-2"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <p className="font-semibold text-green-400 mb-1">Practical advice</p>
              <p>
                Increase cadence gradually — no more than +5% every 2–3 weeks to allow
                neuromuscular adaptation. Running to a metronome app or a cadence-specific
                playlist (BPM = target spm) is the most effective method. Treadmill running
                makes cadence drills easier to control.
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}
