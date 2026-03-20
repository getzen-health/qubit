'use client'

import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
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

// ─── Effort zone definitions ───────────────────────────────────────────────────

type ZoneKey = 'light' | 'moderate' | 'vigorous' | 'hard' | 'maximum'

interface ZoneConfig {
  label: string
  range: string
  color: string
  textClass: string
  bgClass: string
  borderClass: string
  badgeBg: string
  badgeText: string
  description: string
}

const ZONE_CONFIG: Record<ZoneKey, ZoneConfig> = {
  light: {
    label: 'Light',
    range: '1–2',
    color: '#22c55e',
    textClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderClass: 'border-green-200 dark:border-green-800/50',
    badgeBg: 'bg-green-100 dark:bg-green-950/50',
    badgeText: 'text-green-700 dark:text-green-400',
    description: 'Recovery, easy aerobic',
  },
  moderate: {
    label: 'Moderate',
    range: '3–4',
    color: '#14b8a6',
    textClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-800/50',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/50',
    badgeText: 'text-teal-700 dark:text-teal-400',
    description: 'Conversational, Zone 2',
  },
  vigorous: {
    label: 'Vigorous',
    range: '5–6',
    color: '#3b82f6',
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800/50',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/50',
    badgeText: 'text-blue-700 dark:text-blue-400',
    description: 'Comfortably hard, tempo',
  },
  hard: {
    label: 'Hard',
    range: '7–8',
    color: '#f97316',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800/50',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/50',
    badgeText: 'text-orange-700 dark:text-orange-400',
    description: 'Threshold, near-max',
  },
  maximum: {
    label: 'Maximum',
    range: '9–10',
    color: '#ef4444',
    textClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800/50',
    badgeBg: 'bg-red-100 dark:bg-red-950/50',
    badgeText: 'text-red-700 dark:text-red-400',
    description: 'All-out, VO2max effort',
  },
}

const ZONE_KEYS: ZoneKey[] = ['light', 'moderate', 'vigorous', 'hard', 'maximum']

function effortZone(score: number): ZoneKey {
  if (score <= 2) return 'light'
  if (score <= 4) return 'moderate'
  if (score <= 6) return 'vigorous'
  if (score <= 8) return 'hard'
  return 'maximum'
}

