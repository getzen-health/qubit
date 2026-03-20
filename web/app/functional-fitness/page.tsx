'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Wind,
  Footprints,
  Activity,
  Zap,
  Stairs,
  FlaskConical,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoreClass = 'excellent' | 'above-average' | 'average' | 'below-average' | 'poor'

interface Component {
  id: string
  label: string
  shortLabel: string
  value: number
  unit: string
  score: number
  classification: string
  classKey: ScoreClass
  color: string
  bgColor: string
  borderColor: string
  barColor: string
  Icon: React.ElementType
  description: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COMPONENTS: Component[] = [
  {
    id: 'vo2max',
    label: 'VO\u2082 Max',
    shortLabel: 'VO\u2082 Max',
    value: 48.2,
    unit: 'ml/kg/min',
    score: 65,
    classification: 'Average',
    classKey: 'average',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    barColor: '#a855f7',
    Icon: Wind,
    description: 'Best single predictor of all-cause mortality',
  },
  {
    id: 'sixminwalk',
    label: '6-Minute Walk',
    shortLabel: '6-Min Walk',
    value: 580,
    unit: 'm',
    score: 75,
    classification: 'Above Average',
    classKey: 'above-average',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    barColor: '#3b82f6',
    Icon: Footprints,
    description: 'ATS/ERS validated functional capacity test',
  },
  {
    id: 'steadiness',
    label: 'Walking Steadiness',
    shortLabel: 'Steadiness',
    value: 87,
    unit: '%',
    score: 90,
    classification: 'Excellent',
    classKey: 'excellent',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    barColor: '#14b8a6',
    Icon: Activity,
    description: 'iOS 15+ ML fall-risk estimation',
  },
  {
    id: 'gaitspeed',
    label: 'Gait Speed',
    shortLabel: 'Gait Speed',
    value: 1.15,
    unit: 'm/s',
    score: 72,
    classification: 'Average',
    classKey: 'average',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    barColor: '#22c55e',
    Icon: Zap,
    description: 'Studenski 2011 — gait speed predicts survival',
  },
  {
    id: 'stairspeed',
    label: 'Stair Ascent Speed',
    shortLabel: 'Stair Speed',
    value: 0.72,
    unit: 'm/s',
    score: 70,
    classification: 'Average',
    classKey: 'average',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    barColor: '#f97316',
    Icon: Stairs,
    description: 'Bhatt 2013 — cardiovascular mortality predictor',
  },
]

const COMPOSITE_SCORE = 74.4
const FUNCTIONAL_AGE = 33
const CHRONOLOGICAL_AGE = 35

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyComposite(score: number): { label: string; classKey: ScoreClass } {
  if (score >= 90) return { label: 'Excellent', classKey: 'excellent' }
  if (score >= 75) return { label: 'Above Average', classKey: 'above-average' }
  if (score >= 55) return { label: 'Average', classKey: 'average' }
  if (score >= 35) return { label: 'Below Average', classKey: 'below-average' }
  return { label: 'Poor', classKey: 'poor' }
}

function classKeyToColors(key: ScoreClass): { text: string; bg: string; border: string } {
  switch (key) {
    case 'excellent':
      return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
    case 'above-average':
      return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' }
    case 'average':
      return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
    case 'below-average':
      return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' }
    case 'poor':
      return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  }
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function GaugeRing({ score }: { score: number }) {
  const radius = 72
  const stroke = 12
  const cx = 96
  const cy = 96
  const circumference = 2 * Math.PI * radius
  // We'll use a 270-degree arc (135° start, 135° end gap at bottom)
  const arcLength = (circumference * 270) / 360
  const filled = (score / 100) * arcLength
  const gap = circumference - arcLength

  // Colors: gradient from orange at 0 → green at 100
  const hue = Math.round(score * 1.2) // 0→0 (red), 100→120 (green)
  const gaugeColor = `hsl(${hue}, 80%, 55%)`

  return (
    <svg width="192" height="192" viewBox="0 0 192 192" className="drop-shadow-lg">
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={`${arcLength} ${gap}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        className="text-white/10"
      />
      {/* Filled arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={gaugeColor}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}55)` }}
      />
      {/* Score text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="32"
        fontWeight="700"
        fill="white"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fill="rgba(255,255,255,0.5)"
        fontWeight="500"
        letterSpacing="0.08em"
      >
        OUT OF 100
      </text>
    </svg>
  )
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Classification Badge ─────────────────────────────────────────────────────

function ClassBadge({ classKey, label }: { classKey: ScoreClass; label: string }) {
  const { text, bg, border } = classKeyToColors(classKey)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${text} ${bg} ${border}`}
    >
      {label}
    </span>
  )
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; fill: string }[]; label?: string }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-text-secondary mb-0.5">{label}</p>
      <p className="font-semibold text-text-primary">Score: {payload[0].value}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FunctionalFitnessPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
      } else {
        setChecked(true)
      }
    })
  }, [router])

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const composite = classifyComposite(COMPOSITE_SCORE)
  const compositeColors = classKeyToColors(composite.classKey)

  const ageDelta = CHRONOLOGICAL_AGE - FUNCTIONAL_AGE
  const ageLabel = ageDelta > 0 ? `${ageDelta} years younger` : ageDelta < 0 ? `${Math.abs(ageDelta)} years older` : 'on par'

  const chartData = MOCK_COMPONENTS.map((c) => ({
    name: c.shortLabel,
    score: c.score,
    fill: c.barColor,
  }))

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
            <h1 className="text-xl font-bold text-text-primary">Functional Fitness Battery</h1>
            <p className="text-sm text-text-secondary">5-test composite health assessment</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Composite Score Card ── */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-col items-center gap-4">
            <GaugeRing score={Math.round(COMPOSITE_SCORE)} />

            <div className="text-center space-y-2">
              <ClassBadge classKey={composite.classKey} label={composite.label} />
              <p className="text-text-secondary text-sm">Composite score across 5 validated tests</p>
            </div>

            {/* Functional age vs chronological */}
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              <div className="rounded-xl bg-surface-secondary border border-border p-4 text-center">
                <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Functional Age</p>
                <p className="text-4xl font-bold text-text-primary">{FUNCTIONAL_AGE}</p>
                <p className="text-xs text-green-400 mt-1 font-medium">{ageLabel}</p>
              </div>
              <div className="rounded-xl bg-surface-secondary border border-border p-4 text-center">
                <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">Chronological Age</p>
                <p className="text-4xl font-bold text-text-primary">{CHRONOLOGICAL_AGE}</p>
                <p className="text-xs text-text-secondary mt-1">calendar years</p>
              </div>
            </div>

            {/* Score breakdown label */}
            <p className="text-xs text-text-secondary text-center max-w-sm">
              Functional age is estimated from your composite score relative to age-matched population norms. A higher composite score yields a lower functional age.
            </p>
          </div>
        </div>

        {/* ── 5 Component Cards ── */}
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">Component Scores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_COMPONENTS.map((comp) => {
              const Icon = comp.Icon
              return (
                <div
                  key={comp.id}
                  className={`rounded-2xl border ${comp.borderColor} ${comp.bgColor} p-5 space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-black/20`}>
                        <Icon className={`w-4 h-4 ${comp.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{comp.label}</p>
                        <p className="text-xs text-text-secondary">{comp.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${comp.color}`}>{comp.value}</span>
                    <span className="text-sm text-text-secondary">{comp.unit}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-secondary">Score</span>
                      <ClassBadge classKey={comp.classKey} label={comp.classification} />
                    </div>
                    <ScoreBar score={comp.score} color={comp.barColor} />
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>0</span>
                      <span className={`font-semibold ${comp.color}`}>{comp.score}</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Fitness Profile Bar Chart ── */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Fitness Profile</h2>
          <p className="text-xs text-text-secondary -mt-2">Relative performance across all 5 components (0–100)</p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="rgba(255,255,255,0.06)"
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                content={
                  <CustomTooltip />
                }
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              {/* Reference line for Average zone */}
              <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-1">
            {MOCK_COMPONENTS.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.barColor }} />
                <span className="text-xs text-text-secondary">{c.shortLabel}</span>
              </div>
            ))}
          </div>

