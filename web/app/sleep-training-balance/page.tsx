'use client'

import Link from 'next/link'
import { ArrowLeft, Moon, Dumbbell, Info, TrendingUp, AlertTriangle } from 'lucide-react'
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
  ScatterChart,
  Scatter,
  Legend,
  Cell,
} from 'recharts'

// ─── Sleep × Training Science ─────────────────────────────────────────────────
// Mah et al. 2011 (Sleep): Extending sleep to 10 h/night improved sprint times
// by 4 % and free-throw accuracy by 9 % in collegiate basketball players.
//
// Sargent et al. 2014 (Br J Sports Med): Athletes in heavy training blocks lost
// an average of 30+ min/night of sleep vs lighter periods — a consequence of
// elevated physiological arousal and irregular schedules.
//
// Dattilo et al. 2011 (Med Hypotheses): Sleep deprivation elevates cortisol and
// suppresses GH / testosterone secretion, directly impairing muscle protein
// synthesis and long-term adaptation to resistance training.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

type BalanceStatus = 'Optimal' | 'Adequate' | 'Overtaxed' | 'Sleep-Deprived'

interface WeekData {
  /** "Wk N" label */
  week: string
  /** ISO date of Monday */
  date: string
  /** Total training hours that week */
  trainingHours: number
  /** Average nightly sleep hours that week */
  sleepHours: number
  /** 0–100 balance score */
  balanceScore: number
  status: BalanceStatus
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
// 12 weeks ending today (2026-03-20). Realistic athlete pattern:
//   - Base building → heavy block → taper → repeat
//   - High training weeks compress sleep; rest weeks recover it

const WEEKS: WeekData[] = [
  { week: 'Wk 1',  date: '2025-12-29', trainingHours: 4.5,  sleepHours: 7.7,  balanceScore: 82, status: 'Optimal'        },
  { week: 'Wk 2',  date: '2026-01-05', trainingHours: 5.2,  sleepHours: 7.4,  balanceScore: 78, status: 'Adequate'       },
  { week: 'Wk 3',  date: '2026-01-12', trainingHours: 6.8,  sleepHours: 7.0,  balanceScore: 65, status: 'Adequate'       },
  { week: 'Wk 4',  date: '2026-01-19', trainingHours: 8.0,  sleepHours: 6.5,  balanceScore: 44, status: 'Overtaxed'      },
  { week: 'Wk 5',  date: '2026-01-26', trainingHours: 4.0,  sleepHours: 7.9,  balanceScore: 86, status: 'Optimal'        },
  { week: 'Wk 6',  date: '2026-02-02', trainingHours: 5.5,  sleepHours: 7.6,  balanceScore: 80, status: 'Optimal'        },
  { week: 'Wk 7',  date: '2026-02-09', trainingHours: 7.5,  sleepHours: 6.8,  balanceScore: 58, status: 'Adequate'       },
  { week: 'Wk 8',  date: '2026-02-16', trainingHours: 9.2,  sleepHours: 6.1,  balanceScore: 32, status: 'Overtaxed'      },
  { week: 'Wk 9',  date: '2026-02-23', trainingHours: 3.5,  sleepHours: 8.0,  balanceScore: 88, status: 'Optimal'        },
  { week: 'Wk 10', date: '2026-03-02', trainingHours: 6.0,  sleepHours: 7.3,  balanceScore: 73, status: 'Adequate'       },
  { week: 'Wk 11', date: '2026-03-09', trainingHours: 8.5,  sleepHours: 6.3,  balanceScore: 38, status: 'Overtaxed'      },
  { week: 'Wk 12', date: '2026-03-16', trainingHours: 11.0, sleepHours: 5.8,  balanceScore: 18, status: 'Sleep-Deprived' },
]

const SLEEP_TARGET = 7.5
const TRAINING_THRESHOLD = 10

const CURRENT_WEEK = WEEKS[WEEKS.length - 1]
const TABLE_WEEKS = WEEKS.slice(-8)

// ─── Status Metadata ─────────────────────────────────────────────────────────

const STATUS_META: Record<BalanceStatus, { color: string; bg: string; border: string; description: string }> = {
  Optimal:        { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  description: 'Training and sleep are well-balanced' },
  Adequate:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  description: 'Manageable load — monitor closely' },
  Overtaxed:      { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)',  description: 'High load is compressing sleep — reduce or prioritise rest' },
  'Sleep-Deprived': { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', description: 'Critical — sleep debt undermines all adaptation' },
}

// ─── Scatter data: one point per week ────────────────────────────────────────

interface ScatterPoint {
  x: number   // training hours
  y: number   // sleep hours
  week: string
  score: number
  status: BalanceStatus
}

const SCATTER_DATA: ScatterPoint[] = WEEKS.map((w) => ({
  x: w.trainingHours,
  y: w.sleepHours,
  week: w.week,
  score: w.balanceScore,
  status: w.status,
}))

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: '#111',
  border: '1px solid rgba(96,165,250,0.25)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f5f5f5',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: BalanceStatus): string {
  return STATUS_META[status].color
}

