'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  Heart,
  Activity,
  Footprints,
  Thermometer,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertLevel = 'Normal' | 'Caution' | 'Alert' | 'Warning'

interface SignalCard {
  icon: React.ReactNode
  name: string
  current: string
  baseline: string
  deviation: string
  deviationSign: 'positive' | 'negative' | 'neutral'
  score: number       // 0–3
  scoreColor: string  // color class for filled dots
  label: string       // e.g. "orange", "yellow", "green"
}

interface TempDataPoint {
  day: string
  deviation: number
}

interface CalendarDay {
  date: number
  level: AlertLevel | null  // null = no data (future)
}

// ─── Alert Level Config ───────────────────────────────────────────────────────

const ALERT_CONFIG: Record<AlertLevel, { bg: string; text: string; border: string; label: string }> = {
  Normal:  { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-300 dark:border-green-700',  label: 'Normal'  },
  Caution: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700', label: 'Caution' },
  Alert:   { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700', label: 'Alert'   },
  Warning: { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',       border: 'border-red-300 dark:border-red-700',       label: 'Warning' },
}

function alertLevelFromScore(score: number): AlertLevel {
  if (score <= 2) return 'Normal'
  if (score <= 4) return 'Caution'
  if (score <= 6) return 'Alert'
  return 'Warning'
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TOTAL_SCORE = 3
const CURRENT_LEVEL: AlertLevel = 'Caution'

const SIGNAL_CARDS: SignalCard[] = [
  {
    icon: <Activity className="w-5 h-5" />,
    name: 'Heart Rate Variability',
    current: '38 ms',
    baseline: '45 ms',
    deviation: '−16%',
    deviationSign: 'negative',
    score: 2,
    scoreColor: 'bg-orange-500',
    label: 'orange',
  },
  {
    icon: <Heart className="w-5 h-5" />,
    name: 'Resting Heart Rate',
    current: '63 bpm',
    baseline: '60 bpm',
    deviation: '+5%',
    deviationSign: 'positive',
    score: 1,
    scoreColor: 'bg-yellow-500',
    label: 'yellow',
  },
  {
    icon: <Footprints className="w-5 h-5" />,
    name: 'Daily Steps',
    current: '8,200',
    baseline: '9,500',
    deviation: '−14%',
    deviationSign: 'negative',
    score: 0,
    scoreColor: 'bg-green-500',
    label: 'green',
  },
  {
    icon: <Thermometer className="w-5 h-5" />,
    name: 'Wrist Temperature',
    current: '+0.1°C',
    baseline: '0.0°C',
    deviation: '+0.1°C',
    deviationSign: 'neutral',
    score: 0,
    scoreColor: 'bg-green-500',
    label: 'green',
  },
]

// 30 days of wrist temperature deviations — day 0 is 30 days ago, day 29 is today
function buildTempData(): TempDataPoint[] {
  const baseDeviations = [
    0.0, 0.1, -0.1, 0.0, 0.0, 0.2, 0.1,
    0.0, -0.1, 0.0, 0.6, 0.3, 0.1, 0.0,
    0.0, -0.1, 0.0, 0.1, 0.0, 0.4, 0.2,
    0.1, 0.0, 0.0, -0.1, 0.0, 0.1, 0.0,
    0.0, 0.1,
  ]

  const today = new Date(2026, 2, 20) // March 20, 2026
  return baseDeviations.map((deviation, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    return { day: label, deviation }
  })
}

const TEMP_DATA = buildTempData()

// 30-day calendar grid — 4 rows × 7 columns + 2 remaining days
function buildCalendarDays(): CalendarDay[] {
  const today = new Date(2026, 2, 20)
  const levels: AlertLevel[] = ['Normal', 'Caution', 'Alert', 'Warning']

  // Deterministic pattern for the 30-day window
  const levelPattern: (AlertLevel | null)[] = [
    'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal',
    'Normal', 'Normal', 'Normal', 'Caution', 'Caution', 'Normal', 'Normal',
    'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Alert', 'Caution',
    'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal', 'Normal',
    'Caution', 'Caution',
  ]

  return levelPattern.map((level, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return { date: d.getDate(), level }
  })
}

const CALENDAR_DAYS = buildCalendarDays()

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreDots({ score, colorClass }: { score: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i < score ? colorClass : 'bg-gray-200 dark:bg-gray-700'}`}
        />
      ))}
      <span className="ml-1 text-xs text-text-secondary">{score}/3</span>
    </div>
  )
}

function DeviationBadge({ value, sign }: { value: string; sign: SignalCard['deviationSign'] }) {
  const cls =
    sign === 'negative'
      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      : sign === 'positive'
      ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cls}`}>{value}</span>
  )
}

function CalendarCell({ level }: { level: AlertLevel | null }) {
  if (!level) {
    return <div className="w-7 h-7 rounded bg-gray-100 dark:bg-gray-800 opacity-30" />
  }
  const map: Record<AlertLevel, string> = {
    Normal:  'bg-green-400 dark:bg-green-600',
    Caution: 'bg-yellow-400 dark:bg-yellow-500',
    Alert:   'bg-orange-400 dark:bg-orange-500',
    Warning: 'bg-red-500 dark:bg-red-600',
  }
  return (
    <div
      className={`w-7 h-7 rounded ${map[level]}`}
      title={level}
    />
  )
}

interface TempTooltipPayload {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TempTooltipPayload[]
  label?: string
}

function TempTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-white dark:bg-gray-800 border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="text-text-secondary">
        Deviation:{' '}
        <span className={val >= 0.5 ? 'text-red-500 font-semibold' : 'text-text-primary'}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}°C
        </span>
      </p>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function ImmuneStressClient() {
  const levelCfg = ALERT_CONFIG[CURRENT_LEVEL]

  // Gauge: map score 0-10 to a semicircular arc (180 degrees)
  // We'll render a simple SVG gauge
  const gaugeAngle = (TOTAL_SCORE / 10) * 180 // degrees from left (0°=left, 180°=right)
  const gaugeRad = ((gaugeAngle - 90) * Math.PI) / 180
  const cx = 60
  const cy = 60
  const r = 48
  const needleX = cx + r * Math.cos(gaugeRad - Math.PI / 2 + Math.PI)
  const needleY = cy + r * Math.sin(gaugeRad - Math.PI / 2 + Math.PI)

  // Segments: Normal 0-2, Caution 3-4, Alert 5-6, Warning 7-10
  // Arc from 180° to 0° (counter-clockwise), each segment proportional
  function arcPath(startPct: number, endPct: number, radius: number): string {
    const startAngle = Math.PI - startPct * Math.PI
    const endAngle = Math.PI - endPct * Math.PI
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const largeArc = endPct - startPct > 0.5 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  const segments = [
    { start: 0, end: 0.2,  color: '#22c55e', level: 'Normal'  },
    { start: 0.2, end: 0.4, color: '#eab308', level: 'Caution' },
    { start: 0.4, end: 0.6, color: '#f97316', level: 'Alert'   },
    { start: 0.6, end: 1.0, color: '#ef4444', level: 'Warning' },
  ]

  // Needle pointing at score 3 = 30% of the arc
  const needlePct = TOTAL_SCORE / 10
  const needleAngle = Math.PI - needlePct * Math.PI
  const needleTipX = cx + (r - 4) * Math.cos(needleAngle)
  const needleTipY = cy + (r - 4) * Math.sin(needleAngle)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <h1 className="text-xl font-bold text-text-primary">Immune Stress Index</h1>
            <p className="text-sm text-text-secondary">Illness Early Warning System</p>
          </div>
          <Shield className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">

        {/* ── Status Card ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <div className="flex items-center gap-6">
            {/* Gauge SVG */}
            <div className="flex-shrink-0">
              <svg width="120" height="70" viewBox="0 0 120 70">
                {/* Background track */}
                <path
                  d={arcPath(0, 1, r)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-gray-200 dark:text-gray-700"
                  strokeLinecap="round"
                />
                {/* Colored segments */}
                {segments.map((seg) => (
                  <path
                    key={seg.level}
                    d={arcPath(seg.start, seg.end, r)}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeLinecap="butt"
                    opacity="0.85"
                  />
                ))}
                {/* Needle */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={needleTipX}
                  y2={needleTipY}
                  stroke="#1f2937"
                  className="dark:stroke-white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r="4" fill="#1f2937" className="dark:fill-white" />
                {/* Score label */}
                <text
                  x={cx}
                  y={cy + 18}
                  textAnchor="middle"
                  className="fill-text-primary"
                  style={{ fontSize: 18, fontWeight: 700, fill: 'currentColor' }}
                >
                  {TOTAL_SCORE}
                </text>
                <text
                  x={cx}
                  y={cy + 30}
                  textAnchor="middle"
                  style={{ fontSize: 8, fill: '#6b7280' }}
                >
                  out of 10
                </text>
              </svg>
            </div>

            {/* Status text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${levelCfg.bg} ${levelCfg.text} ${levelCfg.border}`}
                >
                  {CURRENT_LEVEL}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Mild signal deviation. Monitor over next 24–48h. Prioritize sleep.
              </p>
            </div>
          </div>
        </div>

        {/* ── Alert Level Bands ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Alert Levels</h2>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {(
              [
                { label: 'Normal',  range: '0–2',  bg: 'bg-green-500',  active: false },
                { label: 'Caution', range: '3–4',  bg: 'bg-yellow-400', active: true  },
                { label: 'Alert',   range: '5–6',  bg: 'bg-orange-500', active: false },
                { label: 'Warning', range: '7–10', bg: 'bg-red-500',    active: false },
              ] as const
            ).map((band) => (
              <div
                key={band.label}
                className={`flex-1 flex flex-col items-center py-2.5 px-1 transition-all ${
                  band.active
                    ? `${band.bg} ring-2 ring-inset ring-white/60 scale-y-105 z-10`
                    : `${band.bg} opacity-40`
                }`}
              >
                <span className="text-white font-bold text-xs">{band.label}</span>
                <span className="text-white/80 text-[10px]">{band.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4 Signal Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {SIGNAL_CARDS.map((signal) => (
            <div
              key={signal.name}
              className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-text-secondary">
                {signal.icon}
                <span className="text-xs font-medium leading-tight">{signal.name}</span>
              </div>

              <div>
                <p className="text-xl font-bold text-text-primary">{signal.current}</p>
                <p className="text-xs text-text-secondary">Baseline: {signal.baseline}</p>
              </div>

              <div className="flex items-center justify-between">
                <DeviationBadge value={signal.deviation} sign={signal.deviationSign} />
              </div>

              <ScoreDots score={signal.score} colorClass={signal.scoreColor} />
            </div>
          ))}
        </div>

        {/* ── Wrist Temperature Chart ───────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Wrist Temperature Deviation</h2>
            <Thermometer className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-xs text-text-secondary mb-4">30-day history · °C from baseline</p>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={TEMP_DATA} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                interval={6}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                domain={[-0.2, 0.8]}
                tickCount={5}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`}
              />
              <Tooltip content={<TempTooltip />} />
              <ReferenceLine
                y={0.5}
                stroke="#ef4444"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{
                  value: '+0.5°C threshold',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#ef4444',
                }}
              />
              <Bar dataKey="deviation" radius={[2, 2, 0, 0]} maxBarSize={12}>
                {TEMP_DATA.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.deviation >= 0.5
                        ? '#ef4444'
                        : entry.deviation >= 0.2
                        ? '#f97316'
                        : entry.deviation < 0
                        ? '#6b7280'
                        : '#3b82f6'
                    }
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {[
              { color: 'bg-blue-500',   label: 'Normal (+0 to +0.2°C)'  },
              { color: 'bg-orange-500', label: 'Mild (+0.2 to +0.5°C)'  },
              { color: 'bg-red-500',    label: 'Elevated (≥+0.5°C)'     },
              { color: 'bg-gray-500',   label: 'Below baseline'          },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 30-Day History Calendar ───────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">30-Day Alert History</h2>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[10px] text-text-secondary font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid — pad to align with day of week */}
          {(() => {
            // March 20, 2026 is a Friday. 30 days ago = Feb 19, 2026 (Thursday).
            // Feb 19 = Thursday = index 4 (Sun=0)
            const startOffset = 4 // Thursday
            const padded = [
              ...Array(startOffset).fill(null),
              ...CALENDAR_DAYS,
            ]
            // Fill to complete rows
            while (padded.length % 7 !== 0) padded.push(null)
            const weeks: (CalendarDay | null)[][] = []
            for (let i = 0; i < padded.length; i += 7) {
              weeks.push(padded.slice(i, i + 7) as (CalendarDay | null)[])
            }
            return weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((day, di) => (
                  <div key={di} className="flex justify-center">
                    {day ? (
                      <div className="relative group">
                        <CalendarCell level={day.level} />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white/70 font-medium leading-none">
                          {day.date}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-20">
                          {day.level}
                        </div>
                      </div>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                ))}
              </div>
            ))
          })()}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {(
              [
                { color: 'bg-green-400',  label: 'Normal'  },
                { color: 'bg-yellow-400', label: 'Caution' },
                { color: 'bg-orange-400', label: 'Alert'   },
                { color: 'bg-red-500',    label: 'Warning' },
              ] as const
            ).map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded ${item.color}`} />
                <span className="text-[10px] text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science Card ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <h2 className="text-sm font-semibold text-text-primary">Science Basis</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: <Activity className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />,
                title: 'HRV Early Warning',
                body:
                  'HRV drops 10–20% in the 24–48 hours before clinical illness symptoms appear, as the autonomic nervous system responds to early immune activation. (Nieman 2019, Sports Medicine)',
              },
              {
                icon: <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />,
                title: 'RHR Cytokine Response',
                body:
                  'Resting heart rate elevates 5–10 bpm during immune activation driven by pro-inflammatory cytokines (IL-6, TNF-α), often preceding fever. (Bonnar 2018, SJMS)',
              },
              {
                icon: <Thermometer className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
                title: 'Wrist Temperature Sensitivity',
                body:
                  'Apple Watch wrist temperature sensor detects deviations as small as 0.1°C from individual baseline. A deviation >+0.5°C signals early fever-like immune response. (Apple WWDC21)',
              },
              {
                icon: <Footprints className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />,
                title: 'Activity Reduction Signal',
                body:
                  'Step count declines >30% before self-reported illness onset, reflecting involuntary behavioral change — the body conserving energy for immune defense.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-2">
                {item.icon}
                <div>
                  <p className="text-xs font-semibold text-text-primary mb-0.5">{item.title}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-secondary leading-relaxed">
                This index is informational only and does not constitute medical advice. Consult a
                healthcare professional if you experience symptoms of illness.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
