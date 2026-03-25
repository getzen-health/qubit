'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Activity, Heart, Moon, FlaskConical, Zap, Info, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DaySummary {
  date: string
  avg_hrv: number | null
  resting_heart_rate: number | null
  sleep_duration_minutes: number | null
}

export interface BiologicalAgeClientProps {
  chronologicalAge: number
  hrvBaseline: number
  rhrBaseline: number
  sleepBaseline: number
  latestHrv: number | null
  latestRhr: number | null
  latestSleep: number | null
  recentSummaries: DaySummary[]
  hasData: boolean
}

interface OrganSystem {
  key: string
  name: string
  category: string
  icon: React.ElementType
  color: string
  estimatedAge: number
  delta: number
  metricLabel: string
  metricValue: string
  interpretation: string
  reference: string
}

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Circular arc component ───────────────────────────────────────────────────

function WellnessAgeArc({
  bioAge,
  chronoAge,
}: {
  bioAge: number
  chronoAge: number
}) {
  const delta = bioAge - chronoAge
  const isYounger = delta <= 0

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
      {/* Filled arc to wellness age */}
      <path
        d={describeArc(trackStart, fillEnd, 60)}
        fill="none"
        stroke={arcColor}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Chronological age marker */}
      <circle cx={needlePos.x} cy={needlePos.y} r={5} fill="white" opacity={0.7} />
      {/* Wellness age number */}
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
        wellness
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
  delta?: number
}

