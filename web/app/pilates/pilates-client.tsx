'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionType = 'Pilates' | 'Barre' | 'Flexibility' | 'Core Training'

export interface MonthlyBucket {
  month: string
  Pilates: number
  Barre: number
  Flexibility: number
  'Core Training': number
}

export interface Session {
  id: string
  date: string
  type: SessionType
  duration: number   // minutes
  calories: number
}

export interface PilatesData {
  totalSessions: number
  avgDuration: number    // minutes
  avgCalories: number
  sessionsPerWeek: number
  monthly: MonthlyBucket[]
  typeCounts: Record<SessionType, number>
  durationDist: {
    lt30: number
    d30to45: number
    d45to60: number
    gt60: number
  }
  sessions: Session[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PURPLE  = '#8B5CF6'
const ROSE    = '#FB7185'
const TEAL    = '#2DD4BF'
const INDIGO  = '#818CF8'

const TYPE_COLORS: Record<SessionType, string> = {
  Pilates: PURPLE,
  Barre: ROSE,
  Flexibility: TEAL,
  'Core Training': INDIGO,
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Mind-body benefit entries ─────────────────────────────────────────────────

const BENEFITS = [
  {
    type: 'Pilates' as SessionType,
    icon: '🔵',
    headline: 'Core Strength & Postural Alignment',
    detail:
      'Pilates targets the deep stabiliser muscles (transversus abdominis, multifidus). Research shows 8–12 weeks of Pilates reduces non-specific low-back pain by up to 36% and improves functional movement scores.',
  },
  {
    type: 'Barre' as SessionType,
    icon: '🩰',
    headline: 'Muscular Endurance & Balance',
    detail:
      'Barre combines isometric holds with small-range pulsing movements that build Type I slow-twitch fibre endurance. Studies report improved single-leg balance and reduced hip-flexor tightness after 6 weeks.',
  },
  {
    type: 'Flexibility' as SessionType,
    icon: '🌿',
    headline: 'Joint Range of Motion & Recovery',
    detail:
      'Static and dynamic stretching at 2–3×/week increases muscle-tendon compliance, reducing injury risk by ~15%. Flexibility training also lowers cortisol and improves subjective sleep quality scores.',
  },
  {
    type: 'Core Training' as SessionType,
    icon: '💠',
    headline: 'Spinal Stability & Athletic Transfer',
    detail:
      'Targeted core work — planks, dead-bugs, bird-dogs — improves force transmission from lower to upper body, directly boosting performance in running, cycling, and lifting by 5–12% in controlled trials.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function PilatesClient({ data }: { data: PilatesData }) {
  const {
    totalSessions,
    avgDuration,
    avgCalories,
    sessionsPerWeek,
    monthly,
    typeCounts,
    durationDist,
    sessions,
  } = data

  const SESSION_TYPES: SessionType[] = ['Pilates', 'Barre', 'Flexibility', 'Core Training']

  // Duration distribution rows
  const durRows = [
    { label: '< 30 min',   count: durationDist.lt30,    key: 'lt30' },
    { label: '30 – 45 min', count: durationDist.d30to45, key: 'd30to45' },
    { label: '45 – 60 min', count: durationDist.d45to60, key: 'd45to60' },
    { label: '> 60 min',   count: durationDist.gt60,    key: 'gt60' },
  ] as const
  const maxDurCount = Math.max(...durRows.map((r) => r.count))

  return (
    <div className="space-y-6">

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.25)' }}
      >
        <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-4">
          6-Month Overview
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: PURPLE }}>{totalSessions}</p>
            <p className="text-xs text-text-secondary mt-0.5">Total Sessions</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-violet-400">{fmtDuration(avgDuration)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-fuchsia-400">{avgCalories}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Calories</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: ROSE }}>{sessionsPerWeek}×</p>
            <p className="text-xs text-text-secondary mt-0.5">Sessions / Week</p>
          </div>
        </div>
      </div>

      {/* ── Monthly stacked bar chart ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Monthly Sessions by Type</h3>
        <p className="text-xs text-text-secondary mb-4 opacity-70">
          Stacked — Pilates · Barre · Flexibility · Core Training
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
              width={22}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => (
                <span style={{ color: 'var(--color-text-secondary)' }}>{value}</span>
              )}
            />
            <Bar dataKey="Pilates"       stackId="a" fill={PURPLE} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Barre"         stackId="a" fill={ROSE}   radius={[0, 0, 0, 0]} />
            <Bar dataKey="Flexibility"   stackId="a" fill={TEAL}   radius={[0, 0, 0, 0]} />
            <Bar dataKey="Core Training" stackId="a" fill={INDIGO} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Session type breakdown ─────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Session Type Breakdown</h3>
        <div className="space-y-3">
          {SESSION_TYPES.map((type) => {
            const count = typeCounts[type]
            const pct = Math.round((count / totalSessions) * 100)
            const color = TYPE_COLORS[type]
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-24 shrink-0">{type}</span>
                <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary w-12 text-right shrink-0 tabular-nums">
                  {count} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-text-secondary">
          {SESSION_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* ── Duration distribution ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Duration Distribution</h3>
        <div className="space-y-3">
          {durRows.map(({ label, count }) => {
            const pct = maxDurCount > 0 ? Math.round((count / maxDurCount) * 100) : 0
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-24 shrink-0">{label}</span>
                <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: PURPLE }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary w-8 text-right shrink-0 tabular-nums">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-text-secondary mt-3 opacity-60">
          Bar width is relative to the most common duration band.
        </p>
      </div>

      {/* ── Mind-body benefits card ────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 relative overflow-hidden"
        style={{ borderColor: 'rgba(139,92,246,0.28)', background: 'rgba(139,92,246,0.05)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PURPLE }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: PURPLE }}>
              Mind-Body Benefits &amp; Research
            </h3>
          </div>
          <div className="space-y-4">
            {BENEFITS.map(({ type, icon, headline, detail }) => (
              <div key={type} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5"
                  style={{ backgroundColor: TYPE_COLORS[type] + '22', border: `1px solid ${TYPE_COLORS[type]}44` }}
                >
                  {icon}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: TYPE_COLORS[type] }}
                  >
                    {type} — {headline}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed opacity-80">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-5 opacity-50">
            Research context for personal awareness only. Consult a qualified instructor or healthcare provider for individualised guidance.
          </p>
        </div>
      </div>

      {/* ── Recent sessions table ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">Duration</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">kcal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s) => {
                const color = TYPE_COLORS[s.type]
                return (
                  <tr key={s.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {s.date}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{
                          color,
                          backgroundColor: color + '22',
                          border: `1px solid ${color}44`,
                        }}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                      {fmtDuration(s.duration)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-secondary tabular-nums">
                      {s.calories} kcal
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
