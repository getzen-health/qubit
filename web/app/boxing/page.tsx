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

// ─── Accent palette ──────────────────────────────────────────────────────────

const CRIMSON = '#dc2626'
const CRIMSON_BRIGHT = '#ef4444'
const CRIMSON_DIM = 'rgba(220,38,38,0.35)'
const CRIMSON_FAINT = 'rgba(220,38,38,0.08)'
const CRIMSON_BORDER = 'rgba(220,38,38,0.25)'

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(220,38,38,0.3)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const SESSION_TYPE_DATA = [
  { name: 'Technical (<30 min)', value: 8, fill: CRIMSON_DIM },
  { name: 'Full Training (30–60 min)', value: 19, fill: '#f97316' },
  { name: 'Sparring (60–90 min)', value: 11, fill: CRIMSON_BRIGHT },
  { name: 'Competition/Fight (90 min+)', value: 3, fill: CRIMSON },
]

const WEEKLY_CALORIES = [
  { week: 'Jan 27', kcal: 2140 },
  { week: 'Feb 3', kcal: 2580 },
  { week: 'Feb 10', kcal: 1890 },
  { week: 'Feb 17', kcal: 3020 },
  { week: 'Feb 24', kcal: 2760 },
  { week: 'Mar 3', kcal: 2310 },
  { week: 'Mar 10', kcal: 2950 },
  { week: 'Mar 17', kcal: 2680 },
]

const maxWeeklyKcal = Math.max(...WEEKLY_CALORIES.map((w) => w.kcal))