function effortColor(score: number): string {
  return ZONE_CONFIG[effortZone(score)].color
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

interface Session {
  date: string
  sport: string
  effort: number
  durationMin: number
}

const MOCK_SESSIONS: Session[] = [
  { date: '2025-12-20', sport: 'Running', effort: 4, durationMin: 45 },
  { date: '2025-12-23', sport: 'Cycling', effort: 5, durationMin: 60 },
  { date: '2025-12-26', sport: 'HIIT', effort: 8, durationMin: 30 },
  { date: '2025-12-28', sport: 'Strength', effort: 6, durationMin: 50 },
  { date: '2026-01-02', sport: 'Running', effort: 3, durationMin: 40 },
  { date: '2026-01-04', sport: 'Hiking', effort: 4, durationMin: 90 },
  { date: '2026-01-07', sport: 'Cycling', effort: 6, durationMin: 75 },
  { date: '2026-01-09', sport: 'HIIT', effort: 9, durationMin: 25 },
  { date: '2026-01-11', sport: 'Running', effort: 5, durationMin: 55 },
  { date: '2026-01-14', sport: 'Strength', effort: 5, durationMin: 45 },
  { date: '2026-01-16', sport: 'Running', effort: 7, durationMin: 50 },
  { date: '2026-01-18', sport: 'Cycling', effort: 6, durationMin: 80 },
  { date: '2026-01-21', sport: 'Hiking', effort: 3, durationMin: 120 },
  { date: '2026-01-23', sport: 'HIIT', effort: 8, durationMin: 30 },
  { date: '2026-01-25', sport: 'Running', effort: 6, durationMin: 48 },
  { date: '2026-01-28', sport: 'Strength', effort: 5, durationMin: 55 },
  { date: '2026-01-30', sport: 'Running', effort: 7, durationMin: 52 },
  { date: '2026-02-02', sport: 'Cycling', effort: 5, durationMin: 65 },
  { date: '2026-02-04', sport: 'HIIT', effort: 9, durationMin: 28 },
  { date: '2026-02-06', sport: 'Hiking', effort: 4, durationMin: 100 },
  { date: '2026-02-09', sport: 'Running', effort: 6, durationMin: 50 },
  { date: '2026-02-12', sport: 'Strength', effort: 6, durationMin: 50 },
  { date: '2026-02-14', sport: 'Running', effort: 5, durationMin: 45 },
  { date: '2026-02-16', sport: 'Cycling', effort: 7, durationMin: 70 },
  { date: '2026-02-18', sport: 'HIIT', effort: 8, durationMin: 32 },
]

// ─── Computed stats ─────────────────────────────────────────────────────────────

const totalSessions = MOCK_SESSIONS.length
const avgEffort =
  Math.round((MOCK_SESSIONS.reduce((s, r) => s + r.effort, 0) / totalSessions) * 10) / 10
const avgZone = effortZone(avgEffort)
const avgZoneCfg = ZONE_CONFIG[avgZone]

// 7-day session load: sum of effort × duration for sessions in last 7 days from latest date
const latestDateMs = Math.max(...MOCK_SESSIONS.map((s) => new Date(s.date).getTime()))
const sevenDaysCutoff = latestDateMs - 7 * 24 * 60 * 60 * 1000
const last7Sessions = MOCK_SESSIONS.filter((s) => new Date(s.date).getTime() > sevenDaysCutoff)
const sevenDayLoad = last7Sessions.reduce((s, r) => s + r.effort * r.durationMin, 0)

// Hard+ percentage (effort >= 7)
const hardPlusSessions = MOCK_SESSIONS.filter((s) => s.effort >= 7)
const hardPlusPct = Math.round((hardPlusSessions.length / totalSessions) * 100)

// Trend: linear regression slope over effort scores
function computeSlope(sessions: Session[]): number {
  const n = sessions.length
  const xs = sessions.map((_, i) => i)
  const ys = sessions.map((s) => s.effort)
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0)
  const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0)
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100
}
const trendSlope = computeSlope(MOCK_SESSIONS)

// Zone distribution
const zoneCounts = Object.fromEntries(ZONE_KEYS.map((k) => [k, 0])) as Record<ZoneKey, number>
MOCK_SESSIONS.forEach((s) => { zoneCounts[effortZone(s.effort)]++ })

// 90-day bar chart data
const barChartData = MOCK_SESSIONS.map((s) => ({
  date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  effort: s.effort,
  sport: s.sport,
  color: effortColor(s.effort),
}))

// Session load (last 10)
const last10Sessions = MOCK_SESSIONS.slice(-10)
const loadData = last10Sessions.map((s) => ({
  date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  load: s.effort * s.durationMin,
  sport: s.sport,
  effort: s.effort,
}))

// Week-over-week load change
const prevWeekCutoff = sevenDaysCutoff - 7 * 24 * 60 * 60 * 1000
const prev7Sessions = MOCK_SESSIONS.filter(
  (s) =>
    new Date(s.date).getTime() > prevWeekCutoff &&
    new Date(s.date).getTime() <= sevenDaysCutoff
)
const prev7Load = prev7Sessions.reduce((s, r) => s + r.effort * r.durationMin, 0)
const loadChangePct =
  prev7Load > 0 ? Math.round(((sevenDayLoad - prev7Load) / prev7Load) * 100) : null

// ─── Tooltip styles ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1c1c1e)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 10,
  fontSize: 12,
  padding: '8px 12px',
}

// ─── Custom Tooltip — Effort Trend ─────────────────────────────────────────────

interface EffortTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { date: string; sport: string; effort: number } }>
  label?: string
}

function EffortTooltip({ active, payload }: EffortTooltipProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  const zone = effortZone(entry.effort)
  const cfg = ZONE_CONFIG[zone]
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{entry.date}</p>
      <p className="text-gray-500 dark:text-gray-400 mb-1">{entry.sport}</p>
      <p>
        <span className="text-gray-500 dark:text-gray-400">Effort: </span>
        <span className="font-bold" style={{ color: cfg.color }}>
          {entry.effort} / 10
        </span>
        <span className={`ml-1.5 text-xs font-medium ${cfg.textClass}`}>({cfg.label})</span>
      </p>
    </div>
  )
}

