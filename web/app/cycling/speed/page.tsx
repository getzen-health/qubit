'use client'

import Link from 'next/link'
import { ArrowLeft, Gauge, TrendingUp, ArrowRight } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  ReferenceDot,
} from 'recharts'

// ─── Zone definitions ─────────────────────────────────────────────────────────

type Zone = 'recovery' | 'endurance' | 'tempo' | 'race'

interface ZoneConfig {
  label: string
  color: string
  tailwind: string
  bg: string
  border: string
  range: string
  description: string
  context: string
}

const ZONES: Record<Zone, ZoneConfig> = {
  recovery: {
    label: 'Recovery',
    color: '#22c55e',
    tailwind: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    range: '< 20 km/h',
    description: 'Easy spin, commuter cycling',
    context: 'Active recovery, low effort. Heart rate zone 1–2. Good for warm-up and cool-down laps.',
  },
  endurance: {
    label: 'Endurance',
    color: '#3b82f6',
    tailwind: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    range: '20–28 km/h',
    description: 'Recreational group rides, base training',
    context: 'Aerobic endurance base. Sustainable for hours. The bread-and-butter of recreational road cycling.',
  },
  tempo: {
    label: 'Tempo',
    color: '#f97316',
    tailwind: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    range: '28–35 km/h',
    description: 'Competitive amateur, Cat 4/5 crits',
    context: 'Comfortably hard — you can speak in short sentences. Club ride pace. Requires consistent fitness.',
  },
  race: {
    label: 'Race Pace',
    color: '#ef4444',
    tailwind: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    range: '> 35 km/h',
    description: 'Cat 1–3, club TT, pro peloton',
    context: 'Elite amateur and professional territory. Requires exceptional aerobic capacity and aerodynamics.',
  },
}

function classifyZone(kmh: number): Zone {
  if (kmh < 20) return 'recovery'
  if (kmh < 28) return 'endurance'
  if (kmh <= 35) return 'tempo'
  return 'race'
}

// ─── Mock data (20 sessions over 90 days) ─────────────────────────────────────

