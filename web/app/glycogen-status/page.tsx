'use client'

import Link from 'next/link'
import { ArrowLeft, Zap, FlaskConical, Clock, Dumbbell, BookOpen } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

// ─── Science ──────────────────────────────────────────────────────────────────
// Bergström & Hultman 1967 (Scand J Clin Lab Invest): Muscle biopsy studies
//   established that glycogen depletion directly causes fatigue in endurance exercise.
// Coyle et al. 1986 (J Appl Physiol): Depletion at same VO₂ confirmed the
//   causal link between glycogen and fatigue independent of oxygen delivery.
// Burke 2011 (J Sports Sci): Optimal replenishment = 1.2 g CHO/kg/hr for
//   the first 4 hours post-exercise. Full replenishment takes ~24 hours.
// Total muscle glycogen capacity ≈ 8 g/kg lean body mass (~480–560 g for
//   a typical trained athlete at ~70 kg lean mass with ~5% body fat buffer).
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

type GlycogenState = 'depleted' | 'low' | 'moderate' | 'ready' | 'full'

type IntensityTier = 'Light' | 'Moderate' | 'Vigorous' | 'Maximal'

interface WorkoutCost {
  id: string
  date: string
  sport: string
  intensity: IntensityTier
  durationMin: number
  workoutKcal: number
  glycogenUsedG: number
}

interface GlycogenPoint {
  label: string        // e.g. "Mar 6"
  day: string          // ISO date
  glycogenPct: number  // 0–100
  isWorkoutDay: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_CAPACITY_G = 520  // g — mid-range for a ~70 kg runner with 65 kg lean mass
const LEAN_BODY_MASS_KG = 65  // kg

// Carbohydrate fraction by exercise intensity (Burke 2011 + Romijn 1993)
const CARB_FRACTION: Record<IntensityTier, number> = {
  Light:    0.40,   // < 5 kcal/min
  Moderate: 0.60,   // 5–10 kcal/min
  Vigorous: 0.70,   // 10–15 kcal/min
  Maximal:  0.80,   // > 15 kcal/min
}

// Glycogen yield: ~4 kcal per gram of carbohydrate
const KCAL_PER_G_GLYCOGEN = 4

// State thresholds (% of capacity)
const STATE_THRESHOLDS: { state: GlycogenState; min: number; max: number }[] = [
  { state: 'depleted', min: 0,   max: 20  },
  { state: 'low',      min: 20,  max: 40  },
  { state: 'moderate', min: 40,  max: 65  },
  { state: 'ready',    min: 65,  max: 85  },
  { state: 'full',     min: 85,  max: 100 },
]

interface StateConfig {
  label: string
  color: string
  glowColor: string
  bgColor: string
  borderColor: string
  textColor: string
  badgeBg: string
  description: string
}

const STATE_CONFIG: Record<GlycogenState, StateConfig> = {
  depleted: {
    label: 'Depleted',
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.35)',
    bgColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
    textColor: '#f87171',
    badgeBg: 'rgba(239,68,68,0.15)',
    description: 'Critically low — rest and refuel before training.',
  },
  low: {
    label: 'Low',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.35)',
    bgColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.25)',
    textColor: '#fb923c',
    badgeBg: 'rgba(249,115,22,0.15)',
    description: 'Below optimal — prioritise carbohydrate recovery.',
  },
  moderate: {
    label: 'Moderate',
    color: '#eab308',
    glowColor: 'rgba(234,179,8,0.35)',
    bgColor: 'rgba(234,179,8,0.07)',
    borderColor: 'rgba(234,179,8,0.22)',
    textColor: '#facc15',
    badgeBg: 'rgba(234,179,8,0.13)',
    description: 'Adequate for easy sessions — allow more recovery for hard efforts.',
  },
  ready: {
    label: 'Race Ready',
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.40)',
    bgColor: 'rgba(34,197,94,0.07)',
    borderColor: 'rgba(34,197,94,0.25)',
    textColor: '#4ade80',
    badgeBg: 'rgba(34,197,94,0.13)',
    description: 'Optimal for hard training and competition.',
  },
  full: {
    label: 'Fully Loaded',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.45)',
    bgColor: 'rgba(16,185,129,0.07)',
    borderColor: 'rgba(16,185,129,0.25)',
    textColor: '#34d399',
    badgeBg: 'rgba(16,185,129,0.13)',
    description: 'Supercompensated — peak glycogen stores.',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyGlycogen(pct: number): GlycogenState {
  for (const { state, min, max } of STATE_THRESHOLDS) {
    if (pct >= min && pct < max) return state
  }
  return pct >= 100 ? 'full' : 'depleted'
}

