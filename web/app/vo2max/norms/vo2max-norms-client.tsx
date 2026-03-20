'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { VO2MaxNormsData, AgeGroupNorm } from './page'

// ─── Constants ────────────────────────────────────────────────────────────────

const PURPLE = '#a855f7'
const PURPLE_SOFT = 'rgba(168,85,247,0.15)'
const PURPLE_MID = 'rgba(168,85,247,0.35)'

const TIER_CONFIG = [
  { key: 'Poor',       color: '#ef4444', range: '< 29'  },
  { key: 'Below Avg',  color: '#f97316', range: '29–34' },
  { key: 'Average',    color: '#eab308', range: '35–39' },
  { key: 'Good',       color: '#14b8a6', range: '40–44' },
  { key: 'Excellent',  color: '#22c55e', range: '45–51' },
  { key: 'Superior',   color: '#3b82f6', range: '≥ 52'  },
]

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text-primary, #fff)',
}

// ─── Tier classification ──────────────────────────────────────────────────────

function classifyVO2(v: number): { label: string; color: string } {
  // For 30–39 age group thresholds
  if (v < 29)  return { label: 'Poor',      color: '#ef4444' }
  if (v < 35)  return { label: 'Below Avg', color: '#f97316' }
  if (v < 40)  return { label: 'Average',   color: '#eab308' }
  if (v < 45)  return { label: 'Good',      color: '#14b8a6' }
  if (v < 52)  return { label: 'Excellent', color: '#22c55e' }
  return       { label: 'Superior',         color: '#3b82f6' }
}

// ─── Horizontal norms range bar ───────────────────────────────────────────────

const RANGE_MIN = 20
const RANGE_MAX = 60

