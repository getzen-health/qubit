'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, BookOpen, ChevronRight, Dumbbell, Info, Zap } from 'lucide-react'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// ─── Design tokens ────────────────────────────────────────────────────────────

const GREEN_FRESH     = '#22c55e'   // ≥90%  Fresh
const GREEN_RECOVERED = '#86efac'   // 70–90% Recovered
const YELLOW_MODERATE = '#facc15'   // 45–70% Moderate
const ORANGE_FATIGUED = '#f97316'   // 20–45% Fatigued
const RED_NEEDS_REST  = '#ef4444'   // <20%  Needs Rest

// ─── Types ────────────────────────────────────────────────────────────────────

type RecoveryStatus = 'Fresh' | 'Recovered' | 'Moderate' | 'Fatigued' | 'Needs Rest'

type MuscleRegion = 'Lower Body' | 'Upper Body' | 'Core'

interface MuscleGroup {
  id: string
  name: string
  region: MuscleRegion
  recoveryPct: number        // 0–100
  daysSinceTraining: number  // fractional days
  recoveryHours: number      // full recovery window in hours
}

// ─── Recovery status helpers ──────────────────────────────────────────────────

function getStatus(pct: number): RecoveryStatus {
  if (pct >= 90) return 'Fresh'
  if (pct >= 70) return 'Recovered'
  if (pct >= 45) return 'Moderate'
  if (pct >= 20) return 'Fatigued'
  return 'Needs Rest'
}

const STATUS_CONFIG: Record<RecoveryStatus, { color: string; bg: string; border: string; text: string }> = {
  'Fresh':      { color: GREEN_FRESH,     bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.30)',  text: '#4ade80' },
  'Recovered':  { color: GREEN_RECOVERED, bg: 'rgba(134,239,172,0.08)', border: 'rgba(134,239,172,0.25)', text: '#86efac' },
  'Moderate':   { color: YELLOW_MODERATE, bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.25)', text: '#fde047' },
  'Fatigued':   { color: ORANGE_FATIGUED, bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.30)', text: '#fb923c' },
  'Needs Rest': { color: RED_NEEDS_REST,  bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.30)',  text: '#f87171' },
}

// Recovery hours per muscle group (from sports science literature)
// Quads/hamstrings=72h, glutes/back/chest=60h, calves/shoulders/biceps/triceps=48h, core=36h
const RECOVERY_HOURS: Record<string, number> = {
  quadriceps:  72,
  hamstrings:  72,
  glutes:      60,
  calves:      48,
  chest:       60,
  shoulders:   48,
  back:        60,
  biceps:      48,
  triceps:     48,
  core:        36,
}

// ─── Mock data ─────────────────────────────────────────────────────────────
// Scenario: athlete ran 8km yesterday (25h ago), did swimming 5 days ago,
// and upper-body strength 3.5 days ago.

function computeRecovery(id: string, hoursSinceTraining: number): number {
  const fullRecovery = RECOVERY_HOURS[id] ?? 48
  const pct = Math.min(100, Math.round((hoursSinceTraining / fullRecovery) * 100))
  return pct
}

const RAW_MUSCLES: { id: string; name: string; region: MuscleRegion; hoursSinceTraining: number }[] = [
  // Lower body — hard run 25h ago
  { id: 'quadriceps', name: 'Quadriceps',  region: 'Lower Body', hoursSinceTraining: 25 },
  { id: 'hamstrings', name: 'Hamstrings',  region: 'Lower Body', hoursSinceTraining: 25 },
  { id: 'glutes',     name: 'Glutes',      region: 'Lower Body', hoursSinceTraining: 25 },
  { id: 'calves',     name: 'Calves',      region: 'Lower Body', hoursSinceTraining: 25 },
  // Upper body — swimming 5 days (120h) ago; strength 3.5 days (84h) ago
  { id: 'chest',      name: 'Chest',       region: 'Upper Body', hoursSinceTraining: 84 },
  { id: 'shoulders',  name: 'Shoulders',   region: 'Upper Body', hoursSinceTraining: 120 },
  { id: 'back',       name: 'Back',        region: 'Upper Body', hoursSinceTraining: 84 },
  { id: 'biceps',     name: 'Biceps',      region: 'Upper Body', hoursSinceTraining: 84 },
  { id: 'triceps',    name: 'Triceps',     region: 'Upper Body', hoursSinceTraining: 84 },
  // Core — light core work 2 days (48h) ago
  { id: 'core',       name: 'Core & Abs',  region: 'Core',       hoursSinceTraining: 48 },
]

