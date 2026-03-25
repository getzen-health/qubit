'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

interface PhaseHREntry {
  phase: string
  avgHR: number
  days: string
}

interface RecentWorkout {
  date: string
  type: string
  phase: Phase
  hr: number
  duration: number
}

export interface CycleTrainingData {
  currentDay: number
  cycleLength: number
  currentPhase: Phase
  phaseHRData: PhaseHREntry[]
  recentWorkouts: RecentWorkout[]
}

interface CycleTrainingClientProps {
  data: CycleTrainingData
}

// ── Constants ──────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<
  Phase,
  {
    label: string
    color: string
    bgClass: string
    borderClass: string
    textClass: string
    badgeClass: string
    days: string
    emoji: string
    intensity: string
    activities: string
    tip: string
    dayRange: [number, number]
  }
> = {
  menstrual: {
    label: 'Menstrual',
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/20 text-red-300',
    days: 'Days 1–5',
    emoji: '🔴',
    intensity: 'Low — Honor rest',
    activities: 'Yoga, walking, light swimming, gentle stretching',
    tip: 'Your body is doing hard work. Opt for restorative movement, prioritize iron-rich foods, and reduce inflammation with omega-3s.',
    dayRange: [1, 5],
  },
  follicular: {
    label: 'Follicular',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-400',
    badgeClass: 'bg-green-500/20 text-green-300',
    days: 'Days 6–13',
    emoji: '🟢',
    intensity: 'Moderate → High — Build progressively',
    activities: 'Running, cycling, strength training, tempo efforts',
    tip: 'Rising estrogen boosts mood, energy, and muscle repair. Increase intensity gradually — a great time to push personal records.',
    dayRange: [6, 13],
  },
  ovulation: {
    label: 'Ovulation',
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/20 text-orange-300',
    days: 'Days 12–16',
    emoji: '🟠',
    intensity: 'Peak — Maximum power output',
    activities: 'HIIT, heavy lifting, sprint intervals, race efforts',
    tip: 'Estrogen peaks — muscle protein synthesis and power output are at their highest. But note elevated ACL injury risk; add neuromuscular warm-ups.',
    dayRange: [12, 16],
  },
  luteal: {
    label: 'Luteal',
    color: '#a855f7',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-300',
    days: 'Days 17–28',
    emoji: '🟣',
    intensity: 'Moderate — Maintain, don\'t force',
    activities: 'Strength technique work, moderate cardio, pilates, mobility',
    tip: 'Progesterone raises core temp +0.3–0.5°C and reduces aerobic efficiency. Focus on technique and consistency rather than chasing new bests.',
    dayRange: [17, 28],
  },
}

const PHASE_ORDER: Phase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

