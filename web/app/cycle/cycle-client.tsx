'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface CycleRecord {
  id: string
  start_date: string
  end_date?: string | null
  cycle_length_days?: number | null
  period_length_days?: number | null
  phase?: string | null
  notes?: string | null
}

interface CycleClientProps {
  cycles: CycleRecord[]
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

const PHASE_CONFIG: Record<
  Phase,
  { label: string; days: string; color: string; bgColor: string; training: string; description: string }
> = {
  menstrual: {
    label: 'Menstrual',
    days: 'Days 1–5',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/10',
    training: 'Low-intensity & recovery',
    description:
      'Estrogen and progesterone are at their lowest. Prioritize rest, gentle movement, and recovery. Light yoga, walking, and stretching are ideal.',
  },
  follicular: {
    label: 'Follicular',
    days: 'Days 6–13',
    color: '#a855f7',
    bgColor: 'bg-purple-500/10',
    training: 'Build strength & set PRs',
    description:
      'Rising estrogen improves muscle recovery and pain tolerance. This is the best window for progressive overload, heavy lifting, and chasing personal records.',
  },
  ovulatory: {
    label: 'Ovulatory',
    days: 'Days 14–16',
    color: '#ec4899',
    bgColor: 'bg-pink-500/10',
    training: 'Peak performance window',
    description:
      'Testosterone and estrogen peak together, maximizing power output and coordination. Ideal for competitions, intervals, and your hardest sessions.',
  },
  luteal: {
    label: 'Luteal',
    days: 'Days 17–28',
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    training: 'Zone 2 & technique work',
    description:
      'Progesterone rises and body temperature increases. Endurance and fat-burning improve but power may dip. Focus on aerobic base, Zone 2 cardio, and skill work.',
  },
}

const PHASE_ORDER: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']

function detectCurrentPhase(latestCycle: CycleRecord): Phase | null {
  const start = new Date(latestCycle.start_date)
  const today = new Date()
  const dayOfCycle = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (dayOfCycle < 1) return null
  if (dayOfCycle <= 5) return 'menstrual'
  if (dayOfCycle <= 13) return 'follicular'
  if (dayOfCycle <= 16) return 'ovulatory'
  if (dayOfCycle <= 28) return 'luteal'
  return null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-surface rounded-2xl border border-border px-6">
        <span className="text-5xl">🌸</span>
        <h2 className="text-lg font-semibold text-text-primary">No cycle data yet</h2>
        <p className="text-sm text-text-secondary max-w-sm">
          Cycle data is synced from Apple Health on your iPhone. Log your menstrual cycle in the
          Health app to see phase analysis here.
        </p>
        <div className="mt-2 flex flex-col gap-1 text-xs text-text-secondary opacity-80">
          <span>Open Health app → Browse → Cycle Tracking</span>
        </div>
      </div>

      <PhaseGuide currentPhase={null} />
      <ScienceCard />
    </div>
  )
}

// ─── Phase guide card ────────────────────────────────────────────────────────