// ─── Custom Tooltip — Session Load ─────────────────────────────────────────────

interface LoadTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: { date: string; sport: string; load: number; effort: number }
  }>
}

function LoadTooltip({ active, payload }: LoadTooltipProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{entry.date}</p>
      <p className="text-gray-500 dark:text-gray-400 mb-1">{entry.sport}</p>
      <p className="text-gray-500 dark:text-gray-400">
        Load:{' '}
        <span className="font-bold text-gray-800 dark:text-gray-200">
          {entry.load} <span className="font-normal text-xs">(effort × min)</span>
        </span>
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        Effort:{' '}
        <span className="font-medium" style={{ color: effortColor(entry.effort) }}>
          {entry.effort}
        </span>
      </p>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WorkoutEffortPage() {
  const trendLabel =
    trendSlope > 0.05
      ? `+${trendSlope} / session`
      : trendSlope < -0.05
      ? `${trendSlope} / session`
      : 'Stable'
  const trendColor =
    trendSlope > 0.05 ? '#f97316' : trendSlope < -0.05 ? '#22c55e' : '#6b7280'

  const loadWarning = loadChangePct !== null && loadChangePct > 15

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Workout Effort Score
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Apple Watch RPE · iOS 17+ · 90 days
            </p>
          </div>
          <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* ── Demo notice ──────────────────────────────────────────────────── */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="shrink-0 mt-0.5 text-amber-500 font-bold text-base">~</span>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            Showing <strong>demo data</strong>. Workout Effort Score requires Apple Watch running
            watchOS 10 (iOS 17+). Sync your Apple Health data to see your real scores.
          </p>
        </div>

        {/* ── Hero summary card ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
            Summary · {totalSessions} sessions · last 90 days
          </p>

          {/* Large effort number + badge */}
          <div className="flex items-end gap-4 mb-5">
            <div>
              <p
                className="text-6xl font-bold tabular-nums leading-none"
                style={{ color: avgZoneCfg.color }}
              >
                {avgEffort}
              </p>
              <p className="text-lg text-gray-400 dark:text-gray-500 font-medium mt-1">/ 10</p>
            </div>
            <div className="pb-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${avgZoneCfg.badgeBg} ${avgZoneCfg.badgeText}`}
              >
                {avgZoneCfg.label}
              </span>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {avgZoneCfg.description}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {totalSessions}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sessions tracked</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                {sevenDayLoad}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">7-day load</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: hardPlusPct > 20 ? '#f97316' : '#6b7280' }}
              >
                {hardPlusPct}%
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Hard+ sessions</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-xl font-bold tabular-nums" style={{ color: trendColor }}>
                {trendLabel}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Trend</p>
            </div>
          </div>
        </div>

        {/* ── 90-day effort trend chart ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
            90-Day Effort Trend
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Each bar = one session, coloured by zone
          </p>

          {/* Zone legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {ZONE_KEYS.map((key) => {
              const cfg = ZONE_CONFIG[key]
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cfg.label} ({cfg.range})
                  </span>
                </div>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.07}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              {/* Hard threshold */}
              <ReferenceLine
                y={7}
                stroke="#f97316"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{
                  value: 'Hard',
                  position: 'right',
                  fontSize: 9,
                  fill: '#f97316',
                }}
              />
              {/* Average effort */}
              <ReferenceLine
                y={avgEffort}
                stroke="#3b82f6"
                strokeDasharray="4 3"
                strokeOpacity={0.6}
                label={{
                  value: `Avg ${avgEffort}`,
                  position: 'right',
                  fontSize: 9,
                  fill: '#3b82f6',
                }}
              />
              <Tooltip content={<EffortTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
              <Bar dataKey="effort" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {barChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Effort zone distribution ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
            Zone Distribution
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Optimal: ~80% below Vigorous, ~20% Hard+
          </p>

          <div className="space-y-3">
            {ZONE_KEYS.map((key) => {
              const cfg = ZONE_CONFIG[key]
              const count = zoneCounts[key]
              const pct = Math.round((count / totalSessions) * 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {cfg.label}
                        <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                          ({cfg.range})
                        </span>
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                      {count} session{count !== 1 ? 's' : ''} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cfg.color,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* 80:20 compliance note */}
          {(() => {
            const easyPct =
              Math.round(
                ((zoneCounts.light + zoneCounts.moderate + zoneCounts.vigorous) / totalSessions) *
                  100
              )
            const hardPct2 = Math.round(
              ((zoneCounts.hard + zoneCounts.maximum) / totalSessions) * 100
            )
            const compliant = easyPct >= 75 && hardPct2 <= 25
            return (
              <div
                className={`mt-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed border ${
                  compliant
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300'
                    : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50 text-orange-800 dark:text-orange-300'
                }`}
              >
                <span className="font-semibold">
                  {compliant ? 'On track' : 'Check balance'}
                  {' — '}
                </span>
                {easyPct}% easy/moderate · {hardPct2}% hard/maximum.
                {!compliant &&
                  ' Aim for 80% below Vigorous to reduce injury risk and improve adaptation.'}
              </div>
            )
          })()}
        </div>

        {/* ── Session load chart ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Session Load</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Load = effort score × duration (min) · last 10 sessions
              </p>
            </div>
            {loadChangePct !== null && (
              <span
                className={`shrink-0 mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  loadWarning
                    ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                    : loadChangePct > 0
                    ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400'
                    : 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'
                }`}
              >
                {loadChangePct > 0 ? '+' : ''}{loadChangePct}% WoW
              </span>
            )}
          </div>

          {loadWarning && (
            <div className="mt-2 mb-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-3 py-2 text-xs text-red-800 dark:text-red-300">
              Weekly load increased by {loadChangePct}% — above the 15% threshold. Consider an
              easy or rest day to reduce injury risk.
            </div>
          )}

          <div className="mt-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={loadData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.07}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={36}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip content={<LoadTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
                <Bar dataKey="load" radius={[3, 3, 0, 0]} maxBarSize={36}>
                  {loadData.map((entry, i) => (
                    <Cell key={i} fill={effortColor(entry.effort)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Science card ──────────────────────────────────────────────────── */}
        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-800/50 shadow-sm">
          <h2 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">
            The Science Behind Effort Scores
          </h2>

          <div className="space-y-3">
            {/* RPE validity */}
            <div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                RPE validity
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                Rate of Perceived Exertion correlates strongly with physiological markers
                including heart rate, blood lactate, and VO2 (r = 0.87). Session RPE is a valid
                and reliable method for quantifying training load across sports — Foster et al.,{' '}
                <em>Journal of Strength and Conditioning Research</em>, 2001.
              </p>
            </div>

            {/* Session load & injury risk */}
            <div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                Session load and injury risk
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                RPE × duration predicts cumulative training stress. Weekly load spikes of &gt;10%
                are associated with a significantly elevated injury risk — Gabbett,{' '}
                <em>British Journal of Sports Medicine</em>, 2016. This app flags any week-over-week
                increase greater than 15%.
              </p>
            </div>

            {/* 80:20 training balance */}
            <div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                80:20 training balance
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                Elite endurance athletes spend approximately 80% of their training volume at
                low-to-moderate intensity and 20% at high intensity. Mirroring this distribution
                maximises aerobic adaptation while minimising overtraining — Seiler, 2010.
              </p>
            </div>

            {/* Apple's calculation */}
            <div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                How Apple Watch calculates effort
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                Apple Watch computes effort by comparing your exercise heart rate to your
                personalised estimated maximum HR, which is refined over time using machine learning
                on your workout history. Scores of 1–10 are automatically assigned when a workout
                ends (watchOS 10, iOS 17+).
              </p>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-800/50 flex gap-2 items-start">
            <span className="text-orange-500 dark:text-orange-400 font-bold text-sm shrink-0 mt-0.5">
              Tip
            </span>
            <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
              If your weekly session load spikes more than 15% compared to the previous week, take
              an easy or complete rest day before your next hard session. Consistent moderate
              progression beats big swings in training stress.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
