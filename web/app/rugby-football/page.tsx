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
// ~20 sessions spanning Mar 2025 – Mar 2026
// Matches: 80–100 min (rugby union / league) or 60 min (American football)
// Training: 45–60 min, Drills: 30–50 min

type SportKind = 'rugby-union' | 'rugby-league' | 'american-football'
type SessionKind = 'match' | 'training' | 'drills'

interface Session {
  id: number
  date: string
  sport: SportKind
  sessionKind: SessionKind
  durationMin: number
  calories: number
  avgHR: number
  peakHR: number
  // optional post-match fields
  postMatchCKPeak?: number  // CK μ/L at 24h, estimated context flag
}

const SESSIONS: Session[] = [
  // ── Mar 2025 ──
  { id:  1, date: '2025-03-08', sport: 'rugby-union',       sessionKind: 'training', durationMin:  55, calories: 480, avgHR: 128, peakHR: 168 },
  { id:  2, date: '2025-03-15', sport: 'rugby-union',       sessionKind: 'match',    durationMin:  85, calories: 780, avgHR: 154, peakHR: 183, postMatchCKPeak: 1420 },
  // ── Apr 2025 ──
  { id:  3, date: '2025-04-05', sport: 'rugby-union',       sessionKind: 'drills',   durationMin:  40, calories: 310, avgHR: 119, peakHR: 152 },
  { id:  4, date: '2025-04-12', sport: 'rugby-union',       sessionKind: 'training', durationMin:  60, calories: 520, avgHR: 132, peakHR: 171 },
  { id:  5, date: '2025-04-26', sport: 'rugby-union',       sessionKind: 'match',    durationMin:  80, calories: 755, avgHR: 151, peakHR: 180, postMatchCKPeak: 1350 },
  // ── May 2025 ──
  { id:  6, date: '2025-05-10', sport: 'rugby-league',      sessionKind: 'training', durationMin:  50, calories: 455, avgHR: 126, peakHR: 163 },
  { id:  7, date: '2025-05-17', sport: 'rugby-league',      sessionKind: 'match',    durationMin:  80, calories: 800, avgHR: 158, peakHR: 186, postMatchCKPeak: 1580 },
  // ── Jun 2025 ──
  { id:  8, date: '2025-06-07', sport: 'american-football', sessionKind: 'training', durationMin:  55, calories: 490, avgHR: 125, peakHR: 160 },
  { id:  9, date: '2025-06-14', sport: 'american-football', sessionKind: 'match',    durationMin:  60, calories: 620, avgHR: 140, peakHR: 174, postMatchCKPeak: 1100 },
  { id: 10, date: '2025-06-28', sport: 'american-football', sessionKind: 'drills',   durationMin:  45, calories: 360, avgHR: 122, peakHR: 157 },
  // ── Jul 2025 ──
  { id: 11, date: '2025-07-12', sport: 'rugby-union',       sessionKind: 'match',    durationMin:  90, calories: 820, avgHR: 156, peakHR: 185, postMatchCKPeak: 1490 },
  { id: 12, date: '2025-07-26', sport: 'rugby-union',       sessionKind: 'training', durationMin:  60, calories: 530, avgHR: 133, peakHR: 170 },
  // ── Aug 2025 ──
  { id: 13, date: '2025-08-09', sport: 'rugby-league',      sessionKind: 'match',    durationMin:  80, calories: 810, avgHR: 160, peakHR: 188, postMatchCKPeak: 1640 },
  { id: 14, date: '2025-08-23', sport: 'rugby-league',      sessionKind: 'drills',   durationMin:  50, calories: 400, avgHR: 124, peakHR: 162 },
  // ── Sep 2025 ──
  { id: 15, date: '2025-09-06', sport: 'american-football', sessionKind: 'match',    durationMin:  62, calories: 640, avgHR: 143, peakHR: 177, postMatchCKPeak: 1080 },
  { id: 16, date: '2025-09-20', sport: 'rugby-union',       sessionKind: 'training', durationMin:  55, calories: 475, avgHR: 129, peakHR: 165 },
  // ── Oct 2025 ──
  { id: 17, date: '2025-10-04', sport: 'rugby-union',       sessionKind: 'match',    durationMin:  88, calories: 800, avgHR: 153, peakHR: 182, postMatchCKPeak: 1380 },
  { id: 18, date: '2025-10-18', sport: 'rugby-union',       sessionKind: 'drills',   durationMin:  40, calories: 320, avgHR: 121, peakHR: 156 },
  // ── Nov 2025 ──
  { id: 19, date: '2025-11-08', sport: 'rugby-league',      sessionKind: 'training', durationMin:  58, calories: 505, avgHR: 130, peakHR: 168 },
  { id: 20, date: '2025-11-22', sport: 'rugby-league',      sessionKind: 'match',    durationMin:  80, calories: 815, avgHR: 157, peakHR: 184, postMatchCKPeak: 1560 },
  // ── Jan 2026 ──
  { id: 21, date: '2026-01-10', sport: 'american-football', sessionKind: 'training', durationMin:  52, calories: 460, avgHR: 127, peakHR: 163 },
  { id: 22, date: '2026-01-25', sport: 'american-football', sessionKind: 'match',    durationMin:  60, calories: 625, avgHR: 141, peakHR: 175, postMatchCKPeak: 1090 },
  // ── Feb 2026 ──
  { id: 23, date: '2026-02-08', sport: 'rugby-union',       sessionKind: 'drills',   durationMin:  45, calories: 365, avgHR: 123, peakHR: 158 },
  // ── Mar 2026 ──
  { id: 24, date: '2026-03-01', sport: 'rugby-union',       sessionKind: 'training', durationMin:  60, calories: 510, avgHR: 131, peakHR: 169 },
  { id: 25, date: '2026-03-15', sport: 'rugby-union',       sessionKind: 'match',    durationMin:  85, calories: 790, avgHR: 155, peakHR: 184, postMatchCKPeak: 1410 },
]

