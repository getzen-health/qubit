'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE = '#f97316'
const ORANGE_LIGHT = 'rgba(249,115,22,0.12)'
const ORANGE_MID = 'rgba(249,115,22,0.45)'

const DEFAULT_VO2MAX = 52

// ─── Zone config ──────────────────────────────────────────────────────────────

interface ZoneDef {
  id: string
  label: string
  pctLow: number   // % of MAS (lower bound, inclusive)
  pctHigh: number  // % of MAS (upper bound, exclusive; Infinity for last zone)
  description: string
  purpose: string
  color: string
  bg: string
  border: string
  text: string
}

const ZONE_DEFS: ZoneDef[] = [
  {
    id: 'recovery',
    label: 'Recovery',
    pctLow: 0,
    pctHigh: 60,
    description: 'Active recovery. Very easy effort — conversation is effortless.',
    purpose: 'Flushing lactate, promoting blood flow, accelerating muscle repair.',
    color: '#16a34a',
    bg: 'bg-green-950/30',
    border: 'border-green-900/40',
    text: 'text-green-400',
  },
  {
    id: 'easy',
    label: 'Easy / Aerobic Base',
    pctLow: 60,
    pctHigh: 75,
    description: 'Comfortable aerobic effort. Can hold full sentences easily.',
    purpose: 'Aerobic base building. Mitochondrial density, fat oxidation, capillarisation.',
    color: '#65a30d',
    bg: 'bg-lime-950/30',
    border: 'border-lime-900/40',
    text: 'text-lime-400',
  },
  {
    id: 'threshold',
    label: 'Threshold / Tempo',
    pctLow: 75,
    pctHigh: 87,
    description: 'Comfortably hard. Lactate threshold / marathon–half-marathon pace.',
    purpose: 'Raising lactate threshold, increasing VO₂ at threshold, race-pace fitness.',
    color: '#d97706',
    bg: 'bg-amber-950/30',
    border: 'border-amber-900/40',
    text: 'text-amber-400',
  },
  {
    id: 'vo2max',
    label: 'VO₂max Intervals',
    pctLow: 87,
    pctHigh: 105,
    description: 'Hard. At or near MAS — the velocity at VO₂max (vVO₂max).',
    purpose: 'Most potent VO₂max stimulus. Billat 6–10 × 1-min at 100% MAS with equal rest.',
    color: ORANGE,
    bg: 'bg-orange-950/30',
    border: 'border-orange-900/40',
    text: 'text-orange-400',
  },
  {
    id: 'speed',
    label: 'Speed / Supramaximal',
    pctLow: 105,
    pctHigh: 120,
    description: 'Very hard. Short, fast sprints well above MAS pace.',
    purpose: 'Dupont 15 s / 15 s protocol. Neuromuscular power, VO₂max via O₂ kinetics.',
    color: '#dc2626',
    bg: 'bg-red-950/30',
    border: 'border-red-900/40',
    text: 'text-red-400',
  },
  {
    id: 'neuro',
    label: 'Neuromuscular / Pure Speed',
    pctLow: 120,
    pctHigh: Infinity,
    description: 'Maximal sprinting. Very short reps (< 10 s), full recovery.',
    purpose: 'Stride mechanics, top-end speed, rate coding. Not aerobic development.',
    color: '#7c3aed',
    bg: 'bg-violet-950/30',
    border: 'border-violet-900/40',
    text: 'text-violet-400',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function masFromVo2max(vo2max: number): number {
  return vo2max / 3.5
}

function paceFromKmh(kmh: number): string {
  if (kmh <= 0) return '—'
  const minPerKm = 60 / kmh
  const min = Math.floor(minPerKm)
  const sec = Math.round((minPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')}/km`
}

function paceRangeLabel(pctLow: number, pctHigh: number, masKmh: number): string {
  if (pctLow === 0 && pctHigh === 60) {
    // Show as "slower than X"
    const top = masKmh * (pctHigh / 100)
    return `< ${top.toFixed(1)} km/h  ·  > ${paceFromKmh(top)}`
  }
  if (pctHigh === Infinity) {
    const lo = masKmh * (pctLow / 100)
    return `> ${lo.toFixed(1)} km/h  ·  < ${paceFromKmh(lo)}`
  }
  const loKmh = masKmh * (pctLow / 100)
  const hiKmh = masKmh * (pctHigh / 100)
  return `${loKmh.toFixed(1)}–${hiKmh.toFixed(1)} km/h  ·  ${paceFromKmh(hiKmh)}–${paceFromKmh(loKmh)}`
}

// ─── VO2max → MAS chart data ──────────────────────────────────────────────────

function buildChartData() {
  const points = []
  for (let vo2 = 30; vo2 <= 80; vo2 += 2) {
    points.push({
      vo2max: vo2,
      mas: Math.round((masFromVo2max(vo2)) * 100) / 100,
    })
  }
  return points
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean
  payload?: { value: number; payload: { vo2max: number; mas: number } }[]
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg p-3 shadow-lg text-sm min-w-[170px]">
      <p className="font-semibold text-text-primary mb-1.5">VO₂max {d.vo2max} ml/kg/min</p>
      <p className="text-text-secondary">
        MAS:{' '}
        <span className="font-medium tabular-nums" style={{ color: ORANGE }}>
          {d.mas.toFixed(1)} km/h
        </span>
      </p>
      <p className="text-text-secondary text-xs mt-0.5">{paceFromKmh(d.mas)}</p>
    </div>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = ORANGE,
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

// ─── VO2max example presets ────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Good', vo2max: 48 },
  { label: 'Fit', vo2max: 52 },
  { label: 'Very Fit', vo2max: 56 },
  { label: 'Athletic', vo2max: 60 },
]

// ─── Main component ────────────────────────────────────────────────────────────

export function MasTrainingClient() {
  const [vo2max, setVo2max] = useState(DEFAULT_VO2MAX)

  const mas = useMemo(() => masFromVo2max(vo2max), [vo2max])
  const masPace = useMemo(() => paceFromKmh(mas), [mas])
  const chartData = useMemo(() => buildChartData(), [])

  // Time to exhaustion at MAS averages 6 min (Billat & Koralsztein 1996)
  const tteMin = 6

  return (
    <div className="space-y-5">

      {/* ── Hero card ─────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: ORANGE_LIGHT, borderColor: 'rgba(249,115,22,0.3)' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <span className="text-3xl leading-none mt-0.5">🏃</span>
          <div className="flex-1">
            <h2 className="font-bold text-text-primary text-base leading-snug">
              Maximal Aerobic Speed (MAS)
            </h2>
            <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
              vVO₂max — the running speed at which you reach VO₂max. Interval training at
              100% MAS is the single most potent VO₂max stimulus available.
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="vo2max-slider" className="text-sm font-medium text-text-primary">
              VO₂max
            </label>
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ color: ORANGE }}
            >
              {vo2max} <span className="text-sm font-normal text-text-secondary">ml/kg/min</span>
            </span>
          </div>
          <input
            id="vo2max-slider"
            type="range"
            min={25}
            max={85}
            step={1}
            value={vo2max}
            onChange={(e) => setVo2max(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${ORANGE} 0%, ${ORANGE} ${((vo2max - 25) / (85 - 25)) * 100}%, rgba(249,115,22,0.2) ${((vo2max - 25) / (85 - 25)) * 100}%, rgba(249,115,22,0.2) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>25</span>
            <span>55</span>
            <span>85</span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2 flex-wrap mb-5">
          {PRESETS.map((p) => (
            <button
              key={p.vo2max}
              onClick={() => setVo2max(p.vo2max)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                vo2max === p.vo2max
                  ? 'border-orange-500 text-orange-400 bg-orange-950/50'
                  : 'border-border text-text-secondary hover:border-orange-700 hover:text-orange-400'
              }`}
            >
              {p.label} · {p.vo2max}
            </button>
          ))}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="VO₂max"
            value={`${vo2max}`}
            sub="ml/kg/min"
          />
          <StatCard
            label="MAS Speed"
            value={`${mas.toFixed(1)} km/h`}
            sub="vVO₂max"
          />
          <StatCard
            label="MAS Pace"
            value={masPace}
            sub="min/km at vVO₂max"
          />
          <StatCard
            label="Time at MAS"
            value={`~${tteMin} min`}
            sub="avg exhaustion (trained)"
          />
        </div>

        {/* Formula callout */}
        <div className="mt-4 rounded-xl p-3 border border-orange-900/40 bg-orange-950/20">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-orange-400">Formula: </span>
            MAS (km/h) = VO₂max ÷ 3.5 &nbsp;·&nbsp; based on ~3.5 ml/kg/min O₂ cost per km/h of running speed
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {vo2max} ÷ 3.5 ={' '}
            <strong style={{ color: ORANGE }}>{mas.toFixed(2)} km/h</strong>
            {' '}→ pace <strong style={{ color: ORANGE }}>{masPace}</strong>
          </p>
        </div>
      </div>

      {/* ── Zone table ────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <h2 className="font-semibold text-text-primary">MAS Training Zones</h2>
          <p className="text-xs text-text-secondary">
            Personalised pace ranges · MAS = {mas.toFixed(1)} km/h · {masPace}
          </p>
        </div>
        <ul className="divide-y divide-border">
          {ZONE_DEFS.map((zone) => {
            const pctLabel =
              zone.pctHigh === Infinity
                ? `> ${zone.pctLow}% MAS`
                : `${zone.pctLow}–${zone.pctHigh}% MAS`
            const paceRange = paceRangeLabel(zone.pctLow, zone.pctHigh, mas)

            return (
              <li key={zone.id} className={`px-4 py-3.5 ${zone.bg}`}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                      <p className={`text-sm font-semibold ${zone.text}`}>{zone.label}</p>
                      <span
                        className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${zone.bg} ${zone.border} ${zone.text}`}
                      >
                        {pctLabel}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-text-primary mb-1">{paceRange}</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{zone.description}</p>
                    <p className="text-xs text-text-secondary/70 leading-relaxed mt-0.5 italic">{zone.purpose}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Interval protocols ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="font-semibold text-text-primary mb-0.5">Optimal Interval Protocols</h2>
        <p className="text-xs text-text-secondary mb-4">
          Evidence-based sessions derived from your MAS = {mas.toFixed(1)} km/h ({masPace})
        </p>

        <div className="space-y-3">
          {/* Billat classic */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(249,115,22,0.35)', background: ORANGE_LIGHT }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⏱️</span>
              <div>
                <p className="text-sm font-semibold text-orange-400">Billat 100% MAS Protocol</p>
                <p className="text-xs text-text-secondary">Billat et al. 2001 · Eur J Appl Physiol</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums" style={{ color: ORANGE }}>6–10</p>
                <p className="text-xs text-text-secondary">reps</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums" style={{ color: ORANGE }}>1:00</p>
                <p className="text-xs text-text-secondary">work (min)</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums" style={{ color: ORANGE }}>1:00</p>
                <p className="text-xs text-text-secondary">rest (min)</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums" style={{ color: ORANGE }}>100%</p>
                <p className="text-xs text-text-secondary">MAS intensity</p>
              </div>
            </div>
            <div className="rounded-lg bg-surface px-3 py-2">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-orange-400">Target pace: </span>
                <span className="font-mono">{masPace}</span>
                {' '}({mas.toFixed(1)} km/h) &nbsp;·&nbsp; Distance per rep:{' '}
                <span className="font-mono">{Math.round(mas * 1000 / 60)} m</span>
              </p>
            </div>
            <p className="text-xs text-text-secondary/70 mt-2 leading-relaxed">
              The most potent stimulus for VO₂max adaptation. Time at or near VO₂max per session:
              6–10 minutes. Start with 6 reps; progress to 10 over 4–6 weeks.
            </p>
          </div>

          {/* Dupont 15/15 */}
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-sm font-semibold text-red-400">Dupont 15 s / 15 s Protocol</p>
                <p className="text-xs text-text-secondary">Dupont et al. 2002 · Med Sci Sports Exerc</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums text-red-400">15 s</p>
                <p className="text-xs text-text-secondary">work</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums text-red-400">15 s</p>
                <p className="text-xs text-text-secondary">passive rest</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums text-red-400">120%</p>
                <p className="text-xs text-text-secondary">MAS intensity</p>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums text-red-400">~18</p>
                <p className="text-xs text-text-secondary">min total</p>
              </div>
            </div>
            <div className="rounded-lg bg-surface px-3 py-2">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-red-400">Target pace (120% MAS): </span>
                <span className="font-mono">{paceFromKmh(mas * 1.2)}</span>
                {' '}({(mas * 1.2).toFixed(1)} km/h) &nbsp;·&nbsp; Distance per rep:{' '}
                <span className="font-mono">{Math.round(mas * 1.2 * 1000 / 240)} m</span>
              </p>
            </div>
            <p className="text-xs text-text-secondary/70 mt-2 leading-relaxed">
              Tabata-type supra-maximal protocol. Short rest keeps O₂ consumption elevated across
              reps, producing superior VO₂max gains versus continuous running. Greatest VO₂max
              improvement in Dupont 2002 study.
            </p>
          </div>

          {/* Easy aerobic reference */}
          <div className="rounded-xl border border-lime-900/40 bg-lime-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌱</span>
              <div>
                <p className="text-sm font-semibold text-lime-400">Easy Long Run</p>
                <p className="text-xs text-text-secondary">Aerobic base · 65–70% MAS</p>
              </div>
            </div>
            <div className="rounded-lg bg-surface px-3 py-2">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-lime-400">Target pace: </span>
                <span className="font-mono">{paceFromKmh(mas * 0.65)}–{paceFromKmh(mas * 0.70)}</span>
                {' '}({(mas * 0.65).toFixed(1)}–{(mas * 0.70).toFixed(1)} km/h)
              </p>
            </div>
            <p className="text-xs text-text-secondary/70 mt-2 leading-relaxed">
              80% of weekly volume should be here (polarised model). Builds mitochondrial density,
              fat oxidation, and capillarisation without meaningful fatigue accumulation.
            </p>
          </div>
        </div>
      </div>

      {/* ── VO2max → MAS chart ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="font-semibold text-text-primary mb-0.5">VO₂max → MAS Linear Relationship</h2>
        <p className="text-xs text-text-secondary mb-4">
          MAS = VO₂max ÷ 3.5 · Orange line = your current VO₂max ({vo2max} → {mas.toFixed(1)} km/h)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.07}
              vertical={false}
            />
            <XAxis
              dataKey="vo2max"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'VO₂max (ml/kg/min)',
                position: 'insideBottom',
                offset: -2,
                fontSize: 10,
                fill: 'currentColor',
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              domain={[8, 24]}
              width={36}
              tickFormatter={(v: number) => `${v}`}
              label={{
                value: 'MAS (km/h)',
                angle: -90,
                position: 'insideLeft',
                offset: 14,
                fontSize: 10,
                fill: 'currentColor',
              }}
            />
            <ReferenceLine
              x={vo2max}
              stroke={ORANGE}
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `${vo2max} → ${mas.toFixed(1)} km/h`,
                position: 'insideTopRight',
                fontSize: 9,
                fill: ORANGE,
                dy: -4,
              }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: ORANGE, strokeOpacity: 0.2 }} />
            <Line
              type="linear"
              dataKey="mas"
              stroke={ORANGE}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: ORANGE, stroke: 'white', strokeWidth: 1.5 }}
              name="MAS (km/h)"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Example snapshots */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map((p) => {
            const pMas = masFromVo2max(p.vo2max)
            const isActive = vo2max === p.vo2max
            return (
              <button
                key={p.vo2max}
                onClick={() => setVo2max(p.vo2max)}
                className={`rounded-xl border p-2.5 text-center transition-all ${
                  isActive
                    ? 'border-orange-500 bg-orange-950/40'
                    : 'border-border bg-surface-secondary/30 hover:border-orange-700'
                }`}
              >
                <p className="text-xs text-text-secondary mb-0.5">{p.label} · VO₂max {p.vo2max}</p>
                <p
                  className="text-base font-bold tabular-nums leading-none"
                  style={{ color: isActive ? ORANGE : 'var(--color-text-primary)' }}
                >
                  {pMas.toFixed(1)} km/h
                </p>
                <p className="text-xs text-text-secondary mt-0.5 font-mono">{paceFromKmh(pMas)}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🔬</span>
          <h2 className="font-semibold text-text-primary">The Science of MAS Training</h2>
        </div>

        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Maximal Aerobic Speed (MAS)</strong> — also called
            vVO₂max — is the minimum running speed at which VO₂max is elicited. It ties an athlete's
            aerobic ceiling (VO₂max) to a directly trainable, measurable running pace, making it the
            ideal anchor for structuring all training zones.
          </p>
          <p>
            At your current VO₂max of{' '}
            <strong style={{ color: ORANGE }}>{vo2max} ml/kg/min</strong>, your MAS is{' '}
            <strong style={{ color: ORANGE }}>{mas.toFixed(1)} km/h</strong> ({masPace}).
            Trained runners can typically sustain MAS pace for approximately{' '}
            <strong className="text-text-primary">5–8 minutes</strong> before exhaustion
            (Billat & Koralsztein 1996).
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="rounded-xl p-3 border border-orange-900/40 bg-orange-950/20">
            <p className="text-xs font-semibold text-orange-400 mb-1">Why intervals at 100% MAS?</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Running at 100% MAS elicits VO₂max within 2–3 minutes. Using short work intervals
              (1 min on, 1 min off) allows repeated VO₂max stimuli per session. Billat et al. 2001
              showed that 6–10 × 1-min at MAS with equal recovery produced superior VO₂max
              adaptations compared to continuous threshold running in trained athletes.
            </p>
          </div>

          <div className="rounded-xl p-3 border border-red-900/40 bg-red-950/20">
            <p className="text-xs font-semibold text-red-400 mb-1">Dupont 15 s / 15 s — why supra-MAS works</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Running at 120% MAS for just 15 seconds, with 15 seconds passive recovery, keeps VO₂
              elevated between reps via residual O₂ kinetics. Dupont et al. 2002 (Med Sci Sports
              Exerc) demonstrated this protocol produced the <em>greatest</em> VO₂max improvement
              in a head-to-head comparison — even beating the Billat protocol at 100% MAS.
            </p>
          </div>

          <div className="rounded-xl p-3 border border-border bg-surface-secondary/30">
            <p className="text-xs font-semibold text-text-primary mb-1">Key References</p>
            <ul className="space-y-1.5">
              {[
                'Billat V.L. & Koralsztein J.P. (1996). Significance of the velocity at VO₂max. Int J Sports Med, 17(7), 495–502.',
                'Billat V.L. et al. (2001). Interval training at VO₂max: effects on aerobic performance and overtraining markers. Med Sci Sports Exerc, 31(1), 156–163.',
                'Dupont G. et al. (2002). Faster oxygen uptake kinetics with intermittent vs continuous exercise. Int J Sports Med, 23, 1–7.',
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
          MAS calculated using the standard formula (VO₂max ÷ 3.5) based on ~3.5 ml/kg/min O₂
          cost per km/h. Individual economy varies ±5–10%. For a precision estimate, perform a
          direct MAS field test (e.g., 6-minute maximal time trial). Consult a sports physiologist
          before starting high-intensity interval training.
        </p>
      </div>

    </div>
  )
}
