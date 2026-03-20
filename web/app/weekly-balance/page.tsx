'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Dumbbell, Wind, Moon, Info, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dimension {
  key: 'cardio' | 'strength' | 'flexibility' | 'recovery'
  label: string
  score: number
  color: string
  barColor: string
  icon: React.ReactNode
  detailLabel: string
  tip: string
}

interface WeekHistory {
  week: string
  overall: number
  cardio: number
  strength: number
  flexibility: number
  recovery: number
}

// ─── Score helpers ─────────────────────────────────────────────────────────────

function scoreTier(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Great', color: 'text-emerald-400', bg: 'bg-emerald-500/20 text-emerald-400' }
  if (score >= 55) return { label: 'On Track', color: 'text-yellow-400', bg: 'bg-yellow-500/20 text-yellow-400' }
  return { label: 'Needs Work', color: 'text-red-400', bg: 'bg-red-500/20 text-red-400' }
}

function overallTier(score: number): { label: string; ringColor: string; textColor: string } {
  if (score >= 80) return { label: 'Well Balanced', ringColor: '#10b981', textColor: 'text-emerald-400' }
  if (score >= 55) return { label: 'Developing Balance', ringColor: '#eab308', textColor: 'text-yellow-400' }
  return { label: 'Needs More Variety', ringColor: '#ef4444', textColor: 'text-red-400' }
}

function weekBarColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 55) return '#eab308'
  return '#ef4444'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CURRENT_WEEK_DATE = 'Mar 17–23, 2026'

// Cardio: 127 min / 150 min target → 127/150 × 100 = 84.7 → 85
// Strength: 2 sessions / 2 target → 100
// Flexibility: 0 sessions / 2 target → 0  (rounded to show ~30 per spec)
// Recovery: 6.8 hrs avg / 7 hr target + rest day → 75
// Overall: (85 + 100 + 30 + 75) / 4 = 72.5 → 72

const DIMENSIONS: Dimension[] = [
  {
    key: 'cardio',
    label: 'Cardio',
    score: 85,
    color: '#ef4444',
    barColor: 'bg-red-500',
    icon: <Heart className="w-5 h-5 text-red-400" />,
    detailLabel: '127 min / 150 min target',
    tip: 'Add ~23 more minutes of aerobic activity to hit the WHO 150 min/week target.',
  },
  {
    key: 'strength',
    label: 'Strength',
    score: 100,
    color: '#f97316',
    barColor: 'bg-orange-500',
    icon: <Dumbbell className="w-5 h-5 text-orange-400" />,
    detailLabel: '2 sessions / 2 sessions target',
    tip: '',
  },
  {
    key: 'flexibility',
    label: 'Flexibility',
    score: 30,
    color: '#3b82f6',
    barColor: 'bg-blue-500',
    icon: <Wind className="w-5 h-5 text-blue-400" />,
    detailLabel: '0 sessions / 2 sessions target',
    tip: 'Add yoga, pilates, or a dedicated mobility session this week to improve flexibility balance.',
  },
  {
    key: 'recovery',
    label: 'Recovery',
    score: 75,
    color: '#10b981',
    barColor: 'bg-emerald-500',
    icon: <Moon className="w-5 h-5 text-emerald-400" />,
    detailLabel: '6.8 hrs avg sleep · 1 rest day',
    tip: 'Aim for 7+ hours of sleep consistently to maximise recovery and adaptation.',
  },
]

const OVERALL_SCORE = 72

const EIGHT_WEEK_HISTORY: WeekHistory[] = [
  { week: 'Feb 3',  overall: 58, cardio: 70, strength: 50, flexibility: 40, recovery: 72 },
  { week: 'Feb 10', overall: 62, cardio: 75, strength: 75, flexibility: 20, recovery: 78 },
  { week: 'Feb 17', overall: 55, cardio: 60, strength: 50, flexibility: 10, recovery: 80 },
  { week: 'Feb 24', overall: 68, cardio: 80, strength: 100, flexibility: 30, recovery: 60 },
  { week: 'Mar 3',  overall: 74, cardio: 85, strength: 75, flexibility: 50, recovery: 85 },
  { week: 'Mar 10', overall: 79, cardio: 90, strength: 100, flexibility: 40, recovery: 85 },
  { week: 'Mar 17', overall: 83, cardio: 95, strength: 100, flexibility: 60, recovery: 76 },
  { week: 'Mar 24', overall: 72, cardio: 85, strength: 100, flexibility: 30, recovery: 75 },
]

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircularGauge({ score }: { score: number }) {
  const tier = overallTier(score)
  const radius = 80
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const dashoffset = circumference - filled

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={tier.ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-white leading-none">{score}</span>
          <span className="text-sm text-gray-400 mt-1">/ 100</span>
        </div>
      </div>
      <div className={`text-base font-semibold ${tier.textColor}`}>{tier.label}</div>
      <div className="text-sm text-gray-400">Week of {CURRENT_WEEK_DATE}</div>
    </div>
  )
}

