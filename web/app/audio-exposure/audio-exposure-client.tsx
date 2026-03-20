'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { AudioExposureData, AudioDay, RiskLevel } from './page'

interface Props {
  data: AudioExposureData
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE = '#f97316'

const RISK_COLOR: Record<RiskLevel, string> = {
  Safe: '#22c55e',
  Moderate: '#eab308',
  High: '#f97316',
  'Very High': '#ef4444',
}

const RISK_BG: Record<RiskLevel, string> = {
  Safe: 'rgba(34,197,94,0.12)',
  Moderate: 'rgba(234,179,8,0.12)',
  High: 'rgba(249,115,22,0.12)',
  'Very High': 'rgba(239,68,68,0.12)',
}

const RISK_BORDER: Record<RiskLevel, string> = {
  Safe: 'rgba(34,197,94,0.30)',
  Moderate: 'rgba(234,179,8,0.30)',
  High: 'rgba(249,115,22,0.30)',
  'Very High': 'rgba(239,68,68,0.30)',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbColor(db: number): string {
  if (db < 70) return '#22c55e'
  if (db < 80) return '#eab308'
  if (db < 90) return '#f97316'
  return '#ef4444'
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtFullDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ─── Custom Tooltip — env noise bar chart ────────────────────────────────────

interface EnvTooltipProps {
  active?: boolean
  payload?: { payload: AudioDay; value: number }[]
  label?: string
}

function EnvTooltip({ active, payload }: EnvTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--color-surface, #1a1a1a)',
        border: '1px solid var(--color-border, #333)',
        borderRadius: 8,
        fontSize: 12,
        padding: '8px 12px',
        minWidth: 160,
      }}
    >
      <p className="font-semibold text-text-primary mb-1">{fmtDate(d.date)}</p>
      <p className="text-text-secondary">
        Env avg:{' '}
        <span className="font-medium" style={{ color: dbColor(d.envAvg) }}>
          {d.envAvg} dB
        </span>
      </p>
      <p className="text-text-secondary">
        Env peak:{' '}
        <span className="font-medium text-text-primary">{d.envPeak} dB</span>
      </p>
    </div>
  )
}

// ─── Custom Tooltip — headphone line chart ───────────────────────────────────

interface HpTooltipProps {
  active?: boolean
  payload?: { payload: AudioDay; value: number }[]
}

