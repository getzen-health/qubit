'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Info, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type BPCategory = 'normal' | 'elevated' | 'stage1' | 'stage2'

interface BPReading {
  date: string
  sbp: number  // systolic mmHg
  dbp: number  // diastolic mmHg
  weeklyAerobicMins: number
}

interface ExerciseWeek {
  week: string
  aerobicMins: number
  avgSBP: number
  avgDBP: number
}

// ─── BP Category metadata ─────────────────────────────────────────────────────

const CATEGORY_META: Record<BPCategory, {
  label: string
  sbpRange: string
  dbpRange: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  normal: {
    label: 'Normal',
    sbpRange: '< 120',
    dbpRange: '< 80',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.30)',
    description: 'Optimal cardiovascular risk. Maintain current activity levels.',
  },
  elevated: {
    label: 'Elevated',
    sbpRange: '120–129',
    dbpRange: '< 80',
    color: '#facc15',
    bg: 'rgba(250,204,21,0.10)',
    border: 'rgba(250,204,21,0.28)',
    description: 'Without intervention, high likelihood of progressing to hypertension. Exercise is the primary non-pharmacological treatment.',
  },
  stage1: {
    label: 'Stage 1 HTN',
    sbpRange: '130–139',
    dbpRange: '80–89',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.30)',
    description: 'Clinical hypertension. ≥150 min/week aerobic exercise typically reduces SBP by 5.2 mmHg (Fagard 2011).',
  },
  stage2: {
    label: 'Stage 2 HTN',
    sbpRange: '≥ 140',
    dbpRange: '≥ 90',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    border: 'rgba(248,113,113,0.30)',
    description: 'Consult a physician. Exercise still beneficial but medication is typically indicated alongside lifestyle change.',
  },
}

// ─── Demo data: 90-day BP readings ────────────────────────────────────────────
// Simulates someone mildly elevated at start (avg ~126/81) who builds up
// aerobic exercise over the period, resulting in a gradual downtrend to
// normal range by the final weeks (avg ~119/77). Consistent exercise weeks
// correspond to better subsequent readings.