const BAR_COLORS: Record<string, string> = {
  Menstrual: '#ef4444',
  Follicular: '#22c55e',
  Ovulation: '#f97316',
  Luteal: '#a855f7',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ── Phase Ring SVG ─────────────────────────────────────────────────────────

function PhaseRing({
  currentDay,
  cycleLength,
  currentPhase,
}: {
  currentDay: number
  cycleLength: number
  currentPhase: Phase
}) {
  const cx = 80
  const cy = 80
  const r = 60
  const strokeWidth = 14
  const circumference = 2 * Math.PI * r

  // Each phase arc as a fraction of the cycle
  const segments: { phase: Phase; start: number; end: number }[] = [
    { phase: 'menstrual', start: 0, end: 5 },
    { phase: 'follicular', start: 5, end: 13 },
    { phase: 'ovulation', start: 13, end: 16 },
    { phase: 'luteal', start: 16, end: 28 },
  ]

  // Rotate so day 1 is at top (−90°)
  const dayToAngle = (day: number) => (day / cycleLength) * 360 - 90

  // Dot for current day
  const dotAngleRad = ((dayToAngle(currentDay - 0.5) + 90 - 90) * Math.PI) / 180
  const dotX = cx + r * Math.cos(((dayToAngle(currentDay - 0.5)) * Math.PI) / 180)
  const dotY = cy + r * Math.sin(((dayToAngle(currentDay - 0.5)) * Math.PI) / 180)

  function arcPath(startDay: number, endDay: number) {
    const startAngle = (dayToAngle(startDay) * Math.PI) / 180
    const endAngle = (dayToAngle(endDay) * Math.PI) / 180
    const largeArc = endDay - startDay > cycleLength / 2 ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  return (
    <svg width={160} height={160} viewBox="0 0 160 160" aria-label="Cycle phase ring">
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Phase arcs */}
      {segments.map(({ phase, start, end }) => {
        const cfg = PHASE_CONFIG[phase]
        const isActive = phase === currentPhase
        return (
          <path
            key={phase}
            d={arcPath(start, end)}
            fill="none"
            stroke={cfg.color}
            strokeWidth={isActive ? strokeWidth + 4 : strokeWidth - 2}
            strokeLinecap="round"
            opacity={isActive ? 1 : 0.35}
          />
        )
      })}
      {/* Current day dot */}
      <circle cx={dotX} cy={dotY} r={6} fill="white" opacity={0.95} />
      <circle cx={dotX} cy={dotY} r={3} fill={PHASE_CONFIG[currentPhase].color} />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="white"
        fontSize={22}
        fontWeight="700"
      >
        {currentDay}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={9}
        fontWeight="500"
        letterSpacing="0.5"
      >
        DAY OF CYCLE
      </text>
    </svg>
  )
}

// ── Main client component ──────────────────────────────────────────────────

export function CycleTrainingClient({ data }: CycleTrainingClientProps) {
  const { currentDay, cycleLength, currentPhase, phaseHRData, recentWorkouts } = data
  const cfg = PHASE_CONFIG[currentPhase]

  return (
    <div className="space-y-6">

      {/* ── Hero: Current phase card ─────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-5 ${cfg.bgClass} ${cfg.borderClass}`}
        style={{ borderColor: cfg.color + '40', background: cfg.color + '12' }}
      >
        <div className="flex items-start gap-5">
          {/* Phase ring */}
          <div className="shrink-0">
            <PhaseRing
              currentDay={currentDay}
              cycleLength={cycleLength}
              currentPhase={currentPhase}
            />
          </div>

          {/* Phase info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Current Phase
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary leading-tight">
              {cfg.emoji} {cfg.label} Phase
            </h2>
            <p className="text-sm font-medium mt-0.5" style={{ color: cfg.color }}>
              Day {currentDay} of {cycleLength} · {cfg.days}
            </p>
            <div
              className="mt-3 rounded-xl p-3 text-sm text-text-secondary leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.25)' }}
            >
              <span className="font-semibold" style={{ color: cfg.color }}>
                Training tip:{' '}
              </span>
              {cfg.tip}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: cfg.color + '22', color: cfg.color }}
              >
                {cfg.intensity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Phase guide grid ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Phase Training Guide
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PHASE_ORDER.map((phase) => {
            const c = PHASE_CONFIG[phase]
            const isActive = phase === currentPhase
            return (
              <div
                key={phase}
                className={`rounded-2xl border p-4 transition-all ${
                  isActive ? 'ring-2' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  background: c.color + '0d',
                  borderColor: c.color + (isActive ? '60' : '30'),

                  ...(isActive ? { boxShadow: `0 0 0 2px ${c.color}60` } : {}),
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.emoji}</span>
                    <span className="font-semibold text-text-primary text-sm">{c.label}</span>
                    {isActive && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: c.color + '30', color: c.color }}
                      >
                        Now
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary font-medium">{c.days}</span>
                </div>

                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: c.color }}
                >
                  {c.intensity}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{c.activities}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Performance by phase bar chart ──────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-secondary mb-0.5">
          Avg Heart Rate by Phase
        </h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Based on last 3 months of workouts
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={phaseHRData}
            margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="phase"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={30}
              domain={[115, 160]}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} bpm`, 'Avg HR']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="avgHR" radius={[6, 6, 0, 0]}>
              {phaseHRData.map((entry) => (
                <Cell
                  key={entry.phase}
                  fill={BAR_COLORS[entry.phase] ?? '#888'}
                  opacity={entry.phase === PHASE_CONFIG[currentPhase].label ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
          {phaseHRData.map((entry) => (
            <div key={entry.phase} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: BAR_COLORS[entry.phase] }}
              />
              <span className="text-xs text-text-secondary">
                {entry.phase}{' '}
                <span className="font-semibold text-text-primary">{entry.avgHR}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent workouts by phase ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-secondary">Recent Workouts</h3>
          <p className="text-xs text-text-secondary opacity-70 mt-0.5">
            Colored by cycle phase at time of workout
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2">Date</th>
                <th className="text-left text-xs text-text-secondary font-medium px-3 py-2">Type</th>
                <th className="text-center text-xs text-text-secondary font-medium px-3 py-2">Phase</th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">Duration</th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">Avg HR</th>
              </tr>
            </thead>
            <tbody>
              {recentWorkouts.map((w, i) => {
                const wc = PHASE_CONFIG[w.phase]
                return (
                  <tr
                    key={i}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-text-primary whitespace-nowrap text-xs">
                      {fmtDate(w.date)}
                    </td>
                    <td className="px-3 py-2.5 text-text-primary font-medium text-xs">
                      {w.type}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: wc.color + '22', color: wc.color }}
                      >
                        {wc.emoji} {wc.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary text-xs">
                      {w.duration} min
                    </td>
                    <td
                      className="px-4 py-2.5 text-right tabular-nums font-medium text-xs"
                      style={{ color: wc.color }}
                    >
                      {w.hr} bpm
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Science card ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <h3 className="font-semibold text-text-primary text-sm">The Science</h3>
          <span className="text-xs text-text-secondary ml-auto opacity-60">
            Peer-reviewed research
          </span>
        </div>

        <div className="space-y-3">
          {/* Estrogen */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(249,115,22,0.08)', borderLeft: '3px solid #f97316' }}
          >
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">
              Estrogen — Ovulatory Peak
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Estrogen peaks at ovulation, driving maximum muscle protein synthesis and power
              output. Leverage this window for high-intensity efforts and new PRs.
            </p>
          </div>

          {/* Progesterone */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(168,85,247,0.08)', borderLeft: '3px solid #a855f7' }}
          >
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
              Progesterone — Luteal Phase
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Rising progesterone elevates resting core temperature by{' '}
              <span className="text-text-primary font-medium">+0.3–0.5°C</span> and reduces
              aerobic efficiency. Expect slightly higher HR at the same pace — this is normal,
              not detraining.
            </p>
          </div>

          {/* ACL warning */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444' }}
          >
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">
              ⚠️ ACL Injury Risk
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              ACL injury risk is elevated during the follicular and ovulatory phases due to
              estrogen-driven ligament laxity. Include neuromuscular activation work — single-leg
              balance, lateral band walks, hip stability drills — before high-demand sessions.
            </p>
          </div>

          {/* Follicular advantage */}
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'rgba(34,197,94,0.08)', borderLeft: '3px solid #22c55e' }}
          >
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">
              Follicular Advantage
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Women show greater training adaptations (strength, VO₂max, body composition) when
              periodizing load to the follicular phase. Scheduling harder blocks here may
              accelerate long-term performance gains.
            </p>
          </div>
        </div>

        {/* Citations */}
        <div
          className="rounded-xl p-3 space-y-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-xs font-semibold text-text-secondary mb-1.5">References</p>
          <p className="text-xs text-text-secondary opacity-70 leading-relaxed">
            McNulty KL et al. (2020). The effects of menstrual cycle phase on exercise
            performance in eumenorrheic women.{' '}
            <em>British Journal of Sports Medicine</em>, 54(8), 450–458.
          </p>
          <p className="text-xs text-text-secondary opacity-70 leading-relaxed">
            Elliott-Sale KJ et al. (2021). Methodological considerations for studies in sport and
            exercise science with women as participants.{' '}
            <em>Sports Medicine</em>, 51, 843–861.
          </p>
        </div>
      </div>

      {/* ── Quick-reference legend bar ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Quick Reference
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PHASE_ORDER.map((phase) => {
            const c = PHASE_CONFIG[phase]
            return (
              <div
                key={phase}
                className="flex flex-col gap-1 rounded-xl p-3"
                style={{ background: c.color + '10', border: `1px solid ${c.color}30` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: c.color }}>
                    {c.label}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">{c.days}</p>
                <p className="text-xs text-text-secondary opacity-80 leading-relaxed">
                  {c.activities.split(',')[0]}
                </p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
