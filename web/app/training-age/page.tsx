'use client'

import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { ArrowLeft, Award, BookOpen, Dumbbell, FlaskConical, TrendingUp } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

// ─── Types ────────────────────────────────────────────────────────────────────

type TrainingLevel = 'novice' | 'intermediate' | 'advanced' | 'elite'

interface LevelConfig {
  label: string
  yearsRange: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  icon: React.ElementType
  description: string
  recommendation: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAINING_AGE_YEARS = 7.2
const TOTAL_SESSIONS = 1247
const CONSISTENCY_SCORE = 84

const LEVEL_CONFIGS: Record<TrainingLevel, LevelConfig> = {
  novice: {
    label: 'Novice',
    yearsRange: '0–2 years',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.35)',
    textColor: '#60a5fa',
    icon: Dumbbell,
    description:
      'Novice athletes are in the foundational phase of their training journey. The body responds rapidly to almost any stimulus, producing fast and measurable gains in strength, endurance, and neuromuscular coordination.',
    recommendation:
      'Focus on mastering movement patterns and building consistent habits. Train 3–4 days per week with full-body workouts. Prioritise technique over load. Any well-structured progressive programme produces results — consistency is the primary driver at this stage.',
  },
  intermediate: {
    label: 'Intermediate',
    yearsRange: '3–5 years',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.35)',
    textColor: '#4ade80',
    icon: TrendingUp,
    description:
      'Intermediate athletes have built a solid aerobic base and general fitness foundation. Adaptation rate has slowed from the novice phase and more structured periodisation is needed to continue progressing.',
    recommendation:
      'Introduce weekly and monthly periodisation cycles. Split training into distinct phases (base, build, peak). Incorporate sport-specific work alongside general conditioning. Recovery quality becomes as important as training volume.',
  },
  advanced: {
    label: 'Advanced',
    yearsRange: '6–10 years',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.12)',
    borderColor: 'rgba(249,115,22,0.35)',
    textColor: '#fb923c',
    icon: Award,
    description:
      'Advanced athletes have years of systematic training and strong physiological adaptations. Adaptation rates are slower; meaningful improvements require carefully planned overload, specificity, and structured recovery periods.',
    recommendation:
      'Use annual periodisation with multi-week mesocycles. Incorporate polarised training (80/20 easy/hard splits). Monitor HRV and resting heart rate to guide intensity. Supplement training with strength and mobility work to prevent accumulated overuse injury.',
  },
  elite: {
    label: 'Elite',
    yearsRange: '10+ years',
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.12)',
    borderColor: 'rgba(168,85,247,0.35)',
    textColor: '#c084fc',
    icon: FlaskConical,
    description:
      'Elite athletes have maximised most of their genetic potential. Adaptation from additional training volume produces diminishing returns (Kiely 2012). The performance edge comes from marginal gains across sleep, nutrition, stress management, and training specificity.',
    recommendation:
      'Train with high specificity relative to your primary sport or goal. Use advanced periodisation models (block, conjugate, or undulating). Invest heavily in recovery infrastructure. Data-driven tracking of HRV, sleep, and performance markers is essential to avoid overtraining syndrome.',
  },
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function getCurrentLevel(): TrainingLevel {
  if (TRAINING_AGE_YEARS <= 2) return 'novice'
  if (TRAINING_AGE_YEARS <= 5) return 'intermediate'
  if (TRAINING_AGE_YEARS <= 10) return 'advanced'
  return 'elite'
}

const YEARLY_VOLUME = [
  { year: '2017', sessions: 42 },
  { year: '2018', sessions: 87 },
  { year: '2019', sessions: 124 },
  { year: '2020', sessions: 148 },
  { year: '2021', sessions: 172 },
  { year: '2022', sessions: 189 },
  { year: '2023', sessions: 196 },
  { year: '2024', sessions: 201 },
  { year: '2025', sessions: 88 },
]

const SPORT_HISTORY = [
  { sport: 'Running', sessions: 450, color: '#f97316' },
  { sport: 'Cycling', sessions: 220, color: '#3b82f6' },
  { sport: 'Strength', sessions: 180, color: '#a855f7' },
  { sport: 'HIIT', sessions: 150, color: '#ef4444' },
  { sport: 'Yoga', sessions: 98, color: '#22c55e' },
  { sport: 'Swimming', sessions: 74, color: '#06b6d4' },
  { sport: 'Hiking', sessions: 52, color: '#84cc16' },
  { sport: 'Walking', sessions: 23, color: '#64748b' },
]

