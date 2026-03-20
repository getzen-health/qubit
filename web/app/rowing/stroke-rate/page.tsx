'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

// ─── Zone definitions ─────────────────────────────────────────────────────────

type Zone = 'steady-state' | 'aerobic' | 'threshold' | 'sprint'

interface ZoneDef {
  label: string
  color: string
  textColor: string
  bgClass: string
  borderClass: string
  desc: string
  range: string
}

const ZONES: Record<Zone, ZoneDef> = {
  'steady-state': {
    label: 'Steady State',
    color: '#60a5fa',
    textColor: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/40',
    desc: 'Aerobic base building',
    range: '≤22 SPM',
  },
  aerobic: {
    label: 'Aerobic',
    color: '#4ade80',
    textColor: 'text-green-400',
    bgClass: 'bg-green-500/20',
    borderClass: 'border-green-500/40',
    desc: 'Optimal distance training',
    range: '23–27 SPM',
  },
  threshold: {
    label: 'Threshold',
    color: '#facc15',
    textColor: 'text-yellow-400',
    bgClass: 'bg-yellow-500/20',
    borderClass: 'border-yellow-500/40',
    desc: 'High intensity pieces',
    range: '28–32 SPM',
  },
  sprint: {
    label: 'Sprint',
    color: '#f87171',
    textColor: 'text-red-400',
    bgClass: 'bg-red-500/20',
    borderClass: 'border-red-500/40',
    desc: 'Race starts & interval peaks',
    range: '33+ SPM',
  },
}