function HpTooltip({ active, payload }: HpTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--color-surface, #1a1a1a)',
        border: '1px solid var(--color-border, #333)',
        borderRadius: 8,
        fontSize: 12,
        padding: '8px 12px',
        minWidth: 160,
      }}
    >
      <p className="font-semibold text-text-primary mb-1">{fmtDate(d.date)}</p>
      <p className="text-text-secondary">
        HP level:{' '}
        <span className="font-medium" style={{ color: dbColor(d.hpAvg) }}>
          {d.hpAvg} dB
        </span>
      </p>
      <p className="text-text-secondary">
        Risk:{' '}
        <span className="font-medium" style={{ color: RISK_COLOR[d.risk] }}>
          {d.risk}
        </span>
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AudioExposureClient({ data }: Props) {
  const { days, summary } = data

  const last14 = [...days].reverse().slice(0, 14)

  return (
    <div className="space-y-6">

      {/* ── 30-day summary card ──────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4"
        style={{
          background: 'rgba(249,115,22,0.07)',
          borderColor: 'rgba(249,115,22,0.25)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
              30-Day Overview
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">Audio Exposure Summary</p>
          </div>
          <span className="text-3xl">👂</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: RISK_COLOR[summary.overallRisk] }}
            >
              {summary.avgEnvNoise} dB
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Env Noise</p>
            <p
              className="text-[11px] font-medium mt-0.5"
              style={{ color: RISK_COLOR[summary.overallRisk] }}
            >
              {summary.overallRisk}
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold tabular-nums text-red-400">
              {summary.peakEnvNoise} dB
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Peak Env Noise</p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold tabular-nums text-green-400">
              {summary.avgHeadphone} dB
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Headphone</p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: ORANGE }}>
              {summary.peakHeadphone} dB
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Peak Headphone</p>
          </div>

          <div className="bg-surface rounded-xl border border-border p-3 text-center sm:col-span-2">
            <p className="text-2xl font-bold tabular-nums text-red-400">
              {summary.daysAbove85}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Days above 85 dB</p>
          </div>
        </div>
      </div>

      {/* ── Environmental noise bar chart ────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Environmental Noise — Daily Avg (dB)
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            {'<'}70 dB — Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
            70–79 dB — Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ORANGE }} />
            80–89 dB — High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            ≥90 dB — Very High
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={days} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={fmtDate}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              domain={[50, 100]}
              tickFormatter={(v: number) => `${v}`}
            />
            <ReferenceLine
              y={70}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{ value: '70', position: 'right', fontSize: 9, fill: '#22c55e' }}
            />
            <ReferenceLine
              y={85}
              stroke="#f97316"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{ value: '85', position: 'right', fontSize: 9, fill: '#f97316' }}
            />
            <Tooltip content={<EnvTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="envAvg" radius={[3, 3, 0, 0]}>
              {days.map((d, i) => (
                <Cell key={i} fill={dbColor(d.envAvg)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Headphone level line chart ───────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          Headphone Audio Level — Daily Avg (dB)
        </h3>
        <p className="text-xs text-text-secondary mb-3">
          WHO safe limit for headphones: 75 dB averaged over a week
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={days} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={fmtDate}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
              domain={[55, 90]}
              tickFormatter={(v: number) => `${v}`}
            />
            <ReferenceLine
              y={75}
              stroke="#22c55e"
              strokeDasharray="4 3"
              strokeOpacity={0.7}
              label={{ value: '75 safe', position: 'right', fontSize: 9, fill: '#22c55e' }}
            />
            <Tooltip content={<HpTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Line
              type="monotone"
              dataKey="hpAvg"
              stroke={ORANGE}
              strokeWidth={2}
              dot={(props: { cx: number; cy: number; payload: AudioDay }) => {
                const { cx, cy, payload } = props
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill={dbColor(payload.hpAvg)}
                    stroke="var(--color-surface, #1a1a1a)"
                    strokeWidth={1.5}
                  />
                )
              }}
              activeDot={{ r: 5, fill: ORANGE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Daily log table (last 14 days) ───────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Daily Log — Last 14 Days</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Date
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Env avg
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Env peak
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">
                  HP avg
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {last14.map((d, i) => (
                <tr
                  key={d.date}
                  className={`hover:bg-surface-secondary/40 transition-colors ${
                    i % 2 === 1 ? 'bg-surface-secondary/20' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                    {fmtFullDate(d.date)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right text-xs font-medium tabular-nums"
                    style={{ color: dbColor(d.envAvg) }}
                  >
                    {d.envAvg} dB
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums text-text-secondary">
                    {d.envPeak} dB
                  </td>
                  <td
                    className="px-3 py-2.5 text-right text-xs font-medium tabular-nums"
                    style={{ color: dbColor(d.hpAvg) }}
                  >
                    {d.hpAvg} dB
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        background: RISK_BG[d.risk],
                        border: `1px solid ${RISK_BORDER[d.risk]}`,
                        color: RISK_COLOR[d.risk],
                      }}
                    >
                      {d.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── WHO / NIOSH guidelines card ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="text-lg">👂</span>
          <h3 className="text-sm font-medium text-text-secondary">
            WHO / NIOSH Noise Exposure Guidelines
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Level
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary">
                  dB Range
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">
                  Allowed Exposure / Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  risk: 'Safe' as RiskLevel,
                  range: '< 70 dB',
                  desc: 'Safe for continuous exposure (conversation, quiet office)',
                },
                {
                  risk: 'Moderate' as RiskLevel,
                  range: '70–80 dB',
                  desc: 'Moderate — city traffic, busy restaurants; limit prolonged exposure',
                },
                {
                  risk: 'High' as RiskLevel,
                  range: '80–90 dB',
                  desc: 'High — limit to 2 hours/day (NIOSH); lawnmowers, heavy traffic',
                },
                {
                  risk: 'Very High' as RiskLevel,
                  range: '> 90 dB',
                  desc: 'Very High — limit to 30 min/day; concerts, power tools, sirens',
                },
              ].map((row) => (
                <tr key={row.risk} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                      style={{
                        background: RISK_BG[row.risk],
                        border: `1px solid ${RISK_BORDER[row.risk]}`,
                        color: RISK_COLOR[row.risk],
                      }}
                    >
                      {row.risk}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono font-medium text-text-primary whitespace-nowrap">
                    {row.range}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary leading-relaxed">
                    {row.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Guidelines based on WHO Environmental Noise Guidelines for the European Region (2018) and
            NIOSH Occupational Noise Exposure criteria. Headphone safety is assessed against the WHO
            "Make Listening Safe" initiative recommendation of ≤ 75 dB weekly average.
          </p>
        </div>
      </div>

    </div>
  )
}
