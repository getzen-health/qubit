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
  Cpu,
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
  Legend,
  Cell,
} from 'recharts'

// ─── Demo data ───────────────────────────────────────────────────────────────
// 15 baseball + 8 softball sessions spanning 12 months (Mar 2025 – Feb 2026)
// Durations: 60–120 min games, 30–60 min practices

interface Session {
  id: number
  date: string          // ISO date string
  type: 'baseball' | 'softball'
  sessionKind: 'game' | 'practice'
  durationMin: number
  calories: number
  avgHR: number
  peakHR: number
}

const SESSIONS: Session[] = [
  // ── Mar 2025 ──
  { id:  1, date: '2025-03-08', type: 'baseball',  sessionKind: 'practice', durationMin:  45, calories: 280, avgHR:  95, peakHR: 152 },
  { id:  2, date: '2025-03-22', type: 'baseball',  sessionKind: 'game',     durationMin: 105, calories: 610, avgHR: 108, peakHR: 171 },
  // ── Apr 2025 ──
  { id:  3, date: '2025-04-05', type: 'softball',  sessionKind: 'practice', durationMin:  50, calories: 295, avgHR:  97, peakHR: 158 },
  { id:  4, date: '2025-04-12', type: 'baseball',  sessionKind: 'game',     durationMin: 110, calories: 640, avgHR: 112, peakHR: 174 },
  { id:  5, date: '2025-04-26', type: 'softball',  sessionKind: 'game',     durationMin:  90, calories: 520, avgHR: 105, peakHR: 163 },
  // ── May 2025 ──
  { id:  6, date: '2025-05-03', type: 'baseball',  sessionKind: 'practice', durationMin:  55, calories: 315, avgHR:  99, peakHR: 155 },
  { id:  7, date: '2025-05-17', type: 'baseball',  sessionKind: 'game',     durationMin: 115, calories: 670, avgHR: 110, peakHR: 169 },
  { id:  8, date: '2025-05-31', type: 'softball',  sessionKind: 'game',     durationMin:  95, calories: 540, avgHR: 107, peakHR: 162 },
  // ── Jun 2025 ──
  { id:  9, date: '2025-06-07', type: 'baseball',  sessionKind: 'game',     durationMin: 120, calories: 700, avgHR: 114, peakHR: 176 },
  { id: 10, date: '2025-06-21', type: 'softball',  sessionKind: 'practice', durationMin:  40, calories: 240, avgHR:  92, peakHR: 147 },
  // ── Jul 2025 ──
  { id: 11, date: '2025-07-05', type: 'baseball',  sessionKind: 'game',     durationMin: 118, calories: 695, avgHR: 116, peakHR: 179 },
  { id: 12, date: '2025-07-19', type: 'baseball',  sessionKind: 'practice', durationMin:  50, calories: 310, avgHR: 101, peakHR: 160 },
  // ── Aug 2025 ──
  { id: 13, date: '2025-08-02', type: 'softball',  sessionKind: 'game',     durationMin: 100, calories: 580, avgHR: 111, peakHR: 168 },
  { id: 14, date: '2025-08-16', type: 'baseball',  sessionKind: 'game',     durationMin: 112, calories: 650, avgHR: 113, peakHR: 172 },
  { id: 15, date: '2025-08-30', type: 'baseball',  sessionKind: 'practice', durationMin:  60, calories: 350, avgHR: 103, peakHR: 161 },
  // ── Sep 2025 ──
  { id: 16, date: '2025-09-13', type: 'softball',  sessionKind: 'game',     durationMin:  92, calories: 535, avgHR: 106, peakHR: 164 },
  { id: 17, date: '2025-09-27', type: 'baseball',  sessionKind: 'game',     durationMin: 108, calories: 625, avgHR: 109, peakHR: 170 },
  // ── Oct 2025 ──
  { id: 18, date: '2025-10-11', type: 'baseball',  sessionKind: 'practice', durationMin:  45, calories: 270, avgHR:  94, peakHR: 150 },
  { id: 19, date: '2025-10-25', type: 'softball',  sessionKind: 'practice', durationMin:  55, calories: 320, avgHR:  98, peakHR: 156 },
  // ── Nov 2025 ──
  { id: 20, date: '2025-11-08', type: 'baseball',  sessionKind: 'game',     durationMin: 105, calories: 615, avgHR: 107, peakHR: 167 },
  // ── Dec 2025 ──
  { id: 21, date: '2025-12-06', type: 'baseball',  sessionKind: 'practice', durationMin:  50, calories: 295, avgHR:  96, peakHR: 153 },
  // ── Jan 2026 ──
  { id: 22, date: '2026-01-17', type: 'softball',  sessionKind: 'game',     durationMin:  88, calories: 510, avgHR: 104, peakHR: 160 },
  { id: 23, date: '2026-01-31', type: 'baseball',  sessionKind: 'game',     durationMin: 100, calories: 590, avgHR: 108, peakHR: 166 },
]

