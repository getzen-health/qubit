'use client'

import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HiitProgressionData } from './page'

interface Props {
  data: HiitProgressionData
}

function fmt0(n: number) { return Math.round(n).toLocaleString() }
function fmt1(n: number) { return n.toFixed(1) }

function firstLastMsg(data: HiitProgressionData): string {
  const durDiff = data.lastAvgDuration - data.firstAvgDuration
  const calDiff = data.lastAvgCalories - data.firstAvgCalories
  if (data.lastCount > data.firstCount && calDiff > 20) return 'More frequent sessions with higher calorie burn — great HIIT progression.'
  if (durDiff > 3) return 'Sessions are getting longer — building aerobic capacity.'
  if (calDiff > 30) return 'Burning more calories per session — intensity is increasing.'
  if (data.lastCount < data.firstCount) return 'Fewer sessions recently — consider ramping up frequency.'
  return 'Consistent HIIT training over the year.'
}

export function HiitProgressionClient({ data }: Props) {
  const {
    totalSessions, totalMins, totalCalories, avgDurationMins, avgCaloriesPerSession, peakHR,
    firstCount, firstAvgDuration, firstAvgCalories, lastCount, lastAvgDuration, lastAvgCalories,
    monthStats, sessions, quarterRows, durationSlope,
  } = data

  const durationTrendLabel =
    durationSlope > 0.00003 ? 'Sessions are getting longer — building work capacity.' :
    durationSlope < -0.00003 ? 'Sessions are getting shorter — consider progressive overload.' :
    'Session duration is consistent.'

  // Trend line computation for duration scatter
  const xs = sessions.map((s) => new Date(s.date).getTime() / 1e6)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = sessions.reduce((a, s) => a + s.durationMins, 0) / sessions.length
  const intercept = my - durationSlope * mx

  const trendData =
    sessions.length >= 2
      ? [
          { date: sessions[0].date, trend: durationSlope * (new Date(sessions[0].date).getTime() / 1e6) + intercept },
          { date: sessions[sessions.length - 1].date, trend: durationSlope * (new Date(sessions[sessions.length - 1].date).getTime() / 1e6) + intercept },
        ]
      : []

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions', value: totalSessions.toString(), icon: '⚡' },
          { label: 'Total Mins', value: fmt0(totalMins), icon: '⏱️' },
          { label: 'Total kcal', value: fmt0(totalCalories), icon: '🔥' },
          { label: 'Avg Duration', value: `${fmt0(avgDurationMins)} min`, icon: '📋' },
          { label: 'Avg kcal', value: fmt0(avgCaloriesPerSession), icon: '💥' },
          { label: 'Peak HR', value: peakHR > 0 ? `${fmt0(peakHR)} bpm` : '—', icon: '❤️' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl p-4 text-center border border-border">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold text-text-primary tabular-nums">{s.value}</div>
            <div className="text-xs text-text-secondary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* First vs last */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border space-y-3">
        <h2 className="font-semibold text-text-primary">First vs Last 30 Days</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-surface-secondary">
            <p className="text-xs text-text-secondary mb-1">First 30 Days</p>
            <p className="text-2xl font-bold text-orange-500 tabular-nums">{firstCount} sessions</p>
            <p className="text-sm text-text-secondary">{fmt0(firstAvgDuration)} min avg</p>
            <p className="text-sm text-text-secondary">{fmt0(firstAvgCalories)} kcal avg</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-secondary">
            <p className="text-xs text-text-secondary mb-1">Last 30 Days</p>
            <p className="text-2xl font-bold text-pink-500 tabular-nums">{lastCount} sessions</p>
            <p className="text-sm text-text-secondary">{fmt0(lastAvgDuration)} min avg</p>
            <p className="text-sm text-text-secondary">{fmt0(lastAvgCalories)} kcal avg</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary">{firstLastMsg(data)}</p>
      </div>

      {/* Monthly sessions bar */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-4">Monthly Sessions</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthStats} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip formatter={(v: number) => [v, 'Sessions']} />
            <Bar dataKey="sessions" fill="#f43f5e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session duration scatter */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-1">Session Duration</h2>
        <p className="text-xs text-text-secondary mb-4">{durationTrendLabel}</p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              type="category"
              tick={{ fontSize: 9 }}
              tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              interval={Math.floor(sessions.length / 5)}
            />
            <YAxis dataKey="durationMins" tick={{ fontSize: 10 }} unit=" min" />
            <Tooltip formatter={(v: number) => [`${fmt0(v)} min`, 'Duration']} />
            <Scatter data={sessions} fill="#fb7185" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly calories bar */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-4">Monthly Calorie Burn (kcal)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthStats} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [`${fmt0(v)} kcal`, 'Calories']} />
            <Bar dataKey="totalCalories" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly table */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Quarterly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left pb-2">Quarter</th>
                <th className="text-right pb-2">Sessions</th>
                <th className="text-right pb-2">Total min</th>
                <th className="text-right pb-2">Avg min</th>
                <th className="text-right pb-2">Avg kcal</th>
              </tr>
            </thead>
            <tbody>
              {quarterRows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 1 ? 'bg-surface-secondary' : ''}>
                  <td className="py-2 text-text-primary">{row.label}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{row.sessions}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{fmt0(row.totalMins)}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{fmt0(row.avgDurationMins)}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{fmt0(row.avgCalories)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
        <h3 className="font-semibold text-pink-600 dark:text-pink-400 mb-2">⚡ HIIT Guidelines</h3>
        <p className="text-sm text-text-secondary">
          Limit HIIT to 2–3 sessions per week to allow adequate recovery. Track your peak heart
          rate to ensure you're reaching 85–95% of max HR for true high-intensity effort. Sessions
          of 20–45 minutes are optimal — HIIT should be hard but efficient. Monitor HRV the
          morning after to gauge recovery quality.
        </p>
      </div>
    </div>
  )
}
