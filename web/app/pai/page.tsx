'use client'

import Link from 'next/link'
import { ArrowLeft, FlaskConical, TrendingUp, Zap } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts'

// ─── Mock data ────────────────────────────────────────────────────────────────

const CURRENT_PAI = 127
const PAI_MAX_RING = 150

const dailyData = [
  { day: 'Mon', pai: 8 },
  { day: 'Tue', pai: 22 },
  { day: 'Wed', pai: 0 },
  { day: 'Thu', pai: 45 },
  { day: 'Fri', pai: 18 },
  { day: 'Sat', pai: 0 },
  { day: 'Sun', pai: 34 },
]

const weeklyHistory = [
  { week: 'W1', pai: 45 },
  { week: 'W2', pai: 72 },
  { week: 'W3', pai: 88 },
  { week: 'W4', pai: 62 },
  { week: 'W5', pai: 105 },
  { week: 'W6', pai: 118 },
  { week: 'W7', pai: 92 },
  { week: 'W8', pai: 134 },
  { week: 'W9', pai: 110 },
  { week: 'W10', pai: 89 },
  { week: 'W11', pai: 127 },
  { week: 'W12', pai: 127 },
]

const zoneData = [
  {
    zone: 'Z1',
    label: 'Recovery',
    range: '50–60% HRmax',
    ratePerMin: 0.5,
    minutes: 15,
    pai: 7.5,
    color: '#3b82f6',
    bgLight: 'rgba(59,130,246,0.12)',
  },
  {
    zone: 'Z2',
    label: 'Aerobic',
    range: '60–70% HRmax',
    ratePerMin: 1.0,
    minutes: 45,
    pai: 45,
    color: '#22c55e',
    bgLight: 'rgba(34,197,94,0.12)',
  },
  {
    zone: 'Z3',
    label: 'Tempo',
    range: '70–80% HRmax',
    ratePerMin: 2.5,
    minutes: 18,
    pai: 45,
    color: '#eab308',
    bgLight: 'rgba(234,179,8,0.12)',
  },
  {
    zone: 'Z4',
    label: 'Threshold',
    range: '80–90% HRmax',
    ratePerMin: 6.0,
    minutes: 5,
    pai: 30,
    color: '#f97316',
    bgLight: 'rgba(249,115,22,0.12)',
  },
  {
    zone: 'Z5',
    label: 'VO₂ Max',
    range: '90%+ HRmax',
    ratePerMin: 14.0,
    minutes: 0,
    pai: 0,
    color: '#ef4444',
    bgLight: 'rgba(239,68,68,0.12)',
  },
]