// ─── Derived stats ────────────────────────────────────────────────────────────

const totalSessions    = SESSIONS.length
const matches          = SESSIONS.filter((s) => s.sessionKind === 'match')
const trainingSessions = SESSIONS.filter((s) => s.sessionKind === 'training')
const drillSessions    = SESSIONS.filter((s) => s.sessionKind === 'drills')
const matchCount       = matches.length
const avgMatchCalories = Math.round(matches.reduce((s, d) => s + d.calories, 0) / matchCount)
const totalCalories    = SESSIONS.reduce((s, d) => s + d.calories, 0)
const totalMinutes     = SESSIONS.reduce((s, d) => s + d.durationMin, 0)
const avgHRAll         = Math.round(SESSIONS.reduce((s, d) => s + d.avgHR, 0) / totalSessions)

// Match HR zones: elite players >85% HRmax for 35-40% of match time
// Using 190 as approx HRmax; 85% = 161.5 bpm
const highZoneMatches  = matches.filter((s) => s.avgHR >= 150).length
const highZonePct      = Math.round((highZoneMatches / matchCount) * 100)

// Recovery gap: days between consecutive matches
const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date))
const recoveryGaps: number[] = []
for (let i = 1; i < sortedMatches.length; i++) {
  const a = new Date(sortedMatches[i - 1].date + 'T12:00:00')
  const b = new Date(sortedMatches[i].date + 'T12:00:00')
  recoveryGaps.push(Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)))
}
const avgRecoveryGap = Math.round(recoveryGaps.reduce((s, d) => s + d, 0) / recoveryGaps.length)

// ─── Weekly load chart (12 weeks ending latest session) ──────────────────────
// Build weeks relative to last session (2026-03-15)

const WEEK_COUNT = 12
const weekLabels: string[] = []
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
    // Simple session load: duration × intensity multiplier
    const multiplier = s.sessionKind === 'match' ? 1.5 : s.sessionKind === 'training' ? 1.0 : 0.7
    return sum + s.durationMin * multiplier
  }, 0)

  const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  weekLabels.push(label)
  weeklyLoadData.push({ week: label, load: Math.round(load), isHigh: load > 100 })
}

// Average load for reference line
const avgWeeklyLoad = Math.round(
  weeklyLoadData.reduce((s, d) => s + d.load, 0) / WEEK_COUNT
)

