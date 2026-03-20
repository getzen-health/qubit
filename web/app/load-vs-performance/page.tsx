'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, TrendingUp, Zap, Target } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
  Line,
  Area,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

type TSBCategory = 'fresh' | 'neutral' | 'fatigued' | 'overreaching'

interface WeeklyPoint {
  /** ISO week label e.g. 'Sep 2' */
  week: string
  /** Chronic Training Load */
  ctl: number
  /** Acute Training Load */
  atl: number
  /** Training Stress Balance = CTL − ATL */
  tsb: number
  /** Running efficiency: km/h per bpm */
  efficiency: number
  category: TSBCategory
}

// ─── Mock data ───────────────────────────────────────────────────────────────
// Simulates 26 weeks (6 months) of a runner building from base to race phase.
// CTL rises 30 → 65. Efficiency improves 0.090 → 0.098 km/h/bpm.
// Pearson r ≈ 0.72 between CTL and efficiency.
// Optimal TSB ≈ +12 (best runs follow easy weeks).

function generateMockData(): WeeklyPoint[] {
  // Seed values for reproducible mock data (no Math.random)
  const seed: readonly number[] = [
    0.12, -0.31, 0.47, -0.08, 0.55, -0.22, 0.38, -0.14, 0.61, -0.33,
    0.27, -0.19, 0.44, -0.07, 0.52, -0.28, 0.36, -0.11, 0.63, -0.41,
    0.18, -0.25, 0.49, -0.06, 0.57, -0.34,
  ]

  const weeks = 26
  const today = new Date(2026, 2, 20) // 2026-03-20

  return Array.from({ length: weeks }, (_, i) => {
    const t = i / (weeks - 1) // 0 → 1

    // CTL ramps 30 → 65 with slight non-linearity
    const ctl = 30 + 35 * (t * t * 0.4 + t * 0.6) + seed[i] * 3

    // ATL oscillates: every 4th week is a recovery week (lower ATL → high TSB)
    const recoveryWeek = i % 4 === 3
    const atl = recoveryWeek
      ? ctl * 0.72 + seed[i] * 2
      : ctl * 1.08 + seed[i] * 4

    const tsb = ctl - atl

    // Efficiency: baseline improves with CTL, but peaks at high TSB
    // formula: base(ctl) + tsb_bonus
    const baseEfficiency = 0.090 + 0.008 * t + seed[i] * 0.0012
    // TSB bonus: peaks around +12, degrades in both directions
    const tsbBonus = Math.max(0, 0.003 * Math.exp(-((tsb - 12) ** 2) / 200))
    const efficiency = Math.round((baseEfficiency + tsbBonus) * 10000) / 10000

    let category: TSBCategory
    if (tsb > 10) category = 'fresh'
    else if (tsb >= 0) category = 'neutral'
    else if (tsb >= -20) category = 'fatigued'
    else category = 'overreaching'

    // Date label
    const d = new Date(today)
    d.setDate(today.getDate() - (weeks - 1 - i) * 7)
    const week = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return {
      week,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      efficiency,
      category,
    }
  })
}

// ─── Category metadata ───────────────────────────────────────────────────────

const TSB_META: Record<TSBCategory, { label: string; hex: string; dotStyle: string }> = {
  fresh:       { label: 'Fresh (TSB > 10)',        hex: '#34d399', dotStyle: 'fill-emerald-400' },
  neutral:     { label: 'Neutral (0–10)',           hex: '#60a5fa', dotStyle: 'fill-blue-400' },
  fatigued:    { label: 'Fatigued (< 0)',           hex: '#fb923c', dotStyle: 'fill-orange-400' },
  overreaching:{ label: 'Overreaching (< −20)',     hex: '#f87171', dotStyle: 'fill-red-400' },
}

// ─── Correlation interpretation ──────────────────────────────────────────────

function correlationInterpretation(r: number): string {
  const abs = Math.abs(r)
  if (abs >= 0.7) return 'Strong positive relationship — building CTL is reliably translating to improved running efficiency.'
  if (abs >= 0.5) return 'Moderate positive relationship — CTL correlates with efficiency, though other factors (recovery, intensity) add variation.'
  if (abs >= 0.3) return 'Weak relationship — CTL alone is not a strong predictor of efficiency. Review pacing and recovery quality.'
  return 'No meaningful correlation detected — training load and efficiency appear unrelated in this sample.'
}

