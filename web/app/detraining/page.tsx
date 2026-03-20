'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, Clock, TrendingDown, BookOpen, AlertCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from 'recharts'

// ─── Mock data ────────────────────────────────────────────────────────────────

const DAYS_SINCE_LAST_WORKOUT = 18
const VO2_BEFORE = 52 // mL/kg/min

const PAST_BREAKS = [
  {
    id: 1,
    startDate: '2025-08-03',
    endDate: '2025-08-20',
    daysOff: 17,
    vo2Before: 51.5,
    vo2After: 48.9,
    vo2Loss: 2.6,
    retrainingDays: 13,
    reason: 'Vacation',
  },
  {
    id: 2,
    startDate: '2025-03-10',
    endDate: '2025-03-31',
    daysOff: 21,
    vo2Before: 49.8,
    vo2After: 46.3,
    vo2Loss: 3.5,
    retrainingDays: 16,
    reason: 'Illness',
  },
  {
    id: 3,
    startDate: '2024-12-22',
    endDate: '2025-01-06',
    daysOff: 15,
    vo2Before: 48.2,
    vo2After: 46.0,
    vo2Loss: 2.2,
    retrainingDays: 11,
    reason: 'Holiday break',
  },
]

const PHYSIOLOGICAL_TIMELINE = [
  {
    week: 'Week 1',
    color: '#f59e0b',
    effects: ['Plasma volume drops ~5%', 'Cardiac output starts decreasing', 'Blood lactate rises at same intensity'],
  },
  {
    week: 'Week 2',
    color: '#f97316',
    effects: ['VO₂ max measurably reduced (~3–4%)', 'Stroke volume declines', 'Mitochondrial density begins to fall'],
  },
  {
    week: 'Week 4',
    color: '#ef4444',
    effects: ['Muscle oxidative capacity declines significantly', 'Capillary density reduces', 'Lactate threshold drops'],
  },
  {
    week: 'Week 8+',
    color: '#dc2626',
    effects: [
      'Strength & neuromuscular adaptations diminish',
      'Fast-twitch fibre atrophy accelerates',
      'Most aerobic gains from training reversed',
    ],
  },
]

// ─── Curve computation ────────────────────────────────────────────────────────

/**
 * Mujika & Padilla (2000) model:
 *   Weeks 1–4: ~1.8% VO₂ max lost per week
 *   Weeks 4+:  ~0.5% VO₂ max lost per week
 */
function vo2RetainedPct(weeksOff: number): number {
  if (weeksOff <= 0) return 100
  if (weeksOff <= 4) {
    return Math.max(0, 100 - weeksOff * 1.8)
  }
  const afterFour = weeksOff - 4
  return Math.max(0, 100 - 4 * 1.8 - afterFour * 0.5)
}

function weeksLost(daysOff: number, vo2LossPct: number): number {
  // Inverse of the model: find weeks that produce this loss
  const loss = vo2LossPct
  if (loss <= 4 * 1.8) {
    return loss / 1.8
  }
  return 4 + (loss - 4 * 1.8) / 0.5
}

/** Retraining estimate: ~75% of break duration (Mujika & Padilla) */
function retrainingDays(daysOff: number): number {
  return Math.round(daysOff * 0.75)
}

// Build chart data points at 0.5-week resolution
const CURVE_DATA = Array.from({ length: 25 }, (_, i) => {
  const weeks = i * 0.5
  return {
    weeks,
    retained: Math.round(vo2RetainedPct(weeks) * 10) / 10,
    // Split into two series for distinct visual segments
    steepSegment: weeks <= 4 ? Math.round(vo2RetainedPct(weeks) * 10) / 10 : null,
    shallowSegment: weeks >= 4 ? Math.round(vo2RetainedPct(weeks) * 10) / 10 : null,
  }
})

// Current position on the curve
const currentWeeks = DAYS_SINCE_LAST_WORKOUT / 7
const currentRetained = vo2RetainedPct(currentWeeks)
const currentVO2Loss = 100 - currentRetained
const currentVO2Estimated = Math.round(VO2_BEFORE * (currentRetained / 100) * 10) / 10
const retrainingEstimate = retrainingDays(DAYS_SINCE_LAST_WORKOUT)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function severityColor(daysOff: number): string {
  if (daysOff < 7) return '#22c55e'
  if (daysOff < 21) return '#f59e0b'
  return '#ef4444'
}

function severityLabel(daysOff: number): string {
  if (daysOff < 7) return 'Minimal'
  if (daysOff < 21) return 'Moderate'
  return 'Significant'
}

