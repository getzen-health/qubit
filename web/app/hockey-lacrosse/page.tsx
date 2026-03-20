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
} from 'recharts'

// ─── Demo data ────────────────────────────────────────────────────────────────
// ~25 sessions spanning Mar 2025 – Mar 2026
// Ice hockey games: 70–90 min, 600–900 kcal
// Ice hockey practices: 45–60 min, 350–500 kcal
// Field hockey games: 65–80 min, 550–780 kcal
// Lacrosse games: 60–80 min, 520–740 kcal
// Drills / skill sessions: 30–45 min, 220–360 kcal

type SportKind = 'ice-hockey' | 'field-hockey' | 'lacrosse'
type SessionKind = 'game' | 'practice' | 'drills'

interface Session {
  id: number
  date: string
  sport: SportKind
  sessionKind: SessionKind
  durationMin: number
  calories: number
  avgHR: number
  peakHR: number
}

const SESSIONS: Session[] = [
  // ── Mar 2025 ──
  { id:  1, date: '2025-03-08', sport: 'ice-hockey',   sessionKind: 'game',     durationMin: 78, calories: 820, avgHR: 172, peakHR: 191 },
  { id:  2, date: '2025-03-15', sport: 'ice-hockey',   sessionKind: 'practice', durationMin: 55, calories: 460, avgHR: 148, peakHR: 179 },
  // ── Apr 2025 ──
  { id:  3, date: '2025-04-05', sport: 'lacrosse',     sessionKind: 'game',     durationMin: 68, calories: 660, avgHR: 164, peakHR: 186 },
  { id:  4, date: '2025-04-12', sport: 'lacrosse',     sessionKind: 'drills',   durationMin: 38, calories: 280, avgHR: 138, peakHR: 167 },
  { id:  5, date: '2025-04-26', sport: 'ice-hockey',   sessionKind: 'game',     durationMin: 82, calories: 855, avgHR: 176, peakHR: 194 },
  // ── May 2025 ──
  { id:  6, date: '2025-05-10', sport: 'lacrosse',     sessionKind: 'practice', durationMin: 52, calories: 420, avgHR: 151, peakHR: 175 },
  { id:  7, date: '2025-05-17', sport: 'lacrosse',     sessionKind: 'game',     durationMin: 72, calories: 700, avgHR: 167, peakHR: 189 },
  { id:  8, date: '2025-05-24', sport: 'field-hockey', sessionKind: 'drills',   durationMin: 40, calories: 310, avgHR: 141, peakHR: 170 },
  // ── Jun 2025 ──
  { id:  9, date: '2025-06-07', sport: 'field-hockey', sessionKind: 'game',     durationMin: 74, calories: 730, avgHR: 169, peakHR: 192 },
  { id: 10, date: '2025-06-14', sport: 'field-hockey', sessionKind: 'practice', durationMin: 58, calories: 490, avgHR: 155, peakHR: 181 },
  { id: 11, date: '2025-06-28', sport: 'lacrosse',     sessionKind: 'drills',   durationMin: 35, calories: 250, avgHR: 136, peakHR: 163 },
  // ── Jul 2025 ──
  { id: 12, date: '2025-07-05', sport: 'field-hockey', sessionKind: 'game',     durationMin: 78, calories: 760, avgHR: 171, peakHR: 193 },
  { id: 13, date: '2025-07-19', sport: 'field-hockey', sessionKind: 'practice', durationMin: 60, calories: 510, avgHR: 157, peakHR: 183 },
  // ── Aug 2025 ──
  { id: 14, date: '2025-08-02', sport: 'lacrosse',     sessionKind: 'game',     durationMin: 75, calories: 720, avgHR: 165, peakHR: 188 },
  { id: 15, date: '2025-08-16', sport: 'lacrosse',     sessionKind: 'practice', durationMin: 50, calories: 400, avgHR: 149, peakHR: 174 },
  { id: 16, date: '2025-08-30', sport: 'field-hockey', sessionKind: 'drills',   durationMin: 42, calories: 330, avgHR: 143, peakHR: 172 },
  // ── Sep 2025 ──
  { id: 17, date: '2025-09-13', sport: 'field-hockey', sessionKind: 'game',     durationMin: 76, calories: 748, avgHR: 170, peakHR: 191 },
  { id: 18, date: '2025-09-27', sport: 'ice-hockey',   sessionKind: 'practice', durationMin: 57, calories: 475, avgHR: 150, peakHR: 180 },
  // ── Oct 2025 ──
  { id: 19, date: '2025-10-11', sport: 'ice-hockey',   sessionKind: 'game',     durationMin: 85, calories: 890, avgHR: 178, peakHR: 196 },
  { id: 20, date: '2025-10-25', sport: 'ice-hockey',   sessionKind: 'drills',   durationMin: 44, calories: 355, avgHR: 142, peakHR: 171 },
  // ── Nov 2025 ──
  { id: 21, date: '2025-11-08', sport: 'ice-hockey',   sessionKind: 'game',     durationMin: 80, calories: 840, avgHR: 174, peakHR: 193 },
  { id: 22, date: '2025-11-22', sport: 'ice-hockey',   sessionKind: 'practice', durationMin: 60, calories: 490, avgHR: 152, peakHR: 182 },
  // ── Jan 2026 ──
  { id: 23, date: '2026-01-10', sport: 'ice-hockey',   sessionKind: 'game',     durationMin: 88, calories: 900, avgHR: 180, peakHR: 197 },
  // ── Feb 2026 ──
  { id: 24, date: '2026-02-08', sport: 'ice-hockey',   sessionKind: 'practice', durationMin: 55, calories: 465, avgHR: 149, peakHR: 178 },
  // ── Mar 2026 ──
  { id: 25, date: '2026-03-15', sport: 'ice-hockey',   sessionKind: 'game',     durationMin: 83, calories: 875, avgHR: 177, peakHR: 195 },
]