function CustomBarLabel(props: CustomBarLabelProps) {
  const { x = 0, y = 0, width = 0, height = 0, delta = 0 } = props
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

export function BiologicalAgeClient({
  chronologicalAge,
  hrvBaseline,
  rhrBaseline,
  sleepBaseline: _sleepBaseline,
  latestHrv,
  latestRhr,
  latestSleep,
  recentSummaries,
  hasData,
}: BiologicalAgeClientProps) {

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">No data yet</h2>
        <p className="text-sm text-text-secondary max-w-sm">
          Connect Apple Watch and sync at least 30 days of data to see your Wellness Age.
        </p>
      </div>
    )
  }

  // ── Wellness Age formula (Klemera-Doubal inspired for wearables) ─────────────
  let totalWeight = 0
  let weightedSum = 0

  if (latestHrv !== null && hrvBaseline > 0) {
    const score = Math.min(100, Math.max(0, 50 + (latestHrv - hrvBaseline) / hrvBaseline * 100))
    weightedSum += score * 0.4
    totalWeight += 0.4
  }
  if (latestRhr !== null && rhrBaseline > 0) {
    const score = Math.min(100, Math.max(0, 50 - (latestRhr - rhrBaseline) / rhrBaseline * 100))
    weightedSum += score * 0.3
    totalWeight += 0.3
  }
  if (latestSleep !== null) {
    const score = Math.min(100, Math.max(0, 100 - Math.abs(latestSleep - 7) * 20))
    weightedSum += score * 0.3
    totalWeight += 0.3
  }

  const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 50
  const ageOffset = -5 + (1 - compositeScore / 100) * 13
  const wellnessAge = Math.round(chronologicalAge + ageOffset)
  const compositeDelta = wellnessAge - chronologicalAge
  const isYounger = compositeDelta < 0
  const isOlder = compositeDelta > 0

  // ── Build organ systems from real data ────────────────────────────────────────
  const organSystems: OrganSystem[] = []

  if (latestRhr !== null && rhrBaseline > 0) {
    // Cardiovascular: lower RHR = younger. 55 bpm ≈ 30yr reference; each bpm ~0.7yr offset.
    const cardioAge = Math.max(18, Math.min(80, Math.round(30 + (latestRhr - 55) * 0.7)))
    organSystems.push({
      key: 'cardiovascular',
      name: 'Cardiovascular',
      category: 'Resting Heart Rate',
      icon: Heart,
      color: '#ef4444',
      estimatedAge: cardioAge,
      delta: cardioAge - chronologicalAge,
      metricLabel: 'Resting HR',
      metricValue: `${Math.round(latestRhr)} bpm`,
      interpretation:
        latestRhr < 60
          ? `A resting HR of ${Math.round(latestRhr)} bpm reflects strong cardiovascular fitness, consistent with a well-trained heart.`
          : latestRhr < 70
          ? `A resting HR of ${Math.round(latestRhr)} bpm is within a healthy range. Aerobic training can lower it further.`
          : `A resting HR of ${Math.round(latestRhr)} bpm is on the higher side. Sustained aerobic exercise is the most effective intervention.`,
      reference: 'AHA norms · 60–100 bpm normal; athletes 40–60 bpm',
    })
  }

  if (latestHrv !== null && hrvBaseline > 0) {
    // Autonomic: Shaffer & Ginsberg 2017 norms: 20→65ms, 30→55ms, 40→45ms, 50→35ms, 60→25ms
    // Slope: 1ms ≈ 1 year (approximate)
    const autonomicAge = Math.max(18, Math.min(80, Math.round(70 - latestHrv)))
    organSystems.push({
      key: 'autonomic',
      name: 'Autonomic Nervous System',
      category: 'HRV (RMSSD)',
      icon: Activity,
      color: '#22c55e',
      estimatedAge: autonomicAge,
      delta: autonomicAge - chronologicalAge,
      metricLabel: 'HRV',
      metricValue: `${Math.round(latestHrv)} ms`,
      interpretation:
        latestHrv >= 55
          ? `Your HRV of ${Math.round(latestHrv)} ms reflects healthy autonomic nervous system function and good recovery capacity.`
          : latestHrv >= 45
          ? `Your HRV of ${Math.round(latestHrv)} ms is in the normal range for your age group. Consistent sleep and stress management can improve it.`
          : `Your HRV of ${Math.round(latestHrv)} ms suggests elevated autonomic stress. Reducing training load, improving sleep, and limiting alcohol can help.`,
      reference: 'Shaffer & Ginsberg 2017 · age-30 norm ≈ 55 ms, age-40 ≈ 45 ms',
    })
  }

  if (latestSleep !== null) {
    // Sleep: 7h optimal. Each hour below 7 ≈ +3yr; each hour above 9 ≈ +2yr.
    const sleepDeltaYears =
      latestSleep < 7
        ? Math.round((7 - latestSleep) * 3)
        : latestSleep > 9
        ? Math.round((latestSleep - 9) * 2)
        : 0
    const sleepAge = Math.max(18, Math.min(80, chronologicalAge + sleepDeltaYears))
    organSystems.push({
      key: 'sleep',
      name: 'Sleep Recovery',
      category: 'Sleep Duration',
      icon: Moon,
      color: '#6366f1',
      estimatedAge: sleepAge,
      delta: sleepAge - chronologicalAge,
      metricLabel: 'Sleep',
      metricValue: `${latestSleep.toFixed(1)} hrs`,
      interpretation:
        latestSleep >= 7 && latestSleep <= 9
          ? `You're getting ${latestSleep.toFixed(1)} hours — within the optimal 7–9 hour window for healthy aging and cellular repair.`
          : latestSleep < 7
          ? `${latestSleep.toFixed(1)} hours is below the recommended 7–9 hours. Chronic short sleep is linked to accelerated biological aging and increased all-cause mortality.`
          : `${latestSleep.toFixed(1)} hours slightly exceeds the optimal range. Sleep quality and consistency matter as much as total duration.`,
      reference: "Walker 2017 · Why We Sleep · 7–9 hrs optimal; <6 hrs increases all-cause mortality risk",
    })
  }

  const youngerCount = organSystems.filter((o) => o.delta < 0).length
  const onParCount = organSystems.filter((o) => o.delta === 0).length
  const olderCount = organSystems.filter((o) => o.delta > 0).length
  const highImpactOrgans = organSystems.filter((o) => o.delta > 0)

  const classificationLabel = isYounger
    ? 'Younger than your age'
    : isOlder
    ? 'Older than your age'
    : 'At your chronological age'
  const classificationColor = isYounger ? '#22c55e' : isOlder ? '#ef4444' : '#94a3b8'

  const chartData = organSystems.map((o) => ({
    name: o.name,
    age: o.estimatedAge,
    color: o.color,
    delta: o.delta,
  }))

  return (
    <div className="space-y-5">

      {/* ── 1. Composite score card ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Arc */}
          <div className="flex-shrink-0">
            <WellnessAgeArc bioAge={wellnessAge} chronoAge={chronologicalAge} />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            {/* "Wellness Age" heading with tooltip */}
            <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Wellness Age
              </p>
              <span
                className="cursor-help"
                title="Estimated from HRV, resting heart rate, and sleep using wearable data. For true biological age, blood biomarkers (CRP, glucose, HbA1c) are required."
              >
                <Info className="w-3.5 h-3.5 text-text-secondary opacity-60" />
              </span>
            </div>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: classificationColor }}
            >
              {compositeDelta === 0 ? '±0' : compositeDelta < 0 ? `−${Math.abs(compositeDelta)}` : `+${compositeDelta}`}{' '}
              <span className="text-lg font-semibold">year{Math.abs(compositeDelta) !== 1 ? 's' : ''}</span>
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: classificationColor }}>
              {classificationLabel}
            </p>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed max-w-sm">
              Composite across {organSystems.length} systems. Chronological age:{' '}
              <span className="font-semibold text-text-primary">{chronologicalAge}</span>
              {' · '}
              Wellness age:{' '}
              <span className="font-semibold text-text-primary">{wellnessAge}</span>
            </p>
            <p className="text-xs text-text-secondary opacity-60 mt-1">
              White dot on arc = chronological age ({chronologicalAge})
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

      {/* ── 3. System age bar chart ───────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">System Age Estimate</h2>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Each bar = estimated wellness age for that system · vertical line = chronological age ({chronologicalAge})
          </p>
          <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 52)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
              barCategoryGap="28%"
            >
              <XAxis
                type="number"
                domain={[Math.max(18, chronologicalAge - 15), chronologicalAge + 15]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
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
                x={chronologicalAge}
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `Age ${chronologicalAge}`,
                  position: 'top',
                  fontSize: 10,
                  fill: 'rgba(255,255,255,0.45)',
                }}
              />
              <Bar dataKey="age" radius={[0, 4, 4, 0]} label={<CustomBarLabel />}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 4. System cards grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {organSystems.map((organ) => {
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
              potential to lower your composite wellness age.
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
                        HRV is the most sensitive early marker of autonomic aging and recovery state.
                        Small lifestyle changes produce measurable improvements within days to weeks.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { action: 'Reduce training load', effect: '↑ HRV within 48–72h' },
                          { action: 'Consistent sleep timing', effect: 'circadian rhythm benefit' },
                          { action: 'Limit alcohol', effect: 'alcohol acutely suppresses HRV' },
                          { action: 'Cold exposure (brief)', effect: 'boosts parasympathetic tone' },
                        ].map((item) => (
                          <div
                            key={item.action}
                            className="rounded-lg bg-surface p-2 border border-border/50"
                          >
                            <p className="text-xs font-semibold text-text-primary">{item.action}</p>
                            <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                              {item.effect}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {organ.key === 'cardiovascular' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { action: 'Zone 2 cardio', effect: '30–45 min, 3×/week lowers RHR' },
                        { action: 'Reduce caffeine', effect: 'late caffeine elevates RHR' },
                        { action: 'Improve sleep', effect: 'deep sleep lowers resting HR' },
                        { action: 'Manage stress', effect: 'chronic stress raises RHR' },
                      ].map((item) => (
                        <div
                          key={item.action}
                          className="rounded-lg bg-surface p-2 border border-border/50"
                        >
                          <p className="text-xs font-semibold text-text-primary">{item.action}</p>
                          <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                            {item.effect}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {organ.key === 'sleep' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { action: 'Fixed wake time', effect: 'anchors circadian rhythm' },
                        { action: 'Cool bedroom (18°C)', effect: 'optimal for deep sleep' },
                        { action: 'No screens 1h before', effect: 'reduces sleep onset time' },
                        { action: 'Limit alcohol', effect: 'fragments REM sleep' },
                      ].map((item) => (
                        <div
                          key={item.action}
                          className="rounded-lg bg-surface p-2 border border-border/50"
                        >
                          <p className="text-xs font-semibold text-text-primary">{item.action}</p>
                          <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                            {item.effect}
                          </p>
                        </div>
                      ))}
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
              incidence, and healthy lifespan. This page applies the same multi-biomarker logic
              using metrics available from wearables (HRV, resting heart rate, sleep duration).
              True biological age requires blood biomarkers (CRP, glucose, HbA1c).
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
            {latestHrv !== null && (
              <p className="text-xs text-text-secondary opacity-60 mt-2">
                Your HRV: {Math.round(latestHrv)} ms · closest norm: age{' '}
                {latestHrv >= 60 ? '20' : latestHrv >= 50 ? '30' : latestHrv >= 40 ? '40' : latestHrv >= 30 ? '50' : '60'}{' '}
                → autonomic age estimate: {organSystems.find(o => o.key === 'autonomic')?.estimatedAge ?? '—'}
              </p>
            )}
          </div>

          {/* Sleep */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-sm font-semibold text-text-primary mb-1">
              Walker (2017) — Why We Sleep · Optimal Sleep Duration
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Large-scale epidemiological data consistently shows 7–9 hours per night minimises
              all-cause mortality risk. Sleeping under 6 hours chronically is associated with
              accelerated telomere shortening, increased inflammatory markers, and a measurable
              increase in biological age. Sleep is the single highest-leverage intervention for
              biological age improvement available at zero cost.
            </p>
          </div>

          <p className="text-xs text-text-secondary opacity-50 leading-relaxed border-t border-border/50 pt-3">
            Wellness age estimates are based on published population norms applied to
            wearable-derived biomarkers. Individual variation is high. This page is for
            informational purposes only and does not constitute medical advice.
          </p>
        </div>
      </div>

      {/* ── 7. Wellness Age Trend ─────────────────────────────────────────────── */}
      {(() => {
        // Compute per-day wellness age from recentSummaries
        const trendData = recentSummaries
          .filter((s) => s.avg_hrv !== null || s.resting_heart_rate !== null || s.sleep_duration_minutes !== null)
          .map((s) => {
            let tw = 0, ws = 0
            if (s.avg_hrv !== null && hrvBaseline > 0) {
              ws += Math.min(100, Math.max(0, 50 + (s.avg_hrv - hrvBaseline) / hrvBaseline * 100)) * 0.4
              tw += 0.4
            }
            if (s.resting_heart_rate !== null && rhrBaseline > 0) {
              ws += Math.min(100, Math.max(0, 50 - (s.resting_heart_rate - rhrBaseline) / rhrBaseline * 100)) * 0.3
              tw += 0.3
            }
            if (s.sleep_duration_minutes !== null) {
              ws += Math.min(100, Math.max(0, 100 - Math.abs(s.sleep_duration_minutes / 60 - 7) * 20)) * 0.3
              tw += 0.3
            }
            const cs = tw > 0 ? ws / tw : 50
            const wAge = Math.round(chronologicalAge + (-5 + (1 - cs / 100) * 13))
            return {
              date: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              age: wAge,
            }
          })
          .slice(-60) // last 60 days
        if (trendData.length < 3) return null
        const minAge = Math.min(...trendData.map((d) => d.age)) - 2
        const maxAge = Math.max(...trendData.map((d) => d.age)) + 2
        return (
          <div className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-1">Wellness Age Trend</h2>
            <p className="text-xs text-text-secondary mb-4">How your estimated wellness age has changed over the past 60 days</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[minAge, maxAge]} tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }} width={30} />
                <ReferenceLine y={chronologicalAge} stroke="rgba(148,163,184,0.3)" strokeDasharray="4 3"
                  label={{ value: 'Chrono age', position: 'insideTopRight', fontSize: 9, fill: 'rgba(148,163,184,0.6)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface,#1a1a1a)', border: '1px solid var(--color-border,#333)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v} yrs`, 'Wellness Age']}
                />
                <Line type="monotone" dataKey="age" stroke="#a78bfa" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a78bfa' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })()}

      {/* ── 8. Disclaimer card ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4 flex gap-3">
        <Info className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          This is an estimation based on Apple Watch data. Add blood biomarker data for true
          biological age tracking — labs like{' '}
          <span className="font-semibold text-text-primary">Everly Health</span> or{' '}
          <span className="font-semibold text-text-primary">InsideTracker</span> measure CRP,
          glucose, HbA1c, and other markers that give a clinically validated biological age.
        </p>
      </div>

    </div>
  )
}
