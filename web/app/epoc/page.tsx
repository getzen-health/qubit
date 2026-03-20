'use client'

import Link from 'next/link'
import { ArrowLeft, Flame, Zap, TrendingUp, Info } from 'lucide-react'
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

// ─── EPOC Science ────────────────────────────────────────────────────────────
// Borsheim & Bahr 2003 (Sports Med): EPOC is proportional to exercise intensity
// LaForgia et al. 2006 (J Sports Sci): HIIT produces ~6× more EPOC than
// steady-state aerobic exercise. EPOC from HIIT can persist 12–24 hours.
//
// Intensity factors (kcal × factor = EPOC kcal):
//   Light    < 5 kcal/min  → 5%
//   Moderate 5–10 kcal/min → 10%
//   Vigorous 10–15 kcal/min → 15%
//   Maximal  > 15 kcal/min → 20%
// ─────────────────────────────────────────────────────────────────────────────

type IntensityLevel = 'Light' | 'Moderate' | 'Vigorous' | 'Maximal'

interface Session {
  date: string
  sport: string
  durationMin: number
  workoutKcal: number
  intensity: IntensityLevel
}

const INTENSITY_META: Record<
  IntensityLevel,
  { factor: number; color: string; bgColor: string; borderColor: string; kcalPerMin: string }
> = {
  Light:    { factor: 0.05, color: '#facc15', bgColor: 'rgba(250,204,21,0.12)',  borderColor: 'rgba(250,204,21,0.25)',  kcalPerMin: '< 5 kcal/min' },
  Moderate: { factor: 0.10, color: '#fb923c', bgColor: 'rgba(251,146,60,0.12)',  borderColor: 'rgba(251,146,60,0.25)',  kcalPerMin: '5–10 kcal/min' },
  Vigorous: { factor: 0.15, color: '#f97316', bgColor: 'rgba(249,115,22,0.12)',  borderColor: 'rgba(249,115,22,0.25)',  kcalPerMin: '10–15 kcal/min' },
  Maximal:  { factor: 0.20, color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)',   borderColor: 'rgba(239,68,68,0.25)',   kcalPerMin: '> 15 kcal/min' },
}

