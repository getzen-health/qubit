'use client'

import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Scatter,
  Line,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type WindowKey = 'early_morning' | 'morning' | 'afternoon' | 'late_afternoon' | 'evening'

interface TimeWindow {
  key: WindowKey
  label: string
  timeRange: string
  icon: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  badgeClass: string
}

interface WindowStats {
  key: WindowKey
  sessions: number
  avgEfficiency: number
  avgKcalPerMin: number
  avgHR: number
}

interface TrendPoint {
  month: string
  efficiency: number
  window: WindowKey
  sessions: number
}

// ─── Window config ────────────────────────────────────────────────────────────

const TIME_WINDOWS: TimeWindow[] = [
  {
    key: 'early_morning',
    label: 'Early Morning',
    timeRange: '4–8 AM',
    icon: '🌅',
    color: '#eab308',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderClass: 'border-yellow-200 dark:border-yellow-900/50',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    badgeClass: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400',
  },
  {
    key: 'morning',
    label: 'Morning',
    timeRange: '8–12 PM',
    icon: '☀️',
    color: '#f97316',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-900/50',
    textClass: 'text-orange-700 dark:text-orange-400',
    badgeClass: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400',
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    timeRange: '12–4 PM',
    icon: '🌞',
    color: '#ef4444',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-900/50',
    textClass: 'text-red-700 dark:text-red-400',
    badgeClass: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400',
  },
  {
    key: 'late_afternoon',
    label: 'Late Afternoon',
    timeRange: '4–8 PM',
    icon: '🌇',
    color: '#a855f7',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-900/50',
    textClass: 'text-purple-700 dark:text-purple-400',
    badgeClass: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400',
  },
  {
    key: 'evening',
    label: 'Evening',
    timeRange: '8–12 AM',
    icon: '🌙',
    color: '#3b82f6',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-900/50',
    textClass: 'text-blue-700 dark:text-blue-400',
    badgeClass: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400',
  },
]

function getWindowConfig(key: WindowKey): TimeWindow {
  return TIME_WINDOWS.find((w) => w.key === key) ?? TIME_WINDOWS[0]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const WINDOW_STATS: WindowStats[] = [
  { key: 'early_morning', sessions: 38,  avgEfficiency: 55, avgKcalPerMin: 7.8,  avgHR: 142 },
  { key: 'morning',       sessions: 72,  avgEfficiency: 72, avgKcalPerMin: 9.6,  avgHR: 133 },
  { key: 'afternoon',     sessions: 58,  avgEfficiency: 68, avgKcalPerMin: 9.1,  avgHR: 134 },
  { key: 'late_afternoon',sessions: 84,  avgEfficiency: 82, avgKcalPerMin: 10.8, avgHR: 132 },
  { key: 'evening',       sessions: 48,  avgEfficiency: 60, avgKcalPerMin: 8.3,  avgHR: 138 },
]

// 12-month trend — one data point per month, dominant window colour
const TREND_DATA: TrendPoint[] = [
  { month: 'Apr',  efficiency: 61, window: 'morning',        sessions: 8  },
  { month: 'May',  efficiency: 64, window: 'afternoon',      sessions: 9  },
  { month: 'Jun',  efficiency: 66, window: 'morning',        sessions: 10 },
  { month: 'Jul',  efficiency: 70, window: 'late_afternoon', sessions: 12 },
  { month: 'Aug',  efficiency: 69, window: 'afternoon',      sessions: 11 },
  { month: 'Sep',  efficiency: 74, window: 'late_afternoon', sessions: 13 },
  { month: 'Oct',  efficiency: 76, window: 'late_afternoon', sessions: 14 },
  { month: 'Nov',  efficiency: 73, window: 'morning',        sessions: 10 },
  { month: 'Dec',  efficiency: 71, window: 'evening',        sessions: 9  },
  { month: 'Jan',  efficiency: 78, window: 'late_afternoon', sessions: 15 },
  { month: 'Feb',  efficiency: 80, window: 'late_afternoon', sessions: 16 },
  { month: 'Mar',  efficiency: 82, window: 'late_afternoon', sessions: 17 },
]

const TOTAL_SESSIONS = WINDOW_STATS.reduce((s, w) => s + w.sessions, 0)

const PEAK_WINDOW = WINDOW_STATS.reduce(
  (best, w) => (w.avgEfficiency > best.avgEfficiency ? w : best),
  WINDOW_STATS[0],
)

// ─── Bar chart bar config ─────────────────────────────────────────────────────

const BAR_DATA = WINDOW_STATS.map((w) => ({
  name: w.key === 'early_morning' ? 'Early\nMorn.' : w.key === 'late_afternoon' ? 'Late\nAftn.' : getWindowConfig(w.key).label,
  shortLabel: getWindowConfig(w.key).icon,
  efficiency: w.avgEfficiency,
  key: w.key,
  color: getWindowConfig(w.key).color,
}))

// ─── Custom tooltips ──────────────────────────────────────────────────────────

interface BarTooltipPayload {
  payload?: { key?: WindowKey; efficiency?: number }
}

function BarTooltipContent({ active, payload }: { active?: boolean; payload?: BarTooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const cfg = getWindowConfig(d.key ?? 'morning')
  const stats = WINDOW_STATS.find((w) => w.key === d.key)
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs min-w-[160px]">
      <div className="flex items-center gap-1.5 mb-2">
        <span>{cfg.icon}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{cfg.label}</span>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        Efficiency:{' '}
        <span className="font-bold" style={{ color: cfg.color }}>
          {d.efficiency}/100
        </span>
      </p>
      {stats && (
        <>
          <p className="text-gray-500 dark:text-gray-400">
            Avg HR: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.avgHR} bpm</span>
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Kcal/min: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.avgKcalPerMin}</span>
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Sessions: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.sessions}</span>
          </p>
        </>
      )}
    </div>
  )
}

