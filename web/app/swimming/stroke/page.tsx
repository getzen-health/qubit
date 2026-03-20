'use client'

import Link from 'next/link'
import { ArrowLeft, Waves } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Scatter,
  ComposedChart,
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type SwolfLevel = 'elite' | 'competitive' | 'recreational' | 'developing'

interface SwimSession {
  date: string          // display date e.g. "Jan 3"
  isoDate: string       // for sorting
  distance: number      // metres
  totalStrokes: number  // across all lengths
  durationSec: number   // total swim time in seconds
  lengths: number       // number of lengths (25m pool)
  swolf: number         // SWOLF score
  dps: number           // distance per stroke (m)
  level: SwolfLevel
}

// ─── Level helpers ────────────────────────────────────────────────────────────

const LEVEL_META: Record<SwolfLevel, { label: string; color: string; tailwind: string; badge: string; range: string; descriptor: string }> = {
  elite:        { label: 'Elite',        color: '#60a5fa', tailwind: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   range: '< 38',  descriptor: 'World-class efficiency — near-maximal distance per stroke at race pace.' },
  competitive:  { label: 'Competitive',  color: '#34d399', tailwind: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', range: '38–49', descriptor: 'Club & masters competitor level. Strong technique and aerobic base.' },
  recreational: { label: 'Recreational', color: '#fbbf24', tailwind: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',  range: '50–61', descriptor: 'Fit fitness swimmer. Improving stroke mechanics yields rapid gains.' },
  developing:   { label: 'Developing',   color: '#fb923c', tailwind: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', range: '62+',   descriptor: 'Building foundational technique. Prioritise stroke count reduction.' },
}

function classifySwolf(swolf: number): SwolfLevel {
  if (swolf < 38) return 'elite'
  if (swolf < 50) return 'competitive'
  if (swolf < 62) return 'recreational'
  return 'developing'
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// 18 sessions over 90 days, SWOLF trending 58→48 (improvement arc)
// 25m pool: lengths = distance / 25
// strokes per length ≈ SWOLF - (durationSec / lengths)   =>  totalStrokes = strokesPerLength * lengths
// We derive totalStrokes from SWOLF and session params.

function buildSession(
  isoDate: string,
  distanceM: number,
  durationMin: number,
  swolf: number,
): SwimSession {
  const lengths = distanceM / 25
  const durationSec = durationMin * 60
  const secsPerLength = durationSec / lengths
  const strokesPerLength = swolf - secsPerLength
  const totalStrokes = Math.round(strokesPerLength * lengths)
  const dps = +(distanceM / totalStrokes).toFixed(2)
  const d = new Date(isoDate)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { date, isoDate, distance: distanceM, totalStrokes, durationSec, lengths, swolf, dps, level: classifySwolf(swolf) }
}

const SESSIONS: SwimSession[] = [
  buildSession('2025-12-19', 1000, 28, 62),
  buildSession('2025-12-23', 1200, 32, 60),
  buildSession('2025-12-27', 1500, 38, 59),
  buildSession('2026-01-02', 1000, 26, 58),
  buildSession('2026-01-06', 1800, 44, 57),
  buildSession('2026-01-10', 1500, 37, 56),
  buildSession('2026-01-15', 2000, 47, 55),
  buildSession('2026-01-20', 1200, 28, 54),
  buildSession('2026-01-25', 2500, 57, 53),
  buildSession('2026-01-30', 2000, 46, 52),
  buildSession('2026-02-04', 2500, 56, 51),
  buildSession('2026-02-09', 1500, 33, 50),
  buildSession('2026-02-14', 3000, 64, 50),
  buildSession('2026-02-19', 2000, 43, 49),
  buildSession('2026-02-24', 3500, 73, 49),
  buildSession('2026-03-01', 2500, 52, 48),
  buildSession('2026-03-08', 3000, 62, 48),
  buildSession('2026-03-15', 3500, 72, 48),
]

// ─── Chart tooltip style ──────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: SwolfLevel }) {
  const meta = LEVEL_META[level]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.badge}`}>
      {meta.label}
    </span>
  )
}

// Custom dot for SWOLF history — coloured by level
function SwolfDot(props: { cx?: number; cy?: number; payload?: SwimSession }) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null
  const color = LEVEL_META[payload.level].color
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--color-surface, #1a1a1a)" strokeWidth={1.5} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrokeEfficiencyPage() {
  const latest = SESSIONS[SESSIONS.length - 1]
  const latestLevel = LEVEL_META[latest.level]

  // Stats row
  const avgSwolf = +(SESSIONS.reduce((s, r) => s + r.swolf, 0) / SESSIONS.length).toFixed(1)
  const bestSwolf = Math.min(...SESSIONS.map((s) => s.swolf))
  const avgDps = +(SESSIONS.reduce((s, r) => s + r.dps, 0) / SESSIONS.length).toFixed(2)

  // SWOLF history chart data
  const swolfHistory = SESSIONS.map((s) => ({ ...s }))

  // DPS bar chart data
  const dpsData = SESSIONS.map((s) => ({
    date: s.date,
    dps: s.dps,
    aboveTarget: s.dps >= 1.5,
  }))

  // Recent 8 sessions (reversed for newest-first in table)
  const recentSessions = [...SESSIONS].reverse().slice(0, 8)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/swimming"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to swimming"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Stroke Efficiency</h1>
            <p className="text-sm text-text-secondary">SWOLF score analysis · Last 90 days</p>
          </div>
          <Waves className="w-5 h-5 text-cyan-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── 1. Hero stat ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-6 flex items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">Latest SWOLF</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-6xl font-black tabular-nums" style={{ color: latestLevel.color }}>
                {latest.swolf.toFixed(1)}
              </span>
              <div className="pb-1.5 space-y-1">
                <LevelBadge level={latest.level} />
                <p className="text-xs text-text-secondary">{latest.date}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary max-w-xs leading-snug">
              {latestLevel.descriptor}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 shrink-0"
            style={{ borderColor: latestLevel.color + '60', backgroundColor: latestLevel.color + '15' }}>
            <Waves className="w-8 h-8 mb-0.5" style={{ color: latestLevel.color }} />
            <span className="text-xs font-semibold" style={{ color: latestLevel.color }}>SWOLF</span>
          </div>
        </div>

        {/* ── 2. SWOLF history chart ────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">SWOLF History — 90 Days</h3>
          <p className="text-xs text-text-secondary/60 mb-3">Lower is better. Points coloured by efficiency level.</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={swolfHistory} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                domain={[35, 70]}
                width={32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => {
                  if (name === 'swolf') return [`${v.toFixed(1)}`, 'SWOLF']
                  return [v, name]
                }}
                labelFormatter={(label) => `Session: ${label}`}
              />
              {/* Reference lines for thresholds */}
              <ReferenceLine
                y={50}
                stroke="rgba(251,191,36,0.45)"
                strokeDasharray="5 3"
                label={{ value: 'Recreational 50', position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,191,36,0.7)' }}
              />
              <ReferenceLine
                y={38}
                stroke="rgba(96,165,250,0.45)"
                strokeDasharray="5 3"
                label={{ value: 'Elite 38', position: 'insideTopRight', fontSize: 9, fill: 'rgba(96,165,250,0.7)' }}
              />
              <Line
                type="monotone"
                dataKey="swolf"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={<SwolfDot />}
                activeDot={{ r: 6, fill: '#22d3ee' }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {(Object.entries(LEVEL_META) as [SwolfLevel, typeof LEVEL_META[SwolfLevel]][]).map(([key, meta]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: meta.color }} />
                {meta.label} ({meta.range})
              </span>
            ))}
          </div>
        </div>

        {/* ── 3. Distance Per Stroke chart ──────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Distance Per Stroke (m/stroke)</h3>
          <p className="text-xs text-text-secondary/60 mb-3">
            Target: <span className="text-cyan-400 font-semibold">≥ 1.5 m/stroke</span> — highlighted bars meet target.
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={dpsData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                domain={[0, 2.2]}
                width={32}
                tickFormatter={(v) => `${v.toFixed(1)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(2)} m/stroke`, 'DPS']}
              />
              <ReferenceLine
                y={1.5}
                stroke="rgba(34,211,238,0.5)"
                strokeDasharray="5 3"
                label={{ value: 'Target 1.5m', position: 'insideTopRight', fontSize: 9, fill: 'rgba(34,211,238,0.7)' }}
              />
              <Bar dataKey="dps" radius={[3, 3, 0, 0]}>
                {dpsData.map((entry, i) => (
                  <Cell key={i} fill={entry.aboveTarget ? '#22d3ee' : '#0e7490'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 4. Stats row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400 tabular-nums">{avgSwolf}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg SWOLF</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{bestSwolf}</p>
            <p className="text-xs text-text-secondary mt-0.5">Best SWOLF</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-teal-400 tabular-nums">{avgDps}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg DPS (m)</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-sky-400 tabular-nums">{SESSIONS.length}</p>
            <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
          </div>
        </div>

        {/* ── 5. SWOLF level guide ──────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium text-text-primary">SWOLF Level Guide</h3>
          <div className="space-y-2">
            {(Object.entries(LEVEL_META) as [SwolfLevel, typeof LEVEL_META[SwolfLevel]][]).map(([key, meta]) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: meta.color + '30', backgroundColor: meta.color + '08' }}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
                  style={{ backgroundColor: meta.color + '20', color: meta.color }}
                >
                  {meta.range.replace('< ', '').replace('62+', '62+')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-xs text-text-secondary font-mono">SWOLF {meta.range}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-snug">{meta.descriptor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6. Recent sessions table ──────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-text-secondary">Recent Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Date</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Distance</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Strokes</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">SWOLF</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">DPS</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentSessions.map((s, i) => {
                  const meta = LEVEL_META[s.level]
                  return (
                    <tr key={i} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">{s.date}</td>
                      <td className="px-3 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                        {s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${s.distance} m`}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                        {s.totalStrokes.toLocaleString()}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right text-xs font-bold tabular-nums"
                        style={{ color: meta.color }}
                      >
                        {s.swolf.toFixed(1)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                        {s.dps.toFixed(2)} m
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <LevelBadge level={s.level} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 7. Science card ───────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4 space-y-4">
          <h3 className="text-sm font-medium text-text-primary">The Science Behind SWOLF</h3>
          <div className="space-y-3">
            {[
              {
                title: 'SWOLF formula',
                citation: 'Costill et al. 1985',
                body: 'Strokes per length + seconds per length = SWOLF. Validated as a reliable proxy for swimming economy — lower scores indicate more distance covered per unit of energy expended.',
              },
              {
                title: 'Technique impact',
                citation: 'Chatard 1990',
                body: 'Reducing 2–3 strokes per length predicts a ~5% pace improvement. Stroke count reduction is the highest-leverage technique change available to recreational swimmers.',
              },
              {
                title: 'Two levers',
                citation: 'Biomechanics principle',
                body: 'Velocity = DPS (distance per stroke) × stroke rate. Elite swimmers achieve speed by maximising DPS first, then layering in stroke rate. Optimise DPS before increasing tempo.',
              },
              {
                title: 'Apple Watch data',
                citation: 'watchOS pool swimming',
                body: 'Stroke count is recorded automatically during pool swimming workouts on Apple Watch Series 2 or later. Lap detection and stroke recognition use the accelerometer.',
              },
            ].map(({ title, citation, body }) => (
              <div key={title} className="border-l-2 border-cyan-500/40 pl-3">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-text-primary">{title}</span>
                  <span className="text-xs text-cyan-500/70 font-mono">{citation}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary/50 pt-1 border-t border-border">
            Data shown uses mock sessions for demonstration. Sync your Apple Watch pool swims via Apple Health to see real SWOLF trends.
          </p>
        </div>

      </main>
    </div>
  )
}
