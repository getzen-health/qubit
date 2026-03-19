'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'

export interface MonthStats {
  month: string         // e.g. "2025-01"
  label: string         // e.g. "Jan '25"
  shortLabel: string    // e.g. "Jan"
  year: number
  workoutCount: number
  totalDistanceKm: number
  totalDurationMin: number
  totalCalories: number
  avgPaceSecsPerKm: number | null  // running only
  runCount: number
}

interface Props {
  months: MonthStats[]
  currentYear: number
  prevYear: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtPace(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}/km`
}

function fmtDur(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function YearlyWorkoutClient({ months, currentYear, prevYear }: Props) {
  const thisYear = months.filter((m) => m.year === currentYear)
  const lastYear = months.filter((m) => m.year === prevYear)

  // Side-by-side chart data (aligned by month name)
  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const comparisonData = MONTH_SHORT.map((label, idx) => {
    const monthStr = String(idx + 1).padStart(2, '0')
    const cy = thisYear.find((m) => m.month.endsWith(`-${monthStr}`))
    const py = lastYear.find((m) => m.month.endsWith(`-${monthStr}`))
    return {
      label,
      [`${currentYear}`]: cy?.workoutCount ?? 0,
      [`${prevYear}`]: py?.workoutCount ?? 0,
      [`dist_${currentYear}`]: cy ? +cy.totalDistanceKm.toFixed(1) : 0,
      [`dist_${prevYear}`]: py ? +py.totalDistanceKm.toFixed(1) : 0,
      [`cal_${currentYear}`]: cy ? Math.round(cy.totalCalories) : 0,
      [`cal_${prevYear}`]: py ? Math.round(py.totalCalories) : 0,
    }
  })

  // Running pace trend (this year only, months with runs)
  const paceTrend = thisYear
    .filter((m) => m.avgPaceSecsPerKm && m.runCount > 0)
    .map((m) => ({
      label: m.shortLabel,
      pace: +(m.avgPaceSecsPerKm! / 60).toFixed(2),   // min/km as float for the chart
      paceLabel: fmtPace(m.avgPaceSecsPerKm!),
      runs: m.runCount,
    }))

  // Summary stats
  const cyTotals = thisYear.reduce(
    (acc, m) => ({
      workouts: acc.workouts + m.workoutCount,
      distKm: acc.distKm + m.totalDistanceKm,
      durationMin: acc.durationMin + m.totalDurationMin,
      calories: acc.calories + m.totalCalories,
    }),
    { workouts: 0, distKm: 0, durationMin: 0, calories: 0 }
  )

  const pyTotals = lastYear.reduce(
    (acc, m) => ({
      workouts: acc.workouts + m.workoutCount,
      distKm: acc.distKm + m.totalDistanceKm,
      durationMin: acc.durationMin + m.totalDurationMin,
      calories: acc.calories + m.totalCalories,
    }),
    { workouts: 0, distKm: 0, durationMin: 0, calories: 0 }
  )

  const bestMonthByCount = [...thisYear].sort((a, b) => b.workoutCount - a.workoutCount)[0]
  const bestMonthByDist = [...thisYear].sort((a, b) => b.totalDistanceKm - a.totalDistanceKm)[0]

  function pct(a: number, b: number) {
    if (b === 0) return null
    return Math.round(((a - b) / b) * 100)
  }

  const countChange = pct(cyTotals.workouts, pyTotals.workouts)
  const distChange  = pct(cyTotals.distKm, pyTotals.distKm)

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">🏋️</span>
        <h2 className="text-lg font-semibold text-text-primary">No workout data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your Apple Health workouts to see your yearly training progress.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Year-over-year summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: `${currentYear} Workouts`,
            value: cyTotals.workouts.toString(),
            delta: countChange,
            color: 'text-orange-400',
          },
          {
            label: `${currentYear} Distance`,
            value: `${cyTotals.distKm.toFixed(0)} km`,
            delta: distChange,
            color: 'text-blue-400',
          },
          {
            label: `${currentYear} Active Time`,
            value: fmtDur(cyTotals.durationMin),
            delta: null,
            color: 'text-green-400',
          },
          {
            label: `${currentYear} Calories`,
            value: `${Math.round(cyTotals.calories).toLocaleString()} kcal`,
            delta: null,
            color: 'text-red-400',
          },
        ].map(({ label, value, delta, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary font-medium mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            {delta !== null && (
              <p className={`text-xs font-medium mt-1 ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {delta >= 0 ? '+' : ''}{delta}% vs {prevYear}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Workout count comparison */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">
          Workouts per Month — {currentYear} vs {prevYear}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey={`${prevYear}`} fill="#6366f140" radius={[3, 3, 0, 0]} />
            <Bar dataKey={`${currentYear}`} fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distance comparison */}
      {cyTotals.distKm > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">
            Distance per Month (km) — {currentYear} vs {prevYear}
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={comparisonData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} km`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey={`dist_${prevYear}`} name={`${prevYear}`} fill="#3b82f640" radius={[3, 3, 0, 0]} />
              <Bar dataKey={`dist_${currentYear}`} name={`${currentYear}`} fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Running pace trend */}
      {paceTrend.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary mb-1">
            Average Running Pace {currentYear}
          </h2>
          <p className="text-xs text-text-secondary opacity-60 mb-4">
            Lower is faster · based on {thisYear.reduce((s, m) => s + m.runCount, 0)} runs
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={paceTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                reversed
                tickFormatter={(v: number) => {
                  const m = Math.floor(v)
                  const s = Math.round((v - m) * 60)
                  return `${m}:${s.toString().padStart(2, '0')}`
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(_: unknown, __: unknown, props: { payload?: { paceLabel?: string } }) => [props.payload?.paceLabel ?? '', 'Avg Pace']}
              />
              <Line
                type="monotone"
                dataKey="pace"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-3">
        {bestMonthByCount && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary font-medium mb-1">Most Active Month</p>
            <p className="text-lg font-bold text-orange-400">{bestMonthByCount.label}</p>
            <p className="text-sm text-text-secondary">{bestMonthByCount.workoutCount} workouts</p>
          </div>
        )}
        {bestMonthByDist && bestMonthByDist.totalDistanceKm > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary font-medium mb-1">Highest Distance Month</p>
            <p className="text-lg font-bold text-blue-400">{bestMonthByDist.label}</p>
            <p className="text-sm text-text-secondary">{bestMonthByDist.totalDistanceKm.toFixed(1)} km</p>
          </div>
        )}
      </div>

      {/* Year comparison note */}
      {pyTotals.workouts > 0 && (
        <p className="text-xs text-text-secondary text-center opacity-50 pb-2">
          Comparing {currentYear} vs {prevYear} · {cyTotals.workouts} vs {pyTotals.workouts} total workouts
        </p>
      )}
    </div>
  )
}