// ─── Derived stats ────────────────────────────────────────────────────────────

const totalSessions   = SESSIONS.length
const totalCalories   = SESSIONS.reduce((s, d) => s + d.calories, 0)
const totalMinutes    = SESSIONS.reduce((s, d) => s + d.durationMin, 0)
const avgDurationMin  = Math.round(totalMinutes / totalSessions)
const avgKcalPerMin   = (totalCalories / totalMinutes).toFixed(2)
const avgHRAll        = Math.round(SESSIONS.reduce((s, d) => s + d.avgHR, 0) / totalSessions)
const baseballCount   = SESSIONS.filter((s) => s.type === 'baseball').length
const softballCount   = SESSIONS.filter((s) => s.type === 'softball').length

// Intensity buckets: low <95 avg HR, moderate 95–110, high >110
const highCount       = SESSIONS.filter((s) => s.avgHR > 110).length
const moderateCount   = SESSIONS.filter((s) => s.avgHR >= 95 && s.avgHR <= 110).length
const lowCount        = SESSIONS.filter((s) => s.avgHR < 95).length
const highPct         = Math.round((highCount / totalSessions) * 100)
const moderatePct     = Math.round((moderateCount / totalSessions) * 100)
const lowPct          = 100 - highPct - moderatePct

// Monthly bar chart data
const MONTH_LABELS = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb']
const MONTH_KEYS   = ['2025-03','2025-04','2025-05','2025-06','2025-07','2025-08',
                      '2025-09','2025-10','2025-11','2025-12','2026-01','2026-02']

const monthlyData = MONTH_KEYS.map((key, i) => {
  const bb = SESSIONS.filter((s) => s.date.startsWith(key) && s.type === 'baseball').length
  const sb = SESSIONS.filter((s) => s.date.startsWith(key) && s.type === 'softball').length
  return { month: MONTH_LABELS[i], baseball: bb, softball: sb }
})

// Recent 8 sessions (newest first)
const recentSessions = [...SESSIONS]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 8)

// ─── Colours ──────────────────────────────────────────────────────────────────

const COLOR_BB  = '#3b82f6'   // blue-500
const COLOR_SB  = '#eab308'   // yellow-500
const COLOR_HIGH     = '#f87171'   // red-400
const COLOR_MODERATE = '#fb923c'   // orange-400
const COLOR_LOW      = '#34d399'   // emerald-400

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function intensityLabel(avgHR: number): { label: string; color: string; bg: string } {
  if (avgHR > 110) return { label: 'High',     color: COLOR_HIGH,     bg: '#f871711a' }
  if (avgHR >= 95) return { label: 'Moderate', color: COLOR_MODERATE, bg: '#fb923c1a' }
  return              { label: 'Low',      color: COLOR_LOW,      bg: '#34d3991a' }
}

