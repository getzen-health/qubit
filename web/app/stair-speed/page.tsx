'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'

// ─── Mock data generation ─────────────────────────────────────────────────────
// 90 days window, readings on ~45 of those days
// Ascent: 0.60 → 0.67 m/s, slight upward trend with day-to-day variability
// Descent: 5–15% faster than ascent

const SEED_DAYS: number[] = [
  0, 2, 4, 6, 9, 11, 13, 15, 17, 19,
  21, 23, 26, 28, 30, 32, 34, 37, 39, 41,
  43, 45, 47, 49, 51, 53, 56, 58, 60, 62,
  64, 66, 68, 70, 72, 74, 76, 78, 80, 82,
  84, 86, 87, 88, 89,
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function pseudoRandom(seed: number): number {
  // Simple deterministic pseudo-random [0, 1)
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const trendData: { date: string; label: string; ascent: number; descent: number }[] = SEED_DAYS.map(
  (daysAgo, i) => {
    const d = new Date(2026, 2, 19) // 2026-03-19 (today)
    d.setDate(d.getDate() - (89 - daysAgo))
    const dateStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const t = daysAgo / 89 // 0 = oldest, 1 = newest
    const base = lerp(0.60, 0.67, t)
    const noise = (pseudoRandom(i * 3 + 7) - 0.5) * 0.12 // ±0.06 m/s noise
    const ascent = Math.round((base + noise) * 100) / 100

    const descentBoost = 0.05 + pseudoRandom(i * 5 + 13) * 0.10 // 5–15%
    const descent = Math.round(ascent * (1 + descentBoost) * 100) / 100

    return { date: dateStr, label, ascent, descent }
  }
)

// ─── Derived stats ────────────────────────────────────────────────────────────
const latestAscent = trendData[trendData.length - 1].ascent
const latestDescent = trendData[trendData.length - 1].descent

const ascentValues = trendData.map((r) => r.ascent)
const avg90Ascent = Math.round((ascentValues.reduce((s, v) => s + v, 0) / ascentValues.length) * 100) / 100

// Trend: compare first-month avg (first 15 readings) vs last-month avg (last 15 readings)
const firstMonth = trendData.slice(0, 15).map((r) => r.ascent)
const lastMonth = trendData.slice(-15).map((r) => r.ascent)
const firstMonthAvg = firstMonth.reduce((s, v) => s + v, 0) / firstMonth.length
const lastMonthAvg = lastMonth.reduce((s, v) => s + v, 0) / lastMonth.length
const trend90d = Math.round((lastMonthAvg - firstMonthAvg) * 100) / 100

const totalReadings = trendData.length

// ─── Level classification ─────────────────────────────────────────────────────
type Level = 'excellent' | 'good' | 'fair' | 'low'

function classifyLevel(speed: number): Level {
  if (speed >= 0.8) return 'excellent'
  if (speed >= 0.6) return 'good'
  if (speed >= 0.4) return 'fair'
  return 'low'
}

const LEVEL_CONFIG: Record<
  Level,
  {
    label: string
    range: string
    description: string
    color: string
    colorClass: string
    bgClass: string
    borderClass: string
    textClass: string
  }
> = {
  excellent: {
    label: 'Excellent',
    range: '≥ 0.80 m/s',
    description: 'Top 20% for most age groups',
    color: '#22c55e',
    colorClass: 'bg-green-500',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-400',
  },
  good: {
    label: 'Good',
    range: '0.60–0.79 m/s',
    description: 'Healthy active adult range',
    color: '#3b82f6',
    colorClass: 'bg-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
  },
  fair: {
    label: 'Fair',
    range: '0.40–0.59 m/s',
    description: 'Below average — strength training recommended',
    color: '#eab308',
    colorClass: 'bg-yellow-500',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    textClass: 'text-yellow-400',
  },
  low: {
    label: 'Low',
    range: '< 0.40 m/s',
    description: 'Clinical threshold — consider physiotherapy',
    color: '#f97316',
    colorClass: 'bg-orange-500',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
  },
}

const currentLevel = classifyLevel(latestAscent)
const cfg = LEVEL_CONFIG[currentLevel]

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

const REFERENCE_LEVELS: Level[] = ['excellent', 'good', 'fair', 'low']

const SCIENCE_FACTS = [
  {
    title: 'Fall risk predictor',
    body: 'Stair speed < 0.5 m/s predicts 2.5× higher fall risk (Landi et al., J Am Geriatr Soc, 2020). Stair ascent speed is one of the strongest single-metric predictors of injurious falls in community-dwelling adults.',
  },
  {
    title: 'Quadriceps link',
    body: 'Stair ascent speed correlates with quadriceps peak torque at r = 0.76 and serves as an early sarcopenia marker. Decline often precedes clinically measurable muscle mass loss by 12–24 months.',
  },
  {
    title: 'Improvement timeline',
    body: 'Progressive resistance training 3× per week over 8 weeks produces a 15–25% stair speed improvement in sedentary to lightly active adults. Eccentric loading protocols show the highest transfer to descent speed.',
  },
  {
    title: 'Passive measurement',
    body: 'iPhone 8+ (iOS 14+) captures stair ascent and descent speed automatically using the built-in accelerometer and barometric altimeter. No workout logging required — carry your phone while climbing stairs.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function StairSpeedPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Stair Speed</h1>
            <p className="text-sm text-text-secondary">90-day ascent &amp; descent analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero stat ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 ${cfg.bgClass} ${cfg.borderClass}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Latest Ascent Speed
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-bold tabular-nums ${cfg.textClass}`}>
                  {latestAscent.toFixed(2)}
                </span>
                <span className="text-xl text-text-secondary">m/s</span>
              </div>
              <span
                className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${cfg.colorClass}/20 ${cfg.textClass} ring-1 ring-inset`}
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
              <p className="text-xs text-text-secondary mt-1.5">{cfg.description}</p>
            </div>
            <div className="text-right space-y-3">
              <div>
                <p className="text-lg font-bold text-blue-400 tabular-nums">{avg90Ascent.toFixed(2)}</p>
                <p className="text-xs text-text-secondary">90d avg ascent</p>
              </div>
              <div>
                <p className="text-lg font-bold text-teal-400 tabular-nums">{latestDescent.toFixed(2)}</p>
                <p className="text-xs text-text-secondary">latest descent</p>
              </div>
            </div>
          </div>

          {/* Speed gauge bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-text-secondary mb-1.5">
              <span>0.0</span>
              <span className="text-orange-400">0.4 Low</span>
              <span className="text-yellow-400">0.6 Good</span>
              <span className="text-green-400">0.8 Excellent</span>
              <span>1.0</span>
            </div>
            <div className="relative h-3 bg-surface-secondary rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div className="h-full bg-orange-500/25" style={{ width: '40%' }} />
                <div className="h-full bg-yellow-500/25" style={{ width: '20%' }} />
                <div className="h-full bg-blue-500/25" style={{ width: '20%' }} />
                <div className="h-full bg-green-500/25" style={{ width: '20%' }} />
              </div>
              <div
                className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow"
                style={{ left: `calc(${Math.min(latestAscent / 1.0, 1) * 100}% - 3px)` }}
              />
            </div>
          </div>
        </div>

        {/* ── Dual line trend chart ───────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-text-primary">90-Day Trend</h3>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-blue-500 rounded" />
                Ascent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 bg-teal-400 rounded" />
                Descent
              </span>
            </div>
          </div>
          <p className="text-xs text-text-secondary opacity-60 mb-4">m/s · dashed lines = Good (0.60) and Excellent (0.80) thresholds</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0.4, 1.0]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number, name: string) => [
                  `${val.toFixed(2)} m/s`,
                  name === 'ascent' ? 'Ascent' : 'Descent',
                ]}
                labelFormatter={(label: string) => label}
              />
              <ReferenceLine
                y={0.6}
                stroke="#3b82f6"
                strokeDasharray="5 3"
                strokeOpacity={0.55}
                label={{ value: 'Good', fill: '#3b82f6', fontSize: 10, position: 'right' }}
              />
              <ReferenceLine
                y={0.8}
                stroke="#22c55e"
                strokeDasharray="5 3"
                strokeOpacity={0.55}
                label={{ value: 'Excellent', fill: '#22c55e', fontSize: 10, position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="ascent"
                name="ascent"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="descent"
                name="descent"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-blue-400 tabular-nums">{avg90Ascent.toFixed(2)}</p>
            <p className="text-xs text-text-secondary mt-0.5">90d avg ascent (m/s)</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-teal-400 tabular-nums">{latestDescent.toFixed(2)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Latest descent (m/s)</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold tabular-nums ${trend90d >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
              {trend90d >= 0 ? '+' : ''}{trend90d.toFixed(2)}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Trend (1st → last mo)</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-text-primary tabular-nums">{totalReadings}</p>
            <p className="text-xs text-text-secondary mt-0.5">Total readings</p>
          </div>
        </div>

        {/* ── Reference ranges card ──────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Reference Ranges</h3>
          </div>
          <div className="divide-y divide-border">
            {REFERENCE_LEVELS.map((level) => {
              const l = LEVEL_CONFIG[level]
              const isCurrentLevel = level === currentLevel
              return (
                <div
                  key={level}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isCurrentLevel ? `${l.bgClass}` : ''
                  }`}
                >
                  <span className={`flex-none w-2.5 h-2.5 rounded-full ${l.colorClass}`} />
                  <span className={`text-sm font-semibold w-20 flex-none ${l.textClass}`}>
                    {l.label}
                  </span>
                  <span className="text-xs text-text-secondary w-28 flex-none tabular-nums">
                    {l.range}
                  </span>
                  <span className="text-xs text-text-secondary flex-1">{l.description}</span>
                  {isCurrentLevel && (
                    <span className={`flex-none text-xs font-semibold px-2 py-0.5 rounded-full ${l.bgClass} ${l.textClass}`}>
                      You
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science card ───────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">The Science</h3>
          <div className="space-y-4">
            {SCIENCE_FACTS.map((fact) => (
              <div key={fact.title} className="flex items-start gap-3">
                <span className="flex-none mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p className="text-xs font-semibold text-text-primary">{fact.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{fact.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary opacity-50 mt-4 pt-3 border-t border-border">
            Requires iPhone 8 or later running iOS 14+. Measurement is passive — no manual logging needed.
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