const MAX_SPORT_SESSIONS = SPORT_HISTORY[0].sessions

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text-primary, #fff)',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1">
      <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingAgePage() {
  const currentLevel = getCurrentLevel()
  const config = LEVEL_CONFIGS[currentLevel]
  const LevelIcon = config.icon

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Training Age</h1>
            <p className="text-sm text-text-secondary">Years of systematic training accumulated</p>
          </div>
          <BookOpen className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── 1. Level badge ───────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 relative overflow-hidden"
          style={{ borderColor: config.borderColor, backgroundColor: config.bgColor }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${config.color}18 0%, transparent 60%)`,
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Icon circle */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${config.color}22`, border: `1.5px solid ${config.color}44` }}
            >
              <LevelIcon className="w-8 h-8" style={{ color: config.color }} />
            </div>

            {/* Label block */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: config.textColor }}
                >
                  Bompa &amp; Buzzichelli 2015
                </span>
              </div>
              <h2
                className="text-4xl font-extrabold mt-1 leading-none"
                style={{ color: config.color }}
              >
                {config.label}
              </h2>
              <p className="text-sm mt-1" style={{ color: config.textColor }}>
                {config.yearsRange}
              </p>
            </div>

            {/* Big years number */}
            <div className="text-right flex-shrink-0">
              <p
                className="text-5xl font-black tabular-nums leading-none"
                style={{ color: config.color }}
              >
                {TRAINING_AGE_YEARS}
              </p>
              <p className="text-sm text-text-secondary mt-1">years training</p>
            </div>
          </div>
        </div>

        {/* ── 2. Stat boxes ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="Training Age"
            value={`${TRAINING_AGE_YEARS}y`}
            sub="since first session"
            color={config.color}
          />
          <StatBox
            label="Total Sessions"
            value={TOTAL_SESSIONS.toLocaleString()}
            sub="all sports combined"
            color="#60a5fa"
          />
          <StatBox
            label="Consistency"
            value={`${CONSISTENCY_SCORE}%`}
            sub="active weeks / total"
            color="#4ade80"
          />
        </div>

        {/* ── 3. Yearly training volume bar chart ───────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">
            Yearly Training Volume
          </h2>
          <p className="text-xs text-text-secondary opacity-70 mb-4">Sessions per calendar year</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={YEARLY_VOLUME}
              margin={{ top: 16, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="25%"
            >
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} sessions`, 'Volume']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                {YEARLY_VOLUME.map((entry, index) => {
                  const isRecent = index >= YEARLY_VOLUME.length - 2
                  return (
                    <Cell
                      key={entry.year}
                      fill={config.color}
                      fillOpacity={isRecent ? 0.55 : 0.85}
                    />
                  )
                })}
                <LabelList
                  dataKey="sessions"
                  position="top"
                  style={{ fontSize: 10, fill: 'var(--color-text-secondary)', opacity: 0.7 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary opacity-50 mt-1">
            2025 bar reflects partial year (Jan–Mar)
          </p>
        </div>

        {/* ── 4. Sport history ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">Sport History</h2>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Top sports by all-time sessions
          </p>
          <div className="space-y-3">
            {SPORT_HISTORY.map((entry) => {
              const pct = (entry.sessions / MAX_SPORT_SESSIONS) * 100
              return (
                <div key={entry.sport} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{entry.sport}</span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: entry.color }}
                    >
                      {entry.sessions}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: entry.color, opacity: 0.85 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 5. Level description & recommendation ─────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <LevelIcon className="w-4 h-4 flex-shrink-0" style={{ color: config.color }} />
            <h2 className="text-sm font-semibold" style={{ color: config.color }}>
              What {config.label} Means
            </h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{config.description}</p>

          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
              Training Recommendation
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{config.recommendation}</p>
          </div>

          {/* Level progression pills */}
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
              Classification Levels
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(LEVEL_CONFIGS) as [TrainingLevel, LevelConfig][]).map(
                ([key, lvl]) => {
                  const isActive = key === currentLevel
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: isActive ? lvl.bgColor : 'transparent',
                        border: `1.5px solid ${isActive ? lvl.color : 'rgba(255,255,255,0.12)'}`,
                        color: isActive ? lvl.color : 'var(--color-text-secondary)',
                        opacity: isActive ? 1 : 0.55,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lvl.color }}
                      />
                      {lvl.label}
                      <span className="opacity-70 font-normal">{lvl.yearsRange}</span>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </div>

        {/* ── 6. Science callout ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-purple-500/30 p-4 relative overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-violet-700/5 pointer-events-none" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                The Science
              </h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Bompa &amp; Buzzichelli (2015, <em>Periodization</em>) define training age as years of
              systematic training. It determines appropriate training loads, recovery needs, and
              adaptation expectations. Novice athletes adapt quickly; elite athletes see diminishing
              returns (Kiely 2012).
            </p>
            <p className="text-xs text-text-secondary opacity-50 leading-relaxed border-t border-border/50 pt-3">
              Training age is estimated from first recorded workout session to present. Consistency
              score reflects the proportion of calendar weeks that contained at least one workout.
              Classifications follow Bompa &amp; Buzzichelli (2015) chapter 2 framework. This page
              uses demo data for illustration.
            </p>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