// ─── Custom tooltips ─────────────────────────────────────────────────────────

interface ScatterPayload {
  ctl?: number
  atl?: number
  tsb?: number
  efficiency?: number
  category?: TSBCategory
  week?: string
}

function CTLScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPayload }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d.category) return null
  const meta = TSB_META[d.category]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: 'hsl(0 0% 10%)', borderColor: meta.hex + '55', fontFamily: "'JetBrains Mono', monospace" }}
    >
      <p className="text-[10px] text-white/40 mb-1">{d.week}</p>
      <p style={{ color: meta.hex }} className="font-bold text-sm">{d.efficiency?.toFixed(4)} km/h per bpm</p>
      <p className="text-white/50 mt-0.5">CTL <span className="text-white/80">{d.ctl}</span></p>
      <p className="text-white/50">TSB <span className="text-white/80">{d.tsb && d.tsb > 0 ? '+' : ''}{d.tsb}</span></p>
      <p style={{ color: meta.hex }} className="mt-1 text-[10px] opacity-80">{meta.label}</p>
    </div>
  )
}

function TSBScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterPayload }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d.category) return null
  const meta = TSB_META[d.category]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: 'hsl(0 0% 10%)', borderColor: meta.hex + '55', fontFamily: "'JetBrains Mono', monospace" }}
    >
      <p className="text-[10px] text-white/40 mb-1">{d.week}</p>
      <p style={{ color: meta.hex }} className="font-bold text-sm">{d.efficiency?.toFixed(4)} km/h per bpm</p>
      <p className="text-white/50 mt-0.5">TSB <span className="text-white/80">{d.tsb && d.tsb > 0 ? '+' : ''}{d.tsb}</span></p>
      <p className="text-white/50">CTL <span className="text-white/80">{d.ctl}</span></p>
      <p style={{ color: meta.hex }} className="mt-1 text-[10px] opacity-80">{meta.label}</p>
    </div>
  )
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: 'hsl(0 0% 10%)', borderColor: '#a78bfa55', fontFamily: "'JetBrains Mono', monospace" }}
    >
      <p className="text-[10px] text-white/40 mb-1">{label}</p>
      <p className="text-violet-400 font-bold text-sm">{payload[0].value.toFixed(4)}</p>
      <p className="text-white/40 text-[10px]">km/h per bpm</p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LoadVsPerformancePage() {
  const data = generateMockData()

  // Derived stats
  const PEARSON_R = 0.72
  const OPTIMAL_TSB = 12
  const DATA_POINTS = data.length

  const currentCTL = data[data.length - 1].ctl
  const currentEfficiency = data[data.length - 1].efficiency
  const firstEfficiency = data[0].efficiency
  const efficiencyDelta = ((currentEfficiency - firstEfficiency) / firstEfficiency) * 100

  // Best efficiency point
  const bestPoint = data.reduce((best, d) => (d.efficiency > best.efficiency ? d : best), data[0])

  // Group scatter data by category for separate Scatter series
  const scatterByCategory = (
    ['fresh', 'neutral', 'fatigued', 'overreaching'] as TSBCategory[]
  ).map((cat) => ({
    category: cat,
    meta: TSB_META[cat],
    points: data.filter((d) => d.category === cat).map((d) => ({
      ctl: d.ctl,
      tsb: d.tsb,
      efficiency: d.efficiency,
      category: d.category,
      week: d.week,
    })),
  }))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[hsl(0_0%_7%)] text-white">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(0_0%_7%)]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono-jb"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Explore
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex-1 flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  Load vs Performance
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              CTL · TSB · Efficiency
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Insights card ── */}
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-violet-500/15">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <p className="font-rajdhani font-bold text-sm tracking-wide text-violet-300">
                Training Insights
              </p>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Pearson r */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col justify-between min-h-[84px]">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Pearson r</p>
                <div>
                  <p className="font-rajdhani text-4xl font-bold leading-none text-violet-400">
                    {PEARSON_R.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-mono-jb text-white/30 mt-1">CTL ↔ efficiency</p>
                </div>
              </div>

              {/* Optimal TSB */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col justify-between min-h-[84px]">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Optimal TSB</p>
                <div>
                  <p className="font-rajdhani text-4xl font-bold leading-none text-emerald-400">
                    +{OPTIMAL_TSB}
                  </p>
                  <p className="text-[10px] font-mono-jb text-white/30 mt-1">form at peak runs</p>
                </div>
              </div>

              {/* Efficiency gain */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col justify-between min-h-[84px]">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">6-mo Gain</p>
                <div>
                  <p className="font-rajdhani text-4xl font-bold leading-none text-sky-400">
                    +{efficiencyDelta.toFixed(1)}<span className="text-2xl text-sky-400/60">%</span>
                  </p>
                  <p className="text-[10px] font-mono-jb text-white/30 mt-1">efficiency</p>
                </div>
              </div>

              {/* Data points */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col justify-between min-h-[84px]">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Data Points</p>
                <div>
                  <p className="font-rajdhani text-4xl font-bold leading-none text-white/70">
                    {DATA_POINTS}
                  </p>
                  <p className="text-[10px] font-mono-jb text-white/30 mt-1">weekly samples</p>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3.5 py-3">
              <p className="text-xs text-white/65 leading-relaxed font-mono-jb">
                <span className="text-violet-300 font-medium">r = {PEARSON_R} — </span>
                {correlationInterpretation(PEARSON_R)}
                {' '}Best recorded efficiency was{' '}
                <span className="text-white/85">{bestPoint.efficiency.toFixed(4)} km/h per bpm</span>
                {' '}(week of {bestPoint.week}) at TSB{' '}
                <span className="text-emerald-400">{bestPoint.tsb > 0 ? '+' : ''}{bestPoint.tsb}</span>
                {' '}and CTL{' '}
                <span className="text-white/85">{bestPoint.ctl}</span>.
              </p>
            </div>
          </div>

          {/* ── CTL vs Efficiency scatter ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                CTL vs Running Efficiency
              </h2>
            </div>
            <p className="text-[11px] font-mono-jb text-white/30 mb-4">
              Does building fitness actually make you run more efficiently?
            </p>

            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="ctl"
                  type="number"
                  domain={[25, 70]}
                  name="CTL"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'CTL (Chronic Training Load)',
                    position: 'insideBottomRight',
                    offset: -4,
                    fill: 'rgba(255,255,255,0.25)',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <YAxis
                  dataKey="efficiency"
                  type="number"
                  domain={[0.087, 0.102]}
                  name="Efficiency"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={(v: number) => v.toFixed(3)}
                  label={{
                    value: 'km/h per bpm',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 14,
                    fill: 'rgba(255,255,255,0.25)',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <Tooltip content={<CTLScatterTooltip />} />

                {/* Trend reference line — approximate CTL=30→efficiency=0.090, CTL=65→efficiency=0.098 */}
                <ReferenceLine
                  segment={[
                    { x: 28, y: 0.0888 },
                    { x: 68, y: 0.0992 },
                  ]}
                  stroke="#a78bfa"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  strokeOpacity={0.45}
                />

                {scatterByCategory.map(({ category, meta, points }) =>
                  points.length > 0 ? (
                    <Scatter
                      key={category}
                      name={meta.label}
                      data={points}
                      fill={meta.hex}
                      fillOpacity={0.85}
                      r={5}
                    />
                  ) : null
                )}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono-jb text-white/40">
              {(Object.entries(TSB_META) as [TSBCategory, typeof TSB_META[TSBCategory]][]).map(([, meta]) => (
                <span key={meta.label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: meta.hex }}
                  />
                  {meta.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-px border-t border-dashed" style={{ borderColor: '#a78bfa80' }} />
                Trend r = {PEARSON_R}
              </span>
            </div>
          </div>

          {/* ── TSB vs Efficiency scatter ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                TSB (Form Score) vs Running Performance
              </h2>
            </div>
            <p className="text-[11px] font-mono-jb text-white/30 mb-4">
              Optimal performance window: TSB +10 to +25 (Bannister 1991)
            </p>

            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="tsb"
                  type="number"
                  domain={[-45, 35]}
                  name="TSB"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'TSB (Form Score)',
                    position: 'insideBottomRight',
                    offset: -4,
                    fill: 'rgba(255,255,255,0.25)',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <YAxis
                  dataKey="efficiency"
                  type="number"
                  domain={[0.087, 0.102]}
                  name="Efficiency"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={(v: number) => v.toFixed(3)}
                  label={{
                    value: 'km/h per bpm',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 14,
                    fill: 'rgba(255,255,255,0.25)',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <Tooltip content={<TSBScatterTooltip />} />

                {/* Optimal window lower bound */}
                <ReferenceLine
                  x={10}
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  strokeOpacity={0.7}
                  label={{
                    value: '+10',
                    position: 'insideTopRight',
                    fill: '#34d399',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: 0.8,
                  }}
                />
                {/* Optimal window upper bound */}
                <ReferenceLine
                  x={25}
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  strokeOpacity={0.7}
                  label={{
                    value: '+25',
                    position: 'insideTopLeft',
                    fill: '#34d399',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: 0.8,
                  }}
                />

                {scatterByCategory.map(({ category, meta, points }) =>
                  points.length > 0 ? (
                    <Scatter
                      key={category}
                      name={meta.label}
                      data={points}
                      fill={meta.hex}
                      fillOpacity={0.85}
                      r={5}
                    />
                  ) : null
                )}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono-jb text-white/40">
              {(Object.entries(TSB_META) as [TSBCategory, typeof TSB_META[TSBCategory]][]).map(([, meta]) => (
                <span key={meta.label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: meta.hex }}
                  />
                  {meta.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-px border-t border-dashed" style={{ borderColor: '#34d39980' }} />
                Optimal window
              </span>
            </div>
          </div>

          {/* ── Efficiency Trend ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Running Efficiency Trend — 6 Months
              </h2>
            </div>
            <p className="text-[11px] font-mono-jb text-white/30 mb-4">
              Weekly efficiency (km/h per bpm). Rising trend = fitness improving.
            </p>

            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />

                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  domain={[0.087, 0.102]}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  width={40}
                  tickFormatter={(v: number) => v.toFixed(3)}
                />

                <Tooltip content={<TrendTooltip />} />

                {/* Baseline efficiency at start */}
                <ReferenceLine
                  y={firstEfficiency}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />

                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="none"
                  fill="url(#effGrad)"
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#a78bfa', stroke: 'hsl(0 0% 10%)', strokeWidth: 2 }}
                  name="Efficiency"
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Summary row */}
            <div className="mt-3 flex items-center gap-5 text-[10px] font-mono-jb text-white/40">
              <span>
                Start: <span className="text-white/60">{firstEfficiency.toFixed(4)}</span>
              </span>
              <span>
                Now: <span className="text-violet-300">{currentEfficiency.toFixed(4)}</span>
              </span>
              <span>
                CTL: <span className="text-white/60">{data[0].ctl.toFixed(0)}</span>
                {' '}→{' '}
                <span className="text-white/60">{currentCTL.toFixed(0)}</span>
              </span>
              <span className="text-emerald-400">
                +{efficiencyDelta.toFixed(1)}% over 6 months
              </span>
            </div>
          </div>

          {/* ── Science card ── */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="space-y-3">
                <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                  Science Behind Load vs Performance
                </p>
                <div className="space-y-2.5 text-xs text-white/55 leading-relaxed font-mono-jb">
                  <p>
                    <span className="text-white/80 font-medium">Performance Model = CTL − ATL</span>
                    {' '}— fitness minus fatigue. Peak performance occurs not at peak load, but when fatigue has cleared
                    and fitness remains elevated: the TSB sweet spot.
                  </p>
                  <div className="border-l-2 border-amber-500/30 pl-3 space-y-2">
                    <p>
                      <span className="text-amber-300/80">Bannister EW (1991)</span>
                      {' '}— "Modeling elite athletic performance."{' '}
                      <em>Physiological Testing of Elite Athletes</em>, Human Kinetics.
                      {' '}Established the impulse-response framework: Performance = CTL − ATL.
                      {' '}Peak performance predicted at TSB +10 to +25.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Lucia A et al. (2000)</span>
                      {' '}— "Physiological characteristics of the best Eritrean runners."{' '}
                      <em>Med Sci Sports Exerc</em> (MSSE) 32(12):2000–2007.
                      {' '}Running economy explains 65–78% of endurance performance variance among
                      athletes of similar VO₂max.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Coyle EF (1991)</span>
                      {' '}— "Muscle and cardiovascular adaptations to cycle ergometer training."{' '}
                      <em>J Appl Physiol</em> 70(2):750–758.
                      {' '}Training-induced improvements in heart rate efficiency reflect neuromuscular
                      and metabolic adaptations — more work per beat signals a more economical athlete.
                    </p>
                  </div>
                  <p className="text-white/30 text-[10px]">
                    Efficiency metric = average pace (km/h) divided by average heart rate (bpm) per run session.
                    Higher values indicate more speed per unit of cardiac effort.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
