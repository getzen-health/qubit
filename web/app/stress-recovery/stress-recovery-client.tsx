'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { StressRecoveryData, WeekPoint, Quadrant } from './page'

interface Props {
  data: StressRecoveryData
}

// ─── Quadrant config ──────────────────────────────────────────────────────────

interface QuadrantConfig {
  label: string
  color: string
  bgClass: string
  borderColor: string
  description: string
  advice: string
}

const QUADRANT_CONFIG: Record<Quadrant, QuadrantConfig> = {
  peaking: {
    label: 'Peaking',
    color: '#16a34a',
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-900/50',
    description: 'High training stress with strong recovery — the optimal performance window.',
    advice: 'Excellent window for race day or key sessions. Maintain this balance and avoid piling on extra volume.',
  },
  overreaching: {
    label: 'Overreaching',
    color: '#dc2626',
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-900/50',
    description: 'High training load with poor recovery signals — risk of accumulated fatigue.',
    advice: 'Prioritise sleep and nutrition. Consider reducing intensity this week and adding an extra rest day.',
  },
  recovering: {
    label: 'Recovering',
    color: '#0d9488',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-900/50',
    description: 'Low training stress with good recovery — body is adapting and rebuilding.',
    advice: 'Recovery is on track. A controlled build in load this week will drive positive adaptation.',
  },
  balanced: {
    label: 'Balanced',
    color: '#6b7280',
    bgClass: 'bg-gray-100 dark:bg-gray-800/50',
    borderColor: 'border-gray-200 dark:border-gray-700',
    description: 'Moderate stress with moderate recovery — a stable maintenance phase.',
    advice: 'Solid base. Gradually increase load or add higher-intensity sessions to move toward the peaking quadrant.',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function dotColorForQuadrant(q: Quadrant): string {
  return QUADRANT_CONFIG[q].color
}

// ─── Tooltip: timeline bar chart ──────────────────────────────────────────────

function TimelineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-500 dark:text-gray-400 tabular-nums">
          {p.name}:{' '}
          <span className="font-medium" style={{ color: p.color }}>
            {Math.round(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Scatter plot (custom CSS) ────────────────────────────────────────────────

function ScatterPlot({ weekPoints }: { weekPoints: WeekPoint[] }) {
  const current = weekPoints[weekPoints.length - 1]

  return (
    <div className="relative w-full" style={{ paddingBottom: '100%' }}>
      <div className="absolute inset-0">
        {/* Quadrant background regions */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {/* Top-left: Recovering (Low stress, High recovery) */}
          <div className="bg-teal-50 dark:bg-teal-950/25 border-r border-b border-gray-200 dark:border-gray-700 relative">
            <span className="absolute top-2 left-2 text-[10px] font-semibold text-teal-600 dark:text-teal-400 leading-tight">
              Recovering
            </span>
          </div>
          {/* Top-right: Peaking (High stress, High recovery) */}
          <div className="bg-green-50 dark:bg-green-950/25 border-l border-b border-gray-200 dark:border-gray-700 relative">
            <span className="absolute top-2 right-2 text-[10px] font-semibold text-green-600 dark:text-green-400 leading-tight text-right">
              Peaking
            </span>
          </div>
          {/* Bottom-left: Balanced (Low stress, Low recovery) */}
          <div className="bg-gray-100 dark:bg-gray-800/40 border-r border-t border-gray-200 dark:border-gray-700 relative">
            <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-tight">
              Balanced
            </span>
          </div>
          {/* Bottom-right: Overreaching (High stress, Low recovery) */}
          <div className="bg-red-50 dark:bg-red-950/25 border-l border-t border-gray-200 dark:border-gray-700 relative">
            <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-red-600 dark:text-red-400 leading-tight text-right">
              Overreaching
            </span>
          </div>
        </div>

        {/* Center crosshair lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600 opacity-50" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 dark:bg-gray-600 opacity-50" />
        </div>

        {/* Data points */}
        {weekPoints.map((pt, i) => {
          const isCurrentWeek = i === weekPoints.length - 1
          // x: stressScore 0-100 → left 2%..98%
          const left = `${2 + pt.stressScore * 0.96}%`
          // y: recoveryScore 0-100 → bottom 2%..98% → top = 100% - that
          const top = `${2 + (100 - pt.recoveryScore) * 0.96}%`
          const color = dotColorForQuadrant(pt.quadrant)

          return (
            <div
              key={pt.monday}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left, top }}
              title={`${fmtDate(pt.monday)}: Stress ${Math.round(pt.stressScore)}, Recovery ${Math.round(pt.recoveryScore)}`}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: isCurrentWeek ? 18 : 10,
                  height: isCurrentWeek ? 18 : 10,
                  backgroundColor: color,
                  opacity: isCurrentWeek ? 1 : 0.55,
                  border: isCurrentWeek ? '2px solid white' : 'none',
                  boxShadow: isCurrentWeek ? `0 0 0 2px ${color}` : 'none',
                }}
              />
            </div>
          )
        })}

        {/* Axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 pointer-events-none">
          <span className="text-[9px] text-gray-400 dark:text-gray-500">Low stress</span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center">← Stress →</span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 text-right">High stress</span>
        </div>
        <div
          className="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-1 pointer-events-none"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', width: 14 }}
        >
          <span className="text-[9px] text-gray-400 dark:text-gray-500">High recovery</span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500">Low recovery</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function StressRecoveryClient({ data }: Props) {
  const { weekPoints, currentQuadrant, currentStress, currentRecovery, noHRVData } = data

  // Need at least 4 weeks of data
  const weeksWithData = weekPoints.filter((w) => w.stressScore > 0 || w.recoveryScore !== 50)
  if (weeksWithData.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span className="text-3xl">📡</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Not Enough Data</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Stress and recovery analysis requires at least 4 weeks of workout and health data. Keep tracking and check back soon.
        </p>
      </div>
    )
  }

  const currentCfg = QUADRANT_CONFIG[currentQuadrant]

  // Build chart data for timeline bar chart
  const chartData = weekPoints.map((w) => ({
    label: fmtDate(w.monday),
    Stress: Math.round(w.stressScore),
    Recovery: Math.round(w.recoveryScore),
    quadrant: w.quadrant,
  }))

  return (
    <div className="space-y-4">

      {/* ── noHRVData notice ──────────────────────────────────────────────────── */}
      {noHRVData && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="text-amber-500 mt-0.5 shrink-0 text-base">⚠</span>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            No HRV data found in the last 12 weeks. Recovery score is calculated using resting heart rate only. Enable HRV recording in your health app for a more accurate picture.
          </p>
        </div>
      )}

      {/* ── Status card ───────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Current Week
        </p>

        {/* Two large metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Stress</p>
            <p
              className="text-3xl font-bold tabular-nums leading-none"
              style={{
                color: currentStress >= 75 ? '#dc2626' : currentStress >= 50 ? '#f97316' : '#6b7280',
              }}
            >
              {Math.round(currentStress)}
            </p>
            <p className="text-xs mt-1.5 text-gray-400 dark:text-gray-500">out of 100</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Recovery</p>
            <p
              className="text-3xl font-bold tabular-nums leading-none"
              style={{
                color: currentRecovery >= 65 ? '#16a34a' : currentRecovery >= 50 ? '#0d9488' : '#dc2626',
              }}
            >
              {Math.round(currentRecovery)}
            </p>
            <p className="text-xs mt-1.5 text-gray-400 dark:text-gray-500">out of 100</p>
          </div>
        </div>

        {/* Quadrant badge */}
        <div className="mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: currentCfg.color + '1a',
              color: currentCfg.color,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: currentCfg.color }}
            />
            {currentCfg.label}
          </span>
        </div>

        {/* Description and advice */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
          {currentCfg.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {currentCfg.advice}
        </p>
      </div>

      {/* ── Scatter plot card ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Training Map</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Each dot = one week · larger dot = current week
        </p>

        {/* Legend row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4">
          {(Object.entries(QUADRANT_CONFIG) as [Quadrant, QuadrantConfig][]).map(([q, cfg]) => (
            <div key={q} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</span>
            </div>
          ))}
        </div>

        <ScatterPlot weekPoints={weekPoints} />
      </div>

      {/* ── Timeline bar chart card ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Weekly Timeline</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">12 weeks · stress vs recovery score</p>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ left: -18, bottom: 0 }} barCategoryGap="16%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'currentColor' }}
              interval={1}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              allowDecimals={false}
            />
            <Tooltip content={<TimelineTooltip />} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Bar dataKey="Stress" name="Stress" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.85} />
            <Bar dataKey="Recovery" name="Recovery" fill="#0d9488" radius={[3, 3, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Quadrant guide card ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quadrant Guide</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(QUADRANT_CONFIG) as [Quadrant, QuadrantConfig][]).map(([q, cfg]) => {
            const isActive = q === currentQuadrant
            return (
              <div
                key={q}
                className={`rounded-xl p-3 border transition-all ${cfg.bgClass} ${cfg.borderColor} ${
                  isActive ? 'ring-2' : ''
                }`}
                style={isActive ? { ringColor: cfg.color } as React.CSSProperties : undefined}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <p
                    className="text-xs font-semibold"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                    {isActive && (
                      <span className="ml-1 text-[10px] font-normal opacity-70">(you)</span>
                    )}
                  </p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {cfg.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Axes explanation */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-0.5">Stress (x-axis)</p>
            <p className="leading-relaxed">Weekly workout minutes normalised to 0–100. The busiest week in 12 weeks scores 100.</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-0.5">Recovery (y-axis)</p>
            <p className="leading-relaxed">Derived from HRV and resting heart rate relative to your 12-week baseline. Above 50 is favourable.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
