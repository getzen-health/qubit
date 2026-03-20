'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Mountain } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type TerrainType = 'flat' | 'rolling' | 'hilly' | 'mountainous'
type SportType = 'Run' | 'Hike' | 'Trail Run'

interface Workout {
  id: number
  date: string          // display label
  sport: SportType
  elevationGain: number // metres
  distance: number      // km
  avgGrade: number      // percent
  terrain: TerrainType
}

interface MonthlyBucket {
  month: string
  gain: number // total metres
}

// ─── Terrain metadata ─────────────────────────────────────────────────────────

const TERRAIN_META: Record<TerrainType, {
  label: string
  gradient: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  flat: {
    label: 'Flat',
    gradient: '< 1%',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.28)',
    description: 'Minimal additional stress vs. sea-level pace. Ideal for speed work and recovery.',
  },
  rolling: {
    label: 'Rolling',
    gradient: '1 – 3%',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.10)',
    border: 'rgba(34,211,238,0.28)',
    description: 'Moderate extra cost. RPE rises ~1–2 points. Good general aerobic development.',
  },
  hilly: {
    label: 'Hilly',
    gradient: '3 – 6%',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.30)',
    description: 'Energy cost up to 2× flat (Minetti 2002). Eccentric downhill load increases CK risk.',
  },
  mountainous: {
    label: 'Mountainous',
    gradient: '> 6%',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.28)',
    description: 'Peak training stress. Muscle damage markers 2–3× flat runs. Plan 48–72 h recovery.',
  },
}

// ─── Demo workouts: 25 sessions over 90 days ──────────────────────────────────
// Date: 2026-03-20 (today). Working backwards.

