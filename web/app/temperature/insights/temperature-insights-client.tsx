'use client'

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

export type DeviationStatus = 'elevated' | 'normal' | 'low'

export interface NightlyDeviation {
  date: string
  deviation: number
  status: DeviationStatus
}

export interface TemperatureInsightsData {
  lastNightDeviation: number
  lastNightStatus: DeviationStatus
  avg30d: number
  peak30d: number
  nightsAbove1C: number
  consecutiveElevated: number
  daily: NightlyDeviation[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE = '#F97316'
const BLUE   = '#3B82F6'
const CYAN   = '#06B6D4'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Reference ranges ────────────────────────────────────────────────────────

const REFERENCE_RANGES = [
  {
    range: '≥ +1.0°C',
    label: 'Elevated',
    description: 'Possible illness onset, fever, intense stress, or hormonal shift',
    color: ORANGE,
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/20',
  },
  {
    range: '+0.3 to +1.0°C',
    label: 'Slightly Warm',
    description: 'Mild elevation — could reflect hard training, alcohol, or warm sleep environment',
    color: '#EAB308',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/20',
  },
  {
    range: '−0.5 to +0.3°C',
    label: 'Normal',
    description: 'Within personal baseline range — body is well regulated',
    color: BLUE,
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/20',
  },
  {
    range: '< −0.5°C',
    label: 'Low',
    description: 'Below-baseline — deep recovery, cold environment, or strong thermoregulation',
    color: CYAN,
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/20',
  },
]

// ─── Illness signal levels ────────────────────────────────────────────────────

type SignalLevel = 'clear' | 'watch' | 'elevated' | 'illness'

function computeSignalLevel(
  consecutiveElevated: number,
  nightsAbove1C: number,
  avg30d: number,
): SignalLevel {
  if (consecutiveElevated >= 3 || nightsAbove1C >= 3) return 'illness'
  if (consecutiveElevated >= 2 || nightsAbove1C >= 2) return 'elevated'
  if (avg30d > 0.3 || nightsAbove1C >= 1) return 'watch'
  return 'clear'
}

const SIGNAL_CONFIG: Record<SignalLevel, {
  label: string
  color: string
  bgClass: string
  textClass: string
  borderClass: string
  description: string
}> = {
  clear: {
    label: 'Clear',
    color: '#22C55E',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/20',
    description:
      'No illness signal detected. Your nightly temperature deviation is within normal range — sleep environment and recovery look good.',
  },
  watch: {
    label: 'Watch',
    color: '#EAB308',
    bgClass: 'bg-yellow-500/10',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/20',
    description:
      'Mild elevation observed on one or more nights. No persistent pattern yet, but worth monitoring — check for early illness symptoms or unusual stress.',
  },
  elevated: {
    label: 'Elevated',
    color: ORANGE,
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/20',
    description:
      'Consecutive elevated nights detected. This pattern can precede illness onset. Consider reducing training load, prioritising sleep, and monitoring symptoms.',
  },
  illness: {
    label: 'Possible Illness',
    color: '#EF4444',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/20',
    description:
      'Strong illness signal: 3+ elevated nights or multiple nights above +1°C. This is a meaningful physiological signal. Rest, stay hydrated, and consult a doctor if symptoms persist.',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function barColor(status: DeviationStatus): string {
  if (status === 'elevated') return ORANGE
  if (status === 'low')      return CYAN
  return BLUE
}

function statusBadgeClasses(status: DeviationStatus): { bg: string; text: string; border: string; label: string } {
  if (status === 'elevated') return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', label: 'Elevated' }
  if (status === 'low')      return { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   border: 'border-cyan-500/30',   label: 'Low' }
  return                            { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30',   label: 'Normal' }
}

function fmtDev(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}°C`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemperatureInsightsClient({ data }: { data: TemperatureInsightsData }) {
  const {
    lastNightDeviation,
    lastNightStatus,
    avg30d,
    peak30d,
    nightsAbove1C,
    consecutiveElevated,
    daily,
  } = data

  const badge = statusBadgeClasses(lastNightStatus)
  const signalLevel = computeSignalLevel(consecutiveElevated, nightsAbove1C, avg30d)
  const signal = SIGNAL_CONFIG[signalLevel]

  return (
    <div className="space-y-6">

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(249,115,22,0.07)', borderColor: 'rgba(249,115,22,0.22)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
              Last Night&apos;s Deviation
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold tabular-nums" style={{ color: ORANGE }}>
                {fmtDev(lastNightDeviation)}
              </p>
            </div>
            <p className="text-xs text-text-secondary mt-1 opacity-60">from personal baseline</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold mt-1 border ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-blue-400">{fmtDev(avg30d)}</p>
            <p className="text-xs text-text-secondary mt-0.5">30d Average</p>
            <p className="text-xs text-text-secondary opacity-50">deviation</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold tabular-nums text-orange-400">{fmtDev(peak30d)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Peak 30d</p>
            <p className="text-xs text-text-secondary opacity-50">highest night</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: nightsAbove1C > 0 ? ORANGE : 'var(--color-text-primary)' }}
            >
              {nightsAbove1C}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Nights &gt; +1°C</p>
            <p className="text-xs text-text-secondary opacity-50">last 30 days</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: consecutiveElevated >= 2 ? ORANGE : 'var(--color-text-primary)' }}
            >
              {consecutiveElevated}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Consec. Elevated</p>
            <p className="text-xs text-text-secondary opacity-50">nights in a row</p>
          </div>
        </div>
      </div>

      {/* ── 30-day bar chart ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">30-Day Nightly Deviation</h3>
        <p className="text-xs text-text-secondary mb-1 opacity-70">
          Orange = elevated · Blue = normal · Cyan = low · dashed lines at +1°C and −0.5°C
        </p>
        <div className="flex gap-4 mb-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ORANGE }} />
            Elevated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: BLUE }} />
            Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: CYAN }} />
            Low
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
              interval={4}
            />
            <YAxis
              domain={[-1.5, 2.5]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={38}
              tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [fmtDev(val), 'Deviation']}
              labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 4, fontSize: 11 }}
            />
            {/* Baseline */}
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
              label={{ value: 'Baseline', fill: 'rgba(255,255,255,0.35)', fontSize: 9, position: 'insideBottomRight' }}
            />
            {/* +1°C threshold */}
            <ReferenceLine
              y={1}
              stroke={ORANGE}
              strokeDasharray="5 3"
              strokeOpacity={0.55}
              label={{ value: '+1.0°C', fill: ORANGE, fontSize: 9, position: 'insideTopRight' }}
            />
            {/* −0.5°C threshold */}
            <ReferenceLine
              y={-0.5}
              stroke={CYAN}
              strokeDasharray="5 3"
              strokeOpacity={0.55}
              label={{ value: '−0.5°C', fill: CYAN, fontSize: 9, position: 'insideBottomRight' }}
            />
            <Bar dataKey="deviation" radius={[3, 3, 0, 0]}>
              {daily.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.status)} fillOpacity={0.80} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Illness signal detector ───────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-5 ${signal.bgClass} ${signal.borderClass}`}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-3 h-3 rounded-full mt-1 flex-none ring-4"
            style={{
              background: signal.color,
              boxShadow: `0 0 0 4px ${signal.color}30`,
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className={`text-sm font-semibold ${signal.textClass}`}>
                Illness Signal Detector
              </p>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${signal.bgClass} ${signal.textClass} ${signal.borderClass}`}
              >
                {signal.label}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {signal.description}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-text-secondary">
              <div className="bg-background/30 rounded-lg px-2 py-1.5 text-center">
                <p className="font-semibold text-green-400">Clear</p>
                <p className="opacity-60 mt-0.5">avg &lt; +0.3°C</p>
              </div>
              <div className="bg-background/30 rounded-lg px-2 py-1.5 text-center">
                <p className="font-semibold text-yellow-400">Watch</p>
                <p className="opacity-60 mt-0.5">1 night &gt; +1°C</p>
              </div>
              <div className="bg-background/30 rounded-lg px-2 py-1.5 text-center">
                <p className="font-semibold text-orange-400">Elevated</p>
                <p className="opacity-60 mt-0.5">2+ consec.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reference ranges ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-text-primary">Reference Ranges</h3>
          <p className="text-xs text-text-secondary mt-0.5 opacity-70">
            Wrist temperature deviation from personal nightly baseline
          </p>
        </div>
        <div className="divide-y divide-border">
          {REFERENCE_RANGES.map(({ range, label, description, bgClass, textClass, borderClass }) => (
            <div
              key={range}
              className={`flex items-start justify-between px-4 py-3 gap-4 ${bgClass}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-semibold tabular-nums ${textClass}`}>{range}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${bgClass} ${textClass} ${borderClass}`}
                  >
                    {label}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-snug">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-background/30 border-t border-border">
          <p className="text-xs text-text-secondary opacity-60 leading-relaxed">
            Note: Apple Watch reports wrist skin temperature, not core body temperature. Core body temp is
            typically ~2–4°C higher. These readings are best used as relative trends — an elevated deviation
            is meaningful for you personally, not as a clinical absolute measurement.
          </p>
        </div>
      </div>

    </div>
  )
}
