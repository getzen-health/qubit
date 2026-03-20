'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, Brain, Shield, Zap } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'

// ─── Mock data ────────────────────────────────────────────────────────────────

const SESSION_TYPE_DATA = [
  { name: 'Full Match', value: 38, color: '#10b981', description: '90 min+' },
  { name: 'Team Training', value: 29, color: '#34d399', description: '60–90 min' },
  { name: 'Small-Sided Game', value: 21, color: '#6ee7b7', description: '30–60 min' },
  { name: 'Technical', value: 12, color: '#a7f3d0', description: '<30 min' },
]

const WEEKLY_CALORIES_DATA = [
  { week: 'Wk 1', calories: 2840 },
  { week: 'Wk 2', calories: 3120 },
  { week: 'Wk 3', calories: 2650 },
  { week: 'Wk 4', calories: 3480 },
  { week: 'Wk 5', calories: 3210 },
  { week: 'Wk 6', calories: 2990 },
  { week: 'Wk 7', calories: 3560 },
  { week: 'Wk 8', calories: 3340 },
]

const RECENT_SESSIONS = [
  {
    id: '1',
    date: 'Fri, Mar 14',
    type: 'Full Match',
    duration: '92 min',
    distance: '11.4 km',
    calories: 948,
    avgHr: 162,
    sprints: 43,
  },
  {
    id: '2',
    date: 'Tue, Mar 11',
    type: 'Team Training',
    duration: '75 min',
    distance: '7.8 km',
    calories: 712,
    avgHr: 148,
    sprints: 28,
  },
  {
    id: '3',
    date: 'Sat, Mar 8',
    type: 'Full Match',
    duration: '90 min',
    distance: '10.9 km',
    calories: 904,
    avgHr: 158,
    sprints: 38,
  },
  {
    id: '4',
    date: 'Wed, Mar 5',
    type: 'Small-Sided Game',
    duration: '48 min',
    distance: '5.2 km',
    calories: 541,
    avgHr: 171,
    sprints: 22,
  },
  {
    id: '5',
    date: 'Sat, Mar 1',
    type: 'Full Match',
    duration: '95 min',
    distance: '12.1 km',
    calories: 981,
    avgHr: 165,
    sprints: 51,
  },
]

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(16, 185, 129, 0.25)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScienceCard({
  icon,
  title,
  accentColor,
  children,
}: {
  icon: React.ReactNode
  title: string
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-2 border-b border-slate-800"
        style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="px-4 py-4 space-y-2.5">{children}</div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-slate-400 leading-relaxed flex-1">{label}</span>
      <span className="text-xs font-semibold text-emerald-400 text-right whitespace-nowrap shrink-0">
        {value}
      </span>
    </div>
  )
}

