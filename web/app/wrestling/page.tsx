'use client'

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
import { BottomNav } from '@/components/bottom-nav'

// ─── Accent palette ───────────────────────────────────────────────────────────
const INDIGO = '#6366f1'
const INDIGO_DIM = 'rgba(99,102,241,0.45)'
const PURPLE = '#8b5cf6'
const VIOLET = '#7c3aed'

const tooltipStyle = {
  background: '#1e1e2e',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SESSION_TYPE_DATA = [
  { name: 'Tournament', value: 8, color: VIOLET, range: '2h+' },
  { name: 'Dual Meet', value: 14, color: INDIGO, range: '60–120 min' },
  { name: 'Practice', value: 31, color: PURPLE, range: '45–60 min' },
  { name: 'Drilling', value: 22, color: '#a78bfa', range: '<45 min' },
]

const WEEKLY_CALORIES = [
  { week: 'Jan 6', calories: 2840 },
  { week: 'Jan 13', calories: 3120 },
  { week: 'Jan 20', calories: 2690 },
  { week: 'Jan 27', calories: 3450 },
  { week: 'Feb 3', calories: 3780 },
  { week: 'Feb 10', calories: 3210 },
  { week: 'Feb 17', calories: 4020 },
  { week: 'Feb 24', calories: 3590 },
]

const RECENT_SESSIONS = [
  {
    id: '1',
    date: 'Fri, Mar 14',
    type: 'Practice',
    duration: '58 min',
    calories: 680,
    avgHR: 178,
    maxHR: 201,
    notes: 'Takedown drilling + live goes',
  },
  {
    id: '2',
    date: 'Wed, Mar 12',
    type: 'Drilling',
    duration: '42 min',
    calories: 410,
    avgHR: 161,
    maxHR: 188,
    notes: 'Single-leg setups, scramble sequences',
  },
  {
    id: '3',
    date: 'Sat, Mar 8',
    type: 'Tournament',
    duration: '2h 15 min',
    calories: 1340,
    avgHR: 185,
    maxHR: 204,
    notes: '3 matches — 2W 1L',
  },
  {
    id: '4',
    date: 'Thu, Mar 6',
    type: 'Practice',
    duration: '55 min',
    calories: 650,
    avgHR: 174,
    maxHR: 196,
    notes: 'Greco-Roman emphasis, mat returns',
  },
  {
    id: '5',
    date: 'Tue, Mar 4',
    type: 'Dual Meet',
    duration: '1h 28 min',
    calories: 920,
    avgHR: 182,
    maxHR: 205,
    notes: 'Team dual — won by decision',
  },
]

const SESSION_TYPE_COLORS: Record<string, string> = {
  Tournament: VIOLET,
  'Dual Meet': INDIGO,
  Practice: PURPLE,
  Drilling: '#a78bfa',
}

// ─── Custom Pie label ─────────────────────────────────────────────────────────

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
}

function renderCustomPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: PieLabelProps) {
  if (percent < 0.07) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="#e2e8f0"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-center">
      <p className="text-2xl font-bold" style={{ color: accent ?? INDIGO }}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─── Science row ──────────────────────────────────────────────────────────────

function SciRow({
  label,
  value,
  cite,
}: {
  label: string
  value: string
  cite?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 font-medium">{label}</p>
        {cite && <p className="text-xs text-slate-500 mt-0.5 italic">{cite}</p>}
      </div>
      <p className="text-sm font-semibold text-right shrink-0" style={{ color: INDIGO }}>
        {value}
      </p>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const color = SESSION_TYPE_COLORS[type] ?? INDIGO
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {type}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WrestlingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-100">Wrestling Analysis</h1>
            <p className="text-sm text-slate-400">Takedown mechanics &amp; mat conditioning</p>
          </div>
          {/* Accent dot */}
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: INDIGO, boxShadow: `0 0 8px ${INDIGO}` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero summary stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Sessions (90d)" value="75" accent={INDIGO} />
          <StatCard label="Total Hours" value="68.4h" accent={PURPLE} />
          <StatCard label="Avg HR" value="179 bpm" accent="#f472b6" />
          <StatCard label="Avg Calories" value="712 kcal" accent="#34d399" />
        </div>

        {/* ── Session type breakdown ───────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">
            Session Type Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">75 sessions · last 90 days</p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Pie chart */}
            <div className="w-full sm:w-56 shrink-0">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={SESSION_TYPE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomPieLabel as (props: unknown) => React.ReactElement | null}
                  >
                    {SESSION_TYPE_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [
                      `${v} sessions`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-2">
              {SESSION_TYPE_DATA.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ backgroundColor: `${s.color}12` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm font-medium text-slate-200">{s.name}</span>
                    <span className="text-xs text-slate-500">{s.range}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Weekly calories bar chart ────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">
            Weekly Calories Burned
          </h3>
          <p className="text-xs text-slate-500 mb-4">8-week view · all wrestling sessions</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={WEEKLY_CALORIES}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                width={38}
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
                    fill={i === WEEKLY_CALORIES.length - 1 ? INDIGO : INDIGO_DIM}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Science cards 2-col grid on sm+ ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Physical Demands */}
          <SectionCard title="Physical Demands">
            <SciRow
              label="Match avg heart rate"
              value="175–190 bpm"
              cite="Yoon, 2002"
            />
            <SciRow
              label="Peak match heart rate"
              value="195–205 bpm"
              cite="Yoon, 2002"
            />
            <SciRow
              label="Blood lactate (match)"
              value="8–14 mmol/L"
              cite="Highest in sport — Yoon, 2002"
            />
            <SciRow
              label="Energy system split"
              value="60–70% aerobic"
              cite="Callan et al., 2000"
            />
            <SciRow
              label="Anaerobic contribution"
              value="30–40%"
              cite="Callan et al., 2000"
            />
            <SciRow
              label="Elite collegiate VO₂max"
              value="55–65 mL/kg/min"
            />
            <SciRow
              label="Vertical jump ↔ takedown power"
              value="r = 0.71"
              cite="Kraemer et al., 2004"
            />
            <SciRow
              label="Elite bench press standard"
              value="1.5× BW"
              cite="Kraemer et al., 2004"
            />
            <SciRow
              label="Elite back squat standard"
              value="2.0× BW"
              cite="Kraemer et al., 2004"
            />
          </SectionCard>

          {/* Takedown & Throw Mechanics */}
          <SectionCard title="Takedown & Throw Mechanics">
            <SciRow
              label="Double-leg level change"
              value="15–25 cm"
            />
            <SciRow
              label="Double-leg horizontal drive force"
              value="500–800 N"
            />
            <SciRow
              label="Single-leg trip mechanical advantage"
              value="2:1 ratio"
            />
            <SciRow
              label="Greco suplex landing force"
              value="8–12× BW"
            />
            <SciRow
              label="Elite reaction time (proprioceptive)"
              value="150–200 ms"
            />
            <SciRow
              label="Setup sequence window"
              value="0.4–0.8 s"
            />
          </SectionCard>

          {/* Weight Management Science */}
          <SectionCard title="Weight Management Science">
            <SciRow
              label="5% BW dehydration → anaerobic power"
              value="−9.5%"
              cite="Fogelholm, 1994"
            />
            <SciRow
              label="5% BW dehydration → aerobic capacity"
              value="−8%"
              cite="Fogelholm, 1994"
            />
            <SciRow
              label="5% BW dehydration → reaction time"
              value="−10%"
              cite="Fogelholm, 1994"
            />
            <SciRow
              label="NCAA weight cert: urine SG limit"
              value="< 1.025"
            />
            <SciRow
              label="NHSCA max weight cut rate"
              value="1.5% BW/week"
            />
            <SciRow
              label="Natural weight: injury rate reduction"
              value="40–50%"
              cite="Wroble & Moxley, 1996"
            />
            <SciRow
              label="Creatine + carb glycogen resynth"
              value="+14% faster"
            />
          </SectionCard>

          {/* Injury Prevention */}
          <SectionCard title="Injury Prevention">
            <SciRow
              label="Shoulder injuries (NCAA 2010–14)"
              value="28% of total"
            />
            <SciRow
              label="AC separations mechanism"
              value="Posting hand"
            />
            <SciRow
              label="MCL injury mechanism"
              value="Single-leg shots"
            />
            <SciRow
              label="Prepatellar bursitis prevention"
              value="Compression sleeves"
            />
            <SciRow
              label="Cauliflower ear: aspirate within"
              value="24 hours"
            />
            <SciRow
              label="MRSA: mandatory mat cleaning"
              value="After each practice"
            />
            <SciRow
              label="Antiviral prophylaxis (herpes simplex)"
              value="−75% transmission"
            />
          </SectionCard>

        </div>

        {/* ── Recent session history ───────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Recent Sessions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">
                    Duration
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">
                    Kcal
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">
                    Avg HR
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-500">
                    Max HR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {RECENT_SESSIONS.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {s.date}
                    </td>
                    <td className="px-3 py-3">
                      <TypeBadge type={s.type} />
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-medium text-slate-200 tabular-nums">
                      {s.duration}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-slate-300 tabular-nums">
                      {s.calories.toLocaleString()}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-xs font-semibold tabular-nums"
                      style={{ color: s.avgHR >= 180 ? '#f472b6' : INDIGO }}
                    >
                      {s.avgHR} bpm
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-400 tabular-nums">
                      {s.maxHR} bpm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500 italic">
              Showing 5 most recent sessions — sample data
            </p>
          </div>
        </div>

        {/* ── Footer note ──────────────────────────────────────────────────── */}
        <p className="text-xs text-slate-600 text-center pb-2">
          Physiological reference values sourced from peer-reviewed sport science literature.
          Individual responses vary.
        </p>

      </main>

      <BottomNav />
    </div>
  )
}
