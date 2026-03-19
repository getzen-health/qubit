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

export interface HikingStats {
  totalHikes: number
  totalKm: number
  avgKmPerHike: number
  avgDurationMins: number
  avgPerWeek: number
  totalElevation: number
  longestHikeKm: number
  highestClimbM: number
  busiestDay: string
  preferredTime: string
}

export interface DowHikingStat {
  label: string
  hikes: number
  km: number
}

export interface MonthlyHikingStat {
  label: string
  key: string
  hikes: number
  km: number
  mins: number
  elevation: number
  cals: number
}

export interface WeeklyHikingStat {
  label: string
  km: number
  hikes: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function HikingPatternsClient({
  stats,
  dowData,
  monthlyData,
  weeklyData,
  timeTotals,
}: {
  stats: HikingStats
  dowData: DowHikingStat[]
  monthlyData: MonthlyHikingStat[]
  weeklyData: WeeklyHikingStat[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.hikes), 1)
  const avgWeeklyKm = weeklyData.length > 0
    ? +(weeklyData.reduce((s, w) => s + w.km, 0) / weeklyData.length).toFixed(1)
    : 0
  const peakWeekKm = Math.max(...weeklyData.map((w) => w.km), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)

  const totalMonthElevation = monthlyData.reduce((s, m) => s + m.elevation, 0)

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-lime-400">{stats.totalHikes}</p>
          <p className="text-xs text-text-secondary mt-0.5">Hikes (1yr)</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.totalKm}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total km</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgKmPerHike} km avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-emerald-400">{stats.totalElevation.toLocaleString()} m</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Elevation ↑</p>
          <p className="text-xs text-text-secondary opacity-50">Best: {stats.highestClimbM}m</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-teal-400">{stats.longestHikeKm} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Longest Hike</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgDurationMins} min avg</p>
        </div>
      </div>

      {/* DOW */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Distribution</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you hike most</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number, name: string) => [
                name === 'hikes' ? `${val} hikes` : `${val} km`,
                name === 'hikes' ? 'Hikes' : 'Total km',
              ]}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="hikes" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell key={i} fill={d.hikes === maxDow ? '#84cc16' : 'rgba(132,204,22,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Favorite day: <span className="text-lime-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.hikes === 0).length > 0 && (
            <span>Untrailed: <span className="font-medium">{dowData.filter((d) => d.hikes === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you start your hikes</p>
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
          You mostly start in the <span className="font-medium">{stats.preferredTime}</span>.
        </p>
      </div>

      {/* Monthly distance */}
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
                  name === 'km' ? `${val} km` : `${val} hikes`,
                  name === 'km' ? 'Distance' : 'Hikes',
                ]}
              />
              <Bar dataKey="km" name="km" fill="rgba(132,204,22,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span>Avg week: <span className="text-lime-400 font-medium">{avgWeeklyKm} km</span></span>
            <span>Peak week: <span className="font-medium">{peakWeekKm.toFixed(1)} km</span></span>
          </div>
        </div>
      )}

      {/* Monthly elevation */}
      {monthlyData.some((m) => m.elevation > 0) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Elevation Gain</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Total meters climbed per month</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [`${val.toLocaleString()} m`, 'Elevation ↑']}
              />
              <Bar dataKey="elevation" fill="rgba(52,211,153,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {totalMonthElevation > 0 && (
            <p className="text-xs text-text-secondary mt-2 opacity-60">
              Total this year: <span className="text-emerald-400 font-medium">{stats.totalElevation.toLocaleString()} m</span> gained
            </p>
          )}
        </div>
      )}

      {/* Weekly distance */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Kilometers per week · last 16 weeks</p>
          <ResponsiveContainer width="100%" height={150}>
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
                  <Cell key={i} fill={w.km >= peakWeekKm * 0.85 ? '#84cc16' : 'rgba(132,204,22,0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly table */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <p className="text-sm font-semibold text-text-primary p-4 pb-3">Monthly Breakdown</p>
          <div className="divide-y divide-border">
            {[...monthlyData].reverse().map((m) => (
              <div key={m.key} className="flex items-center px-4 py-3">
                <span className="text-sm text-text-secondary w-8">{m.label}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-lime-400">{m.km.toFixed(1)} km</p>
                  <p className="text-xs text-text-secondary opacity-60">{m.hikes} hikes · {Math.round(m.mins / 60)}h {m.mins % 60}m</p>
                </div>
                <div className="text-right">
                  {m.elevation > 0 && (
                    <p className="text-xs text-emerald-400 font-medium">{m.elevation.toLocaleString()} m ↑</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Hiking Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-lime-400 font-medium">Elevation</span> · Every 300m of gain adds roughly 1 hour of trail time at moderate pace</p>
          <p><span className="text-green-400 font-medium">Hydration</span> · Drink 500ml/hour at moderate effort, more in heat or at altitude</p>
          <p><span className="text-emerald-400 font-medium">Frequency</span> · 2–3 hikes/week improves leg strength, cardiovascular fitness, and mental health</p>
          <p><span className="text-teal-400 font-medium">Recovery</span> · Descents stress knees more than climbs; allow extra recovery after steep terrain</p>
        </div>
      </div>
    </div>
  )
}
