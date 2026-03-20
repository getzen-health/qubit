'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, FlaskConical } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Mock Data — marathon runner, 12 weeks ────────────────────────────────────
// Week colour rule:
//   WoW change ≤ 0 (deload / cutback)  → cyan   (#22d3ee)
//   WoW change 0–10 %                  → green  (#22c55e)
//   WoW change 10–20 %                 → orange (#f97316)
//   WoW change > 20 %                  → red    (#ef4444)

interface WeekData {
  label: string        // "W1", "W2", …
  weekOf: string       // human date
  minutes: number
  wowPct: number | null  // null for first week
  sport: { running: number; cycling: number; strength: number }
}

const WEEKS: WeekData[] = [
  { label: 'W1',  weekOf: 'Jan 6',  minutes: 195, wowPct: null,  sport: { running: 155, cycling: 25, strength: 15 } },
  { label: 'W2',  weekOf: 'Jan 13', minutes: 215, wowPct:  10.3, sport: { running: 170, cycling: 25, strength: 20 } },
  { label: 'W3',  weekOf: 'Jan 20', minutes: 230, wowPct:   7.0, sport: { running: 180, cycling: 30, strength: 20 } },
  { label: 'W4',  weekOf: 'Jan 27', minutes: 175, wowPct: -23.9, sport: { running: 135, cycling: 25, strength: 15 } }, // deload
  { label: 'W5',  weekOf: 'Feb 3',  minutes: 255, wowPct:  45.7, sport: { running: 200, cycling: 35, strength: 20 } }, // spike
  { label: 'W6',  weekOf: 'Feb 10', minutes: 270, wowPct:   5.9, sport: { running: 215, cycling: 35, strength: 20 } },
  { label: 'W7',  weekOf: 'Feb 17', minutes: 285, wowPct:   5.6, sport: { running: 225, cycling: 40, strength: 20 } },
  { label: 'W8',  weekOf: 'Feb 24', minutes: 215, wowPct: -24.6, sport: { running: 165, cycling: 30, strength: 20 } }, // deload
  { label: 'W9',  weekOf: 'Mar 3',  minutes: 300, wowPct:  39.5, sport: { running: 240, cycling: 40, strength: 20 } }, // spike
  { label: 'W10', weekOf: 'Mar 10', minutes: 320, wowPct:   6.7, sport: { running: 255, cycling: 45, strength: 20 } },
  { label: 'W11', weekOf: 'Mar 17', minutes: 340, wowPct:   6.3, sport: { running: 270, cycling: 50, strength: 20 } },
  { label: 'W12', weekOf: 'Mar 20', minutes: 245, wowPct: -27.9, sport: { running: 190, cycling: 35, strength: 20 } }, // deload
]

// Colour logic
function barColor(wowPct: number | null): string {
  if (wowPct === null) return '#22c55e'   // first week — treat as compliant
  if (wowPct <= 0)     return '#22d3ee'   // deload
  if (wowPct <= 10)    return '#22c55e'   // green
  if (wowPct <= 20)    return '#f97316'   // orange
  return '#ef4444'                         // red spike
}

function wowCategory(wowPct: number | null): 'first' | 'deload' | 'compliant' | 'moderate' | 'spike' {
  if (wowPct === null) return 'first'
  if (wowPct <= 0)     return 'deload'
  if (wowPct <= 10)    return 'compliant'
  if (wowPct <= 20)    return 'moderate'
  return 'spike'
}

// ─── Derived summary stats ─────────────────────────────────────────────────────
const dataWeeks = WEEKS.slice(1)  // skip week 1 (no WoW)

const compliantCount  = dataWeeks.filter((w) => wowCategory(w.wowPct) === 'compliant').length
const deloadCount     = dataWeeks.filter((w) => wowCategory(w.wowPct) === 'deload').length
const spikeCount      = dataWeeks.filter((w) => ['spike', 'moderate'].includes(wowCategory(w.wowPct))).length
const compliancePct   = Math.round((compliantCount / dataWeeks.length) * 100)

// Last 8 weeks for the detail table
const LAST_8 = WEEKS.slice(-8)

