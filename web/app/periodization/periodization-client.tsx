'use client'

import {
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
import type { PeriodizationData, Phase, WeekBucket, PhaseBlock } from './page'

interface Props {
  data: PeriodizationData
}

// ─── Phase config ──────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<Phase, { label: string; color: string; shortLabel: string }> = {
  base: { label: 'Base Building', color: '#3b82f6', shortLabel: 'Base' },
  build: { label: 'Build Phase', color: '#f97316', shortLabel: 'Build' },
  peak: { label: 'Peak Phase', color: '#ef4444', shortLabel: 'Peak' },
  taper: { label: 'Taper', color: '#a855f7', shortLabel: 'Taper' },
  offSeason: { label: 'Off-Season', color: '#9ca3af', shortLabel: 'Off' },
}

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  base: 'You\'re in a base building phase — the foundation of all training. Focus is on aerobic development, building mileage gradually, and establishing consistency. Keep intensity moderate and prioritize volume accumulation.',
  build: 'You\'re in a build phase — volume and intensity are rising together. This is where fitness gains accelerate. Introduce tempo runs, threshold workouts, or heavier lifting sessions while managing cumulative fatigue.',
  peak: 'You\'re at peak training load — the highest sustained stress before a taper. Fitness is near its maximum but so is fatigue. Prioritize sleep and nutrition, and avoid adding unexpected stressors.',
  taper: 'You\'re tapering — reducing training load ahead of a key event or recovery block. Maintain some intensity but cut volume significantly. Trust the process; fatigue dissipating reveals fitness you\'ve built.',
  offSeason: 'You\'re in an off-season or recovery block. Training volume is low relative to your peak. Use this time for unstructured activity, cross-training, and mental recovery before the next training cycle.',
}

const PHASE_TIPS: Record<Phase, string[]> = {
  base: [
    'Keep easy runs and rides truly easy — conversational pace builds aerobic base without accumulating excess fatigue.',
    'Increase weekly volume by no more than 10% each week to avoid overuse injuries during the build-up.',
    'Add one long session per week at comfortable effort to extend your aerobic ceiling.',
  ],
  build: [
    'Introduce 1–2 quality sessions per week (tempo, threshold, or intervals) while keeping easy days easy.',
    'Monitor recovery closely — a dip in HRV or elevated resting heart rate signals the need for an easier day.',
    'Plan a recovery week every 3–4 weeks, reducing volume by 30–40% to absorb training adaptations.',
  ],
  peak: [
    'Protect sleep above all else — most physiological adaptation happens during deep sleep, and peak training increases the demand.',
    'Fuel adequately; under-eating during peak weeks suppresses immune function and slows recovery.',
    'Avoid adding new stressors (travel, new equipment, drastic diet changes) — stability maximizes training return.',
  ],
  taper: [
    'Reduce volume by 40–60% but keep a few short, sharp efforts to maintain neuromuscular sharpness.',
    'Resist the urge to add more training when you feel fresh — the freshness is the goal, not extra fitness.',
    'Focus on logistics, race-day nutrition, and mental preparation while the body supercompensates.',
  ],
  offSeason: [
    'Use unstructured movement like hiking, swimming, or recreational sports to stay active without structure-driven pressure.',
    'Address weaknesses (mobility, strength imbalances, technique) that get deprioritized during hard training.',
    'Set intentions for the next training cycle and build a rough periodization plan before ramping back up.',
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMin(n: number): string {
  return Math.round(n).toLocaleString()
}

// Extract monthly tick labels from week buckets (only show first week of each month)
function buildMonthTicks(buckets: WeekBucket[]): Record<string, string> {
  const seen = new Set<string>()
  const ticks: Record<string, string> = {}
  for (const b of buckets) {
    const [year, month] = b.monday.split('-')
    const key = `${year}-${month}`
    if (!seen.has(key)) {
      seen.add(key)
      const d = new Date(b.monday + 'T00:00:00Z')
      ticks[b.monday] = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    }
  }
  return ticks
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; payload: WeekBucket }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const bucket = payload[0]?.payload
  const phase = bucket?.phase ?? 'offSeason'
  const cfg = PHASE_CONFIG[phase]
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      <p className="text-gray-500 dark:text-gray-400 tabular-nums">
        {fmtMin(payload[0]?.value ?? 0)} min
      </p>
      <p className="mt-1 text-xs font-medium" style={{ color: cfg.color }}>
        {cfg.label}
      </p>
    </div>
  )
}

// ─── Phase Badge ──────────────────────────────────────────────────────────────