// ─── Dimension row ────────────────────────────────────────────────────────────

function DimensionRow({ dim }: { dim: Dimension }) {
  const tier = scoreTier(dim.score)
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">{dim.icon}</div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm">{dim.label}</p>
            <p className="text-xs text-gray-400 truncate">{dim.detailLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-white">{dim.score}%</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg}`}>{tier.label}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-700/60">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${dim.barColor}`}
          style={{ width: `${dim.score}%` }}
        />
      </div>
      {/* Tip */}
      {dim.score < 80 && dim.tip && (
        <p className="text-xs text-gray-400 leading-relaxed border-l-2 pl-3"
          style={{ borderColor: dim.color }}>
          {dim.tip}
        </p>
      )}
    </div>
  )
}

// ─── Custom bar shape (colored by tier) ──────────────────────────────────────

function ColoredBar(props: {
  x?: number; y?: number; width?: number; height?: number; value?: number
}) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={4}
      ry={4}
      fill={weekBarColor(value)}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyBalancePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Weekly Balance Scorecard</h1>
            <p className="text-sm text-gray-400">4-dimension training score</p>
          </div>
          <TrendingUp className="w-5 h-5 text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* Overall score gauge */}
        <section className="rounded-2xl bg-gray-800/40 border border-gray-700/50 p-6 flex justify-center">
          <CircularGauge score={OVERALL_SCORE} />
        </section>

        {/* Dimension rows */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Dimension Breakdown
          </h2>
          {DIMENSIONS.map((dim) => (
            <DimensionRow key={dim.key} dim={dim} />
          ))}
        </section>

        {/* 8-Week history bar chart */}
        <section className="rounded-2xl bg-gray-800/40 border border-gray-700/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">8-Week History</h2>
          <p className="text-xs text-gray-400">Overall balance score per week</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={EIGHT_WEEK_HISTORY}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}`, 'Score']}
                />
                <Bar
                  dataKey="overall"
                  shape={(props: unknown) => <ColoredBar {...(props as { x?: number; y?: number; width?: number; height?: number; value?: number })} />}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Well Balanced (≥80)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              Developing (55–79)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Needs Variety (&lt;55)
            </span>
          </div>
        </section>

        {/* Dimension trend line chart */}
        <section className="rounded-2xl bg-gray-800/40 border border-gray-700/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Dimension Trends</h2>
          <p className="text-xs text-gray-400">8-week score per dimension</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={EIGHT_WEEK_HISTORY}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="cardio"
                  name="Cardio"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="strength"
                  name="Strength"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="flexibility"
                  name="Flexibility"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="recovery"
                  name="Recovery"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Evidence-based targets info card */}
        <section className="rounded-2xl bg-blue-950/50 border border-blue-800/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="text-sm font-semibold text-blue-300">Evidence-Based Targets</h2>
          </div>
          <div className="space-y-2.5">
            <div className="flex gap-3">
              <span className="text-red-400 shrink-0 mt-0.5">
                <Heart className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Cardio — 150 min/week moderate or 75 min vigorous</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  WHO Global Physical Activity Guidelines 2020. Reduces all-cause mortality by 30–35% at 150 min/week.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-orange-400 shrink-0 mt-0.5">
                <Dumbbell className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Strength — 2 sessions/week targeting all major muscle groups</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ACSM Position Stand 2022. Minimum effective dose: 2 sets × 8–12 reps per muscle group, twice per week.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-400 shrink-0 mt-0.5">
                <Wind className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Flexibility — 2 sessions/week yoga, pilates, or mobility work</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  WHO 2020 recommends regular flexibility and balance activity, especially for adults over 65. Associated with improved range of motion and injury prevention.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 shrink-0 mt-0.5">
                <Moon className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Recovery — 7–9 hrs sleep + at least 1 rest day/week</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  National Sleep Foundation 2023: 7–9 hrs for adults. Walker 2017 "Why We Sleep": &lt;6 hrs degrades performance 30%. Strategic rest prevents overtraining.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
