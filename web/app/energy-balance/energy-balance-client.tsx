'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { EnergyBalanceData, DimensionResult, WeekBalancePoint } from './page'

interface Props {
  data: EnergyBalanceData
}

// ─── Dimension config ─────────────────────────────────────────────────────────

interface DimConfig {
  key: keyof Pick<EnergyBalanceData, 'aerobic' | 'threshold' | 'vo2max' | 'strength' | 'recovery'>
  label: string
  radarLabel: string
  color: string
  unit: string
  targetLabel: string
  description: string
  advice: string
}

const DIMS: DimConfig[] = [
  {
    key: 'aerobic',
    label: 'Aerobic Base',
    radarLabel: 'Aerobic',
    color: '#14b8a6',
    unit: '%',
    targetLabel: '80% of cardio time',
    description: 'Time spent in Zone 1–2 (< 70% max HR) — the foundation of endurance and fat metabolism.',
    advice: 'Easy runs, rides, and swims at conversational pace build your aerobic engine over months.',
  },
  {
    key: 'threshold',
    label: 'Threshold',
    radarLabel: 'Threshold',
    color: '#f97316',
    unit: '%',
    targetLabel: '15% of cardio time',
    description: 'Time in Zone 3–4 (70–90% max HR) — pushing lactate threshold and sustainable power.',
    advice: 'Tempo intervals, sweet-spot cycling, or threshold runs 1–2× per week drive significant fitness gains.',
  },
  {
    key: 'vo2max',
    label: 'VO₂ Max',
    radarLabel: 'VO₂ Max',
    color: '#a855f7',
    unit: '%',
    targetLabel: '5% of cardio time',
    description: 'Time in Zone 5 (> 90% max HR) — high-intensity efforts that raise your aerobic ceiling.',
    advice: 'Short, hard intervals (e.g., 4×4 min at max effort) are highly effective — keep them brief.',
  },
  {
    key: 'strength',
    label: 'Strength',
    radarLabel: 'Strength',
    color: '#3b82f6',
    unit: '%',
    targetLabel: '20–30% of sessions',
    description: 'Proportion of sessions that include resistance or functional strength training.',
    advice: 'Strength training reduces injury risk and boosts performance across all endurance disciplines.',
  },
  {
    key: 'recovery',
    label: 'Recovery',
    radarLabel: 'Recovery',
    color: '#22c55e',
    unit: ' days/wk',
    targetLabel: '2 rest days per week',
    description: 'Average rest days per week — unstructured days are when adaptation actually happens.',
    advice: 'Plan at least 2 full rest or active-recovery days each week to prevent accumulated fatigue.',
  },
]

// ─── Score colour ─────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Needs Work'
  return 'Off Balance'
}

// ─── Custom Tooltip: radar ────────────────────────────────────────────────────

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: { subject: string; score: number } }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-text-primary mb-0.5">{d.subject}</p>
      <p className="text-text-secondary tabular-nums">
        Score:{' '}
        <span className="font-medium" style={{ color: scoreColor(d.score) }}>
          {d.score}
        </span>
        /100
      </p>
    </div>
  )
}

// ─── Custom Tooltip: trend line ───────────────────────────────────────────────

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-text-primary mb-0.5">{label}</p>
      <p className="tabular-nums" style={{ color: scoreColor(score) }}>
        Balance: {score}/100
      </p>
    </div>
  )
}

// ─── Progress bar for a dimension ────────────────────────────────────────────