interface Session {
  id: number
  date: string
  avgSpeed: number   // km/h
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

// Mostly endurance (22–26 km/h), a few tempo (29–33 km/h), 2–3 recovery (16–19 km/h)
// Slight upward trend: early sessions cluster lower, recent ones slightly higher
const SESSIONS: Session[] = [
  { id:  1, date: daysAgo(88), avgSpeed: 18.2, durationMin: 40,  note: 'Recovery spin' },
  { id:  2, date: daysAgo(84), avgSpeed: 22.4, durationMin: 65  },
  { id:  3, date: daysAgo(81), avgSpeed: 23.1, durationMin: 75  },
  { id:  4, date: daysAgo(77), avgSpeed: 16.8, durationMin: 35,  note: 'Easy recovery' },
  { id:  5, date: daysAgo(74), avgSpeed: 24.0, durationMin: 80  },
  { id:  6, date: daysAgo(70), avgSpeed: 22.8, durationMin: 60  },
  { id:  7, date: daysAgo(66), avgSpeed: 29.3, durationMin: 55,  note: 'Tempo effort' },
  { id:  8, date: daysAgo(62), avgSpeed: 23.6, durationMin: 90  },
  { id:  9, date: daysAgo(59), avgSpeed: 25.2, durationMin: 70  },
  { id: 10, date: daysAgo(55), avgSpeed: 19.4, durationMin: 45,  note: 'Easy spin' },
  { id: 11, date: daysAgo(51), avgSpeed: 24.7, durationMin: 85  },
  { id: 12, date: daysAgo(47), avgSpeed: 31.5, durationMin: 50,  note: 'Crit training' },
  { id: 13, date: daysAgo(44), avgSpeed: 25.8, durationMin: 95  },
  { id: 14, date: daysAgo(40), avgSpeed: 26.3, durationMin: 80  },
  { id: 15, date: daysAgo(36), avgSpeed: 25.5, durationMin: 100 },
  { id: 16, date: daysAgo(32), avgSpeed: 32.8, durationMin: 60,  note: 'Threshold ride' },
  { id: 17, date: daysAgo(27), avgSpeed: 26.9, durationMin: 75  },
  { id: 18, date: daysAgo(21), avgSpeed: 27.1, durationMin: 90  },
  { id: 19, date: daysAgo(12), avgSpeed: 27.4, durationMin: 80  },
  { id: 20, date: daysAgo( 4), avgSpeed: 27.8, durationMin: 70  },
]

// ─── Derived stats ─────────────────────────────────────────────────────────────

const totalSessions = SESSIONS.length
const latestSpeed = SESSIONS[SESSIONS.length - 1].avgSpeed
const latestZone = classifyZone(latestSpeed)
const avg90d = +(SESSIONS.reduce((s, r) => s + r.avgSpeed, 0) / totalSessions).toFixed(1)
const peakSpeed = Math.max(...SESSIONS.map((s) => s.avgSpeed))

// Trend: compare first 5 vs last 5 sessions
const firstFiveAvg = SESSIONS.slice(0, 5).reduce((s, r) => s + r.avgSpeed, 0) / 5
const lastFiveAvg = SESSIONS.slice(-5).reduce((s, r) => s + r.avgSpeed, 0) / 5
const trend = +(lastFiveAvg - firstFiveAvg).toFixed(1)

const sessionsByZone = SESSIONS.reduce<Record<Zone, number>>(
  (acc, s) => { acc[classifyZone(s.avgSpeed)]++; return acc },
  { recovery: 0, endurance: 0, tempo: 0, race: 0 }
)

// ─── Chart data ───────────────────────────────────────────────────────────────

const barData = SESSIONS.map((s) => ({
  date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  speed: s.avgSpeed,
  zone: classifyZone(s.avgSpeed),
  color: ZONES[classifyZone(s.avgSpeed)].color,
  duration: s.durationMin,
  note: s.note,
}))

const avgLine = avg90d

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZoneBadge({ zone, size = 'sm' }: { zone: Zone; size?: 'sm' | 'md' }) {
  const z = ZONES[zone]
  const pad = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${z.bg} ${z.border} ${z.tailwind} ${pad}`}
    >
      {z.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CyclingSpeedPage() {
  const zoneOrder: Zone[] = ['recovery', 'endurance', 'tempo', 'race']

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
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
            <h1 className="text-xl font-bold text-text-primary">Cycling Speed</h1>
            <p className="text-sm text-text-secondary">
              HKQuantityType(.cyclingSpeed) · iOS 17+ · Outdoor cycling · 90 days
            </p>
          </div>
          <Gauge className="w-5 h-5 text-blue-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero summary card ── */}
        <div className="bg-surface rounded-2xl border border-blue-500/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">

            {/* Primary stat */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
                Latest Avg Speed
              </p>
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-6xl font-extrabold text-blue-400 tabular-nums leading-none">
                  {latestSpeed.toFixed(1)}
                </span>
                <span className="text-2xl text-text-secondary font-medium mb-1">km/h</span>
                <ZoneBadge zone={latestZone} size="md" />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Most recent session · GPS-tracked outdoor cycling
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 sm:gap-5 sm:flex-col sm:text-right shrink-0">
              <div>
                <p className="text-xl font-bold text-text-primary tabular-nums">{avg90d}</p>
                <p className="text-xs text-text-secondary">90d avg km/h</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-400 tabular-nums">{peakSpeed.toFixed(1)}</p>
                <p className="text-xs text-text-secondary">Peak speed</p>
              </div>
              <div>
                <p className={`text-xl font-bold tabular-nums ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend >= 0 ? '+' : ''}{trend}
                </p>
                <p className="text-xs text-text-secondary">Trend km/h</p>
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary tabular-nums">{totalSessions}</p>
                <p className="text-xs text-text-secondary">Sessions</p>
              </div>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm text-text-secondary">
              {trend >= 0 ? 'Up' : 'Down'}{' '}
              <span className={`font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(trend)} km/h
              </span>
              {' '}comparing first 5 vs last 5 sessions
            </span>
          </div>
        </div>

        {/* ── 90-day speed trend bar chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">90-Day Speed Trend</h2>
          <p className="text-xs text-text-secondary mb-4">
            Session average speed in km/h, colored by zone
          </p>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-4">
            {zoneOrder.map((z) => (
              <span key={z} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: ZONES[z].color }}
                />
                {ZONES[z].label}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 16, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888' }}
                domain={[12, 38]}
                width={36}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(_v: unknown, _name: unknown, props: { payload?: { speed?: number; zone?: Zone; duration?: number; note?: string } }) => {
                  const p = props.payload ?? {}
                  const zone = p.zone ? ZONES[p.zone].label : '—'
                  const dur = p.duration ? fmtDuration(p.duration) : '—'
                  const note = p.note ? ` · ${p.note}` : ''
                  return [`${p.speed?.toFixed(1)} km/h · ${zone} · ${dur}${note}`, 'Session']
                }}
                labelFormatter={(label: string) => label}
              />

              {/* Zone threshold reference lines */}
              <ReferenceLine
                y={20}
                stroke="#3b82f6"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{ value: '20 — Endurance', position: 'insideTopLeft', fontSize: 9, fill: '#3b82f6' }}
              />
              <ReferenceLine
                y={28}
                stroke="#f97316"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{ value: '28 — Tempo', position: 'insideTopLeft', fontSize: 9, fill: '#f97316' }}
              />
              <ReferenceLine
                y={35}
                stroke="#ef4444"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{ value: '35 — Race', position: 'insideTopLeft', fontSize: 9, fill: '#ef4444' }}
              />

              {/* 90-day average reference line */}
              <ReferenceLine
                y={avgLine}
                stroke="#6b7280"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: `Avg ${avgLine}`, position: 'insideTopRight', fontSize: 9, fill: '#9ca3af' }}
              />

              <Bar dataKey="speed" radius={[3, 3, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Speed zone distribution ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Zone Distribution</h2>
              <p className="text-xs text-text-secondary mt-0.5">Sessions per speed zone (90 days)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400 tabular-nums">
                {Math.round((sessionsByZone.endurance / totalSessions) * 100)}%
              </p>
              <p className="text-xs text-text-secondary">Endurance rides</p>
            </div>
          </div>

          <div className="space-y-3">
            {zoneOrder.map((z) => {
              const count = sessionsByZone[z]
              const pct = totalSessions > 0 ? (count / totalSessions) * 100 : 0
              const zone = ZONES[z]
              return (
                <div key={z} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold w-20" style={{ color: zone.color }}>
                        {zone.label}
                      </span>
                      <span className="text-text-secondary font-mono">{zone.range}</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-secondary">
                      <span className="font-medium" style={{ color: count > 0 ? zone.color : undefined }}>
                        {count} session{count !== 1 ? 's' : ''}
                      </span>
                      <span className="w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: zone.color,
                        opacity: count === 0 ? 0.2 : 1,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Reference ranges table ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Speed Zone Reference</h2>
            <p className="text-xs text-text-secondary mt-0.5">Road cycling on flat terrain</p>
          </div>
          <div className="divide-y divide-border">
            {(
              [
                {
                  zone: 'recovery' as Zone,
                  speed: '< 20 km/h',
                  context: 'Easy spin, commuter cycling',
                },
                {
                  zone: 'endurance' as Zone,
                  speed: '20–28 km/h',
                  context: 'Recreational group rides, base training',
                },
                {
                  zone: 'tempo' as Zone,
                  speed: '28–35 km/h',
                  context: 'Competitive amateur, Cat 4/5 crits',
                },
                {
                  zone: 'race' as Zone,
                  speed: '> 35 km/h',
                  context: 'Cat 1–3, club TT, pro peloton',
                },
              ] as { zone: Zone; speed: string; context: string }[]
            ).map(({ zone, speed, context }) => {
              const isCurrentZone = zone === latestZone
              const z = ZONES[zone]
              return (
                <div
                  key={zone}
                  className={`px-5 py-3.5 flex items-center gap-3 ${isCurrentZone ? z.bg : ''}`}
                >
                  {/* Arrow indicator for current zone */}
                  <div className="w-5 shrink-0">
                    {isCurrentZone && (
                      <ArrowRight className="w-4 h-4" style={{ color: z.color }} />
                    )}
                  </div>

                  {/* Zone badge */}
                  <div className="w-24 shrink-0">
                    <ZoneBadge zone={zone} />
                  </div>

                  {/* Speed range */}
                  <div className="w-24 shrink-0">
                    <span className="text-sm font-mono font-semibold" style={{ color: z.color }}>
                      {speed}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed flex-1">
                    {context}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science card ── */}
        <div className="bg-blue-500/5 rounded-2xl border border-blue-500/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-text-primary">Speed Science</h2>
          </div>

          <div className="space-y-4">

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-text-primary mb-0.5">
                  Speed vs. power: three variables, one outcome
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Speed is influenced by wind, gradient, and drafting, independently of your
                  fitness. A 25 km/h headwind can drop a fit rider to 15 km/h; a 10% tailwind
                  can carry a beginner to 32 km/h. Power (watts) is the true training metric —
                  it measures your output regardless of conditions.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-text-primary mb-0.5">
                  Aerodynamics: air resistance scales with v³
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  At speeds above 30 km/h, approximately 80–85% of your total effort is spent
                  overcoming aerodynamic drag. Because drag force scales with the square of
                  velocity and power with the cube, reducing frontal area (tucked position, aero
                  helmet, tight kit) yields a far greater speed gain per watt than leg fitness
                  improvements at that range.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-text-primary mb-0.5">
                  Improvement rate for amateurs
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Recreational cyclists following structured training (Zone 2 base + interval
                  work) typically gain 2–4 km/h in average speed per season. The biggest gains
                  come in the first 1–2 years; after that, improvements require increasingly
                  specific training and recovery discipline.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-0.5 w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-text-primary mb-0.5">
                  iOS 17+ speed tracking with Apple Watch / iPhone GPS
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Apple Watch Series 4+ and iPhone 6s+ use onboard GPS to calculate speed
                  continuously during Outdoor Cycling workouts, writing data as
                  <span className="font-mono text-blue-300 mx-1">HKQuantityType(.cyclingSpeed)</span>
                  samples (iOS 17+). Speed is computed as distance delta over time, smoothed
                  with a Kalman filter to reduce GPS jitter. The Watch Ultra 2's dual-band GPS
                  (L1 + L5) provides sub-metre accuracy.
                </p>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}
