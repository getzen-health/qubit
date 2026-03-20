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

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskFactor {
  label: string
  value: string
  unit: string
  interpretation: string
  score: number
  maxScore: number
  color: string        // tailwind text color class
  bgColor: string      // tailwind bg color class
  borderColor: string  // tailwind border color class
  normal: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SCORE = 2
const MAX_SCORE = 6 + 2 // slight buffer so arc ends before 360°

const RISK_BANDS = [
  { label: 'Low',       range: '0–1',  color: '#22c55e', textColor: 'text-green-400',  bgColor: 'bg-green-400',  width: 'w-1/4' },
  { label: 'Moderate',  range: '2–3',  color: '#eab308', textColor: 'text-yellow-400', bgColor: 'bg-yellow-400', width: 'w-1/4' },
  { label: 'High',      range: '4–5',  color: '#f97316', textColor: 'text-orange-400', bgColor: 'bg-orange-400', width: 'w-1/4' },
  { label: 'Very High', range: '6+',   color: '#ef4444', textColor: 'text-red-400',    bgColor: 'bg-red-400',    width: 'w-1/4' },
]

const RISK_FACTORS: RiskFactor[] = [
  {
    label: 'Gait Speed',
    value: '1.05',
    unit: 'm/s',
    interpretation: 'Normal \u22651.0\u00a0m/s',
    score: 0,
    maxScore: 2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    normal: '\u22651.0\u00a0m/s',
  },
  {
    label: 'Walking Steadiness',
    value: '78',
    unit: '%',
    interpretation: 'Low \u2013 moderate risk',
    score: 1,
    maxScore: 2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    normal: 'OK \u226580%',
  },
  {
    label: 'Double Support',
    value: '24',
    unit: '%',
    interpretation: 'Normal <25%',
    score: 0,
    maxScore: 2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    normal: '<25%',
  },
  {
    label: 'Gait Asymmetry',
    value: '12',
    unit: '%',
    interpretation: 'Moderate 10\u201320%',
    score: 1,
    maxScore: 2,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    normal: '<10%',
  },
  {
    label: 'Stair Speed',
    value: '0.72',
    unit: 'm/s',
    interpretation: 'Good \u22650.7\u00a0m/s',
    score: 0,
    maxScore: 2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    normal: '\u22650.7\u00a0m/s',
  },
]

// 6-month trend data (score improving from 3.2 → 2.0)
const TREND_DATA = [
  { month: 'Sep', score: 3.2 },
  { month: 'Oct', score: 3.0 },
  { month: 'Nov', score: 2.8 },
  { month: 'Dec', score: 2.5 },
  { month: 'Jan', score: 2.2 },
  { month: 'Feb', score: 2.0 },
]

const RECOMMENDATIONS = [
  {
    icon: '🧘',
    title: 'Balance Training — Tai Chi',
    body: 'Tai chi has level-1 evidence for fall prevention (Cochrane 2019), reducing fall rate by ~19%. Aim for 2× per week.',
  },
  {
    icon: '🚶',
    title: 'Daily Walking — 30 min',
    body: 'Brisk walking improves gait speed, leg strength, and proprioception. Target ≥7,000 steps/day to maintain gait speed above 1.0\u00a0m/s.',
  },
  {
    icon: '🏠',
    title: 'Home Safety Check',
    body: 'Remove tripping hazards, add grab bars in bathroom, ensure adequate lighting. 50–60% of falls occur at home (CDC STEADI).',
  },
  {
    icon: '🩺',
    title: 'Clinical Assessment if High Risk',
    body: 'If your score reaches 4+, request a formal fall risk evaluation — Timed Up & Go (TUG), Berg Balance Scale, or 30-second chair stand.',
  },
]

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────

function CircularGauge({ score, max = 6 }: { score: number; max?: number }) {
  const R = 70
  const cx = 90
  const cy = 90
  const strokeWidth = 12

  // Arc spans 240 degrees (from 150° to 30°, going clockwise)
  const startAngle = 150
  const totalDeg = 240
  const circumference = 2 * Math.PI * R

  // Convert degrees to radians helper
  const toRad = (deg: number) => (deg * Math.PI) / 180

  // Point on circle
  const pt = (angleDeg: number) => ({
    x: cx + R * Math.cos(toRad(angleDeg)),
    y: cy + R * Math.sin(toRad(angleDeg)),
  })

  // Build arc path
  function arcPath(startDeg: number, endDeg: number) {
    const s = pt(startDeg)
    const e = pt(endDeg)
    const span = endDeg - startDeg
    const largeArc = span > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  const clampedScore = Math.min(score, max)
  const fraction = clampedScore / max
  const filledDeg = totalDeg * fraction
  const endAngle = startAngle + filledDeg

  // Color based on score
  let gaugeColor = '#22c55e'
  if (score >= 4) gaugeColor = '#f97316'
  else if (score >= 2) gaugeColor = '#eab308'

  const trackPath = arcPath(startAngle, startAngle + totalDeg)
  const fillPath = filledDeg > 0 ? arcPath(startAngle, endAngle) : null

  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44" aria-label={`Risk score ${score} out of ${max}`}>
      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Fill */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
      {/* Score text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="32"
        fontWeight="700"
        fill={gaugeColor}
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fontSize="11"
        fill="rgba(255,255,255,0.45)"
      >
        out of {max}
      </text>
    </svg>
  )
}

// ─── Score pip helper ─────────────────────────────────────────────────────────

function ScorePips({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex gap-1 mt-2">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < score ? 'bg-current' : 'bg-white/10'}`}
        />
      ))}
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function FallRiskClient() {
  const currentBandIndex =
    TOTAL_SCORE <= 1 ? 0 : TOTAL_SCORE <= 3 ? 1 : TOTAL_SCORE <= 5 ? 2 : 3

  const currentBand = RISK_BANDS[currentBandIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Fall Risk Assessment</h1>
            <p className="text-sm text-text-secondary">STEADI Framework · 5-factor passive screening</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── Risk Score Card ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Composite Risk Score
          </h2>
          <div className="flex items-center gap-6">
            <CircularGauge score={TOTAL_SCORE} max={6} />
            <div className="flex-1 min-w-0">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mb-3"
                style={{
                  backgroundColor: currentBand.color + '22',
                  color: currentBand.color,
                  border: `1px solid ${currentBand.color}44`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentBand.color }}
                />
                {currentBand.label} Risk
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your score of <span className="font-semibold text-text-primary">{TOTAL_SCORE}/6</span> places you in the{' '}
                <span className="font-semibold" style={{ color: currentBand.color }}>
                  {currentBand.label.toLowerCase()} risk
                </span>{' '}
                band. Two gait factors — walking steadiness and asymmetry — are mildly elevated. Continue active
                prevention to keep your score low.
              </p>
            </div>
          </div>
        </div>

        {/* ── STEADI Risk Bands ────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
            STEADI Risk Bands
          </h2>
          <div className="flex rounded-lg overflow-hidden h-8 mb-3">
            {RISK_BANDS.map((band, i) => (
              <div
                key={band.label}
                className="flex-1 flex items-center justify-center relative"
                style={{ backgroundColor: band.color + (i === currentBandIndex ? '55' : '1a') }}
              >
                {i === currentBandIndex && (
                  <div
                    className="absolute inset-0 border-2 rounded"
                    style={{ borderColor: band.color }}
                  />
                )}
                <span
                  className="text-xs font-semibold truncate px-1"
                  style={{ color: band.color }}
                >
                  {band.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex">
            {RISK_BANDS.map((band) => (
              <div key={band.label} className="flex-1 text-center">
                <p className="text-xs text-text-secondary">{band.range}</p>
              </div>
            ))}
          </div>
          {/* Position indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentBand.color }}
            />
            <span>
              Current: score {TOTAL_SCORE} &rarr;{' '}
              <span style={{ color: currentBand.color }} className="font-semibold">
                {currentBand.label} Risk
              </span>{' '}
              ({currentBand.range} pts)
            </span>
          </div>
        </div>

        {/* ── Risk Factor Grid ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Risk Factors
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {RISK_FACTORS.map((factor) => (
              <div
                key={factor.label}
                className={`rounded-2xl border p-4 ${factor.bgColor} ${factor.borderColor}`}
              >
                <p className="text-xs text-text-secondary mb-1">{factor.label}</p>
                <p className={`text-2xl font-bold tabular-nums mb-0.5 ${factor.color}`}>
                  {factor.value}
                  <span className="text-sm font-normal text-text-secondary ml-0.5">
                    {factor.unit}
                  </span>
                </p>
                <p className={`text-xs font-semibold mb-2 ${factor.color}`}>
                  {factor.interpretation}
                </p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">Normal: {factor.normal}</span>
                  <span className={`text-xs font-bold ${factor.color}`}>
                    {factor.score}/{factor.maxScore}
                  </span>
                </div>
                <div className={factor.color}>
                  <ScorePips score={factor.score} max={factor.maxScore} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6-Month Trend ────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
            6-Month Score Trend
          </h2>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Composite fall risk score over time &mdash; lower is better
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={TREND_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 6]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(1)}`, 'Risk Score']}
                labelFormatter={(label: string) => label}
              />
              {/* Risk zone reference bands */}
              <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.4} />
              <ReferenceLine y={3} stroke="#eab308" strokeDasharray="4 3" strokeOpacity={0.4} />
              <ReferenceLine y={5} stroke="#f97316" strokeDasharray="4 3" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span>Risk score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-green-500 rounded opacity-50" />
              <span>Thresholds</span>
            </div>
            <span className="ml-auto text-green-400 font-semibold">
              &darr; 1.2 pts improved
            </span>
          </div>
        </div>

        {/* ── Recommendations ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Recommendations</h2>
          </div>
          <div className="divide-y divide-border/60">
            {RECOMMENDATIONS.map((rec) => (
              <div key={rec.title} className="px-5 py-4 flex gap-4">
                <span className="text-2xl shrink-0">{rec.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">{rec.title}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{rec.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science Card ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-blue-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                The Science
              </h2>
            </div>

            {/* STEADI */}
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">
                STEADI Initiative &mdash; CDC / Berry 2018
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Stopping Elderly Accidents, Deaths & Injuries (STEADI) is the CDC&apos;s evidence-based
                fall prevention framework for primary care. It defines a 3-step process: screen, assess,
                and intervene. Berry et al. (2018) demonstrated that systematic STEADI implementation
                reduced fall-related ED visits by 9% in a large prospective cohort.
              </p>
            </div>

            {/* Studenski 2011 */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-sm font-semibold text-text-primary mb-1">
                Studenski et al. (2011) &mdash; JAMA
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                In a pooled cohort of 34,485 adults aged 65+, gait speed predicted 5-year and
                10-year survival better than age, sex, or chronic disease status. A gait speed of
                &lt;0.8&nbsp;m/s is associated with significant fall risk. Each 0.1&nbsp;m/s faster
                corresponds to a ~12% lower mortality risk. The authors proposed gait speed as a
                &ldquo;sixth vital sign.&rdquo;
              </p>
            </div>

            {/* Apple Walking Steadiness */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-sm font-semibold text-text-primary mb-1">
                Apple Walking Steadiness
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Introduced in iOS 15, Walking Steadiness is computed from iPhone accelerometry during
                everyday walking. Apple defines three levels: <span className="text-green-400 font-medium">OK</span> (&ge;80%),{' '}
                <span className="text-yellow-400 font-medium">Low</span> (50&ndash;80%), and{' '}
                <span className="text-red-400 font-medium">Very Low</span> (&lt;50%). Apple validated this
                metric against clinical gait analysis and showed it correlates with prospective fall risk
                in community-dwelling adults. It requires no dedicated workout session &mdash; data is
                collected passively during daily life.
              </p>
            </div>

            {/* Double Support */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-sm font-semibold text-text-primary mb-1">
                Double Support Time
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Double support is the fraction of the gait cycle when both feet are simultaneously on
                the ground. Healthy young adults average ~20&ndash;25%; values above 35% indicate a
                compensatory strategy for impaired balance. As walking speed slows (e.g., from fear of
                falling, pain, or neurological decline), double support time increases automatically.
                It is measured passively by iPhone&apos;s accelerometer and gyroscope without any user
                action required.
              </p>
            </div>

            <p className="text-xs text-text-secondary opacity-60 leading-relaxed border-t border-border/50 pt-3">
              Values shown are passively measured estimates from Apple HealthKit. This page is for
              informational purposes only and does not constitute medical advice. Consult a physician
              if you have concerns about your fall risk or mobility.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