function PhaseBadge({ phase, large = false }: { phase: Phase; large?: boolean }) {
  const cfg = PHASE_CONFIG[phase]
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${large ? 'text-base px-4 py-1.5' : 'text-xs px-2.5 py-0.5'}`}
      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Main Client Component ─────────────────────────────────────────────────────

export function PeriodizationClient({ data }: Props) {
  const { buckets, phaseBlocks, currentPhase, peakVolume, avgVolume, currentVolume } = data

  const hasEnoughData = buckets.filter((b) => b.totalMinutes > 0).length >= 8

  if (!hasEnoughData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Not Enough Data</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Periodization analysis requires at least 8 weeks of workout history. Keep training and check back soon.
        </p>
      </div>
    )
  }

  const monthTicks = buildMonthTicks(buckets)
  const pctOfPeak = peakVolume > 0 ? Math.round((currentVolume / peakVolume) * 100) : 0

  // For x-axis: show label only if it's a month-start week, otherwise empty string
  const chartData = buckets.map((b) => ({
    ...b,
    label: monthTicks[b.monday] ?? '',
  }))

  // Recent phase blocks (most recent first, up to 8)
  const recentBlocks = [...phaseBlocks].reverse().slice(0, 8)

  // Timeline: total weeks for proportional widths
  const totalTimelineWeeks = phaseBlocks.reduce((a, b) => a + b.weekCount, 0)

  const currentCfg = PHASE_CONFIG[currentPhase]
  const tips = PHASE_TIPS[currentPhase]
  const description = PHASE_DESCRIPTIONS[currentPhase]

  return (
    <div className="space-y-4">

      {/* ── Current Phase Card ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
          Current Phase
        </p>
        <div className="flex items-start justify-between gap-3 mb-4">
          <PhaseBadge phase={currentPhase} large />
        </div>

        {/* Volume stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Current (2-wk avg)</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {fmtMin(currentVolume)}<span className="text-xs font-normal text-gray-400 ml-1">min/wk</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Peak (52-wk)</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {fmtMin(peakVolume)}<span className="text-xs font-normal text-gray-400 ml-1">min/wk</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">52-wk avg</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {fmtMin(avgVolume)}<span className="text-xs font-normal text-gray-400 ml-1">min/wk</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">% of Peak</p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: currentCfg.color }}
            >
              {pctOfPeak}%
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>

      {/* ── Volume Chart ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Weekly Training Volume</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">52 weeks · bars colored by phase</p>

        {/* Phase color legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4">
          {(Object.entries(PHASE_CONFIG) as [Phase, typeof PHASE_CONFIG[Phase]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ left: -18, bottom: 0 }} barCategoryGap="8%">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'currentColor' }}
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              unit=" m"
            />
            <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
            <ReferenceLine
              y={avgVolume}
              stroke="#64748b"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'avg',
                fill: '#64748b',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />
            <Bar dataKey="totalMinutes" name="Minutes" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PHASE_CONFIG[entry.phase].color}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Phase Timeline ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Phase Timeline</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">52-week phase history · scroll to see all</p>

        <div className="overflow-x-auto">
          <div className="flex h-10 min-w-full rounded-lg overflow-hidden gap-px" style={{ minWidth: '100%' }}>
            {phaseBlocks.map((block) => {
              const cfg = PHASE_CONFIG[block.phase]
              const widthPct = totalTimelineWeeks > 0 ? (block.weekCount / totalTimelineWeeks) * 100 : 0
              const showLabel = widthPct >= 8
              return (
                <div
                  key={block.id}
                  className="flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: cfg.color + '33',
                    borderTop: `3px solid ${cfg.color}`,
                  }}
                  title={`${cfg.label} · ${block.weekCount} wk · ${block.startDate} → ${block.endDate}`}
                >
                  {showLabel && (
                    <span className="text-[10px] font-semibold px-1 truncate" style={{ color: cfg.color }}>
                      {cfg.shortLabel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline date labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {phaseBlocks[0]?.startDate ?? ''}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {phaseBlocks[phaseBlocks.length - 1]?.endDate ?? ''}
          </span>
        </div>
      </div>

      {/* ── Recent Phase Blocks Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Phases</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 text-xs border-b border-gray-100 dark:border-gray-800">
                <th className="text-left pb-2 font-medium">Phase</th>
                <th className="text-right pb-2 font-medium">Start</th>
                <th className="text-right pb-2 font-medium">End</th>
                <th className="text-right pb-2 font-medium">Weeks</th>
              </tr>
            </thead>
            <tbody>
              {recentBlocks.map((block: PhaseBlock, i: number) => {
                const cfg = PHASE_CONFIG[block.phase]
                return (
                  <tr
                    key={block.id}
                    className={i % 2 === 0 ? '' : 'bg-gray-50/60 dark:bg-gray-800/40'}
                  >
                    <td className="py-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs text-gray-500 dark:text-gray-400">
                      {block.startDate}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs text-gray-500 dark:text-gray-400">
                      {block.endDate}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs font-medium text-gray-900 dark:text-gray-100">
                      {block.weekCount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tips Card ─────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 border"
        style={{ backgroundColor: currentCfg.color + '12', borderColor: currentCfg.color + '30' }}
      >
        <h3 className="font-semibold mb-3 text-sm" style={{ color: currentCfg.color }}>
          {currentCfg.label} Tips
        </h3>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="shrink-0 font-bold mt-0.5" style={{ color: currentCfg.color }}>·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
