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
  Shield,
  Target,
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

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLOR_VIOLET  = '#a78bfa'   // violet-400  — primary accent
const COLOR_INDIGO  = '#818cf8'   // indigo-400  — secondary
const COLOR_PURPLE  = '#c084fc'   // purple-400  — tertiary
const COLOR_ROSE    = '#fb7185'   // rose-400    — high-intensity / warning
const COLOR_FUCHSIA = '#e879f9'   // fuchsia-400 — special highlight
const COLOR_MUTED   = 'rgba(255,255,255,0.35)'

// ─── Session types ─────────────────────────────────────────────────────────────

type SessionType = 'full-game' | 'team-practice' | 'skills-session' | 'wall-ball'

interface Session {
  id: number
  date: string
  type: SessionType
  durationMin: number
  calories: number
  avgHR: number
  peakHR: number
  distanceKm: number
}

function sessionTypeLabel(t: SessionType): string {
  if (t === 'full-game')      return 'Full Game'
  if (t === 'team-practice')  return 'Team Practice'
  if (t === 'skills-session') return 'Skills Session'
  return 'Wall Ball'
}

function sessionTypeColor(t: SessionType): string {
  if (t === 'full-game')      return COLOR_ROSE
  if (t === 'team-practice')  return COLOR_VIOLET
  if (t === 'skills-session') return COLOR_INDIGO
  return COLOR_PURPLE
}

function sessionTypeHint(t: SessionType): string {
  if (t === 'full-game')      return '90 min+'
  if (t === 'team-practice')  return '60–90 min'
  if (t === 'skills-session') return '30–60 min'
  return '< 30 min'
}

// ─── Mock sessions (field lacrosse, Mar 2025 – Mar 2026) ─────────────────────
// Full game: 90–100 min, 620–780 kcal, avg HR 155–168, peak 183–195, 5.5–7.5 km
// Team practice: 65–85 min, 440–560 kcal, avg HR 145–158, peak 175–188, 3.5–5 km
// Skills session: 35–55 min, 270–380 kcal, avg HR 132–148, peak 165–179, 2–3.5 km
// Wall ball: 18–28 min, 130–200 kcal, avg HR 115–130, peak 148–162, —