function epocKcal(session: Session): number {
  return Math.round(session.workoutKcal * INTENSITY_META[session.intensity].factor)
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
// Active user mixing running, HIIT, and yoga over last ~8 weeks

const RECENT_SESSIONS: Session[] = [
  { date: '2026-03-19', sport: 'HIIT',           durationMin: 32, workoutKcal: 520, intensity: 'Maximal'  },
  { date: '2026-03-17', sport: 'Running',        durationMin: 48, workoutKcal: 480, intensity: 'Vigorous' },
  { date: '2026-03-15', sport: 'Yoga',           durationMin: 55, workoutKcal: 180, intensity: 'Light'    },
  { date: '2026-03-14', sport: 'HIIT',           durationMin: 28, workoutKcal: 470, intensity: 'Maximal'  },
  { date: '2026-03-12', sport: 'Running',        durationMin: 60, workoutKcal: 560, intensity: 'Vigorous' },
  { date: '2026-03-10', sport: 'Strength',       durationMin: 50, workoutKcal: 340, intensity: 'Moderate' },
  { date: '2026-03-08', sport: 'HIIT',           durationMin: 25, workoutKcal: 430, intensity: 'Maximal'  },
  { date: '2026-03-06', sport: 'Running',        durationMin: 35, workoutKcal: 310, intensity: 'Moderate' },
]

// 8 weeks of weekly EPOC totals
const WEEKLY_DATA = [
  { week: 'Jan 27', epoc: 148 },
  { week: 'Feb 3',  epoc: 201 },
  { week: 'Feb 10', epoc: 176 },
  { week: 'Feb 17', epoc: 232 },
  { week: 'Feb 24', epoc: 258 },
  { week: 'Mar 3',  epoc: 215 },
  { week: 'Mar 10', epoc: 289 },
  { week: 'Mar 17', epoc: 194 },
]

// 30-day EPOC by sport (horizontal bar)
const EPOC_BY_SPORT = [
  { sport: 'HIIT',     epoc: 398 },
  { sport: 'Running',  epoc: 247 },
  { sport: 'Strength', epoc: 96  },
  { sport: 'Yoga',     epoc: 27  },
]

// ─── Derived stats ────────────────────────────────────────────────────────────
const weeklyEpoc = WEEKLY_DATA[WEEKLY_DATA.length - 1].epoc +
  WEEKLY_DATA[WEEKLY_DATA.length - 2].epoc // last 2 partial weeks
const currentWeekEpoc = WEEKLY_DATA[WEEKLY_DATA.length - 1].epoc
const allSessionEpocs = RECENT_SESSIONS.map(epocKcal)
const avgEpocPerSession = Math.round(allSessionEpocs.reduce((a, b) => a + b, 0) / allSessionEpocs.length)
const bestSessionEpoc = Math.max(...allSessionEpocs)
const totalWeeklyEpoc = WEEKLY_DATA.slice(-4).reduce((s, w) => s + w.epoc, 0)
const maxWeeklyEpoc = Math.max(...WEEKLY_DATA.map((w) => w.epoc))

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const SPORT_COLORS: Record<string, string> = {
  HIIT:     '#ef4444',
  Running:  '#f97316',
  Strength: '#fb923c',
  Yoga:     '#facc15',
  Cycling:  '#f59e0b',
}
function sportColor(sport: string) {
  return SPORT_COLORS[sport] ?? '#fb923c'
}

// ─── Tooltip style ────────────────────────────────────────────────────────────
const tooltipStyle = {
  background: '#111',
  border: '1px solid rgba(251,146,60,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f5f5f5',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
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
  accent?: string
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1"
      style={{
        background: 'linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(15,15,15,0) 60%)',
        borderColor: accent ? `${accent}33` : 'rgba(251,146,60,0.18)',
      }}
    >
      <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">{label}</p>
      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color: accent ?? '#f97316', letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        {unit && <span className="text-sm font-semibold text-text-secondary">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-text-secondary opacity-70 mt-0.5">{sub}</p>}
    </div>
  )
}

function IntensityBadge({ level }: { level: IntensityLevel }) {
  const meta = INTENSITY_META[level]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{
        color: meta.color,
        background: meta.bgColor,
        border: `1px solid ${meta.borderColor}`,
      }}
    >
      {level}
    </span>
  )
}

