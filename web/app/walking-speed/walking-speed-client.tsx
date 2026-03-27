'use client'

import { useState, useEffect } from 'react'
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

type SpeedZone = 'very-low' | 'low' | 'fair' | 'good' | 'excellent'

interface DailyReading {
  date: string   // "Jan 01" label for display
  speed: number  // m/s
}

interface HistBin {
  label: string
  count: number
  zone: SpeedZone
}

// ─── Zone metadata ────────────────────────────────────────────────────────────

const ZONE_META: Record<SpeedZone, {
  label: string
  range: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  'very-low': {
    label: 'Very Low',
    range: '< 0.6 m/s',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.3)',
    description: 'Community ambulation at risk. Increased fall, hospitalisation, and mortality risk.',
  },
  low: {
    label: 'Low',
    range: '0.6 – 0.8 m/s',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.3)',
    description: 'Limited community access. Below Studenski\'s clinical cut-point for poor prognosis.',
  },
  fair: {
    label: 'Fair',
    range: '0.8 – 1.0 m/s',
    color: '#facc15',
    bg: 'rgba(250,204,21,0.10)',
    border: 'rgba(250,204,21,0.28)',
    description: 'Adequate indoor mobility. Approaching the 1.0 m/s threshold for full independence.',
  },
  good: {
    label: 'Good',
    range: '1.0 – 1.2 m/s',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.3)',
    description: 'Full community independence. Normative for adults 65+. Healthy ageing range.',
  },
  excellent: {
    label: 'Excellent',
    range: '≥ 1.2 m/s',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.3)',
    description: 'Optimal longevity range. Normative for young adults. Strong survival predictor.',
  },
}

// ─── Zone helpers ──────────────────────────────────────────────────────────

function classifyZone(speed: number): SpeedZone {
  if (speed < 0.6) return 'very-low'
  if (speed < 0.8) return 'low'
  if (speed < 1.0) return 'fair'
  if (speed < 1.2) return 'good'
  return 'excellent'
}

const BINS: { label: string; min: number; max: number; zone: SpeedZone }[] = [
  { label: '< 0.6',    min: 0,   max: 0.6, zone: 'very-low' },
  { label: '0.6–0.8', min: 0.6, max: 0.8, zone: 'low'      },
  { label: '0.8–1.0', min: 0.8, max: 1.0, zone: 'fair'     },
  { label: '1.0–1.2', min: 1.0, max: 1.2, zone: 'good'     },
  { label: '≥ 1.2',   min: 1.2, max: 999, zone: 'excellent'},
]

// ─── Tooltip style ─────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0f0f0f',
  border: '1px solid rgba(20,184,166,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f5f5f5',
}

// ─── Sub-components ────────────────────────────────────────────────────────

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

function ZoneBadge({ zone }: { zone: SpeedZone }) {
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
  if (delta > 0.02)  return <TrendingUp className="w-4 h-4 text-emerald-400" />
  if (delta < -0.02) return <TrendingDown className="w-4 h-4 text-orange-400" />
  return <Minus className="w-4 h-4 text-cyan-400" />
}

// ─── Main client component ─────────────────────────────────────────────────

