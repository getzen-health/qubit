'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SESSION_TYPES = [
  { name: 'Full Park Session', value: 18, color: '#f97316' },
  { name: 'Standard Sesh', value: 31, color: '#fb923c' },
  { name: 'Short Sesh', value: 24, color: '#fdba74' },
  { name: 'Quick Warm-Up', value: 11, color: '#fed7aa' },
]

const WEEKLY_CALORIES = [
  { week: 'Jan 20', calories: 1840 },
  { week: 'Jan 27', calories: 2210 },
  { week: 'Feb 3',  calories: 1590 },
  { week: 'Feb 10', calories: 2650 },
  { week: 'Feb 17', calories: 2420 },
  { week: 'Feb 24', calories: 1970 },
  { week: 'Mar 3',  calories: 2880 },
  { week: 'Mar 10', calories: 3140 },
]

type SessionType = 'Full Park Session' | 'Standard Sesh' | 'Short Sesh' | 'Quick Warm-Up'

interface SkateSession {
  date: string
  type: SessionType
  duration: string
  calories: number
}

const RECENT_SESSIONS: SkateSession[] = [
  { date: 'Thu, Mar 13', type: 'Full Park Session',  duration: '2h 25m', calories: 892 },
  { date: 'Mon, Mar 10', type: 'Standard Sesh',      duration: '1h 38m', calories: 611 },
  { date: 'Sat, Mar 8',  type: 'Short Sesh',         duration: '48m',    calories: 318 },
  { date: 'Wed, Mar 5',  type: 'Full Park Session',  duration: '3h 02m', calories: 1104 },
  { date: 'Sun, Mar 2',  type: 'Quick Warm-Up',      duration: '22m',    calories: 142 },
]

const TYPE_COLORS: Record<SessionType, string> = {
  'Full Park Session': '#f97316',
  'Standard Sesh':    '#fb923c',
  'Short Sesh':       '#fdba74',
  'Quick Warm-Up':    '#fed7aa',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1c1917)',
  border: '1px solid rgba(249,115,22,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text-primary, #f5f5f4)',
}

