'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Activity, Heart, Wind, Footprints, FlaskConical, Zap } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHRONOLOGICAL_AGE = 35

// ─── Organ data ───────────────────────────────────────────────────────────────

interface OrganSystem {
  key: string
  name: string
  category: string
  icon: React.ElementType
  color: string
  estimatedAge: number
  delta: number // estimatedAge - chronologicalAge (negative = younger)
  metricLabel: string
  metricValue: string
  interpretation: string
  reference: string
}

const ORGAN_SYSTEMS: OrganSystem[] = [
  {
    key: 'aerobic',
    name: 'Aerobic Fitness',
    category: 'VO₂ max',
    icon: Wind,
    color: '#a855f7',
    estimatedAge: 33,
    delta: -2,
    metricLabel: 'VO₂ max',
    metricValue: '48.2 ml/kg/min',
    interpretation:
      'Your aerobic capacity places you in the top quartile for your age group, equivalent to a typical healthy adult in their early 30s.',
    reference: 'ACSM 11th ed. VO₂ max norms · male 35–39 avg ≈ 42.5 ml/kg/min',
  },
  {
    key: 'autonomic',
    name: 'Autonomic Health',
    category: 'HRV (RMSSD)',
    icon: Activity,
    color: '#22c55e',
    estimatedAge: 38,
    delta: +3,
    metricLabel: 'RMSSD',
    metricValue: '42 ms',
    interpretation:
      'Your HRV is slightly below the age-20 reference of ~65 ms and closer to the age-40 norm of ~45 ms, suggesting mild autonomic aging — likely recoverable.',
    reference: 'Shaffer & Ginsberg 2017 · age-30 norm ≈ 55 ms, age-40 ≈ 45 ms',
  },
  {
    key: 'cardiovascular',
    name: 'Cardiovascular',
    category: 'Resting Heart Rate',
    icon: Heart,
    color: '#ef4444',
    estimatedAge: 31,
    delta: -4,
    metricLabel: 'Resting HR',
    metricValue: '58 bpm',
    interpretation:
      'A resting HR of 58 bpm is characteristic of a well-trained cardiovascular system, consistent with someone 4 years younger than your chronological age.',
    reference: 'AHA norms · 60–100 bpm normal; athletes 40–60 bpm',
  },
  {
    key: 'musculoskeletal',
    name: 'Musculoskeletal',
    category: 'Gait Speed',
    icon: Footprints,
    color: '#f97316',
    estimatedAge: 34,
    delta: -1,
    metricLabel: 'Gait speed',
    metricValue: '1.15 m/s',
    interpretation:
      'Your walking speed is within the normal range for your age group and marginally above the 35-year reference, suggesting healthy lower-body function.',
    reference: 'Studenski 2011 · JAMA · gait speed as 6th vital sign',
  },
]

// ─── Composite ────────────────────────────────────────────────────────────────

const COMPOSITE_BIO_AGE = 34.0
const COMPOSITE_DELTA = COMPOSITE_BIO_AGE - CHRONOLOGICAL_AGE // -1

// ─── Chart data for horizontal bars ──────────────────────────────────────────

const CHART_DATA = ORGAN_SYSTEMS.map((o) => ({
  name: o.name,
  age: o.estimatedAge,
  color: o.color,
}))

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Circular arc component ───────────────────────────────────────────────────

