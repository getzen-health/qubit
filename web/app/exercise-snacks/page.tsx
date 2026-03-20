'use client'

import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type IntensityTier = 'Vigorous' | 'Moderate' | 'Light'

interface Snack {
  date: string
  sport: string
  durationMin: number
  avgHR: number
  calories: number
  intensity: IntensityTier
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function intensityFromHR(hr: number): IntensityTier {
  if (hr > 140) return 'Vigorous'
  if (hr >= 110) return 'Moderate'
  return 'Light'
}

function intensityColor(tier: IntensityTier): string {
  if (tier === 'Vigorous') return '#ef4444'
  if (tier === 'Moderate') return '#f97316'
  return '#3b82f6'
}

function intensityBg(tier: IntensityTier): string {
  if (tier === 'Vigorous') return 'bg-red-500/15 text-red-400 border-red-500/20'
  if (tier === 'Moderate') return 'bg-orange-500/15 text-orange-400 border-orange-500/20'
  return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// 12 weeks of weekly snack counts (consistently 3–5/week)
const WEEKLY_DATA: { week: string; snacks: number }[] = [
  { week: 'Dec 27', snacks: 4 },
  { week: 'Jan 3', snacks: 3 },
  { week: 'Jan 10', snacks: 5 },
  { week: 'Jan 17', snacks: 4 },
  { week: 'Jan 24', snacks: 3 },
  { week: 'Jan 31', snacks: 5 },
  { week: 'Feb 7', snacks: 4 },
  { week: 'Feb 14', snacks: 3 },
  { week: 'Feb 21', snacks: 4 },
  { week: 'Feb 28', snacks: 5 },
  { week: 'Mar 7', snacks: 4 },
  { week: 'Mar 14', snacks: 3 },
]

// 47 snacks in 90 days; mix: 40% Running, 30% Cycling, 20% HIIT, 10% Other
// Intensity: 55% vigorous (>140 bpm), 35% moderate (110–140), 10% light (<110)
const RECENT_SNACKS: Snack[] = [
  { date: '2026-03-18', sport: 'Running',  durationMin: 9,  avgHR: 152, calories: 112, intensity: 'Vigorous' },
  { date: '2026-03-17', sport: 'HIIT',     durationMin: 7,  avgHR: 163, calories: 98,  intensity: 'Vigorous' },
  { date: '2026-03-15', sport: 'Cycling',  durationMin: 12, avgHR: 128, calories: 134, intensity: 'Moderate' },
  { date: '2026-03-14', sport: 'Running',  durationMin: 8,  avgHR: 147, calories: 105, intensity: 'Vigorous' },
  { date: '2026-03-13', sport: 'Cycling',  durationMin: 10, avgHR: 118, calories: 110, intensity: 'Moderate' },
  { date: '2026-03-12', sport: 'Walk',     durationMin: 14, avgHR: 98,  calories: 72,  intensity: 'Light' },
  { date: '2026-03-11', sport: 'HIIT',     durationMin: 6,  avgHR: 158, calories: 88,  intensity: 'Vigorous' },
  { date: '2026-03-10', sport: 'Running',  durationMin: 10, avgHR: 144, calories: 121, intensity: 'Vigorous' },
]

// Totals derived from 47 snacks, avg 8 min, mix above
const TOTAL_SNACKS = 47
const AVG_SNACKS_PER_WEEK = 3.7
const AVG_DURATION_MIN = 8
const SNACK_CALORIES = 4710 // approx 47 × ~100 kcal avg
const TOTAL_ACTIVE_CALORIES = 28400 // context total
const SNACK_CAL_PCT = Math.round((SNACK_CALORIES / TOTAL_ACTIVE_CALORIES) * 100) // 17%

// Intensity breakdown percentages
const INTENSITY_BREAKDOWN = [
  { label: 'Vigorous (>140 bpm)', pct: 55, color: '#ef4444' },
  { label: 'Moderate (110–140 bpm)', pct: 35, color: '#f97316' },
  { label: 'Light (<110 bpm)', pct: 10, color: '#3b82f6' },
]

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function ExerciseSnacksPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Exercise Snacks</h1>
              <p className="text-sm text-text-secondary">Short bursts, big gains — last 90 days</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{TOTAL_SNACKS}</p>
            <p className="text-xs text-text-secondary mt-0.5">Total Snacks</p>
            <p className="text-xs text-text-secondary opacity-50 mt-0.5">90 days</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{AVG_SNACKS_PER_WEEK}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg / Week</p>
            <p className="text-xs text-green-500 opacity-70 mt-0.5">Target: 3</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{AVG_DURATION_MIN} min</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
            <p className="text-xs text-text-secondary opacity-50 mt-0.5">Max 15 min</p>
          </div>
        </div>

        {/* Calorie banner */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-primary">Snack Calorie Contribution</p>
            <span className="text-lg font-bold text-yellow-400">{SNACK_CAL_PCT}%</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            {SNACK_CALORIES.toLocaleString()} kcal from exercise snacks out of{' '}
            {TOTAL_ACTIVE_CALORIES.toLocaleString()} total active kcal burned
          </p>
          <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{ width: `${SNACK_CAL_PCT}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1.5 opacity-60">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Weekly frequency bar chart */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-medium text-text-primary">Weekly Snack Frequency</h3>
              <p className="text-xs text-text-secondary mt-0.5">Last 12 weeks</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="inline-block w-5 border-t-2 border-dashed border-green-500" />
              3/week target
            </span>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={WEEKLY_DATA}
              margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={22}
                allowDecimals={false}
                domain={[0, 7]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v, 'Snacks']}
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <ReferenceLine
                y={3}
                stroke="#22c55e"
                strokeDasharray="5 3"
                strokeWidth={1.5}
              />
              <Bar dataKey="snacks" radius={[4, 4, 0, 0]}>
                {WEEKLY_DATA.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.snacks >= 3 ? '#eab308' : '#ca8a04'}
                    opacity={entry.snacks >= 3 ? 1 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Intensity breakdown horizontal bar */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-primary mb-3">Intensity Breakdown</h3>
          <div className="space-y-3">
            {INTENSITY_BREAKDOWN.map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">{label}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
            {INTENSITY_BREAKDOWN.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {label.split('(')[0].trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Recent snacks list */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-text-primary">Recent Snacks</h3>
            <p className="text-xs text-text-secondary mt-0.5">Latest 8 sessions</p>
          </div>
          <ul className="divide-y divide-border">
            {RECENT_SNACKS.map((s, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-secondary/40 transition-colors"
              >
                {/* Intensity dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: intensityColor(s.intensity) }}
                />

                {/* Date + sport */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.sport}</p>
                  <p className="text-xs text-text-secondary">{fmtDate(s.date)}</p>
                </div>

                {/* Duration */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-text-primary tabular-nums">
                    {s.durationMin} min
                  </p>
                  <p className="text-xs text-text-secondary tabular-nums">{s.avgHR} bpm</p>
                </div>

                {/* Intensity badge */}
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${intensityBg(s.intensity)}`}
                >
                  {s.intensity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Science callout */}
        <div className="rounded-2xl border border-green-500/25 bg-green-500/8 p-4 space-y-2">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
            The science behind exercise snacks
          </p>
          <ul className="space-y-2 text-xs text-text-secondary leading-relaxed">
            <li>
              <span className="text-green-400 font-medium">Gillen et al. 2016 (MSSE):</span>{' '}
              3 &times; 20-second all-out sprints (10 min total) = equivalent VO&#8322; max gains
              to 45 min moderate cycling over 12 weeks.
            </li>
            <li>
              <span className="text-green-400 font-medium">Jenkins et al. 2019:</span>{' '}
              3 &times; 10-min post-meal walks reduced postprandial glucose 22% vs one 30-min walk.
            </li>
            <li>
              <span className="text-green-400 font-medium">Batacan et al. 2017:</span>{' '}
              Brief intense bouts throughout the day improve lipids, blood pressure and insulin
              sensitivity.
            </li>
          </ul>
          <p className="text-xs text-green-500/70 pt-1">
            Research target: 3 snacks/week at moderate-to-vigorous intensity.
          </p>
        </div>
      </main>
    </div>
  )
}