const SESSIONS: Session[] = [
  // ── Mar 2025 ──
  { id:  1, date: '2025-03-09', type: 'full-game',      durationMin: 94,  calories: 720, avgHR: 161, peakHR: 191, distanceKm: 6.8 },
  { id:  2, date: '2025-03-16', type: 'team-practice',  durationMin: 72,  calories: 490, avgHR: 151, peakHR: 179, distanceKm: 4.2 },
  { id:  3, date: '2025-03-22', type: 'wall-ball',      durationMin: 22,  calories: 155, avgHR: 122, peakHR: 150, distanceKm: 0.0 },
  // ── Apr 2025 ──
  { id:  4, date: '2025-04-05', type: 'full-game',      durationMin: 98,  calories: 755, avgHR: 163, peakHR: 192, distanceKm: 7.1 },
  { id:  5, date: '2025-04-13', type: 'team-practice',  durationMin: 80,  calories: 535, avgHR: 153, peakHR: 182, distanceKm: 4.8 },
  { id:  6, date: '2025-04-19', type: 'skills-session', durationMin: 48,  calories: 330, avgHR: 141, peakHR: 170, distanceKm: 2.9 },
  { id:  7, date: '2025-04-27', type: 'wall-ball',      durationMin: 25,  calories: 178, avgHR: 125, peakHR: 155, distanceKm: 0.0 },
  // ── May 2025 ──
  { id:  8, date: '2025-05-04', type: 'full-game',      durationMin: 92,  calories: 698, avgHR: 158, peakHR: 188, distanceKm: 6.5 },
  { id:  9, date: '2025-05-11', type: 'team-practice',  durationMin: 75,  calories: 512, avgHR: 155, peakHR: 184, distanceKm: 4.5 },
  { id: 10, date: '2025-05-17', type: 'skills-session', durationMin: 52,  calories: 358, avgHR: 144, peakHR: 174, distanceKm: 3.2 },
  { id: 11, date: '2025-05-24', type: 'full-game',      durationMin: 96,  calories: 740, avgHR: 162, peakHR: 193, distanceKm: 7.0 },
  // ── Jun 2025 ──
  { id: 12, date: '2025-06-08', type: 'team-practice',  durationMin: 82,  calories: 548, avgHR: 156, peakHR: 186, distanceKm: 4.9 },
  { id: 13, date: '2025-06-15', type: 'skills-session', durationMin: 45,  calories: 305, avgHR: 138, peakHR: 167, distanceKm: 2.6 },
  { id: 14, date: '2025-06-21', type: 'full-game',      durationMin: 100, calories: 768, avgHR: 164, peakHR: 194, distanceKm: 7.4 },
  { id: 15, date: '2025-06-28', type: 'wall-ball',      durationMin: 20,  calories: 142, avgHR: 118, peakHR: 148, distanceKm: 0.0 },
  // ── Jul 2025 ──
  { id: 16, date: '2025-07-06', type: 'full-game',      durationMin: 95,  calories: 728, avgHR: 160, peakHR: 189, distanceKm: 6.7 },
  { id: 17, date: '2025-07-13', type: 'team-practice',  durationMin: 78,  calories: 525, avgHR: 154, peakHR: 183, distanceKm: 4.6 },
  { id: 18, date: '2025-07-20', type: 'skills-session', durationMin: 50,  calories: 342, avgHR: 143, peakHR: 172, distanceKm: 3.0 },
  // ── Aug 2025 ──
  { id: 19, date: '2025-08-03', type: 'full-game',      durationMin: 93,  calories: 712, avgHR: 159, peakHR: 187, distanceKm: 6.6 },
  { id: 20, date: '2025-08-10', type: 'team-practice',  durationMin: 70,  calories: 470, avgHR: 149, peakHR: 178, distanceKm: 4.1 },
  { id: 21, date: '2025-08-17', type: 'wall-ball',      durationMin: 24,  calories: 168, avgHR: 120, peakHR: 152, distanceKm: 0.0 },
  { id: 22, date: '2025-08-23', type: 'skills-session', durationMin: 54,  calories: 370, avgHR: 146, peakHR: 176, distanceKm: 3.3 },
  // ── Sep 2025 ──
  { id: 23, date: '2025-09-07', type: 'full-game',      durationMin: 97,  calories: 748, avgHR: 162, peakHR: 191, distanceKm: 7.2 },
  { id: 24, date: '2025-09-14', type: 'team-practice',  durationMin: 76,  calories: 508, avgHR: 152, peakHR: 181, distanceKm: 4.4 },
  // ── Oct 2025 ──
  { id: 25, date: '2025-10-05', type: 'full-game',      durationMin: 91,  calories: 695, avgHR: 157, peakHR: 186, distanceKm: 6.4 },
  { id: 26, date: '2025-10-12', type: 'skills-session', durationMin: 40,  calories: 278, avgHR: 135, peakHR: 165, distanceKm: 2.4 },
  { id: 27, date: '2025-10-19', type: 'team-practice',  durationMin: 73,  calories: 495, avgHR: 153, peakHR: 182, distanceKm: 4.3 },
  // ── Nov 2025 ──
  { id: 28, date: '2025-11-02', type: 'full-game',      durationMin: 99,  calories: 762, avgHR: 163, peakHR: 193, distanceKm: 7.3 },
  { id: 29, date: '2025-11-09', type: 'wall-ball',      durationMin: 27,  calories: 195, avgHR: 127, peakHR: 158, distanceKm: 0.0 },
  // ── Jan 2026 ──
  { id: 30, date: '2026-01-11', type: 'team-practice',  durationMin: 80,  calories: 540, avgHR: 155, peakHR: 185, distanceKm: 4.7 },
  { id: 31, date: '2026-01-18', type: 'skills-session', durationMin: 46,  calories: 318, avgHR: 140, peakHR: 169, distanceKm: 2.8 },
  // ── Feb 2026 ──
  { id: 32, date: '2026-02-08', type: 'full-game',      durationMin: 96,  calories: 735, avgHR: 161, peakHR: 190, distanceKm: 6.9 },
  { id: 33, date: '2026-02-15', type: 'team-practice',  durationMin: 74,  calories: 500, avgHR: 152, peakHR: 180, distanceKm: 4.3 },
  { id: 34, date: '2026-02-22', type: 'wall-ball',      durationMin: 23,  calories: 162, avgHR: 121, peakHR: 151, distanceKm: 0.0 },
  // ── Mar 2026 ──
  { id: 35, date: '2026-03-08', type: 'full-game',      durationMin: 95,  calories: 725, avgHR: 160, peakHR: 189, distanceKm: 6.8 },
  { id: 36, date: '2026-03-15', type: 'team-practice',  durationMin: 77,  calories: 518, avgHR: 154, peakHR: 183, distanceKm: 4.5 },
]