function DimensionBar({ dim, result }: { dim: DimConfig; result: DimensionResult }) {
  const actualPct = Math.min(100, result.actual)
  const targetPct = Math.min(100, result.target)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dim.color }} />
          <span className="text-sm font-medium text-text-primary">{dim.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary tabular-nums">
            {result.actual}{dim.unit} / target {result.target}{dim.unit}
          </span>
          <span
            className="text-xs font-bold tabular-nums w-8 text-right"
            style={{ color: scoreColor(result.score) }}
          >
            {result.score}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-surface-secondary rounded-full overflow-hidden">
        {/* Actual fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${actualPct}%`,
            backgroundColor: dim.color,
            opacity: 0.85,
          }}
        />
        {/* Target marker */}
        {targetPct <= 100 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-white/70 dark:bg-white/40"
            style={{ left: `${targetPct}%` }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Format week label ────────────────────────────────────────────────────────

function fmtWeek(monday: string): string {
  const d = new Date(monday + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// ─── Main client component ────────────────────────────────────────────────────

export function EnergyBalanceClient({ data }: Props) {
  const { aerobic, threshold, vo2max, strength, recovery, overallScore, weekTrend, totalWorkouts, noData } = data

  if (noData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-surface-secondary border border-border flex items-center justify-center mb-4">
          <span className="text-3xl">⚡</span>
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No Workouts Found</h2>
        <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
          Energy system balance requires at least a few workouts in the last 28 days. Sync your Apple Health data and check back soon.
        </p>
      </div>
    )
  }

  const heroColor = scoreColor(overallScore)
  const heroLabel = scoreLabel(overallScore)

  // Radar chart data — one point per dimension
  const dimMap: Record<string, DimensionResult> = { aerobic, threshold, vo2max, strength, recovery }
  const radarData = DIMS.map((d) => ({
    subject: d.radarLabel,
    score: dimMap[d.key].score,
    fullMark: 100,
  }))

  // 4-week trend chart data
  const trendData: { label: string; score: number }[] = weekTrend.map((pt: WeekBalancePoint) => ({
    label: fmtWeek(pt.monday),
    score: pt.overallScore,
  }))

  const latestTrendScore = trendData.length > 0 ? trendData[trendData.length - 1].score : overallScore
  const prevTrendScore = trendData.length > 1 ? trendData[trendData.length - 2].score : null
  const trendDelta = prevTrendScore !== null ? latestTrendScore - prevTrendScore : null

  return (
    <div className="space-y-4">

      {/* ── Hero card ────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
          Overall Balance Score
        </p>

        <div className="flex items-end gap-5 mb-4">
          <div>
            <span
              className="text-7xl font-bold tabular-nums leading-none"
              style={{ color: heroColor }}
            >
              {overallScore}
            </span>
            <span className="text-xl font-medium text-text-secondary ml-1.5">/100</span>
          </div>
          <div className="mb-1.5">
            <p className="text-sm font-semibold" style={{ color: heroColor }}>
              {heroLabel}
            </p>
            {trendDelta !== null && (
              <p className="text-xs text-text-secondary mt-0.5">
                {trendDelta > 0 ? '+' : ''}{trendDelta} vs last week
              </p>
            )}
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-full text-xs font-medium text-text-primary">
            <span style={{ color: '#14b8a6' }}>●</span>
            {totalWorkouts} workouts · 28d
          </span>
          {DIMS.map((d) => (
            <span
              key={d.key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-full text-xs font-medium"
              style={{ color: scoreColor(dimMap[d.key].score) }}
            >
              {d.label}: {dimMap[d.key].score}
            </span>
          ))}
        </div>
      </div>

      {/* ── Radar chart card ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Training Dimensions</h2>
        <p className="text-xs text-text-secondary mb-4">
          Radar shows score 0–100 per dimension · peak = on target
        </p>

        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)', fontWeight: 500 }}
            />
            <Radar
              name="Balance"
              dataKey="score"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Tooltip content={<RadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Radar legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
          {DIMS.map((d) => (
            <div key={d.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-text-secondary">
                {d.label}
                <span className="ml-1 font-semibold" style={{ color: scoreColor(dimMap[d.key].score) }}>
                  {dimMap[d.key].score}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress bars card ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">Actual vs Target</h2>
          <p className="text-xs text-text-secondary">White marker = target · bar = actual · score out of 100</p>
        </div>

        {DIMS.map((d) => (
          <DimensionBar key={d.key} dim={d} result={dimMap[d.key]} />
        ))}
      </div>

      {/* ── 4-week trend card ─────────────────────────────────────────────────── */}
      {trendData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">4-Week Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Overall balance score by week</p>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                allowDecimals={false}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
              {/* Target reference at 75 (green threshold) */}
              <ReferenceLine
                y={75}
                stroke="rgba(34,197,94,0.25)"
                strokeDasharray="4 2"
                label={{
                  value: 'Good',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'rgba(34,197,94,0.5)',
                  dy: -3,
                }}
              />
              <ReferenceLine
                y={50}
                stroke="rgba(245,158,11,0.2)"
                strokeDasharray="4 2"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#14b8a6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#14b8a6', stroke: 'var(--color-surface, #111)', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Guidelines card ───────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Training Dimension Guide</h2>
        <div className="space-y-4">
          {DIMS.map((d) => {
            const result = dimMap[d.key]
            const isOk = result.score >= 70
            return (
              <div
                key={d.key}
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: d.color + '10',
                  borderColor: d.color + '30',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <p className="text-sm font-semibold" style={{ color: d.color }}>
                      {d.label}
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary">{d.targetLabel}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-2">{d.description}</p>
                {!isOk && (
                  <p className="text-xs leading-relaxed" style={{ color: d.color, opacity: 0.85 }}>
                    {d.advice}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Methodology card ─────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 text-xs text-text-secondary space-y-2">
        <p className="font-semibold text-text-primary text-sm">How Scores Are Calculated</p>
        <p>
          Each dimension is scored 0–100 based on how close your actual training distribution is to the recommended target. Scores peak at 100 when exactly on target and decrease for both over- and under-dosing.
        </p>
        <div className="space-y-1 pt-1">
          <p><span className="font-medium text-text-primary">HR zones</span> are estimated from your average workout heart rate relative to recorded max HR (or 190 bpm if unavailable): Z1–Z2 &lt; 70%, Z3–Z4 70–90%, Z5 &gt; 90%.</p>
          <p><span className="font-medium text-text-primary">Strength sessions</span> are detected by workout type keyword matching (strength, weight, functional, resistance, crossfit, core, pilates, etc.).</p>
          <p><span className="font-medium text-text-primary">Recovery days</span> are any calendar day with no recorded workout in the 28-day window, averaged to a per-week rate.</p>
          <p><span className="font-medium text-text-primary">Overall score</span> is the simple average of all five dimension scores.</p>
        </div>
        <p className="opacity-60 pt-1">
          Targets are based on the 80/15/5 polarised training model (Seiler et al.), ACSM strength guidelines (2–3×/week), and general sports science recovery consensus.
        </p>
      </div>

    </div>
  )
}
