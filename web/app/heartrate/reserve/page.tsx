'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, FlaskConical, HeartPulse } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGE = 35
const HMAX = Math.round((208 - 0.7 * AGE) * 10) / 10  // Tanaka: 183.5
const RHR_TODAY = 52
const RHR_90_DAYS_AGO = 58
const HRR_TODAY = Math.round((HMAX - RHR_TODAY) * 10) / 10  // 131.5

// ─── Mock data generation ─────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateTrendData() {
  const data: { date: string; rhr: number; hrr: number; label: string }[] = []
  const now = new Date('2026-03-19')

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)

    const seed = i * 7 + 13
    const noise = (seededRandom(seed) - 0.5) * 4  // ±2 bpm noise
    const progress = (89 - i) / 89                 // 0→1 over the 90 days
    // RHR declines from ~58 to ~52 with noise
    const rhr = Math.round(RHR_90_DAYS_AGO - progress * (RHR_90_DAYS_AGO - RHR_TODAY) + noise)
    const hrr = Math.round((HMAX - rhr) * 10) / 10

    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    data.push({ date: d.toISOString().slice(0, 10), rhr, hrr, label })
  }

  return data
}

const trendData = generateTrendData()

// ─── Karvonen zones ───────────────────────────────────────────────────────────

interface Zone {
  number: number
  name: string
  description: string
  loInt: number    // intensity % lower bound (0–1)
  hiInt: number    // intensity % upper bound (0–1)
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  pillClass: string
}

