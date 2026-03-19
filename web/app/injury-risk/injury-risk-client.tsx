'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import type { InjuryRiskData, DayLoad } from './page'

interface Props {
  data: InjuryRiskData
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

function riskColor(level: 'low' | 'elevated' | 'high'): string {
  if (level === 'low') return '#22c55e'       // green-500
  if (level === 'elevated') return '#f59e0b'  // amber-500
  return '#ef4444'                             // red-500
}

function riskBg(level: 'low' | 'elevated' | 'high'): string {
  if (level === 'low') return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
  if (level === 'elevated') return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
  return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
}

function riskTextColor(level: 'low' | 'elevated' | 'high'): string {
  if (level === 'low') return 'text-green-700 dark:text-green-400'
  if (level === 'elevated') return 'text-amber-700 dark:text-amber-400'
  return 'text-red-700 dark:text-red-400'
}

function riskBadgeBg(level: 'low' | 'elevated' | 'high'): string {
  if (level === 'low') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  if (level === 'elevated') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
}

function levelLabel(level: 'low' | 'elevated' | 'high'): string {
  if (level === 'low') return 'Low Risk'
  if (level === 'elevated') return 'Elevated Risk'
  return 'High Risk'
}

// ── Abbreviated date label for chart x-axis ────────────────────────────────────

function fmtDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month, 10) - 1]
  return `${monthAbbr} ${parseInt(day, 10)}`
}

// ── Custom tooltip for workload chart ─────────────────────────────────────────

function WorkloadTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const minutes = payload[0]?.value ?? 0
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</p>
      <p className="text-gray-600 dark:text-gray-400">
        {minutes > 0 ? `${minutes} min workout` : 'Rest day'}
      </p>
    </div>
  )
}

// ── Main client component ──────────────────────────────────────────────────────

export function InjuryRiskClient({ data }: Props) {
  const {
    score,
    level,
    acwr,
    acuteLoad,
    chronicLoad,
    consecutiveDays,
    factors,
    dailyLoads,
    recommendations,
  } = data

  const color = riskColor(level)

  // Thin the x-axis labels so they don't overlap on 28 bars
  const labelInterval = 6

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Score card ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4">

            {/* Circular gauge */}
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center shadow-inner"
              style={{
                background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)`,
              }}
            >
              <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                <span
                  className="text-4xl font-bold tabular-nums leading-none"
                  style={{ color }}
                >
                  {score}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">/ 100</span>
              </div>
            </div>

            {/* Level badge */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${riskBadgeBg(level)}`}
            >
              {levelLabel(level)}
            </span>

            {/* Sub-stats */}
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                  {acwr.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ACWR</div>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-700" />
              <div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                  {consecutiveDays}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Consec. Days</div>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-700" />
              <div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                  {acuteLoad}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Acute min/d</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Risk factors ───────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Risk Factors
          </h2>

          {factors.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              No significant risk factors detected ✓
            </p>
          ) : (
            <div className="space-y-3">
              {factors.map((f) => (
                <div
                  key={f.name}
                  className="flex items-start gap-3"
                >
                  <span className="text-xl leading-none mt-0.5">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {f.name}
                      </span>
                      <span
                        className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                        }}
                      >
                        +{f.points}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 28-Day Workload chart ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
            28-Day Workload
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Daily workout minutes with chronic average reference line
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dailyLoads}
              margin={{ left: -20, bottom: 0 }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => fmtDateLabel(v)}
                tick={{ fontSize: 9 }}
                interval={labelInterval}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<WorkloadTooltip />} />
              {chronicLoad > 0 && (
                <ReferenceLine
                  y={chronicLoad}
                  stroke="#9ca3af"
                  strokeDasharray="5 3"
                  label={{
                    value: 'Chronic Avg',
                    fill: '#6b7280',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Bar dataKey="minutes" name="Minutes" radius={[3, 3, 0, 0]}>
                {dailyLoads.map((entry: DayLoad, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.minutes > 0 ? '#3b82f6' : '#e5e7eb'}
                    opacity={entry.minutes > 0 ? 0.85 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center tabular-nums">
            Acute: <span className="font-medium text-gray-700 dark:text-gray-300">{acuteLoad} min/day</span>
            {' · '}
            Chronic: <span className="font-medium text-gray-700 dark:text-gray-300">{chronicLoad} min/day</span>
            {' · '}
            ACWR: <span className="font-medium" style={{ color }}>{acwr.toFixed(2)}</span>
          </p>
        </div>

        {/* ── Recommendations ────────────────────────────────────────────────── */}
        <div
          className={`rounded-2xl border p-5 shadow-sm ${riskBg(level)}`}
        >
          <h2 className={`text-base font-semibold mb-3 flex items-center gap-2 ${riskTextColor(level)}`}>
            <span>
              {level === 'low' ? '✅' : level === 'elevated' ? '⚠️' : '🛑'}
            </span>
            Recommendations
          </h2>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className={`shrink-0 font-bold ${riskTextColor(level)}`}>·</span>
                <span className="text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Score legend ───────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Score Guide
          </h2>
          <div className="space-y-2">
            {[
              { range: '0 – 30', label: 'Low Risk', color: '#22c55e', bg: 'bg-green-100 dark:bg-green-900/30' },
              { range: '31 – 60', label: 'Elevated Risk', color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30' },
              { range: '61 – 100', label: 'High Risk', color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums w-16">
                  {row.range}
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {row.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
            Score combines ACWR, consecutive training days, HRV drop, resting HR elevation, and training monotony.
            This is informational only — consult a healthcare professional for medical advice.
          </p>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
