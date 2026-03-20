'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Dot,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FitnessLevel = 'excellent' | 'good' | 'fair' | 'low'

export interface DailyReading {
  date: string
  distance: number
  level: FitnessLevel
}

export interface SixMinuteWalkData {
  latest: number
  latestLevel: FitnessLevel
  avg90d: number
  best: number
  trend: number // delta from first to last reading (m)
  readingCount: number
  daily: DailyReading[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE        = '#3B82F6'
const BLUE_MUTED  = 'rgba(59,130,246,0.18)'
const GREEN       = '#22c55e'
const YELLOW      = '#facc15'
const ORANGE      = '#fb923c'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Age-group norms data ────────────────────────────────────────────────────

const AGE_GROUP_NORMS = [
  { group: '40–49', male: 583, female: 531 },
  { group: '50–59', male: 560, female: 511 },
  { group: '60–69', male: 533, female: 487 },
  { group: '70–79', male: 497, female: 453 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levelColor(level: FitnessLevel): string {
  if (level === 'excellent') return GREEN
  if (level === 'good')      return BLUE
  if (level === 'fair')      return YELLOW
  return ORANGE
}

function levelLabel(level: FitnessLevel): string {
  if (level === 'excellent') return 'Excellent'
  if (level === 'good')      return 'Good'
  if (level === 'fair')      return 'Fair'
  return 'Low'
}

function levelBgClass(level: FitnessLevel): string {
  if (level === 'excellent') return 'bg-green-500/10'
  if (level === 'good')      return 'bg-blue-500/10'
  if (level === 'fair')      return 'bg-yellow-500/10'
  return 'bg-orange-500/10'
}

function levelTextClass(level: FitnessLevel): string {
  if (level === 'excellent') return 'text-green-400'
  if (level === 'good')      return 'text-blue-400'
  if (level === 'fair')      return 'text-yellow-400'
  return 'text-orange-400'
}

function classifyDistance(m: number): FitnessLevel {
  if (m >= 600) return 'excellent'
  if (m >= 500) return 'good'
  if (m >= 380) return 'fair'
  return 'low'
}

function trendLabel(trend: number): string {
  if (trend > 0) return `+${trend}m`
  return `${trend}m`
}

// ─── Custom dot — colored by fitness level ───────────────────────────────────

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: DailyReading
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={levelColor(payload.level)}
      stroke="var(--color-surface, #1a1a1a)"
      strokeWidth={1.5}
    />
  )
}

// ─── Norms comparison helper ──────────────────────────────────────────────────

function normCompare(value: number, norm: number): { label: string; cls: string } {
  const diff = value - norm
  if (diff >= 50)  return { label: `+${diff}m above`, cls: 'text-green-400' }
  if (diff >= 0)   return { label: `+${diff}m above`, cls: 'text-blue-400' }
  if (diff >= -50) return { label: `${diff}m below`, cls: 'text-yellow-400' }
  return { label: `${diff}m below`, cls: 'text-orange-400' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SixMinuteWalkClient({ data }: { data: SixMinuteWalkData }) {
  const { latest, latestLevel, avg90d, best, trend, readingCount, daily } = data

  const allDistances = daily.map((d) => d.distance)
  const yMin = Math.max(300, Math.floor(Math.min(...allDistances) / 10) * 10 - 20)
  const yMax = Math.min(800, Math.ceil(Math.max(...allDistances) / 10) * 10 + 20)

  // X-axis: show roughly every 2 weeks (every 14th tick)
  const xInterval = Math.max(1, Math.floor(daily.length / 6))

  return (
    <div className="space-y-6">

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.22)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              Latest Estimate
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold tabular-nums" style={{ color: BLUE }}>
                {latest}
              </p>
              <p className="text-sm text-text-secondary">m</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold mt-1 ${levelTextClass(latestLevel)}`}
            style={{
              background: `${levelColor(latestLevel)}20`,
              border: `1px solid ${levelColor(latestLevel)}40`,
            }}
          >
            {levelLabel(latestLevel)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-text-primary">{avg90d}m</p>
            <p className="text-xs text-text-secondary mt-0.5">90d Average</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-green-400">{best}m</p>
            <p className="text-xs text-text-secondary mt-0.5">Best</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p
              className={`text-lg font-bold tabular-nums ${trend >= 0 ? 'text-green-400' : 'text-orange-400'}`}
            >
              {trendLabel(trend)}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">90d Trend</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-text-primary">{readingCount}</p>
            <p className="text-xs text-text-secondary mt-0.5">Readings</p>
          </div>
        </div>
      </div>

      {/* ── 90-day trend area chart ───────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">90-Day Trend</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Dots colored by fitness level · green: excellent · blue: good · yellow: fair · orange: low
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={daily} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="sixMinBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE} stopOpacity={0.22} />
                <stop offset="95%" stopColor={BLUE} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={34}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [`${val}m`, '6MWT Distance']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            {/* Excellent threshold */}
            <ReferenceLine
              y={600}
              stroke={GREEN}
              strokeDasharray="5 3"
              strokeOpacity={0.5}
              label={{ value: 'Excellent (600m)', fill: GREEN, fontSize: 9, position: 'insideTopRight' }}
            />
            {/* Good threshold */}
            <ReferenceLine
              y={500}
              stroke={BLUE}
              strokeDasharray="5 3"
              strokeOpacity={0.5}
              label={{ value: 'Good (500m)', fill: BLUE, fontSize: 9, position: 'insideTopRight' }}
            />
            <Area
              type="monotone"
              dataKey="distance"
              stroke={BLUE}
              strokeWidth={2}
              fill="url(#sixMinBlue)"
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: BLUE }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Age-group norms table ─────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Age-Group Reference Norms</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">
            Typical 6MWT distances (meters) · your estimate: {latest}m
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2.5">
                  Age Group
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2.5">
                  Male (m)
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2.5">
                  vs You
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2.5">
                  Female (m)
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2.5">
                  vs You
                </th>
              </tr>
            </thead>
            <tbody>
              {AGE_GROUP_NORMS.map(({ group, male, female }, i) => {
                const mComp = normCompare(latest, male)
                const fComp = normCompare(latest, female)
                return (
                  <tr
                    key={group}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/30' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{group}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">{male}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums text-xs ${mComp.cls}`}>
                      {mComp.label}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-primary">{female}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums text-xs ${fComp.cls}`}>
                      {fComp.label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-text-secondary opacity-60">
            Reference values from Enright et al. (2003) community-dwelling adults. Normal range 380–750m depending on age and sex.
          </p>
        </div>
      </div>

      {/* ── Fitness level key ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Fitness Level Thresholds</h3>
        </div>
        <div className="divide-y divide-border">
          {(
            [
              { level: 'excellent' as FitnessLevel, range: '≥ 600m',       desc: 'High aerobic capacity — associated with lowest mortality risk' },
              { level: 'good'      as FitnessLevel, range: '500 – 599m',   desc: 'Above average functional capacity for most age groups' },
              { level: 'fair'      as FitnessLevel, range: '380 – 499m',   desc: 'Within normal range — room for improvement with regular exercise' },
              { level: 'low'       as FitnessLevel, range: '< 380m',       desc: 'Below reference range — consider discussing with a clinician' },
            ] as { level: FitnessLevel; range: string; desc: string }[]
          ).map(({ level, range, desc }) => (
            <div
              key={level}
              className={`flex items-center justify-between px-4 py-3 ${levelBgClass(level)}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold tabular-nums ${levelTextClass(level)}`}>
                    {range}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelTextClass(level)}`}
                    style={{
                      background: `${levelColor(level)}20`,
                      border: `1px solid ${levelColor(level)}30`,
                    }}
                  >
                    {levelLabel(level)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
              </div>
              {level === latestLevel && (
                <span className="ml-3 text-xs font-semibold text-text-secondary bg-background/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                  Your level
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.20)' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-none mt-0.5">🔬</span>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">What is the Six-Minute Walk Test?</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                The 6MWT measures how far a person can walk on a flat surface in 6 minutes. It is widely
                used in clinical settings to assess functional exercise capacity, cardiovascular fitness,
                and disease progression in conditions like heart failure, COPD, and pulmonary hypertension.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">Apple&apos;s Estimation Method</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Apple Watch continuously estimates your 6MWT performance from daily walking patterns —
                cadence, stride length, heart rate response, and gait symmetry recorded during ordinary
                walks. No formal 6-minute walk is required; the algorithm infers your functional capacity
                from how you naturally move throughout the day.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">Minimum Clinically Important Difference (MCID)</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                A change of <strong className="text-text-primary">50m</strong> or more is considered
                clinically meaningful — the smallest improvement a patient would notice as a real-world
                benefit. Changes below 50m are within measurement noise. Your 90-day trend
                of <strong className={trend >= 0 ? 'text-green-400' : 'text-orange-400'}>{trendLabel(trend)}</strong> is{' '}
                {Math.abs(trend) >= 50
                  ? 'above the MCID threshold — a meaningful change.'
                  : 'within the MCID threshold — a modest shift.'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">Mortality Correlation</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                6MWT distance is a strong independent predictor of all-cause mortality in adults over 40.
                Patients walking &lt;300m have markedly elevated cardiovascular risk. Each 50m improvement
                is associated with roughly 6–8% lower mortality risk in heart failure populations. Higher
                distance consistently tracks with better long-term outcomes across multiple chronic disease
                studies.
              </p>
            </div>
            <p className="text-xs text-text-secondary opacity-60 pt-1">
              Apple&apos;s estimate is not a diagnostic substitute for a formal clinical 6MWT conducted under
              standardized conditions. Use trends, not single readings, for health decisions.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