interface TrendTooltipPayload {
  payload?: { month?: string; efficiency?: number; window?: WindowKey; sessions?: number }
}

function TrendTooltipContent({ active, payload }: { active?: boolean; payload?: TrendTooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const cfg = getWindowConfig(d.window ?? 'morning')
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs min-w-[148px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{d.month}</p>
      <p className="text-gray-500 dark:text-gray-400">
        Efficiency:{' '}
        <span className="font-bold" style={{ color: cfg.color }}>
          {d.efficiency}/100
        </span>
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        Peak window:{' '}
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {cfg.icon} {cfg.label}
        </span>
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        Sessions: <span className="font-medium text-gray-800 dark:text-gray-200">{d.sessions}</span>
      </p>
    </div>
  )
}

// ─── Crown label on winner bar ────────────────────────────────────────────────

function CrownLabel(props: {
  x?: number
  y?: number
  width?: number
  value?: number
  index?: number
}) {
  const { x = 0, y = 0, width = 0, value, index } = props
  const isPeak = BAR_DATA[index ?? -1]?.key === PEAK_WINDOW.key
  if (!isPeak || value === undefined) return null
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={14}
      dominantBaseline="auto"
    >
      👑
    </text>
  )
}

// ─── Scatter dot — coloured by window ────────────────────────────────────────

