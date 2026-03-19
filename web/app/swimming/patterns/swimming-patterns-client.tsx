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

export interface SwimmingStats {
  totalSwims: number
  totalMeters: number
  avgMetersPerSwim: number
  avgDurationMins: number
  avgPerWeek: number
  avgPace100Str: string | null
  bestPace100Str: string | null
  longestSwimMeters: number
  busiestDay: string
  preferredTime: string
}

export interface DowSwimmingStat {
  label: string
  swims: number
  meters: number
}

export interface MonthlySwimmingStat {
  label: string
  key: string
  swims: number
  meters: number
  mins: number
  cals: number
  avgPace100Secs: number | null
  avgPace100Str: string | null
}

export interface WeeklySwimmingStat {
  label: string
  meters: number
  swims: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function SwimmingPatternsClient({
  stats,
  dowData,
  monthlyData,
  weeklyData,
  timeTotals,
}: {
  stats: SwimmingStats
  dowData: DowSwimmingStat[]
  monthlyData: MonthlySwimmingStat[]
  weeklyData: WeeklySwimmingStat[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.swims), 1)
  const avgWeeklyMeters = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + w.meters, 0) / weeklyData.length)
    : 0
  const peakWeekMeters = Math.max(...weeklyData.map((w) => w.meters), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)

  const paceMonths = monthlyData.filter((m) => m.avgPace100Secs != null)
  const bestMonthPace = paceMonths.length > 0 ? Math.min(...paceMonths.map((m) => m.avgPace100Secs!)) : null
  const worstMonthPace = paceMonths.length > 0 ? Math.max(...paceMonths.map((m) => m.avgPace100Secs!)) : null

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{stats.totalSwims}</p>
          <p className="text-xs text-text-secondary mt-0.5">Swims (1yr)</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">{(stats.totalMeters / 1000).toFixed(1)} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgMetersPerSwim}m avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-sky-400">{stats.avgPace100Str ?? '—'}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Pace /100m</p>
          {stats.bestPace100Str && <p className="text-xs text-cyan-400 opacity-70">Best: {stats.bestPace100Str}</p>}
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-blue-400">{stats.longestSwimMeters}m</p>
          <p className="text-xs text-text-secondary mt-0.5">Longest Swim</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgDurationMins} min avg</p>
        </div>
      </div>

      {/* DOW distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Distribution</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you swim most</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number, name: string) => [
                name === 'swims' ? `${val} swims` : `${val} m`,
                name === 'swims' ? 'Swims' : 'Total meters',
              ]}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="swims" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell key={i} fill={d.swims === maxDow ? '#06b6d4' : 'rgba(6,182,212,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Favorite day: <span className="text-cyan-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.swims === 0).length > 0 && (
            <span>Rest days: <span className="font-medium">{dowData.filter((d) => d.swims === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you prefer to swim</p>
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
          You mostly swim in the <span className="font-medium">{stats.preferredTime}</span>.
        </p>
      </div>

      {/* Monthly distance */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Meters logged per month</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number, name: string) => [
                  name === 'meters' ? `${val} m` : `${val} swims`,
                  name === 'meters' ? 'Distance' : 'Swims',
                ]}
              />
              <Bar dataKey="meters" name="meters" fill="rgba(6,182,212,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span>Avg week: <span className="text-teal-400 font-medium">{avgWeeklyMeters} m</span></span>
            <span>Peak week: <span className="font-medium">{peakWeekMeters} m</span></span>
          </div>
        </div>
      )}

      {/* Monthly pace trend (100m) */}
      {paceMonths.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Avg Pace</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Lower = faster · min:ss per 100m</p>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={bestMonthPace && worstMonthPace ? [bestMonthPace - 5, worstMonthPace + 5] : ['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(v) => {
                  const m = Math.floor(v / 60)
                  const s = Math.round(v % 60)
                  return `${m}:${String(s).padStart(2, '0')}`
                }}
                reversed
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => {
                  const m = Math.floor(val / 60)
                  const s = Math.round(val % 60)
                  return [`${m}:${String(s).padStart(2, '0')} /100m`, 'Avg Pace']
                }}
              />
              <Line type="monotone" dataKey="avgPace100Secs" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          {bestMonthPace && (
            <p className="text-xs text-text-secondary mt-2 opacity-60">
              Best month: <span className="text-cyan-400 font-medium">{paceMonths.find(m => m.avgPace100Secs === bestMonthPace)?.avgPace100Str} /100m</span> · Trend: {paceMonths[paceMonths.length - 1].avgPace100Secs! < paceMonths[0].avgPace100Secs! ? '📉 getting faster' : '📈 slowing over time'}
            </p>
          )}
        </div>
      )}

      {/* Weekly volume */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Meters per week · last 16 weeks</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={1} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                formatter={(val: number) => [`${val} m`, 'Distance']}
                contentStyle={tooltipStyle}
              />
              {avgWeeklyMeters > 0 && (
                <ReferenceLine y={avgWeeklyMeters} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3"
                  label={{ value: `avg ${avgWeeklyMeters}m`, fill: 'rgba(255,255,255,0.4)', fontSize: 9, position: 'insideTopRight' }} />
              )}
              <Bar dataKey="meters" radius={[3, 3, 0, 0]}>
                {weeklyData.map((w, i) => (
                  <Cell key={i} fill={w.meters >= peakWeekMeters * 0.85 ? '#06b6d4' : 'rgba(6,182,212,0.4)'} />
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
                  <p className="text-sm font-medium text-cyan-400">{m.meters.toLocaleString()} m</p>
                  <p className="text-xs text-text-secondary opacity-60">{m.swims} swims · {Math.round(m.mins / 60)}h {m.mins % 60}m</p>
                </div>
                <div className="text-right">
                  {m.avgPace100Str && (
                    <p className="text-xs text-teal-400 font-medium">{m.avgPace100Str} /100m</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Swimming Training Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-cyan-400 font-medium">Volume</span> · 2,000–4,000m per session is solid aerobic training for most swimmers</p>
          <p><span className="text-teal-400 font-medium">Frequency</span> · 3–5 sessions/week builds technique and fitness simultaneously</p>
          <p><span className="text-sky-400 font-medium">Pace development</span> · Interval training (e.g. 10×100m with rest) improves pace faster than steady laps</p>
          <p><span className="text-blue-400 font-medium">Recovery</span> · Swimming is low-impact; back-to-back days are fine at moderate intensity</p>
        </div>
      </div>
    </div>
  )
}