function pct(v: number) {
  return ((Math.min(Math.max(v, RANGE_MIN), RANGE_MAX) - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100
}

// Segment boundaries for 30-39 group
const SEGMENTS = [
  { from: RANGE_MIN, to: 29,          color: '#ef4444', label: 'Poor'      },
  { from: 29,        to: 35,          color: '#f97316', label: 'Below Avg' },
  { from: 35,        to: 40,          color: '#eab308', label: 'Average'   },
  { from: 40,        to: 45,          color: '#14b8a6', label: 'Good'      },
  { from: 45,        to: 52,          color: '#22c55e', label: 'Excellent'  },
  { from: 52,        to: RANGE_MAX,   color: '#3b82f6', label: 'Superior'  },
]

function NormsRangeBar({ userValue }: { userValue: number }) {
  const userPct = pct(userValue)

  return (
    <div className="space-y-3">
      {/* Gradient bar */}
      <div className="relative h-8 rounded-full overflow-hidden flex" style={{ background: '#111' }}>
        {SEGMENTS.map((seg) => {
          const left = pct(seg.from)
          const width = pct(seg.to) - pct(seg.from)
          return (
            <div
              key={seg.label}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: seg.color,
                position: 'absolute',
                top: 0,
                bottom: 0,
                opacity: 0.85,
              }}
            />
          )
        })}

        {/* User marker */}
        <div
          style={{
            position: 'absolute',
            left: `${userPct}%`,
            top: 0,
            bottom: 0,
            width: 3,
            background: '#fff',
            transform: 'translateX(-50%)',
            borderRadius: 2,
            boxShadow: '0 0 0 2px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* User callout */}
      <div className="relative" style={{ paddingLeft: `${Math.min(Math.max(userPct - 8, 0), 72)}%` }}>
        <div className="inline-flex flex-col items-center">
          <div className="w-0 h-0" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: `6px solid ${PURPLE}` }} />
          <div
            className="rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap"
            style={{ background: PURPLE, color: '#fff' }}
          >
            You · {userValue} ml/kg/min
          </div>
        </div>
      </div>

      {/* Tier legend */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 mt-1">
        {TIER_CONFIG.map((tier) => (
          <div key={tier.key} className="flex flex-col items-center gap-0.5">
            <div className="w-full h-1.5 rounded-full" style={{ background: tier.color }} />
            <p className="text-[10px] font-semibold text-center" style={{ color: tier.color }}>
              {tier.key}
            </p>
            <p className="text-[9px] text-text-secondary text-center tabular-nums">{tier.range}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Custom tooltip for trend chart ───────────────────────────────────────────

interface TrendTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; name: string; color: string }>
  label?: string
}

function TrendTooltip({ active, payload, label }: TrendTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-lg text-sm space-y-1 min-w-[150px]">
      <p className="font-semibold text-text-primary mb-1.5">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="tabular-nums text-text-secondary">
          {entry.name}:{' '}
          <span className="font-semibold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value} ml/kg/min
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Custom tooltip for age-group bar chart ────────────────────────────────────

interface AgeGroupTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: AgeGroupNorm }>
  label?: string
}

function AgeGroupTooltip({ active, payload, label }: AgeGroupTooltipProps) {
  if (!active || !payload?.length) return null
  const median = payload[0]?.value ?? 0
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-lg text-sm min-w-[140px]">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      <p className="text-text-secondary tabular-nums">
        Median:{' '}
        <span className="font-semibold" style={{ color: PURPLE }}>
          {median} ml/kg/min
        </span>
      </p>
    </div>
  )
}

// ─── Summary stat cell ────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  sub,
  color,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1 border"
      style={
        highlight
          ? { background: PURPLE_SOFT, borderColor: PURPLE_MID }
          : { background: 'var(--color-surface)', borderColor: 'var(--color-border)' }
      }
    >
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-2xl font-bold tabular-nums leading-none" style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-secondary leading-snug">{sub}</p>}
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

interface Props {
  data: VO2MaxNormsData
}

export function VO2MaxNormsClient({ data }: Props) {
  const {
    latestVO2Max,
    fitnessAge,
    chronologicalAge,
    percentileLow,
    percentileHigh,
    fitnessCategory,
    ageGroupLabel,
    readingCount,
    avgNormForAgeGroup,
    trend,
    ageGroupNorms,
  } = data

  const { color: categoryColor } = classifyVO2(latestVO2Max)
  const ageDelta = chronologicalAge - fitnessAge

  // Bar chart data: each age group's median with the user's value for their group
  const ageGroupBarData = ageGroupNorms.map((g) => ({
    ...g,
    isUser: g.ageGroup === ageGroupLabel,
  }))

  return (
    <div className="space-y-5">

      {/* ── Summary hero card ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 flex items-start justify-between gap-4"
        style={{ background: PURPLE_SOFT, borderColor: PURPLE_MID }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🫁</span>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Latest VO₂ Max · {ageGroupLabel} age group
            </p>
          </div>
          <p className="text-5xl font-extrabold tabular-nums leading-none mt-2" style={{ color: PURPLE }}>
            {latestVO2Max}
            <span className="text-2xl font-semibold ml-1.5" style={{ color: PURPLE, opacity: 0.7 }}>
              ml/kg/min
            </span>
          </p>
          <p className="text-sm font-semibold mt-2" style={{ color: categoryColor }}>
            {fitnessCategory} for age {chronologicalAge}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {readingCount} readings · {percentileLow}th–{percentileHigh}th percentile
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-text-secondary mb-1">Fitness Age</p>
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: '#22c55e' }}>
            {fitnessAge}
          </p>
          <p className="text-xs text-green-500 font-semibold mt-0.5">
            {ageDelta} yrs younger
          </p>
        </div>
      </div>

      {/* ── Stat row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCell
          label="VO₂ Max"
          value={`${latestVO2Max}`}
          sub="ml/kg/min"
          color={PURPLE}
          highlight
        />
        <StatCell
          label="Fitness Category"
          value={fitnessCategory}
          sub={`for age ${chronologicalAge}`}
          color={categoryColor}
        />
        <StatCell
          label="Percentile"
          value={`${percentileLow}–${percentileHigh}th`}
          sub={ageGroupLabel + ' men/women'}
          color={PURPLE}
        />
        <StatCell
          label="Fitness Age"
          value={`${fitnessAge} yrs`}
          sub={`${ageDelta} below chronological`}
          color="#22c55e"
        />
      </div>

      {/* ── Horizontal norms range bar ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-text-primary mb-0.5">Age Group Norms — {ageGroupLabel}</h2>
        <p className="text-xs text-text-secondary mb-4">
          HUNT Fitness Study · where you fall within the 6 fitness tiers
        </p>
        <NormsRangeBar userValue={latestVO2Max} />
      </div>

      {/* ── 12-month trend chart ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="font-semibold text-text-primary mb-0.5">12-Month Trend</h2>
        <p className="text-xs text-text-secondary mb-4">
          Your VO₂ max vs average norm for {ageGroupLabel} ({avgNormForAgeGroup} ml/kg/min)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              domain={[30, 55]}
              tickFormatter={(v: number) => String(v)}
              width={28}
            />
            <ReferenceLine
              y={avgNormForAgeGroup}
              stroke="#6b7280"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{ value: `Avg norm ${avgNormForAgeGroup}`, position: 'insideTopRight', fontSize: 9, fill: '#6b7280' }}
            />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: PURPLE, strokeOpacity: 0.15 }} />
            <Line
              type="monotone"
              dataKey="value"
              name="Your VO₂ Max"
              stroke={PURPLE}
              strokeWidth={2.5}
              dot={{ r: 3, fill: PURPLE, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: PURPLE, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ background: PURPLE }} />
            <span className="text-xs text-text-secondary">Your VO₂ Max</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-0.5 rounded" style={{ background: '#6b7280' }} />
              ))}
            </div>
            <span className="text-xs text-text-secondary">Age group avg ({avgNormForAgeGroup})</span>
          </div>
        </div>
      </div>

      {/* ── Age group comparison bar chart ────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="font-semibold text-text-primary mb-0.5">Cross-Age-Group Comparison</h2>
        <p className="text-xs text-text-secondary mb-4">
          Your value vs median VO₂ max across all age groups — you are in{' '}
          <span style={{ color: PURPLE }} className="font-semibold">{ageGroupLabel}</span>
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ageGroupBarData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
            <XAxis
              dataKey="ageGroup"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 55]}
              width={28}
            />
            {/* User's actual value as reference line */}
            <ReferenceLine
              y={latestVO2Max}
              stroke={PURPLE}
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{ value: `You ${latestVO2Max}`, position: 'insideTopRight', fontSize: 9, fill: PURPLE }}
            />
            <Tooltip content={<AgeGroupTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="median" name="Median VO₂ Max" radius={[4, 4, 0, 0]}>
              {ageGroupBarData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isUser ? PURPLE : 'rgba(168,85,247,0.3)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-text-secondary mt-2">
          Your age group ({ageGroupLabel}) is highlighted in purple · dashed line = your current value
        </p>
      </div>

      {/* ── Science card ─────────────────────────────────────────────────────── */}
      <ScienceCard />

    </div>
  )
}

// ─── Science card ─────────────────────────────────────────────────────────────

function ScienceCard() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔬</span>
        <div>
          <h2 className="font-semibold text-text-primary">The Science Behind VO₂ Max Norms</h2>
          <p className="text-xs text-text-secondary mt-0.5">HUNT Fitness Study · JAMA 2018 · Apple Watch accuracy</p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
        <p>
          <strong className="text-text-primary">HUNT Fitness Study (n = 4,631)</strong> — The norms on this page
          come from the HUNT study conducted in Norway, which measured directly-assessed VO₂ max in over 4,600
          adults aged 20–90. It remains one of the largest direct-measurement VO₂ max datasets in the world and
          forms the basis of the fitness age concept.
        </p>
        <p>
          <strong className="text-text-primary">VO₂ max declines ~1% per year</strong> without structured aerobic
          training. This translates to roughly a 10% drop per decade. Regular cardiorespiratory exercise can slow
          or even reverse this decline — elite masters athletes in their 70s often maintain VO₂ max values
          comparable to sedentary 30-year-olds.
        </p>
        <p>
          <strong className="text-text-primary">Apple Watch accuracy</strong> — Apple Watch estimates VO₂ max
          during outdoor walks and runs using GPS pace, heart rate, and motion data. Independent validation shows
          accuracy within <strong className="text-text-primary">±3.5 ml/kg/min</strong> on average, which is
          sufficient for tracking relative changes and fitness tier classification.
        </p>
        <p>
          <strong className="text-text-primary">Mortality risk</strong> — A landmark 2018 study in{' '}
          <em>JAMA</em> found that individuals in the lowest cardiorespiratory fitness quintile had a{' '}
          <strong className="text-text-primary">5× higher mortality risk</strong> compared to those in the
          highest quintile — an effect larger than smoking, hypertension, or diabetes.
        </p>
      </div>

      {/* Tier reference table */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Fitness Tiers · 30–39 Age Group (ml/kg/min)
          </p>
        </div>
        <div className="divide-y divide-border">
          {TIER_CONFIG.map((tier) => (
            <div key={tier.key} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tier.color }} />
              <p className="text-sm font-medium text-text-primary w-24">{tier.key}</p>
              <p className="text-sm tabular-nums text-text-secondary">{tier.range}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-text-secondary leading-relaxed pt-1 border-t border-border">
        Values shown are estimated by Apple Watch and are for personal fitness tracking only.
        They do not constitute a clinical assessment. Consult a physician for medical advice.
      </p>
    </div>
  )
}