function makeDate(daysAgo: number): string {
  const d = new Date('2026-03-20')
  d.setDate(d.getDate() - daysAgo)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Weekly aerobic minutes — ramp from ~90 min at start to ~185 min by end
const WEEKLY_MINS_BY_WEEK = [
  92, 88, 105, 112, 98, 125, 140,
  132, 148, 155, 143, 162, 170, 158,
]

// 90-day readings — one per day, but we'll display every 3rd for the chart
// Systolic starts around 126-128, drifts down to 118-121 by end
// Diastolic starts around 81-82, trends to 75-77 by end
// Natural scatter ±3-4 mmHg day to day
const SBP_BASE = [
  127, 129, 125, 128, 126, 130, 124, // days 89-83 (week 13-14, low exercise)
  128, 127, 126, 129, 125, 127, 128, // days 82-76
  126, 128, 124, 127, 125, 123, 126, // days 75-69 (beginning to exercise more)
  124, 126, 123, 127, 122, 124, 125, // days 68-62
  123, 125, 121, 124, 122, 120, 123, // days 61-55
  122, 120, 123, 119, 121, 120, 122, // days 54-48
  120, 122, 119, 121, 118, 120, 121, // days 47-41
  120, 119, 121, 118, 120, 119, 121, // days 40-34
  118, 120, 117, 119, 118, 120, 117, // days 33-27
  119, 117, 120, 118, 117, 119, 118, // days 26-20
  117, 119, 116, 118, 117, 116, 119, // days 19-13
  117, 115, 118, 116, 117, 118, 115, // days 12-6
  117, 118, 116,                     // days 5-3
]

const DBP_BASE = [
  82, 83, 81, 82, 83, 81, 82, // days 89-83
  81, 82, 83, 80, 82, 81, 83, // days 82-76
  81, 82, 80, 81, 82, 79, 81, // days 75-69
  80, 81, 79, 82, 80, 79, 81, // days 68-62
  79, 81, 78, 80, 79, 78, 80, // days 61-55
  79, 78, 80, 77, 79, 78, 79, // days 54-48
  78, 79, 77, 78, 77, 79, 78, // days 47-41
  77, 78, 77, 79, 76, 78, 77, // days 40-34
  77, 78, 76, 77, 76, 78, 76, // days 33-27
  76, 77, 76, 78, 75, 77, 76, // days 26-20
  76, 77, 75, 76, 75, 77, 75, // days 19-13
  76, 74, 76, 75, 76, 75, 74, // days 12-6
  76, 75, 76,                 // days 5-3
]

const RAW_90: BPReading[] = SBP_BASE.map((sbp, i) => {
  const weekIndex = Math.floor(i / 7) < WEEKLY_MINS_BY_WEEK.length
    ? Math.floor(i / 7)
    : WEEKLY_MINS_BY_WEEK.length - 1
  return {
    date: makeDate(SBP_BASE.length - 1 - i),
    sbp,
    dbp: DBP_BASE[i],
    weeklyAerobicMins: WEEKLY_MINS_BY_WEEK[weekIndex],
  }
})

// ─── Derived stats ────────────────────────────────────────────────────────────

const latest = RAW_90[RAW_90.length - 1]

const avg90SBP = Math.round(
  RAW_90.reduce((s, r) => s + r.sbp, 0) / RAW_90.length
)
const avg90DBP = Math.round(
  RAW_90.reduce((s, r) => s + r.dbp, 0) / RAW_90.length
)

// Systolic trend: compare first-30 avg vs last-30 avg
const first30AvgSBP = Math.round(
  RAW_90.slice(0, 30).reduce((s, r) => s + r.sbp, 0) / 30
)
const last30AvgSBP = Math.round(
  RAW_90.slice(-30).reduce((s, r) => s + r.sbp, 0) / 30
)
const sbpTrendDelta = last30AvgSBP - first30AvgSBP  // negative = improvement

// Current weekly exercise (last 7 days of data)
const currentWeeklyMins = Math.round(
  RAW_90.slice(-7).reduce((s, r) => s + r.weeklyAerobicMins / 7, 0)
)

// BP category for latest reading
function classifyBP(sbp: number, dbp: number): BPCategory {
  if (sbp >= 140 || dbp >= 90) return 'stage2'
  if (sbp >= 130 || dbp >= 80) return 'stage1'
  if (sbp >= 120) return 'elevated'
  return 'normal'
}

const currentCategory = classifyBP(latest.sbp, latest.dbp)

// Distribution across 90 days
const DIST: Record<BPCategory, number> = { normal: 0, elevated: 0, stage1: 0, stage2: 0 }
RAW_90.forEach((r) => { DIST[classifyBP(r.sbp, r.dbp)]++ })

// Weekly correlation data (aggregate by week)
const WEEKLY_DATA: ExerciseWeek[] = []
for (let w = 0; w < 13; w++) {
  const chunk = RAW_90.slice(w * 7, w * 7 + 7)
  if (chunk.length === 0) break
  const weekLabel = `W${w + 1}`
  WEEKLY_DATA.push({
    week: weekLabel,
    aerobicMins: Math.round(chunk.reduce((s, r) => s + r.weeklyAerobicMins / 7, 0)),
    avgSBP: Math.round(chunk.reduce((s, r) => s + r.sbp, 0) / chunk.length),
    avgDBP: Math.round(chunk.reduce((s, r) => s + r.dbp, 0) / chunk.length),
  })
}

// Chart data: subsample every 3 days for line chart
const CHART_DATA = RAW_90.filter((_, i) => i % 3 === 0 || i === RAW_90.length - 1)

// Distribution bar data
const DIST_BAR = (Object.keys(DIST) as BPCategory[]).map((cat) => ({
  label: CATEGORY_META[cat].label,
  count: DIST[cat],
  pct: Math.round((DIST[cat] / RAW_90.length) * 100),
  cat,
}))

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0f0f0f',
  border: '1px solid rgba(239,68,68,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f5f5f5',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function BPBadge({ category }: { category: BPCategory }) {
  const meta = CATEGORY_META[category]
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

function ExerciseDoseMeter({ mins }: { mins: number }) {
  const target = 150
  const pct = Math.min(Math.round((mins / target) * 100), 100)
  const overTarget = mins >= target

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">Weekly aerobic minutes</span>
        <span
          className="font-bold tabular-nums"
          style={{ color: overTarget ? '#34d399' : '#fb923c' }}
        >
          {mins} / {target} min
        </span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: overTarget
              ? 'linear-gradient(90deg, #34d399, #22d3ee)'
              : 'linear-gradient(90deg, #f87171, #fb923c)',
          }}
        />
      </div>
      <p className="text-xs text-text-secondary opacity-70">
        {overTarget
          ? `${mins - target} min above WHO minimum effective dose (Fagard 2011)`
          : `${target - mins} min below the 150 min/week threshold for meaningful BP reduction`}
      </p>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function ExerciseBloodPressureClient() {
  const catMeta = CATEGORY_META[currentCategory]

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
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                ❤️
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary leading-tight">Exercise & Blood Pressure</h1>
                <p className="text-xs text-text-secondary">Training-driven BP reduction · 90-day analysis</p>
              </div>
            </div>
            <BPBadge category={currentCategory} />
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* ── Hero intro strip ── */}
          <div
            className="rounded-2xl px-5 py-4 flex items-start gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(251,146,60,0.05) 100%)',
              border: '1px solid rgba(239,68,68,0.22)',
            }}
          >
            <div className="text-3xl shrink-0 mt-0.5" aria-hidden>❤️</div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Aerobic Exercise Is One of the Most Effective Non-Drug Interventions for Blood Pressure
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                A 2013 meta-analysis of 93 randomised controlled trials (Cornelissen &amp; Smart, <em>J Am Coll
                Cardiol</em>) found that aerobic exercise reduces resting systolic BP by an average of{' '}
                <span className="font-semibold text-red-400">3.5 mmHg</span> and diastolic by{' '}
                <span className="font-semibold text-blue-400">2.5 mmHg</span> — rising to 5.2 / 3.7 mmHg in
                hypertensive individuals. The minimum effective dose is ≥150 min/week of moderate-intensity
                aerobic activity (Fagard 2011). HIIT achieves comparable reductions in less time
                (Hegde &amp; Solomon 2015). This page tracks whether your training habits are producing a
                measurable downtrend.
              </p>
            </div>
          </div>

          {/* ── Summary stats ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Key Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Latest reading */}
              <div
                className="rounded-2xl border p-4 flex flex-col gap-1"
                style={{
                  background: `linear-gradient(135deg, ${catMeta.color}11 0%, rgba(15,15,15,0) 60%)`,
                  borderColor: `${catMeta.color}33`,
                }}
              >
                <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">Latest Reading</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className="text-3xl font-black tabular-nums"
                    style={{ color: catMeta.color, letterSpacing: '-0.03em' }}
                  >
                    {latest.sbp}/{latest.dbp}
                  </span>
                  <span className="text-sm font-semibold text-text-secondary">mmHg</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <BPBadge category={currentCategory} />
                </div>
              </div>

              {/* 90-day average */}
              <MetricCard
                label="90-Day Average"
                value={`${avg90SBP}/${avg90DBP}`}
                unit="mmHg"
                sub="Rolling mean · SBP / DBP"
                accent="#ef4444"
              />

              {/* Systolic trend */}
              <div
                className="rounded-2xl border p-4 flex flex-col gap-1"
                style={{
                  background: sbpTrendDelta < -2
                    ? 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(15,15,15,0) 60%)'
                    : sbpTrendDelta > 2
                    ? 'linear-gradient(135deg, rgba(248,113,113,0.10) 0%, rgba(15,15,15,0) 60%)'
                    : 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(15,15,15,0) 60%)',
                  borderColor: sbpTrendDelta < -2
                    ? 'rgba(52,211,153,0.30)'
                    : sbpTrendDelta > 2
                    ? 'rgba(248,113,113,0.30)'
                    : 'rgba(250,204,21,0.26)',
                }}
              >
                <p className="text-xs font-medium text-text-secondary tracking-wide uppercase">Systolic Trend</p>
                <div className="flex items-center gap-2 mt-1">
                  {sbpTrendDelta < -2
                    ? <TrendingDown className="w-4 h-4 text-emerald-400" />
                    : sbpTrendDelta > 2
                    ? <TrendingUp className="w-4 h-4 text-red-400" />
                    : <Minus className="w-4 h-4 text-yellow-400" />}
                  <span
                    className="text-3xl font-black tabular-nums"
                    style={{
                      letterSpacing: '-0.03em',
                      color: sbpTrendDelta < -2 ? '#34d399' : sbpTrendDelta > 2 ? '#f87171' : '#facc15',
                    }}
                  >
                    {sbpTrendDelta > 0 ? '+' : ''}{sbpTrendDelta}
                  </span>
                  <span className="text-sm font-semibold text-text-secondary">mmHg</span>
                </div>
                <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                  {sbpTrendDelta < -2
                    ? 'Improving — last 30d vs first 30d'
                    : sbpTrendDelta > 2
                    ? 'Worsening — last 30d vs first 30d'
                    : 'Stable — last 30d vs first 30d'}
                </p>
              </div>
            </div>
          </section>

          {/* ── 90-day BP trend chart ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📈</span>
              <h2 className="text-sm font-semibold text-text-primary">90-Day BP Trend</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">mmHg</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              AHA 2017 thresholds shown as dashed reference lines: 120 mmHg (normal/elevated boundary) and 80 mmHg (diastolic target).
            </p>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded" style={{ background: '#ef4444' }} />
                Systolic
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded" style={{ background: '#60a5fa' }} />
                Diastolic
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #ef444466' }} />
                120 mmHg
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #60a5fa66' }} />
                80 mmHg
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={CHART_DATA} margin={{ top: 6, right: 24, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(CHART_DATA.length / 5)}
                />
                <YAxis
                  domain={[65, 140]}
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  width={34}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [
                    `${v} mmHg`,
                    name === 'sbp' ? 'Systolic' : 'Diastolic',
                  ]}
                  cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }}
                />
                {/* 120 mmHg — normal/elevated SBP boundary */}
                <ReferenceLine
                  y={120}
                  stroke="#ef4444"
                  strokeDasharray="5 4"
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  label={{ value: '120', position: 'right', fontSize: 9, fill: '#ef4444', opacity: 0.7 }}
                />
                {/* 80 mmHg — diastolic target */}
                <ReferenceLine
                  y={80}
                  stroke="#60a5fa"
                  strokeDasharray="5 4"
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  label={{ value: '80', position: 'right', fontSize: 9, fill: '#60a5fa', opacity: 0.7 }}
                />
                <Line
                  type="monotone"
                  dataKey="sbp"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#ef4444', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="dbp"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#60a5fa', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-text-secondary mt-2 opacity-55 text-center font-mono-jb">
              Sampled every 3 days · Raw daily readings used for all averages
            </p>
          </section>

          {/* ── Exercise volume vs BP correlation ── */}
          <section
            className="rounded-2xl border p-4 space-y-4"
            style={{ borderColor: 'rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>🏃</span>
              <h2 className="text-sm font-semibold text-text-primary">Exercise Volume vs Blood Pressure</h2>
            </div>
            <p className="text-xs text-text-secondary opacity-70">
              Weekly aerobic minutes alongside average systolic BP per week. Higher exercise weeks typically
              precede lower BP readings 3–7 days later.
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={WEEKLY_DATA} margin={{ top: 6, right: 24, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="sbp"
                  orientation="left"
                  domain={[110, 135]}
                  tick={{ fontSize: 10, fill: '#ef4444' }}
                  width={34}
                  tickFormatter={(v) => `${v}`}
                />
                <YAxis
                  yAxisId="mins"
                  orientation="right"
                  domain={[0, 220]}
                  tick={{ fontSize: 10, fill: '#34d399' }}
                  width={38}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) =>
                    name === 'avgSBP'
                      ? [`${v} mmHg`, 'Avg Systolic']
                      : [`${v} min`, 'Aerobic Minutes']
                  }
                />
                <ReferenceLine
                  yAxisId="mins"
                  y={150}
                  stroke="#34d399"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                  label={{ value: '150m', position: 'right', fontSize: 9, fill: '#34d399', opacity: 0.75 }}
                />
                <Line
                  yAxisId="sbp"
                  type="monotone"
                  dataKey="avgSBP"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  yAxisId="mins"
                  type="monotone"
                  dataKey="aerobicMins"
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeDasharray="0"
                  dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded" style={{ background: '#ef4444' }} />
                Avg systolic (left axis)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 rounded" style={{ background: '#34d399' }} />
                Aerobic mins (right axis)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0" style={{ borderTop: '1.5px dashed #34d39988' }} />
                WHO 150 min target
              </div>
            </div>

            {/* Exercise dose meter */}
            <div
              className="rounded-xl border px-4 py-3"
              style={{ borderColor: 'rgba(52,211,153,0.20)', background: 'rgba(52,211,153,0.05)' }}
            >
              <ExerciseDoseMeter mins={currentWeeklyMins} />
            </div>
          </section>

          {/* ── BP distribution ── */}
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden>📊</span>
              <h2 className="text-sm font-semibold text-text-primary">BP Classification Distribution — 90 Days</h2>
              <span className="ml-auto text-xs text-text-secondary font-mono-jb">days per category</span>
            </div>
            <p className="text-xs text-text-secondary mb-4 opacity-70">
              AHA 2017 classification applied to each daily reading across the full 90-day period.
            </p>

            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={DIST_BAR} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  width={28}
                  allowDecimals={false}
                  tickFormatter={(v) => `${v}d`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, _: string, entry) => {
                    const pct = (entry.payload as { pct: number }).pct
                    return [`${v} days (${pct}%)`, 'Days in range']
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {DIST_BAR.map((bin, i) => (
                    <Cell key={i} fill={CATEGORY_META[bin.cat].color} fillOpacity={0.82} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Category summary */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIST_BAR.map((bin) => {
                const meta = CATEGORY_META[bin.cat]
                return (
                  <div
                    key={bin.cat}
                    className="rounded-xl border px-3 py-2 space-y-1"
                    style={{
                      borderColor: bin.cat === currentCategory ? `${meta.color}66` : 'rgba(255,255,255,0.07)',
                      background: bin.cat === currentCategory ? meta.bg : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                      <span className="text-xs font-semibold" style={{ color: meta.color }}>{bin.label}</span>
                    </div>
                    <p
                      className="text-2xl font-black tabular-nums"
                      style={{ color: meta.color, letterSpacing: '-0.03em' }}
                    >
                      {bin.pct}%
                    </p>
                    <p className="text-[10px] text-text-secondary opacity-70">{bin.count} of 90 days</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Exercise recommendations ── */}
          <section>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Exercise Recommendations
            </h2>
            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{ borderColor: catMeta.border, background: catMeta.bg }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${catMeta.color}22`, border: `1px solid ${catMeta.border}` }}
                >
                  {currentCategory === 'normal' ? '✅' : currentCategory === 'elevated' ? '🟡' : currentCategory === 'stage1' ? '⚠️' : '🔴'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-lg font-black tabular-nums" style={{ color: catMeta.color }}>
                      {latest.sbp}/{latest.dbp} mmHg
                    </span>
                    <BPBadge category={currentCategory} />
                  </div>
                  <p className="text-sm text-text-primary font-medium">{catMeta.description}</p>
                  <p className="text-xs text-text-secondary mt-1 opacity-70">
                    SBP {catMeta.sbpRange} · DBP {catMeta.dbpRange} mmHg (AHA 2017)
                  </p>
                </div>
              </div>

              {/* Prescription detail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: '🏃',
                    title: 'Aerobic Volume',
                    detail: '≥150 min/week moderate-intensity (brisk walk, cycling, swimming) or ≥75 min/week vigorous-intensity (running, HIIT). Split into ≥5 sessions.',
                  },
                  {
                    icon: '⚡',
                    title: 'Intensity',
                    detail: 'Moderate = 50–70% HRmax. Vigorous = 70–85% HRmax. HIIT (4×4 min at 85–95% HRmax) produces comparable BP reduction to MICT (Hegde & Solomon 2015).',
                  },
                  {
                    icon: '🏋️',
                    title: 'Resistance Training',
                    detail: 'Add 2–3 resistance sessions/week as adjunct. Dynamic resistance reduces SBP by ~1.8 mmHg and DBP by ~3.2 mmHg independently (Cornelissen 2013).',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border px-3 py-3 space-y-1.5"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base" aria-hidden>{item.icon}</span>
                      <span className="text-xs font-semibold text-text-primary">{item.title}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed opacity-80">{item.detail}</p>
                  </div>
                ))}
              </div>

              {/* Timeline expectations */}
              <div
                className="rounded-xl border px-4 py-3 space-y-1.5"
                style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.20)' }}
              >
                <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" style={{ color: catMeta.color }} />
                  Expected timeline
                </p>
                <p className="text-xs text-text-secondary leading-relaxed opacity-80">
                  Acute post-exercise BP reduction of 5–7 mmHg persists for 4–16 hours ("post-exercise
                  hypotension"). Chronic structural adaptations — reduced arterial stiffness, lower resting
                  heart rate, improved endothelial function — accumulate over{' '}
                  <span className="font-semibold text-text-primary">4–8 weeks</span> of consistent
                  training at ≥150 min/week. The full adaptation plateau is typically reached at{' '}
                  <span className="font-semibold text-text-primary">12–16 weeks</span>.
                </p>
              </div>
            </div>
          </section>

          {/* ── AHA classification reference ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.04)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <Info className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">AHA 2017 Blood Pressure Classification</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {(Object.entries(CATEGORY_META) as [BPCategory, typeof CATEGORY_META['normal']][]).map(([cat, meta]) => (
                <div
                  key={cat}
                  className="rounded-xl border px-3 py-2.5 space-y-1"
                  style={{
                    borderColor: cat === currentCategory ? `${meta.color}66` : 'rgba(255,255,255,0.07)',
                    background: cat === currentCategory ? meta.bg : 'rgba(255,255,255,0.02)',
                    boxShadow: cat === currentCategory ? `0 0 0 1px ${meta.color}33` : 'none',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                    <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                  </div>
                  <p className="text-xs font-mono-jb" style={{ color: meta.color }}>
                    SBP {meta.sbpRange}
                  </p>
                  <p className="text-xs font-mono-jb opacity-70" style={{ color: meta.color }}>
                    DBP {meta.dbpRange}
                  </p>
                  <p className="text-[10px] text-text-secondary leading-relaxed opacity-75">{meta.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Science Citations ── */}
          <section
            className="rounded-2xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}
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

            <div className="border-l-2 pl-3 space-y-3.5" style={{ borderColor: 'rgba(251,191,36,0.3)' }}>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Cornelissen &amp; Smart 2013 ·{' '}
                  <em>Journal of the American College of Cardiology</em>
                </p>
                <p className="opacity-80">
                  The landmark meta-analysis of 93 randomised controlled trials (n = 5,223) quantifying the
                  effect of aerobic exercise on resting BP. Mean reductions:{' '}
                  <span className="font-semibold text-red-400">−3.5 / −2.5 mmHg</span> overall, rising to{' '}
                  <span className="font-semibold text-orange-400">−5.2 / −3.7 mmHg</span> in hypertensive
                  subjects. Effect was dose-dependent: higher volume and longer training periods produced
                  greater reductions. Dynamic resistance training added an independent −1.8 / −3.2 mmHg
                  reduction.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Fagard 2011 ·{' '}
                  <em>European Journal of Cardiovascular Prevention &amp; Rehabilitation</em>
                </p>
                <p className="opacity-80">
                  Established the{' '}
                  <span className="font-semibold text-yellow-300">150 min/week minimum effective dose</span>{' '}
                  of moderate-intensity aerobic exercise for clinically meaningful resting BP reduction. Below
                  this threshold, acute post-exercise hypotension still occurs but chronic structural
                  adaptations (arterial compliance, endothelial function) are insufficient to shift the resting
                  setpoint. The prescription mirrors WHO physical activity guidelines.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Hegde &amp; Solomon 2015 ·{' '}
                  <em>Current Hypertension Reports</em>
                </p>
                <p className="opacity-80">
                  Systematic review demonstrating that high-intensity interval training (HIIT) reduces resting
                  BP comparably to moderate-intensity continuous training (MICT) with significantly less time
                  investment. 4×4 min intervals at 85–95% HRmax, 3 sessions/week, produced SBP reductions of
                  4–6 mmHg over 8–12 weeks. Particularly relevant for time-constrained individuals with
                  elevated BP who cannot meet the 150 min/week target.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  WHO Global Report on Hypertension 2023
                </p>
                <p className="opacity-80">
                  Hypertension affects an estimated{' '}
                  <span className="font-semibold text-red-400">1.28 billion adults</span> globally and is the
                  leading modifiable risk factor for cardiovascular disease and premature death. Fewer than half
                  are diagnosed; only 1 in 5 have it under control. The WHO identifies regular physical
                  activity as one of the five core lifestyle interventions for both prevention and management,
                  alongside sodium reduction, healthy diet, limiting alcohol, and smoking cessation.
                </p>
              </div>

              <div className="space-y-1 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  Whelton et al. 2018 ·{' '}
                  <em>Journal of the American College of Cardiology</em>
                </p>
                <p className="opacity-80">
                  The 2017 ACC/AHA guideline that redefined hypertension from ≥140/90 to ≥130/80 mmHg,
                  immediately reclassifying ~31 million additional Americans. The guideline explicitly
                  recommends structured aerobic exercise as first-line non-pharmacological therapy for Stage 1
                  hypertension and as adjunct for Stage 2. The Normal / Elevated / Stage 1 / Stage 2
                  classification used in this view is drawn directly from this guideline.
                </p>
              </div>

            </div>

            <p
              className="text-[10px] opacity-40 pt-1 border-t font-mono-jb"
              style={{ borderColor: 'rgba(251,191,36,0.15)', color: 'var(--color-text-secondary)' }}
            >
              BP thresholds: Normal {'<'}120/{'<'}80 · Elevated 120–129/{'<'}80 · Stage 1 130–139/80–89 · Stage 2 ≥140/≥90.
              Individual physiology varies. This is not a clinical assessment — consult your physician for diagnosis or treatment.
            </p>
          </section>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