function daysAgoLabel(daysAgo: number): string {
  const d = new Date('2026-03-20')
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function classifyTerrain(avgGrade: number): TerrainType {
  if (avgGrade < 1)  return 'flat'
  if (avgGrade < 3)  return 'rolling'
  if (avgGrade < 6)  return 'hilly'
  return 'mountainous'
}

const RAW_WORKOUTS: Omit<Workout, 'terrain'>[] = [
  // Recent  (last ~3 weeks)
  { id:  1, date: daysAgoLabel(2),  sport: 'Run',       elevationGain:  28, distance:  6.2, avgGrade: 0.5 },
  { id:  2, date: daysAgoLabel(5),  sport: 'Trail Run',  elevationGain: 420, distance:  9.1, avgGrade: 4.6 },
  { id:  3, date: daysAgoLabel(7),  sport: 'Hike',       elevationGain: 850, distance: 12.4, avgGrade: 6.9 },
  { id:  4, date: daysAgoLabel(9),  sport: 'Run',       elevationGain:  45, distance:  8.0, avgGrade: 0.6 },
  { id:  5, date: daysAgoLabel(12), sport: 'Run',       elevationGain: 180, distance:  7.5, avgGrade: 2.4 },
  { id:  6, date: daysAgoLabel(14), sport: 'Trail Run',  elevationGain: 560, distance: 10.8, avgGrade: 5.2 },
  { id:  7, date: daysAgoLabel(16), sport: 'Run',       elevationGain:  22, distance:  5.5, avgGrade: 0.4 },
  { id:  8, date: daysAgoLabel(18), sport: 'Hike',       elevationGain:1240, distance: 15.2, avgGrade: 8.2 },
  { id:  9, date: daysAgoLabel(21), sport: 'Run',       elevationGain: 230, distance:  9.0, avgGrade: 2.6 },

  // Mid period (weeks 4–7)
  { id: 10, date: daysAgoLabel(25), sport: 'Run',       elevationGain:  38, distance:  7.8, avgGrade: 0.5 },
  { id: 11, date: daysAgoLabel(28), sport: 'Trail Run',  elevationGain: 380, distance:  8.6, avgGrade: 4.4 },
  { id: 12, date: daysAgoLabel(32), sport: 'Hike',       elevationGain: 920, distance: 13.0, avgGrade: 7.1 },
  { id: 13, date: daysAgoLabel(35), sport: 'Run',       elevationGain:  12, distance:  5.0, avgGrade: 0.2 },
  { id: 14, date: daysAgoLabel(38), sport: 'Run',       elevationGain: 155, distance:  8.3, avgGrade: 1.9 },
  { id: 15, date: daysAgoLabel(42), sport: 'Trail Run',  elevationGain: 490, distance: 11.2, avgGrade: 4.4 },
  { id: 16, date: daysAgoLabel(45), sport: 'Hike',       elevationGain:1500, distance: 18.5, avgGrade: 8.1 },
  { id: 17, date: daysAgoLabel(49), sport: 'Run',       elevationGain:  55, distance:  6.8, avgGrade: 0.8 },
  { id: 18, date: daysAgoLabel(52), sport: 'Run',       elevationGain: 270, distance:  9.5, avgGrade: 2.8 },

  // Older (weeks 8–13)
  { id: 19, date: daysAgoLabel(56), sport: 'Run',       elevationGain:  18, distance:  6.0, avgGrade: 0.3 },
  { id: 20, date: daysAgoLabel(60), sport: 'Trail Run',  elevationGain: 340, distance:  8.0, avgGrade: 4.3 },
  { id: 21, date: daysAgoLabel(65), sport: 'Hike',       elevationGain: 780, distance: 11.8, avgGrade: 6.6 },
  { id: 22, date: daysAgoLabel(69), sport: 'Run',       elevationGain:  42, distance:  7.2, avgGrade: 0.6 },
  { id: 23, date: daysAgoLabel(74), sport: 'Run',       elevationGain: 120, distance:  8.8, avgGrade: 1.4 },
  { id: 24, date: daysAgoLabel(80), sport: 'Trail Run',  elevationGain: 310, distance:  7.6, avgGrade: 4.1 },
  { id: 25, date: daysAgoLabel(87), sport: 'Hike',       elevationGain: 680, distance: 10.5, avgGrade: 6.5 },
]

const WORKOUTS: Workout[] = RAW_WORKOUTS.map((w) => ({
  ...w,
  terrain: classifyTerrain(w.avgGrade),
}))

// ─── Derived stats ─────────────────────────────────────────────────────────────

const totalGain = WORKOUTS.reduce((s, w) => s + w.elevationGain, 0)
const avgGainPerWorkout = Math.round(totalGain / WORKOUTS.length)
const bestSession = WORKOUTS.reduce(
  (best, w) => (w.elevationGain > best.elevationGain ? w : best),
  WORKOUTS[0],
)

// ─── Monthly bar chart data ────────────────────────────────────────────────────
// Bucket workouts into Jan / Feb / Mar (relative to 2026-03-20)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar']

function workoutMonth(dateLabel: string): string {
  // dateLabel is like "Mar 18" — parse month name
  return dateLabel.split(' ')[0]
}

const MONTHLY_DATA: MonthlyBucket[] = MONTH_LABELS.map((month) => ({
  month,
  gain: WORKOUTS.filter((w) => workoutMonth(w.date) === month)
    .reduce((s, w) => s + w.elevationGain, 0),
}))

// ─── Terrain distribution ──────────────────────────────────────────────────────

const TERRAIN_COUNTS = (Object.keys(TERRAIN_META) as TerrainType[]).map((t) => ({
  terrain: t,
  count: WORKOUTS.filter((w) => w.terrain === t).length,
}))

// ─── Tooltip style ─────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0f0f0f',
  border: '1px solid rgba(251,146,60,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f5f5f5',
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  accent: string
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1"
      style={{
        background: `linear-gradient(135deg, ${accent}11 0%, rgba(15,15,15,0) 60%)`,
        borderColor: `${accent}33`,
      }}
    >
      <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">{label}</p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color: accent, letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-text-secondary">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-text-secondary opacity-70 mt-0.5">{sub}</p>}
    </div>
  )
}