const paiCategories = [
  { label: 'Inactive', range: '< 25', color: '#71717a', bg: 'rgba(113,113,122,0.12)', active: false },
  { label: 'Low Activity', range: '25–49', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', active: false },
  { label: 'Moderately Active', range: '50–99', color: '#f97316', bg: 'rgba(249,115,22,0.12)', active: false },
  { label: 'Active', range: '100–149', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', active: true },
  { label: 'Highly Active', range: '150+', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', active: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDailyColor(pai: number): string {
  if (pai >= 14) return '#22c55e'
  if (pai >= 7) return '#f97316'
  if (pai > 0) return '#6b7280'
  return '#374151'
}

// ─── Circular Gauge SVG ───────────────────────────────────────────────────────

function CircularGauge({ value, max }: { value: number; max: number }) {
  const radius = 88
  const stroke = 10
  const cx = 110
  const cy = 110
  const circumference = 2 * Math.PI * radius
  // Ring spans 270 degrees (from 135° to 45°, going clockwise)
  const arcLength = circumference * (270 / 360)
  const filled = Math.min(value / max, 1) * arcLength
  const targetFraction = 100 / max
  // Angle for the target marker: 135 degrees start + fraction * 270 degrees
  const targetAngle = 135 + targetFraction * 270
  const targetRad = (targetAngle * Math.PI) / 180
  const markerX = cx + radius * Math.cos(targetRad)
  const markerY = cy + radius * Math.sin(targetRad)

  return (
    <svg
      width={220}
      height={220}
      viewBox="0 0 220 220"
      className="drop-shadow-[0_0_24px_rgba(34,197,94,0.3)]"
      aria-label={`PAI Score: ${value} out of ${max}`}
    >
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        className="text-border opacity-40"
        transform={`rotate(135 ${cx} ${cy})`}
      />

      {/* Filled arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        filter="url(#glow)"
        style={{
          transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      {/* Target marker at 100 */}
      <circle
        cx={markerX}
        cy={markerY}
        r={5}
        fill="#22c55e"
        stroke="var(--marker-border, #fff)"
        strokeWidth={2}
        className="[stroke:hsl(var(--background))]"
        filter="url(#glow)"
      />

      {/* Score text */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="46"
        fontWeight="700"
        fontFamily="'DM Mono', 'Fira Code', monospace"
        fill="#22c55e"
        letterSpacing="-2"
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="500"
        fontFamily="system-ui, sans-serif"
        fill="currentColor"
        className="text-text-secondary fill-current opacity-70"
        letterSpacing="2"
        textTransform="uppercase"
      >
        PAI / WEEK
      </text>
    </svg>
  )
}

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'hsl(var(--surface))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaiPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">PAI Score</h1>
            <p className="text-sm text-text-secondary">NTNU-validated weekly fitness score</p>
          </div>
          <div
            className="h-6 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Active
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── Hero: green gradient banner ──────────────────────────────────── */}
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(22,163,74,0.04) 50%, transparent 100%)',
          }}
        >
          {/* Top label strip */}
          <div
            className="px-5 py-2 border-b border-border flex items-center gap-2"
            style={{ background: 'rgba(34,197,94,0.06)' }}
          >
            <Zap className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#22c55e' }}>
              This Week
            </span>
            <span className="ml-auto text-xs text-text-secondary tabular-nums">
              Mar 13 – Mar 19, 2026
            </span>
          </div>

          {/* Gauge + metadata */}
          <div className="px-5 py-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Circular gauge */}
            <div className="flex-shrink-0">
              <CircularGauge value={CURRENT_PAI} max={PAI_MAX_RING} />
            </div>

            {/* Side info */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: '#22c55e' }}
                >
                  Active (target!) ✓
                </p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  Maintains ≥100 PAI — associated with a{' '}
                  <span className="font-semibold text-text-primary">46% lower</span> cardiovascular
                  mortality risk per the HUNT study.
                </p>
              </div>

              {/* Mini stat row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-secondary rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-text-primary tabular-nums">83</p>
                  <p className="text-xs text-text-secondary mt-0.5">Min active</p>
                </div>
                <div className="bg-surface-secondary rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-text-primary tabular-nums">4</p>
                  <p className="text-xs text-text-secondary mt-0.5">Active days</p>
                </div>
                <div className="bg-surface-secondary rounded-xl p-3 text-center">
                  <p className="text-lg font-bold tabular-nums" style={{ color: '#22c55e' }}>+27</p>
                  <p className="text-xs text-text-secondary mt-0.5">Above target</p>
                </div>
              </div>

              {/* Progress bar to 150 max */}
              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                  <span>0</span>
                  <span className="text-green-500 font-medium">100 target</span>
                  <span>150</span>
                </div>
                <div className="relative h-2.5 rounded-full overflow-hidden bg-border/50">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((CURRENT_PAI / 150) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #4ade80, #16a34a)',
                    }}
                  />
                  {/* Target marker line */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-green-400 opacity-80"
                    style={{ left: `${(100 / 150) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily breakdown bar chart ─────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">7-Day Daily Breakdown</h2>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥14
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />7–13
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />&lt;7
              </span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-4">Daily PAI target: 14.3/day (100÷7)</p>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                width={28}
                domain={[0, 50]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} PAI`, 'Daily Score']}
                cursor={{ fill: 'rgba(34,197,94,0.05)', radius: 4 }}
              />
              <ReferenceLine
                y={14.3}
                stroke="#22c55e"
                strokeDasharray="5 3"
                strokeOpacity={0.6}
                label={{
                  value: '14.3 target',
                  fontSize: 10,
                  fill: '#22c55e',
                  position: 'insideTopRight',
                }}
              />
              <Bar dataKey="pai" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {dailyData.map((entry, i) => (
                  <Cell key={i} fill={getDailyColor(entry.pai)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Zone breakdown ────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">Heart Rate Zone Breakdown</h2>
            <span className="ml-auto text-xs text-text-secondary">This week</span>
          </div>

          <div className="divide-y divide-border">
            {zoneData.map((z) => {
              const maxPaiInSet = Math.max(...zoneData.map((d) => d.pai))
              const barPct = maxPaiInSet > 0 ? (z.pai / maxPaiInSet) * 100 : 0
              return (
                <div key={z.zone} className="px-4 py-3" style={{ background: z.minutes > 0 ? z.bgLight : undefined }}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Zone label */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: z.bgLight, color: z.color, border: `1px solid ${z.color}30` }}
                      >
                        {z.zone}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary leading-tight">{z.label}</p>
                        <p className="text-xs text-text-secondary">{z.range}</p>
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-text-secondary tabular-nums">
                        {z.ratePerMin} PAI/min
                      </p>
                    </div>
                  </div>

                  {/* Progress bar + stats */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%`, background: z.color }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs tabular-nums flex-shrink-0">
                      <span className="text-text-secondary">{z.minutes} min</span>
                      <span
                        className="font-semibold"
                        style={{ color: z.minutes > 0 ? z.color : 'var(--text-tertiary)' }}
                      >
                        +{z.pai} PAI
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Zone total */}
          <div className="px-4 py-3 border-t border-border bg-surface-secondary flex items-center justify-between">
            <span className="text-sm text-text-secondary font-medium">Total this week</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#22c55e' }}>
              {zoneData.reduce((s, z) => s + z.pai, 0).toFixed(1)} PAI earned
            </span>
          </div>
        </div>

        {/* ── 12-Week Trend area chart ──────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">12-Week PAI Trend</h2>
              <p className="text-xs text-text-secondary mt-0.5">Weekly score history</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">Avg</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: '#22c55e' }}>
                {Math.round(weeklyHistory.reduce((s, w) => s + w.pai, 0) / weeklyHistory.length)} PAI
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyHistory} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="paiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                width={28}
                domain={[0, 160]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} PAI`, 'Weekly Score']}
              />
              <ReferenceLine
                y={100}
                stroke="#22c55e"
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                label={{
                  value: '100 PAI target',
                  fontSize: 10,
                  fill: '#22c55e',
                  position: 'insideTopRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="pai"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#paiAreaGradient)"
                dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── PAI Category Reference ────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">PAI Categories</h2>
          </div>
          <div className="divide-y divide-border">
            {paiCategories.map((cat) => (
              <div
                key={cat.label}
                className="px-4 py-3 flex items-center gap-3"
                style={cat.active ? { background: cat.bg } : undefined}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: cat.color }}
                />
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: cat.active ? cat.color : 'inherit' }}
                  >
                    {cat.label}
                    {cat.active && (
                      <span
                        className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        You are here
                      </span>
                    )}
                  </span>
                  <span
                    className="text-xs tabular-nums font-medium"
                    style={{ color: cat.color }}
                  >
                    {cat.range} PAI
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science Card ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border border-border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, transparent 60%)',
          }}
        >
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-semibold text-text-primary">The Science Behind PAI</h2>
          </div>
          <div className="px-4 py-4 space-y-4">
            {/* Key stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">200K+</p>
                <p className="text-xs text-text-secondary mt-0.5">Person-years</p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold" style={{ color: '#22c55e' }}>46%</p>
                <p className="text-xs text-text-secondary mt-0.5">Lower CV risk</p>
              </div>
              <div className="bg-surface-secondary rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">NTNU</p>
                <p className="text-xs text-text-secondary mt-0.5">Norway research</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2.5 text-sm text-text-secondary leading-relaxed">
              <p>
                PAI is derived from the landmark{' '}
                <span className="text-text-primary font-medium">HUNT Study</span> — one of the largest
                population health studies ever conducted, tracking over{' '}
                <span className="text-text-primary font-medium">200,000 person-years</span> in Trondheim,
                Norway.
              </p>
              <p>
                Participants maintaining ≥100 PAI per week showed a{' '}
                <span className="font-semibold" style={{ color: '#22c55e' }}>
                  46% reduction in cardiovascular mortality
                </span>{' '}
                and a{' '}
                <span className="font-semibold text-text-primary">25% reduction in all-cause mortality</span>{' '}
                compared to sedentary individuals.
              </p>
              <p>
                Unlike step counts, PAI rewards{' '}
                <span className="text-text-primary font-medium">intensity over volume</span> — 20 minutes of
                running earns more PAI than an hour of slow walking, reflecting what the cardiovascular
                system actually experiences. Scores decay daily, keeping you accountable week to week.
              </p>
            </div>

            {/* Source attribution */}
            <div
              className="rounded-lg px-3 py-2.5 text-xs text-text-secondary border border-border"
              style={{ background: 'rgba(34,197,94,0.05)' }}
            >
              <span className="font-medium text-text-primary">Source:</span> Nes BM, et al.{' '}
              <em>Personal Activity Intelligence (PAI): A cardiovascular risk score...</em> Progress in
              Cardiovascular Diseases. NTNU, 2017. Validated across sex, age, and fitness levels.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
