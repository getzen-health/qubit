'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { HikingProgressionData } from './page'

interface Props {
  data: HikingProgressionData
}

function fmt1(n: number) { return n.toFixed(1) }
function fmt0(n: number) { return Math.round(n).toLocaleString() }

function firstLastMsg(data: HikingProgressionData): string {
  const distDiff = data.lastAvgKm - data.firstAvgKm
  const elevDiff = data.lastAvgElev - data.firstAvgElev
  if (distDiff > 0.5 && elevDiff > 50) return 'Hikes are longer and climbing more — great progression.'
  if (distDiff > 0.5) return 'Covering more distance per hike — endurance is building.'
  if (elevDiff > 100) return 'Taking on more elevation — strength is improving.'
  if (distDiff < -0.5) return 'Shorter hikes recently — consider building back up.'
  return 'Consistent hiking pattern over the year.'
}

export function HikingProgressionClient({ data }: Props) {
  const {
    totalSessions, totalKm, totalElevationM, avgDistKm, longestKm, highestClimbM,
    firstCount, firstAvgKm, firstAvgElev, lastCount, lastAvgKm, lastAvgElev,
    monthStats, sessions, quarterRows, distSlope, elevSlope, hasElevation,
  } = data

  // Trend line points for distance scatter
  const distXs = sessions.map((s) => new Date(s.date).getTime())
  const distMx = distXs.reduce((a, b) => a + b, 0) / distXs.length
  const distMy = sessions.reduce((a, s) => a + s.distKm, 0) / sessions.length
  const distIntercept = distMy - distSlope * (distMx / 1e6)

  const distTrend =
    sessions.length >= 2
      ? [
          { date: sessions[0].date, trend: distSlope * (new Date(sessions[0].date).getTime() / 1e6) + distIntercept },
          { date: sessions[sessions.length - 1].date, trend: distSlope * (new Date(sessions[sessions.length - 1].date).getTime() / 1e6) + distIntercept },
        ]
      : []

  // Elev trend
  const elevSessions = sessions.filter((s) => s.elevationM > 0)
  let elevTrend: { date: string; trend: number }[] = []
  if (elevSessions.length >= 2) {
    const elevXs = elevSessions.map((s) => new Date(s.date).getTime() / 1e6)
    const elevMx = elevXs.reduce((a, b) => a + b, 0) / elevXs.length
    const elevMy = elevSessions.reduce((a, s) => a + s.elevationM, 0) / elevSessions.length
    const elevIntercept = elevMy - elevSlope * elevMx
    elevTrend = [
      { date: elevSessions[0].date, trend: elevSlope * (new Date(elevSessions[0].date).getTime() / 1e6) + elevIntercept },
      { date: elevSessions[elevSessions.length - 1].date, trend: elevSlope * (new Date(elevSessions[elevSessions.length - 1].date).getTime() / 1e6) + elevIntercept },
    ]
  }

  const distTrendLabel =
    distSlope > 0.00005 ? 'Distance per hike is trending up.' :
    distSlope < -0.00005 ? 'Distance per hike is trending down.' :
    'Distance per hike is stable.'

  const elevTrendLabel =
    elevSlope > 0.001 ? 'Taking on more elevation over time — great strength gains.' :
    elevSlope < -0.001 ? 'Elevation per hike is declining — try more challenging terrain.' :
    'Elevation per hike is consistent.'

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hikes', value: totalSessions.toString(), icon: '🥾' },
          { label: 'Total km', value: fmt0(totalKm), icon: '🗺️' },
          { label: 'Total Climb', value: `${fmt0(totalElevationM)} m`, icon: '⛰️' },
          { label: 'Avg Distance', value: `${fmt1(avgDistKm)} km`, icon: '↔️' },
          { label: 'Longest Hike', value: `${fmt1(longestKm)} km`, icon: '🏆' },
          { label: 'Best Climb', value: `${fmt0(highestClimbM)} m`, icon: '⬆️' },
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
            <p className="text-2xl font-bold text-teal-500 tabular-nums">{firstCount} hikes</p>
            <p className="text-sm text-text-secondary">{fmt1(firstAvgKm)} km avg</p>
            {hasElevation && <p className="text-sm text-text-secondary">{fmt0(firstAvgElev)} m climb avg</p>}
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-secondary">
            <p className="text-xs text-text-secondary mb-1">Last 30 Days</p>
            <p className="text-2xl font-bold text-green-500 tabular-nums">{lastCount} hikes</p>
            <p className="text-sm text-text-secondary">{fmt1(lastAvgKm)} km avg</p>
            {hasElevation && <p className="text-sm text-text-secondary">{fmt0(lastAvgElev)} m climb avg</p>}
          </div>
        </div>
        <p className="text-xs text-text-secondary">{firstLastMsg(data)}</p>
      </div>

      {/* Monthly distance bar */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-4">Monthly Distance (km)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthStats} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => [`${fmt1(v)} km`, 'Distance']} />
            <Bar dataKey="totalKm" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session distance scatter + trend */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-1">Distance per Hike</h2>
        <p className="text-xs text-text-secondary mb-4">{distTrendLabel}</p>
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
            <YAxis dataKey="distKm" tick={{ fontSize: 10 }} unit=" km" />
            <Tooltip formatter={(v: number) => [`${fmt1(v)} km`, 'Distance']} />
            <Scatter data={sessions} fill="#4ade80" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
        {distTrend.length === 2 && (
          <ResponsiveContainer width="100%" height={4}>
            <LineChart data={distTrend}>
              <Line dataKey="trend" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Session elevation scatter + trend */}
      {hasElevation && elevSessions.length >= 3 && (
        <div className="bg-surface-primary rounded-xl p-4 border border-border">
          <h2 className="font-semibold text-text-primary mb-1">Elevation Gain per Hike</h2>
          <p className="text-xs text-text-secondary mb-4">{elevTrendLabel}</p>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                type="category"
                tick={{ fontSize: 9 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                interval={Math.floor(elevSessions.length / 5)}
              />
              <YAxis dataKey="elevationM" tick={{ fontSize: 10 }} unit=" m" />
              <Tooltip formatter={(v: number) => [`${fmt0(v)} m`, 'Elevation']} />
              <Scatter data={elevSessions} fill="#0d9488" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quarterly table */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Quarterly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left pb-2">Quarter</th>
                <th className="text-right pb-2">Hikes</th>
                <th className="text-right pb-2">Total km</th>
                <th className="text-right pb-2">Avg km</th>
                {hasElevation && <th className="text-right pb-2">Climb (m)</th>}
              </tr>
            </thead>
            <tbody>
              {quarterRows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 1 ? 'bg-surface-secondary' : ''}>
                  <td className="py-2 text-text-primary">{row.label}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{row.sessions}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{fmt1(row.totalKm)}</td>
                  <td className="py-2 text-right tabular-nums text-text-primary">{fmt1(row.avgKm)}</td>
                  {hasElevation && <td className="py-2 text-right tabular-nums text-text-primary">{fmt0(row.totalElevationM)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">🥾 Hiking Tips</h3>
        <p className="text-sm text-text-secondary">
          Aim for at least 2–3 hikes per month for steady cardiovascular and strength benefits.
          Progressively increasing elevation gain builds leg strength and aerobic capacity.
          Longer hikes on weekends complement shorter mid-week activity.
          Elevation accumulation over a season is a great fitness marker.
        </p>
      </div>
    </div>
  )
}