function ScienceCard({
  title,
  accentColor,
  children,
}: {
  title: string
  accentColor: string
  children: ReactNode
}) {
  return (
    <div
      className="bg-surface rounded-2xl border p-5 relative overflow-hidden"
      style={{ borderColor: `${accentColor}40` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${accentColor}0d 0%, transparent 65%)`,
        }}
      />
      <div className="relative space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-text-secondary leading-relaxed">{label}</span>
      <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: color ?? '#f97316' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkateboardingPage() {
  const totalSessions = SESSION_TYPES.reduce((s, t) => s + t.value, 0)
  const totalCalories = WEEKLY_CALORIES.reduce((s, w) => s + w.calories, 0)
  const avgCaloriesPerWeek = Math.round(totalCalories / WEEKLY_CALORIES.length)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Skateboarding Analysis
            </h1>
            <p className="text-sm text-text-secondary">
              Ollie biomechanics &amp; session history
            </p>
          </div>
          <span className="text-2xl select-none" aria-hidden>🛹</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#f97316' }}>{totalSessions}</p>
            <p className="text-xs text-text-secondary mt-0.5">Total Sessions</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-300">84</p>
            <p className="text-xs text-text-secondary mt-0.5">Days Active</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{avgCaloriesPerWeek.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg kcal/Week</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-200">142 bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Session HR</p>
          </div>
        </div>

        {/* ── Session Type Breakdown ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">
            Session Type Breakdown
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut chart */}
            <div className="w-full sm:w-48 shrink-0">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={SESSION_TYPES}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {SESSION_TYPES.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v} sessions`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend + bar rows */}
            <div className="flex-1 w-full space-y-3">
              {SESSION_TYPES.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-xs text-text-secondary w-36 shrink-0">{t.name}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((t.value / totalSessions) * 100)}%`,
                        backgroundColor: t.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary tabular-nums w-6 text-right shrink-0">
                    {t.value}
                  </span>
                </div>
              ))}
              <p className="text-xs text-text-secondary pt-1">
                {totalSessions} sessions total · {Math.round((SESSION_TYPES[0].value / totalSessions) * 100)}% full-park days
              </p>
            </div>
          </div>
        </div>

        {/* ── Weekly Calories ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Weekly Calories Burned
            </h2>
            <span
              className="text-xs border rounded-full px-2 py-0.5"
              style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.35)' }}
            >
              Last 8 Weeks
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={WEEKLY_CALORIES} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={36}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Calories']}
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                {WEEKLY_CALORIES.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={i === WEEKLY_CALORIES.length - 1 ? '#f97316' : '#f9731680'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Science cards grid ── */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Ollie Biomechanics */}
          <ScienceCard title="Ollie Biomechanics" accentColor="#f97316">
            <div className="space-y-2 pt-1">
              <Stat
                label="Ground reaction force at tail contact (Roces 2001)"
                value="3–5× BW"
                color="#f97316"
              />
              <Stat
                label="Kickflip angular velocity"
                value="1,500–2,000°/s"
                color="#fb923c"
              />
              <Stat
                label="Front foot slide distance controlling pitch"
                value="15–20 cm"
                color="#fdba74"
              />
              <Stat
                label="Timing window for peak ollie height"
                value="~80 ms"
                color="#fed7aa"
              />
              <p className="text-xs text-text-secondary leading-relaxed pt-1 border-t border-border">
                The tail pop is the highest-force event in street skating — comparable to landing a
                standing broad jump. Mastering the 80 ms timing window separates technical skaters
                from beginners.
              </p>
            </div>
          </ScienceCard>

          {/* Injury Prevention Science */}
          <ScienceCard title="Injury Prevention Science" accentColor="#ef4444">
            <div className="space-y-2 pt-1">
              <Stat
                label="Wrist fractures as % of all skate injuries (Shuman 2011)"
                value="22%"
                color="#ef4444"
              />
              <Stat
                label="Wrist guard fracture risk reduction (Schieber 1996)"
                value="−85%"
                color="#f87171"
              />
              <Stat
                label="Ankle sprains as % of all injuries (Forsman 2011)"
                value="19%"
                color="#fca5a5"
              />
              <Stat
                label="Helmet concussion risk reduction (Thompson 2010)"
                value="−63%"
                color="#fecaca"
              />
              <Stat
                label="Head injury rate: vert vs street"
                value="3× higher"
                color="#ef4444"
              />
              <p className="text-xs text-text-secondary leading-relaxed pt-1 border-t border-border">
                Wrist guards and helmets dramatically cut the two most common injury types. Vert
                skaters face triple the head injury rate of street skaters — gear up accordingly.
              </p>
            </div>
          </ScienceCard>

          {/* Balance & Neuromuscular */}
          <ScienceCard title="Balance & Neuromuscular Adaptation" accentColor="#22d3ee">
            <div className="space-y-2 pt-1">
              <Stat
                label="Postural sway reduction vs non-skaters (Rinaldi 2014)"
                value="30% less"
                color="#22d3ee"
              />
              <Stat
                label="Proprioceptive transfer"
                value="Multi-sport"
                color="#67e8f9"
              />
              <Stat
                label="Switch stance: bilateral neuromotor adaptation"
                value="Both hemispheres"
                color="#a5f3fc"
              />
              <Stat
                label="Hip flexor imbalance from push stance"
                value="Monitor"
                color="#cffafe"
              />
              <p className="text-xs text-text-secondary leading-relaxed pt-1 border-t border-border">
                Stabilometry shows experienced skaters maintain exceptional single-leg balance.
                Switch skating uniquely trains both brain hemispheres for motor control —
                a transferable advantage for other board sports.
              </p>
            </div>
          </ScienceCard>

          {/* Training Science */}
          <ScienceCard title="Training Science & Energy" accentColor="#a855f7">
            <div className="space-y-2 pt-1">
              <Stat
                label="Street skating metabolic load"
                value="5–8 METs · 300–500 kcal/h"
                color="#a855f7"
              />
              <Stat
                label="Vert / bowl metabolic load"
                value="6–10 METs · 400–650 kcal/h"
                color="#c084fc"
              />
              <Stat
                label="Mean session heart rate (Doyle 2002)"
                value="130–155 bpm"
                color="#d8b4fe"
              />
              <Stat
                label="Ollie height gain with plyometric training (6 wk)"
                value="+8–12%"
                color="#e9d5ff"
              />
              <p className="text-xs text-text-secondary leading-relaxed pt-1 border-t border-border">
                Vert skating can match the cardiovascular demand of moderate-intensity cycling.
                Six weeks of jump training measurably improves pop — combine plyometrics with
                skate-specific ankle mobility work.
              </p>
            </div>
          </ScienceCard>

        </div>

        {/* ── Recent Sessions Table ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Recent Sessions
            </h2>
            <span className="text-xs text-text-secondary">Last 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                    Duration
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-text-secondary">
                    Calories
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_SESSIONS.map((s, i) => {
                  const color = TYPE_COLORS[s.type]
                  return (
                    <tr key={i} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-5 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {s.date}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{
                            color,
                            backgroundColor: `${color}22`,
                            border: `1px solid ${color}44`,
                          }}
                        >
                          {s.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-text-primary tabular-nums">
                        {s.duration}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-text-secondary tabular-nums">
                        {s.calories.toLocaleString()} kcal
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