const MUSCLES: MuscleGroup[] = RAW_MUSCLES.map(({ id, name, region, hoursSinceTraining }) => ({
  id,
  name,
  region,
  recoveryPct: computeRecovery(id, hoursSinceTraining),
  daysSinceTraining: Math.round((hoursSinceTraining / 24) * 10) / 10,
  recoveryHours: RECOVERY_HOURS[id] ?? 48,
}))

// ─── Workout → muscle mapping ──────────────────────────────────────────────

interface WorkoutMapping {
  workout: string
  icon: string
  muscles: string[]
  color: string
}

const WORKOUT_MAPPINGS: WorkoutMapping[] = [
  { workout: 'Running',         icon: '🏃', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],          color: '#f97316' },
  { workout: 'Cycling',         icon: '🚴', muscles: ['Quads', 'Glutes', 'Calves'],                         color: '#facc15' },
  { workout: 'Swimming',        icon: '🏊', muscles: ['Shoulders', 'Back', 'Biceps', 'Triceps'],            color: '#38bdf8' },
  { workout: 'Upper Strength',  icon: '💪', muscles: ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps'],   color: '#a78bfa' },
  { workout: 'Lower Strength',  icon: '🏋️', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],          color: '#34d399' },
  { workout: 'Rowing',          icon: '🚣', muscles: ['Back', 'Shoulders', 'Biceps', 'Core & Abs'],         color: '#fb7185' },
  { workout: 'HIIT',            icon: '⚡', muscles: ['Quads', 'Glutes', 'Calves', 'Core & Abs'],           color: '#f43f5e' },
  { workout: 'Yoga / Pilates',  icon: '🧘', muscles: ['Core & Abs', 'Glutes', 'Shoulders'],                 color: '#c084fc' },
]

// ─── Computed summary stats ────────────────────────────────────────────────

const avgReadiness = Math.round(MUSCLES.reduce((s, m) => s + m.recoveryPct, 0) / MUSCLES.length)
const groupsReady  = MUSCLES.filter((m) => m.recoveryPct >= 70).length
const groupsRest   = MUSCLES.filter((m) => m.recoveryPct < 45).length

// ─── Today's recommendation ───────────────────────────────────────────────

function buildRecommendation(): { focus: string; reason: string; avoid: string; color: string } {
  const lowerAvg = Math.round(
    MUSCLES.filter((m) => m.region === 'Lower Body').reduce((s, m) => s + m.recoveryPct, 0) / 4
  )
  const upperAvg = Math.round(
    MUSCLES.filter((m) => m.region === 'Upper Body').reduce((s, m) => s + m.recoveryPct, 0) / 5
  )
  const coreAvg = MUSCLES.find((m) => m.id === 'core')?.recoveryPct ?? 0

  if (upperAvg >= 80 && coreAvg >= 80 && lowerAvg < 60) {
    return {
      focus: 'Upper Body Strength + Core',
      reason: `Upper body is ${upperAvg}% recovered and core is ${coreAvg}% recovered — excellent stimulus window. Lower body needs more time (${lowerAvg}% avg).`,
      avoid: 'Running, cycling, or any high-impact lower-body work.',
      color: '#a78bfa',
    }
  }
  if (lowerAvg >= 80) {
    return {
      focus: 'Lower Body or Full Run',
      reason: `Lower body is ${lowerAvg}% recovered — ready for a quality effort.`,
      avoid: 'None — full session suitable today.',
      color: '#22c55e',
    }
  }
  return {
    focus: 'Active Recovery / Zone 2',
    reason: `Average readiness is ${avgReadiness}%. Light movement accelerates clearance without new tissue stress.`,
    avoid: 'Resistance training, HIIT, or long runs until recovery improves.',
    color: '#38bdf8',
  }
}

const RECOMMENDATION = buildRecommendation()

// ─── Radial gauge (single muscle readiness) ───────────────────────────────

function RadialGauge({ pct, color }: { pct: number; color: string }) {
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: 'transparent' }]
  return (
    <div className="relative w-12 h-12 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={5}
        >
          <RadialBar dataKey="value" cornerRadius={3} background={{ fill: 'rgba(255,255,255,0.06)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black tabular-nums" style={{ color }}>{pct}</span>
      </div>
    </div>
  )
}

// ─── Recovery bar component ────────────────────────────────────────────────

function RecoveryBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RecoveryStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
      style={{ color: cfg.text, background: cfg.bg, borderColor: cfg.border }}
    >
      {status}
    </span>
  )
}

