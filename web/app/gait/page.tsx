'use client'

import { useState } from 'react'
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
  ReferenceArea,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type MetricKey = 'speed' | 'stepLength' | 'asymmetry' | 'doubleSupport'

interface DayPoint {
  label: string
  speed: number
  stepLength: number
  asymmetry: number
  doubleSupport: number
}

// ─── Mock data helpers ────────────────────────────────────────────────────────

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function gaussianApprox(seed: number): number {
  // Box-Muller style using seeded values — stays bounded
  const u = seededRand(seed)
  const v = seededRand(seed + 100)
  return Math.sqrt(-2 * Math.log(Math.max(u, 0.001))) * Math.cos(2 * Math.PI * v)
}

function generate90Days(): DayPoint[] {
  const points: DayPoint[] = []
  // End at today (2026-03-19)
  const end = new Date(2026, 2, 19)

  for (let i = 89; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const seed = i * 7

    // Walking speed: ~1.18 m/s, normal range 1.0–1.4
    const speed = Math.round((1.18 + gaussianApprox(seed) * 0.07) * 100) / 100

    // Step length: ~0.72 m
    const stepLength = Math.round((0.72 + gaussianApprox(seed + 1) * 0.04) * 100) / 100

    // Asymmetry: ~3.2%, lower is better
    const asymmetry = Math.round((3.2 + Math.abs(gaussianApprox(seed + 2)) * 1.2) * 10) / 10

    // Double support: ~21%
    const doubleSupport = Math.round((21 + gaussianApprox(seed + 3) * 1.5) * 10) / 10

    points.push({
      label,
      speed: Math.max(0.7, Math.min(1.6, speed)),
      stepLength: Math.max(0.5, Math.min(0.95, stepLength)),
      asymmetry: Math.max(0, Math.min(18, asymmetry)),
      doubleSupport: Math.max(14, Math.min(32, doubleSupport)),
    })
  }

  return points
}

const TREND_DATA = generate90Days()

// ─── Metric config ────────────────────────────────────────────────────────────

interface MetricConfig {
  key: MetricKey
  label: string
  value: string
  classification: string
  classColor: string
  unit: string
  color: string
  normalLow: number
  normalHigh: number
  domain: [number, number]
  decimals: number
  description: string
  clinicalMeaning: string
}

const METRICS: MetricConfig[] = [
  {
    key: 'speed',
    label: 'Walking Speed',
    value: '1.18',
    classification: 'Normal',
    classColor: '#22c55e',
    unit: 'm/s',
    color: '#3b82f6',
    normalLow: 1.0,
    normalHigh: 1.4,
    domain: [0.6, 1.6],
    decimals: 2,
    description: 'Meters per second over a typical walking bout',
    clinicalMeaning:
      'Studenski (2011) showed gait speed predicts 5 and 10-year survival independent of age, sex, and chronic disease. Each 0.1 m/s increase is associated with a ~12% reduction in mortality risk.',
  },
  {
    key: 'stepLength',
    label: 'Step Length',
    value: '0.72',
    classification: 'Normal',
    classColor: '#22c55e',
    unit: 'm',
    color: '#a855f7',
    normalLow: 0.6,
    normalHigh: 0.85,
    domain: [0.4, 1.0],
    decimals: 2,
    description: 'Distance from one foot strike to the next',
    clinicalMeaning:
      'Step length reflects hip flexor strength, balance, and neurological function. Shortened steps are an early sign of Parkinson\'s disease, fear of falling, or hip/knee pain. Healthy adults aged 30–50 average 0.70–0.82 m.',
  },
  {
    key: 'asymmetry',
    label: 'Asymmetry',
    value: '3.2',
    classification: 'Balanced',
    classColor: '#22c55e',
    unit: '%',
    color: '#f59e0b',
    normalLow: 0,
    normalHigh: 5,
    domain: [0, 18],
    decimals: 1,
    description: 'Left-right step time difference as a percentage',
    clinicalMeaning:
      'Gait asymmetry above 5% indicates compensatory movement patterns — often from unilateral pain, muscle weakness, or neurological asymmetry. Values above 10% are associated with increased fall risk and may warrant clinical evaluation.',
  },
  {
    key: 'doubleSupport',
    label: 'Double Support',
    value: '21',
    classification: 'Normal',
    classColor: '#22c55e',
    unit: '%',
    color: '#ef4444',
    normalLow: 16,
    normalHigh: 26,
    domain: [10, 36],
    decimals: 1,
    description: 'Proportion of gait cycle when both feet are on the ground',
    clinicalMeaning:
      'Double support time increases as walking speed slows and balance declines. Elevated double support (>30%) indicates reduced confidence in single-leg balance. Older adults average 25–32%; elite walkers can be below 16%.',
  },
]

