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
  Brain,
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

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLOR_AMBER  = '#f59e0b'   // amber-500  — NFL gold primary
const COLOR_BROWN  = '#d97706'   // amber-600  — darker gold
const COLOR_ORANGE = '#fb923c'   // orange-400 — accent
const COLOR_RED    = '#f87171'   // red-400    — warning
const COLOR_MUTED  = 'rgba(255,255,255,0.35)'

// ─── Mock data ────────────────────────────────────────────────────────────────
// 5 recent sessions

interface Session {
  id: number
  date: string
  type: 'Full Game' | 'Practice' | 'Walkthrough' | 'Conditioning'
  durationMin: number
  calories: number
  avgHR: number
  peakHR: number
}

const SESSIONS: Session[] = [
  { id: 1, date: '2026-03-15', type: 'Full Game',    durationMin: 138, calories: 1240, avgHR: 152, peakHR: 191 },
  { id: 2, date: '2026-03-11', type: 'Practice',     durationMin:  95, calories:  820, avgHR: 138, peakHR: 174 },
  { id: 3, date: '2026-03-08', type: 'Conditioning', durationMin:  42, calories:  540, avgHR: 163, peakHR: 188 },
  { id: 4, date: '2026-03-05', type: 'Walkthrough',  durationMin:  52, calories:  340, avgHR: 112, peakHR: 148 },
  { id: 5, date: '2026-03-01', type: 'Full Game',    durationMin: 145, calories: 1310, avgHR: 155, peakHR: 193 },
]

// ─── Session type breakdown bar chart ────────────────────────────────────────

const SESSION_TYPE_DATA = [
  { name: 'Full Game',    duration: 141, calories: 1275, count: 2, hint: '2h+',       color: COLOR_AMBER },
  { name: 'Practice',    duration:  95, calories:  820, count: 1, hint: '1–2h',       color: COLOR_BROWN },
  { name: 'Walkthrough', duration:  52, calories:  340, count: 1, hint: '45–60 min',  color: COLOR_ORANGE },
  { name: 'Conditioning',duration:  42, calories:  540, count: 1, hint: '<45 min',    color: '#a78bfa' },
]

// ─── Weekly calories chart (8 weeks) ────────────────────────────────────────

const WEEKLY_CALORIES = [
  { week: 'Jan 25', calories: 2180 },
  { week: 'Feb 1',  calories: 3450 },
  { week: 'Feb 8',  calories: 1620 },
  { week: 'Feb 15', calories: 2940 },
  { week: 'Feb 22', calories: 3710 },
  { week: 'Mar 1',  calories: 2860 },
  { week: 'Mar 8',  calories: 1900 },
  { week: 'Mar 15', calories: 4100 },
]

const avgWeeklyCalories = Math.round(
  WEEKLY_CALORIES.reduce((s, d) => s + d.calories, 0) / WEEKLY_CALORIES.length
)

// ─── Derived stats ────────────────────────────────────────────────────────────

const totalSessions    = SESSIONS.length
const totalCalories    = SESSIONS.reduce((s, d) => s + d.calories, 0)
const totalMinutes     = SESSIONS.reduce((s, d) => s + d.durationMin, 0)
const gameSessions     = SESSIONS.filter((s) => s.type === 'Full Game')
const avgGameCalories  = Math.round(gameSessions.reduce((s, d) => s + d.calories, 0) / gameSessions.length)
const peakHRAll        = Math.max(...SESSIONS.map((s) => s.peakHR))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function typeColor(type: Session['type']) {
  if (type === 'Full Game')    return COLOR_AMBER
  if (type === 'Practice')     return COLOR_BROWN
  if (type === 'Walkthrough')  return COLOR_ORANGE
  return '#a78bfa'
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

function CaloriesTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const isAboveAvg = payload[0].value > avgWeeklyCalories
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
      <p style={{ color: isAboveAvg ? COLOR_AMBER : COLOR_MUTED }}>
        Calories: <span className="font-semibold">{payload[0].value.toLocaleString()}</span>
        <span className="text-white/40 ml-1">kcal</span>
      </p>
      {isAboveAvg && (
        <p className="text-amber-400/70 text-[10px] mt-1">Above weekly average</p>
      )}
    </div>
  )
}

function SessionTypeTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
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
      {payload.map((p) => (
        <p key={p.name} className="text-white/70">
          {p.name}: <span className="font-semibold text-amber-400">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AmericanFootballPage() {
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
              <span className="text-xl leading-none">🏈</span>
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  American Football Analytics
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Positional demands &amp; concussion science
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Hero section ── */}
          <div
            className="rounded-2xl border p-5 space-y-2"
            style={{
              borderColor: COLOR_AMBER + '40',
              background: `linear-gradient(135deg, ${COLOR_AMBER}12 0%, ${COLOR_BROWN}08 60%, transparent 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-5xl leading-none mt-0.5">🏈</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-3xl font-bold leading-tight text-white tracking-wide">
                  American Football Analysis
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Football is a collision sport with extreme{' '}
                  <span className="text-white/80">positional physiological demands</span> — from
                  the metabolic power of 315-lb offensive linemen to the explosive speed of wide
                  receivers covering 1.5–2.5 miles per game. Game-day heart rates reach{' '}
                  <span className="text-white/80">180–195 bpm peak for skill positions</span> while
                  cumulative head impact exposure drives the sport&apos;s most pressing health challenge:
                  chronic traumatic encephalopathy.
                </p>
              </div>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: `${totalSessions} sessions`, color: COLOR_AMBER },
                { label: `${gameSessions.length} full games`, color: COLOR_BROWN },
                { label: `${totalCalories.toLocaleString()} kcal total`, color: COLOR_ORANGE },
                { label: `Peak HR ${peakHRAll} bpm`, color: '#f87171' },
              ].map(({ label, color }) => (
                <span
                  key={label}
                  className="text-[10px] font-mono-jb px-2 py-1 rounded-full"
                  style={{ background: color + '22', color }}
                >
                  {label}
                </span>
              ))}
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
                    style={{ background: COLOR_AMBER + '22', color: COLOR_AMBER }}>
                    {gameSessions.length} games
                  </span>
                  <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_ORANGE + '22', color: COLOR_ORANGE }}>
                    {totalSessions - gameSessions.length} practice
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Game Calories</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_AMBER }}>
                  {avgGameCalories}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal avg per game</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Total Time</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_BROWN }}>
                  {Math.round(totalMinutes / 60)}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">hours all sessions</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Peak HR</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-rose-400">
                  {peakHRAll}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">bpm max recorded</p>
              </div>
            </div>
          </div>

          {/* ── Session type breakdown (bar chart) ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Session Type Breakdown
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Avg duration by session type — Full Game (2h+), Practice (1–2h), Walkthrough (45–60 min), Conditioning (&lt;45 min)
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SESSION_TYPE_DATA} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: COLOR_MUTED }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: COLOR_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  unit=" min"
                />
                <Tooltip content={<SessionTypeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="duration" name="Duration (min)" radius={[4, 4, 0, 0]}>
                  {SESSION_TYPE_DATA.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Session type pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {SESSION_TYPE_DATA.map(({ name, hint, calories, color }) => (
                <div
                  key={name}
                  className="rounded-xl border p-2.5 space-y-0.5 text-center"
                  style={{ borderColor: color + '33', background: color + '0d' }}
                >
                  <p className="text-[10px] font-mono-jb font-semibold" style={{ color }}>{name}</p>
                  <p className="text-[9px] font-mono-jb text-white/35">{hint}</p>
                  <p className="text-[9px] font-mono-jb text-white/25">{calories} kcal avg</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Weekly calories chart ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Weekly Active Calories — Last 8 Weeks
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Total active calories burned per week. Gold bars exceed the 8-week average of {avgWeeklyCalories.toLocaleString()} kcal.
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY_CALORIES} barCategoryGap="25%">
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
                  width={40}
                />
                <ReferenceLine
                  y={avgWeeklyCalories}
                  stroke={COLOR_AMBER + '60'}
                  strokeDasharray="4 3"
                  label={{
                    value: `avg ${avgWeeklyCalories.toLocaleString()}`,
                    position: 'insideTopRight',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fill: COLOR_AMBER + '90',
                  }}
                />
                <Tooltip content={<CaloriesTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="calories" name="Calories" radius={[4, 4, 0, 0]}>
                  {WEEKLY_CALORIES.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.calories > avgWeeklyCalories ? COLOR_AMBER : COLOR_BROWN}
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_AMBER, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Above average</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_BROWN, opacity: 0.82 }} />
                <span className="text-[9px] font-mono-jb text-white/35">Below average</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3" style={{ background: COLOR_AMBER, opacity: 0.5 }} />
                <span className="text-[9px] font-mono-jb text-white/35">8-week avg</span>
              </div>
            </div>
          </div>

          {/* ── Positional Demands card ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_AMBER + '30', background: COLOR_AMBER + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color: COLOR_AMBER }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Positional Demands
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'OL Avg Weight',    value: '315',     unit: 'lbs',       color: COLOR_AMBER,  hint: 'NFL Combine (Brechue 2010)' },
                { label: 'OL 40-Yd Dash',    value: '4.9',     unit: 's',         color: COLOR_BROWN,  hint: 'power–speed profile' },
                { label: 'Lineman Energy',   value: '4,500–6,000', unit: 'kcal/day', color: COLOR_ORANGE, hint: 'Rhea 2011' },
                { label: 'WR Miles/Game',    value: '1.5–2.5', unit: 'mi',        color: COLOR_AMBER,  hint: 'Drakos 2010' },
                { label: 'QB Elbow Vel.',    value: '6,000',   unit: '°/s',       color: '#a78bfa',    hint: 'Fleisig 2000 — highest in sport' },
                { label: 'Lineman Game HR',  value: '140–160', unit: 'bpm',       color: COLOR_BROWN,  hint: 'game-day avg' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-xl font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-[10px] font-mono-jb font-normal ml-1 opacity-60">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span className="text-amber-400/80 font-semibold">Skill position peak HR:</span>{' '}
                Wide receivers, defensive backs, and linebackers reach{' '}
                <span className="text-white/70">180–195 bpm</span> during full-speed route running
                and open-field pursuit — near-maximal cardiovascular effort in short bursts.
              </p>
              <p>
                QB throwing mechanics produce elbow angular velocities of{' '}
                <span className="text-white/70">~6,000°/s</span> — the highest recorded of any
                overhead sport (Fleisig 2000), placing extreme demands on the medial elbow UCL and
                rotator cuff even without contact.
              </p>
            </div>
          </div>

          {/* ── Concussion & Brain Health card ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_RED + '35', background: COLOR_RED + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-red-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Concussion &amp; Brain Health
              </h2>
            </div>

            {/* Key stat banner */}
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] p-3 mb-3 space-y-1">
              <p className="text-red-300/80 font-mono-jb font-semibold text-[11px]">Critical finding (McKee 2023, NEJM)</p>
              <p className="text-[10px] font-mono-jb text-white/65 leading-relaxed">
                CTE was identified in <span className="text-white font-semibold">110 of 111 donated NFL brains</span> — 99.1% prevalence.
                Subconcussive hits accumulate over a career (900–1,500 per season) and are now
                understood as a primary CTE driver, not just symptomatic concussions.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Concussion Rate',        value: '1–3',    unit: '/1,000 AE', color: COLOR_RED,    hint: 'Guskiewicz 2003' },
                { label: 'Prior Concussion Risk',  value: '3.8×',   unit: 'higher',    color: '#fb923c',    hint: 'repeat injury risk' },
                { label: 'Helmet Rating Benefit',  value: '54%',    unit: 'reduction', color: COLOR_AMBER,  hint: 'VT 5-star helmet (2023)' },
                { label: 'Neck Strength Benefit',  value: '20–33%', unit: 'less accel',color: COLOR_BROWN,  hint: 'Mihalik 2011' },
                { label: 'RTP Protocol Steps',     value: '5',      unit: 'steps',     color: '#a78bfa',    hint: 'Zurich consensus' },
                { label: 'Hits/Season',            value: '900–1,500', unit: 'subconcussive', color: COLOR_RED, hint: 'cumulative exposure' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-xl font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-[10px] font-mono-jb font-normal ml-1 opacity-55">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span className="text-red-400/80 font-semibold">Zurich 5-step Return-to-Play protocol:</span>{' '}
                (1) symptom-limited activity → (2) light aerobic exercise → (3) sport-specific
                exercise → (4) non-contact drills → (5) full-contact practice → game clearance.
                Each step requires 24 h symptom-free before advancing.
              </p>
              <p>
                Neck strength training reduces linear and angular head acceleration by{' '}
                <span className="text-white/70">20–33%</span> on impact (Mihalik 2011) — one
                of the most evidence-backed modifiable risk factors available to players.
              </p>
            </div>
          </div>

          {/* ── Injury Prevention card ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_ORANGE + '30', background: COLOR_ORANGE + '07' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-orange-400" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Injury Prevention
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'ACL Exposure Rate', value: '1.2%',  unit: 'of exposures', color: COLOR_RED,    hint: '40% career-ending (Meehan 2020)' },
                { label: 'ACL Risk Reduction', value: '50%',  unit: 'vs no program', color: COLOR_ORANGE, hint: 'hip abductor strengthening' },
                { label: 'Hamstring Re-injury', value: '65%', unit: 'reduction',    color: COLOR_AMBER,  hint: 'Nordic curl (Arnason 2008)' },
                { label: 'Turf vs Grass Risk', value: '+28%', unit: 'non-contact',  color: COLOR_RED,    hint: 'artificial turf (Mack 2019)' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-2xl font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-[10px] font-mono-jb font-normal ml-1 opacity-55">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-[10px] font-mono-jb text-white/45 leading-relaxed">
              <p>
                <span className="text-orange-400/80 font-semibold">Surface matters:</span>{' '}
                Mack et al. (2019) found a{' '}
                <span className="text-white/70">28% higher non-contact lower-extremity injury rate</span>{' '}
                on artificial turf vs natural grass — a critical factor for facilities choosing field
                surfaces for year-round play.
              </p>
              <p>
                ACL injuries represent only 1.2% of NFL exposures but account for roughly{' '}
                <span className="text-white/70">40% of career-ending injuries</span>. Hip abductor
                strengthening programs (Meehan 2020) reduce ACL risk by 50% — one of the most
                impactful preventive protocols available.
              </p>
            </div>
          </div>

          {/* ── Performance Science card ── */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: COLOR_AMBER + '28', background: COLOR_AMBER + '06' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: COLOR_AMBER }} />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Performance Science
              </h2>
            </div>

            {/* NFL Combine standards */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 mb-3">
              <p className="text-[10px] font-mono-jb text-white/40 uppercase tracking-widest mb-2">
                NFL Combine Standards by Position
              </p>
              <div className="space-y-1.5">
                {[
                  { position: 'QB / WR / DB', drill: '40-Yard Dash', standard: '<4.5s',          color: COLOR_AMBER },
                  { position: 'LB / TE',      drill: '40-Yard Dash', standard: '<4.7s',          color: COLOR_BROWN },
                  { position: 'OL / DL',      drill: '40-Yard Dash', standard: '<5.2s',          color: COLOR_ORANGE },
                  { position: 'All positions',drill: '3-Cone Drill', standard: '<6.5s = elite',  color: '#a78bfa' },
                ].map(({ position, drill, standard, color }) => (
                  <div key={position + drill} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="font-mono-jb text-[10px] text-white/50 w-28 shrink-0">{position}</span>
                    <span className="font-mono-jb text-[10px] text-white/35 flex-1">{drill}</span>
                    <span
                      className="font-mono-jb text-[10px] font-semibold shrink-0"
                      style={{ color }}
                    >
                      {standard}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: 'Carb Loading',        value: '8–10',  unit: 'g/kg night before',  color: COLOR_AMBER,  hint: 'pre-game glycogen saturation' },
                { label: 'Off-Season Phase 1',  value: 'Hypertrophy', unit: '',              color: COLOR_BROWN,  hint: '→ Strength → Power periodization' },
                { label: 'Subconcussive Hits',  value: '900–1,500', unit: '/season',         color: COLOR_RED,    hint: 'cumulative impact exposure' },
                { label: 'Peak Sprint Output',  value: 'Zone 5', unit: 'HR',                 color: COLOR_ORANGE, hint: '180–195 bpm skill positions' },
              ].map(({ label, value, unit, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1"
                  style={{ borderColor: color + '2a', background: color + '0a' }}
                >
                  <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
                  <p className="font-rajdhani text-lg font-bold leading-none" style={{ color }}>
                    {value}
                    {unit && <span className="text-[10px] font-mono-jb font-normal ml-1 opacity-55">{unit}</span>}
                  </p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-mono-jb text-white/40 leading-relaxed">
              Off-season periodization follows a hypertrophy → strength → power sequence: high-volume
              lower-intensity work in the off-season builds tissue capacity before transitioning to
              sport-specific explosive power in pre-season.
            </p>
          </div>

          {/* ── Recent sessions table ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-white/30" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/70">
                Recent Sessions
              </h2>
            </div>

            <div className="space-y-2">
              {SESSIONS.map((s) => {
                const sc = typeColor(s.type)
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3.5 flex items-center gap-3"
                    style={{ borderColor: sc + '28', background: sc + '08' }}
                  >
                    {/* Session icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                      style={{ background: sc + '22' }}
                    >
                      🏈
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-rajdhani font-semibold tracking-wide"
                          style={{ color: sc }}
                        >
                          {s.type}
                        </span>
                        {s.type === 'Full Game' && (
                          <span
                            className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                            style={{ background: '#f8717120', color: '#f87171' }}
                          >
                            Game day
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
                        {s.calories.toLocaleString()} kcal
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

          {/* ── Safety callout ── */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 flex items-start gap-3">
            <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                Apple Watch Limitations for Contact Sports
              </p>
              <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                Apple Watch tracks heart rate, calories, and motion but{' '}
                <span className="text-white/75">cannot detect or quantify head impacts, tackle
                count, or cumulative contact load</span> — the primary injury vectors in football.
                Any suspected concussion must be assessed under{' '}
                <span className="text-white/75">SCAT6</span> by a qualified clinician before return
                to play. HR data here reflects cardiovascular load only and does not capture
                full neurological recovery status.
              </p>
            </div>
          </div>

          {/* ── Science citations ── */}
          <div className="rounded-2xl border border-amber-600/20 bg-amber-600/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-amber-600/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="space-y-3 w-full">
                <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="space-y-3 text-xs text-white/55 leading-relaxed font-mono-jb">
                  <div className="border-l-2 border-amber-600/30 pl-3 space-y-2.5">
                    <p>
                      <span className="text-amber-300/80">Brechue WF et al. (2010)</span>
                      {' '}— "Body mass and performance of offensive linemen at the NFL Combine."
                      {' '}<em>J Strength Cond Res</em>.
                      {' '}Offensive linemen averaged 315 lbs with a 4.9s 40-yard dash, defining
                      the rare combination of extreme mass and functional power demanded at the
                      highest level of the sport.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Rhea MR et al. (2011)</span>
                      {' '}— "Nutritional requirements and practices of professional football linemen."
                      Linemen require 4,500–6,000 kcal/day to maintain mass during the season —
                      among the highest energy demands of any professional athlete.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Drakos MC et al. (2010)</span>
                      {' '}— "Injury in the National Football League: a review of current concepts."
                      {' '}<em>Bull NYU Hosp Jt Dis</em>.
                      {' '}Wide receivers and defensive backs run 1.5–2.5 miles per game at
                      high intensity, making cardiovascular conditioning a primary performance
                      determinant for skill positions.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Fleisig GS et al. (2000)</span>
                      {' '}— "Kinematics used by world class tennis players to produce high-velocity serves."
                      [Context: QB elbow angular velocity ~6,000°/s exceeds all other overhead sports.]
                      {' '}The QB throwing motion is biomechanically the most demanding overhead
                      action in professional sport for medial elbow structures.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Guskiewicz KM et al. (2003)</span>
                      {' '}— "Cumulative effects associated with recurrent concussion in collegiate football players."
                      {' '}<em>JAMA</em> 290(19):2549–2555.
                      {' '}Athletes with prior concussion had 3.8× higher risk of a subsequent
                      concussion. Recurrent concussion was associated with slower symptom resolution
                      and lower threshold for injury.
                    </p>
                    <p>
                      <span className="text-amber-300/80">McKee AC et al. (2023)</span>
                      {' '}— "Neuropathological and clinical findings in a large series of former
                      professional football players."
                      {' '}<em>NEJM</em>.
                      {' '}CTE identified in 110/111 donated NFL brains. Subconcussive hits
                      accumulated over career — not just symptomatic concussions — appear to be
                      a primary driver of pathological tau deposition.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Mihalik JP et al. (2011)</span>
                      {' '}— "Measurement of head impacts in collegiate football players: an investigation
                      of positional and event-type differences."
                      {' '}Neck strength training reduces angular head acceleration by 20–33% on
                      equivalent impacts — the most accessible individual protective intervention
                      available without equipment changes.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Mack CD et al. (2019)</span>
                      {' '}— "Artificial turf and the risk of injury in NFL players."
                      {' '}<em>Orthop J Sports Med</em>.
                      {' '}Artificial turf increased non-contact lower-extremity injury rate by
                      28% vs natural grass, with ACL and ankle sprains the primary injury types
                      affected.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Arnason A et al. (2008)</span>
                      {' '}— "Prevention of hamstring strains in elite soccer: an intervention study."
                      {' '}Nordic hamstring curl protocol reduced hamstring re-injury rates by 65%
                      — evidence directly applicable to football athletes given comparable sprint
                      and deceleration demands.
                    </p>
                  </div>

                  <p className="text-white/30 text-[10px]">
                    Apple Watch HR and calorie data complement professional athletic training
                    assessment but do not replace certified athletic trainer evaluation, video
                    analysis, force plate testing, or concussion protocol management for
                    competitive players.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Total calorie footer ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-4">
            <div className="rounded-full p-3 shrink-0" style={{ background: COLOR_AMBER + '18' }}>
              <Flame className="w-5 h-5" style={{ color: COLOR_AMBER }} />
            </div>
            <div>
              <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">
                Total Active Calories — All Sessions
              </p>
              <p className="font-rajdhani text-3xl font-bold leading-none" style={{ color: COLOR_AMBER }}>
                {totalCalories.toLocaleString()}
                <span className="font-mono-jb text-sm font-normal text-white/30 ml-1.5">kcal</span>
              </p>
              <p className="text-[10px] font-mono-jb text-white/30 mt-0.5">
                across {totalSessions} sessions · {Math.round(totalMinutes / 60)} hrs total
                · avg {Math.round(avgGameCalories).toLocaleString()} kcal per game
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
