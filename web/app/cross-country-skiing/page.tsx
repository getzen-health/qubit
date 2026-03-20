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
  Legend,
} from 'recharts'

export default function CrossCountrySkiingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Cross-Country Skiing Analysis</h1>
            <p className="text-sm text-gray-400">World&apos;s highest VO₂max sport · Sample data</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* ─── Hero section ─────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-blue-950 to-cyan-950 border border-blue-900/40 p-6">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_#67e8f9_0%,_transparent_60%)]" />
          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">⛷️</span>
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                Nordic Analysis
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              Cross-Country Skiing
            </h2>
            <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
              The world&apos;s most aerobically demanding sport. XC skiing recruits 70–80% of total
              muscle mass simultaneously — more than any other endurance discipline — producing
              the highest recorded VO₂max values in human physiology.
            </p>
          </div>

          {/* Hero stat pills */}
          <div className="relative mt-5 flex flex-wrap gap-3">
            {[
              { label: 'World Record VO₂max', value: '97.5 mL/kg/min' },
              { label: 'Muscle Mass Engaged', value: '70–80%' },
              { label: 'Race Pace METs', value: '14–18' },
              { label: 'Cardiac Output', value: '25–35 L/min' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
              >
                <p className="text-lg font-bold text-cyan-300">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Summary stat cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Sessions', value: '24', color: 'text-cyan-400' },
            { label: 'Total Hours', value: '61.5h', color: 'text-blue-400' },
            { label: 'Avg Duration', value: '2h 34m', color: 'text-sky-400' },
            { label: 'Avg HR', value: '152 bpm', color: 'text-indigo-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── Session type breakdown ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Pie chart */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Session Type Breakdown</h3>
            <p className="text-xs text-gray-500 mb-4">By session count · last 24 sessions</p>
            <SessionTypePie />
          </div>

          {/* Legend cards */}
          <div className="flex flex-col justify-center gap-3">
            {SESSION_TYPES.map((t) => (
              <div
                key={t.label}
                className="bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 flex items-center gap-3"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.range}</p>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: t.color }}>
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Weekly calories bar chart ────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-1">Weekly Calories Burned</h3>
          <p className="text-xs text-gray-500 mb-4">Last 8 weeks · active kcal from skiing sessions</p>
          <WeeklyCaloriesChart />
        </div>

        {/* ─── Science cards — 2-column grid ───────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ScienceCard
            title="World's Highest VO₂max Sport"
            icon="🫁"
            accentColor="cyan"
            facts={[
              {
                label: 'Bjørn Dæhlie (Ingjer 1991)',
                value: '96 mL/kg/min',
                note: 'Male all-time record for many decades',
              },
              {
                label: 'Svendsen 2012 — age 18',
                value: '97.5 mL/kg/min',
                note: 'Highest ever recorded in a human being',
              },
              {
                label: 'Kristiansen — female record',
                value: '71 mL/kg/min',
                note: 'Highest recorded in a female athlete',
              },
              {
                label: 'Muscle mass engaged (Stromme 1977)',
                value: '70–80%',
                note: 'vs. running 40–50% — simultaneous upper + lower body',
              },
              {
                label: 'LT2 intensity (Holmberg 2007)',
                value: '85–92% VO₂max',
                note: 'Elite skiers sustain near-threshold effort in races',
              },
              {
                label: 'VO₂max gain in 12 weeks (Jansson 1990)',
                value: '+15–25%',
                note: 'Highest trainability of any endurance sport',
              },
            ]}
          />

          <ScienceCard
            title="Technique Science"
            icon="🎿"
            accentColor="blue"
            facts={[
              {
                label: 'Diagonal stride kick-to-glide (Bilodeau 1996)',
                value: '0.08–0.15 s',
                note: '60–70 strides/min at race pace',
              },
              {
                label: 'V2 vs V1 skate selection (Smith 1992)',
                value: 'Grade-dependent',
                note: 'V2 on moderate grades; V1 on steep terrain',
              },
              {
                label: 'Skate skiing HR premium',
                value: '+8–12 bpm',
                note: 'Higher at identical speed vs. classic technique',
              },
              {
                label: 'Double-poling peak power (Holmberg 2005)',
                value: '500–700 W',
                note: '80% of propulsive force in just 0.15 s',
              },
              {
                label: 'Uphill energy share (Åkermark 1993)',
                value: '40–45%',
                note: 'From only 25% of race course — uphills dominate',
              },
            ]}
          />

          <ScienceCard
            title="Energy Demands"
            icon="⚡"
            accentColor="sky"
            facts={[
              {
                label: 'Race pace metabolic rate',
                value: '14–18 METs',
                note: 'Among the highest sustained in any sport',
              },
              {
                label: '90-minute race caloric cost',
                value: '1,400–1,800 kcal',
                note: 'Comparable to a marathon in half the time',
              },
              {
                label: '50 km race total expenditure',
                value: '3,000–4,000 kcal',
                note: 'Requires aggressive pre-race glycogen loading',
              },
              {
                label: 'Carbohydrate requirement',
                value: '60–90 g/h',
                note: 'Gut training essential for race fuelling',
              },
              {
                label: 'Altitude effect on fat oxidation',
                value: '+12–15%',
                note: 'Higher fat use at altitude reduces glycogen sparing',
              },
              {
                label: 'Cold-induced BMR elevation',
                value: '+10–20%',
                note: 'Thermogenesis increases total energy expenditure',
              },
              {
                label: 'Peak cardiac output',
                value: '25–35 L/min',
                note: 'World record sustained output — highest of any sport',
              },
            ]}
          />

          <ScienceCard
            title="Norwegian Training Model"
            icon="🇳🇴"
            accentColor="indigo"
            facts={[
              {
                label: 'Polarised distribution (Seiler & Tønnessen 2009)',
                value: '78–82% Z1',
                note: '17–21% above LT2; almost no threshold work',
              },
              {
                label: 'Elite annual training volume',
                value: '800–1,200 h/yr',
                note: 'Largest periodised base of any Olympic sport',
              },
              {
                label: 'Max-strength effect on ski economy (Hoff 1999)',
                value: '+5.1% economy',
                note: '+21.8% time-to-exhaustion in 8 weeks of lifting',
              },
              {
                label: 'Live-high, train-low (Stray-Gundersen 1992 JAMA)',
                value: '+30% EPO',
                note: '+5% hemoglobin in 4 weeks — most studied protocol',
              },
              {
                label: 'Annual altitude camps',
                value: '4–6 camps',
                note: 'Livigno, St. Moritz, Davos — 2,000–3,000 m altitude',
              },
            ]}
          />
        </div>

        {/* ─── Recent session history ───────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300">Recent Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date', 'Type', 'Duration', 'Distance', 'Calories', 'Avg HR'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 first:pl-5 last:pr-5 last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {RECENT_SESSIONS.map((s) => (
                  <tr key={s.date} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: SESSION_TYPE_COLOR[s.type] + '22',
                          color: SESSION_TYPE_COLOR[s.type],
                        }}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-200 font-medium tabular-nums">
                      {s.duration}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{s.distance}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{s.calories}</td>
                    <td className="px-5 py-3 text-right text-xs font-semibold text-cyan-400 tabular-nums">
                      {s.avgHr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SESSION_TYPES = [
  { label: 'Long Distance', range: '2h+ · aerobic base', count: 9, color: '#22d3ee' },
  { label: 'Medium Distance', range: '60–120 min · tempo', count: 8, color: '#3b82f6' },
  { label: 'Interval Session', range: '30–60 min · VO₂max', count: 5, color: '#818cf8' },
  { label: 'Speed / Technique', range: '<30 min · skill work', count: 2, color: '#6ee7b7' },
]

const SESSION_TYPE_COLOR: Record<string, string> = {
  'Long Distance': '#22d3ee',
  'Medium Distance': '#3b82f6',
  'Interval': '#818cf8',
  'Speed / Tech': '#6ee7b7',
}

const WEEKLY_CALORIES = [
  { week: 'Jan 6', kcal: 1240 },
  { week: 'Jan 13', kcal: 1680 },
  { week: 'Jan 20', kcal: 2310 },
  { week: 'Jan 27', kcal: 1890 },
  { week: 'Feb 3', kcal: 2640 },
  { week: 'Feb 10', kcal: 3120 },
  { week: 'Feb 17', kcal: 2850 },
  { week: 'Feb 24', kcal: 1960 },
]

const RECENT_SESSIONS = [
  {
    date: 'Sat, Feb 22',
    type: 'Long Distance',
    duration: '3h 08m',
    distance: '28.4 km',
    calories: '1,420 kcal',
    avgHr: '148 bpm',
  },
  {
    date: 'Thu, Feb 20',
    type: 'Interval',
    duration: '52m',
    distance: '12.1 km',
    calories: '620 kcal',
    avgHr: '168 bpm',
  },
  {
    date: 'Tue, Feb 18',
    type: 'Medium Distance',
    duration: '1h 44m',
    distance: '18.6 km',
    calories: '890 kcal',
    avgHr: '154 bpm',
  },
  {
    date: 'Sun, Feb 16',
    type: 'Long Distance',
    duration: '2h 55m',
    distance: '25.8 km',
    calories: '1,310 kcal',
    avgHr: '145 bpm',
  },
  {
    date: 'Fri, Feb 14',
    type: 'Speed / Tech',
    duration: '28m',
    distance: '6.2 km',
    calories: '290 kcal',
    avgHr: '172 bpm',
  },
]

// ─── Chart components ─────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 8,
  fontSize: 12,
}

function SessionTypePie() {
  const data = SESSION_TYPES.map((t) => ({ name: t.label, value: t.count, color: t.color }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, name: string) => [v + ' sessions', name]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function WeeklyCaloriesChart() {
  const maxKcal = Math.max(...WEEKLY_CALORIES.map((d) => d.kcal))
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={WEEKLY_CALORIES} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6b7280' }}
          width={36}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Calories']}
          labelFormatter={(label: string) => `Week of ${label}`}
        />
        <Bar dataKey="kcal" radius={[4, 4, 0, 0]}>
          {WEEKLY_CALORIES.map((entry) => {
            const intensity = entry.kcal / maxKcal
            // Gradient from muted blue to vivid cyan as intensity rises
            const r = Math.round(34 + intensity * (6 - 34))
            const g = Math.round(100 + intensity * (211 - 100))
            const b = Math.round(195 + intensity * (238 - 195))
            return <Cell key={entry.week} fill={`rgb(${r},${g},${b})`} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Science card ─────────────────────────────────────────────────────────────

interface Fact {
  label: string
  value: string
  note?: string
}

const ACCENT_CLASSES: Record<string, { badge: string; value: string; border: string }> = {
  cyan: {
    badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
    value: 'text-cyan-300',
    border: 'border-cyan-900/30',
  },
  blue: {
    badge: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
    value: 'text-blue-300',
    border: 'border-blue-900/30',
  },
  sky: {
    badge: 'bg-sky-950/60 text-sky-300 border-sky-800/50',
    value: 'text-sky-300',
    border: 'border-sky-900/30',
  },
  indigo: {
    badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
    value: 'text-indigo-300',
    border: 'border-indigo-900/30',
  },
}

function ScienceCard({
  title,
  icon,
  accentColor,
  facts,
}: {
  title: string
  icon: string
  accentColor: keyof typeof ACCENT_CLASSES
  facts: Fact[]
}) {
  const a = ACCENT_CLASSES[accentColor]
  return (
    <div className={`bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="space-y-3">
        {facts.map((fact) => (
          <div key={fact.label} className={`rounded-xl border ${a.border} bg-gray-800/40 px-4 py-3`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-gray-400 leading-snug flex-1">{fact.label}</p>
              <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${a.value}`}>
                {fact.value}
              </span>
            </div>
            {fact.note && (
              <p className="text-xs text-gray-500 mt-1 leading-snug">{fact.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
