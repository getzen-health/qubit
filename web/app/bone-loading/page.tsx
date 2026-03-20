'use client'

import Link from 'next/link'
import { ArrowLeft, Bone, TrendingUp, AlertTriangle, Info, CheckCircle2, Activity } from 'lucide-react'
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
  TooltipProps,
} from 'recharts'

// ─── Bone Loading Science ──────────────────────────────────────────────────────
// Wolff's Law (1892): Bone remodels its internal architecture in response to
// mechanical stresses. Load-bearing activity stimulates osteoblast activity,
// increasing bone mineral density (BMD).
//
// Nikander et al. 2010 (Br J Sports Med): High-impact athletes (runners,
// gymnasts) show significantly higher BMD than non-impact athletes (cyclists,
// swimmers) and sedentary controls — across all skeletal sites measured.
//
// Impact multipliers (per unit of steps/floors):
//   Running:        2.5×  — ground reaction force ~2–3× body weight
//   Walking:        1.2×  — ground reaction force ~1.1–1.3× body weight
//   Stair climbing: 1.8×  — per floor (elevated vertical loading)
//   Cycling/swim:   0×    — non-weight-bearing, no bone osteogenic stimulus
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

type BoneLoadLevel = 'excellent' | 'good' | 'low' | 'minimal'

interface WeeklyData {
  week: string
  runScore: number
  walkScore: number
  climbScore: number
}

// ─── Level thresholds ─────────────────────────────────────────────────────────

const LEVEL_META: Record<BoneLoadLevel, { label: string; color: string; bgColor: string; borderColor: string; range: string; description: string }> = {
  excellent: {
    label: 'Excellent',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.25)',
    range: '> 500',
    description: 'Optimal osteogenic stimulus. Maintain this level to protect BMD long-term.',
  },
  good: {
    label: 'Good',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.25)',
    range: '200 – 500',
    description: 'Sufficient loading for BMD maintenance. Adding 1–2 runs weekly would push you to Excellent.',
  },
  low: {
    label: 'Low',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.10)',
    borderColor: 'rgba(249,115,22,0.25)',
    range: '50 – 200',
    description: 'Sub-optimal bone stimulus. Consider 2× weekly impact sessions — even 20-min jogs count.',
  },
  minimal: {
    label: 'Minimal',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.25)',
    range: '< 50',
    description: 'Impact deficiency risk. Prioritise weight-bearing activity immediately.',
  },
}

function classifyScore(score: number): BoneLoadLevel {
  if (score > 500) return 'excellent'
  if (score > 200) return 'good'
  if (score > 50) return 'low'
  return 'minimal'
}

// ─── Mock data — moderately active user ──────────────────────────────────────
// Steps/week running: ~18 000–28 000
// Steps/week walking: ~35 000–55 000
// Floors/week: 12–28
// Score = (runSteps × 2.5 + walkSteps × 1.2 + floors × 1.8) / 100

const WEEKLY_DATA: WeeklyData[] = [
  { week: 'Jan 27', runScore: 62,  walkScore: 51, climbScore: 29 },
  { week: 'Feb 3',  runScore: 78,  walkScore: 58, climbScore: 34 },
  { week: 'Feb 10', runScore: 45,  walkScore: 62, climbScore: 22 },
  { week: 'Feb 17', runScore: 105, walkScore: 66, climbScore: 38 },
  { week: 'Feb 24', runScore: 118, walkScore: 72, climbScore: 41 },
  { week: 'Mar 3',  runScore: 89,  walkScore: 68, climbScore: 35 },
  { week: 'Mar 10', runScore: 132, walkScore: 74, climbScore: 46 },
  { week: 'Mar 17', runScore: 97,  walkScore: 69, climbScore: 39 },
]

// 30-day impact breakdown (raw inputs)
const IMPACT_STATS = {
  runningSteps: 92_400,   // × 2.5
  walkingSteps: 218_000,  // × 1.2
  floorsClimbed: 312,     // × 1.8
}

const runContribution = Math.round((IMPACT_STATS.runningSteps * 2.5) / 100)
const walkContribution = Math.round((IMPACT_STATS.walkingSteps * 1.2) / 100)
const climbContribution = Math.round((IMPACT_STATS.floorsClimbed * 1.8) / 10)