// ─── Age norms data ───────────────────────────────────────────────────────────

const AGE_NORMS = [
  { decade: '20s', speed: 1.34 },
  { decade: '30s', speed: 1.34 },
  { decade: '40s', speed: 1.32 },
  { decade: '50s', speed: 1.28 },
  { decade: '60s', speed: 1.24 },
  { decade: '70s', speed: 1.13 },
  { decade: '80+', speed: 0.94 },
]

const USER_SPEED = 1.18

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GaitPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('speed')

  const cfg = METRICS.find((m) => m.key === activeMetric)!

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Gait Analysis</h1>
            <p className="text-sm text-text-secondary">A vital sign measured passively by your iPhone</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Summary stat cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`bg-surface rounded-2xl border p-4 text-center transition-all ${
                activeMetric === m.key
                  ? 'border-blue-500/60 ring-1 ring-blue-500/30'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <p className="text-2xl font-bold tabular-nums" style={{ color: m.color }}>
                {m.value}
                <span className="text-sm font-normal text-text-secondary ml-0.5">{m.unit}</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{m.label}</p>
              <p
                className="text-xs font-semibold mt-1"
                style={{ color: m.classColor }}
              >
                {m.classification}
              </p>
            </button>
          ))}
        </div>

        {/* ── Trend chart with metric toggle ──────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-medium text-text-secondary">90-Day Trend</h2>
            <div className="flex gap-1 flex-wrap">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setActiveMetric(m.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeMetric === m.key
                      ? 'text-white'
                      : 'text-text-secondary hover:text-text-primary bg-surface-secondary'
                  }`}
                  style={activeMetric === m.key ? { backgroundColor: m.color } : undefined}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-secondary mb-3 opacity-70">
            {cfg.description} · shaded band = normal range
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              {/* Normal range shaded band */}
              <ReferenceArea
                y1={cfg.normalLow}
                y2={cfg.normalHigh}
                fill={cfg.color}
                fillOpacity={0.08}
                stroke={cfg.color}
                strokeOpacity={0.2}
                strokeDasharray="4 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval={14}
              />
              <YAxis
                domain={cfg.domain}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickLine={false}
                axisLine={false}
                width={34}
                tickFormatter={(v: number) => `${v.toFixed(cfg.decimals === 0 ? 0 : 1)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(cfg.decimals)} ${cfg.unit}`, cfg.label]}
                labelFormatter={(label: string) => label}
              />
              <Line
                type="monotone"
                dataKey={cfg.key}
                stroke={cfg.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Normal range legend */}
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            <div
              className="w-8 h-2 rounded"
              style={{ backgroundColor: cfg.color, opacity: 0.25 }}
            />
            <span>
              Normal range: {cfg.normalLow}–{cfg.normalHigh} {cfg.unit}
            </span>
          </div>
        </div>

        {/* ── Classification thresholds ────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-text-secondary">Classification Thresholds</h2>
          </div>

          {/* Speed */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-text-primary mb-2">Walking Speed</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-1.5 font-medium text-text-secondary">Level</th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">Speed (m/s)</th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">Survival Implication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { level: 'Excellent', range: '≥ 1.2', color: '#22c55e', note: 'Above-average longevity signal' },
                    { level: 'Normal', range: '1.0 – 1.2', color: '#3b82f6', note: 'Expected for healthy adults' },
                    { level: 'Slow', range: '0.8 – 1.0', color: '#f59e0b', note: 'Increased mortality risk' },
                    { level: 'Very Slow', range: '< 0.8', color: '#ef4444', note: 'High risk — warrants evaluation' },
                  ].map((row) => (
                    <tr key={row.level}>
                      <td className="py-2 font-semibold" style={{ color: row.color }}>
                        {row.level}
                      </td>
                      <td className="py-2 text-right tabular-nums text-text-primary font-medium">
                        {row.range}
                      </td>
                      <td className="py-2 text-right text-text-secondary">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Asymmetry */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-text-primary mb-2">Gait Asymmetry</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-1.5 font-medium text-text-secondary">Level</th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">Asymmetry</th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { level: 'Balanced', range: '< 5%', color: '#22c55e', note: 'Symmetric movement pattern' },
                    { level: 'Mild', range: '5 – 10%', color: '#f59e0b', note: 'Minor compensation' },
                    { level: 'High', range: '> 10%', color: '#ef4444', note: 'Increased fall risk' },
                  ].map((row) => (
                    <tr key={row.level}>
                      <td className="py-2 font-semibold" style={{ color: row.color }}>
                        {row.level}
                      </td>
                      <td className="py-2 text-right tabular-nums text-text-primary font-medium">
                        {row.range}
                      </td>
                      <td className="py-2 text-right text-text-secondary">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Age norms bar chart ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">
            Walking Speed by Decade — Bohannon 2011 Norms
          </h2>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Community-dwelling adults · your value highlighted
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={AGE_NORMS} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="decade"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0.8, 1.45]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={(v: number) => `${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(2)} m/s`, 'Norm speed']}
              />
              <ReferenceLine
                y={USER_SPEED}
                stroke="#3b82f6"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `You · ${USER_SPEED} m/s`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#3b82f6',
                }}
              />
              <Bar dataKey="speed" radius={[3, 3, 0, 0]}>
                {AGE_NORMS.map((entry, i) => {
                  // highlight the decade closest to user — assume user is in 30s for demo
                  const isUser = entry.decade === '30s'
                  return (
                    <Cell
                      key={i}
                      fill={isUser ? '#3b82f6' : '#475569'}
                      opacity={isUser ? 1 : 0.6}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2 opacity-60 text-center">
            Blue bar = your age group · blue line = your current speed
          </p>
        </div>

        {/* ── Physiological meanings ───────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-4">What Each Metric Indicates</h2>
          <div className="space-y-4">
            {METRICS.map((m) => (
              <div key={m.key} className="flex gap-3">
                <div
                  className="w-1 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: m.color, minHeight: 16 }}
                />
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-1">
                    {m.label}{' '}
                    <span className="font-normal text-text-secondary">
                      ({m.value} {m.unit})
                    </span>
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">{m.clinicalMeaning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science section ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-blue-500/30 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                The Science
              </h2>
            </div>

            {/* Studenski 2011 */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                Studenski et al. (2011) — JAMA
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                In a pooled cohort of 34,485 adults aged 65+, gait speed predicted survival better
                than age, sex, or the presence of chronic conditions. At any given age, faster walkers
                lived significantly longer — with each 0.1 m/s improvement associated with a 12%
                reduction in mortality. The authors proposed gait speed as a "sixth vital sign."
              </p>
            </div>

            {/* Apple Health note */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-sm font-semibold text-text-primary mb-1">
                Passive collection via iPhone & Apple Watch
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Apple Health computes walking speed, step length, double support time, and walking
                asymmetry automatically from the iPhone accelerometer and gyroscope during normal daily
                walking — no dedicated workout session required. The algorithms were validated against
                clinical gait lab measurements across age groups (Apple, 2020). Data is stored under
                the Mobility category in HealthKit.
              </p>
            </div>

            {/* Bohannon norms table */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-sm font-semibold text-text-primary mb-2">
                Bohannon (2011) — Normal Walking Speeds by Age
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left pb-1.5 font-medium text-text-secondary">Age group</th>
                      <th className="text-right pb-1.5 font-medium text-text-secondary">Men (m/s)</th>
                      <th className="text-right pb-1.5 font-medium text-text-secondary">Women (m/s)</th>
                      <th className="text-right pb-1.5 font-medium text-text-secondary">Pooled (m/s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {[
                      { age: '20–29', men: '1.36', women: '1.34', pooled: '1.34' },
                      { age: '30–39', men: '1.43', women: '1.34', pooled: '1.34' },
                      { age: '40–49', men: '1.43', women: '1.39', pooled: '1.32' },
                      { age: '50–59', men: '1.43', women: '1.31', pooled: '1.28' },
                      { age: '60–69', men: '1.34', women: '1.24', pooled: '1.24' },
                      { age: '70–79', men: '1.26', women: '1.13', pooled: '1.13' },
                      { age: '80+', men: '0.97', women: '0.94', pooled: '0.94' },
                    ].map((row) => (
                      <tr key={row.age}>
                        <td className="py-1.5 text-text-secondary">{row.age}</td>
                        <td className="py-1.5 text-right tabular-nums text-text-primary">{row.men}</td>
                        <td className="py-1.5 text-right tabular-nums text-text-primary">{row.women}</td>
                        <td className="py-1.5 text-right tabular-nums font-semibold text-blue-400">{row.pooled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-text-secondary opacity-60 mt-2">
                Source: Bohannon RW. (2011). Reference values for the five-repetition sit-to-stand
                test. J Hum Kinet, 28, 23–29. (Speed norms from associated walking speed literature.)
              </p>
            </div>

            <p className="text-xs text-text-secondary opacity-60 leading-relaxed border-t border-border/50 pt-3">
              Values shown are passively measured estimates from Apple HealthKit. This page is for
              informational purposes only and does not constitute medical advice. Consult a physician
              if you have concerns about your mobility or fall risk.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