// ─── Derived stats ────────────────────────────────────────────────────────────

const totalSessions  = SESSIONS.length
const games          = SESSIONS.filter((s) => s.sessionKind === 'game')
const practices      = SESSIONS.filter((s) => s.sessionKind === 'practice')
const drillSessions  = SESSIONS.filter((s) => s.sessionKind === 'drills')
const gameCount      = games.length
const avgGameCalories = Math.round(games.reduce((s, d) => s + d.calories, 0) / gameCount)
const totalCalories  = SESSIONS.reduce((s, d) => s + d.calories, 0)
const totalMinutes   = SESSIONS.reduce((s, d) => s + d.durationMin, 0)

// Avg kcal/min intensity (all sessions)
const avgKcalPerMin = (totalCalories / totalMinutes).toFixed(1)

// Avg game HR
const avgGameHR = Math.round(games.reduce((s, d) => s + d.avgHR, 0) / gameCount)

// ─── Weekly load chart (12 weeks ending latest session) ──────────────────────

const WEEK_COUNT = 12
const weeklyLoadData: { week: string; load: number; isHigh: boolean }[] = []

const refDate = new Date('2026-03-15T12:00:00')
for (let w = WEEK_COUNT - 1; w >= 0; w--) {
  const weekEnd   = new Date(refDate.getTime() - w * 7 * 24 * 60 * 60 * 1000)
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weekSessions = SESSIONS.filter((s) => {
    const d = new Date(s.date + 'T12:00:00')
    return d > weekStart && d <= weekEnd
  })

  const load = weekSessions.reduce((sum, s) => {
    const multiplier = s.sessionKind === 'game' ? 1.5 : s.sessionKind === 'practice' ? 1.0 : 0.65
    return sum + s.durationMin * multiplier
  }, 0)

  const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  weeklyLoadData.push({ week: label, load: Math.round(load), isHigh: load > 90 })
}

const avgWeeklyLoad = Math.round(
  weeklyLoadData.reduce((s, d) => s + d.load, 0) / WEEK_COUNT
)

// Recent 8 sessions, newest first
const recentSessions = [...SESSIONS]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 8)

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLOR_CYAN   = '#22d3ee'   // cyan-400  — primary accent
const COLOR_TEAL   = '#2dd4bf'   // teal-400  — field hockey
const COLOR_VIOLET = '#a78bfa'   // violet-400 — lacrosse
const COLOR_RED    = '#f87171'   // red-400    — high-load weeks
const COLOR_MUTED  = 'rgba(255,255,255,0.35)'

function sportColor(sport: SportKind) {
  if (sport === 'ice-hockey')   return COLOR_CYAN
  if (sport === 'field-hockey') return COLOR_TEAL
  return COLOR_VIOLET
}