function TrendDot(props: {
  cx?: number
  cy?: number
  payload?: { window?: WindowKey }
}) {
  const { cx = 0, cy = 0, payload } = props
  const cfg = getWindowConfig(payload?.window ?? 'morning')
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={cfg.color}
      stroke="white"
      strokeWidth={1.5}
      opacity={0.9}
    />
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function CircadianPerformancePage() {
  const peakCfg = getWindowConfig(PEAK_WINDOW.key)
  const sortedByEfficiency = [...WINDOW_STATS].sort((a, b) => b.avgEfficiency - a.avgEfficiency)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Circadian Performance</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">HR efficiency by time of day · {TOTAL_SESSIONS} workouts</p>
          </div>
          <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">

        {/* ── Peak performance banner ──────────────────────────────────────── */}
        <div
          className={`rounded-2xl p-5 border ${peakCfg.bgClass} ${peakCfg.borderClass}`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Peak Performance Window
          </p>
          <div className="flex items-center gap-4">
            <span className="text-5xl leading-none">{peakCfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className={`text-2xl font-bold ${peakCfg.textClass}`}>{peakCfg.label}</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{peakCfg.timeRange}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {PEAK_WINDOW.sessions} sessions · avg {PEAK_WINDOW.avgKcalPerMin} kcal/min · {PEAK_WINDOW.avgHR} bpm avg HR
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-bold tabular-nums" style={{ color: peakCfg.color }}>
                {PEAK_WINDOW.avgEfficiency}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">efficiency</p>
            </div>
          </div>

          {/* Efficiency bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
              <span>Efficiency score</span>
              <span>{PEAK_WINDOW.avgEfficiency}/100</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${PEAK_WINDOW.avgEfficiency}%`, backgroundColor: peakCfg.color }}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Efficiency = (kcal/min) ÷ avg HR × 1000, normalised 0–100. Higher means more aerobic output per heartbeat — a better physiological window.
          </p>
        </div>

        {/* ── Performance by time of day bar chart ────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Performance by Time of Day</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Average efficiency score 0–100 · 👑 = peak window</p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={BAR_DATA} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 18 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'currentColor', opacity: 0.04 }} />
              <Bar dataKey="efficiency" radius={[6, 6, 0, 0]} label={<CrownLabel />}>
                {BAR_DATA.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {TIME_WINDOWS.map((w) => (
              <div key={w.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Window breakdown list ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Window Breakdown</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Ranked by efficiency score</p>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedByEfficiency.map((stats, rank) => {
              const cfg = getWindowConfig(stats.key)
              const isPeak = stats.key === PEAK_WINDOW.key
              return (
                <li key={stats.key} className="px-4 py-3.5 flex items-center gap-3">
                  {/* Rank */}
                  <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-4 shrink-0">
                    {rank === 0 ? '👑' : `${rank + 1}`}
                  </span>

                  {/* Icon */}
                  <span className="text-xl shrink-0">{cfg.icon}</span>

                  {/* Name + time range */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isPeak ? cfg.textClass : 'text-gray-800 dark:text-gray-200'}`}>
                        {cfg.label}
                      </p>
                      {isPeak && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.badgeClass}`}>
                          PEAK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{cfg.timeRange} · {stats.sessions} sessions</p>
                  </div>

                  {/* Metrics */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: cfg.color }}>
                      {stats.avgEfficiency}<span className="text-xs font-normal text-gray-400">/100</span>
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                      {stats.avgKcalPerMin} kcal/min · {stats.avgHR} bpm
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Efficiency trend chart ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Efficiency Trend</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Last 12 months · dot colour = dominant window that month
          </p>

          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={TREND_DATA} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[40, 100]}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<TrendTooltipContent />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.08 }} />
              {/* Trend line */}
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#6b7280"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                activeDot={false}
                name="Trend"
              />
              {/* Coloured scatter dots */}
              <Scatter
                dataKey="efficiency"
                name="Efficiency"
                shape={<TrendDot />}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Window colour legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {TIME_WINDOWS.map((w) => (
              <div key={w.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{w.icon} {w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science callout ──────────────────────────────────────────────── */}
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-xl shrink-0">🔬</span>
            <h2 className="font-semibold text-orange-900 dark:text-orange-200">The Science Behind Afternoon Peak</h2>
          </div>

          <div className="space-y-3 text-sm text-orange-900/80 dark:text-orange-300/80 leading-relaxed">
            <div className="bg-orange-100/60 dark:bg-orange-900/30 rounded-xl p-3">
              <p className="font-semibold text-orange-900 dark:text-orange-200 text-xs uppercase tracking-wide mb-1">
                Chtourou & Souissi 2012 — J Strength Cond Res
              </p>
              <p>
                A systematic review of <strong className="text-orange-900 dark:text-orange-200">53 studies</strong> found a consistent
                afternoon peak in strength, endurance and sprint performance. Core body temperature,
                muscle enzyme activity and neuromuscular coordination all peak between 4–8 PM,
                lowering the perceived exertion at any given output.
              </p>
            </div>

            <div className="bg-orange-100/60 dark:bg-orange-900/30 rounded-xl p-3">
              <p className="font-semibold text-orange-900 dark:text-orange-200 text-xs uppercase tracking-wide mb-1">
                Kolbe et al. 2019 — Current Biology
              </p>
              <p>
                Muscle molecular clocks regulate the magnitude of training adaptation. Athletes
                who trained at their <strong className="text-orange-900 dark:text-orange-200">circadian peak</strong> showed greater
                mitochondrial biogenesis and gene expression for metabolic enzymes compared to
                off-peak training at matched intensities — peak-time training literally{' '}
                <em>amplifies gains</em>.
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-orange-700 dark:text-orange-400/70 leading-relaxed">
            Individual variation exists — chronotype (early bird vs night owl) shifts your personal peak by 1–3 hours.
            Your data above may confirm the typical late-afternoon peak or reveal a personalised window.
          </p>
        </div>

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <p className="text-xs text-gray-400 dark:text-gray-600 leading-relaxed text-center">
          Efficiency scores are derived from workout summary data and are intended for training guidance only.
          Individual chronotype and sleep quality may shift your personal peak window.
        </p>

      </main>
    </div>
  )
}