function PhaseGuide({ currentPhase }: { currentPhase: Phase | null }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">Training by Phase</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {PHASE_ORDER.map((phase) => {
          const cfg = PHASE_CONFIG[phase]
          const isActive = currentPhase === phase
          return (
            <div
              key={phase}
              className={`rounded-xl border p-3 transition-all ${
                isActive
                  ? 'border-current ring-1 ring-current/30'
                  : 'border-border'
              } ${cfg.bgColor}`}
              style={isActive ? { borderColor: cfg.color } : undefined}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-xs text-text-secondary">{cfg.days}</span>
                {isActive && (
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: cfg.color + '33', color: cfg.color }}
                  >
                    Now
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-text-primary mb-1">{cfg.training}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{cfg.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Science card ────────────────────────────────────────────────────────────

function ScienceCard() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-2">
      <h3 className="text-sm font-semibold text-text-primary">About Cycle-Synced Training</h3>
      <p className="text-xs text-text-secondary leading-relaxed">
        Hormonal fluctuations across the menstrual cycle significantly affect energy, strength,
        recovery, and perceived effort. Research shows that aligning training intensity with cycle
        phases — a practice called <span className="text-text-primary font-medium">cycle syncing</span> —
        can improve performance outcomes, reduce injury risk, and enhance overall wellbeing.
      </p>
      <p className="text-xs text-text-secondary leading-relaxed">
        During the follicular phase, higher estrogen enhances muscle protein synthesis and lowers
        the perception of fatigue, making it ideal for strength gains. The luteal phase brings
        elevated core temperature and altered substrate use, shifting the body toward fat oxidation —
        great for long aerobic efforts.
      </p>
      <p className="text-xs text-text-secondary opacity-70">
        Individual variation is significant. Use these guidelines as a starting point and adjust
        based on how you feel day to day.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CycleClient({ cycles }: CycleClientProps) {
  if (cycles.length === 0) {
    return <EmptyState />
  }

  const latestCycle = cycles[0]
  const currentPhase = detectCurrentPhase(latestCycle)
  const cyclesWithLength = cycles.filter((c) => (c.cycle_length_days ?? 0) > 0)

  // Cycle length chart data (most recent 12, reverse to chronological)
  const cycleLengthData = [...cyclesWithLength]
    .reverse()
    .slice(-12)
    .map((c) => ({
      date: fmtDate(c.start_date),
      days: c.cycle_length_days!,
    }))

  const avgCycleLength =
    cyclesWithLength.length > 0
      ? cyclesWithLength.reduce((s, c) => s + (c.cycle_length_days ?? 0), 0) /
        cyclesWithLength.length
      : null

  const cyclesWithPeriod = cycles.filter((c) => (c.period_length_days ?? 0) > 0)
  const avgPeriodLength =
    cyclesWithPeriod.length > 0
      ? cyclesWithPeriod.reduce((s, c) => s + (c.period_length_days ?? 0), 0) /
        cyclesWithPeriod.length
      : null

  const start = new Date(latestCycle.start_date)
  const today = new Date()
  const dayOfCycle = Math.max(
    1,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  )

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-pink-400">{cycles.length}</p>
          <p className="text-xs text-text-secondary mt-0.5">Cycles Logged</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {avgCycleLength !== null ? `${avgCycleLength.toFixed(0)} d` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Cycle Length</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-violet-400">
            {avgPeriodLength !== null ? `${avgPeriodLength.toFixed(0)} d` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Period Length</p>
        </div>
      </div>

      {/* Current phase banner */}
      {currentPhase && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: PHASE_CONFIG[currentPhase].color,
            background: PHASE_CONFIG[currentPhase].color + '15',
          }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-0.5">
                Current Phase
              </p>
              <p className="text-xl font-bold" style={{ color: PHASE_CONFIG[currentPhase].color }}>
                {PHASE_CONFIG[currentPhase].label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">Day of cycle</p>
              <p className="text-2xl font-bold" style={{ color: PHASE_CONFIG[currentPhase].color }}>
                {dayOfCycle}
              </p>
            </div>
          </div>
          <p className="text-sm font-medium" style={{ color: PHASE_CONFIG[currentPhase].color }}>
            {PHASE_CONFIG[currentPhase].training}
          </p>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {PHASE_CONFIG[currentPhase].description}
          </p>
        </div>
      )}

      {/* Cycle length chart */}
      {cycleLengthData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Cycle Length History (days)
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={cycleLengthData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
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
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} days`, 'Cycle Length']}
              />
              {avgCycleLength !== null && (
                <ReferenceLine
                  y={avgCycleLength}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: `avg ${avgCycleLength.toFixed(0)}d`,
                    position: 'right',
                    fontSize: 10,
                    fill: '#a855f7',
                  }}
                />
              )}
              <Bar dataKey="days" fill="#ec4899" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <PhaseGuide currentPhase={currentPhase} />

      {/* Recent cycles table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-text-secondary">Recent Cycles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2">
                  Start Date
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Cycle Length
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">
                  Period Length
                </th>
              </tr>
            </thead>
            <tbody>
              {cycles.slice(0, 12).map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-border last:border-0 ${
                    i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-text-primary whitespace-nowrap">
                    {fmtDate(c.start_date)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-pink-400">
                    {(c.cycle_length_days ?? 0) > 0 ? `${c.cycle_length_days} d` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {(c.period_length_days ?? 0) > 0 ? `${c.period_length_days} d` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cycles.length > 12 && (
          <p className="text-xs text-text-secondary text-center px-4 py-2">
            Showing 12 of {cycles.length} cycles
          </p>
        )}
      </div>

      <ScienceCard />
    </div>
  )
}
