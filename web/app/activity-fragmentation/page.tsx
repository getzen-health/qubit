'use client'

import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayRecord {
  date: string
  fi: number
  bouts: number
  activeMinutes: number
}

interface BoutBucket {
  label: string
  count: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// 30 days of data ending 2026-03-20 (today). FI avg ~0.42 with realistic variation.
const DAILY_DATA: DayRecord[] = [
  { date: '2026-02-19', fi: 0.61, bouts: 9,  activeMinutes: 42 },
  { date: '2026-02-20', fi: 0.33, bouts: 6,  activeMinutes: 74 },
  { date: '2026-02-21', fi: 0.57, bouts: 11, activeMinutes: 38 },
  { date: '2026-02-22', fi: 0.44, bouts: 8,  activeMinutes: 55 },
  { date: '2026-02-23', fi: 0.29, bouts: 5,  activeMinutes: 88 },
  { date: '2026-02-24', fi: 0.48, bouts: 10, activeMinutes: 49 },
  { date: '2026-02-25', fi: 0.63, bouts: 12, activeMinutes: 34 },
  { date: '2026-02-26', fi: 0.38, bouts: 7,  activeMinutes: 62 },
  { date: '2026-02-27', fi: 0.52, bouts: 9,  activeMinutes: 46 },
  { date: '2026-02-28', fi: 0.27, bouts: 4,  activeMinutes: 95 },
  { date: '2026-03-01', fi: 0.41, bouts: 8,  activeMinutes: 58 },
  { date: '2026-03-02', fi: 0.59, bouts: 13, activeMinutes: 31 },
  { date: '2026-03-03', fi: 0.35, bouts: 6,  activeMinutes: 71 },
  { date: '2026-03-04', fi: 0.46, bouts: 9,  activeMinutes: 52 },
  { date: '2026-03-05', fi: 0.22, bouts: 3,  activeMinutes: 112 },
  { date: '2026-03-06', fi: 0.54, bouts: 11, activeMinutes: 40 },
  { date: '2026-03-07', fi: 0.67, bouts: 14, activeMinutes: 28 },
  { date: '2026-03-08', fi: 0.39, bouts: 7,  activeMinutes: 65 },
  { date: '2026-03-09', fi: 0.43, bouts: 8,  activeMinutes: 57 },
  { date: '2026-03-10', fi: 0.31, bouts: 5,  activeMinutes: 82 },
  { date: '2026-03-11', fi: 0.56, bouts: 10, activeMinutes: 43 },
  { date: '2026-03-12', fi: 0.49, bouts: 9,  activeMinutes: 50 },
  { date: '2026-03-13', fi: 0.37, bouts: 6,  activeMinutes: 68 },
  { date: '2026-03-14', fi: 0.62, bouts: 12, activeMinutes: 36 },
  { date: '2026-03-15', fi: 0.25, bouts: 4,  activeMinutes: 98 },
  { date: '2026-03-16', fi: 0.45, bouts: 8,  activeMinutes: 54 },
  { date: '2026-03-17', fi: 0.58, bouts: 11, activeMinutes: 39 },
  { date: '2026-03-18', fi: 0.34, bouts: 6,  activeMinutes: 73 },
  { date: '2026-03-19', fi: 0.42, bouts: 8,  activeMinutes: 59 },
  { date: '2026-03-20', fi: 0.47, bouts: 9,  activeMinutes: 51 },
]

// Bout distribution across all 30 days
const BOUT_DISTRIBUTION: BoutBucket[] = [
  { label: '1–15 min',   count: 124 },
  { label: '16–30 min',  count: 87  },
  { label: '31–60 min',  count: 42  },
  { label: '61–120 min', count: 18  },
  { label: '120+ min',   count: 6   },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fiColor(fi: number): string {
  if (fi < 0.35) return '#22c55e'   // green — Sustained
  if (fi <= 0.55) return '#f97316'  // orange — Moderate
  return '#ef4444'                   // red — Fragmented
}

function fiLabel(fi: number): string {
  if (fi < 0.35) return 'Sustained'
  if (fi <= 0.55) return 'Moderate'
  return 'Fragmented'
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtShortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
}

// ─── Derived stats ────────────────────────────────────────────────────────────

const avgFI =
  DAILY_DATA.reduce((s, d) => s + d.fi, 0) / DAILY_DATA.length

// Avg bout length = total active minutes / total bouts across all days
const totalActiveMinutes = DAILY_DATA.reduce((s, d) => s + d.activeMinutes, 0)
const totalBouts = DAILY_DATA.reduce((s, d) => s + d.bouts, 0)
const avgBoutLength = totalActiveMinutes / totalBouts

const daysAnalysed = DAILY_DATA.length

// Best 5 days (lowest FI = most sustained)
const BEST_DAYS = [...DAILY_DATA].sort((a, b) => a.fi - b.fi).slice(0, 5)

// Chart data: add a short x-axis label to each day
const TREND_DATA = DAILY_DATA.map((d) => ({
  ...d,
  label: fmtDate(d.date),
  color: fiColor(d.fi),
}))

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color,
}: {
  value: string
  label: string
  color: string
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 text-center">
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

function FIBadge({ fi }: { fi: number }) {
  const color = fiColor(fi)
  const label = fiLabel(fi)
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityFragmentationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Activity Fragmentation</h1>
            <p className="text-sm text-text-secondary">Movement continuity index · last 30 days</p>
          </div>
          <Activity className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            value={avgFI.toFixed(2)}
            label="Avg Fragmentation Index"
            color={fiColor(avgFI)}
          />
          <StatCard
            value={`${avgBoutLength.toFixed(1)} min`}
            label="Avg Bout Length"
            color="#60a5fa"
          />
          <StatCard
            value={String(daysAnalysed)}
            label="Days Analysed"
            color="#a78bfa"
          />
        </div>

        {/* FI scale legend */}
        <div className="bg-surface rounded-2xl border border-border px-4 py-3">
          <p className="text-xs font-medium text-text-secondary mb-2">Fragmentation Scale</p>
          <div className="flex items-center gap-1 w-full h-2 rounded-full overflow-hidden">
            <div className="flex-1 h-full rounded-l-full" style={{ background: '#22c55e' }} />
            <div className="flex-1 h-full" style={{ background: '#f97316' }} />
            <div className="flex-1 h-full rounded-r-full" style={{ background: '#ef4444' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-text-secondary">
            <span>
              <span style={{ color: '#22c55e' }}>Sustained</span> &lt;0.35
            </span>
            <span>
              <span style={{ color: '#f97316' }}>Moderate</span> 0.35–0.55
            </span>
            <span>
              <span style={{ color: '#ef4444' }}>Fragmented</span> &gt;0.55
            </span>
          </div>
        </div>

        {/* 30-Day Fragmentation Trend */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            30-Day Fragmentation Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={TREND_DATA}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                domain={[0, 1]}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v.toFixed(2), 'Fragmentation Index']}
                labelFormatter={(label: string) => label}
              />
              <Bar dataKey="fi" radius={[3, 3, 0, 0]}>
                {TREND_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              Sustained (&lt;0.35)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              Moderate (0.35–0.55)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Fragmented (&gt;0.55)
            </span>
          </div>
        </div>

        {/* Active Bout Distribution */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Active Bout Distribution
          </h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart
              data={BOUT_DISTRIBUTION}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v, 'Bouts']}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {BOUT_DISTRIBUTION.map((_, i) => {
                  // gradient from short (fragmented, red) to long (sustained, green)
                  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']
                  return <Cell key={i} fill={colors[i]} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2">
            Longer bouts (right) reflect sustained movement. Aim to shift count toward the 31–120 min columns.
          </p>
        </div>

        {/* Best Recent Days */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-text-secondary">Best Recent Days</h3>
            <p className="text-xs text-text-secondary mt-0.5 opacity-70">Lowest fragmentation index</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                    FI
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                    Bouts
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                    Active Min
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {BEST_DAYS.map((day) => (
                  <tr
                    key={day.date}
                    className="hover:bg-surface-secondary/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {fmtShortDate(day.date)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <FIBadge fi={day.fi} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                      {day.bouts}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary font-medium tabular-nums">
                      {day.activeMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Science callout */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Research Context</p>
          <p className="text-sm text-blue-200 leading-relaxed">
            <span className="font-semibold">Diaz et al. 2017 (JAMA Network Open):</span> Higher PA
            fragmentation predicted all-cause mortality independent of total activity volume.{' '}
            <span className="font-semibold">Bellettiere et al. 2021:</span> Fragmentation
            independently predicts incident CVD in older women. Aim for{' '}
            <span className="font-semibold text-green-400">FI &lt; 0.35</span> — fewer, longer
            uninterrupted activity bouts.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-surface rounded-2xl border border-border px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">How FI is Calculated</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            The day is divided into 15-minute intervals. An interval is classified as{' '}
            <em>active</em> if step count exceeds a threshold (typically 100 steps/min). The
            Fragmentation Index equals the number of{' '}
            <span className="text-text-primary font-medium">active → sedentary transitions</span>{' '}
            divided by the total number of active intervals. A value near 0 means one long
            continuous bout; a value near 1 means every active interval is immediately followed
            by rest.
          </p>
        </div>

      </main>
    </div>
  )
}
