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
  ReferenceLine,
  Cell,
} from 'recharts'

export interface CyclingStats {
  totalRides: number
  totalKm: number
  avgKmPerRide: number
  avgDurationMins: number
  avgPerWeek: number
  avgSpeedKph: number | null
  bestSpeedKph: number | null
  longestRideKm: number
  totalElevation: number
  busiestDay: string
  preferredTime: string
}

export interface DowCyclingStat {
  label: string
  rides: number
  km: number
}

export interface MonthlyCyclingStat {
  label: string
  key: string
  rides: number
  km: number
  mins: number
  elevation: number
  cals: number
  avgSpeed: number | null
}

export interface WeeklyCyclingStat {
  label: string
  km: number
  rides: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function CyclingPatternsClient({
  stats,
  dowData,
  monthlyData,
  weeklyData,
  timeTotals,
}: {
  stats: CyclingStats
  dowData: DowCyclingStat[]
  monthlyData: MonthlyCyclingStat[]
  weeklyData: WeeklyCyclingStat[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.rides), 1)
  const avgWeeklyKm = weeklyData.length > 0
    ? +(weeklyData.reduce((s, w) => s + w.km, 0) / weeklyData.length).toFixed(1)
    : 0
  const peakWeekKm = Math.max(...weeklyData.map((w) => w.km), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)

  const speedMonths = monthlyData.filter((m) => m.avgSpeed != null)
  const bestMonthSpeed = speedMonths.length > 0 ? Math.max(...speedMonths.map((m) => m.avgSpeed!)) : null

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.totalRides}</p>
          <p className="text-xs text-text-secondary mt-0.5">Rides (1yr)</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-sky-400">{stats.totalKm}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total km</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgKmPerRide} km avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-indigo-400">{stats.avgSpeedKph ?? '—'} km/h</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Speed</p>
          {stats.bestSpeedKph && <p className="text-xs text-blue-400 opacity-70">Best: {stats.bestSpeedKph} km/h</p>}
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-violet-400">{stats.totalElevation.toLocaleString()} m</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Elevation</p>
          <p className="text-xs text-text-secondary opacity-50">Longest: {stats.longestRideKm} km</p>
        </div>
      </div>

      {/* DOW distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Distribution</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you ride most</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number, name: string) => [
                name === 'rides' ? `${val} rides` : `${val} km`,
                name === 'rides' ? 'Rides' : 'Total km',
              ]}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="rides" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell key={i} fill={d.rides === maxDow ? '#3b82f6' : 'rgba(59,130,246,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Favorite day: <span className="text-blue-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.rides === 0).length > 0 && (
            <span>Rest days: <span className="font-medium">{dowData.filter((d) => d.rides === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you prefer to ride</p>
        <div className="space-y-3">
          {[
            { label: '🌅 Morning (5–11am)', val: timeTotals.morning, color: '#fbbf24' },
            { label: '☀️ Afternoon (12–5pm)', val: timeTotals.afternoon, color: '#f97316' },
            { label: '🌙 Evening (6–10pm)', val: timeTotals.evening, color: '#818cf8' },
          ].map(({ label, val, color }) => {
            const pct = val / totalTimeSession * 100
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-40 flex-none">{label}</span>
                <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color + '99' }} />
                </div>
                <span className="text-xs text-text-secondary w-8 text-right">{val}</span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-text-secondary mt-3 opacity-60">
          You mostly ride in the <span className="font-medium">{stats.preferredTime}</span>.
        </p>
      </div>

      {/* Monthly distance chart */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Kilometers logged per month</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number, name: string) => [
                  name === 'km' ? `${val} km` : `${val} rides`,
                  name === 'km' ? 'Distance' : 'Rides',
                ]}
              />
              <Bar dataKey="km" name="km" fill="rgba(59,130,246,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span>Avg week: <span className="text-sky-400 font-medium">{avgWeeklyKm} km</span></span>
            <span>Peak week: <span className="font-medium">{peakWeekKm.toFixed(1)} km</span></span>
          </div>
        </div>
      )}

      {/* Monthly speed trend */}
      {speedMonths.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Avg Speed</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">km/h · higher = faster</p>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(v) => `${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [`${val} km/h`, 'Avg Speed']}
              />
              <Line type="monotone" dataKey="avgSpeed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          {bestMonthSpeed && (
            <p className="text-xs text-text-secondary mt-2 opacity-60">
              Best month: <span className="text-blue-400 font-medium">{speedMonths.find(m => m.avgSpeed === bestMonthSpeed)?.avgSpeed} km/h</span> · Trend: {speedMonths[speedMonths.length - 1].avgSpeed! > speedMonths[0].avgSpeed! ? '📈 getting faster' : '📉 slowing over time'}
            </p>
          )}
        </div>
      )}

      {/* Weekly volume */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Kilometers per week · last 16 weeks</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val} km`, 'Distance']}
                contentStyle={tooltipStyle}
              />
              {avgWeeklyKm > 0 && (
                <ReferenceLine y={avgWeeklyKm} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3"
                  label={{ value: `avg ${avgWeeklyKm}km`, fill: 'rgba(255,255,255,0.4)', fontSize: 9, position: 'insideTopRight' }} />
              )}
              <Bar dataKey="km" radius={[3, 3, 0, 0]}>
                {weeklyData.map((w, i) => (
                  <Cell key={i} fill={w.km >= peakWeekKm * 0.85 ? '#3b82f6' : 'rgba(59,130,246,0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly summary table */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <p className="text-sm font-semibold text-text-primary p-4 pb-3">Monthly Breakdown</p>
          <div className="divide-y divide-border">
            {[...monthlyData].reverse().map((m) => (
              <div key={m.key} className="flex items-center px-4 py-3">
                <span className="text-sm text-text-secondary w-8">{m.label}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-400">{m.km.toFixed(1)} km</p>
                  <p className="text-xs text-text-secondary opacity-60">{m.rides} rides · {Math.round(m.mins / 60)}h {m.mins % 60}m total</p>
                </div>
                <div className="text-right">
                  {m.avgSpeed && (
                    <p className="text-xs text-sky-400 font-medium">{m.avgSpeed} km/h</p>
                  )}
                  {m.elevation > 0 && (
                    <p className="text-xs text-text-secondary opacity-60">{m.elevation.toLocaleString()} m ↑</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Cycling Training Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-blue-400 font-medium">Volume</span> · 150–300 min/week of moderate cycling for cardiovascular health</p>
          <p><span className="text-sky-400 font-medium">Zone 2</span> · 80% of rides at conversational pace builds aerobic base most efficiently</p>
          <p><span className="text-indigo-400 font-medium">Consistency</span> · 3–4 rides/week beats longer occasional rides for adaptation</p>
          <p><span className="text-violet-400 font-medium">Speed gains</span> · Improve through longer sustained efforts, not just more miles</p>
        </div>
      </div>
    </div>
  )
}
