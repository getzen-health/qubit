'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { CardioData } from './page'

type Status = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'

interface ComponentCard {
  name: string
  value: string
  detail: string
  status: Status
  icon: string
  href: string
}

const STATUS_COLOR: Record<Status, string> = {
  excellent: 'text-green-400',
  good:      'text-blue-400',
  fair:      'text-orange-400',
  poor:      'text-red-400',
  unknown:   'text-text-secondary',
}

const STATUS_BG: Record<Status, string> = {
  excellent: 'bg-green-500/10 border-green-500/20',
  good:      'bg-blue-500/10 border-blue-500/20',
  fair:      'bg-orange-500/10 border-orange-500/20',
  poor:      'bg-red-500/10 border-red-500/20',
  unknown:   'bg-surface border-border',
}

const STATUS_LABEL: Record<Status, string> = {
  excellent: 'Excellent',
  good:      'Good',
  fair:      'Fair',
  poor:      'Poor',
  unknown:   'No data',
}

const STATUS_SCORE: Record<Status, number> = {
  excellent: 3,
  good:      2,
  fair:      1,
  poor:      0,
  unknown:   -1,
}

function classifyRHR(rhr: number): Status {
  if (rhr < 50) return 'excellent'
  if (rhr < 60) return 'good'
  if (rhr < 70) return 'fair'
  return 'poor'
}

function classifyRHRLabel(rhr: number): string {
  if (rhr < 50) return 'Athlete'
  if (rhr < 60) return 'Excellent'
  if (rhr < 70) return 'Good'
  if (rhr < 80) return 'Average'
  return 'High'
}

function classifyVO2(vo2: number): Status {
  if (vo2 >= 50) return 'excellent'
  if (vo2 >= 40) return 'good'
  if (vo2 >= 30) return 'fair'
  return 'poor'
}

function classifyVO2Label(vo2: number): string {
  if (vo2 >= 55) return 'Superior'
  if (vo2 >= 45) return 'Excellent'
  if (vo2 >= 38) return 'Good'
  if (vo2 >= 30) return 'Fair'
  return 'Poor'
}

function classifyHRR1(hrr: number): Status {
  if (hrr >= 25) return 'excellent'
  if (hrr >= 18) return 'good'
  if (hrr >= 12) return 'fair'
  return 'poor'
}

