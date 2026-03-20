'use client'

import Link from 'next/link'
import { ArrowLeft, Wind, AlertTriangle, Info, CheckCircle } from 'lucide-react'
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
import { BottomNav } from '@/components/bottom-nav'

// ─── Mock data ────────────────────────────────────────────────────────────────

// 30 nights of AHI data — mostly normal (AHI < 5) with occasional mild (5–14)
const RAW_NIGHTS: { date: string; ahi: number }[] = [
  { date: '2026-02-17', ahi: 1.2 },
  { date: '2026-02-18', ahi: 2.8 },
  { date: '2026-02-19', ahi: 0.9 },
  { date: '2026-02-20', ahi: 3.4 },
  { date: '2026-02-21', ahi: 1.7 },
  { date: '2026-02-22', ahi: 4.2 },
  { date: '2026-02-23', ahi: 2.1 },
  { date: '2026-02-24', ahi: 5.8 },
  { date: '2026-02-25', ahi: 1.4 },
  { date: '2026-02-26', ahi: 3.0 },
  { date: '2026-02-27', ahi: 0.6 },
  { date: '2026-02-28', ahi: 6.3 },
  { date: '2026-03-01', ahi: 2.5 },
  { date: '2026-03-02', ahi: 4.8 },
  { date: '2026-03-03', ahi: 1.1 },
  { date: '2026-03-04', ahi: 7.2 },
  { date: '2026-03-05', ahi: 3.3 },
  { date: '2026-03-06', ahi: 2.0 },
  { date: '2026-03-07', ahi: 5.1 },
  { date: '2026-03-08', ahi: 1.8 },
  { date: '2026-03-09', ahi: 3.9 },
  { date: '2026-03-10', ahi: 0.7 },
  { date: '2026-03-11', ahi: 4.5 },
  { date: '2026-03-12', ahi: 2.3 },
  { date: '2026-03-13', ahi: 6.7 },
  { date: '2026-03-14', ahi: 1.5 },
  { date: '2026-03-15', ahi: 3.6 },
  { date: '2026-03-16', ahi: 2.9 },
  { date: '2026-03-17', ahi: 4.1 },
  { date: '2026-03-18', ahi: 1.3 },
]

// ─── Types & helpers ──────────────────────────────────────────────────────────

type Severity = 'normal' | 'mild' | 'moderate' | 'severe'

function classifyAHI(ahi: number): Severity {
  if (ahi < 5) return 'normal'
  if (ahi < 15) return 'mild'
  if (ahi < 30) return 'moderate'
  return 'severe'
}

const SEVERITY_COLOR: Record<Severity, string> = {
  normal: '#22c55e',
  mild: '#eab308',
  moderate: '#f97316',
  severe: '#ef4444',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  normal: 'Normal',
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
}

const SEVERITY_BG: Record<Severity, string> = {
  normal: 'bg-green-500/10 border-green-500/30',
  mild: 'bg-yellow-500/10 border-yellow-500/30',
  moderate: 'bg-orange-500/10 border-orange-500/30',
  severe: 'bg-red-500/10 border-red-500/30',
}

