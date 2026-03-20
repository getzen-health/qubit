'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Minus, FlaskConical } from 'lucide-react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

// ─── Mock data generation ─────────────────────────────────────────────────────

interface DayPoint {
  date: string
  label: string
  tss: number
  ctl: number
  atl: number
  tsb: number
  tsbPos: number | null
  tsbNeg: number | null
}

function generateMockData(): DayPoint[] {
  const kCtl = 1 - Math.exp(-1 / 42)
  const kAtl = 1 - Math.exp(-1 / 7)

  // Seed a realistic 90-day triathlete training block
  // Base phase → Build → Peak → Taper → Race → Recovery cycle
  const today = new Date('2026-03-20')
  const start = new Date(today)
  start.setDate(start.getDate() - 89)

  // Pre-seed 42 days of warm-up TSS for realistic CTL starting point
  // (not shown in chart, just primes the EWA)
  const dailyTSSPattern: number[] = []

  // 90-day realistic triathlete: sprint-tri prep
  // Phase 1: Base (days 0–29): moderate volume, easy aerobic
  // Phase 2: Build (days 30–59): increasing intensity, brick workouts
  // Phase 3: Peak + Taper (days 60–79): hard block then taper
  // Phase 4: Race week + Recovery (days 80–89)
  const weeklyTemplate: Record<string, number[]> = {
    base: [0, 55, 45, 70, 0, 90, 60],      // Mon rest, Tue swim, Wed bike, Thu run, Fri rest, Sat long ride, Sun run
    build: [0, 70, 65, 85, 40, 110, 75],
    peak: [0, 85, 80, 100, 55, 130, 85],
    taper: [0, 50, 40, 65, 0, 70, 45],
    race: [0, 30, 20, 0, 0, 0, 150],       // Race day Sat (high TSS)
    recovery: [0, 0, 30, 25, 0, 45, 30],
  }

  for (let i = 0; i < 90; i++) {
    const phase =
      i < 30 ? 'base'
      : i < 60 ? 'build'
      : i < 72 ? 'peak'
      : i < 80 ? 'taper'
      : i < 86 ? 'race'
      : 'recovery'

    const dow = (start.getDay() + i) % 7  // 0=Sun
    const dayOfWeek = dow === 0 ? 6 : dow - 1  // shift to Mon=0
    const base = weeklyTemplate[phase][dayOfWeek] ?? 0

    // Add noise ±15%
    const noise = base > 0 ? base * (0.85 + Math.random() * 0.3) : 0
    // Occasional missed session (10% chance)
    const actual = base > 0 && Math.random() < 0.1 ? 0 : Math.round(noise)
    dailyTSSPattern.push(actual)
  }

  // Pre-warm CTL/ATL with 42 days before our window (assume ~55 avg TSS/day)
  let ctl = 52
  let atl = 52

  const result: DayPoint[] = []
  for (let i = 0; i < 90; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const tss = dailyTSSPattern[i]

    atl = atl + kAtl * (tss - atl)
    ctl = ctl + kCtl * (tss - ctl)
    const tsb = ctl - atl

    const ctlR = Math.round(ctl * 10) / 10
    const atlR = Math.round(atl * 10) / 10
    const tsbR = Math.round(tsb * 10) / 10

    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    result.push({
      date: d.toISOString().slice(0, 10),
      label,
      tss,
      ctl: ctlR,
      atl: atlR,
      tsb: tsbR,
      tsbPos: tsbR >= 0 ? tsbR : null,
      tsbNeg: tsbR < 0 ? tsbR : null,
    })
  }

  return result
}

const CHART_DATA = generateMockData()
const TODAY = CHART_DATA[CHART_DATA.length - 1]

// ─── Form zone helpers ────────────────────────────────────────────────────────

interface FormZone {
  label: string
  range: string
  description: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  active: boolean
}