function classifyHRR1Label(hrr: number): string {
  if (hrr >= 25) return 'Excellent'
  if (hrr >= 18) return 'Good'
  if (hrr >= 12) return 'Normal'
  return 'Poor'
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

interface Props {
  data: CardioData
}

export function CardioHealthClient({ data }: Props) {
  // Build component cards
  const components: ComponentCard[] = []

  // HRV
  if (data.hrv7Day !== null) {
    const dev = data.hrvDevPct ?? 0
    const status: Status = dev > 10 ? 'excellent' : dev > 0 ? 'good' : dev > -10 ? 'fair' : 'poor'
    const devStr = `${dev >= 0 ? '+' : ''}${dev.toFixed(0)}% vs baseline`
    components.push({
      name: 'HRV',
      value: `${data.hrv7Day} ms`,
      detail: devStr,
      status,
      icon: '💗',
      href: '/hrv',
    })
  } else {
    components.push({ name: 'HRV', value: '—', detail: 'No recent data', status: 'unknown', icon: '💗', href: '/hrv' })
  }

  // Resting HR
  if (data.rhr7Day !== null) {
    const status = classifyRHR(data.rhr7Day)
    const trend = data.rhrTrend !== null
      ? (data.rhrTrend < -0.1 ? ' · ↓ improving' : data.rhrTrend > 0.1 ? ' · ↑ rising' : ' · → stable')
      : ''
    components.push({
      name: 'Resting HR',
      value: `${data.rhr7Day} bpm`,
      detail: `${classifyRHRLabel(data.rhr7Day)}${trend}`,
      status,
      icon: '❤️',
      href: '/heartrate/resting',
    })
  } else {
    components.push({ name: 'Resting HR', value: '—', detail: 'No recent data', status: 'unknown', icon: '❤️', href: '/heartrate/resting' })
  }

  // VO2 Max
  if (data.vo2Max !== null) {
    const status = classifyVO2(data.vo2Max)
    const trend = data.vo2MaxTrend !== null
      ? (data.vo2MaxTrend > 0.5 ? ' · ↑ improving' : data.vo2MaxTrend < -0.5 ? ' · ↓ declining' : ' · → stable')
      : ''
    components.push({
      name: 'VO₂ Max',
      value: data.vo2Max.toFixed(1),
      detail: `${classifyVO2Label(data.vo2Max)}${trend}`,
      status,
      icon: '🫁',
      href: '/vo2max',
    })
  } else {
    components.push({ name: 'VO₂ Max', value: '—', detail: 'No recent data', status: 'unknown', icon: '🫁', href: '/vo2max' })
  }

  // HR Recovery
  if (data.hrr1Avg !== null) {
    const status = classifyHRR1(data.hrr1Avg)
    components.push({
      name: 'HR Recovery',
      value: `${data.hrr1Avg} bpm`,
      detail: `${classifyHRR1Label(data.hrr1Avg)} · 1-min post-workout drop`,
      status,
      icon: '📉',
      href: '/heartrate/recovery',
    })
  } else {
    components.push({ name: 'HR Recovery', value: '—', detail: 'No workout data', status: 'unknown', icon: '📉', href: '/heartrate/recovery' })
  }

  // Overall status
  const knownScores = components.filter((c) => c.status !== 'unknown').map((c) => STATUS_SCORE[c.status])
  const overallScore = knownScores.length > 0
    ? knownScores.reduce((a, b) => a + b, 0) / knownScores.length
    : -1
  const overallStatus: Status = overallScore >= 2.5 ? 'excellent'
    : overallScore >= 1.5 ? 'good'
    : overallScore >= 0.5 ? 'fair'
    : overallScore >= 0 ? 'poor'
    : 'unknown'

  const overallTaglines: Record<Status, string> = {
    excellent: 'All cardio metrics are in great shape. Keep up the excellent work!',
    good:      'Your cardio health looks solid with room for improvement in a few areas.',
    fair:      'Some cardio metrics need attention. Consider adjusting training and recovery.',
    poor:      'Multiple cardio markers are below optimal. Prioritize rest and recovery.',
    unknown:   'Sync your health data to see your cardio health overview.',
  }

  const trendData = data.hrv14Days.map((d) => ({
    date: fmtDate(d.date),
    hrv: d.hrv,
    baseline: data.hrv28Day,
  }))

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div className={`border rounded-xl p-4 ${STATUS_BG[overallStatus]}`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">🫀</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className={`text-lg font-bold ${STATUS_COLOR[overallStatus]}`}>
                Cardio Health: {STATUS_LABEL[overallStatus]}
              </h2>
            </div>
            <p className="text-sm text-text-secondary">{overallTaglines[overallStatus]}</p>
          </div>
        </div>
      </div>

      {/* Component Cards */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {components.map((comp, i) => (
          <Link key={comp.name} href={comp.href}>
            <div className={`flex items-center gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors ${
              i < components.length - 1 ? 'border-b border-border' : ''
            }`}>
              <span className="text-xl w-8 text-center shrink-0">{comp.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{comp.name}</p>
                <p className="text-xs text-text-secondary">{comp.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-text-primary">{comp.value}</p>
                <p className={`text-xs font-medium ${STATUS_COLOR[comp.status]}`}>
                  {STATUS_LABEL[comp.status]}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* HRV Trend Chart */}
      {trendData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">HRV — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ms`, 'HRV']} />
              {data.hrv28Day && (
                <ReferenceLine
                  y={data.hrv28Day}
                  stroke="rgba(255,255,255,0.25)"
                  strokeDasharray="4 3"
                  label={{ value: 'baseline', position: 'insideTopRight', fontSize: 9, fill: '#888' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="hrv"
                stroke="#818cf8"
                strokeWidth={2}
                dot={(props: { cx?: number; cy?: number; key?: string | number; payload?: { isAnomaly?: boolean; hrv?: number } }) => {
                  const isAbove = data.hrv28Day !== null && (props.payload?.hrv ?? 0) >= data.hrv28Day
                  return (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={isAbove ? '#22c55e' : '#f87171'}
                      stroke="none"
                    />
                  )
                }}
                activeDot={{ r: 5, fill: '#818cf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Above baseline
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" /> Below baseline
            </div>
          </div>
        </div>
      )}

      {/* Reference Table */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">Reference Ranges</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary text-left border-b border-border">
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium text-green-400">Excellent</th>
                <th className="pb-2 font-medium text-blue-400">Good</th>
                <th className="pb-2 font-medium text-orange-400">Fair</th>
                <th className="pb-2 font-medium text-red-400">Poor</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary space-y-1">
              {[
                { metric: 'HRV Dev %', excellent: '+10%+', good: '0–10%', fair: '-10–0%', poor: '<-10%' },
                { metric: 'Resting HR', excellent: '<50 bpm', good: '50–59', fair: '60–69', poor: '70+' },
                { metric: 'VO₂ Max',   excellent: '≥50',    good: '40–49', fair: '30–39', poor: '<30' },
                { metric: 'HRR1',      excellent: '≥25 bpm',good: '18–24', fair: '12–17', poor: '<12' },
              ].map((row) => (
                <tr key={row.metric} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 font-medium text-text-primary">{row.metric}</td>
                  <td className="py-1.5 text-green-400">{row.excellent}</td>
                  <td className="py-1.5 text-blue-400">{row.good}</td>
                  <td className="py-1.5 text-orange-400">{row.fair}</td>
                  <td className="py-1.5 text-red-400">{row.poor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary opacity-60">
          HRV deviation is relative to YOUR personal 28-day baseline, not a population average. All other ranges are general fitness classifications.
        </p>
      </div>
    </div>
  )
}