function classifyZone(spm: number): Zone {
  if (spm <= 22) return 'steady-state'
  if (spm <= 27) return 'aerobic'
  if (spm <= 32) return 'threshold'
  return 'sprint'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Session {
  date: string       // ISO date
  avgSpm: number
  minSpm: number
  maxSpm: number
  durationMin: number
  zone: Zone
}

/** Generate 22 sessions spread across the last 90 days */
function buildMockSessions(): Session[] {
  const base = new Date('2026-03-19')
  const raw: Array<{ daysAgo: number; avgSpm: number; minSpm: number; maxSpm: number; dur: number }> = [
    { daysAgo: 88, avgSpm: 21, minSpm: 19, maxSpm: 23, dur: 45 },
    { daysAgo: 85, avgSpm: 22, minSpm: 20, maxSpm: 24, dur: 30 },
    { daysAgo: 82, avgSpm: 30, minSpm: 26, maxSpm: 34, dur: 25 },
    { daysAgo: 78, avgSpm: 20, minSpm: 18, maxSpm: 22, dur: 60 },
    { daysAgo: 75, avgSpm: 24, minSpm: 22, maxSpm: 26, dur: 40 },
    { daysAgo: 72, avgSpm: 33, minSpm: 28, maxSpm: 37, dur: 20 },
    { daysAgo: 69, avgSpm: 22, minSpm: 20, maxSpm: 24, dur: 50 },
    { daysAgo: 65, avgSpm: 26, minSpm: 24, maxSpm: 28, dur: 35 },
    { daysAgo: 62, avgSpm: 31, minSpm: 27, maxSpm: 35, dur: 22 },
    { daysAgo: 58, avgSpm: 21, minSpm: 19, maxSpm: 23, dur: 55 },
    { daysAgo: 55, avgSpm: 23, minSpm: 21, maxSpm: 25, dur: 45 },
    { daysAgo: 51, avgSpm: 35, minSpm: 30, maxSpm: 39, dur: 20 },
    { daysAgo: 48, avgSpm: 22, minSpm: 20, maxSpm: 24, dur: 60 },
    { daysAgo: 44, avgSpm: 25, minSpm: 23, maxSpm: 27, dur: 38 },
    { daysAgo: 41, avgSpm: 29, minSpm: 25, maxSpm: 33, dur: 28 },
    { daysAgo: 37, avgSpm: 21, minSpm: 19, maxSpm: 23, dur: 50 },
    { daysAgo: 33, avgSpm: 27, minSpm: 25, maxSpm: 29, dur: 40 },
    { daysAgo: 29, avgSpm: 34, minSpm: 29, maxSpm: 38, dur: 22 },
    { daysAgo: 24, avgSpm: 23, minSpm: 21, maxSpm: 25, dur: 45 },
    { daysAgo: 18, avgSpm: 32, minSpm: 28, maxSpm: 35, dur: 25 },
    { daysAgo: 11, avgSpm: 22, minSpm: 20, maxSpm: 24, dur: 55 },
    { daysAgo: 4,  avgSpm: 26, minSpm: 24, maxSpm: 28, dur: 40 },
  ]

  return raw.map(({ daysAgo, avgSpm, minSpm, maxSpm, dur }) => {
    const d = new Date(base)
    d.setDate(d.getDate() - daysAgo)
    const iso = d.toISOString().slice(0, 10)
    return {
      date: iso,
      avgSpm,
      minSpm,
      maxSpm,
      durationMin: dur,
      zone: classifyZone(avgSpm),
    }
  })
}

const SESSIONS = buildMockSessions()

const AVG_SPM = 24.5

// ─── Derived stats ────────────────────────────────────────────────────────────

const totalSessions = SESSIONS.length
const peakSpm = Math.max(...SESSIONS.map((s) => s.maxSpm))
const sprintSessions = SESSIONS.filter((s) => s.zone === 'sprint').length
const steadySessions = SESSIONS.filter((s) => s.zone === 'steady-state').length

const zoneCounts: Record<Zone, number> = {
  'steady-state': steadySessions,
  aerobic: SESSIONS.filter((s) => s.zone === 'aerobic').length,
  threshold: SESSIONS.filter((s) => s.zone === 'threshold').length,
  sprint: sprintSessions,
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

function fmtDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/** Convert ISO date to a numeric timestamp for the scatter x-axis */
function dateToTs(iso: string): number {
  return new Date(iso).getTime()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZoneBadge({ zone }: { zone: Zone }) {
  const z = ZONES[zone]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${z.bgClass} ${z.borderClass} ${z.textColor}`}
    >
      {z.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RowingStrokeRatePage() {
  const heroZone = classifyZone(AVG_SPM)
  const heroZoneDef = ZONES[heroZone]

  // Scatter data: timestamp + SPM
  const scatterData = SESSIONS.map((s) => ({
    x: dateToTs(s.date),
    y: s.avgSpm,
    zone: s.zone,
    date: s.date,
    dur: s.durationMin,
  }))

  // x-axis tick formatter: month/day from timestamp
  const xTickFormatter = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Zone distribution max for bar scaling
  const maxZoneCount = Math.max(...Object.values(zoneCounts), 1)

  // Recent 8 sessions
  const recent = [...SESSIONS].reverse().slice(0, 8)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060d1a' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ backgroundColor: 'rgba(6,13,26,0.85)', borderColor: 'rgba(148,163,184,0.12)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/rowing"
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(148,163,184,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Back to rowing"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
              Rowing Stroke Rate
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Last 90 days · {totalSessions} sessions · SPM analysis
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero stat ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6 flex flex-col items-center text-center"
          style={{ backgroundColor: '#0c1829', borderColor: 'rgba(148,163,184,0.15)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
            Average Stroke Rate
          </p>
          <p className="text-7xl font-black mb-2" style={{ color: heroZoneDef.color }}>
            {AVG_SPM}
          </p>
          <p className="text-lg font-medium mb-3" style={{ color: '#94a3b8' }}>
            SPM
          </p>
          <ZoneBadge zone={heroZone} />
          <p className="text-xs mt-2" style={{ color: '#475569' }}>
            {heroZoneDef.desc} · {heroZoneDef.range}
          </p>

          {/* Zone legend */}
          <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-sm sm:grid-cols-4">
            {(Object.entries(ZONES) as [Zone, ZoneDef][]).map(([key, z]) => (
              <div
                key={key}
                className={`rounded-lg border p-2 text-center ${z.bgClass} ${z.borderClass}`}
              >
                <p className={`text-xs font-semibold ${z.textColor}`}>{z.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{z.range}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Sessions', value: String(totalSessions), color: '#60a5fa' },
            { label: 'Peak SPM', value: String(peakSpm), color: '#f87171' },
            { label: 'Sprint Sessions', value: String(sprintSessions), color: '#fb923c' },
            { label: 'Steady-State', value: String(steadySessions), color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl border p-4 text-center"
              style={{ backgroundColor: '#0c1829', borderColor: 'rgba(148,163,184,0.15)' }}
            >
              <p className="text-2xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── SPM trend scatter chart ─────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: '#0c1829', borderColor: 'rgba(148,163,184,0.15)' }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>
            SPM Trend — Last 90 Days
          </p>
          <p className="text-xs mb-4" style={{ color: '#475569' }}>
            Each point is one session · color = training zone
          </p>

          {/* Zone color legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
            {(Object.entries(ZONES) as [Zone, ZoneDef][]).map(([key, z]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: z.color }} />
                {z.label}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis
                dataKey="x"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={xTickFormatter}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                dataKey="y"
                domain={[16, 42]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                width={28}
                label={{
                  value: 'SPM',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { fontSize: 10, fill: '#475569' },
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(148,163,184,0.2)' }}
                formatter={(value: number, name: string) => {
                  if (name === 'y') return [`${value} SPM`, 'Avg Rate']
                  return [value, name]
                }}
                labelFormatter={(_: unknown, payload: Array<{ payload: typeof scatterData[0] }>) => {
                  if (!payload?.length) return ''
                  const p = payload[0].payload
                  return `${fmtDate(p.date)} · ${fmtDuration(p.dur)}`
                }}
              />
              {/* Reference lines */}
              <ReferenceLine
                y={28}
                stroke="#facc15"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Threshold',
                  position: 'insideTopRight',
                  style: { fontSize: 9, fill: '#facc15', opacity: 0.7 },
                }}
              />
              <ReferenceLine
                y={33}
                stroke="#f87171"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Sprint',
                  position: 'insideTopRight',
                  style: { fontSize: 9, fill: '#f87171', opacity: 0.7 },
                }}
              />
              <Scatter data={scatterData} dataKey="y">
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={ZONES[entry.zone].color} fillOpacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* ── Zone distribution horizontal bar ───────────────────────── */}
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: '#0c1829', borderColor: 'rgba(148,163,184,0.15)' }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>
            Zone Distribution
          </p>
          <p className="text-xs mb-4" style={{ color: '#475569' }}>
            Sessions count per training zone
          </p>

          <div className="space-y-3">
            {(Object.entries(ZONES) as [Zone, ZoneDef][]).map(([key, z]) => {
              const count = zoneCounts[key]
              const widthPct = (count / maxZoneCount) * 100
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-28 flex-none">
                    <p className="text-xs font-medium" style={{ color: z.color }}>
                      {z.label}
                    </p>
                    <p className="text-xs" style={{ color: '#475569' }}>
                      {z.range}
                    </p>
                  </div>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(148,163,184,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${widthPct}%`, backgroundColor: z.color, opacity: 0.75 }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right" style={{ color: '#94a3b8' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Recent sessions list ────────────────────────────────────── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: '#0c1829', borderColor: 'rgba(148,163,184,0.15)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(148,163,184,0.12)' }}>
            <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              Recent Sessions
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(148,163,184,0.1)' }}>
                  {['Date', 'Avg SPM', 'Range', 'Duration', 'Zone'].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 text-xs font-medium ${i === 0 ? 'px-4 text-left' : i === 4 ? 'px-4 text-right' : 'px-3 text-right'}`}
                      style={{ color: '#475569' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((s, idx) => (
                  <tr
                    key={s.date + idx}
                    className="border-b last:border-0 transition-colors"
                    style={{ borderColor: 'rgba(148,163,184,0.08)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(148,163,184,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#94a3b8' }}>
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold tabular-nums" style={{ color: ZONES[s.zone].color }}>
                      {s.avgSpm}
                    </td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums" style={{ color: '#64748b' }}>
                      {s.minSpm}–{s.maxSpm}
                    </td>
                    <td className="px-3 py-3 text-right text-xs" style={{ color: '#94a3b8' }}>
                      {fmtDuration(s.durationMin)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ZoneBadge zone={s.zone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Science card ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: '#0c1829', borderColor: 'rgba(148,163,184,0.15)' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>
            Stroke Rate Science
          </p>
          <div className="space-y-3">
            {[
              {
                title: 'Indoor sprint pieces',
                body: '28–38 SPM for high-intensity ergo intervals — higher rate recruits fast-twitch fibres and elevates cardiovascular demand rapidly.',
                color: '#f87171',
              },
              {
                title: 'Distance training',
                body: '18–26 SPM for steady-state rowing builds aerobic base and improves mitochondrial density without excessive fatigue accumulation.',
                color: '#60a5fa',
              },
              {
                title: 'Power = Rate × Force × Drive Length',
                body: 'Elite rowers balance all three variables. Increasing rate without maintaining force or drive length yields diminishing power returns.',
                color: '#4ade80',
              },
              {
                title: 'Stroke efficiency',
                body: '85–90% drive-to-recovery ratio is optimal — a controlled, deliberate recovery phase preserves rhythm and reduces injury risk.',
                color: '#c084fc',
                source: 'Sanderson & Martindale, 1986',
              },
            ].map(({ title, body, color, source }) => (
              <div key={title} className="flex gap-3">
                <div className="w-1 flex-none rounded-full mt-0.5" style={{ backgroundColor: color, minHeight: '1.25rem' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color }}>
                    {title}
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                    {body}
                  </p>
                  {source && (
                    <p className="text-xs mt-0.5 italic" style={{ color: '#475569' }}>
                      {source}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