export function WalkingSpeedClient() {
  const [rawData, setRawData] = useState<DailyReading[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/walking-speed')
      .then((r) => r.json())
      .then((json) => setRawData(json.data ?? []))
      .catch(() => setRawData([]))
      .finally(() => setIsLoading(false))
  }, [])

  const hasData = rawData.length > 0

  const current = hasData ? rawData[rawData.length - 1].speed : 0
  const avg30 = hasData ? (() => {
    const last30 = rawData.slice(-30)
    return Math.round((last30.reduce((s, r) => s + r.speed, 0) / last30.length) * 1000) / 1000
  })() : 0
  const prior30avg = hasData ? (() => {
    const prior = rawData.slice(-60, -30)
    if (!prior.length) return avg30
    return Math.round((prior.reduce((s, r) => s + r.speed, 0) / prior.length) * 1000) / 1000
  })() : 0
  const trendDelta = Math.round((avg30 - prior30avg) * 1000) / 1000
  const currentZone: SpeedZone = hasData ? classifyZone(current) : 'good'
  const zoneMeta = ZONE_META[currentZone]

  const histData: HistBin[] = BINS.map((bin) => ({
    label: bin.label,
    count: rawData.filter((r) => r.speed >= bin.min && r.speed < bin.max).length,
    zone: bin.zone,
  }))

  // Subsample for chart legibility (~30 points max)
  const chartData = rawData.filter((_, i) => i % 3 === 0 || i === rawData.length - 1)

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
                style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                🚶
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary leading-tight">Walking Speed</h1>
                <p className="text-xs text-text-secondary">The sixth vital sign · 90-day analysis</p>
              </div>
            </div>
            {hasData && <ZoneBadge zone={currentZone} />}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* ── Hero intro strip ── */}
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(20,184,166,0.10) 0%, rgba(6,182,212,0.06) 100%)',
              border: '1px solid rgba(20,184,166,0.22)',
            }}
          >
            <div className="text-3xl shrink-0 mt-0.5" aria-hidden>🚶</div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                The Sixth Vital Sign — Measured Passively Every Day
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Walking speed is one of the strongest predictors of longevity and functional health in
                clinical medicine. Studenski et al. (JAMA 2011) showed that each 0.1 m/s increase in gait
                speed corresponds to roughly a 12 % reduction in 10-year mortality risk — a relationship that
                outperforms most standard clinical assessments. Your iPhone (iOS 14+) or Apple Watch
                Series 4+ measures it passively during everyday walking, no workout required.
              </p>
            </div>
          </div>

          {/* ── Key metrics cards ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Key Metrics
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-border p-4 flex flex-col gap-2 animate-pulse">
                    <div className="h-3 w-20 bg-surface-secondary rounded" />
                    <div className="h-8 w-16 bg-surface-secondary rounded" />
                    <div className="h-3 w-24 bg-surface-secondary rounded opacity-50" />
                  </div>
                ))}
              </div>
            ) : !hasData ? (
              <div
                className="rounded-2xl border px-5 py-14 flex flex-col items-center justify-center gap-3 text-center"
                style={{ borderColor: 'rgba(20,184,166,0.18)', background: 'rgba(20,184,166,0.03)' }}
              >
                <div className="text-5xl" aria-hidden>🚶</div>
                <p className="text-base font-semibold text-text-primary">No walking speed data yet</p>
                <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                  Start tracking workouts in Apple Health to see your pace here. Walking workouts synced
                  to KQuarks will appear automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard
                  label="Current Speed"
                  value={current.toFixed(2)}
                  unit="m/s"
                  sub={`Zone: ${zoneMeta.label}`}
                  accent={zoneMeta.color}
                />
                <MetricCard
                  label="30-Day Average"
                  value={avg30.toFixed(2)}
                  unit="m/s"
                  sub="Rolling mean"
                  accent="#14b8a6"
                />
                <div
                  className="rounded-2xl border p-4 flex flex-col gap-1"
                  style={{
                    background: trendDelta > 0.02
                      ? 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(15,15,15,0) 60%)'
                      : trendDelta < -0.02
                      ? 'linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(15,15,15,0) 60%)'
                      : 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(15,15,15,0) 60%)',
                    borderColor: trendDelta > 0.02
                      ? 'rgba(52,211,153,0.30)'
                      : trendDelta < -0.02
                      ? 'rgba(251,146,60,0.30)'
                      : 'rgba(20,184,166,0.22)',
                  }}
                >
                  <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">Trend</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon delta={trendDelta} />
                    <span
                      className="text-3xl font-black tabular-nums"
                      style={{
                        letterSpacing: '-0.03em',
                        color: trendDelta > 0.02
                          ? '#34d399'
                          : trendDelta < -0.02
                          ? '#fb923c'
                          : '#14b8a6',
                      }}
                    >
                      {trendDelta > 0 ? '+' : ''}{trendDelta.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">m/s</span>
                  </div>
                  <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                    {trendDelta > 0.02
                      ? 'Improving vs prior 30d'
                      : trendDelta < -0.02
                      ? 'Declining vs prior 30d'
                      : 'Stable vs prior 30d'}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── 90-day line chart ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(20,184,166,0.18)', background: 'rgba(20,184,166,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📈</span>
              <h2 className="text-sm font-semibold text-text-primary">90-Day Trend</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">m/s</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              Dashed lines mark the 0.8, 1.0, and 1.2 m/s clinical thresholds from Studenski 2011 and Fritz &amp; Lusardi 2009.
            </p>

            {isLoading ? (
              <div className="h-[230px] rounded-xl bg-surface-secondary animate-pulse" />
            ) : !hasData ? (
              <div className="h-[230px] flex items-center justify-center text-sm text-text-secondary opacity-50">
                No data to display
              </div>
            ) : (
              <>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0.5 rounded" style={{ background: '#14b8a6' }} />
                    Daily speed
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #fb923c' }} />
                    0.8 m/s
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #22d3ee' }} />
                    1.0 m/s
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #34d399' }} />
                    1.2 m/s
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={chartData} margin={{ top: 6, right: 20, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.floor(chartData.length / 5)}
                    />
                    <YAxis
                      domain={[0.7, 1.35]}
                      tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                      width={34}
                      tickFormatter={(v) => `${v.toFixed(1)}`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v.toFixed(2)} m/s`, 'Speed']}
                      cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }}
                    />
                    <ReferenceLine
                      y={0.8}
                      stroke="#fb923c"
                      strokeDasharray="5 4"
                      strokeOpacity={0.70}
                      strokeWidth={1.5}
                      label={{ value: '0.8', position: 'right', fontSize: 9, fill: '#fb923c', opacity: 0.85 }}
                    />
                    <ReferenceLine
                      y={1.0}
                      stroke="#22d3ee"
                      strokeDasharray="5 4"
                      strokeOpacity={0.70}
                      strokeWidth={1.5}
                      label={{ value: '1.0', position: 'right', fontSize: 9, fill: '#22d3ee', opacity: 0.85 }}
                    />
                    <ReferenceLine
                      y={1.2}
                      stroke="#34d399"
                      strokeDasharray="5 4"
                      strokeOpacity={0.70}
                      strokeWidth={1.5}
                      label={{ value: '1.2', position: 'right', fontSize: 9, fill: '#34d399', opacity: 0.85 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#14b8a6', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2 opacity-55 text-center font-mono-jb">
                  Sampled every 3 readings · Raw readings used for all averages
                </p>
              </>
            )}
          </section>

          {/* ── Distribution histogram ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(20,184,166,0.18)', background: 'rgba(20,184,166,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📊</span>
              <h2 className="text-sm font-semibold text-text-primary">Speed Distribution — Last 90 Days</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">readings per bin</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              How often your walking speed falls into each clinical zone.
            </p>

            {isLoading ? (
              <div className="h-[185px] rounded-xl bg-surface-secondary animate-pulse" />
            ) : !hasData ? (
              <div className="h-[185px] flex items-center justify-center text-sm text-text-secondary opacity-50">
                No data to display
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={185}>
                  <BarChart data={histData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
                      tickFormatter={(v) => `${v}x`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, _: string, entry) => {
                        const zone = (entry.payload as HistBin).zone
                        return [`${v} reading${v !== 1 ? 's' : ''} · ${ZONE_META[zone].label}`, 'Count']
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {histData.map((bin, i) => (
                        <Cell key={i} fill={ZONE_META[bin.zone].color} fillOpacity={0.82} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Zone legend */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {(Object.entries(ZONE_META) as [SpeedZone, typeof ZONE_META['excellent']][]).map(([zone, meta]) => {
                    const count = histData.find((b) => b.zone === zone)?.count ?? 0
                    const pct = rawData.length > 0 ? Math.round((count / rawData.length) * 100) : 0
                    return (
                      <div key={zone} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                        <span className="text-xs text-text-secondary font-mono-jb">
                          {meta.label}{' '}
                          <span className="text-text-primary font-medium">{pct}%</span>
                          <span className="opacity-50"> ({count}x)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>

          {/* ── Longevity Implication Card ── */}
          {hasData && (
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Longevity Context
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
                  {currentZone === 'excellent' ? '🏆' : currentZone === 'good' ? '✅' : currentZone === 'fair' ? '🟡' : currentZone === 'low' ? '⚠️' : '🔴'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{ color: zoneMeta.color }}
                    >
                      {current.toFixed(2)} m/s
                    </span>
                    <ZoneBadge zone={currentZone} />
                  </div>
                  <p className="text-sm text-text-primary font-medium">{zoneMeta.description}</p>
                  <p className="text-xs text-text-secondary mt-1 opacity-70">Range: {zoneMeta.range}</p>
                </div>
              </div>

              {/* Studenski survival context */}
              <div
                className="rounded-xl border px-4 py-3 space-y-1.5"
                style={{ borderColor: 'rgba(20,184,166,0.2)', background: 'rgba(20,184,166,0.06)' }}
              >
                <p className="text-xs font-semibold text-text-primary">Studenski 2011 survival context</p>
                <p className="text-xs text-text-secondary leading-relaxed opacity-80">
                  Your 30-day average of{' '}
                  <span className="font-semibold" style={{ color: '#14b8a6' }}>{avg30.toFixed(2)} m/s</span>
                  {' '}is{' '}
                  <span className="font-semibold" style={{ color: zoneMeta.color }}>
                    {avg30 >= 1.0
                      ? `${((avg30 - 1.0) / 0.1 * 12).toFixed(0)}% lower predicted 10-year mortality`
                      : `${((1.0 - avg30) / 0.1 * 12).toFixed(0)}% higher predicted 10-year mortality`}
                  </span>
                  {' '}compared to the 1.0 m/s reference, based on the Studenski et al. dose-response
                  relationship of ~12% mortality reduction per 0.1 m/s increase.
                  The clinical cut-point for poor prognosis is{' '}
                  <span className="font-semibold text-orange-400">0.8 m/s</span>.
                </p>
              </div>

              {/* Zone scale */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {(Object.entries(ZONE_META) as [SpeedZone, typeof ZONE_META['excellent']][]).map(([zone, meta]) => (
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
          )}

          {/* ── How Apple Measures This ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(20,184,166,0.18)', background: 'rgba(20,184,166,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                <Info className="w-4 h-4" style={{ color: '#14b8a6' }} />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">How Apple Measures This</h2>
            </div>
            <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
              <p>
                <span className="font-semibold text-text-primary">Device requirements:</span>{' '}
                iPhone (iOS 14+) carried in a pocket or bag, or Apple Watch Series 4 or later (watchOS 7+).
                No workout needs to be started — measurement is entirely passive during everyday walking.
              </p>
              <p>
                <span className="font-semibold text-text-primary">How it works:</span>{' '}
                The CoreMotion framework uses the device accelerometer and barometer (and Watch GPS when
                available) to detect individual strides. By measuring the time between consecutive
                heel-strikes and dividing by stride length, it derives instantaneous speed. Apple averages
                these samples across a qualifying walk and stores them in HealthKit as
                <span className="font-mono-jb text-[11px] text-teal-400"> HKQuantityTypeIdentifierWalkingSpeed</span>.
              </p>
              <div
                className="rounded-lg px-4 py-3 font-mono-jb text-xs"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(20,184,166,0.12)' }}
              >
                <span style={{ color: '#14b8a6' }}>walking_speed</span>
                {' = '}
                <span style={{ color: '#a78bfa' }}>stride_length</span>
                {' / '}
                <span style={{ color: '#34d399' }}>stride_duration</span>
                {' · averaged per walk'}
              </div>
              <p>
                <span className="font-semibold text-text-primary">Minimum qualifying walk:</span>{' '}
                Apple requires at least 10 consecutive seconds of uninterrupted, level walking. Short
                bursts — crossing a room, walking between desks — are excluded. Readings that include
                significant inclines are also filtered to ensure comparability across sessions.
              </p>
              <p>
                <span className="font-semibold text-text-primary">Speed vs. pace:</span>{' '}
                Walking speed (m/s) is the inverse of pace (min/km). 1.0 m/s ≈ 16:40 min/km ≈
                26:50 min/mile. Apple reports in m/s in HealthKit; some apps convert to km/h or mph.
              </p>
              <p>
                <span className="font-semibold text-text-primary">Day-to-day variation:</span>{' '}
                Fatigue, footwear, terrain, time of day, and carrying loads all cause natural fluctuation
                of ±0.05–0.10 m/s. Focus on the 30-day rolling average as the meaningful signal rather
                than any single reading.
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
                  Studenski et al. 2011 ·{' '}
                  <em>JAMA</em>
                </p>
                <p className="opacity-80">
                  In a pooled analysis of 34,485 community-dwelling adults, usual gait speed predicted
                  10-year survival better than age, gender, chronic conditions, smoking, blood pressure, BMI,
                  and hospitalisations combined. Each 0.1 m/s increase in gait speed was associated with a{' '}
                  <span className="font-semibold" style={{ color: '#34d399' }}>~12% lower 10-year mortality risk</span>.
                  The authors proposed gait speed as a clinical vital sign alongside pulse, blood pressure,
                  temperature, respiratory rate, and pain.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Fritz &amp; Lusardi 2009 ·{' '}
                  <em>Physical Therapy</em>
                </p>
                <p className="opacity-80">
                  Established the functional ambulation thresholds still used in rehabilitation practice:{' '}
                  <span className="font-semibold text-red-400">{'<'} 0.6 m/s</span> = community ambulation at risk;{' '}
                  <span className="font-semibold text-orange-400">0.6–1.0 m/s</span> = limited community access; and{' '}
                  <span className="font-semibold text-emerald-400">{'>'} 1.0 m/s</span> = full community independence.
                  These cut-points are used globally in physical therapy discharge planning and fall-risk assessment.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Bohannon &amp; Williams Andrews 2011 ·{' '}
                  <em>Journal of Strength and Conditioning Research</em>
                </p>
                <p className="opacity-80">
                  Meta-analysis of 41 studies establishing population normatives: healthy young adults average{' '}
                  <span className="font-semibold text-text-primary">~1.25 m/s</span>, adults aged 65+ average{' '}
                  <span className="font-semibold text-text-primary">~1.0 m/s</span>, and gait speed declines
                  at approximately{' '}
                  <span className="font-semibold text-orange-400">1% per year</span> after age 60 — making
                  longitudinal tracking particularly valuable for detecting accelerated decline early.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Montero-Odasso et al. 2012 ·{' '}
                  <em>Journal of the American Geriatrics Society</em>
                </p>
                <p className="opacity-80">
                  A systematic review of 27 studies found that gait speed{' '}
                  <span className="font-semibold" style={{ color: '#fb923c' }}>{'<'} 1.0 m/s</span>{' '}
                  was associated with significantly increased risk of dementia, fall-related injury, and
                  nursing home admission. The combination of slow gait and cognitive complaints identified
                  individuals at highest short-term risk, making walking speed an important early screening
                  tool for neurodegenerative conditions.
                </p>
              </div>

            </div>

            <p
              className="text-[10px] opacity-40 pt-1 border-t font-mono-jb"
              style={{ borderColor: 'rgba(251,191,36,0.15)', color: 'var(--color-text-secondary)' }}
            >
              Zones: {'<'} 0.6 very low · 0.6–0.8 low · 0.8–1.0 fair · 1.0–1.2 good · ≥ 1.2 excellent.
              Individual physiology varies. This is not a clinical assessment.
            </p>
          </section>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