const ZONES: Zone[] = [
  {
    number: 1,
    name: 'Recovery',
    description: 'Active recovery and light movement. Enhances circulation and aids muscle repair without taxing the system.',
    loInt: 0.50, hiInt: 0.60,
    color: '#3b82f6',
    bgClass: 'bg-blue-500/8 dark:bg-blue-500/10',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800/60',
    pillClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    number: 2,
    name: 'Aerobic Base',
    description: 'Fat oxidation and aerobic efficiency. The cornerstone of endurance development — sustainable conversational effort.',
    loInt: 0.60, hiInt: 0.70,
    color: '#22c55e',
    bgClass: 'bg-green-500/8 dark:bg-green-500/10',
    textClass: 'text-green-600 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800/60',
    pillClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  {
    number: 3,
    name: 'Tempo',
    description: 'Comfortably hard. Improves lactate clearance and cardiovascular output. Sustainable for 20–60 minutes.',
    loInt: 0.70, hiInt: 0.80,
    color: '#eab308',
    bgClass: 'bg-yellow-500/8 dark:bg-yellow-500/10',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    borderClass: 'border-yellow-200 dark:border-yellow-800/60',
    pillClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  {
    number: 4,
    name: 'Threshold',
    description: 'At or near lactate threshold. Builds speed and power. Hard to sustain beyond 20–30 minutes.',
    loInt: 0.80, hiInt: 0.90,
    color: '#f97316',
    bgClass: 'bg-orange-500/8 dark:bg-orange-500/10',
    textClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-800/60',
    pillClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  {
    number: 5,
    name: 'VO₂ Max',
    description: 'Maximum oxygen uptake intensity. Increases aerobic ceiling. Sustainable only in short, high-intensity intervals.',
    loInt: 0.90, hiInt: 1.00,
    color: '#ef4444',
    bgClass: 'bg-red-500/8 dark:bg-red-500/10',
    textClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800/60',
    pillClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
]

function karvonenBpm(rhr: number, hmax: number, intensity: number): number {
  return Math.round(rhr + intensity * (hmax - rhr))
}

// ─── HRR fitness scale ────────────────────────────────────────────────────────

interface FitnessLevel {
  label: string
  minHRR: number
  maxHRR: number
  color: string
  trackClass: string
}

const FITNESS_SCALE: FitnessLevel[] = [
  { label: 'Needs Work', minHRR: 0,   maxHRR: 100, color: '#ef4444', trackClass: 'bg-red-400' },
  { label: 'Average',    minHRR: 100, maxHRR: 120, color: '#f97316', trackClass: 'bg-orange-400' },
  { label: 'Good',       minHRR: 120, maxHRR: 135, color: '#eab308', trackClass: 'bg-yellow-400' },
  { label: 'Excellent',  minHRR: 135, maxHRR: 150, color: '#22c55e', trackClass: 'bg-green-400' },
  { label: 'Elite',      minHRR: 150, maxHRR: 175, color: '#8b5cf6', trackClass: 'bg-violet-400' },
]

const HRR_SCALE_MIN = 0
const HRR_SCALE_MAX = 175

function getFitnessCategory(hrr: number): FitnessLevel {
  for (const level of [...FITNESS_SCALE].reverse()) {
    if (hrr >= level.minHRR) return level
  }
  return FITNESS_SCALE[0]
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-300 capitalize">{entry.name}:</span>
          <span className="font-mono font-bold text-gray-900 dark:text-gray-100 ml-auto pl-2">
            {entry.value} bpm
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Trend badge helper ───────────────────────────────────────────────────────

function TrendBadge({ value, unit, direction }: { value: string; unit?: string; direction: 'up' | 'down' | 'neutral' }) {
  const isGoodUp = direction === 'up'
  const isGoodDown = direction === 'down'
  if (isGoodUp) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
        <TrendingUp className="w-3 h-3" />
        {value}{unit}
      </span>
    )
  }
  if (isGoodDown) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
        <TrendingDown className="w-3 h-3" />
        {value}{unit}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />
      {value}{unit}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeartRateReservePage() {
  const currentFitness = getFitnessCategory(HRR_TODAY)

  // Marker position on the fitness scale (clamped 0–100%)
  const markerPct = Math.min(100, Math.max(0, ((HRR_TODAY - HRR_SCALE_MIN) / (HRR_SCALE_MAX - HRR_SCALE_MIN)) * 100))

  // Interval for x-axis ticks: show ~10 labels across 90 days
  const tickInterval = Math.floor(trendData.length / 9)

  const tooltipStyle = {
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    padding: 0,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to heart rate"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Heart Rate Reserve</h1>
            <p className="text-sm text-text-secondary">Karvonen formula training zones &amp; fitness trend</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero accent strip ── */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-r from-violet-50 via-violet-50/60 to-purple-50 dark:from-violet-950/40 dark:via-violet-950/20 dark:to-purple-950/30 px-5 py-4">
          <div className="absolute inset-0 opacity-10 dark:opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 55%), radial-gradient(circle at 20% 80%, #7c3aed 0%, transparent 45%)',
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">
                Today&apos;s HRR
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-violet-700 dark:text-violet-300 tabular-nums">
                  {HRR_TODAY}
                </span>
                <span className="text-lg font-medium text-violet-500 dark:text-violet-400">bpm</span>
                <span className="text-sm text-violet-600/70 dark:text-violet-400/60">
                  +6.5 over 90 days
                </span>
              </div>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-white/60 dark:bg-black/20 rounded-xl px-4 py-2.5 border border-violet-100 dark:border-violet-800/40">
                <p className="text-xs text-violet-600/70 dark:text-violet-400/60 font-medium">Formula</p>
                <p className="text-sm font-bold text-violet-800 dark:text-violet-200 font-mono">HRmax − RHR</p>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-xl px-4 py-2.5 border border-violet-100 dark:border-violet-800/40">
                <p className="text-xs text-violet-600/70 dark:text-violet-400/60 font-medium">Level</p>
                <p className="text-sm font-bold" style={{ color: currentFitness.color }}>{currentFitness.label}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Resting HR',
              value: RHR_TODAY,
              unit: 'bpm',
              sub: 'vs 58 bpm, 90d ago',
              trend: { value: '−6', direction: 'down' as const },
              color: 'text-red-500 dark:text-red-400',
              iconColor: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40',
            },
            {
              label: 'Est. HRmax',
              value: HMAX,
              unit: 'bpm',
              sub: `Tanaka: 208−0.7×${AGE}`,
              trend: { value: 'stable', direction: 'neutral' as const },
              color: 'text-orange-500 dark:text-orange-400',
              iconColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/40',
            },
            {
              label: 'HR Reserve',
              value: HRR_TODAY,
              unit: 'bpm',
              sub: 'HRmax − RHR',
              trend: { value: '+6.5', direction: 'up' as const },
              color: 'text-violet-600 dark:text-violet-400',
              iconColor: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/40',
            },
          ].map(({ label, value, unit, sub, trend, color, iconColor }) => (
            <div
              key={label}
              className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1.5"
            >
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
              <div className={`text-2xl font-black tabular-nums ${color}`}>
                {value}
                <span className="text-sm font-semibold ml-1 opacity-70">{unit}</span>
              </div>
              <p className="text-xs text-text-tertiary leading-tight">{sub}</p>
              <TrendBadge value={trend.value} direction={trend.direction} />
            </div>
          ))}
        </div>

        {/* ── 90-day trend chart ── */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">90-Day HRR Trend</h2>
              <p className="text-xs text-text-secondary mt-0.5">Daily heart rate reserve with resting HR overlay</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary">HRR improving</p>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">+6.5 bpm</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={trendData}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="hrrGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(139,92,246,0.08)"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 8', 'dataMax + 8']}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} contentStyle={tooltipStyle} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-text-secondary capitalize">{value}</span>
                )}
                wrapperStyle={{ paddingTop: 12 }}
              />
              <ReferenceLine
                y={RHR_TODAY}
                stroke="rgba(239,68,68,0.3)"
                strokeDasharray="4 3"
              />
              <Line
                type="monotone"
                dataKey="hrr"
                name="HRR"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="rhr"
                name="RHR"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Karvonen zones ── */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-text-primary">Karvonen Training Zones</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Target HR = RHR + intensity% × (HRmax − RHR) &nbsp;·&nbsp; Personalised to your current HRR
            </p>
          </div>
          <div className="space-y-2.5">
            {ZONES.map((zone) => {
              const loBpm = karvonenBpm(RHR_TODAY, HMAX, zone.loInt)
              const hiBpm = karvonenBpm(RHR_TODAY, HMAX, zone.hiInt)
              const loLabel = `${Math.round(zone.loInt * 100)}%`
              const hiLabel = `${Math.round(zone.hiInt * 100)}%`

              return (
                <div
                  key={zone.number}
                  className={`rounded-2xl border ${zone.borderClass} ${zone.bgClass} px-4 py-3.5 flex items-start gap-4`}
                >
                  {/* Zone number */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white mt-0.5"
                    style={{ backgroundColor: zone.color }}
                  >
                    Z{zone.number}
                  </div>

                  {/* Zone info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${zone.textClass}`}>{zone.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${zone.pillClass}`}>
                        {loLabel}–{hiLabel} HRR
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{zone.description}</p>
                  </div>

                  {/* BPM range */}
                  <div className="text-right shrink-0">
                    <p className={`text-base font-black tabular-nums ${zone.textClass}`}>
                      {loBpm}–{hiBpm}
                    </p>
                    <p className="text-xs text-text-tertiary">bpm</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── HRR Fitness Scale ── */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-text-primary">HRR Fitness Scale</h2>
            <p className="text-xs text-text-secondary mt-0.5">Where your current {HRR_TODAY} bpm reserve falls</p>
          </div>

          {/* Bar track */}
          <div className="relative">
            <div className="flex h-4 rounded-full overflow-hidden">
              {FITNESS_SCALE.map((level) => {
                const segWidth = ((level.maxHRR - level.minHRR) / (HRR_SCALE_MAX - HRR_SCALE_MIN)) * 100
                return (
                  <div
                    key={level.label}
                    className={`h-full ${level.trackClass} opacity-70`}
                    style={{ width: `${segWidth}%` }}
                  />
                )
              })}
            </div>

            {/* Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all"
              style={{ left: `${markerPct}%` }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 shadow-lg"
                style={{ backgroundColor: currentFitness.color }}
              />
            </div>

            {/* HRR value label */}
            <div
              className="absolute top-6 -translate-x-1/2 transition-all"
              style={{ left: `${markerPct}%` }}
            >
              <p className="text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: currentFitness.color }}>
                {HRR_TODAY} bpm
              </p>
            </div>
          </div>

          {/* Scale labels */}
          <div className="flex mt-8 text-xs">
            {FITNESS_SCALE.map((level, i) => {
              const segWidth = ((level.maxHRR - level.minHRR) / (HRR_SCALE_MAX - HRR_SCALE_MIN)) * 100
              return (
                <div key={level.label} className="text-center" style={{ width: `${segWidth}%` }}>
                  <p
                    className="font-semibold truncate"
                    style={{ color: i === FITNESS_SCALE.findIndex((l) => l.label === currentFitness.label) ? level.color : undefined }}
                  >
                    {level.label}
                  </p>
                  <p className="text-text-tertiary text-xs">
                    {level.minHRR}+
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science card ── */}
        <div className="bg-gray-950 dark:bg-gray-950 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-900/40 border border-violet-700/40 flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h2 className="text-sm font-bold text-gray-100">The Science Behind HRR</h2>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-gray-400">
            <div>
              <p className="font-semibold text-gray-200 mb-0.5">Heart Rate Reserve</p>
              <p>
                HRR = HRmax − RHR. First formalised by Karvonen et al. (1957), it represents the functional
                range available to the cardiovascular system during exercise. A higher HRR indicates greater
                cardiac adaptability and aerobic potential.
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-200 mb-0.5">Karvonen Formula (1957)</p>
              <p>
                Target HR = RHR + intensity × (HRmax − RHR). Unlike %HRmax zones, Karvonen zones are
                individually anchored to your resting heart rate, making them far more accurate for
                prescribing training intensity — particularly for athletes with low resting HR.
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-200 mb-0.5">Tanaka HRmax Formula</p>
              <p>
                HRmax ≈ 208 − 0.7 × age (Tanaka, Monahan &amp; Seals, 2001). Validated across 351 studies
                and over 18,000 subjects, this regression outperforms the classic &ldquo;220 − age&rdquo; formula,
                especially in older adults. For age {AGE}, HRmax = {HMAX} bpm.
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-200 mb-0.5">Widening HRR = Improving Fitness</p>
              <p>
                As aerobic fitness improves, resting HR falls due to enhanced vagal (parasympathetic) tone —
                the heart becomes more efficient at rest. Because HRmax is relatively stable, a declining RHR
                directly widens HRR, signalling improved cardiac efficiency and a larger aerobic training window.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'Age', val: `${AGE} yrs` },
                { key: 'HRmax', val: `${HMAX} bpm` },
                { key: 'RHR', val: `${RHR_TODAY} bpm` },
                { key: 'HRR', val: `${HRR_TODAY} bpm` },
              ].map(({ key, val }) => (
                <div key={key} className="flex items-center gap-1.5 bg-gray-800/60 rounded-lg px-2.5 py-1">
                  <span className="text-xs text-gray-500">{key}</span>
                  <span className="text-xs font-mono font-bold text-violet-300">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