function sessionTypeColor(type: string): string {
  if (type === 'Full Match') return '#10b981'
  if (type === 'Team Training') return '#34d399'
  if (type === 'Small-Sided Game') return '#6ee7b7'
  return '#a7f3d0'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SoccerSciencePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/soccer"
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Back to soccer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-100 truncate">
              Soccer Science Deep Dive
            </h1>
            <p className="text-sm text-slate-400 truncate">
              GPS demands · positional physiology · injury prevention
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
          >
            <span className="text-base leading-none">⚽</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Summary stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Avg Match Distance', value: '11.4 km', sub: 'elite: 10–13 km' },
            { label: 'Sprints / Game', value: '43', sub: '30–60 typical' },
            { label: 'High-Speed Running', value: '9.8%', sub: 'of total distance' },
            { label: 'Sprint Recovery', value: '72 s', sub: 'mean between sprints' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-center"
            >
              <p className="text-xl font-bold text-emerald-400 tabular-nums">{stat.value}</p>
              <p className="text-xs text-slate-200 font-medium mt-0.5">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Session type breakdown (pie) ─────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Session Type Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution of training formats over the past 90 days</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={SESSION_TYPE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {SESSION_TYPE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full sm:w-auto shrink-0 space-y-2">
              {SESSION_TYPE_DATA.map((s) => (
                <div key={s.name} className="flex items-center gap-3 min-w-[180px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.description}</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-400 tabular-nums">{s.value}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Weekly calories bar chart ────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Weekly Calories Burned — Last 8 Weeks
          </h3>
          <p className="text-xs text-slate-500 mb-4">Active calories from all soccer sessions per week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={WEEKLY_CALORIES_DATA}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={40}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Calories']}
              />
              <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Science cards grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Game GPS Demands */}
          <ScienceCard
            icon={<Activity className="w-4 h-4" />}
            title="Game GPS Demands"
            accentColor="#10b981"
          >
            <Fact
              label="Total distance per match (elite players)"
              value="10–13 km"
            />
            <Fact
              label="Midfielder match distance (Bradley 2009)"
              value="11–13 km"
            />
            <Fact
              label="Sprints per game · frequency"
              value="30–60 · 1 / 60–90 s"
            />
            <Fact
              label="Sprints occurring without ball possession"
              value="65%"
            />
            <Fact
              label="Distance at high intensity (Stolen 2005)"
              value="8–12%"
            />
            <Fact
              label="Mean recovery time between sprints (Carling 2010)"
              value="72 s"
            />
            <Fact
              label="Sprint output decline in second half"
              value="10–15%"
            />
          </ScienceCard>

          {/* Positional Profiles */}
          <ScienceCard
            icon={<Zap className="w-4 h-4" />}
            title="Positional Profiles"
            accentColor="#34d399"
          >
            <Fact
              label="Box-to-box midfielders — highest distance (Di Salvo 2007)"
              value="12.8 km/game"
            />
            <Fact
              label="Strikers — high-speed running ratio"
              value="Highest"
            />
            <Fact
              label="Center backs — lowest total distance"
              value="9–10.5 km"
            />
            <Fact
              label="Goalkeepers — total distance · penalty reaction"
              value="5–6 km · 0.3 s"
            />
            <Fact
              label="VO₂max demand — midfielders"
              value="58–68 mL/kg/min"
            />
            <Fact
              label="VO₂max demand — defenders"
              value="52–58 mL/kg/min"
            />
          </ScienceCard>

          {/* Injury Prevention */}
          <ScienceCard
            icon={<Shield className="w-4 h-4" />}
            title="Injury Prevention"
            accentColor="#6ee7b7"
          >
            <Fact
              label="Hamstrings share of all muscle injuries (Ekstrand 2011)"
              value="37%"
            />
            <Fact
              label="Hamstring reinjury rate"
              value="14–17%"
            />
            <Fact
              label="FIFA 11+ warm-up: hamstring injury reduction"
              value="−45%"
            />
            <Fact
              label="Female ACL rate vs male (Waldén 2011)"
              value="3× higher"
            />
            <Fact
              label="Ankle sprains — share of all injuries"
              value="25%"
            />
            <Fact
              label="Head acceleration from heading (Herring 2011)"
              value="14–17 g"
            />
          </ScienceCard>

          {/* Heading & Brain Health */}
          <ScienceCard
            icon={<Brain className="w-4 h-4" />}
            title="Heading & Brain Health"
            accentColor="#a7f3d0"
          >
            <Fact
              label=">1,000 headers/year: MRI white matter changes (Koerte 2012, Radiology)"
              value="Detected"
            />
            <Fact
              label="Heading linked to impaired memory & psychomotor speed (Lipton 2013)"
              value="Confirmed"
            />
            <Fact
              label="US Soccer 2016: heading age restriction"
              value="Banned U10"
            />
            <Fact
              label="FA 2021: adult player heading limit per session"
              value="<10 headers"
            />
            <Fact
              label="Neck strengthening reduces head acceleration"
              value="20–30%"
            />
          </ScienceCard>
        </div>

        {/* ── Recent sessions table ────────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Recent Sessions</h3>
            <span className="text-xs text-slate-500">Mock data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-400">Type</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-400">Duration</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-400">Distance</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-400">kcal</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-400">Avg HR</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Sprints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {RECENT_SESSIONS.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                      {s.date}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-slate-900 font-semibold"
                        style={{ backgroundColor: sessionTypeColor(s.type) }}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-300 tabular-nums">
                      {s.duration}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-medium text-emerald-400 tabular-nums">
                      {s.distance}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-300 tabular-nums">
                      {s.calories}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-slate-300 tabular-nums">
                      {s.avgHr} bpm
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-300 tabular-nums">
                      {s.sprints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Citation footer ──────────────────────────────────────────────── */}
        <p className="text-xs text-slate-600 text-center leading-relaxed px-2">
          Research references: Bradley et al. 2009 · Di Salvo et al. 2007 · Stolen et al. 2005 ·
          Carling et al. 2010 · Ekstrand et al. 2011 · Waldén et al. 2011 · Herring et al. 2011 ·
          Koerte et al. 2012 · Lipton et al. 2013
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
