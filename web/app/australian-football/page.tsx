'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Flame,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  Shield,
  Zap,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionKind = 'full-game' | 'match-sim' | 'training' | 'skills-fitness'

interface AflSession {
  id: number
  date: string
  sessionKind: SessionKind
  durationMin: number
  calories: number
  avgHR: number
  peakHR: number
  distanceKm?: number
}

// ─── Mock data — 20 sessions spanning Mar 2025 – Mar 2026 ────────────────────
// Full game: 90+ min   Match sim: 60–90 min
// Training session: 45–60 min   Skills & fitness: <45 min

const SESSIONS: AflSession[] = [
  // ── Mar 2025 ──
  { id:  1, date: '2025-03-08', sessionKind: 'training',      durationMin:  55, calories:  520, avgHR: 130, peakHR: 168, distanceKm: 6.2 },
  { id:  2, date: '2025-03-15', sessionKind: 'full-game',     durationMin:  98, calories: 1820, avgHR: 160, peakHR: 192, distanceKm: 16.8 },
  // ── Apr 2025 ──
  { id:  3, date: '2025-04-05', sessionKind: 'skills-fitness',durationMin:  38, calories:  340, avgHR: 122, peakHR: 155 },
  { id:  4, date: '2025-04-12', sessionKind: 'training',      durationMin:  58, calories:  545, avgHR: 134, peakHR: 172, distanceKm: 6.8 },
  { id:  5, date: '2025-04-26', sessionKind: 'full-game',     durationMin:  95, calories: 1940, avgHR: 162, peakHR: 190, distanceKm: 17.4 },
  // ── May 2025 ──
  { id:  6, date: '2025-05-10', sessionKind: 'match-sim',     durationMin:  72, calories: 1120, avgHR: 148, peakHR: 181, distanceKm: 10.2 },
  { id:  7, date: '2025-05-17', sessionKind: 'full-game',     durationMin:  94, calories: 1880, avgHR: 159, peakHR: 188, distanceKm: 17.1 },
  { id:  8, date: '2025-05-31', sessionKind: 'skills-fitness',durationMin:  42, calories:  365, avgHR: 124, peakHR: 158 },
  // ── Jun 2025 ──
  { id:  9, date: '2025-06-07', sessionKind: 'training',      durationMin:  60, calories:  580, avgHR: 136, peakHR: 173, distanceKm: 7.1 },
  { id: 10, date: '2025-06-21', sessionKind: 'match-sim',     durationMin:  75, calories: 1150, avgHR: 150, peakHR: 183, distanceKm: 10.7 },
  // ── Jul 2025 ──
  { id: 11, date: '2025-07-05', sessionKind: 'full-game',     durationMin:  96, calories: 1960, avgHR: 163, peakHR: 193, distanceKm: 17.6 },
  { id: 12, date: '2025-07-19', sessionKind: 'training',      durationMin:  57, calories:  530, avgHR: 132, peakHR: 169, distanceKm: 6.5 },
  // ── Aug 2025 ──
  { id: 13, date: '2025-08-02', sessionKind: 'full-game',     durationMin:  93, calories: 1850, avgHR: 158, peakHR: 187, distanceKm: 16.5 },
  { id: 14, date: '2025-08-16', sessionKind: 'skills-fitness',durationMin:  40, calories:  350, avgHR: 120, peakHR: 153 },
  { id: 15, date: '2025-08-30', sessionKind: 'match-sim',     durationMin:  68, calories: 1080, avgHR: 146, peakHR: 178, distanceKm:  9.8 },
  // ── Sep 2025 ──
  { id: 16, date: '2025-09-13', sessionKind: 'full-game',     durationMin:  97, calories: 1990, avgHR: 164, peakHR: 194, distanceKm: 17.9 },
  { id: 17, date: '2025-09-27', sessionKind: 'training',      durationMin:  56, calories:  510, avgHR: 129, peakHR: 166, distanceKm: 6.0 },
  // ── Nov 2025 ──
  { id: 18, date: '2025-11-08', sessionKind: 'skills-fitness',durationMin:  44, calories:  380, avgHR: 126, peakHR: 160 },
  // ── Feb 2026 ──
  { id: 19, date: '2026-02-14', sessionKind: 'training',      durationMin:  62, calories:  595, avgHR: 138, peakHR: 175, distanceKm: 7.3 },
  // ── Mar 2026 ──
  { id: 20, date: '2026-03-01', sessionKind: 'match-sim',     durationMin:  78, calories: 1200, avgHR: 152, peakHR: 185, distanceKm: 11.0 },
  { id: 21, date: '2026-03-15', sessionKind: 'full-game',     durationMin:  96, calories: 1970, avgHR: 162, peakHR: 191, distanceKm: 17.2 },
]

