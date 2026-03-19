'use client'

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { CardiacDriftData, DriftRun, DriftLevel } from './page'

interface Props {
  data: CardiacDriftData
}

// ─── Level config ─────────────────────────────────────────────────────────────

interface LevelConfig {
  label: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  badgeBg: string
  badgeText: string
  description: string
}

const LEVEL_CONFIG: Record<DriftLevel, LevelConfig> = {
  excellent: {
    label: 'Excellent',
    color: '#16a34a',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderClass: 'border-green-200 dark:border-green-900/50',
    textClass: 'text-green-700 dark:text-green-400',
    badgeBg: 'bg-green-100 dark:bg-green-950/50',
    badgeText: 'text-green-700 dark:text-green-400',
    description: 'Strong aerobic base — heart rate is stable across the run.',
  },
  moderate: {
    label: 'Moderate',
    color: '#f97316',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-900/50',
    textClass: 'text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/50',
    badgeText: 'text-orange-700 dark:text-orange-400',
    description: 'Moderate drift — more Zone 2 training can improve aerobic efficiency.',
  },
  high: {
    label: 'High',
    color: '#dc2626',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-900/50',
    textClass: 'text-red-700 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-950/50',
    badgeText: 'text-red-700 dark:text-red-400',
    description: 'High drift — consider fueling, hydration, or base-building volume.',
  },
}