function getFormZones(tsb: number): FormZone[] {
  return [
    {
      label: 'Peak Form',
      range: '> +25',
      description: 'Fully rested. Ideal for A-priority races. Fitness may begin declining.',
      color: '#22d3ee',
      bgClass: 'bg-cyan-500/8',
      borderClass: 'border-cyan-500/25',
      textClass: 'text-cyan-400',
      active: tsb > 25,
    },
    {
      label: 'Optimal',
      range: '+10 to +25',
      description: 'Classic race-ready window. Fatigue absorbed, fitness preserved.',
      color: '#60a5fa',
      bgClass: 'bg-blue-500/8',
      borderClass: 'border-blue-500/25',
      textClass: 'text-blue-400',
      active: tsb >= 10 && tsb <= 25,
    },
    {
      label: 'Fresh',
      range: '0 to +10',
      description: 'Good for B-races or key quality sessions. Slight freshness advantage.',
      color: '#4ade80',
      bgClass: 'bg-green-500/8',
      borderClass: 'border-green-500/25',
      textClass: 'text-green-400',
      active: tsb >= 0 && tsb < 10,
    },
    {
      label: 'Fatigued',
      range: '−30 to 0',
      description: 'Normal productive training zone. Some fatigue is expected and beneficial.',
      color: '#fb923c',
      bgClass: 'bg-orange-500/8',
      borderClass: 'border-orange-500/25',
      textClass: 'text-orange-400',
      active: tsb >= -30 && tsb < 0,
    },
    {
      label: 'Overreaching',
      range: '< −30',
      description: 'Excessive fatigue. Rest required. Injury and illness risk elevated.',
      color: '#f87171',
      bgClass: 'bg-red-500/8',
      borderClass: 'border-red-500/25',
      textClass: 'text-red-400',
      active: tsb < -30,
    },
  ]
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  dataKey: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const ctl = payload.find((p) => p.dataKey === 'ctl')?.value
  const atl = payload.find((p) => p.dataKey === 'atl')?.value
  const tsb = payload.find((p) => p.dataKey === 'tsb')?.value
  const tss = payload.find((p) => p.dataKey === 'tss')?.value

  const tsbColor =
    tsb === undefined ? '#9ca3af'
    : tsb > 10 ? '#60a5fa'
    : tsb > 0 ? '#4ade80'
    : tsb > -30 ? '#fb923c'
    : '#f87171'

  return (
    <div
      className="rounded-xl border border-white/10 shadow-xl"
      style={{
        background: 'rgba(10,10,18,0.95)',
        backdropFilter: 'blur(12px)',
        padding: '12px 16px',
        fontSize: 12,
        minWidth: 160,
      }}
    >
      <p className="text-white/50 font-medium mb-2 text-xs uppercase tracking-widest">{label}</p>
      {tss !== undefined && (
        <div className="flex justify-between gap-6 mb-1">
          <span className="text-white/40">TSS</span>
          <span className="text-white font-semibold">{Math.round(tss)}</span>
        </div>
      )}
      {ctl !== undefined && (
        <div className="flex justify-between gap-6 mb-1">
          <span style={{ color: '#60a5fa' }}>Fitness (CTL)</span>
          <span className="text-white font-semibold">{ctl}</span>
        </div>
      )}
      {atl !== undefined && (
        <div className="flex justify-between gap-6 mb-1">
          <span style={{ color: '#fb923c' }}>Fatigue (ATL)</span>
          <span className="text-white font-semibold">{atl}</span>
        </div>
      )}
      {tsb !== undefined && (
        <div className="flex justify-between gap-6">
          <span style={{ color: tsbColor }}>Form (TSB)</span>
          <span className="font-semibold" style={{ color: tsbColor }}>
            {tsb > 0 ? '+' : ''}{tsb}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingLoadPage() {
  const data = CHART_DATA
  const today = TODAY
  const zones = getFormZones(today.tsb)
  const currentZone = zones.find((z) => z.active)!

  // Ramp rate: weekly CTL change
  const weekAgo = data[data.length - 8]
  const rampRate = Math.round((today.ctl - weekAgo.ctl) * 10) / 10

  // Peak CTL in window
  const peakCtl = Math.max(...data.map((d) => d.ctl))
  const peakDay = data.find((d) => d.ctl === peakCtl)

  // Tick labels: show every ~15 days
  const tickInterval = Math.floor(data.length / 6)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Explore</span>
          </Link>

          <div className="w-px h-4 bg-border mx-1" />

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary leading-tight">
                Performance Management
              </h1>
              <p className="text-xs text-text-secondary leading-none mt-0.5">
                CTL · ATL · TSB · Bannister model
              </p>
            </div>
          </div>

          {/* Today's form badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{
              color: currentZone.color,
              borderColor: `${currentZone.color}30`,
              background: `${currentZone.color}12`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: currentZone.color }}
            />
            {currentZone.label}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* CTL */}
          <div className="bg-surface rounded-2xl border border-border p-4 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ background: 'radial-gradient(ellipse at top left, #60a5fa, transparent 70%)' }}
            />
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              Fitness
            </p>
            <p className="text-3xl font-black text-blue-400 tabular-nums leading-none mb-1">
              {today.ctl}
            </p>
            <p className="text-xs text-text-tertiary">CTL · 42-day avg</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-text-secondary">
              <span className="text-text-tertiary">Peak:</span>
              <span className="text-blue-400 font-semibold">{peakCtl}</span>
              <span className="text-text-tertiary ml-1">{peakDay?.label}</span>
            </div>
          </div>

          {/* ATL */}
          <div className="bg-surface rounded-2xl border border-border p-4 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ background: 'radial-gradient(ellipse at top left, #fb923c, transparent 70%)' }}
            />
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
              Fatigue
            </p>
            <p className="text-3xl font-black text-orange-400 tabular-nums leading-none mb-1">
              {today.atl}
            </p>
            <p className="text-xs text-text-tertiary">ATL · 7-day avg</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {rampRate > 0 ? (
                <TrendingUp className="w-3 h-3 text-orange-400" />
              ) : rampRate < 0 ? (
                <TrendingDown className="w-3 h-3 text-blue-400" />
              ) : (
                <Minus className="w-3 h-3 text-text-tertiary" />
              )}
              <span className="text-text-secondary">
                CTL{' '}
                <span className={rampRate > 0 ? 'text-green-400 font-semibold' : rampRate < 0 ? 'text-blue-400 font-semibold' : 'text-text-tertiary'}>
                  {rampRate >= 0 ? '+' : ''}{rampRate}
                </span>
                {' '}/ wk
              </span>
            </div>
          </div>

          {/* TSB */}
          <div
            className="rounded-2xl border p-4 relative overflow-hidden"
            style={{
              background: `${currentZone.color}08`,
              borderColor: `${currentZone.color}25`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ background: `radial-gradient(ellipse at top left, ${currentZone.color}, transparent 70%)` }}
            />
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: `${currentZone.color}99` }}>
              Form
            </p>
            <p
              className="text-3xl font-black tabular-nums leading-none mb-1"
              style={{ color: currentZone.color }}
            >
              {today.tsb > 0 ? '+' : ''}{today.tsb}
            </p>
            <p className="text-xs" style={{ color: `${currentZone.color}70` }}>
              TSB · CTL − ATL
            </p>
            <div className="mt-3">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${currentZone.color}20`, color: currentZone.color }}
              >
                {currentZone.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Performance Management Chart ──────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Performance Management Chart
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                90 days · mock data for a recreational triathlete
              </p>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-1.5 text-xs text-text-secondary shrink-0">
              {[
                { color: '#60a5fa', label: 'CTL', dash: false },
                { color: '#fb923c', label: 'ATL', dash: true },
                { color: '#6ee7b7', label: 'TSB', dash: false },
              ].map(({ color, label, dash }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <svg width="20" height="8" viewBox="0 0 20 8">
                    {dash ? (
                      <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
                    ) : (
                      <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2.5" />
                    )}
                  </svg>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tsbPosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="tsbNegGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="4 4"
              />
              {/* TSB +25 optimal zone top */}
              <ReferenceLine
                y={25}
                stroke="rgba(96,165,250,0.2)"
                strokeDasharray="3 5"
              />
              {/* TSB -30 overreaching threshold */}
              <ReferenceLine
                y={-30}
                stroke="rgba(248,113,113,0.2)"
                strokeDasharray="3 5"
              />

              {/* TSB shaded areas */}
              <Area
                type="monotone"
                dataKey="tsbPos"
                fill="url(#tsbPosGrad)"
                stroke="none"
                connectNulls={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="tsbNeg"
                fill="url(#tsbNegGrad)"
                stroke="none"
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* CTL — primary line */}
              <Line
                type="monotone"
                dataKey="ctl"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
              />

              {/* ATL — dashed */}
              <Line
                type="monotone"
                dataKey="atl"
                stroke="#fb923c"
                strokeWidth={1.75}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }}
              />

              {/* TSB — fine emerald line */}
              <Line
                type="monotone"
                dataKey="tsb"
                stroke="#6ee7b7"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#6ee7b7', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Zone annotation bar */}
          <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
            <div className="flex items-center gap-1">
              <div className="w-3 h-px" style={{ background: 'rgba(96,165,250,0.4)' }} />
              <span>TSB +25</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-px" style={{ background: 'rgba(248,113,113,0.4)' }} />
              <span>TSB −30</span>
            </div>
            <span>·</span>
            <span>Shaded: positive (green) / negative (red) form</span>
          </div>
        </div>

        {/* ── TSB Form Zones table ──────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">TSB Form Zones</h2>
            <p className="text-xs text-text-secondary mt-0.5">Current zone highlighted</p>
          </div>

          <div className="divide-y divide-border">
            {zones.map((zone) => (
              <div
                key={zone.label}
                className={`flex items-start gap-3 px-4 sm:px-5 py-3.5 transition-colors ${
                  zone.active ? 'bg-white/[0.02]' : ''
                }`}
              >
                {/* Color swatch + active indicator */}
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: zone.color, boxShadow: zone.active ? `0 0 8px ${zone.color}80` : 'none' }}
                  />
                  {zone.active && (
                    <div className="w-px h-3 rounded-full" style={{ background: zone.color + '60' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: zone.active ? zone.color : undefined }}
                    >
                      {zone.label}
                    </span>
                    <code
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: `${zone.color}12`,
                        color: zone.color,
                        border: `1px solid ${zone.color}25`,
                      }}
                    >
                      {zone.range}
                    </code>
                    {zone.active && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: `${zone.color}20`, color: zone.color }}
                      >
                        ← you are here
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {zone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science / methodology card ────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
            <FlaskConical className="w-4 h-4 text-text-secondary shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary">
              Science &amp; Methodology
            </h2>
          </div>

          <div className="px-4 sm:px-5 py-4 space-y-4">
            {/* Model overview */}
            <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
              <p>
                The <span className="text-text-primary font-medium">Bannister impulse-response model</span> (1991) treats
                athletic adaptation as the superposition of two competing processes — a slow-building fitness component
                and a fast-decaying fatigue component — both driven by the same training impulse (TSS).
              </p>
              <p>
                Each day&apos;s load is expressed as a <span className="text-text-primary font-medium">Training Stress Score</span>,
                which normalises effort relative to the athlete&apos;s functional threshold. A 1-hour ride at exactly FTP = 100 TSS.
              </p>
            </div>

            {/* Formula block */}
            <div className="rounded-xl border border-border bg-surface-secondary p-3.5 space-y-2 font-mono text-xs">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-text-secondary">
                <div>
                  <span className="text-blue-400">CTL</span>
                  <span className="text-text-tertiary"> = CTL</span>
                  <sub className="text-text-tertiary text-[9px]">yesterday</sub>
                  <span className="text-text-tertiary"> + (TSS − CTL</span>
                  <sub className="text-text-tertiary text-[9px]">yesterday</sub>
                  <span className="text-text-tertiary">) × </span>
                  <span className="text-blue-400/80">k</span>
                  <sub className="text-blue-400/80 text-[9px]">42</sub>
                </div>
                <div>
                  <span className="text-orange-400">ATL</span>
                  <span className="text-text-tertiary"> = ATL</span>
                  <sub className="text-text-tertiary text-[9px]">yesterday</sub>
                  <span className="text-text-tertiary"> + (TSS − ATL</span>
                  <sub className="text-text-tertiary text-[9px]">yesterday</sub>
                  <span className="text-text-tertiary">) × </span>
                  <span className="text-orange-400/80">k</span>
                  <sub className="text-orange-400/80 text-[9px]">7</sub>
                </div>
                <div>
                  <span className="text-emerald-400">TSB</span>
                  <span className="text-text-tertiary"> = CTL − ATL</span>
                </div>
              </div>
              <p className="text-text-tertiary text-[10px] pt-1 border-t border-border">
                k<sub>n</sub> = 1 − exp(−1/n) where n is the time constant in days
              </p>
            </div>

            {/* Key guidelines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  label: 'Safe Ramp Rate',
                  value: '+3 to +8 CTL/wk',
                  detail: 'More than +8/wk correlates with overuse injury.',
                  color: '#4ade80',
                },
                {
                  label: 'Race-Ready TSB',
                  value: '+10 to +25',
                  detail: 'Target after a 10–14 day taper from peak load.',
                  color: '#60a5fa',
                },
                {
                  label: 'Productive Training',
                  value: 'TSB −10 to −30',
                  detail: 'Fatigue is present but fitness is being built.',
                  color: '#fb923c',
                },
                {
                  label: 'Detraining Risk',
                  value: 'TSB > +30',
                  detail: 'Extended rest reduces CTL. Plan a return-to-train block.',
                  color: '#a78bfa',
                },
              ].map(({ label, value, detail, color }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border p-3 text-xs space-y-1"
                >
                  <p className="font-semibold" style={{ color }}>{label}</p>
                  <p className="font-mono font-bold text-text-primary text-sm">{value}</p>
                  <p className="text-text-secondary leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>

            {/* References */}
            <div className="pt-1 border-t border-border space-y-1 text-xs text-text-tertiary">
              <p className="font-medium text-text-secondary mb-1.5">References</p>
              <p>Bannister EW et al. (1991). Modeling elite athletic performance. <em>J Appl Physiol</em>.</p>
              <p>Busso T. (2003). Variable dose-response relationship between exercise training and performance. <em>Med Sci Sports Exerc</em>.</p>
              <p>Coggan A & Allen H. <em>Training and Racing with a Power Meter</em>, VeloPress.</p>
              <p className="pt-1.5 text-text-tertiary/60">
                TSS on this page is estimated from workout duration and active calories (Apple Health). Power meter data would yield more precise values.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
