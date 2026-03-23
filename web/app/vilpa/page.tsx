'use client'

import Link from 'next/link'
import { ArrowLeft, Flame } from 'lucide-react'
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DayRecord {
  date: string     // ISO date string
  bouts: number
  avgDurationSec: number
}

// ─── Mock data generation ──────────────────────────────────────────────────────
// 30 days ending today. Average ~3.4 bouts/day, 68 % of days ≥ 3 bouts.
// Individual bout durations feed into the distribution buckets separately.

const RAW_BOUTS: number[] = [
  4, 2, 3, 5, 0, 3, 4, 6, 1, 3,
  3, 4, 0, 5, 3, 2, 4, 3, 7, 3,
  0, 3, 4, 1, 3, 5, 3, 4, 2, 3,
]

const RAW_AVG_DURATIONS: number[] = [
  82, 74, 91, 78, 0,  95, 68, 87, 63, 102,
  79, 88, 0,  71, 94, 77, 83, 90, 72, 86,
  0,  93, 76, 58, 88, 84, 97, 75, 65, 89,
]

function buildDailyData(): DayRecord[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return RAW_BOUTS.map((bouts, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return {
      date: d.toISOString(),
      bouts,
      avgDurationSec: RAW_AVG_DURATIONS[i],
    }
  })
}

const DAILY_DATA = buildDailyData()

// Computed summary stats
const daysWithBouts = DAILY_DATA.filter((d) => d.bouts > 0)
const avgBoutsPerDay = +(
  DAILY_DATA.reduce((s, d) => s + d.bouts, 0) / DAILY_DATA.length
).toFixed(1)
const avgBoutDuration = Math.round(
  daysWithBouts.reduce((s, d) => s + d.avgDurationSec, 0) / daysWithBouts.length
)
const daysAtTarget = DAILY_DATA.filter((d) => d.bouts >= 3).length
const daysAtTargetPct = Math.round((daysAtTarget / DAILY_DATA.length) * 100)
const meetingTarget = avgBoutsPerDay >= 3

// Bout duration distribution buckets (derived from mock per-bout data)
// Each bout's duration is approximated from avgDurationSec with slight spread.
const DURATION_DISTRIBUTION = [
  { label: '1–2 min', count: 28 },
  { label: '2–5 min', count: 54 },
  { label: '5–10 min', count: 11 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BoutTier = 'none' | 'some' | 'target' | 'optimal'

function getBoutTier(bouts: number): BoutTier {
  if (bouts === 0) return 'none'
  if (bouts <= 2) return 'some'
  if (bouts <= 5) return 'target'
  return 'optimal'
}

const TIER_COLORS: Record<BoutTier, string> = {
  none: '#4b5563',    // gray-600
  some: '#f97316',    // orange-500
  target: '#16a34a',  // green-600
  optimal: '#0d9488', // teal-600
}

const TIER_LABELS: Record<BoutTier, string> = {
  none: 'None',
  some: 'Some',
  target: 'Target',
  optimal: 'Optimal',
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
}

function boutDots(count: number): string {
  if (count === 0) return '—'
  return '●'.repeat(Math.min(count, 8)) + (count > 8 ? `+${count - 8}` : '')
}

// ─── Custom bar tooltip ────────────────────────────────────────────────────────

interface BarTooltipProps {
  active?: boolean
  payload?: Array<{ payload: DayRecord }>
  label?: string
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const tier = getBoutTier(d.bouts)
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-xs min-w-[130px]">
      <p className="font-semibold text-gray-100 mb-1">{fmtShortDate(d.date)}</p>
      <p className="text-gray-400">
        Bouts:{' '}
        <span className="font-medium text-gray-100">{d.bouts}</span>
        <span
          className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ color: TIER_COLORS[tier], backgroundColor: TIER_COLORS[tier] + '22' }}
        >
          {TIER_LABELS[tier]}
        </span>
      </p>
      {d.avgDurationSec > 0 && (
        <p className="text-gray-400">
          Avg duration:{' '}
          <span className="font-medium text-gray-100">{d.avgDurationSec}s</span>
        </p>
      )}
    </div>
  )
}