// ─── Custom dot for the "you are here" position ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrentPositionDot(props: any) {
  const { cx, cy } = props
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="#ef4444" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
    </g>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DetrainingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Detraining Analysis</h1>
            <p className="text-sm text-text-secondary">Mujika &amp; Padilla (2000) VO₂ loss model</p>
          </div>
          <TrendingDown className="w-5 h-5 text-red-400" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* Current status card */}
        <div className="bg-surface rounded-xl border border-red-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Current Status</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-text-primary">{DAYS_SINCE_LAST_WORKOUT}</p>
                <p className="text-xs text-text-secondary mt-0.5">Days Since<br />Last Workout</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-400">
                  -{Math.round(currentVO2Loss * 10) / 10}%
                </p>
                <p className="text-xs text-text-secondary mt-0.5">Estimated<br />VO₂ Loss</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-400">{retrainingEstimate}d</p>
                <p className="text-xs text-text-secondary mt-0.5">Retraining<br />Estimate</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary">VO₂ max before break</p>
                <p className="text-sm font-semibold text-text-primary">{VO2_BEFORE} mL/kg/min</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-secondary">Current estimated VO₂</p>
                <p className="text-sm font-semibold text-orange-400">{currentVO2Estimated} mL/kg/min</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>VO₂ retained</span>
                <span>{Math.round(currentRetained * 10) / 10}%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${currentRetained}%`,
                    background: 'linear-gradient(90deg, #ef4444, #f97316)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detraining curve chart */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-medium text-text-secondary">VO₂ Max Retention Curve</h2>
            <span className="text-xs text-red-400 border border-red-400/30 rounded-full px-2 py-0.5">
              You are here
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            % of pre-break VO₂ max retained over weeks without training
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={CURVE_DATA}
              margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="weeks"
                type="number"
                domain={[0, 12]}
                ticks={[0, 2, 4, 6, 8, 10, 12]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Weeks off training', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'var(--color-text-secondary)' }}
                height={36}
              />
              <YAxis
                domain={[88, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={34}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  if (name === 'steepSegment') return [`${value}%`, 'Steep phase (–1.8%/wk)']
                  if (name === 'shallowSegment') return [`${value}%`, 'Slow phase (–0.5%/wk)']
                  return [value, name]
                }}
                labelFormatter={(label: number) => `Week ${label}`}
              />
              {/* Steep segment: weeks 0–4 */}
              <Line
                dataKey="steepSegment"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                activeDot={false}
                connectNulls={false}
                name="steepSegment"
              />
              {/* Shallow segment: weeks 4–12 */}
              <Line
                dataKey="shallowSegment"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
                activeDot={false}
                connectNulls={false}
                strokeDasharray="5 3"
                name="shallowSegment"
              />
              {/* Phase boundary at week 4 */}
              <ReferenceLine
                x={4}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 3"
                label={{
                  value: 'Phase shift',
                  position: 'top',
                  fontSize: 9,
                  fill: 'rgba(255,255,255,0.4)',
                }}
              />
              {/* Current position dot */}
              <ReferenceDot
                x={Math.round(currentWeeks * 10) / 10}
                y={Math.round(currentRetained * 10) / 10}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={1.5}
                shape={<CurrentPositionDot />}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-500" />
              Steep: –1.8% VO₂/week (wks 1–4)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-orange-500 border-dashed" style={{ borderBottom: '2px dashed' }} />
              Slow: –0.5% VO₂/week (wks 4+)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Current position
            </div>
          </div>
        </div>

        {/* Past training breaks */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-secondary" />
            <h2 className="text-sm font-medium text-text-secondary">Past Training Breaks</h2>
          </div>
          <div className="divide-y divide-border">
            {PAST_BREAKS.map((b) => {
              const color = severityColor(b.daysOff)
              const label = severityLabel(b.daysOff)
              return (
                <div key={b.id} className="px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{b.reason}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {fmtDate(b.startDate)} – {fmtDate(b.endDate)}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium mt-0.5"
                      style={{
                        color,
                        backgroundColor: color + '22',
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-primary">{b.daysOff}</p>
                      <p className="text-xs text-text-secondary">Days off</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-text-secondary">{b.vo2Before}</p>
                      <p className="text-xs text-text-secondary">VO₂ before</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-400">{b.vo2After}</p>
                      <p className="text-xs text-text-secondary">VO₂ after</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-400">{b.retrainingDays}d</p>
                      <p className="text-xs text-text-secondary">Retraining</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>VO₂ retained after break</span>
                      <span className="text-red-400">–{b.vo2Loss} mL/kg/min</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(b.vo2After / b.vo2Before) * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Physiological effects timeline */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-text-secondary" />
            <h2 className="text-sm font-medium text-text-secondary">Physiological Effects Timeline</h2>
          </div>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-5">
              {PHYSIOLOGICAL_TIMELINE.map((phase, i) => {
                const isActive = currentWeeks >= (i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 3 : 7)
                return (
                  <div key={phase.week} className="relative">
                    {/* Dot on timeline */}
                    <div
                      className="absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 border-background"
                      style={{ backgroundColor: isActive ? phase.color : 'var(--color-border)' }}
                    />
                    <div className={isActive ? 'opacity-100' : 'opacity-40'}>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: phase.color }}
                      >
                        {phase.week}
                      </p>
                      <ul className="space-y-0.5">
                        {phase.effects.map((effect) => (
                          <li key={effect} className="text-xs text-text-secondary flex items-start gap-1.5">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-text-secondary/50 shrink-0" />
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Science reference card */}
        <div className="bg-surface rounded-xl border border-blue-500/30 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                Science — Mujika &amp; Padilla (2000)
              </h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Well-trained athletes lose approximately{' '}
              <span className="text-text-primary font-medium">1.8% VO₂ max per week</span> during the first
              4 weeks of complete training cessation, then the rate slows to{' '}
              <span className="text-text-primary font-medium">~0.5% per week</span> thereafter as residual
              adaptations partially resist further decline.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Retraining duration estimates suggest it takes{' '}
              <span className="text-text-primary font-medium">approximately 75% of the break duration</span>{' '}
              to fully restore pre-break fitness levels — so an 18-day break requires roughly{' '}
              <span className="text-text-primary font-medium">13–14 days of focused training</span> to recover.
            </p>
            <div className="flex items-start gap-2 pt-3 border-t border-border">
              <div className="w-1 h-full min-h-8 bg-blue-500/50 rounded-full shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary italic">
                Mujika, I., &amp; Padilla, S. (2000). Detraining: Loss of training-induced physiological and
                performance adaptations. Part I: Short term insufficient training stimulus.{' '}
                <span className="not-italic text-blue-400">Sports Medicine, 30(2), 79–87.</span>
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
