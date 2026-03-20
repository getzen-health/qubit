'use client'

import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { CriticalSpeedData, RunRecord } from './page'

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#0d9488'
const TEAL_LIGHT = 'rgba(13,148,136,0.15)'
const TEAL_MID = 'rgba(13,148,136,0.45)'
const CS_KMH = 12.5

// ─── Training zones config ────────────────────────────────────────────────────

interface Zone {
  id: string
  label: string
  range: string
  description: string
  color: string
  bg: string
  border: string
  text: string
}

const ZONES: Zone[] = [
  {
    id: 'z1',
    label: 'Z1 — Recovery',
    range: '> 6:00 /km',
    description: 'Easy aerobic flush. HR < 65% max. Fat-dominant metabolism.',
    color: '#16a34a',
    bg: 'bg-green-950/30',
    border: 'border-green-900/40',
    text: 'text-green-400',
  },
  {
    id: 'z2',
    label: 'Z2 — Aerobic Base',
    range: '5:20 – 6:00 /km',
    description: 'Endurance building. Comfortably conversational. Primary long-run zone.',
    color: '#65a30d',
    bg: 'bg-lime-950/30',
    border: 'border-lime-900/40',
    text: 'text-lime-400',
  },
  {
    id: 'z3',
    label: 'Z3 — Tempo',
    range: '4:55 – 5:20 /km',
    description: 'Comfortably hard. Just below CS — sustainable for ~40–60 min.',
    color: '#d97706',
    bg: 'bg-amber-950/30',
    border: 'border-amber-900/40',
    text: 'text-amber-400',
  },
  {
    id: 'z4',
    label: 'Z4 — Critical Speed',
    range: '< 4:55 /km',
    description: 'At or just above CS (12.5 km/h). Maximum sustainable aerobic pace.',
    color: TEAL,
    bg: 'bg-teal-950/30',
    border: 'border-teal-900/40',
    text: 'text-teal-400',
  },
  {
    id: 'z5',
    label: "Z5 — D' Depletion",
    range: 'Sprint intervals',
    description: "Above CS — draws down D' (280 m finite anaerobic buffer). Unsustainable.",
    color: '#dc2626',
    bg: 'bg-red-950/30',
    border: 'border-red-900/40',
    text: 'text-red-400',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text-primary, #f1f5f9)',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtPace(speedKmh: number): string {
  const minPerKm = 60 / speedKmh
  const min = Math.floor(minPerKm)
  const sec = Math.round((minPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}/km`
}

// Build regression line data points for the scatter chart
// CS model: distance = CS * duration + D' (linear in distance-time space)
// x = duration (min), y = distance (km)
// slope = CS_KMH / 60 (km per min), intercept = D_PRIME / 1000 (km)
function buildRegressionLine(runs: RunRecord[]): { dur: number; regDist: number }[] {
  if (runs.length === 0) return []
  const minDur = Math.min(...runs.map((r) => r.duration_min))
  const maxDur = Math.max(...runs.map((r) => r.duration_min))

  const CS_KM_PER_MIN = CS_KMH / 60
  const D_PRIME_KM = 0.28

  const points = []
  const steps = 40
  for (let i = 0; i <= steps; i++) {
    const dur = minDur + ((maxDur - minDur) * i) / steps
    const regDist = CS_KM_PER_MIN * dur + D_PRIME_KM
    points.push({ dur: Math.round(dur * 10) / 10, regDist: Math.round(regDist * 100) / 100 })
  }
  return points
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

interface SpeedTooltipProps {
  active?: boolean
  payload?: { value: number; payload: { week: string; avg_speed: number } }[]
  label?: string
}

function SpeedTooltip({ active, payload }: SpeedTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-lg text-sm min-w-[150px]">
      <p className="font-semibold text-text-primary mb-1.5">{d.week}</p>
      <p className="text-text-secondary">
        Avg speed:{' '}
        <span className="font-medium tabular-nums" style={{ color: TEAL }}>
          {d.avg_speed.toFixed(2)} km/h
        </span>
      </p>
      <p className="text-text-secondary text-xs mt-0.5">{fmtPace(d.avg_speed)}</p>
    </div>
  )
}

interface ScatterTooltipProps {
  active?: boolean
  payload?: { payload: { dur: number; dist: number; date: string; speed: number } }[]
}

function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  // Regression line points won't have date
  if (!d.date) return null
  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-text-primary mb-1.5">{fmtDate(d.date)}</p>
      <p className="text-text-secondary">
        Distance:{' '}
        <span className="font-medium tabular-nums" style={{ color: TEAL }}>
          {d.dist.toFixed(1)} km
        </span>
      </p>
      <p className="text-text-secondary">
        Duration:{' '}
        <span className="font-medium tabular-nums text-text-primary">{d.dur.toFixed(0)} min</span>
      </p>
      <p className="text-text-secondary text-xs mt-0.5">{fmtPace(d.speed)} · {d.speed.toFixed(2)} km/h</p>
    </div>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = TEAL,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-secondary">{sub}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  data: CriticalSpeedData
}

export function CriticalSpeedClient({ data }: Props) {
  const { cs_kmh, cs_pace, d_prime_m, r_squared, runs_analyzed, runs, weekly_speed } = data

  // Scatter data: run dots
  const scatterRunDots = runs.map((r) => ({
    dur: r.duration_min,
    dist: r.distance_km,
    date: r.date,
    speed: r.speed_kmh,
  }))

  // Regression line
  const regressionLine = buildRegressionLine(runs)

  return (
    <div className="space-y-5">

      {/* ── CS result card ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: TEAL_LIGHT,
          borderColor: 'rgba(13,148,136,0.35)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚡</span>
          <div>
            <h2 className="font-bold text-text-primary text-base leading-none">Critical Speed Result</h2>
            <p className="text-xs text-text-secondary mt-0.5">Linear distance–duration model</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: TEAL }}>
              {cs_pace}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">critical pace</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="CS Speed" value={`${cs_kmh} km/h`} sub="Critical Speed" />
          <StatCard label="D' (anaerobic buffer)" value={`${d_prime_m} m`} sub="Work capacity above CS" />
          <StatCard label="Model fit R²" value={r_squared.toFixed(2)} sub="Goodness of fit" />
          <StatCard label="Runs analysed" value={String(runs_analyzed)} sub="Over 6 months" />
        </div>
      </div>

      {/* ── Training zones table ───────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <h2 className="font-semibold text-text-primary">Training Zones</h2>
          <p className="text-xs text-text-secondary">Derived from CS = {cs_pace} · {cs_kmh} km/h</p>
        </div>
        <ul className="divide-y divide-border">
          {ZONES.map((zone) => (
            <li
              key={zone.id}
              className={`flex items-start gap-3 px-4 py-3 ${zone.bg}`}
            >
              <div
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: zone.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${zone.text}`}>{zone.label}</p>
                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${zone.bg} ${zone.border} ${zone.text}`}
                  >
                    {zone.range}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{zone.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Weekly speed trend chart ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="font-semibold text-text-primary mb-0.5">Weekly Avg Speed — Last 12 Weeks</h2>
        <p className="text-xs text-text-secondary mb-4">
          Orange dashed line = Critical Speed ({cs_kmh} km/h)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={weekly_speed}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.07}
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              width={36}
            />
            <ReferenceLine
              y={CS_KMH}
              stroke="#f97316"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `CS ${CS_KMH}`,
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#f97316',
                dy: -4,
              }}
            />
            <Tooltip content={<SpeedTooltip />} cursor={{ stroke: TEAL, strokeOpacity: 0.2 }} />
            <Line
              type="monotone"
              dataKey="avg_speed"
              stroke={TEAL}
              strokeWidth={2}
              dot={{ r: 3, fill: TEAL, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: TEAL, stroke: 'white', strokeWidth: 1.5 }}
              name="Avg Speed (km/h)"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: TEAL }} />
            <span className="text-xs text-text-secondary">Weekly avg speed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5 rounded"
              style={{ backgroundColor: '#f97316', borderTop: '2px dashed #f97316', height: 0 }}
            />
            <span className="text-xs text-text-secondary">Critical Speed</span>
          </div>
        </div>
      </div>

      {/* ── Distance vs Duration scatter chart ────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="font-semibold text-text-primary mb-0.5">Distance vs Duration</h2>
        <p className="text-xs text-text-secondary mb-4">
          Each dot = one run · teal line = CS regression (slope = {cs_kmh} km/h, intercept = D')
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.07}
            />
            <XAxis
              type="number"
              dataKey="dur"
              name="Duration"
              unit=" min"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              label={{
                value: 'Duration (min)',
                position: 'insideBottom',
                offset: -4,
                fontSize: 10,
                fill: 'currentColor',
              }}
            />
            <YAxis
              type="number"
              dataKey="dist"
              name="Distance"
              unit=" km"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              width={36}
              label={{
                value: 'Distance (km)',
                angle: -90,
                position: 'insideLeft',
                offset: 14,
                fontSize: 10,
                fill: 'currentColor',
              }}
            />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3', strokeOpacity: 0.2 }} />
            {/* Run dots */}
            <Scatter
              name="Runs"
              data={scatterRunDots}
              fill={TEAL_MID}
              stroke={TEAL}
              strokeWidth={1}
              r={4}
            />
            {/* Regression line rendered as a Scatter with line shape */}
            <Scatter
              name="CS Regression"
              data={regressionLine.map((p) => ({ dur: p.dur, dist: p.regDist }))}
              fill="none"
              stroke={TEAL}
              strokeWidth={2}
              line
              shape={() => null as unknown as React.ReactElement}
              legendType="line"
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: TEAL_MID, borderColor: TEAL }}
            />
            <span className="text-xs text-text-secondary">Individual run</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5" style={{ backgroundColor: TEAL }} />
            <span className="text-xs text-text-secondary">CS regression line</span>
          </div>
        </div>
      </div>

      {/* ── Science card ────────────────────────────────────────────────────────── */}
      <ScienceCard cs_pace={cs_pace} cs_kmh={cs_kmh} d_prime_m={d_prime_m} r_squared={r_squared} />

    </div>
  )
}

// ─── Science card ─────────────────────────────────────────────────────────────

function ScienceCard({
  cs_pace,
  cs_kmh,
  d_prime_m,
  r_squared,
}: {
  cs_pace: string
  cs_kmh: number
  d_prime_m: number
  r_squared: number
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">⚡</span>
        <h2 className="font-semibold text-text-primary">The Critical Speed Model</h2>
      </div>

      <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
        <p>
          <strong className="text-text-primary">Critical Speed (CS)</strong> is the highest running
          speed that can be maintained indefinitely using aerobic metabolism alone — the true
          aerobic–anaerobic boundary for running. Your CS is{' '}
          <strong style={{ color: TEAL }}>{cs_pace}</strong> ({cs_kmh} km/h).
        </p>
        <p>
          CS is derived from the linear relationship between <strong className="text-text-primary">
          distance and duration</strong> across multiple runs of varying intensity. When you plot
          distance (y) against duration (x), the slope of the best-fit line equals CS and the
          y-intercept equals D'. This model yielded an R² of{' '}
          <strong className="text-text-primary">{r_squared.toFixed(2)}</strong> — a strong fit.
        </p>
        <p>
          <strong className="text-text-primary">D' ({d_prime_m} m)</strong> represents your finite
          capacity to work <em>above</em> CS. Once D' is fully depleted you must slow below CS to
          recover it. Interval training and supramaximal efforts are the primary stimuli for
          expanding D'.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded-xl p-3 border bg-teal-950/20 border-teal-900/40">
          <p className="text-xs font-semibold text-teal-400 mb-1">CS vs. Lactate Threshold</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            CS corresponds closely to the <strong className="text-text-primary">maximal lactate
            steady state (MLSS)</strong> and is slightly higher than the traditional lactate
            threshold (LT1). Running at CS provokes a slow VO₂ rise that eventually reaches
            VO₂max — meaning it is genuinely unsustainable for very long efforts.
          </p>
        </div>
        <div className="rounded-xl p-3 border bg-surface-secondary/40 border-border">
          <p className="text-xs font-semibold text-text-primary mb-1">Key References</p>
          <ul className="space-y-1">
            {[
              'Jones A.M. et al. (2019). The maximal metabolic steady state. J Physiol.',
              'Poole D.C. et al. (2016). Critical power: an important fatigue threshold. Med Sci Sports Exerc.',
              'Vanhatalo A. et al. (2011). Influence of exercise modality on the power–duration relationship. Eur J Appl Physiol.',
            ].map((ref) => (
              <li key={ref} className="flex gap-2 text-xs text-text-secondary leading-relaxed">
                <span className="shrink-0 text-text-secondary/40">—</span>
                {ref}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 pt-4 border-t border-border text-xs text-text-secondary/60 leading-relaxed">
        Values are derived from mock training data for demonstration. Real CS calculation requires
        3–5 maximal effort trials at different distances. Consult a sports physiologist for
        clinically validated results.
      </p>
    </div>
  )
}