          {/* Score bands reference */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-secondary mb-2 font-medium">Score bands</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: 'Excellent', range: '90+', classKey: 'excellent' as ScoreClass },
                  { label: 'Above Average', range: '75–90', classKey: 'above-average' as ScoreClass },
                  { label: 'Average', range: '55–75', classKey: 'average' as ScoreClass },
                  { label: 'Below Average', range: '35–55', classKey: 'below-average' as ScoreClass },
                  { label: 'Poor', range: '<35', classKey: 'poor' as ScoreClass },
                ] as const
              ).map((band) => {
                const { text, bg, border } = classKeyToColors(band.classKey)
                return (
                  <span
                    key={band.classKey}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${text} ${bg} ${border}`}
                  >
                    {band.label}
                    <span className="opacity-60">{band.range}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Science Card ── */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-text-secondary" />
            <h2 className="text-base font-semibold text-text-primary">Evidence Base</h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            The Functional Fitness Battery combines five Apple Health metrics that each independently predict health outcomes. Together they form a composite picture of functional capacity that goes beyond step counts or calorie burn.
          </p>

          <div className="space-y-3">
            {[
              {
                title: 'VO\u2082 Max — All-Cause Mortality',
                body: 'Myers et al. (2002, NEJM) showed that exercise capacity measured in METs was the strongest predictor of death in both healthy men and those with cardiovascular disease, surpassing traditional risk factors.',
                color: 'text-purple-400',
              },
              {
                title: '6-Minute Walk Test — Functional Capacity',
                body: 'The ATS/ERS (2002) established the 6MWT as the gold standard for assessing submaximal functional exercise capacity, correlating strongly with VO\u2082 max and predicting outcomes in cardiac and pulmonary disease.',
                color: 'text-blue-400',
              },
              {
                title: 'Walking Steadiness — Fall Risk',
                body: 'Apple\u2019s CoreMotion Walking Steadiness algorithm (iOS 15+) uses on-device ML to estimate gait symmetry and balance, providing a continuous, passive fall-risk signal without clinical testing.',
                color: 'text-teal-400',
              },
              {
                title: 'Gait Speed — Survival Prediction',
                body: 'Studenski et al. (2011, JAMA) meta-analysed 9 cohorts and found gait speed ≥1.0 m/s associated with above-average survival. Each 0.1 m/s increase conferred a meaningful reduction in mortality risk.',
                color: 'text-green-400',
              },
              {
                title: 'Stair Ascent Speed — Cardiovascular Health',
                body: 'Bhatt et al. (2013) demonstrated that the rate of stair ascent independently predicts cardiovascular mortality. Ascending one flight in <14 seconds indicates good heart health.',
                color: 'text-orange-400',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-surface-secondary border border-border p-4 space-y-1">
                <p className={`text-sm font-semibold ${item.color}`}>{item.title}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-secondary border-t border-border pt-3 leading-relaxed">
            Composite score is the unweighted mean of the five component scores (each normalised 0–100 against published reference ranges). Functional age is estimated as: chronological age \u2212 \u230a(composite \u2212 50) \u00f7 10 \u00d7 3\u230b. Data shown are mock values for demonstration.
          </p>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
