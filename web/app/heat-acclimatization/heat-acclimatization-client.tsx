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
import type { HeatAcclimatizationData, AcclimatizationLevel } from './page'

// ─── Design tokens ────────────────────────────────────────────────────────────

const ORANGE = '#f97316'
const ORANGE_MUTED = '#fb923c'
const BLUE = '#3b82f6'
const BLUE_MUTED = '#60a5fa'
const NEUTRAL = '#6b7280'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPace(secsPerKm: number): string {
  if (!secsPerKm || secsPerKm <= 0) return '—'
  const m = Math.floor(secsPerKm / 60)
  const s = Math.round(secsPerKm % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function seasonColor(season: 'warm' | 'cool' | 'transitional'): string {
  if (season === 'warm') return ORANGE
  if (season === 'cool') return BLUE
  return NEUTRAL
}

function levelColor(level: AcclimatizationLevel): string {
  switch (level) {
    case 'None':     return '#6b7280'
    case 'Minimal':  return '#eab308'
    case 'Partial':  return '#f97316'
    case 'Moderate': return '#22c55e'
    case 'Full':     return '#14b8a6'
  }
}

function levelDescription(level: AcclimatizationLevel): string {
  switch (level) {
    case 'None':
      return 'No warm-weather running data yet. Summer training develops heat adaptation and boosts plasma volume.'
    case 'Minimal':
      return 'Early signs of heat exposure. Continue running in warm conditions to deepen adaptation.'
    case 'Partial':
      return 'Moderate heat exposure detected. HR is beginning to drop at the same workload in warm months.'
    case 'Moderate':
      return 'Clear heat adaptation present. Your heart works more efficiently in warm conditions than before.'
    case 'Full':
      return 'Strong heat acclimatization. You show the 3–8 bpm HR reduction at equivalent intensity predicted by Périard 2015.'
  }
}

function hrChangeInterpretation(hrDiff: number): { text: string; color: string } {
  if (hrDiff >= 5)
    return { text: 'Strong adaptation — HR clearly lower in warm months at similar paces.', color: '#14b8a6' }
  if (hrDiff >= 3)
    return { text: 'Moderate adaptation — warm-month HR is measurably reduced.', color: '#22c55e' }
  if (hrDiff >= 1)
    return { text: 'Mild adaptation — small HR reduction in warm months detected.', color: ORANGE_MUTED }
  if (hrDiff >= -1)
    return { text: 'No clear difference — similar HR efficiency across seasons.', color: NEUTRAL }
  return { text: 'HR higher in warm months — limited acclimatization so far.', color: '#ef4444' }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data: HeatAcclimatizationData
}

export function HeatAcclimatizationClient({ data }: Props) {
  const {
    monthlyEfficiency,
    recentSessions,
    warmAvgEfficiency,
    coolAvgEfficiency,
    warmAvgHR,
    coolAvgHR,
    hrDifference,
    warmSessionCount,
    acclimatizationLevel,
    estimatedHRReduction,
  } = data

  const levelCol = levelColor(acclimatizationLevel)
  const hrInterpretation = hrChangeInterpretation(hrDifference)

  // Only include months that have data for the bar chart
  const chartData = monthlyEfficiency.filter((m) => m.sessionCount > 0)

  // Efficiency domain
  const effValues = chartData.map((m) => m.efficiency)
  const effMin = effValues.length ? Math.min(...effValues) - 0.05 : 1.5
  const effMax = effValues.length ? Math.max(...effValues) + 0.05 : 3.0

  return (
    <div className="space-y-6">

      {/* ── Acclimatization status card ──────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: `color-mix(in srgb, ${levelCol} 8%, transparent)`,
          borderColor: `color-mix(in srgb, ${levelCol} 30%, transparent)`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
              Acclimatization Level
            </p>
            <p className="text-3xl font-bold mb-1" style={{ color: levelCol }}>
              {acclimatizationLevel}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md">
              {levelDescription(acclimatizationLevel)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold" style={{ color: ORANGE }}>
              {warmSessionCount}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Warm sessions</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: `color-mix(in srgb, ${levelCol} 20%, transparent)` }}>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: ORANGE }}>
              {warmAvgHR.toFixed(0)} bpm
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Warm avg HR</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: BLUE }}>
              {coolAvgHR.toFixed(0)} bpm
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Cool avg HR</p>
          </div>
          <div className="text-center">
            <p
              className="text-lg font-bold"
              style={{ color: estimatedHRReduction > 0 ? '#14b8a6' : NEUTRAL }}
            >
              {estimatedHRReduction > 0 ? `−${estimatedHRReduction} bpm` : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Est. HR reduction</p>
          </div>
        </div>
      </div>

      {/* ── Monthly HR efficiency bar chart ──────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Monthly HR Efficiency
        </h3>
        <p className="text-xs text-text-secondary mb-3 opacity-70">
          Efficiency = pace (s/km) ÷ avg HR. Higher bar = faster pace per heartbeat.
          Orange = warm months (Jun–Aug), blue = cool months (Nov–Feb).
        </p>

        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                  width={38}
                  domain={[effMin, effMax]}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null
                    const m = payload[0].payload as (typeof chartData)[0]
                    return (
                      <div style={tooltipStyle} className="px-3 py-2 space-y-0.5">
                        <p className="font-medium text-text-primary">{m.month}</p>
                        <p className="text-text-secondary">
                          Efficiency: <span className="font-medium">{m.efficiency.toFixed(3)}</span>
                        </p>
                        <p className="text-text-secondary">
                          Avg HR: {m.avgHR.toFixed(0)} bpm
                        </p>
                        <p className="text-text-secondary">
                          Avg pace: {fmtPace(m.avgPaceSecs)}/km
                        </p>
                        <p className="text-text-secondary">
                          Runs: {m.sessionCount}
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="efficiency" radius={[3, 3, 0, 0]}>
                  {chartData.map((m, i) => (
                    <Cell key={i} fill={seasonColor(m.season)} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: ORANGE }} />
                Warm (Jun–Aug)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: BLUE }} />
                Cool (Nov–Feb)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: NEUTRAL }} />
                Transitional
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-secondary py-10 text-center">
            Not enough monthly data to display chart.
          </p>
        )}
      </div>

      {/* ── Season comparison table ───────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Season Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Season</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Avg HR</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Efficiency</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">HR diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-surface-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: ORANGE }}>
                    <span>&#9728;</span>
                    Warm (Jun–Aug)
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-sm tabular-nums text-text-primary font-medium">
                  {warmAvgHR.toFixed(0)} bpm
                </td>
                <td className="px-3 py-3 text-right text-sm tabular-nums" style={{ color: ORANGE }}>
                  {warmAvgEfficiency.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-secondary">—</td>
              </tr>
              <tr className="hover:bg-surface-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: BLUE }}>
                    <span>&#10052;</span>
                    Cool (Nov–Feb)
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-sm tabular-nums text-text-primary font-medium">
                  {coolAvgHR.toFixed(0)} bpm
                </td>
                <td className="px-3 py-3 text-right text-sm tabular-nums" style={{ color: BLUE }}>
                  {coolAvgEfficiency.toFixed(3)}
                </td>
                <td
                  className="px-4 py-3 text-right text-sm tabular-nums font-medium"
                  style={{ color: hrInterpretation.color }}
                >
                  {hrDifference > 0 ? `+${hrDifference}` : hrDifference} bpm
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          className="px-4 py-3 border-t border-border text-xs leading-relaxed"
          style={{ color: hrInterpretation.color }}
        >
          {hrInterpretation.text}
        </div>
      </div>

      {/* ── Recent sessions list ─────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Recent Runs</h3>
        </div>
        <div className="divide-y divide-border">
          {recentSessions.map((s) => {
            const col = seasonColor(s.season)
            const icon = s.season === 'warm' ? '☀️' : s.season === 'cool' ? '❄️' : '🌤️'
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary/40 transition-colors"
              >
                <span className="text-lg leading-none w-7 text-center" aria-hidden="true">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{fmtDate(s.date)}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {fmtPace(s.paceSecs)}/km
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums" style={{ color: col }}>
                    {s.avgHR} bpm
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 capitalize">{s.season}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Heat training benefits card (Lorenzo 2010) ───────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: 'rgba(249,115,22,0.06)',
          borderColor: 'rgba(249,115,22,0.25)',
        }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: ORANGE_MUTED }}>
          Heat Training Benefits
        </h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Lorenzo et al. 2010 (J Appl Physiol) · 10-day heat training protocol
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          {[
            { value: '+4.5%', label: 'Plasma volume', sub: 'hemodilution & blood buffering' },
            { value: '+6.4%', label: 'VO2max', sub: 'even in temperate conditions' },
            { value: '3–8 bpm', label: 'HR reduction', sub: 'at same intensity (Périard 2015)' },
            { value: '10–14', label: 'Days needed', sub: '≥60 min/day in heat (Sawka 2011)' },
          ].map(({ value, label, sub }) => (
            <div
              key={label}
              className="rounded-xl border p-3 text-center"
              style={{
                background: 'rgba(249,115,22,0.08)',
                borderColor: 'rgba(249,115,22,0.2)',
              }}
            >
              <p className="text-xl font-bold" style={{ color: ORANGE_MUTED }}>
                {value}
              </p>
              <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{sub}</p>
            </div>
          ))}
        </div>

        <p
          className="text-sm font-semibold text-center py-2 px-4 rounded-lg"
          style={{
            background: 'rgba(249,115,22,0.12)',
            color: ORANGE_MUTED,
          }}
        >
          Summer training is free altitude training.
        </p>
      </div>

      {/* ── How to maximize acclimatization ─────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          How to Maximize Acclimatization
        </h3>
        <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
          <div className="flex gap-3">
            <span
              className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: ORANGE }}
            >
              1
            </span>
            <div>
              <p className="font-medium text-text-primary">10–14 consecutive days of heat exposure</p>
              <p className="mt-0.5">
                Sawka et al. 2011 (Med Sci Sports Exerc) recommends at least 60 minutes of exercise
                per session in hot conditions (≥30 °C) for 10–14 days to achieve full acclimatization.
                Plasma volume expansion begins within the first 2–3 sessions.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span
              className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: ORANGE }}
            >
              2
            </span>
            <div>
              <p className="font-medium text-text-primary">Run at moderate intensity in the heat</p>
              <p className="mt-0.5">
                Training at 50–70 % VO2max is sufficient. You do not need to race in heat — just
                accumulate time. Aim for the hottest part of the day when safe, or layer clothing to
                simulate heat stress indoors (passive heat maintenance).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span
              className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: ORANGE }}
            >
              3
            </span>
            <div>
              <p className="font-medium text-text-primary">Hydrate aggressively</p>
              <p className="mt-0.5">
                Plasma volume expansion requires adequate fluid intake. Aim for 500 ml of sodium-rich
                fluid 2 hours pre-run and replace all sweat losses post-run. Reduced sweat sodium
                concentration (a key acclimatization marker) manifests within 5 days.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span
              className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: ORANGE }}
            >
              4
            </span>
            <div>
              <p className="font-medium text-text-primary">Acclimatization decays in ~2–4 weeks</p>
              <p className="mt-0.5">
                The cardiovascular gains (lower HR, higher stroke volume) persist for about 2 weeks
                after returning to cool conditions. Sweat adaptations decay more slowly. Re-expose
                every 2–3 weeks during a cool training block to maintain benefits.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