// ─── Custom bar tooltip ──────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
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
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="font-semibold">{p.value} sessions</span>
        </p>
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BaseballSoftballPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[hsl(0_0%_7%)] text-white">

        {/* ── Header ── */}
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
              <span className="text-xl leading-none">⚾</span>
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  Baseball &amp; Softball Analytics
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
              borderColor: COLOR_BB + '33',
              background: `linear-gradient(135deg, ${COLOR_BB}0f 0%, ${COLOR_SB}0a 100%)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none mt-0.5">⚾</span>
              <div className="space-y-1.5">
                <p className="font-rajdhani text-2xl font-bold leading-tight text-white tracking-wide">
                  {totalSessions} sessions tracked · {baseballCount} baseball, {softballCount} softball
                </p>
                <p className="text-sm font-mono-jb text-white/55 leading-relaxed">
                  Baseball &amp; softball are <span className="text-white/80">intermittent burst</span> sports — extended periods at
                  ~90–110 bpm baseline punctuated by explosive sprints and throws that spike HR to 150–175 bpm.
                  Pitch count management and heat-load monitoring are the two strongest evidence-based injury
                  and safety interventions.
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_BB + '22', color: COLOR_BB }}>
                    {baseballCount} ⚾
                  </span>
                  <span className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                    style={{ background: COLOR_SB + '22', color: COLOR_SB }}>
                    {softballCount} 🥎
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Duration</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_BB }}>
                  {avgDurationMin}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">minutes / session</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Intensity</p>
                <p className="font-rajdhani text-5xl font-bold leading-none" style={{ color: COLOR_SB }}>
                  {avgKcalPerMin}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">kcal / min</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Avg Heart Rate</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-rose-400">
                  {avgHRAll}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30">bpm across sessions</p>
              </div>

            </div>
          </div>

          {/* ── Monthly session volume chart ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Monthly Session Volume
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Sessions per month — baseball vs softball split
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      {value}
                    </span>
                  )}
                />
                <Bar dataKey="baseball" name="Baseball" fill={COLOR_BB} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                <Bar dataKey="softball" name="Softball"  fill={COLOR_SB} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Intensity distribution ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Session Intensity Distribution
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Bucketed by average heart rate — low &lt;95 bpm · moderate 95–110 · high &gt;110
            </p>

            {/* Stacked bar */}
            <div className="h-5 w-full rounded-full overflow-hidden flex mb-3">
              <div style={{ width: `${highPct}%`, background: COLOR_HIGH }} />
              <div style={{ width: `${moderatePct}%`, background: COLOR_MODERATE }} />
              <div style={{ width: `${lowPct}%`, background: COLOR_LOW }} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'High',     count: highCount,     pct: highPct,     color: COLOR_HIGH,     hint: '> 110 bpm' },
                { label: 'Moderate', count: moderateCount, pct: moderatePct, color: COLOR_MODERATE, hint: '95–110 bpm' },
                { label: 'Low',      count: lowCount,      pct: lowPct,      color: COLOR_LOW,      hint: '< 95 bpm' },
              ].map(({ label, count, pct, color, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border p-3 space-y-1 text-center"
                  style={{ borderColor: color + '33', background: color + '0d' }}
                >
                  <p className="font-rajdhani text-3xl font-bold leading-none" style={{ color }}>
                    {pct}%
                  </p>
                  <p className="text-[10px] font-mono-jb font-medium" style={{ color }}>{label}</p>
                  <p className="text-[9px] font-mono-jb text-white/30">{count} sessions</p>
                  <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[10px] font-mono-jb text-white/30 leading-relaxed">
              Intermittent burst profile: most sessions fall in the moderate zone with short excursions into high
              intensity during pitching, batting, and base-running. Heat adds 5–10 bpm to baseline — a key
              factor in summer games (Casa et al. 2015).
            </p>
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
                const typeColor  = s.type === 'baseball' ? COLOR_BB : COLOR_SB
                const typeLabel  = s.type === 'baseball' ? 'Baseball ⚾' : 'Softball 🥎'
                const kindBadge  = s.sessionKind === 'game' ? 'Game' : 'Practice'
                const intensity  = intensityLabel(s.avgHR)
                const kcalPerMin = (s.calories / s.durationMin).toFixed(1)

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border p-3.5 flex items-center gap-3"
                    style={{ borderColor: typeColor + '28', background: typeColor + '08' }}
                  >
                    {/* Sport dot */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                      style={{ background: typeColor + '22' }}
                    >
                      {s.type === 'baseball' ? '⚾' : '🥎'}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-rajdhani font-semibold tracking-wide"
                          style={{ color: typeColor }}
                        >
                          {typeLabel}
                        </span>
                        <span
                          className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                          style={{ background: typeColor + '22', color: typeColor }}
                        >
                          {kindBadge}
                        </span>
                        <span
                          className="text-[9px] font-mono-jb px-1.5 py-0.5 rounded-full"
                          style={{ background: intensity.bg, color: intensity.color }}
                        >
                          {intensity.label}
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
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── HR profile explainer ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-white/40" />
                <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                  How Apple Watch Measures Baseball &amp; Softball
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
              {[
                {
                  icon: '📡',
                  title: 'Optical HR Sensor',
                  body: 'Photoplethysmography samples HR every ~5 s during workouts. Intermittent inactivity (fielding, between innings) can cause brief sensor disengagement — logged sessions may underestimate peak intensity.',
                },
                {
                  icon: '⚡',
                  title: 'Burst Detection',
                  body: 'Accelerometer + gyroscope detect explosive arm, wrist, and body movements. Apple classifies these under "Baseball" or "Softball" workout types and attributes active calorie burns accordingly.',
                },
                {
                  icon: '🌡️',
                  title: 'Heat Load Context',
                  body: 'Apple Watch does not directly measure ambient temperature, but elevated resting HR and accelerated caloric burn in summer sessions are indirect heat-stress indicators. Log workout conditions manually for full context.',
                },
                {
                  icon: '📊',
                  title: 'Calorie Calculation',
                  body: 'Active calories = HR-based metabolic equivalent (MET) × body weight × duration. For intermittent sports, this tends to be slightly underestimated versus continuous-effort sports at the same HR.',
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="px-4 py-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{icon}</span>
                    <p className="font-rajdhani font-semibold text-sm text-white/80 tracking-wide">{title}</p>
                  </div>
                  <p className="text-[10px] font-mono-jb text-white/40 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pitch count / heat safety callout ── */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 flex items-start gap-3">
            <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                Pitcher Load &amp; Heat Safety
              </p>
              <p className="text-[10px] font-mono-jb text-white/50 leading-relaxed">
                Apple Watch cannot count pitches or directly detect elbow valgus stress — the primary UCL injury risk
                vector (Escamilla &amp; Andrews 2009). Combine this dashboard with a dedicated pitch-count tracker.
                For summer games, monitor HR trend: sustained elevation above your session average may indicate early
                heat illness rather than true exertion (Casa et al. 2015).
              </p>
            </div>
          </div>

          {/* ── Fitness model card ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Physiological Profile
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Baseline HR',  value: '90–110',  unit: 'bpm', color: COLOR_BB,  hint: 'between bursts' },
                { label: 'Burst HR',     value: '150–175', unit: 'bpm', color: '#f87171', hint: 'sprinting/pitching' },
                { label: 'Aerobic base', value: 'Medium',  unit: '',    color: COLOR_SB,  hint: 'recovery between plays' },
                { label: 'Peak power',   value: 'High',    unit: '',    color: '#a78bfa', hint: 'explosive actions' },
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
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-blue-500/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="space-y-3">
                <p className="font-rajdhani font-semibold text-sm text-blue-400 tracking-wide">
                  Science &amp; Evidence Base
                </p>

                <div className="space-y-3 text-xs text-white/55 leading-relaxed font-mono-jb">

                  {/* Key insight banner */}
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.08] p-3 space-y-1">
                    <p className="text-blue-300/80 font-semibold text-[11px]">Key number to know</p>
                    <p className="text-white/65">
                      Overhead throwing generates elbow valgus stress up to{' '}
                      <span className="text-white font-semibold">64 Nm</span> — the highest load of any
                      athletic movement. Pitch count management is the primary UCL injury prevention strategy
                      supported by evidence.
                    </p>
                  </div>

                  <div className="border-l-2 border-blue-500/30 pl-3 space-y-2.5">
                    <p>
                      <span className="text-blue-300/80">Escamilla RF &amp; Andrews JR (2009)</span>
                      {' '}— "Shoulder muscle recruitment patterns and related biomechanics during upper extremity sports."
                      {' '}<em>Sports Med</em> 39(7):569–590.
                      {' '}Quantified elbow valgus stress during overhead throwing; established the 64 Nm peak load figure
                      that underpins modern pitch-count regulations.
                    </p>
                    <p>
                      <span className="text-blue-300/80">Spurway N (2007)</span>
                      {' '}— "Optimal training for team sports: a physiological perspective."
                      {' '}<em>J Sports Sci</em> 25(S1):S1–S10.
                      {' '}Intermittent sports require dual conditioning: adequate aerobic base to support
                      repeated sprint recovery, plus dedicated peak-power and speed development. Neither alone
                      is sufficient.
                    </p>
                    <p>
                      <span className="text-blue-300/80">Casa DJ et al. (2015)</span>
                      {' '}— "National Athletic Trainers' Association position statement: exertional heat illnesses."
                      {' '}<em>J Strength Cond Res</em> 29(4):1184–1188.
                      {' '}Baseball is a leading cause of exertional heat illness in youth sports. HR monitoring
                      during summer games is a recommended safety intervention — sustained HR elevation
                      beyond expected exertion is an early warning sign.
                    </p>
                  </div>

                  <p className="text-white/30 text-[10px]">
                    Apple Watch HR data complements, but does not replace, pitch-count tracking or
                    certified athletic trainer assessment for youth and competitive players.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Flames total ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-4">
            <div className="rounded-full p-3 bg-orange-500/10 shrink-0">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Total Active Calories</p>
              <p className="font-rajdhani text-3xl font-bold leading-none text-orange-400">
                {totalCalories.toLocaleString()}
                <span className="font-mono-jb text-sm font-normal text-white/30 ml-1.5">kcal</span>
              </p>
              <p className="text-[10px] font-mono-jb text-white/30 mt-0.5">
                across {totalSessions} sessions · {Math.round(totalMinutes / 60)} hrs total field time
              </p>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