// ─── Derived stats ─────────────────────────────────────────────────────────────

const totalSessions = SESSIONS.length
const totalCalories = SESSIONS.reduce((s, d) => s + d.calories, 0)
const totalMinutes  = SESSIONS.reduce((s, d) => s + d.durationMin, 0)

const games         = SESSIONS.filter((s) => s.type === 'full-game')
const practices     = SESSIONS.filter((s) => s.type === 'team-practice')
const skillsSesx    = SESSIONS.filter((s) => s.type === 'skills-session')
const wallBall      = SESSIONS.filter((s) => s.type === 'wall-ball')

const avgGameCalories = Math.round(games.reduce((s, d) => s + d.calories, 0) / games.length)
const avgGameHR       = Math.round(games.reduce((s, d) => s + d.avgHR, 0) / games.length)
const avgGameKm       = (games.reduce((s, d) => s + d.distanceKm, 0) / games.length).toFixed(1)
const avgKcalPerMin   = (totalCalories / totalMinutes).toFixed(1)

// ─── Weekly calorie chart (last 8 weeks ending 2026-03-15) ───────────────────

const WEEK_COUNT = 8
const weeklyCalData: { week: string; calories: number; sessions: number }[] = []

const refDate = new Date('2026-03-15T12:00:00')
for (let w = WEEK_COUNT - 1; w >= 0; w--) {
  const weekEnd   = new Date(refDate.getTime() - w * 7 * 24 * 60 * 60 * 1000)
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
  const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const weekSessions = SESSIONS.filter((s) => {
    const d = new Date(s.date + 'T12:00:00')
    return d > weekStart && d <= weekEnd
  })

  weeklyCalData.push({
    week: label,
    calories: weekSessions.reduce((sum, s) => sum + s.calories, 0),
    sessions: weekSessions.length,
  })
}

const avgWeeklyKcal = Math.round(
  weeklyCalData.reduce((s, d) => s + d.calories, 0) / WEEK_COUNT
)