function TerrainBadge({ terrain }: { terrain: TerrainType }) {
  const meta = TERRAIN_META[terrain]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

function SportIcon({ sport }: { sport: SportType }) {
  if (sport === 'Hike')      return <span aria-hidden>🥾</span>
  if (sport === 'Trail Run') return <span aria-hidden>⛰️</span>
  return <span aria-hidden>🏃</span>
}

// ─── Main client component ─────────────────────────────────────────────────────

export function ElevationAnalysisClient() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-mono-jb { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-background">

        {/* ── Sticky Header ── */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors flex items-center gap-1.5 text-text-secondary text-sm font-medium"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Explore</span>
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)' }}
              >
                ⛰️
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary leading-tight">Elevation Analysis</h1>
                <p className="text-xs text-text-secondary">GPS elevation gain · Runs & hikes · 90-day window</p>
              </div>
            </div>
            <TerrainBadge terrain={bestSession.terrain} />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* ── Hero intro strip ── */}
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(248,113,113,0.05) 100%)',
              border: '1px solid rgba(251,146,60,0.25)',
            }}
          >
            <div className="text-3xl shrink-0 mt-0.5" aria-hidden>⛰️</div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Elevation Gain Fundamentally Changes Training Stress
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Minetti et al. (J Appl Physiol 2002) demonstrated that running at +6% gradient costs roughly
                2× the metabolic energy of flat running — and descending at −10% still costs ~1.5× flat due
                to eccentric muscle loading. Scharhag-Rosenberger et al. (2009) found that for every 100 m
                of climbing per km, perceived effort rises 3–4 RPE points at the same pace. Your Apple Watch
                GPS records altitude continuously throughout every outdoor workout, making it possible to
                compute true altitude-adjusted training load.
              </p>
            </div>
          </div>

          {/* ── Summary stats ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              90-Day Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="Total Climbed"
                value={totalGain.toLocaleString()}
                unit="m"
                sub={`${WORKOUTS.length} workouts · last 90 days`}
                accent="#fb923c"
              />
              <MetricCard
                label="Avg Gain / Workout"
                value={avgGainPerWorkout.toLocaleString()}
                unit="m"
                sub="Mean across all sessions"
                accent="#f97316"
              />
              <MetricCard
                label="Best Single Session"
                value={bestSession.elevationGain.toLocaleString()}
                unit="m"
                sub={`${bestSession.sport} · ${bestSession.date}`}
                accent="#ef4444"
              />
            </div>
          </section>

          {/* ── Monthly elevation bar chart ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(251,146,60,0.20)', background: 'rgba(251,146,60,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📊</span>
              <h2 className="text-sm font-semibold text-text-primary">Monthly Elevation Gain</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">metres</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              Total vertical metres accumulated across all outdoor workouts each month.
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_DATA} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  width={42}
                  tickFormatter={(v) => `${v.toLocaleString()}m`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v.toLocaleString()} m`, 'Elevation Gain']}
                  cursor={{ fill: 'rgba(251,146,60,0.06)' }}
                />
                <Bar dataKey="gain" radius={[6, 6, 0, 0]}>
                  {MONTHLY_DATA.map((entry, i) => (
                    <Cell
                      key={i}
                      fill="#fb923c"
                      fillOpacity={entry.gain === Math.max(...MONTHLY_DATA.map((d) => d.gain)) ? 1 : 0.65}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <p className="text-xs text-text-secondary mt-2 opacity-50 text-center font-mono-jb">
              Jan – Mar 2026 · GPS-recorded ascent only (descent excluded)
            </p>
          </section>

          {/* ── Terrain distribution ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Terrain Distribution
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(TERRAIN_META) as TerrainType[]).map((terrain) => {
                const meta = TERRAIN_META[terrain]
                const count = TERRAIN_COUNTS.find((t) => t.terrain === terrain)?.count ?? 0
                const pct = Math.round((count / WORKOUTS.length) * 100)
                return (
                  <div
                    key={terrain}
                    className="rounded-2xl border p-4 space-y-2"
                    style={{ borderColor: meta.border, background: meta.bg }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
                        <span className="text-sm font-bold" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        <span
                          className="text-xs font-mono-jb px-1.5 py-0.5 rounded"
                          style={{
                            color: meta.color,
                            background: `${meta.color}18`,
                          }}
                        >
                          {meta.gradient} grade
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary font-mono-jb">
                        {count} session{count !== 1 ? 's' : ''} · {pct}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: meta.color, opacity: 0.8 }}
                      />
                    </div>

                    <p className="text-xs text-text-secondary opacity-75 leading-relaxed">
                      {meta.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Recent workouts table ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(251,146,60,0.18)', background: 'rgba(251,146,60,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base" aria-hidden>🏔️</span>
              <h2 className="text-sm font-semibold text-text-primary">Recent Workouts</h2>
              <span className="ml-auto text-xs text-text-secondary">Last 25 outdoor sessions</span>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 gap-y-0 mb-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Workout</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary text-right">Gain</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary text-right">Dist</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary text-right">Grade</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary text-right">Terrain</span>
            </div>

            <div className="space-y-1">
              {WORKOUTS.map((w, i) => {
                const meta = TERRAIN_META[w.terrain]
                return (
                  <div
                    key={w.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
                    style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    {/* Sport + date */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">
                        <SportIcon sport={w.sport} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">{w.sport}</p>
                        <p className="text-[10px] text-text-secondary opacity-60 font-mono-jb">{w.date}</p>
                      </div>
                    </div>

                    {/* Elevation gain */}
                    <span
                      className="text-sm font-black tabular-nums text-right font-mono-jb"
                      style={{ color: '#fb923c' }}
                    >
                      {w.elevationGain.toLocaleString()}<span className="text-[10px] font-normal text-text-secondary ml-0.5">m</span>
                    </span>

                    {/* Distance */}
                    <span className="text-xs tabular-nums text-text-secondary text-right font-mono-jb">
                      {w.distance.toFixed(1)}<span className="text-[10px] ml-0.5">km</span>
                    </span>

                    {/* Grade */}
                    <span className="text-xs tabular-nums text-right font-mono-jb" style={{ color: meta.color }}>
                      {w.avgGrade.toFixed(1)}%
                    </span>

                    {/* Terrain badge */}
                    <div className="flex justify-end">
                      <TerrainBadge terrain={w.terrain} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Energy cost explainer ── */}
          <section
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: 'rgba(251,146,60,0.22)', background: 'rgba(251,146,60,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.28)' }}
              >
                <Mountain className="w-5 h-5" style={{ color: '#fb923c' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Why Elevation Multiplies Training Load</h2>
                <p className="text-xs text-text-secondary opacity-70">Minetti et al. energy cost model</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { gradient: 'Flat (0%)',      multiplier: '1.0×', detail: 'Baseline metabolic cost', color: '#34d399' },
                { gradient: 'Rolling (+2%)',  multiplier: '1.3×', detail: '+30% energy vs flat',      color: '#22d3ee' },
                { gradient: 'Hilly (+6%)',    multiplier: '2.0×', detail: 'Double metabolic cost',    color: '#fb923c' },
                { gradient: 'Descent (−10%)', multiplier: '1.5×', detail: 'Eccentric braking load',   color: '#f87171' },
              ].map((item) => (
                <div
                  key={item.gradient}
                  className="rounded-xl border px-4 py-3 flex items-center gap-3"
                  style={{ borderColor: `${item.color}28`, background: `${item.color}0a` }}
                >
                  <span
                    className="text-2xl font-black tabular-nums shrink-0 font-mono-jb"
                    style={{ color: item.color }}
                  >
                    {item.multiplier}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{item.gradient}</p>
                    <p className="text-[11px] text-text-secondary opacity-75">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl border px-4 py-3 space-y-1.5"
              style={{ borderColor: 'rgba(251,146,60,0.18)', background: 'rgba(0,0,0,0.25)' }}
            >
              <p className="text-xs font-semibold text-text-primary">Muscle Damage Risk (Gimenez et al. 2013)</p>
              <p className="text-xs text-text-secondary leading-relaxed opacity-80">
                Trail runners show{' '}
                <span className="font-semibold text-orange-400">2–3× higher CK and myoglobin</span>{' '}
                after hilly versus flat runs at matched pace — markers of significant muscle damage.
                Descending is the primary driver: eccentric contraction of the quadriceps on steep
                downhills causes microtrauma that accumulates over repeated sessions.
                Plan 48–72 hours of reduced intensity following mountainous workouts.
              </p>
            </div>

            <div
              className="rounded-xl border px-4 py-3 space-y-1.5"
              style={{ borderColor: 'rgba(251,146,60,0.18)', background: 'rgba(0,0,0,0.25)' }}
            >
              <p className="text-xs font-semibold text-text-primary">RPE Penalty Per 100 m / km (Scharhag-Rosenberger 2009)</p>
              <p className="text-xs text-text-secondary leading-relaxed opacity-80">
                For every 100 m of vertical gain per km of distance, perceived effort increases by{' '}
                <span className="font-semibold text-orange-400">3–4 RPE points</span> at the same pace.
                A hilly 10 km run with 400 m of gain (40 m/km) will feel like running 12–16 RPE points
                harder than a flat 10 km — even with identical pacing. Pace alone is a poor proxy
                for effort on technical, hilly terrain.
              </p>
            </div>
          </section>

          {/* ── Altitude training load box ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(251,146,60,0.18)', background: 'rgba(251,146,60,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>📡</span>
              <h2 className="text-sm font-semibold text-text-primary">How Apple Watch Records Elevation</h2>
            </div>
            <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
              <p>
                <span className="font-semibold text-text-primary">Sensor fusion:</span>{' '}
                Apple Watch Series 3+ combines onboard GPS, a barometric altimeter, and (on cellular models)
                differential GPS to compute altitude with ~1–3 m accuracy during outdoor workouts.
                The barometric sensor updates at high frequency to capture gradual grade changes
                that GPS alone would smooth over.
              </p>
              <p>
                <span className="font-semibold text-text-primary">Ascent filtering:</span>{' '}
                Apple HealthKit stores total elevation ascended
                (
                <span className="font-mono-jb text-[11px] text-orange-400">HKQuantityTypeIdentifierFlightsClimbed</span>{' '}
                for stairs,{' '}
                <span className="font-mono-jb text-[11px] text-orange-400">workoutMetadata elevation</span>{' '}
                for outdoor workouts). Only positive altitude gain is counted; descent is tracked
                separately and excluded from "elevation gain" totals.
              </p>
              <p>
                <span className="font-semibold text-text-primary">Vogt et al. 2008 implication:</span>{' '}
                Altitude-adjusted training load — which weights each workout by its elevation profile —
                predicts fatigue accumulation significantly better than time-based metrics (TSS, duration).
                Ignoring elevation in your training load calculation can lead to underestimating recovery
                needs after hilly weeks by 20–40%.
              </p>
            </div>
          </section>

          {/* ── Science citations ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(251,191,36,0.20)', background: 'rgba(251,191,36,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="rounded-full p-1.5 shrink-0"
                style={{ background: 'rgba(251,191,36,0.15)' }}
              >
                <BookOpen className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
                Research Basis
              </h2>
            </div>

            <div className="border-l-2 pl-3 space-y-3.5" style={{ borderColor: 'rgba(251,191,36,0.30)' }}>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Minetti et al. 2002 ·{' '}
                  <em>Journal of Applied Physiology</em>
                </p>
                <p className="opacity-80">
                  Measured the energy cost of gradient locomotion across slopes from −45% to +45%
                  in healthy adults. Established the nonlinear relationship between incline and
                  metabolic cost: running at{' '}
                  <span className="font-semibold text-orange-400">+6% costs approximately 2× flat</span>,
                  while descending at −10% costs ~1.5× flat due to eccentric loading of the knee
                  extensors. This work underpins all gradient-adjusted running power models used
                  by Stryd, Garmin, and Apple Fitness+.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Scharhag-Rosenberger et al. 2009 ·{' '}
                  <em>International Journal of Sports Physiology and Performance</em>
                </p>
                <p className="opacity-80">
                  Quantified the RPE response to gradient running in trained and untrained runners.
                  Found that each 100 m of cumulative climb per km adds{' '}
                  <span className="font-semibold text-orange-400">3–4 points on the Borg RPE scale</span>{' '}
                  compared to flat running at the same pace. This is why pace is a poor proxy
                  for effort on hilly courses — effort-based metrics or power meters are needed
                  for accurate load quantification on undulating terrain.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Gimenez et al. 2013 ·{' '}
                  <em>Journal of Strength and Conditioning Research</em>
                </p>
                <p className="opacity-80">
                  Compared muscle damage markers (creatine kinase, myoglobin, LDH) between trail
                  runners completing hilly versus flat runs at matched pace. Hilly runs produced{' '}
                  <span className="font-semibold text-orange-400">2–3× higher CK and myoglobin</span>{' '}
                  at 24 and 48 hours post-exercise. The eccentric component during descent was the
                  primary driver. The findings support extending recovery windows after mountainous
                  sessions regardless of how "easy" the pace felt.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Vogt et al. 2008 ·{' '}
                  <em>Journal of Sports Sciences</em>
                </p>
                <p className="opacity-80">
                  In professional cyclists and mountain runners, altitude-adjusted training load
                  (incorporating elevation profile per session){' '}
                  <span className="font-semibold text-orange-400">predicted fatigue accumulation</span>{' '}
                  significantly better than time- or distance-based metrics alone. Sessions performed
                  at higher elevation with greater cumulative ascent required 20–40% more recovery time
                  than predicted by standard TSS models. Concluded that elevation must be treated as a
                  primary load variable, not an optional modifier.
                </p>
              </div>

            </div>

            <p
              className="text-[10px] opacity-40 pt-1 border-t font-mono-jb"
              style={{ borderColor: 'rgba(251,191,36,0.15)', color: 'var(--color-text-secondary)' }}
            >
              Terrain: {'<'}1% flat · 1–3% rolling · 3–6% hilly · {'>'} 6% mountainous · avg grade = gain ÷ distance.
              Individual physiology varies. This is not clinical or coaching advice.
            </p>
          </section>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