function BioAgeArc({
  bioAge,
  chronoAge,
}: {
  bioAge: number
  chronoAge: number
}) {
  const delta = bioAge - chronoAge
  const isYounger = delta <= 0

  // SVG arc: 0 = 25yr, 50 = 75yr (linear mapping over 50-year span)
  const minAge = 20
  const maxAge = 70
  const startAngle = -220
  const sweepAngle = 260

  function ageToAngle(age: number) {
    const ratio = Math.max(0, Math.min(1, (age - minAge) / (maxAge - minAge)))
    return startAngle + ratio * sweepAngle
  }

  function polarToXY(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: 80 + r * Math.cos(rad),
      y: 80 + r * Math.sin(rad),
    }
  }

  function describeArc(startDeg: number, endDeg: number, r: number) {
    const s = polarToXY(startDeg, r)
    const e = polarToXY(endDeg, r)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const trackStart = startAngle
  const trackEnd = startAngle + sweepAngle
  const fillEnd = ageToAngle(bioAge)
  const chronoAngle = ageToAngle(chronoAge)
  const needlePos = polarToXY(chronoAngle, 52)

  const arcColor = isYounger ? '#22c55e' : delta <= 2 ? '#f59e0b' : '#ef4444'

  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40">
      {/* Track */}
      <path
        d={describeArc(trackStart, trackEnd, 60)}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Filled arc to bio age */}
      <path
        d={describeArc(trackStart, fillEnd, 60)}
        fill="none"
        stroke={arcColor}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Chronological age marker */}
      <circle cx={needlePos.x} cy={needlePos.y} r={5} fill="white" opacity={0.7} />
      {/* Bio age number */}
      <text
        x="80"
        y="76"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="28"
        fontWeight="700"
        fill="white"
      >
        {bioAge.toFixed(0)}
      </text>
      <text
        x="80"
        y="96"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fill="rgba(255,255,255,0.5)"
      >
        bio age
      </text>
    </svg>
  )
}

// ─── Custom bar chart label ───────────────────────────────────────────────────

interface CustomBarLabelProps {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number
  index?: number
}

