'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export interface CyclingProgressionData {
  totalRides: number
  totalKm: number
  totalElevM: number
  avgKmPerRide: number
  avgSpeedKph: number
  bestSpeedKph: number
  avgPerWeek: number
  speedTrend: number         // km/h gained (positive) or lost over year
  firstAvgSpeed: number
  lastAvgSpeed: number
  firstAvgDist: number
  lastAvgDist: number
  trendPoints: { date: string; distanceKm: number; speedKph: number; trend: number }[]
  months: {
    month: string; label: string; sessions: number; totalKm: number
    totalMins: number; totalElevM: number; avgSpeedKph: number; avgKmPerRide: number
  }[]
  quarters: {
    quarter: string; sessions: number; totalKm: number; totalElevM: number; avgSpeedKph: number
  }[]
}

export function CyclingProgressionClient({ data }: { data: CyclingProgressionData }) {
  const {
    totalRides, totalKm, totalElevM, avgKmPerRide, avgSpeedKph, bestSpeedKph,
    avgPerWeek, speedTrend, firstAvgSpeed, lastAvgSpeed, firstAvgDist, lastAvgDist,
    trendPoints, months, quarters,
  } = data

  const trendSign = speedTrend > 0 ? '+' : ''
  const trendColor = speedTrend > 0.3 ? 'text-emerald-400' : speedTrend < -0.3 ? 'text-red-400' : 'text-text-secondary'

  const hasElevation = totalElevM > 0

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Rides (1yr)</p>
          <p className="text-2xl font-bold text-blue-500">{totalRides}</p>
          <p className="text-xs text-text-secondary mt-1">{avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Total Distance</p>
          <p className="text-2xl font-bold text-sky-400">{totalKm.toLocaleString()} km</p>
          <p className="text-xs text-text-secondary mt-1">{avgKmPerRide} km avg/ride</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Avg Speed</p>
          <p className="text-2xl font-bold text-cyan-400">{avgSpeedKph} km/h</p>
          <p className="text-xs text-text-secondary mt-1">Best: {bestSpeedKph} km/h</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Speed Trend</p>
          <p className={`text-2xl font-bold ${trendColor}`}>{trendSign}{Math.abs(speedTrend).toFixed(1)} km/h</p>
          <p className="text-xs text-text-secondary mt-1">
            {speedTrend > 0.3 ? 'Getting faster ↑' : speedTrend < -0.3 ? 'Getting slower ↓' : 'Stable pace'}
          </p>
        </div>
      </div>

      {/* First vs last 30 days */}
      {firstAvgSpeed > 0 && lastAvgSpeed > 0 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-3">First vs. Last 30 Days</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-text-secondary mb-1">First 30 days</p>
              <p className="text-lg font-bold text-text-primary">{firstAvgSpeed} km/h</p>
              <p className="text-xs text-text-secondary">{firstAvgDist} km avg</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Last 30 days</p>
              <p className="text-lg font-bold text-text-primary">{lastAvgSpeed} km/h</p>
              <p className="text-xs text-text-secondary">{lastAvgDist} km avg</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary pt-2 border-t border-border">
            {lastAvgSpeed > firstAvgSpeed
              ? `${(lastAvgSpeed - firstAvgSpeed).toFixed(1)} km/h faster than a year ago — solid aerobic gains.`
              : lastAvgSpeed < firstAvgSpeed
              ? `${(firstAvgSpeed - lastAvgSpeed).toFixed(1)} km/h slower — check training load and recovery.`
              : 'Speed is consistent year-over-year.'}
          </p>
        </div>
      )}

      {/* Monthly distance */}
      {months.length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Distance</h2>
          <p className="text-xs text-text-secondary mb-4">Kilometers per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}km`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} km`, 'Distance']}
              />
              <Bar dataKey="totalKm" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session speed trend */}
      {trendPoints.length >= 4 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Speed Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Each ride · dashed = trend line</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendPoints} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.slice(5)} interval={Math.max(0, Math.floor(trendPoints.length / 6))} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [`${v} km/h`, name === 'trend' ? 'Trend' : 'Speed']}
              />
              <Line type="monotone" dataKey="speedKph" stroke="#3b82f6" dot={{ r: 2 }} strokeWidth={1.5} opacity={0.6} name="Speed" />
              <Line type="monotone" dataKey="trend" stroke="#fbbf24" dot={false} strokeWidth={2} strokeDasharray="6 3" name="Trend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly avg speed */}
      {months.filter((m) => m.avgSpeedKph > 0).length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Avg Speed</h2>
          <p className="text-xs text-text-secondary mb-4">Average km/h per month</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={months.filter((m) => m.avgSpeedKph > 0)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} km/h`, 'Avg Speed']}
              />
              <Line type="monotone" dataKey="avgSpeedKph" stroke="#06b6d4" dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly elevation */}
      {hasElevation && months.filter((m) => m.totalElevM > 0).length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Elevation</h2>
          <p className="text-xs text-text-secondary mb-4">Total meters climbed per month</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={months.filter((m) => m.totalElevM > 0)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} m`, 'Elevation']}
              />
              <Bar dataKey="totalElevM" fill="#14b8a6" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2">Total elevation: {totalElevM.toLocaleString()} m</p>
        </div>
      )}

      {/* Quarterly breakdown */}
      {quarters.length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border overflow-x-auto">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Quarterly Breakdown</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border">
                <th className="text-left pb-2 font-medium">Quarter</th>
                <th className="text-right pb-2 font-medium">Rides</th>
                <th className="text-right pb-2 font-medium">Distance</th>
                <th className="text-right pb-2 font-medium">Avg Speed</th>
                {hasElevation && <th className="text-right pb-2 font-medium">↑ Elevation</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quarters.map((q) => (
                <tr key={q.quarter} className="text-text-primary">
                  <td className="py-2 font-medium text-blue-400">{q.quarter}</td>
                  <td className="py-2 text-right">{q.sessions}</td>
                  <td className="py-2 text-right">{q.totalKm} km</td>
                  <td className="py-2 text-right">{q.avgSpeedKph} km/h</td>
                  {hasElevation && <td className="py-2 text-right">{q.totalElevM.toLocaleString()} m</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-surface-primary rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-semibold text-blue-400 mb-3">Cycling Training Principles</h2>
        <div className="space-y-3 text-xs text-text-secondary">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60 mt-1.5 shrink-0" />
            <div><span className="text-blue-400 font-medium">Base:</span> 80% of rides at Zone 2 (conversational). This builds aerobic engine and fat oxidation capacity.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/60 mt-1.5 shrink-0" />
            <div><span className="text-sky-400 font-medium">Volume:</span> Build weekly km by no more than 10%/week to avoid overuse injury.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 mt-1.5 shrink-0" />
            <div><span className="text-cyan-400 font-medium">Speed:</span> Average speed naturally improves 1–3 km/h per season with consistent Zone 2 base training.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/60 mt-1.5 shrink-0" />
            <div><span className="text-teal-400 font-medium">Recovery:</span> Include 1 easy spin day after each hard effort. Avoid back-to-back hard days.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