// Mini stacked bar showing workout kcal vs EPOC kcal
function MiniStackedBar({ workoutKcal, epocKcalVal }: { workoutKcal: number; epocKcalVal: number }) {
  const total = workoutKcal + epocKcalVal
  const workoutPct = (workoutKcal / total) * 100
  const epocPct = (epocKcalVal / total) * 100
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-l-full transition-all"
          style={{ width: `${workoutPct}%`, background: 'rgba(148,163,184,0.5)' }}
        />
        <div
          className="h-full rounded-r-full transition-all"
          style={{ width: `${epocPct}%`, background: 'linear-gradient(90deg, #f97316, #ef4444)' }}
        />
      </div>
      <span className="text-xs text-text-secondary font-mono whitespace-nowrap">
        +{epocKcalVal} kcal
      </span>
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function EpocPage() {
  return (
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
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
            >
              <Flame className="w-4 h-4" style={{ color: '#f97316' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary leading-tight">EPOC</h1>
              <p className="text-xs text-text-secondary">Afterburn Effect · Last 8 weeks</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Hero intro strip ── */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.13) 0%, rgba(239,68,68,0.08) 100%)',
            border: '1px solid rgba(249,115,22,0.22)',
          }}
        >
          <div className="shrink-0">
            <Zap className="w-7 h-7" style={{ color: '#f97316' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Excess Post-Exercise Oxygen Consumption
            </p>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Your body keeps burning extra calories hours after you stop — restoring ATP, creatine phosphate, and oxygen stores.
              HIIT triggers up to <span className="font-semibold" style={{ color: '#f97316' }}>6× more afterburn</span> than steady-state cardio.
            </p>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label="4-Week EPOC"
            value={totalWeeklyEpoc}
            unit="kcal"
            sub="last 4 weeks"
            accent="#f97316"
          />
          <SummaryCard
            label="Avg / Session"
            value={avgEpocPerSession}
            unit="kcal"
            sub="across 8 sessions"
            accent="#fb923c"
          />
          <SummaryCard
            label="Best Session"
            value={bestSessionEpoc}
            unit="kcal"
            sub="single workout"
            accent="#ef4444"
          />
        </div>

        {/* ── 8-Week Weekly EPOC Bar Chart ── */}
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: 'rgba(251,146,60,0.15)', background: 'rgba(251,146,60,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: '#f97316' }} />
            <h2 className="text-sm font-semibold text-text-primary">Weekly EPOC</h2>
            <span className="ml-auto text-xs text-text-secondary">8 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={30}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} kcal`, 'EPOC']}
                cursor={{ fill: 'rgba(249,115,22,0.08)' }}
              />
              <Bar dataKey="epoc" radius={[5, 5, 0, 0]} maxBarSize={36}>
                {WEEKLY_DATA.map((entry, i) => {
                  const isMax = entry.epoc === maxWeeklyEpoc
                  const intensity = entry.epoc / maxWeeklyEpoc
                  const r = Math.round(239 + (249 - 239) * (1 - intensity))
                  const g = Math.round(68 + (115 - 68) * (1 - intensity))
                  const b = Math.round(68 + (22 - 68) * (1 - intensity))
                  return (
                    <Cell
                      key={i}
                      fill={isMax ? '#ef4444' : `rgb(${r},${g},${b})`}
                      opacity={isMax ? 1 : 0.75}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2 opacity-60 text-center">
            Darker = higher EPOC week · Peak: {maxWeeklyEpoc} kcal
          </p>
        </section>

        {/* ── Recent Sessions ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {RECENT_SESSIONS.map((session, i) => {
              const epoc = epocKcal(session)
              const meta = INTENSITY_META[session.intensity]
              const kcalPerMin = (session.workoutKcal / session.durationMin).toFixed(1)
              return (
                <div
                  key={i}
                  className="rounded-xl border px-4 py-3 space-y-2"
                  style={{
                    borderColor: 'rgba(251,146,60,0.12)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base"
                      style={{ background: `${sportColor(session.sport)}18`, border: `1px solid ${sportColor(session.sport)}30` }}
                    >
                      <span style={{ filter: 'saturate(1.4)' }}>
                        {session.sport === 'HIIT'     ? '⚡'
                        : session.sport === 'Running'  ? '🏃'
                        : session.sport === 'Yoga'     ? '🧘'
                        : session.sport === 'Strength' ? '💪'
                        : '🏋️'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-primary">{session.sport}</span>
                        <IntensityBadge level={session.intensity} />
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {fmtDate(session.date)} · {session.durationMin} min · {kcalPerMin} kcal/min
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: meta.color }}>
                        +{epoc} kcal
                      </p>
                      <p className="text-xs text-text-secondary">{session.workoutKcal} base</p>
                    </div>
                  </div>
                  {/* Mini stacked bar */}
                  <MiniStackedBar workoutKcal={session.workoutKcal} epocKcalVal={epoc} />
                </div>
              )
            })}
          </div>
          {/* Legend for mini bar */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <div className="w-3 h-2 rounded-sm" style={{ background: 'rgba(148,163,184,0.5)' }} />
              Workout kcal
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <div className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)' }} />
              EPOC kcal (afterburn)
            </div>
          </div>
        </section>

        {/* ── EPOC by Sport (30-day horizontal bars) ── */}
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: 'rgba(251,146,60,0.15)', background: 'rgba(251,146,60,0.03)' }}
        >
          <h2 className="text-sm font-semibold text-text-primary mb-4">EPOC by Sport · 30 days</h2>
          <div className="space-y-3">
            {EPOC_BY_SPORT.map((row) => {
              const pct = (row.epoc / EPOC_BY_SPORT[0].epoc) * 100
              return (
                <div key={row.sport} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-16 text-right shrink-0">{row.sport}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${sportColor(row.sport)}cc, ${sportColor(row.sport)})`,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold w-14 shrink-0"
                    style={{ color: sportColor(row.sport) }}
                  >
                    {row.epoc} kcal
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-text-secondary mt-4 opacity-60">
            HIIT dominates afterburn due to higher oxygen debt and metabolic disruption — LaForgia et al. 2006
          </p>
        </section>

        {/* ── Intensity Guide Table ── */}
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: 'rgba(251,146,60,0.15)', background: 'rgba(251,146,60,0.03)' }}
        >
          <h2 className="text-sm font-semibold text-text-primary mb-3">Intensity & EPOC Factors</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-secondary">
                  <th className="text-left pb-2 font-medium">Level</th>
                  <th className="text-left pb-2 font-medium">Rate</th>
                  <th className="text-center pb-2 font-medium">EPOC Factor</th>
                  <th className="text-right pb-2 font-medium">Example: 400 kcal workout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(Object.entries(INTENSITY_META) as [IntensityLevel, typeof INTENSITY_META['Light']][]).map(
                  ([level, meta]) => (
                    <tr key={level}>
                      <td className="py-2.5 pr-3">
                        <IntensityBadge level={level} />
                      </td>
                      <td className="py-2.5 pr-3 text-text-secondary">{meta.kcalPerMin}</td>
                      <td className="py-2.5 text-center font-bold font-mono" style={{ color: meta.color }}>
                        {(meta.factor * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 text-right font-semibold" style={{ color: meta.color }}>
                        +{Math.round(400 * meta.factor)} kcal
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-secondary mt-3 opacity-60">
            EPOC kcal ≈ workout kcal × intensity factor. Factors derived from Borsheim & Bahr 2003.
          </p>
        </section>

        {/* ── Science Card ── */}
        <section
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: 'rgba(251,146,60,0.12)' }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" style={{ color: '#f97316' }} />
            <h2 className="text-sm font-semibold text-text-primary">The Science of Afterburn</h2>
          </div>
          <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
            <div>
              <p className="font-semibold text-text-primary">What causes EPOC?</p>
              <p className="opacity-80 mt-0.5">
                After intense exercise, your body needs extra oxygen to restore phosphocreatine stores,
                clear lactate, resynthesise glycogen, repair micro-tears, and return core temperature to
                baseline. All of this metabolic activity burns additional calories — often called the
                "afterburn effect."
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Borsheim & Bahr 2003 · Sports Medicine</p>
              <p className="opacity-80 mt-0.5">
                Elevated oxygen consumption post-exercise (EPOC) is directly proportional to exercise
                intensity and duration. Higher intensity workouts produce a larger and longer-lasting
                oxygen debt.
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">LaForgia et al. 2006 · Journal of Sports Sciences</p>
              <p className="opacity-80 mt-0.5">
                HIIT produces approximately <span className="font-semibold" style={{ color: '#f97316' }}>6× more EPOC</span>{' '}
                than steady-state aerobic exercise of equal duration. The elevated metabolic rate from HIIT
                can persist for 12–24 hours after the session ends.
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Practical takeaway</p>
              <p className="opacity-80 mt-0.5">
                A 30-minute HIIT session burning 450 kcal generates roughly 90 kcal of additional afterburn.
                This compounds over a week — high-intensity training delivers a significant caloric advantage
                beyond what your watch reports.
              </p>
            </div>
          </div>
          <p
            className="text-xs pt-1 border-t opacity-40"
            style={{ borderColor: 'rgba(251,146,60,0.15)', color: 'var(--text-secondary)' }}
          >
            EPOC estimates are approximations based on published intensity factors. Individual responses
            vary. This is not a medical calculation.
          </p>
        </section>

      </main>
      <BottomNav />
    </div>
  )
}