const currentWeekTotal =
  WEEKLY_DATA[WEEKLY_DATA.length - 1].runScore +
  WEEKLY_DATA[WEEKLY_DATA.length - 1].walkScore +
  WEEKLY_DATA[WEEKLY_DATA.length - 1].climbScore

const avgWeeklyScore = Math.round(
  WEEKLY_DATA.reduce((s, w) => s + w.runScore + w.walkScore + w.climbScore, 0) / WEEKLY_DATA.length
)

const peakWeekScore = Math.max(...WEEKLY_DATA.map((w) => w.runScore + w.walkScore + w.climbScore))

const currentLevel = classifyScore(currentWeekTotal)

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function BoneTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const run = payload.find((p) => p.dataKey === 'runScore')?.value ?? 0
  const walk = payload.find((p) => p.dataKey === 'walkScore')?.value ?? 0
  const climb = payload.find((p) => p.dataKey === 'climbScore')?.value ?? 0
  const total = (run as number) + (walk as number) + (climb as number)
  const level = classifyScore(total)
  const meta = LEVEL_META[level]
  return (
    <div
      style={{
        background: 'hsl(220 14% 10% / 0.97)',
        border: `1px solid ${meta.borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        lineHeight: 1.7,
        minWidth: 160,
      }}
    >
      <p style={{ color: meta.color, fontWeight: 700, marginBottom: 6 }}>
        {label} — {total} <span style={{ fontWeight: 400, opacity: 0.7 }}>units</span>
      </p>
      <p style={{ color: '#fb923c' }}>Run: {run}</p>
      <p style={{ color: '#60a5fa' }}>Walk: {walk}</p>
      <p style={{ color: '#4ade80' }}>Stairs: {climb}</p>
      <p
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          color: meta.color,
          fontWeight: 600,
        }}
      >
        {meta.label}
      </p>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: BoneLoadLevel }) {
  const meta = LEVEL_META[level]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
      style={{ color: meta.color, background: meta.bgColor, border: `1px solid ${meta.borderColor}` }}
    >
      {meta.label}
    </span>
  )
}

function ScoreCard({
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
        background: `linear-gradient(135deg, ${accent}0d 0%, transparent 60%)`,
        borderColor: `${accent}28`,
      }}
    >
      <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'hsl(220 9% 46%)' }}>
        {label}
      </p>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="text-3xl font-black tabular-nums leading-none"
          style={{ color: accent, letterSpacing: '-0.04em' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold" style={{ color: 'hsl(220 9% 46%)' }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-xs mt-0.5 opacity-60" style={{ color: 'hsl(220 9% 60%)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function ImpactRow({
  icon,
  label,
  rawValue,
  rawUnit,
  multiplier,
  score,
  color,
}: {
  icon: string
  label: string
  rawValue: string
  rawUnit: string
  multiplier: string
  score: number
  color: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: 'hsl(220 14% 10%)', border: '1px solid hsl(220 14% 18%)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
        style={{ background: `${color}14`, border: `1px solid ${color}28` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'hsl(220 9% 90%)' }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(220 9% 46%)' }}>
          {rawValue} {rawUnit}{' '}
          <span
            className="font-bold font-mono"
            style={{ color }}
          >
            × {multiplier}
          </span>
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold font-mono" style={{ color }}>
          {score.toLocaleString()}
        </p>
        <p className="text-xs" style={{ color: 'hsl(220 9% 40%)' }}>
          30-day pts
        </p>
      </div>
    </div>
  )
}

// Score level legend strip
function LevelStrip() {
  const levels: BoneLoadLevel[] = ['minimal', 'low', 'good', 'excellent']
  return (
    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(220 14% 18%)' }}>
      {levels.map((level) => {
        const meta = LEVEL_META[level]
        const isActive = level === currentLevel
        return (
          <div
            key={level}
            className="flex-1 flex flex-col items-center py-2.5 px-1 gap-0.5 transition-all"
            style={{
              background: isActive ? meta.bgColor : 'hsl(220 14% 10%)',
              borderRight: level !== 'excellent' ? '1px solid hsl(220 14% 18%)' : 'none',
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: isActive ? meta.color : 'hsl(220 9% 40%)' }}
            >
              {meta.label}
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: isActive ? meta.color : 'hsl(220 9% 32%)' }}
            >
              {meta.range}
            </span>
            {isActive && (
              <div
                className="w-1.5 h-1.5 rounded-full mt-0.5"
                style={{ background: meta.color }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Recommendation logic ─────────────────────────────────────────────────────

function getRecommendations(level: BoneLoadLevel, weeklyScore: number): string[] {
  switch (level) {
    case 'excellent':
      return [
        'Excellent bone loading — maintain current impact activity to sustain BMD.',
        'Continue mixing running and stair climbing for multi-directional stress.',
        'Consider adding plyometrics (box jumps, hops) for additional osteogenic signal.',
      ]
    case 'good':
      return [
        'Add 2× weekly runs of 20–30 minutes to reach Excellent loading.',
        'Take the stairs whenever possible — each floor adds 1.8 bone load units.',
        'Aim for 7 500+ running steps per week to maximise the 2.5× multiplier.',
      ]
    case 'low':
      return [
        'Prioritise impact exercise: even 20-min jogs 2× weekly significantly raise your score.',
        'Replace one cycling/swimming session with a brisk walk or run.',
        'Stair climbing is an easy daily habit — 10 floors/day = ~126 pts/week.',
        'If cycling/swimming is your primary sport, supplement with rope skipping or jumping drills.',
      ]
    case 'minimal':
      return [
        'Impact deficiency risk is elevated — begin weight-bearing activity immediately.',
        'Start with daily 20-min walks (1.2× multiplier) and increase step count gradually.',
        'Consult a physiotherapist if pain prevents impact exercise — modified loading options exist.',
        'Cyclists and swimmers face ~50% higher stress-fracture risk on return to running — ramp carefully.',
      ]
  }
}

const recommendations = getRecommendations(currentLevel, currentWeekTotal)
const levelMeta = LEVEL_META[currentLevel]

// ─── Page component ───────────────────────────────────────────────────────────

export default function BoneLoadingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(220 14% 7%)' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: 'hsl(220 14% 7% / 0.88)',
          borderColor: 'hsl(220 14% 16%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'hsl(220 9% 46%)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.28)',
            }}
          >
            <Bone className="w-4 h-4" style={{ color: '#fbbf24' }} />
          </div>
          <div className="flex-1">
            <h1
              className="text-xl font-black leading-tight tracking-tight"
              style={{ color: 'hsl(220 9% 94%)', letterSpacing: '-0.03em' }}
            >
              Bone Loading
            </h1>
            <p className="text-xs" style={{ color: 'hsl(220 9% 46%)' }}>
              Mechanical Stress Score · Last 8 weeks
            </p>
          </div>
          <LevelBadge level={currentLevel} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Science intro card ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.09) 0%, rgba(251,191,36,0.03) 50%, transparent 100%)',
            border: '1px solid rgba(251,191,36,0.20)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.24)' }}
            >
              <Info className="w-4 h-4" style={{ color: '#fbbf24' }} />
            </div>
            <div className="space-y-2">
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: '#fbbf24', letterSpacing: '-0.01em' }}
                >
                  Wolff&apos;s Law, 1892
                </p>
                <p className="text-xs leading-relaxed mt-1" style={{ color: 'hsl(220 9% 62%)' }}>
                  Bone remodels its internal architecture in direct response to mechanical stress.
                  Weight-bearing impact triggers osteoblast activity, increasing bone mineral density (BMD).{' '}
                  <span style={{ color: 'hsl(220 9% 80%)' }}>
                    No load, no remodelling signal.
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'hsl(220 9% 80%)' }}>
                  Nikander et al. 2010 · Br J Sports Med
                </p>
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'hsl(220 9% 56%)' }}>
                  High-impact athletes (runners, gymnasts) have significantly higher BMD at all skeletal sites
                  compared to non-impact athletes (cyclists, swimmers) and sedentary controls.
                </p>
              </div>
              {/* Impact multiplier chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { activity: 'Running', factor: '2.5×', color: '#fb923c' },
                  { activity: 'Walking', factor: '1.2×', color: '#60a5fa' },
                  { activity: 'Stair climbing', factor: '1.8× /floor', color: '#4ade80' },
                  { activity: 'Cycling / Swim', factor: '0×', color: 'hsl(220 9% 40%)' },
                ].map((item) => (
                  <div
                    key={item.activity}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs"
                    style={{
                      background: 'hsl(220 14% 12%)',
                      border: '1px solid hsl(220 14% 20%)',
                    }}
                  >
                    <span style={{ color: 'hsl(220 9% 60%)' }}>{item.activity}</span>
                    <span
                      className="font-black font-mono"
                      style={{ color: item.color }}
                    >
                      {item.factor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <ScoreCard
            label="This Week"
            value={currentWeekTotal}
            unit="pts"
            sub={LEVEL_META[currentLevel].label}
            accent={levelMeta.color}
          />
          <ScoreCard
            label="8-Week Avg"
            value={avgWeeklyScore}
            unit="pts/wk"
            sub="rolling average"
            accent="#fbbf24"
          />
          <ScoreCard
            label="Peak Week"
            value={peakWeekScore}
            unit="pts"
            sub="personal best"
            accent="#a78bfa"
          />
        </div>

        {/* ── Level classification strip ── */}
        <LevelStrip />

        {/* ── Stacked weekly bar chart ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'hsl(220 14% 9%)',
            border: '1px solid hsl(220 14% 17%)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: '#fbbf24' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'hsl(220 9% 90%)' }}>
              Weekly Bone Load Score
            </h2>
            <span className="ml-auto text-xs" style={{ color: 'hsl(220 9% 40%)' }}>
              8 weeks
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'hsl(220 9% 44%)' }}>
            Stacked by activity type · hover for breakdown
          </p>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {[
              { key: 'runScore',   label: 'Run',    color: '#fb923c' },
              { key: 'walkScore',  label: 'Walk',   color: '#60a5fa' },
              { key: 'climbScore', label: 'Stairs', color: '#4ade80' },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: 'hsl(220 9% 54%)' }}>{item.label}</span>
              </div>
            ))}
            {/* Threshold reference lines annotation */}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-4 h-0.5 border-t border-dashed" style={{ borderColor: '#22c55e' }} />
              <span className="text-xs" style={{ color: 'hsl(220 9% 44%)' }}>Excellent ≥ 500</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={WEEKLY_DATA}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(220 14% 14%)"
                vertical={false}
              />
              {/* Excellent threshold reference */}
              <CartesianGrid
                strokeDasharray="6 3"
                stroke="rgba(34,197,94,0.25)"
                vertical={false}
                horizontalValues={[500]}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'hsl(220 9% 40%)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(220 9% 40%)' }}
                width={32}
                tickFormatter={(v) => `${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<BoneTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="runScore"   stackId="bone" fill="#fb923c" maxBarSize={40} />
              <Bar dataKey="walkScore"  stackId="bone" fill="#60a5fa" maxBarSize={40} />
              <Bar dataKey="climbScore" stackId="bone" fill="#4ade80" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {WEEKLY_DATA.map((entry, i) => {
                  const total = entry.runScore + entry.walkScore + entry.climbScore
                  const level = classifyScore(total)
                  const isPeak = total === peakWeekScore
                  return (
                    <Cell
                      key={i}
                      fill="#4ade80"
                      opacity={isPeak ? 1 : 0.75}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <p className="text-xs mt-3 text-center" style={{ color: 'hsl(220 9% 34%)' }}>
            Score = (run steps × 2.5 + walk steps × 1.2 + floors × 1.8) ÷ 100
          </p>
        </section>

        {/* ── Impact breakdown ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" style={{ color: '#fbbf24' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'hsl(220 9% 90%)' }}>
              Impact Breakdown · 30 days
            </h2>
          </div>
          <div className="space-y-2">
            <ImpactRow
              icon="🏃"
              label="Running Steps"
              rawValue={IMPACT_STATS.runningSteps.toLocaleString()}
              rawUnit="steps"
              multiplier="2.5"
              score={runContribution}
              color="#fb923c"
            />
            <ImpactRow
              icon="🚶"
              label="Walking Steps"
              rawValue={IMPACT_STATS.walkingSteps.toLocaleString()}
              rawUnit="steps"
              multiplier="1.2"
              score={walkContribution}
              color="#60a5fa"
            />
            <ImpactRow
              icon="🪜"
              label="Floors Climbed"
              rawValue={IMPACT_STATS.floorsClimbed.toLocaleString()}
              rawUnit="floors"
              multiplier="1.8"
              score={climbContribution}
              color="#4ade80"
            />

            {/* Zero-loading note */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-50"
              style={{ background: 'hsl(220 14% 9%)', border: '1px solid hsl(220 14% 16%)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ background: 'hsl(220 14% 13%)', border: '1px solid hsl(220 14% 20%)' }}
              >
                🚴
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'hsl(220 9% 60%)' }}>
                  Cycling / Swimming
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(220 9% 40%)' }}>
                  Non-weight-bearing · 0× bone loading multiplier
                </p>
              </div>
              <span
                className="text-sm font-black font-mono"
                style={{ color: 'hsl(220 9% 38%)' }}
              >
                0
              </span>
            </div>
          </div>

          {/* Total 30-day */}
          <div
            className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              background: `linear-gradient(90deg, ${levelMeta.bgColor}, transparent)`,
              border: `1px solid ${levelMeta.borderColor}`,
            }}
          >
            <p className="text-xs font-semibold" style={{ color: 'hsl(220 9% 70%)' }}>
              Total 30-day bone load
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-black font-mono"
                style={{ color: levelMeta.color, letterSpacing: '-0.04em' }}
              >
                {(runContribution + walkContribution + climbContribution).toLocaleString()}
              </span>
              <span className="text-xs" style={{ color: 'hsl(220 9% 46%)' }}>pts</span>
            </div>
          </div>
        </section>

        {/* ── Risk section ── */}
        <section
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, transparent 60%)',
            border: '1px solid rgba(239,68,68,0.16)',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'hsl(220 9% 90%)' }}>
              Impact Deficiency Risk
            </h2>
          </div>

          <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'hsl(220 9% 58%)' }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#fca5a5' }}>
                Tenforde et al. 2010 · Clin J Sport Med
              </p>
              <p>
                Cyclists and swimmers who do not supplement with weight-bearing activity face elevated
                stress-fracture risk relative to runners and team-sport athletes. Non-impact sports provide
                outstanding cardiovascular fitness — but{' '}
                <span style={{ color: 'hsl(220 9% 80%)' }}>
                  offer zero osteogenic stimulus
                </span>
                . Bone density deficits accumulate silently over years.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#fca5a5' }}>
                MacKelvie et al. 2002 · Br J Sports Med
              </p>
              <p>
                Consistent impact exercise during adolescence and early adulthood is critical for achieving
                peak bone mass. Individuals who miss this window face a substantially higher lifetime fracture
                risk — underscoring the importance of impact habits at{' '}
                <span style={{ color: 'hsl(220 9% 80%)' }}>any age</span>.
              </p>
            </div>
          </div>

          {/* Risk indicator for current level */}
          {(currentLevel === 'low' || currentLevel === 'minimal') && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
              <p className="text-xs" style={{ color: '#fca5a5' }}>
                Your current weekly loading ({currentWeekTotal} pts) falls in the{' '}
                <strong>{levelMeta.label}</strong> zone. Proactive steps to increase impact
                activity are recommended.
              </p>
            </div>
          )}
        </section>

        {/* ── Recommendations card ── */}
        <section
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: `linear-gradient(135deg, ${levelMeta.bgColor}, transparent 70%)`,
            border: `1px solid ${levelMeta.borderColor}`,
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: levelMeta.color }} />
            <h2 className="text-sm font-semibold" style={{ color: 'hsl(220 9% 90%)' }}>
              Recommendations
            </h2>
            <LevelBadge level={currentLevel} />
          </div>
          <p className="text-xs" style={{ color: 'hsl(220 9% 50%)' }}>
            Based on your current weekly bone load of{' '}
            <span style={{ color: levelMeta.color, fontWeight: 700 }}>{currentWeekTotal} pts</span>
          </p>

          <ul className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: `${levelMeta.color}18`, color: levelMeta.color, border: `1px solid ${levelMeta.color}30` }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(220 9% 75%)' }}>
                  {rec}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Methodology footnote ── */}
        <p
          className="text-xs text-center px-4 pb-2"
          style={{ color: 'hsl(220 9% 30%)' }}
        >
          Bone load score is an estimated osteogenic index based on published impact multipliers.
          Individual responses vary with age, sex, hormonal status, and training history.
          Not a clinical measurement.
        </p>

      </main>
      <BottomNav />
    </div>
  )
}