// Last 4 weeks sport breakdown
const LAST_4 = WEEKS.slice(-4)

interface SportStat {
  name: string
  color: string
  avgMin: number
  trend: number   // % change vs prior 4 weeks
}

function sportStats(): SportStat[] {
  const prior4 = WEEKS.slice(-8, -4)
  const sports: Array<keyof WeekData['sport']> = ['running', 'cycling', 'strength']
  const colors: Record<string, string> = {
    running: '#3b82f6',
    cycling: '#f97316',
    strength: '#a855f7',
  }
  return sports.map((sport) => {
    const recentAvg = LAST_4.reduce((s, w) => s + w.sport[sport], 0) / 4
    const priorAvg  = prior4.reduce((s, w) => s + w.sport[sport], 0) / 4
    const trend = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0
    return {
      name: sport.charAt(0).toUpperCase() + sport.slice(1),
      color: colors[sport],
      avgMin: Math.round(recentAvg),
      trend: Math.round(trend * 10) / 10,
    }
  })
}

const SPORT_STATS = sportStats()

// ─── Recharts tooltip ─────────────────────────────────────────────────────────
const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--color-text-primary, #f0f0f0)',
}

interface TooltipPayload {
  payload?: WeekData & { color: string }
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  const wow = d.wowPct
  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-0.5 shadow-xl">
      <p className="font-semibold text-text-primary">Week of {d.weekOf}</p>
      <p className="text-text-secondary">{d.minutes} min total</p>
      {wow !== null ? (
        <p style={{ color: barColor(wow) }}>
          {wow > 0 ? '+' : ''}{wow.toFixed(1)}% WoW
        </p>
      ) : (
        <p className="text-text-secondary">Baseline week</p>
      )}
    </div>
  )
}

// ─── Chart data ───────────────────────────────────────────────────────────────
const chartData = WEEKS.map((w) => ({
  ...w,
  color: barColor(w.wowPct),
}))

