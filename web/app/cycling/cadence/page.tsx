'use client'

import Link from 'next/link'
import { ArrowLeft, Bike } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

// ─── Zone definitions ─────────────────────────────────────────────────────────

type Zone = 'low' | 'moderate' | 'optimal' | 'high'

const ZONES: Record<Zone, { label: string; color: string; tailwind: string; bg: string; desc: string }> = {
  low:      { label: 'Low',      color: '#f97316', tailwind: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', desc: 'High muscular strain, low efficiency. Increases knee torque significantly.' },
  moderate: { label: 'Moderate', color: '#eab308', tailwind: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'Approaching optimal. Reduced strain vs. low cadence but room to improve.' },
  optimal:  { label: 'Optimal',  color: '#22c55e', tailwind: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  desc: 'Peak metabolic efficiency per Faria et al. 2005. The sweet spot for power output vs. energy cost.' },
  high:     { label: 'High',     color: '#60a5fa', tailwind: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',   desc: 'Aerobic base strength. Elite cyclist range — demands strong cardiovascular fitness.' },
}

const ZONE_RANGES: Record<Zone, string> = {
  low:      '< 70 RPM',
  moderate: '70–84 RPM',
  optimal:  '85–100 RPM',
  high:     '> 100 RPM',
}

function classifyZone(rpm: number): Zone {
  if (rpm < 70) return 'low'
  if (rpm < 85) return 'moderate'
  if (rpm <= 100) return 'optimal'
  return 'high'
}

// ─── Mock data (25 sessions over 90 days) ─────────────────────────────────────

interface Session {
  id: number
  date: string      // ISO date string
  avgRpm: number
  minRpm: number
  maxRpm: number
  durationMin: number
  note?: string
}

// Anchor today to 2026-03-19 per project context
const TODAY = new Date('2026-03-19')
function daysAgo(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const SESSIONS: Session[] = [
  { id:  1, date: daysAgo(88), avgRpm:  72, minRpm: 58, maxRpm:  89, durationMin: 55  },
  { id:  2, date: daysAgo(85), avgRpm:  88, minRpm: 74, maxRpm: 104, durationMin: 75  },
  { id:  3, date: daysAgo(82), avgRpm:  65, minRpm: 52, maxRpm:  82, durationMin: 90, note: 'Hill climb' },
  { id:  4, date: daysAgo(79), avgRpm:  91, minRpm: 78, maxRpm: 108, durationMin: 60  },
  { id:  5, date: daysAgo(76), avgRpm:  86, minRpm: 70, maxRpm: 103, durationMin: 120 },
  { id:  6, date: daysAgo(73), avgRpm:  78, minRpm: 63, maxRpm:  94, durationMin: 45  },
  { id:  7, date: daysAgo(70), avgRpm:  93, minRpm: 82, maxRpm: 110, durationMin: 90  },
  { id:  8, date: daysAgo(67), avgRpm: 112, minRpm: 95, maxRpm: 128, durationMin: 50, note: 'Flat sprint' },
  { id:  9, date: daysAgo(64), avgRpm:  69, minRpm: 54, maxRpm:  85, durationMin: 150, note: 'Long mountain ride' },
  { id: 10, date: daysAgo(61), avgRpm:  87, minRpm: 73, maxRpm: 105, durationMin: 80  },
  { id: 11, date: daysAgo(57), avgRpm:  95, minRpm: 85, maxRpm: 112, durationMin: 70  },
  { id: 12, date: daysAgo(54), avgRpm:  82, minRpm: 68, maxRpm:  99, durationMin: 60  },
  { id: 13, date: daysAgo(51), avgRpm:  88, minRpm: 75, maxRpm: 106, durationMin: 100 },
  { id: 14, date: daysAgo(48), avgRpm:  71, minRpm: 59, maxRpm:  89, durationMin: 55  },
  { id: 15, date: daysAgo(44), avgRpm:  90, minRpm: 80, maxRpm: 109, durationMin: 75  },
  { id: 16, date: daysAgo(41), avgRpm: 104, minRpm: 88, maxRpm: 121, durationMin: 45, note: 'Criterium effort' },
  { id: 17, date: daysAgo(38), avgRpm:  84, minRpm: 70, maxRpm: 102, durationMin: 90  },
  { id: 18, date: daysAgo(35), avgRpm:  89, minRpm: 76, maxRpm: 107, durationMin: 65  },
  { id: 19, date: daysAgo(31), avgRpm:  68, minRpm: 55, maxRpm:  84, durationMin: 180, note: 'Gran Fondo' },
  { id: 20, date: daysAgo(28), avgRpm:  92, minRpm: 82, maxRpm: 111, durationMin: 60  },
  { id: 21, date: daysAgo(24), avgRpm:  86, minRpm: 72, maxRpm: 104, durationMin: 85  },
  { id: 22, date: daysAgo(20), avgRpm:  97, minRpm: 84, maxRpm: 115, durationMin: 70  },
  { id: 23, date: daysAgo(15), avgRpm:  85, minRpm: 71, maxRpm: 103, durationMin: 55  },
  { id: 24, date: daysAgo( 9), avgRpm:  91, minRpm: 79, maxRpm: 108, durationMin: 90  },
  { id: 25, date: daysAgo( 3), avgRpm:  88, minRpm: 75, maxRpm: 106, durationMin: 75  },
]

// ─── Derived stats ─────────────────────────────────────────────────────────────

const totalSessions = SESSIONS.length
const avgCadence = Math.round(SESSIONS.reduce((s, r) => s + r.avgRpm, 0) / totalSessions) // 87
const bestSession = Math.max(...SESSIONS.map((s) => s.avgRpm))
const lowestSession = Math.min(...SESSIONS.map((s) => s.avgRpm))

const sessionsByZone = SESSIONS.reduce<Record<Zone, number>>(
  (acc, s) => { acc[classifyZone(s.avgRpm)]++; return acc },
  { low: 0, moderate: 0, optimal: 0, high: 0 }
)
const optimalSessions = sessionsByZone.optimal
const pctOptimal = Math.round((optimalSessions / totalSessions) * 100)

// Streak: count from most recent session backwards while in optimal/high zone
const sortedDesc = [...SESSIONS].sort((a, b) => b.date.localeCompare(a.date))
let streak = 0
for (const s of sortedDesc) {
  const z = classifyZone(s.avgRpm)
  if (z === 'optimal' || z === 'high') streak++
  else break
}

// ─── Chart data ───────────────────────────────────────────────────────────────

const scatterData = SESSIONS.map((s) => ({
  date: new Date(s.date).getTime(),
  rpm: s.avgRpm,
  zone: classifyZone(s.avgRpm),
  label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  duration: s.durationMin,
}))

const zoneBarData: { zone: Zone; label: string; count: number; color: string }[] = (
  ['low', 'moderate', 'optimal', 'high'] as Zone[]
).map((z) => ({
  zone: z,
  label: ZONES[z].label,
  count: sessionsByZone[z],
  color: ZONES[z].color,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZoneBadge({ zone, size = 'sm' }: { zone: Zone; size?: 'sm' | 'md' }) {
  const z = ZONES[zone]
  const pad = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${z.bg} ${z.tailwind} ${pad}`}
    >
      {z.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CyclingCadencePage() {
  const avgZone = classifyZone(avgCadence)
  const recentEight = [...SESSIONS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/cycling"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to cycling"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Cycling Cadence</h1>
            <p className="text-sm text-text-secondary">RPM analysis · Apple Watch Ultra + power meter · 90 days</p>
          </div>
          <Bike className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero stat ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-green-500/20 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
              Average Cadence
            </p>
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-6xl font-extrabold text-green-400 tabular-nums leading-none">
                {avgCadence}
              </span>
              <span className="text-2xl text-text-secondary font-medium mb-1">RPM</span>
              <ZoneBadge zone={avgZone} size="md" />
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Averaged across {totalSessions} sessions over the last 90 days
            </p>
          </div>
          <div className="flex gap-4 sm:gap-6 sm:flex-col sm:text-right">
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{totalSessions}</p>
              <p className="text-xs text-text-secondary">Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400 tabular-nums">{streak}</p>
              <p className="text-xs text-text-secondary">Session streak<br className="hidden sm:block" /> in optimal/high</p>
            </div>
          </div>
        </div>

        {/* ── Zone explanation card ─────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">Cadence Zones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(ZONES) as [Zone, typeof ZONES[Zone]][]).map(([key, z]) => (
              <div key={key} className={`rounded-xl border p-3 ${z.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${z.tailwind}`}>{z.label}</span>
                  <span className="text-xs font-mono text-text-secondary">{ZONE_RANGES[key]}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{z.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 90-day scatter plot ───────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-1">90-Day Cadence History</h2>
          <p className="text-xs text-text-secondary mb-4">Each dot is one session, color-coded by zone</p>

          {/* Zone legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
            {(Object.entries(ZONES) as [Zone, typeof ZONES[Zone]][]).map(([key, z]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: z.color }} />
                {z.label}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={(v: number) =>
                  new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                tickCount={6}
              />
              <YAxis
                dataKey="rpm"
                type="number"
                domain={[55, 135]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={36}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(_v: unknown, _name: unknown, props: { payload?: { label?: string; rpm?: number; duration?: number; zone?: Zone } }) => {
                  const p = props.payload ?? {}
                  return [
                    `${p.rpm} RPM · ${fmtDuration(p.duration ?? 0)} · ${ZONES[p.zone ?? 'optimal'].label}`,
                    p.label ?? '',
                  ]
                }}
                labelFormatter={() => ''}
              />
              {/* Optimal zone reference bands */}
              <ReferenceLine
                y={85}
                stroke="#22c55e"
                strokeDasharray="5 3"
                strokeOpacity={0.6}
                label={{ value: '85 RPM', position: 'insideTopLeft', fontSize: 9, fill: '#22c55e' }}
              />
              <ReferenceLine
                y={100}
                stroke="#22c55e"
                strokeDasharray="5 3"
                strokeOpacity={0.6}
                label={{ value: '100 RPM', position: 'insideTopLeft', fontSize: 9, fill: '#22c55e' }}
              />
              <Scatter data={scatterData} isAnimationActive={false}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={ZONES[entry.zone].color} fillOpacity={0.85} r={6} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── Zone distribution bar chart ───────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-secondary">Zone Distribution</h2>
              <p className="text-xs text-text-secondary mt-0.5">Sessions per cadence zone</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">{pctOptimal}%</p>
              <p className="text-xs text-text-secondary">in Optimal zone</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={zoneBarData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={24}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v, 'Sessions']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {zoneBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-text-primary tabular-nums">{totalSessions}</p>
            <p className="text-xs text-text-secondary mt-0.5">Total Sessions</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-blue-400 tabular-nums">{bestSession}</p>
            <p className="text-xs text-text-secondary mt-0.5">Best Session RPM</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-400 tabular-nums">{lowestSession}</p>
            <p className="text-xs text-text-secondary mt-0.5">Lowest Session RPM</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-green-400 tabular-nums">{pctOptimal}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Sessions in Optimal</p>
          </div>
        </div>

        {/* ── Recent sessions table ─────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-secondary">Recent Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">Date</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Avg RPM</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary whitespace-nowrap">Min – Max</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Duration</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-text-secondary">Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentEight.map((s) => {
                  const zone = classifyZone(s.avgRpm)
                  return (
                    <tr key={s.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-5 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                        {fmtDate(s.date)}
                        {s.note && (
                          <span className="ml-1.5 text-text-secondary/50">{s.note}</span>
                        )}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right text-xs font-bold tabular-nums"
                        style={{ color: ZONES[zone].color }}
                      >
                        {s.avgRpm}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-text-secondary tabular-nums whitespace-nowrap">
                        {s.minRpm} – {s.maxRpm}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-text-secondary">
                        {fmtDuration(s.durationMin)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <ZoneBadge zone={zone} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Science card ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">The Science of Cycling Cadence</h2>
          <div className="space-y-4 text-xs text-text-secondary">

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-primary mb-0.5">85–100 RPM is metabolically optimal</p>
                <p className="leading-relaxed">
                  Faria et al., <em>Sports Medicine</em> 2005 showed that trained cyclists achieve
                  peak gross efficiency and minimum oxygen cost per unit of power output in the
                  85–100 RPM range. Both higher and lower cadences raise the O₂ cost of a given
                  wattage.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-primary mb-0.5">Higher cadence shifts load to the cardiovascular system</p>
                <p className="leading-relaxed">
                  Grinding a big gear at low RPM taxes the muscles heavily, accelerating peripheral
                  fatigue. Spinning at 90+ RPM distributes the workload aerobically, preserving
                  muscle glycogen and delaying fatigue on long efforts.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-primary mb-0.5">Low cadence increases metabolic cost and knee torque</p>
                <p className="leading-relaxed">
                  Böning 1984 and subsequent biomechanical research found that cadences below
                  60 RPM increase metabolic cost by 5–10% and substantially elevate peak knee
                  extensor torque — a risk factor for patellofemoral overuse injuries.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-primary mb-0.5">Tour de France benchmark</p>
                <p className="leading-relaxed">
                  Professional road cyclists average 90–100 RPM across a Grand Tour stage, with
                  sprinters exceeding 120 RPM in final surges. Amateur and recreational cyclists
                  typically self-select 60–75 RPM — well below the efficiency window.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