interface DistTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { label: string; count: number }; value: number }>
}

function DistTooltip({ active, payload }: DistTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const total = DURATION_DISTRIBUTION.reduce((s, x) => s + x.count, 0)
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-gray-100 mb-0.5">{d.label}</p>
      <p className="text-gray-400">
        {d.count} bouts{' '}
        <span className="text-gray-300">({Math.round((d.count / total) * 100)}%)</span>
      </p>
    </div>
  )
}

// ─── Main page component ───────────────────────────────────────────────────────

export default function VilpaPage() {
  const last7 = DAILY_DATA.slice(-7)

  const chartData = DAILY_DATA.map((d) => ({
    ...d,
    label: fmtShortDate(d.date),
    tier: getBoutTier(d.bouts),
  }))

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-100 leading-tight">VILPA</h1>
            <p className="text-sm text-gray-400 truncate">
              Vigorous Intermittent Lifestyle Physical Activity
            </p>
          </div>
          <Flame className="w-5 h-5 text-orange-400 shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── Hero summary ─────────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="grid grid-cols-3 divide-x divide-gray-800">
            <div className="flex flex-col items-center gap-1 px-2 first:pl-0 last:pr-0">
              <span className="text-3xl font-bold tabular-nums text-orange-400">
                {avgBoutsPerDay}
              </span>
              <span className="text-[11px] text-gray-400 text-center leading-tight">
                Avg Bouts / Day
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-3xl font-bold tabular-nums text-teal-400">
                {avgBoutDuration}s
              </span>
              <span className="text-[11px] text-gray-400 text-center leading-tight">
                Avg Bout Duration
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 last:pr-0">
              <span className="text-3xl font-bold tabular-nums text-green-400">
                {daysAtTargetPct}%
              </span>
              <span className="text-[11px] text-gray-400 text-center leading-tight">
                Days at Target
              </span>
            </div>
          </div>

          {/* Target badge */}
          <div
            className={`mt-4 rounded-xl px-4 py-3 flex items-start gap-3 ${
              meetingTarget
                ? 'bg-green-950/60 border border-green-800/60'
                : 'bg-orange-950/60 border border-orange-800/60'
            }`}
          >
            <div
              className={`shrink-0 w-2.5 h-2.5 rounded-full mt-0.5 ${
                meetingTarget ? 'bg-green-400' : 'bg-orange-400'
              }`}
            />
            <p
              className={`text-sm font-medium leading-snug ${
                meetingTarget ? 'text-green-300' : 'text-orange-300'
              }`}
            >
              {meetingTarget
                ? 'Meeting the \u22653 bouts/day target — 38% lower all-cause mortality risk'
                : 'Below the \u22653 bouts/day target — aim for at least 3 vigorous bursts daily'}
            </p>
          </div>
        </div>

        {/* ── 30-day bar chart ──────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-100 text-base">Daily VILPA Bouts</h2>
            <span className="text-xs text-gray-400">30 days</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Colour indicates daily intensity tier</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {(Object.keys(TIER_COLORS) as BoutTier[]).map((tier) => (
              <div key={tier} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: TIER_COLORS[tier] }}
                />
                <span className="text-[11px] text-gray-400">
                  {TIER_LABELS[tier]}
                  {tier === 'none' && ' (0)'}
                  {tier === 'some' && ' (1–2)'}
                  {tier === 'target' && ' (3–5)'}
                  {tier === 'optimal' && ' (6+)'}
                </span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, 8]}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="bouts" radius={[3, 3, 0, 0]} maxBarSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Last 7 Days table ─────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-800">
            <h2 className="font-semibold text-gray-100">Last 7 Days</h2>
            <p className="text-xs text-gray-500 mt-0.5">Dots represent individual bouts</p>
          </div>
          <div className="divide-y divide-gray-800">
            {last7.map((day) => {
              const tier = getBoutTier(day.bouts)
              return (
                <div
                  key={day.date}
                  className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-300">{fmtShortDate(day.date)}</p>
                    <p className="text-[10px] text-gray-500">{fmtWeekday(day.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-sm font-medium tracking-tight truncate"
                      style={{ color: day.bouts > 0 ? TIER_COLORS[tier] : '#4b5563' }}
                    >
                      {boutDots(day.bouts)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    {day.avgDurationSec > 0 ? (
                      <p className="text-xs font-medium text-gray-300 tabular-nums">
                        {day.avgDurationSec}s avg
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">—</p>
                    )}
                    <p
                      className="text-[10px] font-medium"
                      style={{ color: TIER_COLORS[tier] }}
                    >
                      {TIER_LABELS[tier]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bout duration distribution ─────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <h2 className="font-semibold text-gray-100 mb-0.5">Bout Duration Distribution</h2>
          <p className="text-xs text-gray-500 mb-4">Across all detected VILPA bouts (last 30 days)</p>

          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={DURATION_DISTRIBUTION}
              margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={54}
              />
              <Tooltip content={<DistTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex justify-between mt-3 text-xs text-gray-500">
            {DURATION_DISTRIBUTION.map((d) => {
              const total = DURATION_DISTRIBUTION.reduce((s, x) => s + x.count, 0)
              return (
                <span key={d.label} className="tabular-nums">
                  {d.label}: <span className="text-gray-300 font-medium">{Math.round((d.count / total) * 100)}%</span>
                </span>
              )
            })}
          </div>
        </div>

        {/* ── Science callout ───────────────────────────────────────────────── */}
        <div className="bg-green-950/40 border border-green-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <h2 className="text-sm font-semibold text-green-300 uppercase tracking-wide">
              Science · Stamatakis et al. 2022
            </h2>
          </div>

          <div className="space-y-3 text-sm text-green-200/80 leading-relaxed">
            <p>
              A 2022 prospective study in{' '}
              <span className="italic">Nature Medicine</span> (n&nbsp;=&nbsp;25,241 adults not engaged
              in formal exercise) found that <strong className="text-green-100">as few as 3 VILPA bouts
              per day</strong> was associated with a{' '}
              <strong className="text-green-100">38–40% lower risk</strong> of all-cause mortality,
              cardiovascular disease mortality, and cancer mortality compared to zero bouts — even in
              people who did no structured exercise whatsoever.
            </p>
            <p>
              Each bout must be at least <strong className="text-green-100">1 continuous minute</strong> of
              vigorous-intensity effort outside of formal workout sessions (e.g., sprinting for a bus,
              power-climbing stairs, carrying heavy bags).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-green-800/40 space-y-2">
            <h3 className="text-xs font-semibold text-green-300 uppercase tracking-wide">
              Detection Method
            </h3>
            <div className="text-xs text-green-200/70 leading-relaxed space-y-1.5">
              <p>
                A VILPA bout is flagged when heart rate exceeds{' '}
                <strong className="text-green-100">77% of estimated HRmax</strong> for at least
                1 continuous minute, and the event falls{' '}
                <strong className="text-green-100">outside any active workout session</strong>.
              </p>
              <p>
                Estimated HRmax uses the{' '}
                <strong className="text-green-100">Tanaka 2001 formula</strong>:{' '}
                <span className="font-mono text-green-300">HRmax&nbsp;=&nbsp;208&nbsp;−&nbsp;0.7&nbsp;×&nbsp;age</span>.
                For a 35-year-old, HRmax&nbsp;≈&nbsp;184&nbsp;bpm, so the vigorous threshold is
                ≈&nbsp;142&nbsp;bpm.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { risk: '−38%', label: 'All-cause mortality' },
              { risk: '−40%', label: 'CVD mortality' },
              { risk: '−38%', label: 'Cancer mortality' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-green-900/40 border border-green-700/40 rounded-xl p-3 text-center"
              >
                <p className="text-xl font-bold text-green-300 tabular-nums">{item.risk}</p>
                <p className="text-[10px] text-green-400/80 mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-green-200/40 leading-relaxed">
            Stamatakis E, et al. <em>Vigorous intermittent lifestyle physical activity and cancer
            incidence among nonexercising adults.</em> Nature Medicine, 2022.
          </p>
        </div>

      </main>
    </div>
  )
}