// Recent 5 sessions, newest first
const recentSessions = [...SESSIONS]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 5)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function CalTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; payload: { sessions: number } }>
  label?: string
}) {
  if (!active || !payload?.length) return null
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
      <p style={{ color: COLOR_VIOLET }}>
        Calories: <span className="font-semibold">{payload[0].value.toLocaleString()}</span>
        <span className="text-white/40 ml-1">kcal</span>
      </p>
      <p className="text-white/40 text-[10px] mt-0.5">
        {payload[0].payload.sessions} session{payload[0].payload.sessions !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Injury badge ─────────────────────────────────────────────────────────────

function InjuryBadge({ pct, label, color }: { pct: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono-jb text-[10px] text-white/50 w-8 text-right shrink-0">{pct}%</span>
      <span className="font-mono-jb text-[10px] text-white/40 shrink-0 min-w-[80px]">{label}</span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LacrossePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[hsl(0_0%_7%)] text-white">

        {/* ── Sticky header ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(0_0%_7%)]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono-jb"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex-1 flex items-center gap-2.5">
              <span className="text-xl leading-none">🥍</span>
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  Lacrosse Analysis
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Shot · Cradle · Game Load
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero card ──────────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: COLOR_VIOLET + '33',
              background: `linear-gradient(135deg, ${COLOR_VIOLET}0f 0%, ${COLOR_INDIGO}08 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">🥍</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-2xl font-bold leading-tight text-white tracking-wide">
                  Lacrosse Analysis
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Field lacrosse is a{' '}
                  <span className="text-white/80">high-intensity intermittent sport</span> combining
                  explosive 4–8 s change-of-direction efforts with sustained aerobic demand. Elite
                  midfielders cover{' '}
                  <span className="text-white/80">5.5–7.5 km per game</span> while generating
                  overhand shot velocities of{' '}
                  <span className="text-white/80">130–160 km/h</span> — driven by precise
                  wrist mechanics and pocket depth. Cradling physics, shot placement accuracy,
                  and game load management distinguish elite players (Goss 2013; Tierney 2016).
                </p>
              </div>
            </div>
          </div>

          {/* ── Summary stats ──────────────────────────────────────────────────── */}
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
                    style={{ background: COLOR_ROSE + '22', color: COLOR_ROSE }}
                  >
                    {games.length} games
                  </span>
                  <span
                    className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_VIOLET + '22', color: COLOR_VIOLET }}
                  >
                    {practices.length} practices
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Game Calories</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_ROSE }}>
                  {avgGameCalories}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal avg per game</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Game Distance</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_VIOLET }}>
                  {avgGameKm}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">km avg per game</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Game HR</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_FUCHSIA }}>
                  {avgGameHR}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">bpm avg across games</p>
              </div>

            </div>
          </div>

          {/* ── Session type breakdown ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Session Type Breakdown
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Full games, team practices, skills sessions, and wall ball reps — each with distinct
              physiological demands and training stimulus.
            </p>

            {/* Proportional bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex mb-4">
              <div style={{ width: `${(games.length / totalSessions) * 100}%`, background: COLOR_ROSE }} />
              <div style={{ width: `${(practices.length / totalSessions) * 100}%`, background: COLOR_VIOLET }} />
              <div style={{ width: `${(skillsSesx.length / totalSessions) * 100}%`, background: COLOR_INDIGO }} />
              <div style={{ width: `${(wallBall.length / totalSessions) * 100}%`, background: COLOR_PURPLE }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { group: games,      type: 'full-game'      as SessionType },
                  { group: practices,  type: 'team-practice'  as SessionType },
                  { group: skillsSesx, type: 'skills-session' as SessionType },
                  { group: wallBall,   type: 'wall-ball'      as SessionType },
                ] as { group: Session[]; type: SessionType }[]
              ).map(({ group, type }) => {
                const color   = sessionTypeColor(type)
                const label   = sessionTypeLabel(type)
                const hint    = sessionTypeHint(type)
                const pct     = Math.round((group.length / totalSessions) * 100)
                const avgKcal = group.length > 0
                  ? Math.round(group.reduce((s, d) => s + d.calories, 0) / group.length)
                  : 0
                const avgDur = group.length > 0
                  ? Math.round(group.reduce((s, d) => s + d.durationMin, 0) / group.length)
                  : 0
                return (
                  <div
                    key={type}
                    className="rounded-xl border p-3 space-y-1 text-center"
                    style={{ borderColor: color + '33', background: color + '0d' }}
                  >
                    <p className="font-rajdhani text-3xl font-bold leading-none" style={{ color }}>
                      {pct}%
                    </p>
                    <p className="text-[10px] font-mono-jb font-semibold" style={{ color }}>{label}</p>
                    <p className="text-[9px] font-mono-jb text-white/35">{group.length} sessions</p>
                    <p className="text-[9px] font-mono-jb text-white/25">
                      {avgDur > 0 ? `${avgDur} min` : '—'}
                      {avgKcal > 0 ? ` · ${avgKcal} kcal` : ''}
                    </p>
                    <p className="text-[9px] font-mono-jb text-white/20">{hint}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Weekly calories chart ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Weekly Active Calories — Last 8 Weeks
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              At 8–11 METs, field lacrosse burns 550–750 kcal/h. Game weeks show the largest spikes
              driven by sustained HR of 145–155 bpm (Root 2015).
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyCalData} barCategoryGap="28%">
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
                  tickFormatter={(v: number) => v > 0 ? `${v}` : '0'}
                />
                <ReferenceLine
                  y={avgWeeklyKcal}
                  stroke={COLOR_VIOLET + '60'}
                  strokeDasharray="4 3"
                  label={{
                    value: `avg ${avgWeeklyKcal}`,
                    position: 'insideTopRight',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fill: COLOR_VIOLET + '90',
                  }}
                />
                <Tooltip content={<CalTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="calories" name="Calories" radius={[3, 3, 0, 0]}>
                  {weeklyCalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.calories > avgWeeklyKcal ? COLOR_ROSE : COLOR_VIOLET}
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_VIOLET, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Below avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_ROSE, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Above avg (game week)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3" style={{ background: COLOR_VIOLET, opacity: 0.5 }} />
                <span className="text-[9px] font-mono-jb text-white/35">8-week avg</span>
              </div>
            </div>
          </div>

          {/* ── Game Load & Intensity ─────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_ROSE + '30', background: COLOR_ROSE + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4" style={{ color: COLOR_ROSE }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Game Load &amp; Intensity
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Game distance',     value: '5.5–7.5', unit: 'km',    color: COLOR_ROSE,    hint: 'field lacrosse (Kelly 2012)' },
                { label: 'Explosive efforts', value: '250–350', unit: '',       color: COLOR_VIOLET,  hint: 'per game (Kelly 2012)' },
                { label: 'Change of dir.',    value: 'q 4–8',   unit: 's',     color: COLOR_INDIGO,  hint: 'frequency (Kelly 2012)' },
                { label: 'Box lacrosse HR',   value: '160–170', unit: 'bpm',   color: COLOR_FUCHSIA, hint: 'vs field 145–155 (Root 2015)' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-xl font-bold leading-none" style={{ color }}>
                    {value.startsWith('q ') ? value.slice(2) : value}
                    {unit && <span className="text-xs font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span style={{ color: COLOR_ROSE }} className="font-semibold">MET intensity:</span>{' '}
                Field lacrosse sits at{' '}
                <span className="text-white/70">8–11 METs</span>, producing 550–750 kcal/h —
                equivalent to competitive soccer or basketball. Elite midfielder{' '}
                <span className="text-white/70">VO₂max: 55–65 mL/kg/min</span> required for
                full-game performance without significant fatigue in Q4 (Tierney 2016).
              </p>
              <p>
                Box lacrosse sustains a higher HR (160–170 bpm) than field (145–155 bpm) due to
                the enclosed environment, shorter shifts, and near-continuous intensity — a profile
                closer to ice hockey's interval demands (Root 2015).
              </p>
            </div>
          </div>

          {/* ── Shot Mechanics ────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_INDIGO + '30', background: COLOR_INDIGO + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: COLOR_INDIGO }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Shot Mechanics
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'MLL overhand speed', value: '130–160', unit: 'km/h', color: COLOR_INDIGO,  hint: 'Goss 2013' },
                { label: 'Wrist flex contrib.', value: '60–70',  unit: '%',    color: COLOR_VIOLET,  hint: 'of shot velocity (Schroeder 2017)' },
                { label: 'Angular error',       value: '<6',      unit: '°',    color: COLOR_FUCHSIA, hint: 'elite placement (Schertz 2020)' },
                { label: 'Target fixation',     value: '200–350', unit: 'ms',   color: COLOR_ROSE,    hint: 'before release (Schertz 2020)' },
                { label: 'Release point',       value: 'Pocket',  unit: '',     color: COLOR_PURPLE,  hint: 'depth-dependent (Schroeder 2017)' },
                { label: 'Accuracy floor',      value: 'Top-hand', unit: '',    color: COLOR_INDIGO,  hint: 'wrist flex is primary driver' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-lg font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-xs font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span style={{ color: COLOR_INDIGO }} className="font-semibold">Key insight (Schroeder 2017):</span>{' '}
                Top-hand wrist flexion generates{' '}
                <span className="text-white/70">60–70% of overhand shot velocity</span>. Pocket
                depth determines the release point — a deeper pocket delays release and increases
                power window; a shallower pocket enables a faster, more accurate flick shot.
              </p>
              <p>
                <span style={{ color: COLOR_FUCHSIA }} className="font-semibold">Visual fixation (Schertz 2020):</span>{' '}
                Elite players fixate on target for{' '}
                <span className="text-white/70">200–350 ms before release</span>, achieving
                angular errors below 6°. Novice players fixate less than 100 ms before release,
                producing 2–3x more angular error under pressure.
              </p>
            </div>
          </div>

          {/* ── Cradling Physics ──────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_PURPLE + '30', background: COLOR_PURPLE + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: COLOR_PURPLE }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Cradling Physics
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Centripetal accel.',   value: 'a=v²/r',  unit: '',       color: COLOR_PURPLE,  hint: 'keeps ball seated in pocket' },
                { label: 'Angular velocity',     value: '45–60',   unit: '°/s',    color: COLOR_VIOLET,  hint: 'per cradle cycle' },
                { label: 'Wall ball (per hand)', value: '500+',    unit: 'reps',   color: COLOR_INDIGO,  hint: 'daily minimum for elite' },
                { label: 'Scoop stick angle',    value: '20–30',   unit: '°',      color: COLOR_ROSE,    hint: 'ground ball mechanics' },
                { label: 'Off-hand reps',        value: 'Critical', unit: '',      color: COLOR_FUCHSIA, hint: 'for ambidexterity' },
                { label: 'Pocket force',         value: 'Centripetal', unit: '',   color: COLOR_PURPLE,  hint: 'outward force retains ball' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-lg font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-xs font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span style={{ color: COLOR_PURPLE }} className="font-semibold">The physics:</span>{' '}
                Cradling exploits centripetal acceleration (a = v²/r) — rotating the stick
                generates outward force that seats the ball against the mesh. At{' '}
                <span className="text-white/70">45–60°/s per cycle</span>, the force exceeds
                gravity and prevents ball loss during full-speed sprinting or body checks.
              </p>
              <p>
                <span style={{ color: COLOR_INDIGO }} className="font-semibold">Ground ball scoop:</span>{' '}
                Optimal stick angle of{' '}
                <span className="text-white/70">20–30°</span> at impact maximises mesh contact
                and minimises bounce-back. Off-hand repetitions are critical — elite players
                cradle, pass, and shoot effectively with both hands, eliminating predictable
                body positioning that defenders exploit.
              </p>
            </div>
          </div>

          {/* ── Injury Prevention ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_FUCHSIA + '25', background: COLOR_FUCHSIA + '06' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" style={{ color: COLOR_FUCHSIA }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Injury Prevention
              </h2>
            </div>

            {/* Injury site breakdown */}
            <div className="space-y-2 mb-4">
              <p className="text-[9px] font-mono-jb text-white/30 uppercase tracking-widest mb-2">
                Injury Site Distribution (Barber 2017)
              </p>
              <InjuryBadge pct={26} label="Shoulder / AC joint" color={COLOR_ROSE}    />
              <InjuryBadge pct={24} label="Knee / ACL"          color={COLOR_VIOLET}  />
              <InjuryBadge pct={20} label="Head / Neck"         color={COLOR_FUCHSIA} />
              <InjuryBadge pct={30} label="Other"               color={COLOR_INDIGO}  />
            </div>

            <div className="space-y-2 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span style={{ color: COLOR_FUCHSIA }} className="font-semibold">ACL risk:</span>{' '}
                Women's lacrosse carries a higher ACL injury rate than men's due to the absence
                of body checking — players change direction without contact cues, reducing neuromuscular
                anticipation. A{' '}
                <span className="text-white/70">FIFA 11+ adapted warm-up reduces ACL incidence by 32%</span>{' '}
                when applied consistently before practice and games.
              </p>
              <p>
                <span style={{ color: COLOR_ROSE }} className="font-semibold">Concussion rate:</span>{' '}
                <span className="text-white/70">0.26 per 1,000 athletic exposures</span>{' '}
                (Barber 2017). Gloves protect against stick impacts to the hand; hamate fractures
                from grip trauma are significantly underdiagnosed and should be suspected in
                players with persistent hypothenar pain after a stick check.
              </p>
              <p>
                <span style={{ color: COLOR_VIOLET }} className="font-semibold">AC joint separation</span>{' '}
                occurs primarily from checks and falls onto the shoulder — the most common acute
                injury in men's lacrosse. Proper shoulder strengthening (rotator cuff, rear deltoid)
                and fall technique reduce severity.
              </p>
            </div>
          </div>

          {/* ── Recent sessions ───────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-white/30" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/70">
                Recent Sessions
              </h2>
            </div>

            <div className="space-y-2">
              {recentSessions.map((s) => {
                const color = sessionTypeColor(s.type)
                const label = sessionTypeLabel(s.type)
                const hint  = sessionTypeHint(s.type)
                const kcalPerMin = (s.calories / s.durationMin).toFixed(1)

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3.5 flex items-center gap-3"
                    style={{ borderColor: color + '28', background: color + '08' }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                      style={{ background: color + '22' }}
                    >
                      🥍
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-rajdhani font-semibold tracking-wide"
                          style={{ color }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                          style={{ background: color + '22', color }}
                        >
                          {hint}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono-jb text-white/35 mt-0.5">{fmtDate(s.date)}</p>
                    </div>

                    {/* Stats */}
                    <div className="shrink-0 text-right space-y-0.5">
                      <p className="font-rajdhani text-base font-semibold text-white leading-none">
                        {s.durationMin} min
                      </p>
                      <p className="text-[10px] font-mono-jb text-white/40">
                        {s.calories} kcal · {kcalPerMin}/min
                      </p>
                      <p className="text-[10px] font-mono-jb text-white/30">
                        avg {s.avgHR} · peak {s.peakHR} bpm
                        {s.distanceKm > 0 ? ` · ${s.distanceKm} km` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Fitness profile ───────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Elite Lacrosse Fitness Profile
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Midfielder VO₂max', value: '55–65', unit: 'mL/kg/min', color: COLOR_VIOLET,  hint: 'elite (Tierney 2016)' },
                { label: 'Intensity',          value: '8–11',  unit: 'METs',      color: COLOR_INDIGO,  hint: '550–750 kcal/h' },
                { label: 'Shot velocity',      value: '130–160', unit: 'km/h',    color: COLOR_ROSE,    hint: 'MLL overhand (Goss 2013)' },
                { label: 'Sprint frequency',   value: '4–8',   unit: 's CoD',     color: COLOR_FUCHSIA, hint: 'change of dir. (Kelly 2012)' },
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

          {/* ── Science citations ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-violet-600/20 bg-violet-600/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-violet-600/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-violet-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="space-y-3 text-xs text-white/55 leading-relaxed font-mono-jb">

                  <div className="rounded-lg border border-violet-600/20 bg-violet-600/[0.08] p-3 space-y-1">
                    <p className="text-violet-300/80 font-semibold text-[11px]">Key finding to know</p>
                    <p className="text-white/65">
                      Lacrosse is a{' '}
                      <span className="text-white font-semibold">multi-skill explosiveness sport</span>{' '}
                      — wrist mechanics, cradling physics, and visual fixation precision each
                      independently limit shot quality. Training volume without technique refinement
                      plateaus early; elite shot velocity gains after age 18 are predominantly driven
                      by wrist-flexion power and pocket-to-release timing, not overall strength (Schroeder 2017).
                    </p>
                  </div>

                  <div className="border-l-2 border-violet-600/30 pl-3 space-y-2.5">
                    <p>
                      <span className="text-violet-300/80">Kelly DM et al. (2012)</span>
                      {' '}— "Activity profiles of male lacrosse athletes."
                      {' '}<em>J Strength Cond Res</em>.
                      {' '}Field lacrosse midfielders cover 5.5–7.5 km per game, executing
                      250–350 explosive efforts and changing direction every 4–8 s throughout a 60-min
                      game — comparable to soccer in aerobic demand but with higher explosive frequency.
                    </p>
                    <p>
                      <span className="text-violet-300/80">Root H et al. (2015)</span>
                      {' '}— "Comparison of box and field lacrosse physiological demands."
                      {' '}Box lacrosse averages HR of 160–170 bpm vs field lacrosse 145–155 bpm,
                      driven by the confined court environment, enforced shift structure, and higher
                      density of contact and offensive events per minute.
                    </p>
                    <p>
                      <span className="text-violet-300/80">Goss DL et al. (2013)</span>
                      {' '}— "Biomechanical analysis of the overhand lacrosse shot."
                      {' '}<em>J Sports Sci Med</em>.
                      {' '}MLL players produce overhand shot velocities of 130–160 km/h;
                      velocity scales primarily with angular momentum generated in the kinetic chain
                      from hip rotation through to wrist snap at release.
                    </p>
                    <p>
                      <span className="text-violet-300/80">Schroeder MJ et al. (2017)</span>
                      {' '}— "Wrist kinematics and shot mechanics in lacrosse."
                      {' '}Top-hand wrist flexion contributes 60–70% of final shot velocity;
                      pocket depth alters release timing — a 5 mm increase in pocket depth
                      delays release by approximately 8 ms and increases power delivery window.
                    </p>
                    <p>
                      <span className="text-violet-300/80">Schertz ML et al. (2020)</span>
                      {' '}— "Visual fixation and accuracy in lacrosse shooting."
                      {' '}<em>J Sport Sci</em>.
                      {' '}Elite players achieve angular errors below 6° through target fixation
                      of 200–350 ms pre-release; novice fixation under 100 ms correlates with
                      2–3x greater error, confirming visual quiet-eye training as a key accuracy lever.
                    </p>
                    <p>
                      <span className="text-violet-300/80">Tierney RT et al. (2016)</span>
                      {' '}— "Physiological and performance characteristics of elite lacrosse players."
                      {' '}<em>J Athl Train</em> 51(4):297–302.
                      {' '}Elite midfielders show VO₂max of 55–65 mL/kg/min; intensity during play
                      averages 8–11 METs producing 550–750 kcal/h — requiring substantial aerobic
                      base to sustain fourth-quarter performance quality.
                    </p>
                    <p>
                      <span className="text-violet-300/80">Barber Foss KD et al. (2017)</span>
                      {' '}— "Injury epidemiology in high school lacrosse."
                      {' '}<em>J Athl Train</em>.
                      {' '}Shoulder injuries account for 26% (primarily AC joint from checks/falls),
                      knee 24% (ACL higher in women's due to no body checking), head/neck 20%
                      (concussion rate 0.26/1,000 AE). Hamate fractures from grip trauma are
                      frequently missed on standard radiographs; CT or MRI required for diagnosis.
                    </p>
                  </div>

                  <p className="text-white/30 text-[10px]">
                    Apple Watch captures whole-session HR and calorie data. Shot velocity,
                    cradle angular velocity, and visual fixation metrics require dedicated
                    sports-science systems (radar gun, IMU sensors, eye-tracking). Watch data
                    reflects cardiovascular load and game distance via GPS — useful for
                    monitoring game load trends across a season.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Total calorie footer ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-4">
            <div className="rounded-full p-3 bg-violet-600/10 shrink-0">
              <Flame className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">
                Total Active Calories — All Sessions
              </p>
              <p className="font-rajdhani text-3xl font-bold leading-none text-violet-400">
                {totalCalories.toLocaleString()}
                <span className="font-mono-jb text-sm font-normal text-white/30 ml-1.5">kcal</span>
              </p>
              <p className="text-[10px] font-mono-jb text-white/30 mt-0.5">
                across {totalSessions} sessions · {Math.round(totalMinutes / 60)} hrs total
                · {(totalMinutes / totalSessions).toFixed(0)} min avg · {avgKcalPerMin} kcal/min
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