const SEVERITY_TEXT: Record<Severity, string> = {
  normal: 'text-green-400',
  mild: 'text-yellow-400',
  moderate: 'text-orange-400',
  severe: 'text-red-400',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── Derived stats ────────────────────────────────────────────────────────────

const chartData = RAW_NIGHTS.map((n) => ({
  date: fmtDate(n.date),
  ahi: n.ahi,
  severity: classifyAHI(n.ahi),
  color: SEVERITY_COLOR[classifyAHI(n.ahi)],
}))

const totalNights = RAW_NIGHTS.length
const avgAHI = +(RAW_NIGHTS.reduce((s, n) => s + n.ahi, 0) / totalNights).toFixed(1)
const peakAHI = +Math.max(...RAW_NIGHTS.map((n) => n.ahi)).toFixed(1)
const normalNights = RAW_NIGHTS.filter((n) => n.ahi < 5).length
const elevatedNights = totalNights - normalNights
const currentSeverity = classifyAHI(avgAHI)

// ─── Severity scale table data ────────────────────────────────────────────────

const SEVERITY_SCALE = [
  {
    severity: 'normal' as Severity,
    range: 'AHI < 5',
    label: 'Normal',
    action: 'No treatment required. Continue monitoring.',
  },
  {
    severity: 'mild' as Severity,
    range: 'AHI 5–14',
    label: 'Mild OSA',
    action: 'Lifestyle changes: weight loss, positional therapy, alcohol avoidance.',
  },
  {
    severity: 'moderate' as Severity,
    range: 'AHI 15–29',
    label: 'Moderate OSA',
    action: 'CPAP or oral appliance strongly recommended. Physician referral.',
  },
  {
    severity: 'severe' as Severity,
    range: 'AHI ≥ 30',
    label: 'Severe OSA',
    action: 'Urgent CPAP therapy. Significantly elevated cardiovascular risk.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function SleepApneaPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Sleep Apnea Monitor</h1>
            <p className="text-sm text-text-secondary">
              AHI tracking · Apple Watch Series 9+ · Demo data
            </p>
          </div>
          <Wind className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* AHI Summary card */}
        <div
          className={`rounded-2xl border p-5 ${SEVERITY_BG[currentSeverity]} relative overflow-hidden`}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(ellipse at top left, ${SEVERITY_COLOR[currentSeverity]}22 0%, transparent 70%)`,
            }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">
                Average AHI · 30 nights
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: SEVERITY_COLOR[currentSeverity] }}
                >
                  {avgAHI}
                </span>
                <span className="text-base text-text-secondary">events/hr</span>
              </div>
              <p className={`text-sm font-semibold mt-1 ${SEVERITY_TEXT[currentSeverity]}`}>
                {SEVERITY_LABEL[currentSeverity]} — AHI{' '}
                {currentSeverity === 'normal'
                  ? '< 5'
                  : currentSeverity === 'mild'
                  ? '5–14'
                  : currentSeverity === 'moderate'
                  ? '15–29'
                  : '≥ 30'}
              </p>
            </div>

            {/* Mini severity gauge */}
            <div className="shrink-0 flex flex-col gap-1 pt-1">
              {(['severe', 'moderate', 'mild', 'normal'] as Severity[]).map((s) => (
                <div
                  key={s}
                  className={`h-6 w-24 rounded flex items-center justify-center text-xs font-medium transition-all ${
                    s === currentSeverity ? 'opacity-100 scale-105' : 'opacity-30'
                  }`}
                  style={{ backgroundColor: SEVERITY_COLOR[s] + '33', color: SEVERITY_COLOR[s] }}
                >
                  {SEVERITY_LABEL[s]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{totalNights}</p>
            <p className="text-xs text-text-secondary mt-0.5">Nights Tracked</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{normalNights}</p>
            <p className="text-xs text-text-secondary mt-0.5">Normal Nights</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{elevatedNights}</p>
            <p className="text-xs text-text-secondary mt-0.5">Elevated Nights</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{peakAHI}</p>
            <p className="text-xs text-text-secondary mt-0.5">Peak AHI</p>
          </div>
        </div>

        {/* 30-night AHI trend chart */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-text-secondary">30-Night AHI Trend</h3>
            <span className="text-xs text-text-secondary">events/hour</span>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              Normal (&lt;5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              Mild (5–14)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              Moderate (15–29)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Severe (≥30)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                domain={[0, 16]}
                tickCount={5}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _: string, props: { payload?: { severity?: string } }) => [
                  `${value} events/hr`,
                  props?.payload?.severity
                    ? SEVERITY_LABEL[props.payload.severity as Severity]
                    : 'AHI',
                ]}
                labelFormatter={(label: string) => label}
              />
              {/* Mild threshold */}
              <ReferenceLine
                y={5}
                stroke="#eab308"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{
                  value: 'Mild threshold (5)',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#eab308',
                }}
              />
              {/* Moderate threshold */}
              <ReferenceLine
                y={15}
                stroke="#f97316"
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{
                  value: 'Moderate (15)',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#f97316',
                }}
              />
              <Bar dataKey="ahi" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AHI Severity Scale table */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-text-secondary">AHI Severity Scale</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                    Severity
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">
                    AHI Range
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                    Clinical Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SEVERITY_SCALE.map((row) => (
                  <tr
                    key={row.severity}
                    className={`transition-colors ${
                      row.severity === currentSeverity ? 'bg-surface-secondary/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.severity === currentSeverity && (
                          <CheckCircle
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: SEVERITY_COLOR[row.severity] }}
                          />
                        )}
                        <span
                          className="text-xs font-semibold"
                          style={{ color: SEVERITY_COLOR[row.severity] }}
                        >
                          {row.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-mono text-text-primary">{row.range}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-secondary leading-relaxed">
                        {row.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Science section */}
        <div className="bg-surface rounded-2xl border border-indigo-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-600/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                The Science of Sleep Apnea
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Prevalence */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-300 mb-1">Prevalence</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  ~26% of adults aged 30–70 have obstructive sleep apnea (OSA). Up to 80–90% of
                  moderate-to-severe cases remain undiagnosed (Young et al., NEJM 1993).
                </p>
              </div>

              {/* Cardiovascular risk */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-300 mb-1">Cardiovascular Risk</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Untreated moderate or severe OSA is associated with a 2–3× increased risk of heart
                  disease and a 2× increased risk of stroke compared to those without OSA.
                </p>
              </div>

              {/* CPAP efficacy */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-300 mb-1">CPAP Efficacy</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Continuous Positive Airway Pressure (CPAP) typically reduces AHI to below 5
                  events/hour. Consistent use can reverse cardiometabolic risk within 3–6 months.
                </p>
              </div>

              {/* Apple Watch screening */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-300 mb-1">Apple Watch Screening</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Apple Watch Series 9+ uses wrist accelerometry to detect breathing disruptions
                  during sleep. It is a screening tool only — not a validated clinical AHI
                  measurement device.
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                <span className="font-semibold text-amber-300">Medical disclaimer:</span> Apple
                Watch is not a medical device. AHI data shown here is an estimate. If your AHI
                consistently reads ≥ 5 events/hour, consult a physician for a formal sleep study
                (polysomnography or home sleep test) to confirm or rule out OSA.
              </p>
            </div>
          </div>
        </div>

        {/* Device requirements */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
            <h3 className="text-sm font-medium text-text-secondary">Device Requirements</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Apple Watch Series 9 or Ultra 2+',
              'watchOS 11 or later',
              'iOS 18 or later',
              'Sleep Focus enabled',
              '≥ 4 hours of sleep tracking',
            ].map((req) => (
              <span
                key={req}
                className="text-xs bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-text-secondary"
              >
                {req}
              </span>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
            HealthKit identifier:{' '}
            <code className="font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
              HKCategoryTypeIdentifierApneaEvent
            </code>{' '}
            · Available from iOS 18 (WWDC 2024).
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