// ─── Derived stats ────────────────────────────────────────────────────────────

const totalSessions    = SESSIONS.length
const fullGames        = SESSIONS.filter((s) => s.sessionKind === 'full-game')
const matchSims        = SESSIONS.filter((s) => s.sessionKind === 'match-sim')
const trainingSessions = SESSIONS.filter((s) => s.sessionKind === 'training')
const skillsSessions   = SESSIONS.filter((s) => s.sessionKind === 'skills-fitness')

const totalCalories    = SESSIONS.reduce((s, d) => s + d.calories, 0)
const totalMinutes     = SESSIONS.reduce((s, d) => s + d.durationMin, 0)
const avgGameCalories  = Math.round(fullGames.reduce((s, d) => s + d.calories, 0) / fullGames.length)
const avgGameDistance  = (
  fullGames.filter((s) => s.distanceKm).reduce((s, d) => s + (d.distanceKm ?? 0), 0) /
  fullGames.filter((s) => s.distanceKm).length
).toFixed(1)
const avgGameHR        = Math.round(fullGames.reduce((s, d) => s + d.avgHR, 0) / fullGames.length)
const peakGameHR       = Math.max(...fullGames.map((s) => s.peakHR))

// ─── Session type breakdown for pie chart ─────────────────────────────────────

const SESSION_PIE = [
  { name: 'Full Game',      value: fullGames.length,        color: COLOR_RED,  pct: Math.round((fullGames.length / totalSessions) * 100) },
  { name: 'Match Sim',      value: matchSims.length,        color: COLOR_GOLD, pct: Math.round((matchSims.length / totalSessions) * 100) },
  { name: 'Training',       value: trainingSessions.length, color: COLOR_AMBER,pct: Math.round((trainingSessions.length / totalSessions) * 100) },
  { name: 'Skills & Fitness', value: skillsSessions.length, color: COLOR_SLATE,pct: Math.round((skillsSessions.length / totalSessions) * 100) },
]

// ─── 8-week weekly calories chart ─────────────────────────────────────────────

const WEEK_COUNT = 8
const weeklyCalData: { week: string; calories: number; isHigh: boolean }[] = []
const refDate = new Date('2026-03-15T12:00:00')

for (let w = WEEK_COUNT - 1; w >= 0; w--) {
  const weekEnd   = new Date(refDate.getTime() - w * 7 * 24 * 60 * 60 * 1000)
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weekSessions = SESSIONS.filter((s) => {
    const d = new Date(s.date + 'T12:00:00')
    return d > weekStart && d <= weekEnd
  })

  const calories = weekSessions.reduce((sum, s) => sum + s.calories, 0)
  const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  weeklyCalData.push({ week: label, calories, isHigh: calories > 1800 })
}

const avgWeeklyCalories = Math.round(
  weeklyCalData.reduce((s, d) => s + d.calories, 0) / WEEK_COUNT
)

// ─── Recent sessions (newest first) ─────────────────────────────────────────

const recentSessions = [...SESSIONS]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 5)

// ─── Colors (AFL red/gold theme) ─────────────────────────────────────────────