// ─── Helper: WoW badge ────────────────────────────────────────────────────────
function WoWBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-xs text-text-secondary">—</span>
  }
  const color = barColor(pct)
  const label = pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold tabular-nums"
      style={{ color, backgroundColor: color + '18', border: `1px solid ${color}33` }}
    >
      {label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProgressiveOverloadPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to Explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Progressive Overload</h1>
            <p className="text-sm text-text-secondary">
              12-week volume tracker · 10% rule adherence
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* Back link (visible on page body too) */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Explore
        </Link>

        {/* ── Summary KPIs ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Compliance */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top left, #22c55e, transparent)' }} />
            <div className="relative flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                Compliance
              </span>
            </div>
            <p className="relative text-3xl font-black tabular-nums text-green-500">
              {compliancePct}%
            </p>
            <p className="relative text-xs text-text-secondary leading-tight">
              {compliantCount} of {dataWeeks.length} weeks within 10% rule
            </p>
          </div>

          {/* Load Spikes */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top left, #ef4444, transparent)' }} />
            <div className="relative flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                Load Spikes
              </span>
            </div>
            <p className="relative text-3xl font-black tabular-nums text-red-400">
              {spikeCount}
            </p>
            <p className="relative text-xs text-text-secondary leading-tight">
              weeks with &gt;10% volume jump
            </p>
          </div>

          {/* Deload Weeks */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top left, #22d3ee, transparent)' }} />
            <div className="relative flex items-center gap-1.5 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                Deload Weeks
              </span>
            </div>
            <p className="relative text-3xl font-black tabular-nums text-cyan-400">
              {deloadCount}
            </p>
            <p className="relative text-xs text-text-secondary leading-tight">
              planned volume reductions
            </p>
          </div>
        </div>

        {/* ── 12-Week Volume Bar Chart ───────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">
              Weekly Training Volume — 12 Weeks
            </h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Bar colour reflects week-over-week volume change
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                width={30}
                tickFormatter={(v: number) => `${v}m`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              {/* 10% growth reference — rough visual anchor at ~270 min */}
              <ReferenceLine
                y={270}
                stroke="#f97316"
                strokeDasharray="4 3"
                strokeOpacity={0.3}
                label={{ value: 'peak', position: 'right', fontSize: 9, fill: '#f9731644' }}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              &lt;10% — Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              10–20% — Moderate spike
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              &gt;20% — High spike
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              Deload / cutback
            </span>
          </div>
        </div>

        {/* ── Week-by-Week Detail Table — last 8 weeks ──────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Weekly Detail</h2>
            <span className="text-xs text-text-secondary">Last 8 weeks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Week</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">Volume</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">WoW Change</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {LAST_8.map((w) => {
                  const cat = wowCategory(w.wowPct)
                  const statusLabel: Record<string, string> = {
                    first: 'Baseline',
                    deload: 'Deload',
                    compliant: 'Compliant',
                    moderate: 'Moderate spike',
                    spike: 'High spike',
                  }
                  const statusColor: Record<string, string> = {
                    first: '#6b7280',
                    deload: '#22d3ee',
                    compliant: '#22c55e',
                    moderate: '#f97316',
                    spike: '#ef4444',
                  }
                  const color = statusColor[cat]
                  return (
                    <tr key={w.label} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-semibold text-text-primary">{w.label}</span>
                        <span className="text-xs text-text-secondary ml-1.5">{w.weekOf}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums text-text-primary">
                        {w.minutes} min
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <WoWBadge pct={w.wowPct} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            color,
                            backgroundColor: color + '18',
                            border: `1px solid ${color}33`,
                          }}
                        >
                          {statusLabel[cat]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Sport Breakdown — last 4 weeks ────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Sport Breakdown</h2>
            <span className="text-xs text-text-secondary">Last 4 weeks avg</span>
          </div>
          <div className="space-y-3">
            {SPORT_STATS.map((sport) => {
              const trendColor = sport.trend > 0 ? '#22c55e' : sport.trend < 0 ? '#ef4444' : '#6b7280'
              const trendLabel = sport.trend > 0 ? `+${sport.trend}%` : `${sport.trend}%`
              // bar width as % of max sport avg (340 min max total / 3 sports rough 170 max)
              const pct = Math.min(100, (sport.avgMin / 270) * 100)
              return (
                <div key={sport.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: sport.color }}
                      />
                      <span className="text-sm font-medium text-text-primary">{sport.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold tabular-nums text-text-primary">
                        {sport.avgMin} min/wk
                      </span>
                      <span
                        className="text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-full"
                        style={{
                          color: trendColor,
                          backgroundColor: trendColor + '18',
                          border: `1px solid ${trendColor}33`,
                        }}
                      >
                        {trendLabel}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: sport.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science Card ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 relative overflow-hidden"
          style={{ borderColor: '#3b82f633' }}
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #3b82f6, transparent 60%)' }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                The Science
              </h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <div className="flex gap-3">
                <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400/60 mt-1.5" />
                <p>
                  <strong className="text-text-primary font-semibold">Periodization (Matveyev 1965)</strong>{' '}
                  — Systematically increasing training stress is the primary driver of physiological
                  adaptation. Without progressive overload, performance plateaus.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400/60 mt-1.5" />
                <p>
                  <strong className="text-text-primary font-semibold">The 10% Rule (Hreljac 2004, Br J Sports Med)</strong>{' '}
                  — Increasing weekly training volume by more than 10% sharply raises injury risk.
                  Compliance with this rule is the single most actionable injury-prevention metric.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400/60 mt-1.5" />
                <p>
                  <strong className="text-text-primary font-semibold">Planned Deloads (Issurin 2010, Sports Med)</strong>{' '}
                  — A volume reduction of 20–30% every 3–4 weeks allows supercompensation: the body
                  rebuilds stronger during recovery than at baseline.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-400/60 mt-1.5" />
                <p>
                  <strong className="text-text-primary font-semibold">Supercompensation (Yakovlev 1955)</strong>{' '}
                  — The overload → fatigue → restoration → supercompensation cycle underpins all
                  modern periodized training. Skipping the restoration phase eliminates the gain.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
