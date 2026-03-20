'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type AsymmetryZone = 'excellent' | 'normal' | 'mild' | 'significant'

interface DailyReading {
  date: string   // "Jan 01" label for display
  pct: number    // walking asymmetry %
}

interface HistBin {
  label: string
  count: number
  zone: AsymmetryZone
}

// ─── Zone metadata ────────────────────────────────────────────────────────────

const ZONE_META: Record<AsymmetryZone, {
  label: string
  range: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  excellent:   {
    label: 'Excellent',
    range: '< 2.5 %',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.3)',
    description: 'Near-perfect bilateral symmetry. Minimal injury risk.',
  },
  normal:      {
    label: 'Normal',
    range: '2.5 – 5 %',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.3)',
    description: 'Within healthy population norms. No action required.',
  },
  mild:        {
    label: 'Mild Asymmetry',
    range: '5 – 10 %',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.3)',
    description: 'Elevated asymmetry. Associated with higher knee OA risk.',
  },
  significant: {
    label: 'Significant',
    range: '> 10 %',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.3)',
    description: 'Significant neuromuscular imbalance. Consider clinical assessment.',
  },
}

// ─── Mock data: 90-day daily readings ────────────────────────────────────────
// Simulates a person with generally normal asymmetry who had a mild flare-up
// around day 50–65 (perhaps a minor ankle sprain) and is now recovering back
// toward the normal range.

function makeDate(daysAgo: number): string {
  const d = new Date('2026-03-20')
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Seed a realistic 90-day curve
const RAW_90: DailyReading[] = (() => {
  const base = [
    3.2, 2.8, 3.5, 3.1, 2.9, 3.4, 3.0,  // days 89-83 (early base)
    2.7, 3.3, 3.8, 2.9, 3.1, 3.6, 2.8,  // days 82-76
    3.0, 3.4, 2.6, 3.2, 3.9, 3.1, 2.8,  // days 75-69
    3.5, 4.0, 3.7, 3.3, 3.8, 4.2, 3.9,  // days 68-62 (stress accumulating)
    5.1, 5.8, 6.3, 7.1, 6.8, 7.4, 6.9,  // days 61-55 (mild flare-up peak)
    7.2, 6.5, 6.1, 5.7, 5.3, 4.9, 5.1,  // days 54-48 (gradually recovering)
    4.8, 4.5, 4.2, 4.6, 4.1, 3.9, 4.3,  // days 47-41
    3.8, 3.5, 4.0, 3.7, 3.2, 3.6, 3.4,  // days 40-34
    3.1, 3.5, 3.3, 2.9, 3.7, 3.2, 3.0,  // days 33-27
    2.8, 3.1, 3.4, 2.7, 3.2, 3.8, 2.9,  // days 26-20
    3.0, 3.3, 2.8, 3.1, 3.4, 2.9, 3.2,  // days 19-13
    2.7, 3.0, 3.3, 2.8, 3.5, 3.1, 2.9,  // days 12-6
    3.2, 2.9, 3.1,                        // days 5-3 (most recent)
  ]

  return base.map((pct, i) => ({
    date: makeDate(base.length - 1 - i),
    pct: Math.round(pct * 10) / 10,
  }))
})()

// ─── Derived stats ────────────────────────────────────────────────────────────

const current = RAW_90[RAW_90.length - 1].pct

const avg30 = (() => {
  const last30 = RAW_90.slice(-30)
  return Math.round((last30.reduce((s, r) => s + r.pct, 0) / last30.length) * 10) / 10
})()

const prior30avg = (() => {
  const prior = RAW_90.slice(-60, -30)
  return Math.round((prior.reduce((s, r) => s + r.pct, 0) / prior.length) * 10) / 10
})()

const trendDelta = Math.round((avg30 - prior30avg) * 10) / 10

function classifyZone(pct: number): AsymmetryZone {
  if (pct < 2.5)  return 'excellent'
  if (pct < 5)    return 'normal'
  if (pct < 10)   return 'mild'
  return 'significant'
}

const currentZone = classifyZone(current)

// Histogram bins
const BINS: { label: string; min: number; max: number; zone: AsymmetryZone }[] = [
  { label: '0–2.5%',    min: 0,    max: 2.5,  zone: 'excellent'   },
  { label: '2.5–5%',   min: 2.5,  max: 5,    zone: 'normal'      },
  { label: '5–7.5%',   min: 5,    max: 7.5,  zone: 'mild'        },
  { label: '7.5–10%',  min: 7.5,  max: 10,   zone: 'mild'        },
  { label: '>10%',     min: 10,   max: 999,  zone: 'significant' },
]

const HIST_DATA: HistBin[] = BINS.map((bin) => ({
  label: bin.label,
  count: RAW_90.filter((r) => r.pct >= bin.min && r.pct < bin.max).length,
  zone: bin.zone,
}))

// Subsample for chart legibility (every 3 days → 30 points)
const CHART_DATA = RAW_90.filter((_, i) => i % 3 === 0 || i === RAW_90.length - 1)

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0f0f0f',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f5f5f5',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  accent: string
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1"
      style={{
        background: `linear-gradient(135deg, ${accent}11 0%, rgba(15,15,15,0) 60%)`,
        borderColor: `${accent}33`,
      }}
    >
      <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">{label}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color: accent, letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-text-secondary">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-text-secondary opacity-70 mt-0.5">{sub}</p>}
    </div>
  )
}