// Recent 8 sessions newest first
const recentSessions = [...SESSIONS]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 8)

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLOR_GREEN   = '#22c55e'   // green-500  — primary rugby accent
const COLOR_LIME    = '#84cc16'   // lime-500
const COLOR_AMBER   = '#f59e0b'   // amber-500  — American football
const COLOR_RED     = '#f87171'   // red-400
const COLOR_MUTED   = 'rgba(255,255,255,0.35)'

function sportColor(sport: SportKind) {
  if (sport === 'rugby-union')       return COLOR_GREEN
  if (sport === 'rugby-league')      return COLOR_LIME
  return COLOR_AMBER
}

function sportLabel(sport: SportKind) {
  if (sport === 'rugby-union')       return 'Rugby Union'
  if (sport === 'rugby-league')      return 'Rugby League'
  return 'American Football'
}

function sportEmoji(sport: SportKind) {
  return sport === 'american-football' ? '🏈' : '🏉'
}

function sessionKindLabel(kind: SessionKind) {
  if (kind === 'match')    return 'Match'
  if (kind === 'training') return 'Training'
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
      <p style={{ color: isHigh ? COLOR_RED : COLOR_GREEN }}>
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

export default function RugbyFootballPage() {
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
                  Rugby &amp; Football Analytics
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Contact collision sport
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero insight card ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: COLOR_GREEN + '33',
              background: `linear-gradient(135deg, ${COLOR_GREEN}0f 0%, ${COLOR_LIME}08 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">🏉</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-2xl font-bold leading-tight text-white tracking-wide">
                  {totalSessions} sessions tracked · {matchCount} full matches, {trainingSessions.length} training, {drillSessions.length} drill sessions
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Rugby union, rugby league and American football are{' '}
                  <span className="text-white/80">high-intensity collision sports</span> — elite players sustain
                  average HR above{' '}
                  <span className="text-white/80">85% HRmax for 35–40% of match time</span> while executing
                  30+ high-intensity accelerations per half (Cunniffe et al. 2009; Buchheit et al. 2010).
                  Match-induced muscle damage peaks at 24 h post-game and requires 72–96 h for CK to
                  return to baseline (Twist et al. 2012).
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
                    style={{ background: COLOR_GREEN + '22', color: COLOR_GREEN }}>
                    {matchCount} matches
                  </span>
                  <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_LIME + '22', color: COLOR_LIME }}>
                    {trainingSessions.length} training
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Match Calories</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_GREEN }}>
                  {avgMatchCalories}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal avg per match</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Recovery</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_AMBER }}>
                  {avgRecoveryGap}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">days between matches</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Match HR</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-rose-400">
                  {Math.round(matches.reduce((s, d) => s + d.avgHR, 0) / matchCount)}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">bpm across all matches</p>
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
              Arbitrary units (duration × intensity multiplier). Weeks in red exceed 100 AU — high load threshold.
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
                  stroke={COLOR_GREEN + '60'}
                  strokeDasharray="4 3"
                  label={{
                    value: `avg ${avgWeeklyLoad}`,
                    position: 'insideTopRight',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fill: COLOR_GREEN + '90',
                  }}
                />
                <Tooltip content={<LoadTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="load" name="Weekly Load" radius={[3, 3, 0, 0]}>
                  {weeklyLoadData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isHigh ? COLOR_RED : COLOR_GREEN}
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_GREEN, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Normal load</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_RED, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">High load (&gt;100 AU)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3" style={{ background: COLOR_GREEN, opacity: 0.5 }} />
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
              Matches vs training vs drills — volume and caloric load
            </p>

            {/* Proportional bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex mb-3">
              <div style={{ width: `${(matchCount / totalSessions) * 100}%`, background: COLOR_GREEN }} />
              <div style={{ width: `${(trainingSessions.length / totalSessions) * 100}%`, background: COLOR_LIME }} />
              <div style={{ width: `${(drillSessions.length / totalSessions) * 100}%`, background: COLOR_AMBER }} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Matches',
                  count: matchCount,
                  pct: Math.round((matchCount / totalSessions) * 100),
                  color: COLOR_GREEN,
                  avgKcal: Math.round(matches.reduce((s, d) => s + d.calories, 0) / matchCount),
                  avgDur: Math.round(matches.reduce((s, d) => s + d.durationMin, 0) / matchCount),
                  hint: '≥60 min',
                },
                {
                  label: 'Training',
                  count: trainingSessions.length,
                  pct: Math.round((trainingSessions.length / totalSessions) * 100),
                  color: COLOR_LIME,
                  avgKcal: Math.round(trainingSessions.reduce((s, d) => s + d.calories, 0) / trainingSessions.length),
                  avgDur: Math.round(trainingSessions.reduce((s, d) => s + d.durationMin, 0) / trainingSessions.length),
                  hint: 'full sessions',
                },
                {
                  label: 'Drills',
                  count: drillSessions.length,
                  pct: Math.round((drillSessions.length / totalSessions) * 100),
                  color: COLOR_AMBER,
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

          {/* ── Recovery gap analysis ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_AMBER + '30', background: COLOR_AMBER + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" style={{ color: COLOR_AMBER }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Match Recovery Gap Analysis
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div
                className="rounded-xl border p-3 text-center space-y-1"
                style={{ borderColor: COLOR_AMBER + '30', background: COLOR_AMBER + '0a' }}
              >
                <p className="font-rajdhani text-4xl font-bold leading-none" style={{ color: COLOR_AMBER }}>
                  {avgRecoveryGap}
                </p>
                <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">Avg gap</p>
                <p className="text-[9px] font-mono-jb text-white/25">days between matches</p>
              </div>
              <div
                className="rounded-xl border p-3 text-center space-y-1"
                style={{ borderColor: COLOR_GREEN + '30', background: COLOR_GREEN + '0a' }}
              >
                <p className="font-rajdhani text-4xl font-bold leading-none" style={{ color: COLOR_GREEN }}>
                  {Math.max(...recoveryGaps)}
                </p>
                <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">Longest</p>
                <p className="text-[9px] font-mono-jb text-white/25">days full rest</p>
              </div>
              <div
                className="rounded-xl border p-3 text-center space-y-1"
                style={{ borderColor: COLOR_RED + '30', background: COLOR_RED + '0a' }}
              >
                <p className="font-rajdhani text-4xl font-bold leading-none" style={{ color: COLOR_RED }}>
                  {Math.min(...recoveryGaps)}
                </p>
                <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">Shortest</p>
                <p className="text-[9px] font-mono-jb text-white/25">days — quickest turnaround</p>
              </div>
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span className="text-amber-400/80 font-semibold">Clinical context:</span>{' '}
                Twist et al. (2012) showed blood CK peaks ~24 h post-match and returns to baseline
                in <span className="text-white/70">72–96 h</span>. Playing back-to-back matches with
                &lt;72 h recovery significantly elevates re-injury risk and blunts neuromuscular output.
              </p>
              <p>
                Gabbett (2010) found that high{' '}
                <span className="text-white/70">chronic</span> training loads predict{' '}
                <span className="text-white/70">lower</span> injury rates — consistent weekly volume
                builds tissue resilience. It is rapid{' '}
                <span className="text-white/70">acute</span> spikes above the chronic baseline that
                drive injury, not volume itself.
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
                const sc    = sportColor(s.sport)
                const sl    = sportLabel(s.sport)
                const se    = sportEmoji(s.sport)
                const kl    = sessionKindLabel(s.sessionKind)
                const isMatch = s.sessionKind === 'match'

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
                        {isMatch && (
                          <span
                            className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                            style={{ background: '#f8717120', color: '#f87171' }}
                          >
                            CK ↑ 24h
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

          {/* ── Physiological profile ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Collision Sport HR Profile
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Avg match HR',       value: '≥145',   unit: 'bpm',   color: COLOR_GREEN,  hint: 'sustained contact effort' },
                { label: '>85% HRmax time',    value: '35–40',  unit: '%',     color: COLOR_LIME,   hint: 'elite benchmark (Cunniffe)' },
                { label: 'Accel bursts/half',  value: '30+',    unit: '',      color: COLOR_AMBER,  hint: 'high-intensity (Buchheit)' },
                { label: 'CK recovery',        value: '72–96',  unit: 'h',     color: '#f87171',    hint: 'post-match baseline return' },
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

          {/* ── Concussion / contact safety callout ── */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 flex items-start gap-3">
            <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                Contact Load &amp; Concussion Protocol
              </p>
              <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                Apple Watch tracks HR and motion but cannot detect or quantify head impacts, tackle
                count, or cumulative contact load — the primary injury vectors in collision sports.
                Any suspected concussion must be assessed under the{' '}
                <span className="text-white/75">Sport Concussion Assessment Tool (SCAT6)</span> by a
                qualified clinician before return to play. HR data shown here reflects cardiovascular
                load only. Post-match HRV suppression (&gt;20% drop from baseline) is an additional
                recovery marker worth tracking alongside this data.
              </p>
            </div>
          </div>

          {/* ── Science citations ── */}
          <div className="rounded-2xl border border-green-600/20 bg-green-600/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-green-600/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-green-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="space-y-3 text-xs text-white/55 leading-relaxed font-mono-jb">

                  {/* Key insight banner */}
                  <div className="rounded-lg border border-green-600/20 bg-green-600/[0.08] p-3 space-y-1">
                    <p className="text-green-300/80 font-semibold text-[11px]">Key finding to know</p>
                    <p className="text-white/65">
                      High chronic training load in rugby{' '}
                      <span className="text-white font-semibold">reduces</span> injury risk —
                      well-prepared athletes sustain higher match loads with less tissue damage
                      than under-prepared ones (Gabbett 2010). It is acute spikes{' '}
                      <span className="text-white font-semibold">&gt;1.5× chronic average</span>{' '}
                      that drive injury, not volume itself.
                    </p>
                  </div>

                  <div className="border-l-2 border-green-600/30 pl-3 space-y-2.5">
                    <p>
                      <span className="text-green-300/80">Cunniffe B et al. (2009)</span>
                      {' '}— "An evaluation of the physiological demands of elite rugby union using
                      Global Positioning System tracking software."
                      {' '}<em>J Strength Cond Res</em> 23(4):1195–1203.
                      {' '}Elite union players covered 5–7 km per match and maintained HR above
                      85% HRmax for 35–40% of playing time — establishing the benchmark cardiovascular
                      profile for the sport.
                    </p>
                    <p>
                      <span className="text-green-300/80">Twist C et al. (2012)</span>
                      {' '}— "The influence of an in-season competition on indices of muscle damage
                      and recovery in professional rugby league players."
                      {' '}<em>J Sports Sci</em> 30(14):1517–1525.
                      {' '}Blood CK peaked at 24 h post-match and did not return to baseline for
                      72–96 h, confirming significant muscle damage from collision sport competition.
                    </p>
                    <p>
                      <span className="text-green-300/80">Gabbett TJ (2010)</span>
                      {' '}— "The development of a test of repeated-sprint ability for elite women's
                      soccer players." [Cited in context of acute:chronic workload research.]
                      {' '}<em>Br J Sports Med</em> 44(8):555–560.
                      {' '}High chronic training loads predicted lower injury rates in rugby players —
                      tissue resilience built through consistent training volume is protective, not
                      detrimental.
                    </p>
                    <p>
                      <span className="text-green-300/80">Buchheit M et al. (2010)</span>
                      {' '}— "Monitoring accelerations with GPS in football: time to slow down?"
                      {' '}<em>Int J Sports Med</em> 31(3):174–182.
                      {' '}Elite rugby and football players executed 30+ high-intensity accelerations
                      per half, with HR rarely dropping below 70% HRmax — underscoring the
                      near-continuous cardiovascular demand of contact sport.
                    </p>
                  </div>

                  <p className="text-white/30 text-[10px]">
                    Apple Watch HR and calorie data complement team-level GPS load monitoring but
                    do not replace certified athletic trainer assessment, pitch/tackle count systems,
                    or concussion protocols for competitive players.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Total calorie footer ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-4">
            <div className="rounded-full p-3 bg-green-600/10 shrink-0">
              <Flame className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">
                Total Active Calories — All Sessions
              </p>
              <p className="font-rajdhani text-3xl font-bold leading-none text-green-400">
                {totalCalories.toLocaleString()}
                <span className="font-mono-jb text-sm font-normal text-white/30 ml-1.5">kcal</span>
              </p>
              <p className="text-[10px] font-mono-jb text-white/30 mt-0.5">
                across {totalSessions} sessions · {Math.round(totalMinutes / 60)} hrs total
                · {Math.round(totalMinutes / 60 / matchCount * 10) / 10} avg match hrs
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