// ─── Trend config ─────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  improving: { label: 'Improving', symbol: '↓', color: '#16a34a', hint: 'Drift is trending down — aerobic base is strengthening.' },
  worsening: { label: 'Worsening', symbol: '↑', color: '#dc2626', hint: 'Drift is trending up — check fatigue, hydration, and training load.' },
  stable: { label: 'Stable', symbol: '→', color: '#6b7280', hint: 'Drift is holding steady over recent runs.' },
  insufficient: { label: 'Not enough data', symbol: '—', color: '#9ca3af', hint: 'Need at least 4 long runs to calculate a trend.' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtShortDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function driftColor(pct: number): string {
  if (pct < 5) return '#16a34a'
  if (pct <= 10) return '#f97316'
  return '#dc2626'
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string
  value: number
  payload?: {
    date?: string
    duration_minutes?: number
    first_half_hr?: number
    second_half_hr?: number
    avg_heart_rate?: number
    drift_pct?: number
    drift_level?: DriftLevel
  }
}

function DriftTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  if (!active || !payload?.length) return null
  const run = payload[0]?.payload
  if (!run) return null

  const level = run.drift_level ? LEVEL_CONFIG[run.drift_level] : null

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm min-w-[180px]">
      {run.date && (
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{fmtDate(run.date)}</p>
      )}
      <div className="space-y-1">
        {run.duration_minutes != null && (
          <p className="text-gray-500 dark:text-gray-400">
            Duration: <span className="font-medium text-gray-800 dark:text-gray-200">{fmtDuration(run.duration_minutes)}</span>
          </p>
        )}
        {run.first_half_hr != null && (
          <p className="text-gray-500 dark:text-gray-400 tabular-nums">
            1st half: <span className="font-medium text-gray-800 dark:text-gray-200">{run.first_half_hr} bpm</span>
          </p>
        )}
        {run.second_half_hr != null && (
          <p className="text-gray-500 dark:text-gray-400 tabular-nums">
            2nd half: <span className="font-medium text-gray-800 dark:text-gray-200">{run.second_half_hr} bpm</span>
          </p>
        )}
        {run.drift_pct != null && (
          <p className="text-gray-500 dark:text-gray-400 tabular-nums mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
            Drift:{' '}
            <span className="font-semibold" style={{ color: driftColor(run.drift_pct) }}>
              {run.drift_pct.toFixed(1)}%
            </span>
            {level && (
              <span className={`ml-1.5 text-xs font-medium ${level.textClass}`}>({level.label})</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Summary stat ─────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p
        className="text-2xl font-bold tabular-nums leading-none"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function CardiacDriftClient({ data }: Props) {
  const { runs, avgDrift, bestDrift, worstDrift, trendDirection } = data

  // ── Empty state ───────────────────────────────────────────────────────────
  if (runs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Long Runs Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            Cardiac drift analysis requires running workouts of at least 45 minutes. Sync a long run from Apple Health to see your results.
          </p>
        </div>
        <ScienceCard />
      </div>
    )
  }

  // ── Build chart data (chronological) ─────────────────────────────────────
  const chartData = [...runs]
    .reverse()
    .map((r) => ({
      label: fmtShortDate(r.date),
      drift_pct: r.drift_pct,
      // attach full run for tooltip
      date: r.date,
      duration_minutes: r.duration_minutes,
      first_half_hr: r.first_half_hr,
      second_half_hr: r.second_half_hr,
      avg_heart_rate: r.avg_heart_rate,
      drift_level: r.drift_level,
    }))

  const avgDriftLevel: DriftLevel = avgDrift < 5 ? 'excellent' : avgDrift <= 10 ? 'moderate' : 'high'
  const avgLevelCfg = LEVEL_CONFIG[avgDriftLevel]
  const trendCfg = TREND_CONFIG[trendDirection]

  const recentRuns = runs.slice(0, 12)

  return (
    <div className="space-y-4">

      {/* ── Estimation notice ──────────────────────────────────────────────────── */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-4 py-3 flex gap-3 items-start">
        <span className="shrink-0 mt-0.5 text-amber-500 font-bold text-base">~</span>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          Drift is <strong>estimated</strong> from workout summary data (avg HR + max HR). Apple Health does not store per-minute HR splits, so first/second half values are modelled — not measured. Treat percentages as indicative, not precise.
        </p>
      </div>

      {/* ── Summary card ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Summary · {runs.length} long run{runs.length !== 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCell
            label="Avg drift"
            value={`${avgDrift.toFixed(1)}%`}
            sub={avgLevelCfg.label}
            color={avgLevelCfg.color}
          />
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">Trend</p>
            <p
              className="text-2xl font-bold leading-none"
              style={{ color: trendCfg.color }}
            >
              {trendCfg.symbol} {trendCfg.label}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed mt-0.5">
              {trendCfg.hint}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCell
            label="Best drift (lowest)"
            value={`${bestDrift.toFixed(1)}%`}
            sub={bestDrift < 5 ? 'Excellent aerobic base' : bestDrift <= 10 ? 'Moderate' : 'High'}
            color={driftColor(bestDrift)}
          />
          <StatCell
            label="Worst drift (highest)"
            value={`${worstDrift.toFixed(1)}%`}
            sub={worstDrift < 5 ? 'Excellent' : worstDrift <= 10 ? 'Moderate' : 'Check fueling/hydration'}
            color={driftColor(worstDrift)}
          />
        </div>
      </div>

      {/* ── Drift trend chart ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Drift Over Time</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Each dot = one long run · colour = drift level
        </p>

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {(['excellent', 'moderate', 'high'] as DriftLevel[]).map((level) => {
            const cfg = LEVEL_CONFIG[level]
            return (
              <div key={level} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cfg.label}
                  {level === 'excellent' && ' (< 5%)'}
                  {level === 'moderate' && ' (5–10%)'}
                  {level === 'high' && ' (> 10%)'}
                </span>
              </div>
            )
          })}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ left: -14, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax) + 2, 15)]}
              tickFormatter={(v: number) => `${v}%`}
            />
            {/* Zone reference bands via ReferenceLine */}
            <ReferenceLine y={5} stroke="#16a34a" strokeDasharray="4 3" strokeOpacity={0.4} label={{ value: '5%', position: 'right', fontSize: 9, fill: '#16a34a' }} />
            <ReferenceLine y={10} stroke="#f97316" strokeDasharray="4 3" strokeOpacity={0.4} label={{ value: '10%', position: 'right', fontSize: 9, fill: '#f97316' }} />
            <Tooltip content={<DriftTooltip />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.1 }} />
            {/* Trend line */}
            <Line
              type="monotone"
              dataKey="drift_pct"
              stroke="#6b7280"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={false}
              name="Trend"
            />
            {/* Colour-coded scatter dots */}
            <Scatter
              dataKey="drift_pct"
              name="Drift %"
              shape={(props: {
                cx?: number
                cy?: number
                payload?: { drift_pct?: number }
              }) => {
                const { cx = 0, cy = 0, payload } = props
                const pct = payload?.drift_pct ?? 0
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={driftColor(pct)}
                    stroke="white"
                    strokeWidth={1.5}
                    opacity={0.9}
                  />
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Run table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Last {recentRuns.length} Long Runs</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Runs ≥ 45 min · HR splits are estimated</p>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          {['Date', 'Dur.', '1st half', '2nd half', 'Drift'].map((h) => (
            <p key={h} className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right first:text-left">
              {h}
            </p>
          ))}
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentRuns.map((run) => {
            const cfg = LEVEL_CONFIG[run.drift_level]
            return (
              <li
                key={run.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-3 items-center"
              >
                {/* Date */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {fmtDate(run.date)}
                  </span>
                </div>

                {/* Duration */}
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums text-right">
                  {fmtDuration(run.duration_minutes)}
                </span>

                {/* 1st half HR */}
                <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums text-right">
                  {run.first_half_hr} bpm
                </span>

                {/* 2nd half HR */}
                <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums text-right">
                  {run.second_half_hr} bpm
                </span>

                {/* Drift badge */}
                <span
                  className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${cfg.badgeBg} ${cfg.badgeText}`}
                >
                  {run.drift_pct.toFixed(1)}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Science explanation card ─────────────────────────────────────────────── */}
      <ScienceCard />

    </div>
  )
}

// ─── Science card (standalone so it renders in empty state too) ───────────────

function ScienceCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">What is Cardiac Drift?</h2>

      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        <p>
          <strong className="text-gray-800 dark:text-gray-200">Cardiac drift</strong> is the gradual rise in heart rate that occurs during sustained aerobic exercise at a constant pace and effort. Even though power output stays the same, HR climbs — typically in the second half of a long run.
        </p>
        <p>
          The primary driver is cardiovascular drift caused by progressive <strong className="text-gray-800 dark:text-gray-200">dehydration</strong>: as plasma volume decreases, stroke volume falls, and the heart compensates by beating faster to maintain cardiac output.
        </p>
        <p>
          A secondary driver is <strong className="text-gray-800 dark:text-gray-200">thermoregulation</strong>: more blood is redirected to the skin for cooling, reducing the volume available to working muscles.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {(
          [
            ['excellent', 'Less than 5 % — strong aerobic base. Stroke volume is well-maintained throughout the run.'],
            ['moderate', '5–10 % — typical for recreational runners. More Zone 2 volume will widen the aerobic window.'],
            ['high', 'Over 10 % — significant drift. Often linked to inadequate fueling/hydration, excessive heat, or underdeveloped aerobic base.'],
          ] as [DriftLevel, string][]
        ).map(([level, desc]) => {
          const cfg = LEVEL_CONFIG[level]
          return (
            <div key={level} className={`rounded-xl p-3 border ${cfg.bgClass} ${cfg.borderClass}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                <p className={`text-xs font-semibold ${cfg.textClass}`}>{cfg.label}</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">How to reduce drift</h3>
        <ul className="space-y-1.5">
          {[
            'Build weekly Zone 2 volume — the most effective long-term fix.',
            'Hydrate proactively: aim for ~500 ml/hour on warm-day runs.',
            'Use carbohydrate fueling on runs longer than 75 minutes.',
            'Run in cooler conditions or earlier in the day to reduce thermoregulatory load.',
          ].map((tip) => (
            <li key={tip} className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="shrink-0 text-gray-300 dark:text-gray-600">—</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        Values shown are estimated from workout summary data and are intended for training guidance only. Consult a sports physician for a clinical assessment of your cardiovascular health.
      </p>
    </div>
  )
}