function ZoneBadge({ zone }: { zone: AsymmetryZone }) {
  const meta = ZONE_META[zone]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0.5)  return <TrendingUp className="w-4 h-4 text-orange-400" />
  if (delta < -0.5) return <TrendingDown className="w-4 h-4 text-emerald-400" />
  return <Minus className="w-4 h-4 text-cyan-400" />
}

// ─── Main client component ────────────────────────────────────────────────────

export function WalkingAsymmetryClient() {
  const zoneMeta = ZONE_META[currentZone]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-mono-jb { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-background">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors flex items-center gap-1.5 text-text-secondary text-sm font-medium"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Explore</span>
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}
              >
                🦿
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary leading-tight">Walking Asymmetry</h1>
                <p className="text-xs text-text-secondary">Step-timing imbalance · 90-day analysis</p>
              </div>
            </div>
            <ZoneBadge zone={currentZone} />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* ── Hero intro strip ── */}
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.10) 0%, rgba(20,184,166,0.06) 100%)',
              border: '1px solid rgba(34,211,238,0.2)',
            }}
          >
            <div className="text-3xl shrink-0 mt-0.5" aria-hidden>🦿</div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Left–Right Step-Timing Balance
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Walking asymmetry measures the percentage difference in timing between your left and right
                steps — captured passively by iPhone (iOS 14+) or Apple Watch (Series 4+) during everyday
                walking. Even subtle imbalances can signal early musculoskeletal stress or neuromuscular
                compensation patterns long before pain appears.
              </p>
            </div>
          </div>

          {/* ── Key metrics cards ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Key Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="Current"
                value={current.toFixed(1)}
                unit="%"
                sub={`Zone: ${zoneMeta.label}`}
                accent={zoneMeta.color}
              />
              <MetricCard
                label="30-Day Avg"
                value={avg30.toFixed(1)}
                unit="%"
                sub="Rolling mean"
                accent="#22d3ee"
              />
              <div
                className="rounded-2xl border p-4 flex flex-col gap-1"
                style={{
                  background: trendDelta > 0.5
                    ? 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(15,15,15,0) 60%)'
                    : trendDelta < -0.5
                    ? 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(15,15,15,0) 60%)'
                    : 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(15,15,15,0) 60%)',
                  borderColor: trendDelta > 0.5 ? 'rgba(251,146,60,0.3)' : trendDelta < -0.5 ? 'rgba(52,211,153,0.3)' : 'rgba(34,211,238,0.2)',
                }}
              >
                <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">Trend</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendIcon delta={trendDelta} />
                  <span
                    className="text-3xl font-black tabular-nums"
                    style={{
                      letterSpacing: '-0.03em',
                      color: trendDelta > 0.5 ? '#fb923c' : trendDelta < -0.5 ? '#34d399' : '#22d3ee',
                    }}
                  >
                    {trendDelta > 0 ? '+' : ''}{trendDelta.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                  {trendDelta > 0.5 ? 'Worsening vs prior 30d' : trendDelta < -0.5 ? 'Improving vs prior 30d' : 'Stable vs prior 30d'}
                </p>
              </div>
            </div>
          </section>

          {/* ── 90-day line chart ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📈</span>
              <h2 className="text-sm font-semibold text-text-primary">90-Day Trend</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">asymmetry %</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              Dashed lines mark the 5 % (mild) and 10 % (significant) clinical thresholds.
            </p>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded" style={{ background: '#22d3ee' }} />
                Daily asymmetry
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #fb923c' }} />
                5 % threshold
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #f87171' }} />
                10 % threshold
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={CHART_DATA} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(CHART_DATA.length / 5)}
                />
                <YAxis
                  domain={[0, 14]}
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  width={30}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toFixed(1)} %`, 'Asymmetry']}
                  cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }}
                />
                {/* 5% threshold */}
                <ReferenceLine
                  y={5}
                  stroke="#fb923c"
                  strokeDasharray="5 4"
                  strokeOpacity={0.65}
                  strokeWidth={1.5}
                  label={{ value: '5%', position: 'right', fontSize: 9, fill: '#fb923c', opacity: 0.8 }}
                />
                {/* 10% threshold */}
                <ReferenceLine
                  y={10}
                  stroke="#f87171"
                  strokeDasharray="5 4"
                  strokeOpacity={0.65}
                  strokeWidth={1.5}
                  label={{ value: '10%', position: 'right', fontSize: 9, fill: '#f87171', opacity: 0.8 }}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#22d3ee', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-text-secondary mt-2 opacity-55 text-center font-mono-jb">
              Sampled every 3 days · Raw daily readings used for all averages
            </p>
          </section>

          {/* ── Distribution histogram ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📊</span>
              <h2 className="text-sm font-semibold text-text-primary">Distribution — Last 90 Days</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">days per bin</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              How often your asymmetry falls into each risk zone.
            </p>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={HIST_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  width={28}
                  allowDecimals={false}
                  tickFormatter={(v) => `${v}d`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _: string, entry) => {
                    const zone = (entry.payload as HistBin).zone
                    return [`${v} day${v !== 1 ? 's' : ''} · ${ZONE_META[zone].label}`, 'Days in bin']
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {HIST_DATA.map((bin, i) => (
                    <Cell key={i} fill={ZONE_META[bin.zone].color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Zone legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {(Object.entries(ZONE_META) as [AsymmetryZone, typeof ZONE_META['excellent']][]).map(([zone, meta]) => {
                const days = HIST_DATA.filter((b) => b.zone === zone).reduce((s, b) => s + b.count, 0)
                const pct = Math.round((days / RAW_90.length) * 100)
                return (
                  <div key={zone} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    <span className="text-xs text-text-secondary font-mono-jb">
                      {meta.label}{' '}
                      <span className="text-text-primary font-medium">{pct}%</span>
                      <span className="opacity-50"> ({days}d)</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Risk Assessment ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Risk Assessment
            </h2>
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ borderColor: zoneMeta.border, background: zoneMeta.bg }}
            >
              {/* Current status */}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${zoneMeta.color}22`, border: `1px solid ${zoneMeta.border}` }}
                >
                  {currentZone === 'excellent' ? '✅' : currentZone === 'normal' ? '🟢' : currentZone === 'mild' ? '⚠️' : '🔴'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{ color: zoneMeta.color }}
                    >
                      {current.toFixed(1)}%
                    </span>
                    <ZoneBadge zone={currentZone} />
                  </div>
                  <p className="text-sm text-text-primary font-medium">{zoneMeta.description}</p>
                  <p className="text-xs text-text-secondary mt-1 opacity-70">Range: {zoneMeta.range}</p>
                </div>
              </div>

              {/* Zone scale */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.entries(ZONE_META) as [AsymmetryZone, typeof ZONE_META['excellent']][]).map(([zone, meta]) => (
                  <div
                    key={zone}
                    className="rounded-xl border px-3 py-2.5 space-y-1"
                    style={{
                      borderColor: zone === currentZone ? meta.color + '66' : 'rgba(255,255,255,0.07)',
                      background: zone === currentZone ? meta.bg : 'rgba(255,255,255,0.02)',
                      boxShadow: zone === currentZone ? `0 0 0 1px ${meta.color}33` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                      <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                    </div>
                    <p className="text-xs font-mono-jb" style={{ color: meta.color }}>{meta.range}</p>
                    <p className="text-[10px] text-text-secondary leading-relaxed opacity-75">{meta.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How Apple Measures This ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.25)' }}
              >
                <Info className="w-4 h-4" style={{ color: '#22d3ee' }} />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">How Apple Measures This</h2>
            </div>
            <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
              <p>
                <span className="font-semibold text-text-primary">Device requirements:</span>{' '}
                iPhone (iOS 14+) carried in pocket, or Apple Watch Series 4 or later (watchOS 7+).
                Measurement is passive — no workout or manual action required.
              </p>
              <p>
                <span className="font-semibold text-text-primary">How it works:</span>{' '}
                The CoreMotion accelerometer samples your stride at up to 100 Hz. Apple&apos;s on-device
                algorithm identifies individual heel-strike events and computes the percentage difference
                between left and right step durations:
              </p>
              <div
                className="rounded-lg px-4 py-3 font-mono-jb text-xs"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,211,238,0.1)' }}
              >
                <span style={{ color: '#22d3ee' }}>asymmetry</span>
                {' = '}
                <span style={{ color: '#a78bfa' }}>|left_step − right_step|</span>
                {' / '}
                <span style={{ color: '#34d399' }}>avg_step_duration</span>
                {' × 100'}
              </div>
              <p>
                <span className="font-semibold text-text-primary">Cadence independence:</span>{' '}
                The metric is normalised by average step duration so that it reflects imbalance
                independently of how fast you walk — a brisk walker and a slow walker with identical
                symmetry will show the same value.
              </p>
              <p>
                <span className="font-semibold text-text-primary">Minimum walk length:</span>{' '}
                Apple requires at least 10 continuous seconds of uninterrupted walking to register a
                sample. Short bursts (crossing a room) are excluded. Most readings represent
                outdoor walks of 1 minute or more.
              </p>
              <p>
                <span className="font-semibold text-text-primary">Why it varies day-to-day:</span>{' '}
                Fatigue, footwear, terrain, carrying objects, and even contralateral compensations (e.g.
                favouring a sore shoulder) can shift the score temporarily. Look at the 30-day trend
                rather than any single reading.
              </p>
            </div>
          </section>

          {/* ── Science Citations ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="rounded-full p-1.5 shrink-0"
                style={{ background: 'rgba(251,191,36,0.15)' }}
              >
                <BookOpen className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
                Research Basis
              </h2>
            </div>

            <div className="border-l-2 pl-3 space-y-3.5" style={{ borderColor: 'rgba(251,191,36,0.3)' }}>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Schmid et al. 2019 · <em>Gait &amp; Posture</em>
                </p>
                <p className="opacity-80">
                  Walking asymmetry{' '}
                  <span className="font-semibold" style={{ color: '#fb923c' }}>&gt; 5 %</span>{' '}
                  was associated with a{' '}
                  <span className="font-semibold" style={{ color: '#fb923c' }}>2.5× higher risk</span>{' '}
                  of knee osteoarthritis progression over 3 years in adults aged 45–75. Asymmetry{' '}
                  <span className="font-semibold" style={{ color: '#f87171' }}>&gt; 10 %</span>{' '}
                  indicated significant neuromuscular imbalance requiring clinical evaluation.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Zifchock et al. 2006 · <em>Gait &amp; Posture</em>
                </p>
                <p className="opacity-80">
                  Bilateral asymmetry in recreational runners correlated significantly with the{' '}
                  <span className="font-semibold text-text-primary">location of stress fractures</span>{' '}
                  and chronic musculoskeletal injuries — athletes consistently loaded the symptomatic limb
                  more heavily, producing measurable asymmetry weeks before clinical presentation.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Haugen et al. 2014 · <em>Journal of Orthopaedic &amp; Sports Physical Therapy</em>
                </p>
                <p className="opacity-80">
                  Reduced bilateral asymmetry{' '}
                  <span className="font-semibold" style={{ color: '#34d399' }}>(&lt; 5 %)</span>{' '}
                  correlated with lower injury incidence across a full competitive season in professional
                  team sport athletes. Pre-season symmetry screening was recommended as a valid and
                  low-cost injury prediction tool.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Fukuchi et al. 2018 · <em>Journal of Biomechanics</em>
                </p>
                <p className="opacity-80">
                  Age-related increases in gait asymmetry — even subtle changes of{' '}
                  <span className="font-semibold text-text-primary">1–2 percentage points</span>{' '}
                  over 5 years — were found to be a sensitive early indicator of neurological or
                  orthopaedic deterioration and an independent predictor of fall risk in adults
                  over 65. The authors identified walking asymmetry as one of the most accessible
                  and actionable passive fall-risk biomarkers available.
                </p>
              </div>

            </div>

            <p
              className="text-[10px] opacity-40 pt-1 border-t font-mono-jb"
              style={{ borderColor: 'rgba(251,191,36,0.15)', color: 'var(--color-text-secondary)' }}
            >
              Thresholds: &lt; 2.5 % excellent · 2.5–5 % normal · 5–10 % mild · &gt; 10 % significant concern.
              Individual physiology varies. This is not a clinical assessment.
            </p>
          </section>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