const COLOR_RED   = '#ef4444'   // red-500  — primary AFL red
const COLOR_GOLD  = '#eab308'   // yellow-500 — AFL gold
const COLOR_AMBER = '#f97316'   // orange-500 — accent
const COLOR_SLATE = '#94a3b8'   // slate-400  — neutral
const COLOR_MUTED = 'rgba(255,255,255,0.35)'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sessionKindMeta(kind: SessionKind) {
  switch (kind) {
    case 'full-game':      return { label: 'Full Game',       color: COLOR_RED,   hint: '90+ min',    emoji: '🏉' }
    case 'match-sim':      return { label: 'Match Sim',       color: COLOR_GOLD,  hint: '60–90 min',  emoji: '🏃' }
    case 'training':       return { label: 'Training',        color: COLOR_AMBER, hint: '45–60 min',  emoji: '🎯' }
    case 'skills-fitness': return { label: 'Skills & Fitness',color: COLOR_SLATE, hint: '<45 min',    emoji: '⚡' }
  }
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function CalTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; payload: { isHigh: boolean } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const isHigh = payload[0].payload.isHigh
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{
        background: 'hsl(0 0% 10%)',
        borderColor: 'rgba(255,255,255,0.12)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-widest">{label}</p>
      <p style={{ color: isHigh ? COLOR_RED : COLOR_GOLD }}>
        Calories: <span className="font-semibold">{payload[0].value.toLocaleString()}</span>
        <span className="text-white/40 ml-1">kcal</span>
      </p>
      {isHigh && (
        <p className="text-red-400/70 text-[10px] mt-1">High-output week — game included</p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AustralianFootballPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[hsl(0_0%_7%)] text-white">

        {/* ── Sticky header ── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(0_0%_7%)]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono-jb"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Explore
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex-1 flex items-center gap-2.5">
              <span className="text-xl leading-none">🏉</span>
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  Australian Football (AFL) Analysis
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Footy · most demanding team sport
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero card ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: COLOR_RED + '40',
              background: `linear-gradient(135deg, ${COLOR_RED}12 0%, ${COLOR_GOLD}0a 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">🏉</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-2xl font-bold leading-tight text-white tracking-wide">
                  Australian Football (AFL) Analysis
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  AFL is considered the{' '}
                  <span className="text-white/85">world&apos;s most physically demanding team sport</span> — midfielders
                  cover <span className="text-white/85">16–18 km per game</span> at an average speed of
                  125 m/min, including 2.5–3.5 km of{' '}
                  <span className="text-white/85">high-intensity running above 18 km/h</span> (Coutts 2010).
                  Game heart rate sits at <span className="text-white/85">155–165 bpm</span> with peaks of
                  185–195 bpm and a caloric cost of{' '}
                  <span className="text-white/85">1,500–2,200 kcal per game</span>.
                </p>
              </div>
            </div>
          </div>

          {/* ── Summary stats ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest mb-4">
              Season Summary
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Sessions</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-white">{totalSessions}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_RED + '22', color: COLOR_RED }}>
                    {fullGames.length} games
                  </span>
                  <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_GOLD + '22', color: COLOR_GOLD }}>
                    {matchSims.length} sims
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Game Cals</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_RED }}>
                  {avgGameCalories.toLocaleString()}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal per full game</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Distance</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_GOLD }}>
                  {avgGameDistance}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">km per full game</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Game HR</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-rose-400">
                  {avgGameHR}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">bpm · peak {peakGameHR}</p>
              </div>

            </div>
          </div>

          {/* ── Session type breakdown ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Session Type Breakdown
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Full game (90+ min) · Match sim (60–90 min) · Training (45–60 min) · Skills & Fitness (&lt;45 min)
            </p>

            {/* Proportional bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex mb-4">
              <div style={{ width: `${(fullGames.length / totalSessions) * 100}%`,        background: COLOR_RED   }} />
              <div style={{ width: `${(matchSims.length / totalSessions) * 100}%`,        background: COLOR_GOLD  }} />
              <div style={{ width: `${(trainingSessions.length / totalSessions) * 100}%`, background: COLOR_AMBER }} />
              <div style={{ width: `${(skillsSessions.length / totalSessions) * 100}%`,   background: COLOR_SLATE }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Full Game',
                  count: fullGames.length,
                  color: COLOR_RED,
                  hint: '90+ min',
                  avgKcal: Math.round(fullGames.reduce((s, d) => s + d.calories, 0) / fullGames.length),
                  avgDur: Math.round(fullGames.reduce((s, d) => s + d.durationMin, 0) / fullGames.length),
                },
                {
                  label: 'Match Sim',
                  count: matchSims.length,
                  color: COLOR_GOLD,
                  hint: '60–90 min',
                  avgKcal: Math.round(matchSims.reduce((s, d) => s + d.calories, 0) / matchSims.length),
                  avgDur: Math.round(matchSims.reduce((s, d) => s + d.durationMin, 0) / matchSims.length),
                },
                {
                  label: 'Training',
                  count: trainingSessions.length,
                  color: COLOR_AMBER,
                  hint: '45–60 min',
                  avgKcal: Math.round(trainingSessions.reduce((s, d) => s + d.calories, 0) / trainingSessions.length),
                  avgDur: Math.round(trainingSessions.reduce((s, d) => s + d.durationMin, 0) / trainingSessions.length),
                },
                {
                  label: 'Skills & Fitness',
                  count: skillsSessions.length,
                  color: COLOR_SLATE,
                  hint: '<45 min',
                  avgKcal: Math.round(skillsSessions.reduce((s, d) => s + d.calories, 0) / skillsSessions.length),
                  avgDur: Math.round(skillsSessions.reduce((s, d) => s + d.durationMin, 0) / skillsSessions.length),
                },
              ].map(({ label, count, color, hint, avgKcal, avgDur }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1 text-center"
                  style={{ borderColor: color + '33', background: color + '0d' }}
                >
                  <p className="font-rajdhani text-3xl font-bold leading-none" style={{ color }}>
                    {count}
                  </p>
                  <p className="text-[10px] font-mono-jb font-semibold" style={{ color }}>{label}</p>
                  <p className="text-[9px] font-mono-jb text-white/35">{hint}</p>
                  <p className="text-[9px] font-mono-jb text-white/25">{avgDur} min · {avgKcal.toLocaleString()} kcal avg</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Weekly calories chart ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Weekly Calories — Last 8 Weeks
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Total active calories per week. Red bars indicate weeks with a full game (&gt;1,800 kcal).
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyCalData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: COLOR_MUTED }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: COLOR_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(1)}k`}
                />
                <ReferenceLine
                  y={avgWeeklyCalories}
                  stroke={COLOR_GOLD + '60'}
                  strokeDasharray="4 3"
                  label={{
                    value: `avg ${avgWeeklyCalories.toLocaleString()}`,
                    position: 'insideTopRight',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fill: COLOR_GOLD + '90',
                  }}
                />
                <Tooltip content={<CalTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="calories" name="Calories" radius={[3, 3, 0, 0]}>
                  {weeklyCalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isHigh ? COLOR_RED : COLOR_GOLD}
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_GOLD, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Training week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_RED, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Game week (&gt;1,800 kcal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3" style={{ background: COLOR_GOLD, opacity: 0.5 }} />
                <span className="text-[9px] font-mono-jb text-white/35">8-week avg</span>
              </div>
            </div>
          </div>

          {/* ── AFL Fitness Demands ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_RED + '30', background: COLOR_RED + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: COLOR_RED }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                AFL Fitness Demands
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Distance/game',     value: '16–18',   unit: 'km',           color: COLOR_RED,   hint: 'midfielders (Coutts 2010)' },
                { label: 'Avg speed',         value: '125',     unit: 'm/min',         color: COLOR_GOLD,  hint: 'across full game' },
                { label: 'Hi-intensity run',  value: '2.5–3.5', unit: 'km',           color: COLOR_AMBER, hint: '>18 km/h' },
                { label: 'Game calories',     value: '1,500–',  unit: '2,200 kcal',   color: '#f87171',   hint: 'estimated per game' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-lg font-bold leading-tight" style={{ color }}>
                    {value}
                    {unit && <span className="text-xs font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span className="text-red-400/80 font-semibold">Aerobic demand:</span>{' '}
                Gastin et al. (2013) confirmed aerobic metabolism accounts for{' '}
                <span className="text-white/70">88–90% of total energy</span> expenditure in AFL,
                requiring VO₂max of <span className="text-white/70">55–65 mL/kg/min</span> for elite
                midfielders. Game HR sits at <span className="text-white/70">155–165 bpm</span> on
                average, peaking at 185–195 bpm during chase contests and spoils.
              </p>
            </div>
          </div>

          {/* ── Kicking & Handball Biomechanics ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_GOLD + '30', background: COLOR_GOLD + '06' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: COLOR_GOLD }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Kicking &amp; Handball Biomechanics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                {
                  header: 'Drop-Punt Kicking',
                  color: COLOR_GOLD,
                  points: [
                    'Hip internal rotation at ball contact: 570–620°/s (Ball 2008)',
                    'Ball speed: 55–90 km/h depending on technique and intent',
                    'Elite release timing: 0.35–0.42 s from drop (Dichiera 2006)',
                    'Ankle plantar-flexion velocity: key determinant of distance',
                  ],
                },
                {
                  header: 'Handball & Marking',
                  color: COLOR_AMBER,
                  points: [
                    'Handball generates 25–35 km/h via forearm supination–pronation',
                    'Mark-taking: peak GRF at landing 4–7× body weight',
                    'Overhead marks involve eccentric quad load of 3–5× BW',
                    'Rapid deceleration post-mark elevates ACL loading transiently',
                  ],
                },
              ].map(({ header, color, points }) => (
                <div
                  key={header}
                  className="rounded-xl border p-3 space-y-2"
                  style={{ borderColor: color + '2a', background: color + '08' }}
                >
                  <p className="font-rajdhani font-semibold text-xs tracking-wide" style={{ color }}>{header}</p>
                  <ul className="space-y-1">
                    {points.map((pt) => (
                      <li key={pt} className="text-[10px] font-mono-jb text-white/45 leading-relaxed flex items-start gap-1.5">
                        <span style={{ color, opacity: 0.6 }} className="mt-0.5 shrink-0">›</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ── Injury Science ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: '#f87171' + '30', background: '#f8717108' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-red-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Injury Science
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                {
                  header: 'Hamstring Injury',
                  color: '#f87171',
                  points: [
                    'AFL Injury Database (Orchard 2013): 7.4 cases/club/season',
                    'Hamstring strains account for 16% of total games missed',
                    'Eccentric training reduces hamstring incidence by 70% (Askling 2003)',
                    'Biceps femoris long head is the most commonly injured structure',
                  ],
                },
                {
                  header: 'ACL & Load Management',
                  color: COLOR_AMBER,
                  points: [
                    'AFL has highest ACL incidence in professional team sport globally',
                    'AFL-specific warm-up reduces ACL risk by 64% (Nielsen 2016)',
                    'ACWR >1.5 increases soft tissue injury risk 2–4× (Gabbett 2016)',
                    'Optimal ACWR range: 0.8–1.3 for resilience without overexposure',
                  ],
                },
              ].map(({ header, color, points }) => (
                <div
                  key={header}
                  className="rounded-xl border p-3 space-y-2"
                  style={{ borderColor: color + '2a', background: color + '08' }}
                >
                  <p className="font-rajdhani font-semibold text-xs tracking-wide" style={{ color }}>{header}</p>
                  <ul className="space-y-1">
                    {points.map((pt) => (
                      <li key={pt} className="text-[10px] font-mono-jb text-white/45 leading-relaxed flex items-start gap-1.5">
                        <span style={{ color, opacity: 0.6 }} className="mt-0.5 shrink-0">›</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-[10px] font-mono-jb text-white/50 leading-relaxed">
              <span className="text-red-400/80 font-semibold">Key prevention insight: </span>
              Gabbett (2016) showed that well-prepared athletes (high chronic load) can tolerate
              high acute spikes with lower injury risk than under-prepared athletes — but ACWR
              above 1.5 is universally predictive of injury regardless of fitness status.
            </div>
          </div>

          {/* ── Positional Profiles ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Positional Profiles
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  position: 'Midfielders',
                  color: COLOR_RED,
                  emoji: '🔴',
                  stats: [
                    { key: 'Distance/game', val: '16–18 km' },
                    { key: 'VO₂max required', val: '>60 mL/kg/min' },
                    { key: 'Avg speed', val: '125 m/min' },
                    { key: 'Hi-intensity running', val: '2.5–3.5 km' },
                  ],
                },
                {
                  position: 'Ruckmen',
                  color: COLOR_GOLD,
                  emoji: '🟡',
                  stats: [
                    { key: 'Hit-outs/game', val: '50–80' },
                    { key: 'Typical size', val: '200 cm / 100 kg' },
                    { key: 'Power focus', val: 'Vertical leap & explosiveness' },
                    { key: 'Distance/game', val: '10–13 km' },
                  ],
                },
                {
                  position: 'Key Forwards',
                  color: COLOR_AMBER,
                  emoji: '🟠',
                  stats: [
                    { key: 'Sprint efforts', val: '15–20 explosive per game' },
                    { key: 'Distance/game', val: '11–14 km' },
                    { key: 'Marking contests', val: '8–15 per game' },
                    { key: 'Caloric burn', val: '1,400–1,800 kcal' },
                  ],
                },
                {
                  position: 'Small Forwards / Wingmen',
                  color: COLOR_SLATE,
                  emoji: '⚪',
                  stats: [
                    { key: 'Peak speed', val: '34–37 km/h' },
                    { key: 'Acceleration efforts', val: '25–35 per game' },
                    { key: 'Distance/game', val: '13–16 km' },
                    { key: 'Sprint-dominant', val: 'High-intensity focus' },
                  ],
                },
              ].map(({ position, color, emoji, stats }) => (
                <div
                  key={position}
                  className="rounded-xl border p-3.5 space-y-2.5"
                  style={{ borderColor: color + '2a', background: color + '09' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{emoji}</span>
                    <p className="font-rajdhani font-bold text-sm tracking-wide" style={{ color }}>{position}</p>
                  </div>
                  <div className="space-y-1.5">
                    {stats.map(({ key, val }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[9px] font-mono-jb text-white/35 uppercase tracking-wide">{key}</span>
                        <span className="text-[10px] font-mono-jb font-semibold" style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent sessions ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-white/30" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/70">
                Recent Sessions
              </h2>
            </div>

            <div className="space-y-2">
              {recentSessions.map((s) => {
                const meta = sessionKindMeta(s.sessionKind)
                const isGame = s.sessionKind === 'full-game'

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3.5 flex items-center gap-3"
                    style={{ borderColor: meta.color + '28', background: meta.color + '09' }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                      style={{ background: meta.color + '22' }}
                    >
                      {meta.emoji}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-rajdhani font-semibold tracking-wide"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                          style={{ background: meta.color + '22', color: meta.color }}
                        >
                          {meta.hint}
                        </span>
                        {isGame && (
                          <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            Game day
                          </span>
                        )}
                        {s.distanceKm && (
                          <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full bg-white/8 text-white/40">
                            {s.distanceKm} km
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono-jb text-white/35 mt-0.5">{fmtDate(s.date)}</p>
                    </div>

                    {/* Stats */}
                    <div className="shrink-0 text-right space-y-0.5">
                      <p className="font-rajdhani text-base font-semibold text-white leading-none">
                        {s.durationMin} min
                      </p>
                      <p className="text-[10px] font-mono-jb text-white/40">
                        {s.calories.toLocaleString()} kcal · {(s.calories / s.durationMin).toFixed(1)}/min
                      </p>
                      <p className="text-[10px] font-mono-jb text-white/30">
                        avg {s.avgHR} · peak {s.peakHR} bpm
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Science citations ── */}
          <div className="rounded-2xl border border-red-600/20 bg-red-600/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-red-600/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-red-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="rounded-lg border border-red-600/20 bg-red-600/[0.08] p-3 space-y-1">
                  <p className="text-red-300/80 font-semibold text-[11px] font-mono-jb">Key finding to know</p>
                  <p className="text-[10px] font-mono-jb text-white/65 leading-relaxed">
                    AFL is the highest-volume professional team sport by distance — midfielders cover{' '}
                    <span className="text-white font-semibold">16–18 km/game</span> with aerobic
                    metabolism providing <span className="text-white font-semibold">88–90%</span> of
                    total energy (Gastin 2013). This is significantly higher than soccer (10–13 km),
                    rugby union (5–7 km), or basketball (5–7 km) at comparable levels.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-white/55 leading-relaxed font-mono-jb border-l-2 border-red-600/30 pl-3">
                  <p>
                    <span className="text-red-300/80">Coutts AJ et al. (2010)</span>
                    {' '}— "Match running performance of elite Australian rules footballers."
                    {' '}<em>J Sci Med Sport</em> 13(5):543–548.
                    {' '}Midfielders covered 16–18 km/game at 125 m/min average, with 2.5–3.5 km of
                    high-intensity running above 18 km/h — establishing the definitive fitness benchmark
                    for AFL positions.
                  </p>
                  <p>
                    <span className="text-red-300/80">Gastin PB et al. (2013)</span>
                    {' '}— "Perceptions of wellness to guide athlete training in elite Australian football."
                    {' '}<em>Int J Sports Physiol Perform</em> 8(3):340–343.
                    {' '}Aerobic metabolism contributes 88–90% of total energy, requiring VO₂max of
                    55–65 mL/kg/min at elite level. Game HR averages 155–165 bpm peaking at 185–195 bpm.
                  </p>
                  <p>
                    <span className="text-red-300/80">Ball K (2008)</span>
                    {' '}— "Biomechanical considerations of distance kicking in Australian rules football."
                    {' '}<em>Sports Biomech</em> 7(1):10–23.
                    {' '}Hip internal rotation velocity at ball contact: 570–620°/s; ball speeds of
                    55–90 km/h recorded. Ankle plantar-flexion velocity is the primary determinant of
                    kick distance in the drop-punt.
                  </p>
                  <p>
                    <span className="text-red-300/80">Dichiera A et al. (2006)</span>
                    {' '}— "Kinematic patterns associated with accuracy of the drop punt kick in
                    Australian football." <em>J Sci Med Sport</em> 9(4):292–298.
                    {' '}Elite kickers released the ball 0.35–0.42 s after the drop, with tighter
                    timing windows strongly correlating with accuracy scores.
                  </p>
                  <p>
                    <span className="text-red-300/80">Orchard JW et al. (2013)</span>
                    {' '}— "AFL Injury Report 2013." Australian Football League.
                    {' '}Hamstring injuries averaged 7.4 cases per club per season, accounting for 16%
                    of all games missed. AFL has the highest ACL incidence in professional team sport globally.
                  </p>
                  <p>
                    <span className="text-red-300/80">Askling C et al. (2003)</span>
                    {' '}— "Hamstring injury occurrence in elite soccer players after preseason
                    strength training with eccentric overload." <em>Scand J Med Sci Sports</em> 13(4):244–250.
                    {' '}Eccentric training protocol reduced hamstring injury incidence by 70%,
                    with findings broadly applicable to other sprint-dominant sports including AFL.
                  </p>
                  <p>
                    <span className="text-red-300/80">Gabbett TJ (2016)</span>
                    {' '}— "The training–injury prevention paradox: should athletes be training smarter
                    and harder?" <em>Br J Sports Med</em> 50(5):273–280.
                    {' '}ACWR above 1.5 associated with 2–4× injury risk; optimal training zone is
                    0.8–1.3. High chronic loads are protective, not detrimental — it is acute spikes
                    that drive injury in AFL players.
                  </p>
                </div>

                <p className="text-white/30 text-[10px] font-mono-jb">
                  Apple Watch HR and calorie data complement team-level GPS and wearable monitoring
                  but do not replace sports science assessments, AFL-certified rehabilitation
                  programs, or qualified coaching analysis for competitive players.
                </p>
              </div>
            </div>
          </div>

          {/* ── Total calorie footer ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-4">
            <div className="rounded-full p-3 bg-red-600/10 shrink-0">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">
                Total Active Calories — All Sessions
              </p>
              <p className="font-rajdhani text-3xl font-bold leading-none text-red-400">
                {totalCalories.toLocaleString()}
                <span className="font-mono-jb text-sm font-normal text-white/30 ml-1.5">kcal</span>
              </p>
              <p className="text-[10px] font-mono-jb text-white/30 mt-0.5">
                across {totalSessions} sessions · {Math.round(totalMinutes / 60)} hrs total
                · {fullGames.length} full games
              </p>
            </div>
          </div>

          {/* ── Concussion / safety callout ── */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 flex items-start gap-3">
            <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                Contact Load, Concussion &amp; Return to Play
              </p>
              <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                Apple Watch tracks heart rate and motion but cannot measure head impact frequency,
                tackle count, or contact load — primary injury vectors in AFL. Any suspected
                concussion must be assessed under the{' '}
                <span className="text-white/75">AFL Concussion Policy (SCAT6 / CogSport)</span> by
                a qualified team doctor before return to play. Post-game HRV suppression of &gt;20%
                from baseline is an additional recovery indicator complementing this data.
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