function glycogenUsedG(workoutKcal: number, intensity: IntensityTier): number {
  const carbKcal = workoutKcal * CARB_FRACTION[intensity]
  return Math.round(carbKcal / KCAL_PER_G_GLYCOGEN)
}

// Burke 2011: optimal replenishment = 1.2 g CHO/kg/hr for first 4 h → max ~312 g in 4 h
// Full replenishment reference: ~24 h to restore from depleted
function hoursToFull(currentPct: number): number {
  const gNeeded = TOTAL_CAPACITY_G * ((100 - currentPct) / 100)
  // Optimal ingestion rate: 1.2 g/kg/hr × 65 kg = 78 g/hr (first 4 h)
  const optimalRate = 1.2 * LEAN_BODY_MASS_KG  // g/hr
  return Math.round((gNeeded / optimalRate) * 10) / 10
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
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

// ─── Mock Data — Runner mid-training-week ─────────────────────────────────────
// Today: Fri Mar 20 2026. Had a tempo run Wed, long run last Sun.
// Current glycogen: ~58% (moderate — building back after hard week)

const CURRENT_PCT = 58

const WORKOUT_COSTS: WorkoutCost[] = [
  {
    id: 'w1',
    date: '2026-03-19',
    sport: 'Tempo Run',
    intensity: 'Vigorous',
    durationMin: 52,
    workoutKcal: 610,
    glycogenUsedG: glycogenUsedG(610, 'Vigorous'),
  },
  {
    id: 'w2',
    date: '2026-03-17',
    sport: 'Easy Run',
    intensity: 'Light',
    durationMin: 45,
    workoutKcal: 390,
    glycogenUsedG: glycogenUsedG(390, 'Light'),
  },
  {
    id: 'w3',
    date: '2026-03-16',
    sport: 'Long Run',
    intensity: 'Moderate',
    durationMin: 95,
    workoutKcal: 920,
    glycogenUsedG: glycogenUsedG(920, 'Moderate'),
  },
  {
    id: 'w4',
    date: '2026-03-14',
    sport: 'Interval Run',
    intensity: 'Maximal',
    durationMin: 38,
    workoutKcal: 520,
    glycogenUsedG: glycogenUsedG(520, 'Maximal'),
  },
  {
    id: 'w5',
    date: '2026-03-12',
    sport: 'Strength',
    intensity: 'Moderate',
    durationMin: 55,
    workoutKcal: 350,
    glycogenUsedG: glycogenUsedG(350, 'Moderate'),
  },
  {
    id: 'w6',
    date: '2026-03-10',
    sport: 'Easy Run',
    intensity: 'Light',
    durationMin: 40,
    workoutKcal: 340,
    glycogenUsedG: glycogenUsedG(340, 'Light'),
  },
  {
    id: 'w7',
    date: '2026-03-09',
    sport: 'Long Run',
    intensity: 'Moderate',
    durationMin: 105,
    workoutKcal: 1020,
    glycogenUsedG: glycogenUsedG(1020, 'Moderate'),
  },
]

// 14-day glycogen timeline (drops after workouts, recovers with rest/carbs)
const GLYCOGEN_TIMELINE: GlycogenPoint[] = [
  { label: 'Mar 7',  day: '2026-03-07', glycogenPct: 82, isWorkoutDay: false },
  { label: 'Mar 8',  day: '2026-03-08', glycogenPct: 76, isWorkoutDay: false },
  { label: 'Mar 9',  day: '2026-03-09', glycogenPct: 42, isWorkoutDay: true  },  // Long run
  { label: 'Mar 10', day: '2026-03-10', glycogenPct: 55, isWorkoutDay: true  },  // Easy run
  { label: 'Mar 11', day: '2026-03-11', glycogenPct: 70, isWorkoutDay: false },  // Rest + refuel
  { label: 'Mar 12', day: '2026-03-12', glycogenPct: 61, isWorkoutDay: true  },  // Strength
  { label: 'Mar 13', day: '2026-03-13', glycogenPct: 78, isWorkoutDay: false },  // Rest
  { label: 'Mar 14', day: '2026-03-14', glycogenPct: 58, isWorkoutDay: true  },  // Intervals
  { label: 'Mar 15', day: '2026-03-15', glycogenPct: 72, isWorkoutDay: false },  // Rest
  { label: 'Mar 16', day: '2026-03-16', glycogenPct: 38, isWorkoutDay: true  },  // Long run
  { label: 'Mar 17', day: '2026-03-17', glycogenPct: 48, isWorkoutDay: true  },  // Easy run
  { label: 'Mar 18', day: '2026-03-18', glycogenPct: 65, isWorkoutDay: false },  // Rest + carb load
  { label: 'Mar 19', day: '2026-03-19', glycogenPct: 47, isWorkoutDay: true  },  // Tempo run
  { label: 'Mar 20', day: '2026-03-20', glycogenPct: 58, isWorkoutDay: false },  // Today — recovering
]

// ─── Derived stats ────────────────────────────────────────────────────────────

const currentState = classifyGlycogen(CURRENT_PCT)
const currentStateCfg = STATE_CONFIG[currentState]
const currentG = Math.round(TOTAL_CAPACITY_G * (CURRENT_PCT / 100))
const hoursRemaining = hoursToFull(CURRENT_PCT)
const totalGlycogenUsed14d = WORKOUT_COSTS.reduce((s, w) => s + w.glycogenUsedG, 0)

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntensityBadge({ level }: { level: IntensityTier }) {
  const colors: Record<IntensityTier, { bg: string; text: string; border: string }> = {
    Light:    { bg: 'rgba(250,204,21,0.12)',  text: '#fde047', border: 'rgba(250,204,21,0.25)'  },
    Moderate: { bg: 'rgba(251,146,60,0.12)',  text: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
    Vigorous: { bg: 'rgba(249,115,22,0.14)',  text: '#f97316', border: 'rgba(249,115,22,0.28)'  },
    Maximal:  { bg: 'rgba(239,68,68,0.13)',   text: '#f87171', border: 'rgba(239,68,68,0.28)'   },
  }
  const c = colors[level]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {level}
    </span>
  )
}

function SportIcon({ sport }: { sport: string }) {
  const s = sport.toLowerCase()
  if (s.includes('interval') || s.includes('maximal')) return '⚡'
  if (s.includes('tempo'))   return '🏎️'
  if (s.includes('long'))    return '🛤️'
  if (s.includes('run'))     return '🏃'
  if (s.includes('strength') || s.includes('gym')) return '💪'
  if (s.includes('cycling') || s.includes('bike')) return '🚴'
  return '🏋️'
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0c130f',
  border: '1px solid rgba(34,197,94,0.2)',
  borderRadius: 10,
  fontSize: 12,
  color: '#d1fae5',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
}

interface ChartTooltipProps {
  active?: boolean
  payload?: { value: number; payload: GlycogenPoint }[]
  label?: string
}

function GlycogenTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const pct = point.glycogenPct
  const state = classifyGlycogen(pct)
  const cfg = STATE_CONFIG[state]
  const grams = Math.round(TOTAL_CAPACITY_G * (pct / 100))
  return (
    <div style={tooltipStyle} className="px-3 py-2.5 min-w-[160px]">
      <p className="font-semibold mb-1.5" style={{ color: '#86efac' }}>{point.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: 'rgba(209,250,229,0.6)' }}>Glycogen</span>
          <span className="font-bold tabular-nums" style={{ color: cfg.color }}>
            {pct}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: 'rgba(209,250,229,0.6)' }}>Stored</span>
          <span className="tabular-nums" style={{ color: 'rgba(209,250,229,0.85)' }}>
            {grams} g
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: 'rgba(209,250,229,0.6)' }}>Status</span>
          <span className="font-semibold text-[11px]" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        {point.isWorkoutDay && (
          <div
            className="mt-1.5 pt-1.5 text-[11px] font-medium"
            style={{ borderTop: '1px solid rgba(34,197,94,0.15)', color: '#f97316' }}
          >
            Workout day — glycogen used
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Fuel Gauge visual ────────────────────────────────────────────────────────

function FuelGauge({ pct, state }: { pct: number; state: GlycogenState }) {
  const cfg = STATE_CONFIG[state]
  const segments = STATE_THRESHOLDS.length   // 5 zones
  const filled = Math.round((pct / 100) * 20) // 20 tick marks total

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Segmented bar */}
      <div className="w-full flex gap-[3px]">
        {Array.from({ length: 20 }, (_, i) => {
          const segPct = ((i + 1) / 20) * 100
          const isActive = (i + 1) <= filled
          const segState = classifyGlycogen(segPct)
          const segCfg = STATE_CONFIG[segState]
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-700"
              style={{
                height: 14,
                background: isActive ? segCfg.color : 'rgba(255,255,255,0.06)',
                boxShadow: isActive ? `0 0 6px ${segCfg.glowColor}` : 'none',
              }}
            />
          )
        })}
      </div>
      {/* Zone labels under the bar */}
      <div className="w-full flex justify-between text-[9px] tracking-wide font-semibold uppercase"
        style={{ color: 'rgba(134,239,172,0.35)' }}>
        <span>0</span>
        <span>Depleted</span>
        <span>Low</span>
        <span>Moderate</span>
        <span>Ready</span>
        <span>Full</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GlycogenStatusPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: 'rgba(7,14,9,0.82)',
          borderColor: 'rgba(34,197,94,0.12)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'rgba(134,239,172,0.7)' }}
            aria-label="Back to Explore"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>

          <div className="flex items-center gap-2.5 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.28)',
                boxShadow: '0 0 12px rgba(34,197,94,0.15)',
              }}
            >
              <Zap className="w-4 h-4" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <h1
                className="text-[17px] font-black tracking-tight leading-none"
                style={{ color: '#dcfce7', letterSpacing: '-0.02em' }}
              >
                Glycogen Status
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(134,239,172,0.5)' }}>
                Muscle fuel store estimator · 14-day window
              </p>
            </div>
          </div>

          <FlaskConical className="w-4 h-4 shrink-0" style={{ color: 'rgba(134,239,172,0.35)' }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Status Card ─────────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${currentStateCfg.bgColor} 0%, rgba(7,14,9,0.4) 80%)`,
            border: `1px solid ${currentStateCfg.borderColor}`,
            boxShadow: `0 0 32px ${currentStateCfg.glowColor}`,
          }}
        >
          {/* State badge + label */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'rgba(134,239,172,0.5)' }}
              >
                Current Status
              </p>
              <p
                className="text-3xl font-black tracking-tight"
                style={{
                  color: currentStateCfg.color,
                  letterSpacing: '-0.03em',
                  textShadow: `0 0 24px ${currentStateCfg.glowColor}`,
                }}
              >
                {currentStateCfg.label}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(209,250,229,0.55)' }}>
                {currentStateCfg.description}
              </p>
            </div>
            {/* Big percentage */}
            <div className="text-right">
              <p
                className="font-black tabular-nums leading-none"
                style={{
                  fontSize: 52,
                  color: currentStateCfg.color,
                  letterSpacing: '-0.04em',
                  textShadow: `0 0 32px ${currentStateCfg.glowColor}`,
                }}
              >
                {CURRENT_PCT}
                <span className="text-xl" style={{ color: `${currentStateCfg.color}99` }}>%</span>
              </p>
              <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'rgba(209,250,229,0.5)' }}>
                {currentG} g / {TOTAL_CAPACITY_G} g
              </p>
            </div>
          </div>

          {/* Fuel gauge bar */}
          <FuelGauge pct={CURRENT_PCT} state={currentState} />

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3" style={{ color: 'rgba(134,239,172,0.5)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'rgba(134,239,172,0.5)' }}>
                  To Full
                </span>
              </div>
              <p className="text-lg font-black tabular-nums" style={{ color: '#4ade80' }}>
                {hoursRemaining}
                <span className="text-xs font-semibold ml-0.5" style={{ color: 'rgba(74,222,128,0.6)' }}>hr</span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(134,239,172,0.4)' }}>
                at 1.2 g/kg/hr
              </p>
            </div>

            <div
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(134,239,172,0.5)' }}>
                Capacity
              </p>
              <p className="text-lg font-black tabular-nums" style={{ color: '#4ade80' }}>
                {TOTAL_CAPACITY_G}
                <span className="text-xs font-semibold ml-0.5" style={{ color: 'rgba(74,222,128,0.6)' }}>g</span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(134,239,172,0.4)' }}>
                8 g/kg LBM
              </p>
            </div>

            <div
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(134,239,172,0.5)' }}>
                14d Used
              </p>
              <p className="text-lg font-black tabular-nums" style={{ color: '#facc15' }}>
                {totalGlycogenUsed14d}
                <span className="text-xs font-semibold ml-0.5" style={{ color: 'rgba(250,204,21,0.6)' }}>g</span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(134,239,172,0.4)' }}>
                from {WORKOUT_COSTS.length} sessions
              </p>
            </div>
          </div>
        </section>

        {/* ── 14-Day Area Chart ────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(7,20,12,0.6)',
            border: '1px solid rgba(34,197,94,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1.5 h-4 rounded-full"
              style={{ background: 'linear-gradient(180deg, #22c55e, #16a34a)' }}
            />
            <h2 className="text-sm font-bold" style={{ color: '#dcfce7' }}>
              14-Day Glycogen Curve
            </h2>
            <span className="ml-auto text-[11px]" style={{ color: 'rgba(134,239,172,0.4)' }}>
              % of capacity
            </span>
          </div>
          <p className="text-[11px] mb-4 pl-3.5" style={{ color: 'rgba(134,239,172,0.4)' }}>
            Drops on workout days · recovers with rest and carbohydrate intake
          </p>

          {/* State zone legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 pl-0.5">
            {STATE_THRESHOLDS.map(({ state }) => {
              const cfg = STATE_CONFIG[state]
              return (
                <div key={state} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.glowColor}` }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: 'rgba(134,239,172,0.55)' }}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={GLYCOGEN_TIMELINE}
              margin={{ top: 8, right: 4, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="glycogenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(34,197,94,0.07)"
                vertical={false}
              />
              {/* Zone reference lines */}
              <ReferenceLine
                y={20}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeOpacity={0.4}
                label={{ value: '20%', position: 'right', fontSize: 9, fill: '#f87171' }}
              />
              <ReferenceLine
                y={40}
                stroke="#f97316"
                strokeDasharray="4 3"
                strokeOpacity={0.35}
                label={{ value: '40%', position: 'right', fontSize: 9, fill: '#fb923c' }}
              />
              <ReferenceLine
                y={65}
                stroke="#eab308"
                strokeDasharray="4 3"
                strokeOpacity={0.35}
                label={{ value: '65%', position: 'right', fontSize: 9, fill: '#facc15' }}
              />
              <ReferenceLine
                y={85}
                stroke="#22c55e"
                strokeDasharray="4 3"
                strokeOpacity={0.45}
                label={{ value: '85%', position: 'right', fontSize: 9, fill: '#4ade80' }}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'rgba(134,239,172,0.45)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'rgba(134,239,172,0.45)' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<GlycogenTooltip />} cursor={{ stroke: 'rgba(34,197,94,0.2)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="glycogenPct"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#glycogenGrad)"
                dot={(props: { cx: number; cy: number; payload: GlycogenPoint; index: number }) => {
                  const { cx, cy, payload } = props
                  const isToday = payload.day === '2026-03-20'
                  const state = classifyGlycogen(payload.glycogenPct)
                  const color = STATE_CONFIG[state].color
                  const glow = STATE_CONFIG[state].glowColor
                  return (
                    <circle
                      key={`dot-${payload.day}`}
                      cx={cx}
                      cy={cy}
                      r={isToday ? 6 : payload.isWorkoutDay ? 4 : 3}
                      fill={isToday ? color : payload.isWorkoutDay ? color : '#0c1a10'}
                      stroke={color}
                      strokeWidth={isToday ? 2.5 : 1.5}
                      style={{ filter: isToday ? `drop-shadow(0 0 6px ${glow})` : 'none' }}
                    />
                  )
                }}
                activeDot={{ r: 6, fill: '#22c55e', stroke: '#dcfce7', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-5 mt-2 px-0.5">
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(134,239,172,0.5)' }}>
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#22c55e', background: '#22c55e' }} />
              Workout day
            </div>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(134,239,172,0.5)' }}>
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#22c55e', background: '#0c1a10' }} />
              Rest day
            </div>
            <div className="flex items-center gap-1.5 text-[10px] ml-auto" style={{ color: 'rgba(134,239,172,0.5)' }}>
              <div className="w-3 h-3 rounded-full border-2 border-[#4ade80]" style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.5)' }} />
              Today
            </div>
          </div>
        </section>

        {/* ── Workout Cost List ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-4 h-4" style={{ color: 'rgba(134,239,172,0.5)' }} />
            <h2
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'rgba(134,239,172,0.5)' }}
            >
              Workout Fuel Cost
            </h2>
            <span className="ml-auto text-[11px]" style={{ color: 'rgba(134,239,172,0.35)' }}>
              14 days
            </span>
          </div>

          <div className="space-y-2">
            {WORKOUT_COSTS.map((w) => {
              const carbPct = CARB_FRACTION[w.intensity] * 100
              const depletionPct = Math.round((w.glycogenUsedG / TOTAL_CAPACITY_G) * 100)
              return (
                <div
                  key={w.id}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    background: 'rgba(7,18,10,0.65)',
                    borderColor: 'rgba(34,197,94,0.1)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Sport icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.15)',
                      }}
                    >
                      <SportIcon sport={w.sport} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#dcfce7' }}
                        >
                          {w.sport}
                        </span>
                        <IntensityBadge level={w.intensity} />
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(134,239,172,0.45)' }}>
                        {fmtDate(w.date)} · {fmtDuration(w.durationMin)} · {w.workoutKcal} kcal · {carbPct}% carbs
                      </p>
                    </div>

                    {/* Glycogen cost */}
                    <div className="text-right shrink-0">
                      <p
                        className="text-base font-black tabular-nums"
                        style={{ color: '#f87171', letterSpacing: '-0.02em' }}
                      >
                        −{w.glycogenUsedG} g
                      </p>
                      <p className="text-[10px] tabular-nums mt-0.5" style={{ color: 'rgba(134,239,172,0.4)' }}>
                        −{depletionPct}% stores
                      </p>
                    </div>
                  </div>

                  {/* Depletion bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(depletionPct, 100)}%`,
                          background: 'linear-gradient(90deg, #ef4444cc, #ef4444)',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono shrink-0" style={{ color: 'rgba(248,113,113,0.6)' }}>
                      {depletionPct}% of stores
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Intensity Carb Fraction Guide ───────────────────────────────────── */}
        <section
          className="rounded-2xl border p-4"
          style={{
            background: 'rgba(7,18,10,0.5)',
            borderColor: 'rgba(34,197,94,0.1)',
          }}
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: '#dcfce7' }}>
            Carbohydrate Fraction by Intensity
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.entries(CARB_FRACTION) as [IntensityTier, number][]).map(([level, frac]) => {
              const kcalRange = level === 'Light' ? '< 5'
                : level === 'Moderate' ? '5–10'
                : level === 'Vigorous' ? '10–15'
                : '> 15'
              const intColors: Record<IntensityTier, string> = {
                Light: '#fde047',
                Moderate: '#fb923c',
                Vigorous: '#f97316',
                Maximal: '#f87171',
              }
              const color = intColors[level]
              return (
                <div
                  key={level}
                  className="rounded-xl p-3 flex flex-col gap-1.5"
                  style={{
                    background: `${color}0a`,
                    border: `1px solid ${color}22`,
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: `${color}bb` }}>
                    {level}
                  </p>
                  <p
                    className="text-2xl font-black tabular-nums"
                    style={{ color, letterSpacing: '-0.03em' }}
                  >
                    {frac * 100}
                    <span className="text-sm">%</span>
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(134,239,172,0.4)' }}>
                    {kcalRange} kcal/min
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(134,239,172,0.35)' }}>
                    {Math.round(400 * frac / 4)} g per 400 kcal
                  </p>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] mt-3 pt-3" style={{
            borderTop: '1px solid rgba(34,197,94,0.08)',
            color: 'rgba(134,239,172,0.4)',
          }}>
            Fractions from Burke 2011 and Romijn et al. 1993 (J Appl Physiol). Glycogen yield ≈ 4 kcal/g.
          </p>
        </section>

        {/* ── Science Card ─────────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(7,20,12,0.8) 0%, rgba(5,12,8,0.9) 100%)',
            borderColor: 'rgba(34,197,94,0.15)',
            boxShadow: '0 0 40px rgba(34,197,94,0.06)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <BookOpen className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: '#dcfce7' }}>
              The Science of Glycogen
            </h2>
          </div>

          <div className="space-y-4 text-[12px] leading-relaxed" style={{ color: 'rgba(209,250,229,0.65)' }}>

            <div>
              <p className="font-bold text-[13px] mb-1" style={{ color: '#86efac' }}>
                What is muscle glycogen?
              </p>
              <p>
                Glycogen is the storage form of glucose in muscle and liver cells.
                Muscles store roughly <span className="font-semibold" style={{ color: '#4ade80' }}>8 g/kg lean body mass</span> —
                around 480–560 g for a trained endurance athlete. It is the primary
                fuel for moderate-to-high intensity exercise, directly powering
                the fast-twitch fibres that drive pace.
              </p>
            </div>

            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <p className="font-bold mb-1" style={{ color: '#4ade80' }}>
                Bergström & Hultman 1967 · Scand J Clin Lab Invest
              </p>
              <p>
                The first direct muscle biopsy study demonstrated that exhaustion during
                prolonged cycling coincided precisely with depletion of muscle glycogen —
                establishing the causal link between fuel availability and endurance fatigue.
              </p>
            </div>

            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <p className="font-bold mb-1" style={{ color: '#4ade80' }}>
                Coyle et al. 1986 · J Appl Physiol
              </p>
              <p>
                Fatigue occurred at the same VO₂ and same absolute intensity regardless of
                fitness — confirming glycogen depletion causes fatigue
                <span className="font-semibold" style={{ color: '#4ade80' }}> independently of oxygen delivery</span>.
                Well-trained athletes deplete glycogen at the same rate; they simply carry
                more to begin with.
              </p>
            </div>

            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}
            >
              <p className="font-bold mb-1" style={{ color: '#4ade80' }}>
                Burke 2011 · J Sports Sci — Replenishment Protocol
              </p>
              <p>
                Optimal post-exercise glycogen resynthesis requires{' '}
                <span className="font-semibold" style={{ color: '#4ade80' }}>1.2 g carbohydrate/kg/hr</span>{' '}
                for the first 4 hours, combined with high-GI carbohydrates to
                maximise insulin response. Full glycogen restoration from
                depleted stores takes approximately{' '}
                <span className="font-semibold" style={{ color: '#4ade80' }}>24 hours</span>{' '}
                with optimal nutrition — a critical recovery window before your next hard session.
              </p>
            </div>

            {/* State reference table */}
            <div>
              <p className="font-bold text-[13px] mb-2" style={{ color: '#86efac' }}>
                Glycogen State Reference
              </p>
              <div className="space-y-2">
                {STATE_THRESHOLDS.map(({ state, min, max }) => {
                  const cfg = STATE_CONFIG[state]
                  return (
                    <div
                      key={state}
                      className="flex items-start gap-3 rounded-lg p-2.5"
                      style={{ background: cfg.bgColor, border: `1px solid ${cfg.borderColor}` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1 shrink-0"
                        style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.glowColor}` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[12px]" style={{ color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span className="text-[11px]" style={{ color: 'rgba(134,239,172,0.45)' }}>
                            {min}–{max === 100 ? '100' : max}%
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(209,250,229,0.55)' }}>
                          {cfg.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <p
            className="text-[10px] pt-3"
            style={{
              borderTop: '1px solid rgba(34,197,94,0.08)',
              color: 'rgba(134,239,172,0.3)',
            }}
          >
            Estimates are derived from published energy substrate models (Burke 2011, Romijn 1993) and individual workout calorie burn.
            They are intended for training guidance only and should not replace sports dietitian advice.
          </p>
        </section>

      </main>

      <BottomNav />
    </div>
  )
}
