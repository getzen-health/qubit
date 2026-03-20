'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ChevronRight, FlaskConical } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

// ─── Palette ──────────────────────────────────────────────────────────────────

const PURPLE      = '#8b5cf6'
const PURPLE_DIM  = 'rgba(139,92,246,0.18)'
const PURPLE_MID  = 'rgba(139,92,246,0.40)'
const PURPLE_AREA = 'rgba(139,92,246,0.12)'

// ─── Mock data generation ─────────────────────────────────────────────────────

const MONTHS_BACK = 18

// Seeded, deterministic noise so SSR and client match
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Anchor: "today" = March 2026, so index 0 = Sep 2024
function buildMonthLabel(idx: number): string {
  // idx 0 → 18 months ago from Mar 2026 → Sep 2024
  const base = new Date(2026, 2, 1) // March 2026
  base.setMonth(base.getMonth() - (MONTHS_BACK - 1 - idx))
  return `${MONTH_LABELS[base.getMonth()]} '${String(base.getFullYear()).slice(2)}`
}

interface DataPoint {
  month: string
  vo2: number
  trend: number
  isForecast: boolean
}

// Linear regression over an array of y-values (x = index 0..n-1)
function linReg(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length
  const xMean = (n - 1) / 2
  const yMean = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (ys[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den !== 0 ? num / den : 0
  const intercept = yMean - slope * xMean
  return { slope, intercept }
}

// Build 18 months historical + 6 months projection
function buildData(): DataPoint[] {
  // 18 actual monthly VO2 values — start ~44.5, slope ~+0.31 + realistic noise
  const actualVo2: number[] = Array.from({ length: MONTHS_BACK }, (_, i) => {
    const noise = (seededRand(i) - 0.5) * 1.6
    return +(44.5 + i * 0.31 + noise).toFixed(1)
  })

  // Compute regression over actual data
  const { slope, intercept } = linReg(actualVo2)

  const points: DataPoint[] = []

  // Historical: actual value + trend line
  for (let i = 0; i < MONTHS_BACK; i++) {
    points.push({
      month: buildMonthLabel(i),
      vo2: actualVo2[i],
      trend: +(intercept + slope * i).toFixed(2),
      isForecast: false,
    })
  }

  // Forecast: 6 months ahead (trend only, no actual)
  for (let f = 1; f <= 6; f++) {
    const idx = MONTHS_BACK - 1 + f
    points.push({
      month: buildMonthLabel(idx),
      vo2: undefined as unknown as number,
      trend: +(intercept + slope * idx).toFixed(2),
      isForecast: true,
    })
  }

  return points
}

const DATA = buildData()
const CURRENT_VO2 = 48.2
const SLOPE_MONTHLY = 0.31
const SLOPE_ANNUAL = +(SLOPE_MONTHLY * 12).toFixed(1)

// ─── Trajectory classification ────────────────────────────────────────────────

type TrajectoryClass =
  | 'rapidly-improving'
  | 'improving'
  | 'stable'
  | 'declining'
  | 'rapidly-declining'

interface TrajectoryConfig {
  label: string
  color: string
  dimColor: string
  Icon: React.ElementType
  description: string
}

const TRAJECTORY_MAP: Record<TrajectoryClass, TrajectoryConfig> = {
  'rapidly-improving': {
    label: 'Rapidly Improving',
    color: '#22c55e',
    dimColor: 'rgba(34,197,94,0.15)',
    Icon: TrendingUp,
    description: 'Exceptional aerobic adaptation in progress.',
  },
  'improving': {
    label: 'Improving',
    color: '#14b8a6',
    dimColor: 'rgba(20,184,166,0.15)',
    Icon: TrendingUp,
    description: 'Consistent positive cardio adaptation.',
  },
  'stable': {
    label: 'Stable',
    color: '#60a5fa',
    dimColor: 'rgba(96,165,250,0.15)',
    Icon: Minus,
    description: 'Maintenance phase — fitness is preserved.',
  },
  'declining': {
    label: 'Declining',
    color: '#f97316',
    dimColor: 'rgba(249,115,22,0.15)',
    Icon: TrendingDown,
    description: 'Gradual reduction in cardiorespiratory fitness.',
  },
  'rapidly-declining': {
    label: 'Rapidly Declining',
    color: '#ef4444',
    dimColor: 'rgba(239,68,68,0.15)',
    Icon: TrendingDown,
    description: 'Significant fitness loss — review training load.',
  },
}

function classifyTrajectory(slope: number): TrajectoryClass {
  if (slope > 0.5)  return 'rapidly-improving'
  if (slope > 0.05) return 'improving'
  if (slope >= -0.05) return 'stable'
  if (slope >= -0.5) return 'declining'
  return 'rapidly-declining'
}

const TRAJ_CLASS = classifyTrajectory(SLOPE_MONTHLY)
const TRAJ_CFG   = TRAJECTORY_MAP[TRAJ_CLASS]

// ─── Fitness thresholds (male, age 35) ───────────────────────────────────────

interface Threshold {
  level: string
  vo2: number
  color: string
}

const THRESHOLDS: Threshold[] = [
  { level: 'Excellent',  vo2: 52, color: '#a855f7' },
  { level: 'Above Avg',  vo2: 46, color: '#22c55e' },
  { level: 'Average',    vo2: 40, color: '#14b8a6' },
  { level: 'Below Avg',  vo2: 34, color: '#f97316' },
  { level: 'Low',        vo2: 28, color: '#ef4444' },
]

function monthsToThreshold(target: number, current: number, slope: number): string {
  if (current >= target) return 'Already achieved'
  if (slope <= 0) return 'Not on current trajectory'
  const months = Math.ceil((target - current) / slope)
  return `~${months} months at current rate`
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--color-surface, #111)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        minWidth: 160,
      }}
    >
      <p style={{ color: 'var(--color-text-secondary, #888)', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </p>
      {payload.map((entry) => {
        if (entry.value == null) return null
        return (
          <p key={entry.dataKey} style={{ color: entry.color, marginBottom: 2 }}>
            {entry.name}:{' '}
            <span style={{ fontWeight: 700 }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>{' '}
            <span style={{ opacity: 0.65 }}>ml/kg/min</span>
          </p>
        )
      })}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary mb-3">
      {children}
    </p>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-2xl border border-border p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── Research benchmarks ──────────────────────────────────────────────────────

interface Benchmark {
  range: string
  label: string
  sub: string
  color: string
}

const BENCHMARKS: Benchmark[] = [
  { range: '+5–10',   label: 'Untrained beginner',         sub: 'First 3–6 months of training',            color: '#22c55e' },
  { range: '+2–4',    label: 'Recreationally fit',         sub: 'Per training year',                       color: '#14b8a6' },
  { range: '+0.5–1.5',label: 'Well-trained athlete',       sub: 'Per year of continued training',          color: '#60a5fa' },
  { range: '−0.5–1.0',label: 'Expected annual decline',    sub: 'Without structured training',             color: '#f97316' },
  { range: 'Maintained', label: 'Consistent Zone 2',        sub: 'Preserves VO₂ max over time',            color: PURPLE    },
]

// ─── Page component ───────────────────────────────────────────────────────────

export default function VO2MaxTrajectoryPage() {
  const { color: trajColor, dimColor: trajDimColor, label: trajLabel, Icon: TrajIcon } = TRAJ_CFG

  // Y-axis domain: include both actual and projected values
  const allTrendValues = DATA.map((d) => d.trend)
  const allVo2Values   = DATA.filter((d) => d.vo2 != null).map((d) => d.vo2)
  const yMin = Math.floor(Math.min(...allTrendValues, ...allVo2Values)) - 1
  const yMax = Math.ceil(Math.max(...allTrendValues, ...allVo2Values)) + 2

  // Projection values
  const proj1  = +(CURRENT_VO2 + SLOPE_MONTHLY * 1).toFixed(1)
  const proj3  = +(CURRENT_VO2 + SLOPE_MONTHLY * 3).toFixed(1)
  const proj6  = +(CURRENT_VO2 + SLOPE_MONTHLY * 6).toFixed(1)

  // Divider index between history and forecast
  const forecastStart = MONTHS_BACK

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/vo2max"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to VO₂ Max"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Cardio Fitness Trajectory</h1>
            <p className="text-sm text-text-secondary">VO₂ max rate of change &amp; projection</p>
          </div>
          {/* purple gradient accent dot */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${PURPLE} 0%, #6d28d9 100%)`,
              boxShadow: `0 0 12px ${PURPLE_MID}`,
            }}
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* ── Status Banner ── */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: trajDimColor, borderColor: trajColor + '44' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: trajColor + '22', border: `1.5px solid ${trajColor}55` }}
            >
              <TrajIcon className="w-6 h-6" style={{ color: trajColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-lg font-bold leading-tight"
                style={{ color: trajColor }}
              >
                {trajLabel}
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                {TRAJ_CFG.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                <span className="text-sm font-semibold tabular-nums" style={{ color: trajColor }}>
                  {SLOPE_MONTHLY > 0 ? '+' : ''}{SLOPE_MONTHLY} mL/kg/min per month
                </span>
                <span className="text-sm text-text-secondary tabular-nums">
                  Current: <span className="text-text-primary font-semibold">{CURRENT_VO2}</span> mL/kg/min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Chart ── */}
        <Card className="!p-4">
          <SectionLabel>18-Month History + 6-Month Projection</SectionLabel>

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={DATA} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="vo2AreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={PURPLE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.07}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />

              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(v: number) => v.toFixed(0)}
              />

              {/* Divider between history and forecast */}
              <ReferenceLine
                x={DATA[forecastStart - 1].month}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: 'Today',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'rgba(255,255,255,0.35)',
                }}
              />

              {/* Current VO2 reference */}
              <ReferenceLine
                y={CURRENT_VO2}
                stroke={PURPLE_MID}
                strokeWidth={1}
                strokeDasharray="5 3"
                label={{
                  value: `${CURRENT_VO2}`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: PURPLE,
                }}
              />

              {/* Area under actual line */}
              <Area
                type="monotone"
                dataKey="vo2"
                name="Monthly VO₂ Max"
                fill="url(#vo2AreaGrad)"
                stroke={PURPLE}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: PURPLE, stroke: '#fff', strokeWidth: 1.5 }}
                connectNulls={false}
              />

              {/* Trend/projection line */}
              <Line
                type="monotone"
                dataKey="trend"
                name="Trend Line"
                stroke={trajColor}
                strokeWidth={1.8}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4, fill: trajColor }}
              />

              <Tooltip content={<ChartTooltip />} cursor={{ stroke: PURPLE, strokeOpacity: 0.12 }} />

              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                formatter={(value: string) => (
                  <span style={{ color: 'var(--color-text-secondary, #888)' }}>{value}</span>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* ── 6-Month Projection ── */}
        <div>
          <SectionLabel>6-Month Projection</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: '1 Month', value: proj1 },
              { label: '3 Months', value: proj3 },
              { label: '6 Months', value: proj6 },
            ] as const).map(({ label, value }) => {
              const delta = +(value - CURRENT_VO2).toFixed(1)
              return (
                <div
                  key={label}
                  className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1.5"
                >
                  <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                    {label}
                  </p>
                  <p
                    className="text-2xl font-bold tabular-nums leading-none"
                    style={{ color: trajColor }}
                  >
                    {value.toFixed(1)}
                  </p>
                  <p className="text-xs text-text-secondary">mL/kg/min</p>
                  <p
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: delta >= 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {delta >= 0 ? '+' : ''}{delta} from now
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Research Benchmarks ── */}
        <Card>
          <SectionLabel>Training Research Benchmarks</SectionLabel>
          <div className="space-y-2.5">
            {BENCHMARKS.map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                {/* left color bar */}
                <div
                  className="w-1 rounded-full shrink-0 mt-0.5"
                  style={{ background: b.color, height: 36 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: b.color }}
                    >
                      {b.range} mL/kg/min/yr
                    </span>
                    <span className="text-sm text-text-primary font-medium">{b.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
          {/* User's annualized rate */}
          <div
            className="mt-4 pt-4 border-t border-border flex items-center justify-between"
          >
            <span className="text-xs text-text-secondary">Your annualized rate</span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: trajColor }}
            >
              {SLOPE_ANNUAL > 0 ? '+' : ''}{SLOPE_ANNUAL} mL/kg/min/year
            </span>
          </div>
        </Card>

        {/* ── Fitness Threshold Crossings ── */}
        <Card>
          <SectionLabel>Fitness Threshold Crossings</SectionLabel>
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="divide-y divide-border">
              {THRESHOLDS.map((t) => {
                const achieved = CURRENT_VO2 >= t.vo2
                const eta = monthsToThreshold(t.vo2, CURRENT_VO2, SLOPE_MONTHLY)
                return (
                  <div
                    key={t.level}
                    className="flex items-center gap-3 px-4 py-3"
                    style={achieved ? { background: t.color + '0d' } : undefined}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: t.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{t.level}</p>
                      <p className="text-xs text-text-secondary tabular-nums">
                        Target: {t.vo2} mL/kg/min
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {achieved ? (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: t.color + '22', color: t.color }}
                        >
                          Achieved
                        </span>
                      ) : (
                        <p className="text-xs text-text-secondary">{eta}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* ── Science Card ── */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: PURPLE_DIM, border: `1px solid ${PURPLE_MID}` }}
            >
              <FlaskConical className="w-4 h-4" style={{ color: PURPLE }} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">The Science of VO₂ Max Change</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Saltin &amp; Astrand 1967 · Bassett &amp; Howley 2000 · Apple Watch methodology
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
            <p>
              <strong className="text-text-primary">Strongest mortality predictor.</strong>{' '}
              Cardiorespiratory fitness, as estimated by VO₂ max, is the single strongest independent
              predictor of all-cause and cardiovascular mortality — surpassing traditional risk factors
              including smoking, hypertension, and diabetes. Each 1 mL/kg/min improvement is associated
              with a 2–3% reduction in cardiovascular risk.
            </p>
            <p>
              <strong className="text-text-primary">Apple Watch estimation.</strong>{' '}
              Apple Watch uses the Firstbeat algorithm — combining GPS pace, heart rate response, and
              motion data — during outdoor walks, runs, and hikes. Independent validation shows estimates
              within ±3.5 mL/kg/min of lab-measured values, sufficient for tracking longitudinal changes.
            </p>
            <p>
              <strong className="text-text-primary">Saltin &amp; Astrand (1967)</strong> established that
              VO₂ max is trainable across all ages and fitness levels. Untrained individuals can improve
              by 15–20% within weeks of starting structured aerobic exercise. Trained athletes typically
              see 2–4% annual improvements, with diminishing returns as fitness peaks.
            </p>
            <p>
              <strong className="text-text-primary">Bassett &amp; Howley (2000)</strong> clarified the
              limiting factors of VO₂ max: cardiac output (stroke volume × heart rate) accounts for the
              majority of individual variation, with oxygen-carrying capacity and peripheral muscle
              extraction playing secondary roles. Interval training and Zone 2 work target both.
            </p>
          </div>

          <div
            className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-text-secondary"
          >
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span>
              Values are estimates for personal fitness tracking only. Not a clinical assessment.
            </span>
          </div>
        </Card>

      </main>

      <BottomNav />
    </div>
  )
}