const MOCK_SESSIONS = [
  {
    id: '1',
    date: '2026-03-18',
    type: 'Full Training',
    duration: 52,
    kcal: 648,
    avgHR: 162,
    peakHR: 194,
  },
  {
    id: '2',
    date: '2026-03-15',
    type: 'Sparring',
    duration: 74,
    kcal: 891,
    avgHR: 178,
    peakHR: 199,
  },
  {
    id: '3',
    date: '2026-03-12',
    type: 'Technical',
    duration: 28,
    kcal: 312,
    avgHR: 138,
    peakHR: 168,
  },
  {
    id: '4',
    date: '2026-03-08',
    type: 'Full Training',
    duration: 58,
    kcal: 724,
    avgHR: 169,
    peakHR: 197,
  },
  {
    id: '5',
    date: '2026-03-05',
    type: 'Sparring',
    duration: 81,
    kcal: 976,
    avgHR: 181,
    peakHR: 200,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function typeColor(type: string): string {
  if (type === 'Competition/Fight') return CRIMSON
  if (type === 'Sparring') return CRIMSON_BRIGHT
  if (type === 'Full Training') return '#f97316'
  return '#94a3b8'
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="block w-1 h-4 rounded-full" style={{ background: CRIMSON }} />
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: CRIMSON }}>
        {children}
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div
      className="rounded-2xl border p-4 text-center flex flex-col gap-0.5"
      style={{ background: CRIMSON_FAINT, borderColor: CRIMSON_BORDER }}
    >
      <p className="text-2xl font-black tabular-nums" style={{ color: CRIMSON_BRIGHT }}>
        {value}
      </p>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-slate-800" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoxingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: 'rgba(2,6,23,0.85)',
          borderColor: 'rgba(220,38,38,0.2)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg transition-colors hover:bg-slate-800"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-black tracking-tight truncate"
              style={{ color: CRIMSON_BRIGHT }}
            >
              Boxing Analysis
            </h1>
            <p className="text-xs text-slate-400 truncate">
              Punch biomechanics · round energy systems · training science
            </p>
          </div>
          {/* Corner accent */}
          <span
            className="text-xs font-bold px-3 py-1 rounded-full border"
            style={{ color: CRIMSON_BRIGHT, borderColor: CRIMSON_BORDER, background: CRIMSON_FAINT }}
          >
            Mock Data
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Hero banner ───────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6 relative overflow-hidden"
          style={{ background: CRIMSON_FAINT, borderColor: CRIMSON_BORDER }}
        >
          {/* Decorative ring corner */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-4 opacity-10"
            style={{ borderColor: CRIMSON }}
            aria-hidden
          />
          <div
            className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full border-4 opacity-10"
            style={{ borderColor: CRIMSON }}
            aria-hidden
          />
          <div className="relative">
            <h2
              className="text-3xl font-black tracking-tight leading-none mb-2"
              style={{ color: CRIMSON_BRIGHT }}
            >
              Boxing Analysis
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Visualise your sessions through the lens of punch biomechanics, round energy systems,
              and fight-camp conditioning science. All figures are illustrative sample data.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <Stat label="Total Sessions" value="41" sub="Last 90 days" />
              <Stat label="Total kcal" value="43.2k" sub="Active energy" />
              <Stat label="Avg Session HR" value="168 bpm" sub="Across all types" />
              <Stat label="Peak HR Recorded" value="200 bpm" sub="Sparring" />
            </div>
          </div>
        </div>

        {/* ── Session type breakdown ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <SectionLabel>Session Type Breakdown</SectionLabel>
          <h3 className="text-base font-bold text-slate-100 mb-4">
            Session Mix — Last 90 Days
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Donut chart */}
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={SESSION_TYPE_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                >
                  {SESSION_TYPE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v} sessions`, '']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Bar breakdown */}
            <div className="space-y-3">
              {SESSION_TYPE_DATA.slice().reverse().map((d) => (
                <div key={d.name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{d.name}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: d.fill }}>
                      {d.value}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((d.value / 41) * 100)}%`,
                        background: d.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-1">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Technical sessions build skill economy · sparring develops fight IQ ·
                  full training integrates conditioning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Weekly calories bar chart ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <SectionLabel>Weekly Energy</SectionLabel>
          <h3 className="text-base font-bold text-slate-100 mb-1">
            Weekly Active Calories — 8 Weeks
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Target: 2,500+ kcal / week for competitive boxing conditioning
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={WEEKLY_CALORIES}
              margin={{ top: 4, right: 4, left: -4, bottom: 0 }}
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
                width={40}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString()} kcal`, 'Active Energy']}
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <Bar dataKey="kcal" radius={[4, 4, 0, 0]}>
                {WEEKLY_CALORIES.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.kcal === maxWeeklyKcal ? CRIMSON_BRIGHT : CRIMSON_DIM}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-500 mt-2">
            Peak week highlighted in bright red. Sparring weeks typically produce highest caloric
            expenditure (650–850 kcal/h at 9–12 METs).
          </p>
        </div>

        {/* ── Two-column science grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Punch Biomechanics */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <SectionLabel>Biomechanics</SectionLabel>
            <h3 className="text-base font-bold text-slate-100">Punch Biomechanics</h3>

            <div className="space-y-2">
              {/* Force */}
              <div
                className="rounded-xl border p-3 space-y-1"
                style={{ background: CRIMSON_FAINT, borderColor: CRIMSON_BORDER }}
              >
                <p className="text-xs font-semibold text-slate-200">Peak Impact Force</p>
                <p
                  className="text-2xl font-black tabular-nums"
                  style={{ color: CRIMSON_BRIGHT }}
                >
                  2.4 – 4.8 kN
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Elite amateur peak force range (Turner 2011, Sports Engineering). Leg-to-hip
                  kinetic chain drives ~50% of punch power.
                </p>
              </div>

              {/* Kinetic chain */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
                <p className="text-xs font-semibold text-slate-300 mb-1.5">
                  Kinetic Chain Sequence
                </p>
                <div className="flex items-center flex-wrap gap-1 text-[10px] font-bold">
                  {['Ground', 'Leg', 'Hip', 'Trunk', 'Shoulder', 'Elbow', 'Wrist'].map(
                    (seg, i, arr) => (
                      <span key={seg} className="flex items-center gap-1">
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{ background: CRIMSON_FAINT, color: CRIMSON_BRIGHT }}
                        >
                          {seg}
                        </span>
                        {i < arr.length - 1 && (
                          <span className="text-slate-600">›</span>
                        )}
                      </span>
                    )
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Ground reaction force propagates sequentially (Lenetsky 2013).
                </p>
              </div>

              {/* Velocity & timing */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-300">Elbow Extension Velocity</p>
                <p className="text-xl font-black tabular-nums text-orange-400">
                  1,100 – 1,300 °/s
                </p>
                <Divider />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-[10px] text-slate-500">Contact duration</p>
                    <p className="text-sm font-bold text-slate-200">3 – 10 ms</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Fist impact velocity</p>
                    <p className="text-sm font-bold text-slate-200">9 – 12 m/s</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Cheraghi 2014.</p>
              </div>

              {/* Defence stat */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex items-start gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Rolling Under a Hook</p>
                  <p
                    className="text-xl font-black tabular-nums mt-0.5"
                    style={{ color: CRIMSON_BRIGHT }}
                  >
                    40–60% force reduction
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Proper slipping mechanics significantly attenuates impact force on the skull and
                    neck.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Systems & Round Intensity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <SectionLabel>Energy Systems</SectionLabel>
            <h3 className="text-base font-bold text-slate-100">Round Intensity & Fuel</h3>

            {/* HR band */}
            <div
              className="rounded-xl border p-3"
              style={{ background: CRIMSON_FAINT, borderColor: CRIMSON_BORDER }}
            >
              <p className="text-xs font-semibold text-slate-200 mb-2">
                Competitive Round Heart Rate (Dunn 2016)
              </p>
              <div className="flex items-end gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Avg</p>
                  <p className="text-xl font-black tabular-nums" style={{ color: CRIMSON_BRIGHT }}>
                    175–185
                  </p>
                  <p className="text-[10px] text-slate-400">bpm</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">1-min rest</p>
                  <p className="text-xl font-black tabular-nums text-orange-400">155–165</p>
                  <p className="text-[10px] text-slate-400">bpm</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500">Peak</p>
                  <p className="text-xl font-black tabular-nums text-red-300">195–200</p>
                  <p className="text-[10px] text-slate-400">bpm</p>
                </div>
              </div>
            </div>

            {/* Energy system contribution chart */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs font-semibold text-slate-300 mb-3">
                Energy System % — Early vs Late Rounds (Davis 2002)
              </p>
              <div className="space-y-2">
                {[
                  { label: 'PCr', early: 45, late: 30, color: '#f97316' },
                  { label: 'Glycolytic', early: 45, late: 45, color: CRIMSON_BRIGHT },
                  { label: 'Aerobic', early: 10, late: 25, color: '#22c55e' },
                ].map((sys) => (
                  <div key={sys.label} className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold w-16 shrink-0"
                      style={{ color: sys.color }}
                    >
                      {sys.label}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-600 w-8">Early</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${sys.early}%`, background: sys.color, opacity: 0.6 }}
                          />
                        </div>
                        <span className="text-[9px] tabular-nums text-slate-400 w-6 text-right">
                          {sys.early}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-600 w-8">Late</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${sys.late}%`, background: sys.color }}
                          />
                        </div>
                        <span className="text-[9px] tabular-nums text-slate-400 w-6 text-right">
                          {sys.late}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MET & kcal */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
                <p className="text-[10px] text-slate-500">Sparring MET</p>
                <p
                  className="text-xl font-black tabular-nums"
                  style={{ color: CRIMSON_BRIGHT }}
                >
                  9–12
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 text-center">
                <p className="text-[10px] text-slate-500">Sparring kcal/h</p>
                <p
                  className="text-xl font-black tabular-nums"
                  style={{ color: CRIMSON_BRIGHT }}
                >
                  650–850
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-xs font-semibold text-slate-300 mb-1">Breathing Technique</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Boxers exhale sharply on punch impact — activates transverse abdominis, increases
                intra-abdominal pressure, and stabilises the core against counter-punches.
              </p>
            </div>
          </div>
        </div>

        {/* ── Training Modes & Conditioning ────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <SectionLabel>Conditioning</SectionLabel>
          <h3 className="text-base font-bold text-slate-100">
            Training Modes & Fight-Camp Structure
          </h3>

          {/* Aerobic capacity effect */}
          <div
            className="rounded-xl border p-3"
            style={{ background: CRIMSON_FAINT, borderColor: CRIMSON_BORDER }}
          >
            <p className="text-xs font-semibold text-slate-200">
              Aerobic Base Advantage (Ward 2017)
            </p>
            <p
              className="text-2xl font-black tabular-nums mt-1"
              style={{ color: CRIMSON_BRIGHT }}
            >
              15–20% better
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
              Boxers with higher aerobic capacity maintain punch output in late rounds versus
              those with lower VO2max — even when early-round output is equivalent.
            </p>
          </div>

          {/* Training mode intensity comparison */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-300 mb-3">
              Mode Intensity Comparison (relative HR% max)
            </p>
            {[
              { label: 'Heavy Bag', pct: 82, note: 'Power development, high impact force' },
              { label: 'Sparring', pct: 91, note: 'Highest cognitive + physical demand' },
              { label: 'Mitts / Pads', pct: 76, note: 'Combination speed, reaction training' },
              { label: 'Shadow Boxing', pct: 62, note: 'Technique, footwork, visualization' },
              { label: 'Skipping / Rope', pct: 70, note: 'Footwork rhythm, aerobic base' },
            ].map((mode) => (
              <div key={mode.label} className="mb-2 last:mb-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-slate-300 font-medium">{mode.label}</span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: mode.pct >= 85 ? CRIMSON_BRIGHT : '#f97316' }}
                  >
                    ~{mode.pct}% HRmax
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${mode.pct}%`,
                      background:
                        mode.pct >= 85
                          ? `linear-gradient(90deg, ${CRIMSON_DIM}, ${CRIMSON_BRIGHT})`
                          : `linear-gradient(90deg, rgba(249,115,22,0.4), #f97316)`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-slate-600 mt-0.5">{mode.note}</p>
              </div>
            ))}
          </div>

          {/* Rope skipping research */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-lg"
              style={{ background: CRIMSON_FAINT, color: CRIMSON_BRIGHT }}
            >
              8–12%
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Rope-Skipping Agility Gains (Trecroci 2021)
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                6-week dedicated rope programme improved agility scores 8–12% in amateur boxers,
                translating to faster defensive footwork and ring movement.
              </p>
            </div>
          </div>

          {/* 12-week fight camp */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
            <p className="text-xs font-semibold text-slate-300 mb-2">
              12-Week Fight Camp Structure
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { phase: 'Weeks 1–4', focus: 'Base Building', desc: 'Volume ↑, low intensity, aerobic base' },
                { phase: 'Weeks 5–8', focus: 'Intensification', desc: 'Sparring increases, power work' },
                { phase: 'Weeks 9–12', focus: 'Peak & Taper', desc: 'Sharpen technique, reduce volume' },
              ].map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-700 p-2 text-center"
                  style={i === 1 ? { borderColor: CRIMSON_BORDER, background: CRIMSON_FAINT } : {}}
                >
                  <p
                    className="text-[9px] font-bold"
                    style={{ color: i === 1 ? CRIMSON_BRIGHT : '#64748b' }}
                  >
                    {p.phase}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-300 mt-0.5">{p.focus}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Brain Health & Injury ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <SectionLabel>Health & Safety</SectionLabel>
          <h3 className="text-base font-bold text-slate-100">Brain Health & Injury Science</h3>

          {/* CTE / white matter warning */}
          <div
            className="rounded-xl border p-3"
            style={{ background: 'rgba(220,38,38,0.12)', borderColor: 'rgba(220,38,38,0.4)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded"
                style={{ background: CRIMSON, color: '#fff' }}
              >
                IMPORTANT
              </span>
              <p className="text-xs font-semibold text-red-300">
                Cumulative Exposure & White Matter Changes
              </p>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Bernick 2019 (Professional Fighters Brain Health Study): cumulative fight exposure —
              not individual knockouts — is the primary driver of white matter changes on MRI.
              Dementia pugilistica risk increases with total career sparring rounds.
            </p>
          </div>

          {/* Injury stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500">Retinal Detachment Rate</p>
              <p
                className="text-xl font-black tabular-nums mt-0.5"
                style={{ color: CRIMSON_BRIGHT }}
              >
                0.6%/yr
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Professional fighters (Giovinazzo 1987). Regular ophthalmic screening recommended.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500">Mouthguard Benefit</p>
              <p
                className="text-xl font-black tabular-nums mt-0.5"
                style={{ color: '#22c55e' }}
              >
                67% ↓
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Reduction in dental injury with properly fitted mouthguard.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500">Headgear Policy</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">Removed (amateurs)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                USA Boxing 2016: headgear did not reduce concussion risk; removed from senior
                amateur competition.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-[10px] text-slate-500">Most Common Hand Injury</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">Boxer&apos;s Fracture</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Fracture of the 5th metacarpal neck; typically from incorrect fist alignment on
                impact.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed pt-1">
            All health data is for educational context only. Consult a sports medicine physician
            regarding individual concussion protocols and pre-fight medicals.
          </p>
        </div>

        {/* ── Recent session history ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <SectionLabel>Session Log</SectionLabel>
              <h3 className="text-base font-bold text-slate-100">Recent Sessions</h3>
            </div>
            <span className="text-xs text-slate-500">Sample data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5">
                    Date
                  </th>
                  <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5">
                    Type
                  </th>
                  <th className="text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5">
                    Duration
                  </th>
                  <th className="text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5">
                    kcal
                  </th>
                  <th className="text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-2.5">
                    Avg HR
                  </th>
                  <th className="text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5">
                    Peak HR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {MOCK_SESSIONS.map((s, i) => {
                  const color = typeColor(s.type)
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        i % 2 === 1 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                        {fmtDate(s.date)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color,
                            background: color + '1a',
                            border: `1px solid ${color}44`,
                          }}
                        >
                          {s.type}
                        </span>
                      </td>
                      <td
                        className="px-3 py-3 text-right text-xs font-bold tabular-nums"
                        style={{ color: CRIMSON_BRIGHT }}
                      >
                        {fmtDuration(s.duration)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums text-slate-400">
                        {s.kcal.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-xs tabular-nums text-slate-400">
                        {s.avgHR} bpm
                      </td>
                      <td
                        className="px-4 py-3 text-right text-xs tabular-nums font-semibold"
                        style={{ color: s.peakHR >= 195 ? CRIMSON_BRIGHT : '#f97316' }}
                      >
                        {s.peakHR} bpm
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Disclaimer footer ─────────────────────────────────────────────── */}
        <p className="text-[10px] text-slate-600 text-center leading-relaxed px-4">
          All session data shown is illustrative mock data. Scientific citations are summarised for
          educational reference — consult primary sources and a qualified sports medicine professional
          for clinical guidance.
        </p>
      </main>
    </div>
  )
}