function sportLabel(sport: SportKind) {
  if (sport === 'ice-hockey')   return 'Ice Hockey'
  if (sport === 'field-hockey') return 'Field Hockey'
  return 'Lacrosse'
}

function sportEmoji(sport: SportKind) {
  if (sport === 'ice-hockey')   return '🏒'
  if (sport === 'field-hockey') return '🏑'
  return '🥍'
}

function sessionKindLabel(kind: SessionKind) {
  if (kind === 'game')     return 'Game'
  if (kind === 'practice') return 'Practice'
  return 'Drills'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function LoadTooltip({ active, payload, label }: {
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
      <p style={{ color: isHigh ? COLOR_RED : COLOR_CYAN }}>
        Load: <span className="font-semibold">{payload[0].value}</span>
        <span className="text-white/40 ml-1">AU</span>
      </p>
      {isHigh && (
        <p className="text-red-400/70 text-[10px] mt-1">High-load week — monitor recovery</p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HockeyLacrossePage() {
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
              <span className="text-xl leading-none">🏒</span>
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  Hockey &amp; Lacrosse Analytics
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Intermittent burst sport
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero insight card ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: COLOR_CYAN + '33',
              background: `linear-gradient(135deg, ${COLOR_CYAN}0f 0%, ${COLOR_TEAL}08 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">🏒</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-2xl font-bold leading-tight text-white tracking-wide">
                  {totalSessions} sessions tracked · {gameCount} games, {practices.length} practices, {drillSessions.length} drill sessions
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Ice hockey, field hockey and lacrosse are{' '}
                  <span className="text-white/80">intermittent-burst sports</span> — elite forwards sustain
                  HR between{' '}
                  <span className="text-white/80">170–185 bpm during 40–70 s shifts</span>, executing
                  8–12 high-intensity skating bursts per shift while demanding rapid cardiovascular
                  recovery between efforts (Quinney et al. 2008; Petrella et al. 2007). The
                  aerobic–anaerobic split runs approximately{' '}
                  <span className="text-white/80">70:30</span> across a full game (Twist &amp; Rhodes 1993).
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
                  <span
                    className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_CYAN + '22', color: COLOR_CYAN }}
                  >
                    {gameCount} games
                  </span>
                  <span
                    className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_TEAL + '22', color: COLOR_TEAL }}
                  >
                    {practices.length} practices
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Game Calories</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_CYAN }}>
                  {avgGameCalories}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal avg per game</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Intensity</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_TEAL }}>
                  {avgKcalPerMin}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal / min all sessions</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Game HR</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-rose-400">
                  {avgGameHR}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">bpm across all games</p>
              </div>

            </div>
          </div>

          {/* ── Weekly load chart ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Weekly Training Load — Last 12 Weeks
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Arbitrary units (duration × intensity multiplier). Weeks in red exceed 90 AU — high load threshold.
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyLoadData} barCategoryGap="25%">
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
                  width={28}
                />
                <ReferenceLine
                  y={avgWeeklyLoad}
                  stroke={COLOR_CYAN + '60'}
                  strokeDasharray="4 3"
                  label={{
                    value: `avg ${avgWeeklyLoad}`,
                    position: 'insideTopRight',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fill: COLOR_CYAN + '90',
                  }}
                />
                <Tooltip content={<LoadTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="load" name="Weekly Load" radius={[3, 3, 0, 0]}>
                  {weeklyLoadData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isHigh ? COLOR_RED : COLOR_CYAN}
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_CYAN, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Normal load</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_RED, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">High load (&gt;90 AU)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3" style={{ background: COLOR_CYAN, opacity: 0.5 }} />
                <span className="text-[9px] font-mono-jb text-white/35">12-week avg</span>
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
              Games vs practices vs drills — classified by session duration and type
            </p>

            {/* Proportional bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex mb-3">
              <div style={{ width: `${(gameCount / totalSessions) * 100}%`, background: COLOR_CYAN }} />
              <div style={{ width: `${(practices.length / totalSessions) * 100}%`, background: COLOR_TEAL }} />
              <div style={{ width: `${(drillSessions.length / totalSessions) * 100}%`, background: COLOR_VIOLET }} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Games',
                  count: gameCount,
                  pct: Math.round((gameCount / totalSessions) * 100),
                  color: COLOR_CYAN,
                  avgKcal: Math.round(games.reduce((s, d) => s + d.calories, 0) / gameCount),
                  avgDur: Math.round(games.reduce((s, d) => s + d.durationMin, 0) / gameCount),
                  hint: '≥60 min',
                },
                {
                  label: 'Practices',
                  count: practices.length,
                  pct: Math.round((practices.length / totalSessions) * 100),
                  color: COLOR_TEAL,
                  avgKcal: Math.round(practices.reduce((s, d) => s + d.calories, 0) / practices.length),
                  avgDur: Math.round(practices.reduce((s, d) => s + d.durationMin, 0) / practices.length),
                  hint: '45–60 min',
                },
                {
                  label: 'Drills',
                  count: drillSessions.length,
                  pct: Math.round((drillSessions.length / totalSessions) * 100),
                  color: COLOR_VIOLET,
                  avgKcal: Math.round(drillSessions.reduce((s, d) => s + d.calories, 0) / drillSessions.length),
                  avgDur: Math.round(drillSessions.reduce((s, d) => s + d.durationMin, 0) / drillSessions.length),
                  hint: 'skill & speed',
                },
              ].map(({ label, count, pct, color, avgKcal, avgDur, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1 text-center"
                  style={{ borderColor: color + '33', background: color + '0d' }}
                >
                  <p className="font-rajdhani text-3xl font-bold leading-none" style={{ color }}>
                    {pct}%
                  </p>
                  <p className="text-[10px] font-mono-jb font-semibold" style={{ color }}>{label}</p>
                  <p className="text-[9px] font-mono-jb text-white/35">{count} sessions</p>
                  <p className="text-[9px] font-mono-jb text-white/25">{avgDur} min · {avgKcal} kcal avg</p>
                  <p className="text-[9px] font-mono-jb text-white/20">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Shift physiology callout ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_CYAN + '30', background: COLOR_CYAN + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: COLOR_CYAN }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Shift Physiology — Burst &amp; Recovery Demands
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Shift duration',    value: '40–70',  unit: 's',         color: COLOR_CYAN,   hint: 'ice hockey forwards (Quinney 2008)' },
                { label: 'HR during shift',   value: '170–185', unit: 'bpm',      color: '#f87171',    hint: 'elite forward avg (Quinney 2008)' },
                { label: 'Bursts per shift',  value: '8–12',   unit: '',          color: COLOR_TEAL,   hint: 'high-intensity efforts (Petrella 2007)' },
                { label: 'Aerobic split',     value: '70',     unit: '%',         color: COLOR_VIOLET, hint: 'between-shift recovery (Twist 1993)' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-xl font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-xs font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span className="text-cyan-400/80 font-semibold">Field hockey context:</span>{' '}
                Spencer et al. (2005) found field hockey players cover{' '}
                <span className="text-white/70">9–12 km per game</span> with approximately{' '}
                <span className="text-white/70">16 sprints per half</span> and an average HR
                of 85–92% HRmax — a near-continuous aerobic demand contrasting with ice hockey's
                shift-based intervals.
              </p>
              <p>
                Apple Watch captures this intermittent HR profile well — look for rapid HR spikes
                into the{' '}
                <span className="text-white/70">170–190 bpm range</span> during shift bursts and
                recovery drops of 20–40 bpm between efforts within the same session.
              </p>
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
                const sc  = sportColor(s.sport)
                const sl  = sportLabel(s.sport)
                const se  = sportEmoji(s.sport)
                const kl  = sessionKindLabel(s.sessionKind)
                const isGame = s.sessionKind === 'game'

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3.5 flex items-center gap-3"
                    style={{ borderColor: sc + '28', background: sc + '08' }}
                  >
                    {/* Sport icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                      style={{ background: sc + '22' }}
                    >
                      {se}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-rajdhani font-semibold tracking-wide"
                          style={{ color: sc }}
                        >
                          {sl}
                        </span>
                        <span
                          className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                          style={{ background: sc + '22', color: sc }}
                        >
                          {kl}
                        </span>
                        {isGame && (
                          <span
                            className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                            style={{ background: '#f8717120', color: '#f87171' }}
                          >
                            Full game
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
                        {s.calories} kcal · {(s.calories / s.durationMin).toFixed(1)}/min
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

          {/* ── VO2max & fitness profile ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Hockey &amp; Lacrosse Fitness Profile
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Elite VO₂max',       value: '55–65', unit: 'ml/kg/min', color: COLOR_CYAN,   hint: 'ice hockey forwards (Quinney 2008)' },
                { label: 'Game distance (ice)', value: '5–7',   unit: 'km',        color: COLOR_TEAL,   hint: 'total skating per game (Petrella 2007)' },
                { label: 'Field hockey km',     value: '9–12',  unit: 'km',        color: COLOR_VIOLET, hint: 'per game (Spencer et al. 2005)' },
                { label: 'Sprint efforts',      value: '16+',   unit: '/half',     color: '#f87171',    hint: 'field hockey (Spencer 2005)' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-xl font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-xs font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Science citations ── */}
          <div className="rounded-2xl border border-cyan-600/20 bg-cyan-600/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-cyan-600/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-cyan-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="space-y-3 text-xs text-white/55 leading-relaxed font-mono-jb">

                  {/* Key insight banner */}
                  <div className="rounded-lg border border-cyan-600/20 bg-cyan-600/[0.08] p-3 space-y-1">
                    <p className="text-cyan-300/80 font-semibold text-[11px]">Key finding to know</p>
                    <p className="text-white/65">
                      Ice hockey demands a uniquely{' '}
                      <span className="text-white font-semibold">biphasic cardiovascular response</span>
                      {' '}— maximal anaerobic output during 40–70 s shifts immediately followed by
                      sub-threshold aerobic recovery on the bench. HR rarely returns to true resting
                      levels during a game, sustaining a chronically elevated aerobic base even during
                      "rest" periods (Twist &amp; Rhodes 1993).
                    </p>
                  </div>

                  <div className="border-l-2 border-cyan-600/30 pl-3 space-y-2.5">
                    <p>
                      <span className="text-cyan-300/80">Quinney HA et al. (2008)</span>
                      {' '}— "A 26 year physiological description of a National Hockey League team."
                      {' '}<em>Appl Physiol Nutr Metab</em> 33(4):753–760.
                      {' '}Elite forwards averaged HR of 170–185 bpm on-ice with shifts of 40–70 s;
                      VO₂max ranged 55–65 ml/kg/min — among the highest measured in team sports.
                    </p>
                    <p>
                      <span className="text-cyan-300/80">Petrella NJ et al. (2007)</span>
                      {' '}— "Kinetics of VO₂ with intense intermittent exercise."
                      {' '}<em>J Appl Physiol</em> 102(1):165–173.
                      {' '}Skating demands 8–12 high-intensity bursts per shift; total distance per
                      game approximates 5–7 km when integrated across all shifts and position changes.
                    </p>
                    <p>
                      <span className="text-cyan-300/80">Twist C &amp; Rhodes EC (1993)</span>
                      {' '}— "A physiological analysis of ice hockey positions."
                      {' '}<em>J Strength Cond Res</em> 7(2):120–126.
                      {' '}Ice hockey combines aerobic (between shifts, bench periods) and anaerobic
                      (on-ice bursts) systems in roughly a 70:30 ratio — explaining why both aerobic
                      base and anaerobic peak power are critical to performance.
                    </p>
                    <p>
                      <span className="text-cyan-300/80">Spencer M et al. (2005)</span>
                      {' '}— "Physiological and metabolic responses of repeated-sprint activities."
                      {' '}<em>J Sports Sci</em> 23(7):749–759.
                      {' '}Field hockey players covered 9–12 km per game with approximately 16 sprints
                      per half; average HR held at 85–92% HRmax, demonstrating a more continuous
                      aerobic demand compared to ice hockey's pulsed shift structure.
                    </p>
                  </div>

                  <p className="text-white/30 text-[10px]">
                    Apple Watch HR and calorie data are recorded continuously across sessions.
                    Shift-level burst analysis requires dedicated GPS or optical sensor systems;
                    Watch data reflects whole-session cardiovascular load rather than individual shift peaks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Total calorie footer ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-4">
            <div className="rounded-full p-3 bg-cyan-600/10 shrink-0">
              <Flame className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">
                Total Active Calories — All Sessions
              </p>
              <p className="font-rajdhani text-3xl font-bold leading-none text-cyan-400">
                {totalCalories.toLocaleString()}
                <span className="font-mono-jb text-sm font-normal text-white/30 ml-1.5">kcal</span>
              </p>
              <p className="text-[10px] font-mono-jb text-white/30 mt-0.5">
                across {totalSessions} sessions · {Math.round(totalMinutes / 60)} hrs total
                · {(totalMinutes / totalSessions).toFixed(0)} min avg session
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