// ─── Muscle group card ─────────────────────────────────────────────────────

function MuscleCard({ muscle }: { muscle: MuscleGroup }) {
  const status = getStatus(muscle.recoveryPct)
  const cfg = STATUS_CONFIG[status]
  const daysLabel = muscle.daysSinceTraining === 0
    ? 'Trained today'
    : muscle.daysSinceTraining < 1
    ? `${Math.round(muscle.daysSinceTraining * 24)}h ago`
    : muscle.daysSinceTraining === 1
    ? '1 day ago'
    : `${muscle.daysSinceTraining}d ago`

  return (
    <div
      className="rounded-xl p-3.5 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${muscle.recoveryPct >= 70 ? 'rgba(255,255,255,0.08)' : cfg.border}`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Radial gauge */}
      <RadialGauge pct={muscle.recoveryPct} color={cfg.color} />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-200 leading-tight">{muscle.name}</span>
          <StatusBadge status={status} />
        </div>
        <RecoveryBar pct={muscle.recoveryPct} color={cfg.color} />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">{daysLabel}</span>
          <span className="text-[10px] text-slate-600 tabular-nums">
            Full recovery: {muscle.recoveryHours}h
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Region section ───────────────────────────────────────────────────────

function RegionSection({ region, muscles }: { region: MuscleRegion; muscles: MuscleGroup[] }) {
  const regionAvg = Math.round(muscles.reduce((s, m) => s + m.recoveryPct, 0) / muscles.length)
  const regionStatus = getStatus(regionAvg)
  const cfg = STATUS_CONFIG[regionStatus]

  const REGION_ICONS: Record<MuscleRegion, string> = {
    'Lower Body': '🦵',
    'Upper Body': '💪',
    'Core': '🎯',
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{REGION_ICONS[region]}</span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{region}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tabular-nums" style={{ color: cfg.color }}>{regionAvg}%</span>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${regionAvg}%`, background: cfg.color }}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {muscles.map((m) => <MuscleCard key={m.id} muscle={m} />)}
      </div>
    </div>
  )
}

// ─── Overview stat tile ───────────────────────────────────────────────────

function OverviewTile({
  label,
  value,
  unit,
  sub,
  color,
  icon,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-1.5">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tabular-nums text-white">{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {sub && <span className="text-[10px] text-slate-600 leading-snug">{sub}</span>}
    </div>
  )
}

// ─── Color scale legend ────────────────────────────────────────────────────

const SCALE: { label: RecoveryStatus; range: string; color: string }[] = [
  { label: 'Fresh',      range: '≥90%',  color: GREEN_FRESH     },
  { label: 'Recovered',  range: '70–90%', color: GREEN_RECOVERED },
  { label: 'Moderate',   range: '45–70%', color: YELLOW_MODERATE },
  { label: 'Fatigued',   range: '20–45%', color: ORANGE_FATIGUED },
  { label: 'Needs Rest', range: '<20%',   color: RED_NEEDS_REST  },
]

// ─── Page ─────────────────────────────────────────────────────────────────

export default function MuscleRecoveryPage() {
  const regions: MuscleRegion[] = ['Lower Body', 'Upper Body', 'Core']

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #060b14 0%, #0a1120 40%, #050c18 100%)',
        fontFamily: 'ui-monospace, "SF Mono", "Fira Code", monospace',
      }}
    >
      {/* Ambient grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 55% 35% at 80% 15%, rgba(34,197,94,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 45% 30% at 15% 80%, rgba(239,68,68,0.04) 0%, transparent 65%)
          `,
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(6,11,20,0.90)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(34,197,94,0.10)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-green-400 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Explore
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
              Muscle Recovery
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Overview card ─────────────────────────────────────────────── */}
        <section
          className="rounded-2xl border p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(255,255,255,0.02) 60%, rgba(239,68,68,0.04) 100%)',
            border: '1px solid rgba(34,197,94,0.20)',
            boxShadow: '0 0 60px rgba(34,197,94,0.06), 0 4px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-semibold text-green-500 uppercase tracking-[0.18em]">
              Overall Readiness · {new Date('2026-03-20').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Big readiness number */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative w-20 h-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  data={[
                    { value: avgReadiness, fill: avgReadiness >= 70 ? GREEN_FRESH : avgReadiness >= 45 ? YELLOW_MODERATE : ORANGE_FATIGUED },
                    { value: 100 - avgReadiness, fill: 'transparent' },
                  ]}
                  barSize={7}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={4}
                    background={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-xl font-black tabular-nums leading-none"
                  style={{
                    color: avgReadiness >= 70 ? GREEN_FRESH : avgReadiness >= 45 ? YELLOW_MODERATE : ORANGE_FATIGUED,
                    textShadow: `0 0 20px ${avgReadiness >= 70 ? GREEN_FRESH : avgReadiness >= 45 ? YELLOW_MODERATE : ORANGE_FATIGUED}66`,
                  }}
                >
                  {avgReadiness}%
                </span>
                <span className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wide">avg</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                {avgReadiness >= 70 ? 'Good to Train' : avgReadiness >= 45 ? 'Partial Readiness' : 'Rest Advised'}
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {avgReadiness >= 70
                  ? 'Most muscle groups have completed structural repair. Quality training is appropriate.'
                  : avgReadiness >= 45
                  ? 'Some groups are still rebuilding. Select fresh muscles for today\'s focus.'
                  : 'Significant fatigue across major groups. Prioritise sleep and nutrition.'}
              </p>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <OverviewTile
              label="Readiness"
              value={avgReadiness}
              unit="%"
              sub="avg across all groups"
              color={GREEN_FRESH}
              icon={<Activity className="w-3.5 h-3.5" />}
            />
            <OverviewTile
              label="Ready"
              value={groupsReady}
              unit={`/ ${MUSCLES.length}`}
              sub="≥70% recovered"
              color={GREEN_RECOVERED}
              icon={<Zap className="w-3.5 h-3.5" />}
            />
            <OverviewTile
              label="Needs Rest"
              value={groupsRest}
              unit={`/ ${MUSCLES.length}`}
              sub="<45% recovered"
              color={RED_NEEDS_REST}
              icon={<Dumbbell className="w-3.5 h-3.5" />}
            />
          </div>
        </section>

        {/* ── Recovery status color scale ───────────────────────────────── */}
        <section
          className="rounded-2xl border p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">Recovery Scale</span>
          </div>
          <div className="flex items-stretch gap-0 rounded-lg overflow-hidden h-5">
            {SCALE.map((s) => (
              <div
                key={s.label}
                className="flex-1"
                style={{ background: s.color, opacity: 0.75 }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {SCALE.map((s) => (
              <div key={s.label} className="text-center flex-1">
                <p className="text-[9px] font-bold" style={{ color: s.color }}>{s.label}</p>
                <p className="text-[8px] text-slate-600 tabular-nums">{s.range}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Per-muscle recovery grid ──────────────────────────────────── */}
        <section
          className="rounded-2xl border p-5 space-y-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-green-400" />
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
              Muscle Group Recovery
            </h2>
          </div>

          {regions.map((region) => (
            <RegionSection
              key={region}
              region={region}
              muscles={MUSCLES.filter((m) => m.region === region)}
            />
          ))}
        </section>

        {/* ── Today's recommendation ────────────────────────────────────── */}
        <section
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: `linear-gradient(135deg, ${RECOMMENDATION.color}10 0%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid ${RECOMMENDATION.color}30`,
            boxShadow: `0 0 40px ${RECOMMENDATION.color}08`,
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: RECOMMENDATION.color }} />
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
              Today&apos;s Optimal Focus
            </h2>
          </div>

          <div>
            <h3
              className="text-xl font-black leading-tight mb-2"
              style={{ color: RECOMMENDATION.color, textShadow: `0 0 24px ${RECOMMENDATION.color}44` }}
            >
              {RECOMMENDATION.focus}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {RECOMMENDATION.reason}
            </p>

            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              <span className="text-sm shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-0.5">Avoid Today</p>
                <p className="text-[11px] text-slate-400 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  {RECOMMENDATION.avoid}
                </p>
              </div>
            </div>
          </div>

          {/* Muscle readiness quick-view */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {MUSCLES.filter((m) => m.recoveryPct >= 70).slice(0, 6).map((m) => {
              const cfg = STATUS_CONFIG[getStatus(m.recoveryPct)]
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}28` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                  <span className="text-[11px] font-semibold text-slate-300 truncate">{m.name}</span>
                  <span className="ml-auto text-[10px] font-bold tabular-nums" style={{ color: cfg.color }}>
                    {m.recoveryPct}%
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-600" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Showing muscle groups at ≥70% recovery — cleared for training stimulus.
          </p>
        </section>

        {/* ── Workout → muscles mapping legend ────────────────────────── */}
        <section
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                Workout Type → Muscles Trained
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 mt-1" style={{ fontFamily: 'system-ui, sans-serif' }}>
              How Apple Health workout types map to primary muscle groups for recovery tracking
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {WORKOUT_MAPPINGS.map((wm) => (
              <div
                key={wm.workout}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-base leading-none shrink-0 mt-0.5">{wm.icon}</span>
                <div className="w-28 shrink-0">
                  <p className="text-[11px] font-bold" style={{ color: wm.color }}>{wm.workout}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {wm.muscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                      style={{
                        color: wm.color,
                        borderColor: `${wm.color}40`,
                        background: `${wm.color}0e`,
                      }}
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Science card ──────────────────────────────────────────────── */}
        <section
          className="rounded-2xl border p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(34,197,94,0.12)',
          }}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-500" />
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
              The Science of Muscle Recovery
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                ref: 'Damas et al. 2016 — J Physiol',
                color: GREEN_FRESH,
                title: 'DOMS Timeline',
                note: 'Delayed-onset muscle soreness (DOMS) peaks at 24–48 hours post-exercise. Structural myofibrillar repair is largely complete by ~72 hours, though inflammatory signalling persists longer in untrained individuals. Repeated-bout effect substantially attenuates DOMS in trained athletes.',
              },
              {
                ref: 'Schoenfeld 2010 — NSCA J Strength Cond Res',
                color: YELLOW_MODERATE,
                title: 'Muscle Protein Synthesis Window',
                note: 'Muscle protein synthesis (MPS) is elevated for 24–48 hours following a resistance training session. This anabolic window represents active remodelling — overlapping it with another intense session before completion blunts the hypertrophic response and increases injury risk.',
              },
              {
                ref: 'Recovery Window by Muscle',
                color: ORANGE_FATIGUED,
                title: 'Differential Recovery Rates',
                note: 'Larger, complex muscles with greater mechanical load require longer repair: Quadriceps and hamstrings need ~72 hours; glutes, chest, and back ~60 hours; calves, shoulders, biceps, and triceps ~48 hours; core stabilisers ~36 hours due to their predominantly tonic (slow-twitch) fibre composition.',
              },
              {
                ref: 'Howatson & van Someren 2008 — Sports Med',
                color: '#38bdf8',
                title: 'Active Recovery',
                note: 'Low-intensity aerobic movement (Zone 1–2) at 20–40% VO₂max during recovery days accelerates lactate clearance, increases local blood flow, and reduces inflammatory markers — without generating new mechanical damage. This supports the recommendation of light cardio on rest days.',
              },
            ].map((item) => (
              <div
                key={item.ref}
                className="rounded-xl p-4 space-y-1.5"
                style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold" style={{ color: item.color }}>{item.title}</p>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}30` }}
                  >
                    {item.ref}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>

          {/* Recovery hours reference table */}
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="px-4 py-2 border-b"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Full Recovery Reference
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {[
                { muscles: 'Quadriceps, Hamstrings',            hours: '72h', color: ORANGE_FATIGUED },
                { muscles: 'Glutes, Chest, Back',               hours: '60h', color: YELLOW_MODERATE },
                { muscles: 'Calves, Shoulders, Biceps, Triceps', hours: '48h', color: GREEN_RECOVERED },
                { muscles: 'Core & Abs',                        hours: '36h', color: GREEN_FRESH     },
              ].map((row) => (
                <div key={row.muscles} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-slate-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {row.muscles}
                  </span>
                  <span
                    className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md"
                    style={{ color: row.color, background: `${row.color}14` }}
                  >
                    {row.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.05)', fontFamily: 'system-ui, sans-serif' }}>
            Recovery estimates are derived from Apple Health workout timestamps. Actual recovery varies with sleep quality, nutrition, age, training history, and workout intensity. This tool is for informational guidance — not a substitute for professional advice.
          </p>
        </section>

        {/* ── Methodology note ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.14)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.24)' }}
            >
              <ChevronRight className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-400 mb-1">How Recovery % is Calculated</p>
              <p className="text-[11px] text-slate-400 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                For each muscle group, the elapsed time since it was last trained (inferred from workout type) is divided by its science-based full-recovery window.
                A value of 100% means the muscle has had its complete repair window; 0% means trained within the last hour.
                The formula: <span className="font-mono text-green-500">Recovery = min(100, floor(hours_since_training / recovery_window × 100))</span>
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
