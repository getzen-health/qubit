'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { Zone2Data, WeekBucket } from './page'

interface Props {
  data: Zone2Data
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmt1(n: number) {
  return n.toFixed(1)
}

function fmt0(n: number) {
  return Math.round(n).toString()
}

// Custom tooltip for stacked Z2 bar chart
function Z2Tooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, p) => a + (p.value || 0), 0)
  return (
    <div className="bg-surface-primary border border-border rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .reverse()
        .map((p) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.fill }}>{p.name}</span>
            <span className="text-text-secondary tabular-nums">{fmt0(p.value)} min</span>
          </div>
        ))}
      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-border">
        <span className="text-text-secondary font-medium">Total Z2</span>
        <span className="font-bold tabular-nums">{fmt0(total)} min</span>
      </div>
    </div>
  )
}

export function Zone2Client({ data }: Props) {
  const {
    weeks,
    totalZ2Hours,
    avgZ2HoursPerActiveWeek,
    peakZ2WeekMins,
    peakZ2WeekLabel,
    currentWeekZ2Mins,
    activeSports,
    sports,
    sportColors,
  } = data

  const tickInterval = Math.floor(weeks.length / 12)

  // Total Z2 minutes across all active sports for percentage calc
  const totalZ2Mins = activeSports.reduce((a, s) => a + s.totalMins, 0)

  // Last 8 weeks (most recent first)
  const last8Weeks = [...weeks].slice(-8).reverse()

  // Z2 target: 180 min/week (3 hours)
  const Z2_TARGET_MINS = 180
  const currentWeekProgress = Math.min(100, (currentWeekZ2Mins / Z2_TARGET_MINS) * 100)

  const hasData = weeks.some((w) => w.z2Mins > 0)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <span className="text-3xl text-green-400">Z2</span>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">No Zone 2 data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync workouts from your iPhone. Zone 2 is detected from average heart rate in the 60–70%
          max HR range (114–133 bpm at 190 bpm max HR).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tabular-nums">{fmt1(totalZ2Hours)}h</div>
          <div className="text-xs text-text-secondary mt-0.5">Total Z2</div>
        </div>

        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tabular-nums">
            {fmt1(avgZ2HoursPerActiveWeek)}h
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Avg/week</div>
        </div>

        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-text-primary tabular-nums">
            {fmt0(peakZ2WeekMins / 60)}h
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Peak week ({peakZ2WeekLabel})</div>
        </div>
      </div>

      {/* Zone 2 explanation card */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-green-400 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <h2 className="font-semibold text-green-400">What is Zone 2?</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Zone 2 is 60–70% of your maximum heart rate (~114–133 bpm for a 190 bpm max). Training in
          this zone builds mitochondrial density, fat oxidation efficiency, and aerobic base. Most
          endurance coaches recommend 3–4 hours/week of Zone 2 for recreational athletes.
        </p>

        {/* Current week progress */}
        <div className="space-y-1.5 pt-1">
          {currentWeekZ2Mins >= Z2_TARGET_MINS ? (
            <p className="text-sm font-medium text-green-400">
              You&apos;ve hit your Zone 2 target this week (3+ hours)!
            </p>
          ) : (
            <>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>This week: {fmt0(currentWeekZ2Mins)} min</span>
                <span>{Z2_TARGET_MINS} min target (3h)</span>
              </div>
              <div className="h-2 rounded-full bg-green-500/10 border border-green-500/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${currentWeekProgress}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly Zone 2 Volume stacked bar chart */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-4">Weekly Zone 2 Volume (minutes)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeks} margin={{ left: -20, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 9 }}
              interval={tickInterval}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<Z2Tooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              y={180}
              stroke="#22c55e"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{ value: '3h target', position: 'insideTopRight', fontSize: 10, fill: '#22c55e' }}
            />
            {sports.map((sport) => (
              <Bar
                key={sport}
                dataKey={sport}
                stackId="z2"
                fill={sportColors[sport]}
                name={sport}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sport mix breakdown */}
      {activeSports.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-4 border border-border">
          <h2 className="font-semibold text-text-primary mb-3">Zone 2 by Sport</h2>
          <div className="space-y-2">
            {activeSports.map((s) => {
              const pct = totalZ2Mins > 0 ? (s.totalMins / totalZ2Mins) * 100 : 0
              return (
                <div key={s.sport} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-text-secondary">{s.sport}</div>
                  <div className="flex-1 h-5 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm tabular-nums text-text-primary">
                    {fmt1(s.totalMins / 60)}h ({fmt0(pct)}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Last 8 weeks table */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Last 8 Weeks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left pb-2 font-medium">Week</th>
                <th className="text-right pb-2 font-medium">Z2 Minutes</th>
                <th className="text-right pb-2 font-medium">Z2 Hours</th>
                <th className="text-right pb-2 font-medium">vs Target</th>
              </tr>
            </thead>
            <tbody>
              {last8Weeks.map((w, i) => {
                const mins = w.z2Mins
                const pct = Math.round((mins / Z2_TARGET_MINS) * 100)
                let statusColor = 'text-red-400'
                let statusLabel = `${pct}%`
                if (mins >= Z2_TARGET_MINS) {
                  statusColor = 'text-green-400'
                  statusLabel = `${pct}%`
                } else if (mins >= 90) {
                  statusColor = 'text-yellow-400'
                }
                return (
                  <tr key={w.weekStart} className={i % 2 === 0 ? '' : 'bg-surface-secondary/50'}>
                    <td className="py-2 text-text-secondary text-xs">{w.weekLabel}</td>
                    <td className={`py-2 text-right tabular-nums text-xs font-medium ${mins > 0 ? (mins >= Z2_TARGET_MINS ? 'text-green-400' : mins >= 90 ? 'text-yellow-400' : 'text-red-400') : 'text-text-secondary'}`}>
                      {mins > 0 ? fmt0(mins) : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs text-text-primary">
                      {mins > 0 ? `${fmt1(mins / 60)}h` : '—'}
                    </td>
                    <td className={`py-2 text-right tabular-nums text-xs font-medium ${mins > 0 ? statusColor : 'text-text-secondary'}`}>
                      {mins > 0 ? statusLabel : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Science card */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-green-400">Zone 2 Benefits</h2>
        <ul className="space-y-1.5 text-sm text-text-secondary">
          {[
            'Increases mitochondrial density',
            'Improves fat oxidation for sustained energy',
            'Enhances aerobic capacity without excess stress',
            'Promotes faster recovery between hard sessions',
            'Lowers resting heart rate and improves HRV over time',
          ].map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5 shrink-0">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