function scoreColor(score: number): string {
  if (score >= 75) return '#34d399'
  if (score >= 55) return '#60a5fa'
  if (score >= 35) return '#fb923c'
  return '#f87171'
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
      <div className="flex items-baseline gap-1">
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

function StatusBadge({ status }: { status: BalanceStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      {status}
    </span>
  )
}

// Custom dot for scatter chart — colour by status
function ScatterDot(props: {
  cx?: number
  cy?: number
  payload?: ScatterPoint
}) {
  const { cx = 0, cy = 0, payload } = props
  const color = payload ? STATUS_META[payload.status].color : '#60a5fa'
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={color}
      fillOpacity={0.8}
      stroke={color}
      strokeWidth={1.5}
      strokeOpacity={0.4}
    />
  )
}

// Quadrant annotation label (placed via foreignObject-like absolute div over chart)
// We use a simple SVG text approach inside a custom label
function QuadrantLabel({
  viewBox,
  text,
  color = 'rgba(255,255,255,0.22)',
}: {
  viewBox?: { x: number; y: number; width: number; height: number }
  text?: string
  color?: string
}) {
  if (!viewBox || !text) return null
  const { x, y, width, height } = viewBox
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={9}
      fill={color}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {text}
    </text>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function SleepTrainingBalancePage() {
  const currentStatus = CURRENT_WEEK.status
  const currentMeta = STATUS_META[currentStatus]

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
              style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)' }}
            >
              <Moon className="w-4 h-4" style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary leading-tight">Sleep × Training Balance</h1>
              <p className="text-xs text-text-secondary">Load vs rest tradeoff · 12 weeks</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Hero intro strip ── */}
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(96,165,250,0.13) 0%, rgba(52,211,153,0.08) 100%)',
            border: '1px solid rgba(96,165,250,0.22)',
          }}
        >
          <div className="shrink-0 mt-0.5">
            <TrendingUp className="w-7 h-7" style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              The Load–Recovery Tradeoff
            </p>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Heavy training spikes and compressed sleep are closely linked — athletes in high-load weeks
              lose <span className="font-semibold" style={{ color: '#fb923c' }}>30+ minutes of sleep per night</span>{' '}
              on average. This dashboard tracks where your balance falls each week and flags risk zones before
              performance and recovery suffer.
            </p>
          </div>
        </div>

        {/* ── Overview Card ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
            This Week
          </h2>
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: currentMeta.border, background: `${currentMeta.bg}` }}
          >
            {/* Status banner */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${currentMeta.color}22`, border: `1px solid ${currentMeta.border}` }}
                >
                  {currentStatus === 'Optimal' ? (
                    <Moon className="w-5 h-5" style={{ color: currentMeta.color }} />
                  ) : currentStatus === 'Sleep-Deprived' ? (
                    <AlertTriangle className="w-5 h-5" style={{ color: currentMeta.color }} />
                  ) : (
                    <Dumbbell className="w-5 h-5" style={{ color: currentMeta.color }} />
                  )}
                </div>
                <div>
                  <StatusBadge status={currentStatus} />
                  <p className="text-xs text-text-secondary mt-1">{currentMeta.description}</p>
                </div>
              </div>
              <div
                className="text-right"
              >
                <p
                  className="text-4xl font-black tabular-nums"
                  style={{ color: scoreColor(CURRENT_WEEK.balanceScore), letterSpacing: '-0.03em' }}
                >
                  {CURRENT_WEEK.balanceScore}
                </p>
                <p className="text-xs text-text-secondary">balance score</p>
              </div>
            </div>

            {/* Metric row */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border p-3 flex flex-col gap-0.5"
                style={{ borderColor: 'rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.06)' }}
              >
                <p className="text-xs text-text-secondary uppercase tracking-wide">Training</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: '#fb923c' }}>
                    {CURRENT_WEEK.trainingHours.toFixed(1)}
                  </span>
                  <span className="text-sm text-text-secondary">h / week</span>
                </div>
                {CURRENT_WEEK.trainingHours >= TRAINING_THRESHOLD && (
                  <p className="text-xs" style={{ color: '#fb923c' }}>Above 10h threshold</p>
                )}
              </div>
              <div
                className="rounded-xl border p-3 flex flex-col gap-0.5"
                style={{ borderColor: 'rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.06)' }}
              >
                <p className="text-xs text-text-secondary uppercase tracking-wide">Avg Sleep</p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-2xl font-black"
                    style={{ color: CURRENT_WEEK.sleepHours >= SLEEP_TARGET ? '#34d399' : '#f87171' }}
                  >
                    {CURRENT_WEEK.sleepHours.toFixed(1)}
                  </span>
                  <span className="text-sm text-text-secondary">h / night</span>
                </div>
                <p className="text-xs text-text-secondary opacity-70">
                  Target: {SLEEP_TARGET}h
                  {CURRENT_WEEK.sleepHours < SLEEP_TARGET && (
                    <span style={{ color: '#f87171' }}>
                      {' '}({Math.round((SLEEP_TARGET - CURRENT_WEEK.sleepHours) * 60)} min deficit/night)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dual Line Chart ── */}
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: 'rgba(96,165,250,0.15)', background: 'rgba(96,165,250,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: '#60a5fa' }} />
            <h2 className="text-sm font-semibold text-text-primary">12-Week Trend</h2>
            <span className="ml-auto text-xs text-text-secondary">Training vs Sleep</span>
          </div>
          <p className="text-xs text-text-secondary mb-4 opacity-70">
            Notice how training spikes (blue) often compress the sleep line (green) the same week.
          </p>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 rounded" style={{ background: '#60a5fa' }} />
              Training hours
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 rounded" style={{ background: '#34d399' }} />
              Avg sleep hours
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 rounded" style={{ background: '#34d399', opacity: 0.4, borderTop: '1px dashed #34d399' }} />
              7.5 h sleep target
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={WEEKS} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              {/* Left Y: training hours */}
              <YAxis
                yAxisId="training"
                orientation="left"
                domain={[0, 14]}
                tick={{ fontSize: 10, fill: '#60a5fa' }}
                width={28}
                tickFormatter={(v) => `${v}h`}
              />
              {/* Right Y: sleep hours */}
              <YAxis
                yAxisId="sleep"
                orientation="right"
                domain={[4, 10]}
                tick={{ fontSize: 10, fill: '#34d399' }}
                width={28}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => {
                  if (name === 'trainingHours') return [`${v.toFixed(1)} h`, 'Training']
                  return [`${v.toFixed(1)} h`, 'Avg Sleep']
                }}
                cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
              />
              {/* 7.5h sleep target dashed line */}
              <ReferenceLine
                yAxisId="sleep"
                y={SLEEP_TARGET}
                stroke="#34d399"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
              <Line
                yAxisId="training"
                type="monotone"
                dataKey="trainingHours"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#60a5fa', strokeWidth: 0 }}
              />
              <Line
                yAxisId="sleep"
                type="monotone"
                dataKey="sleepHours"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#34d399', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2 opacity-60 text-center">
            Left axis = training hours · Right axis = sleep hours · Dashed = 7.5 h target
          </p>
        </section>

        {/* ── Scatter Plot ── */}
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: 'rgba(96,165,250,0.15)', background: 'rgba(96,165,250,0.03)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4" style={{ color: '#60a5fa' }} />
            <h2 className="text-sm font-semibold text-text-primary">Load vs Rest Map</h2>
            <span className="ml-auto text-xs text-text-secondary">Each dot = 1 week</span>
          </div>
          <p className="text-xs text-text-secondary mb-4 opacity-70">
            X-axis = weekly training hours · Y-axis = avg nightly sleep. Your sweet spot is top-right.
          </p>

          {/* Dot legend */}
          <div className="flex flex-wrap gap-3 mb-3">
            {(Object.entries(STATUS_META) as [BalanceStatus, typeof STATUS_META['Optimal']][]).map(([status, meta]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
                {status}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 16, right: 24, left: -4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Training"
                domain={[2, 13]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}h`}
                label={{ value: 'Training hours / week', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Sleep"
                domain={[5, 9]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={32}
                tickFormatter={(v) => `${v}h`}
                label={{ value: 'Avg sleep hours', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }}
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => {
                  if (name === 'Training') return [`${value.toFixed(1)} h`, 'Training']
                  return [`${value.toFixed(1)} h`, 'Sleep']
                }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null
                  const d = payload[0]?.payload as ScatterPoint | undefined
                  if (!d) return null
                  const meta = STATUS_META[d.status]
                  return (
                    <div
                      className="rounded-xl px-3 py-2 space-y-1"
                      style={{ background: '#111', border: `1px solid ${meta.border}`, fontSize: 12, color: '#f5f5f5' }}
                    >
                      <p className="font-bold" style={{ color: meta.color }}>{d.week} · {d.status}</p>
                      <p>Training: <span className="font-semibold">{d.x.toFixed(1)} h</span></p>
                      <p>Sleep: <span className="font-semibold">{d.y.toFixed(1)} h/night</span></p>
                      <p>Score: <span className="font-semibold" style={{ color: scoreColor(d.score) }}>{d.score}</span></p>
                    </div>
                  )
                }}
              />

              {/* Reference line: 10h training threshold */}
              <ReferenceLine
                x={TRAINING_THRESHOLD}
                stroke="#fb923c"
                strokeDasharray="5 4"
                strokeOpacity={0.55}
                strokeWidth={1.5}
                label={{ value: '10h', position: 'top', fontSize: 9, fill: '#fb923c', opacity: 0.7 }}
              />
              {/* Reference line: 7.5h sleep target */}
              <ReferenceLine
                y={SLEEP_TARGET}
                stroke="#34d399"
                strokeDasharray="5 4"
                strokeOpacity={0.55}
                strokeWidth={1.5}
                label={{ value: '7.5h', position: 'right', fontSize: 9, fill: '#34d399', opacity: 0.7 }}
              />

              <Scatter
                data={SCATTER_DATA}
                shape={(props: {
                  cx?: number
                  cy?: number
                  payload?: ScatterPoint
                }) => <ScatterDot {...props} />}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Quadrant annotations */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.12)' }}>
              <p className="font-semibold" style={{ color: '#60a5fa' }}>Top-left</p>
              <p className="text-text-secondary opacity-80 mt-0.5">Undertraining + Well Rested — good recovery, room to build load</p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.12)' }}>
              <p className="font-semibold" style={{ color: '#34d399' }}>Top-right</p>
              <p className="text-text-secondary opacity-80 mt-0.5">Sweet Spot — high training with adequate sleep; peak adaptation</p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.12)' }}>
              <p className="font-semibold" style={{ color: '#f87171' }}>Bottom-left</p>
              <p className="text-text-secondary opacity-80 mt-0.5">Sleep-deprived + Undertrained — worst quadrant; address sleep first</p>
            </div>
            <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.12)' }}>
              <p className="font-semibold" style={{ color: '#fb923c' }}>Bottom-right</p>
              <p className="text-text-secondary opacity-80 mt-0.5">Overtaxed — reduce load or sleep more to avoid overtraining</p>
            </div>
          </div>
        </section>

        {/* ── Weekly Breakdown Table ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
            Last 8 Weeks
          </h2>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'rgba(96,165,250,0.15)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-4 px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span>Week</span>
              <span className="text-right">Training</span>
              <span className="text-right">Sleep</span>
              <span className="text-right">Status</span>
            </div>

            {/* Table rows */}
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {TABLE_WEEKS.map((week, i) => {
                const isLatest = i === TABLE_WEEKS.length - 1
                const sleepOk = week.sleepHours >= SLEEP_TARGET
                return (
                  <div
                    key={week.week}
                    className="grid grid-cols-4 px-4 py-3 items-center"
                    style={{
                      background: isLatest ? 'rgba(96,165,250,0.05)' : 'transparent',
                    }}
                  >
                    <div>
                      <span className="text-sm font-semibold text-text-primary">{week.week}</span>
                      {isLatest && (
                        <span
                          className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}
                        >
                          Now
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: week.trainingHours >= TRAINING_THRESHOLD ? '#fb923c' : '#60a5fa' }}
                      >
                        {week.trainingHours.toFixed(1)} h
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: sleepOk ? '#34d399' : '#f87171' }}
                      >
                        {week.sleepHours.toFixed(1)} h
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <StatusBadge status={week.status} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Score sparkline row */}
            <div
              className="px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide font-medium">Balance score trend</p>
              <div className="flex items-end gap-1.5 h-8">
                {TABLE_WEEKS.map((week, i) => {
                  const heightPct = (week.balanceScore / 100) * 100
                  const isLatest = i === TABLE_WEEKS.length - 1
                  return (
                    <div
                      key={week.week}
                      className="flex-1 rounded-t"
                      title={`${week.week}: ${week.balanceScore}`}
                      style={{
                        height: `${heightPct}%`,
                        background: scoreColor(week.balanceScore),
                        opacity: isLatest ? 1 : 0.55,
                        minHeight: 4,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Science Card ── */}
        <section
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: 'rgba(96,165,250,0.12)' }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" style={{ color: '#60a5fa' }} />
            <h2 className="text-sm font-semibold text-text-primary">The Science</h2>
          </div>
          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <div>
              <p className="font-semibold text-text-primary">
                Mah et al. 2011 · <em>Sleep</em>
              </p>
              <p className="opacity-80 mt-0.5">
                Extending sleep to 10 h/night over multiple weeks improved sprint times by{' '}
                <span className="font-semibold" style={{ color: '#34d399' }}>4 %</span> and free-throw
                accuracy by{' '}
                <span className="font-semibold" style={{ color: '#34d399' }}>9 %</span> in collegiate
                basketball players — a larger effect than most training interventions of equal duration.
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                Sargent et al. 2014 · <em>British Journal of Sports Medicine</em>
              </p>
              <p className="opacity-80 mt-0.5">
                Athletes in heavy training blocks slept{' '}
                <span className="font-semibold" style={{ color: '#fb923c' }}>30+ minutes less</span>{' '}
                per night compared to lighter periods, due to elevated sympathetic arousal and compressed
                recovery windows — confirming the load–sleep compression pattern visible in the trend chart.
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                Dattilo et al. 2011 · <em>Medical Hypotheses</em>
              </p>
              <p className="opacity-80 mt-0.5">
                Sleep deprivation elevates cortisol and suppresses growth hormone and testosterone
                secretion — directly reducing muscle protein synthesis and impairing adaptation to
                resistance training. Overnight is when most structural repair occurs; cutting sleep cuts
                gains.
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary">Practical targets</p>
              <p className="opacity-80 mt-0.5">
                Aim for ≥ 7.5 h/night during training blocks; ≥ 8 h during competition tapers. If weekly
                training exceeds 10 h, actively schedule extra sleep rather than waiting for fatigue to
                force it — the adaptation window closes faster than most athletes realise.
              </p>
            </div>
          </div>
          <p
            className="text-xs pt-1 border-t opacity-40"
            style={{ borderColor: 'rgba(96,165,250,0.15)', color: 'var(--text-secondary)' }}
          >
            Balance scores are estimates based on training load and self-reported sleep duration. Individual
            tolerance varies. This is not a clinical assessment.
          </p>
        </section>

      </main>
      <BottomNav />
    </div>
  )
}