function CustomBarLabel(props: CustomBarLabelProps) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0, index = 0 } = props
  const organ = ORGAN_SYSTEMS[index]
  if (!organ) return null
  const delta = organ.delta
  const label = delta === 0 ? 'On par' : delta < 0 ? `${delta}y` : `+${delta}y`
  const color = delta < 0 ? '#22c55e' : delta === 0 ? '#94a3b8' : '#ef4444'
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dominantBaseline="middle"
      fontSize={11}
      fontWeight={600}
      fill={color}
    >
      {label}
    </text>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function BiologicalAgeClient() {
  const delta = COMPOSITE_DELTA
  const isYounger = delta < 0
  const isOlder = delta > 0

  const youngerCount = ORGAN_SYSTEMS.filter((o) => o.delta < 0).length
  const onParCount = ORGAN_SYSTEMS.filter((o) => o.delta === 0).length
  const olderCount = ORGAN_SYSTEMS.filter((o) => o.delta > 0).length

  const classificationLabel = isYounger
    ? 'Younger than your age'
    : isOlder
    ? 'Older than your age'
    : 'At your chronological age'
  const classificationColor = isYounger ? '#22c55e' : isOlder ? '#ef4444' : '#94a3b8'

  const highImpactOrgans = ORGAN_SYSTEMS.filter((o) => o.delta > 0)

  return (
    <div className="space-y-5">

      {/* ── 1. Composite score card ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Arc */}
          <div className="flex-shrink-0">
            <BioAgeArc bioAge={COMPOSITE_BIO_AGE} chronoAge={CHRONOLOGICAL_AGE} />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: classificationColor }}
            >
              {delta === 0 ? '±0' : delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`}{' '}
              <span className="text-lg font-semibold">year{Math.abs(delta) !== 1 ? 's' : ''}</span>
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: classificationColor }}>
              {classificationLabel}
            </p>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed max-w-sm">
              Composite across 4 organ systems. Chronological age:{' '}
              <span className="font-semibold text-text-primary">{CHRONOLOGICAL_AGE}</span>
              {' · '}
              Biological age:{' '}
              <span className="font-semibold text-text-primary">{COMPOSITE_BIO_AGE}</span>
            </p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">
              White dot on arc = chronological age (35)
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Summary pills ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-green-400">{youngerCount} Younger</span>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-sm font-semibold text-text-secondary">{onParCount} On Par</span>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-red-400">{olderCount} Older</span>
        </div>
      </div>

      {/* ── 3. Organ age bar chart ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Organ Age Estimate</h2>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          Each bar = estimated biological age for that system · vertical line = chronological age (35)
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={CHART_DATA}
            layout="vertical"
            margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
            barCategoryGap="28%"
          >
            <XAxis
              type="number"
              domain={[20, 50]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              ticks={[20, 25, 30, 35, 40, 45, 50]}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value} years`, 'Estimated age']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <ReferenceLine
              x={CHRONOLOGICAL_AGE}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'Age 35',
                position: 'top',
                fontSize: 10,
                fill: 'rgba(255,255,255,0.45)',
              }}
            />
            <Bar dataKey="age" radius={[0, 4, 4, 0]} label={<CustomBarLabel />}>
              {CHART_DATA.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 4. Organ cards grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ORGAN_SYSTEMS.map((organ) => {
          const Icon = organ.icon
          const deltaLabel =
            organ.delta === 0
              ? 'On par'
              : organ.delta < 0
              ? `${organ.delta} years younger`
              : `+${organ.delta} years older`
          const deltaColor =
            organ.delta < 0 ? '#22c55e' : organ.delta === 0 ? '#94a3b8' : '#ef4444'
          const deltaBg =
            organ.delta < 0
              ? 'rgba(34,197,94,0.12)'
              : organ.delta === 0
              ? 'rgba(148,163,184,0.12)'
              : 'rgba(239,68,68,0.12)'

          return (
            <div
              key={organ.key}
              className="bg-surface rounded-2xl border border-border p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${organ.color}22` }}
                >
                  <Icon className="w-4 h-4" style={{ color: organ.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary leading-tight">
                    {organ.name}
                  </p>
                  <p className="text-xs text-text-secondary">{organ.category}</p>
                </div>
              </div>

              {/* Age + delta */}
              <div className="flex items-end justify-between">
                <div>
                  <p
                    className="text-3xl font-bold tabular-nums"
                    style={{ color: organ.color }}
                  >
                    {organ.estimatedAge}
                    <span className="text-sm font-normal text-text-secondary ml-1">yrs</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{organ.metricValue}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: deltaColor, backgroundColor: deltaBg }}
                >
                  {deltaLabel}
                </span>
              </div>

              {/* Interpretation */}
              <p className="text-xs text-text-secondary leading-relaxed">
                {organ.interpretation}
              </p>

              {/* Reference */}
              <p className="text-xs opacity-50 text-text-secondary border-t border-border/50 pt-2 leading-relaxed">
                {organ.reference}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── 5. Highest impact actions ─────────────────────────────────────────── */}
      {highImpactOrgans.length > 0 && (
        <div className="bg-surface rounded-2xl border border-amber-500/30 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 pointer-events-none" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400">Highest Impact Actions</h2>
            </div>
            <p className="text-xs text-text-secondary">
              {highImpactOrgans.length === 1
                ? `${highImpactOrgans[0].name} is the only system aging faster than your chronological age.`
                : `${highImpactOrgans.map((o) => o.name).join(' and ')} are aging faster than your chronological age.`}{' '}
              Improving {highImpactOrgans.length === 1 ? 'it' : 'these'} has the greatest
              potential to lower your composite biological age.
            </p>

            {highImpactOrgans.map((organ) => {
              const Icon = organ.icon
              return (
                <div
                  key={organ.key}
                  className="rounded-xl border border-border/60 bg-surface-secondary p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: organ.color }} />
                    <p className="text-sm font-semibold text-text-primary">{organ.name}</p>
                    <span
                      className="ml-auto text-xs font-bold tabular-nums"
                      style={{ color: '#ef4444' }}
                    >
                      Age {organ.estimatedAge} (+{organ.delta}y)
                    </span>
                  </div>

                  {organ.key === 'autonomic' && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-text-secondary leading-relaxed">
                        <span className="font-semibold text-text-primary">Why it matters:</span>{' '}
                        HRV (RMSSD) is the most sensitive early marker of autonomic aging and
                        recovery state. Small lifestyle changes produce measurable improvements
                        within days to weeks.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { action: 'Reduce training load', effect: '↑ HRV within 48–72h' },
                          { action: 'Consistent sleep timing', effect: 'circadian rhythm benefit' },
                          { action: 'Limit alcohol', effect: 'alcohol acutely suppresses HRV' },
                          {
                            action: 'Cold exposure (brief)',
                            effect: 'boosts parasympathetic tone',
                          },
                        ].map((item) => (
                          <div
                            key={item.action}
                            className="rounded-lg bg-surface p-2 border border-border/50"
                          >
                            <p className="text-xs font-semibold text-text-primary">
                              {item.action}
                            </p>
                            <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                              {item.effect}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-text-secondary opacity-70 mt-2 leading-relaxed">
                        RMSSD improves within days with reduced training load, better sleep, less
                        alcohol, and consistent sleep timing. A target of ≥50 ms would move your
                        autonomic age to approximately 35.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 6. Science card ───────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-blue-500/30 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 pointer-events-none" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
              The Science
            </h2>
          </div>

          {/* PhenoAge */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">
              Levine et al. (2018) — Cell Metabolism · PhenoAge
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              PhenoAge combines multiple clinical biomarkers into a single biological age estimate
              that outperforms chronological age in predicting all-cause mortality, cancer
              incidence, and healthy lifespan. The core insight: people of the same calendar age
              vary enormously in their biological age, and that variation predicts who will live
              longest. This page applies the same multi-biomarker logic using metrics available from
              wearables (HRV, RHR, VO₂ max, gait speed).
            </p>
          </div>

          {/* HRV norms */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-sm font-semibold text-text-primary mb-2">
              Shaffer & Ginsberg (2017) — HRV/RMSSD Age Norms
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left pb-1.5 font-medium text-text-secondary">Age</th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">
                      RMSSD norm (ms)
                    </th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">
                      Interpretation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { age: '20', rmssd: '~65', note: 'Peak parasympathetic tone' },
                    { age: '30', rmssd: '~55', note: 'Healthy baseline' },
                    { age: '40', rmssd: '~45', note: 'Slight age-related decline' },
                    { age: '50', rmssd: '~35', note: 'Moderate decline expected' },
                    { age: '60', rmssd: '~25', note: 'Significant decline' },
                  ].map((row) => (
                    <tr key={row.age}>
                      <td className="py-1.5 text-text-secondary">{row.age}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold text-text-primary">
                        {row.rmssd}
                      </td>
                      <td className="py-1.5 text-right text-text-secondary">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-secondary opacity-60 mt-2">
              Your RMSSD: 42 ms · closest norm: age 40 (45 ms) → autonomic age estimate: 38
            </p>
          </div>

          {/* Gait speed */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-sm font-semibold text-text-primary mb-1">
              Studenski et al. (2011) — JAMA · Gait Speed as Vital Sign
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Pooled cohort of 34,485 adults: gait speed predicted 5- and 10-year survival
              independent of age, sex, and chronic conditions. Speed of 0.8 m/s ={' '}
              average survival; ≥1.0 m/s = above-average survival; ≥1.2 m/s = excellent
              longevity signal. Your speed of 1.15 m/s falls in the above-average range.
            </p>
          </div>

          {/* VO2 max */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-sm font-semibold text-text-primary mb-1">
              ACSM 11th Edition — VO₂ Max Age Norms (Male, ml/kg/min)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left pb-1.5 font-medium text-text-secondary">
                      Age group
                    </th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">
                      Poor (25th)
                    </th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">
                      Avg (50th)
                    </th>
                    <th className="text-right pb-1.5 font-medium text-text-secondary">
                      Excellent (75th)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {[
                    { group: '20–29', poor: '38.1', avg: '44.2', exc: '50.2' },
                    { group: '30–39', poor: '36.7', avg: '42.5', exc: '48.5' },
                    { group: '40–49', poor: '33.8', avg: '39.9', exc: '46.4' },
                    { group: '50–59', poor: '30.2', avg: '36.4', exc: '42.5' },
                    { group: '60–69', poor: '26.1', avg: '32.3', exc: '38.1' },
                  ].map((row) => (
                    <tr key={row.group}>
                      <td className="py-1.5 text-text-secondary">{row.group}</td>
                      <td className="py-1.5 text-right tabular-nums text-text-primary">
                        {row.poor}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-text-primary">
                        {row.avg}
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-semibold text-purple-400">
                        {row.exc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-secondary opacity-60 mt-2">
              Your VO₂ max of 48.2 ml/kg/min exceeds the 75th percentile for the 30–39 group → aerobic age estimate: 33
            </p>
          </div>

          <p className="text-xs text-text-secondary opacity-50 leading-relaxed border-t border-border/50 pt-3">
            Biological age estimates shown are based on published population norms applied to
            wearable-derived biomarkers. Individual variation is high. This page is for
            informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </div>

    </div>
  )
}
