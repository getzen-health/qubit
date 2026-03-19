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

export interface RowingStats {
  totalSessions: number
  totalMeters: number
  avgMetersPerSession: number
  avgDurationMins: number
  avgPerWeek: number
  avgSplit500Str: string | null
  bestSplit500Str: string | null
  longestMeters: number
  busiestDay: string
  preferredTime: string
}

export interface DowRowingStat {
  label: string
  sessions: number
  meters: number
}

export interface MonthlyRowingStat {
  label: string
  key: string
  sessions: number
  meters: number
  mins: number
  cals: number
  avgSplitSecs: number | null
  avgSplitStr: string | null
  bestSplitStr: string | null
}

export interface WeeklyRowingStat {
  label: string
  meters: number
  sessions: number
}

export interface SplitPoint {
  date: string
  split: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function RowingPatternsClient({
  stats,
  dowData,
  monthlyData,
  weeklyData,
  splitTrend,
  timeTotals,
}: {
  stats: RowingStats
  dowData: DowRowingStat[]
  monthlyData: MonthlyRowingStat[]
  weeklyData: WeeklyRowingStat[]
  splitTrend: SplitPoint[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.sessions), 1)
  const avgWeeklyMeters = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + w.meters, 0) / weeklyData.length)
    : 0
  const peakWeekMeters = Math.max(...weeklyData.map((w) => w.meters), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)
  const avgSplit = splitTrend.length > 0
    ? Math.round(splitTrend.reduce((s, d) => s + d.split, 0) / splitTrend.length)
    : 0

  const splitMonths = monthlyData.filter((m) => m.avgSplitSecs != null)
  const bestMonthSplit = splitMonths.length > 0 ? Math.min(...splitMonths.map((m) => m.avgSplitSecs!)) : null

  function fmtSplit(secs: number) {
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-rose-400">{stats.totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions (1yr)</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-pink-400">{(stats.totalMeters / 1000).toFixed(1)} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Distance</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgMetersPerSession}m avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-fuchsia-400">{stats.avgSplit500Str ?? '—'}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg 500m Split</p>
          {stats.bestSplit500Str && <p className="text-xs text-rose-400 opacity-70">Best: {stats.bestSplit500Str}</p>}
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-purple-400">{stats.longestMeters.toLocaleString()}m</p>
          <p className="text-xs text-text-secondary mt-0.5">Longest Session</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgDurationMins} min avg</p>
        </div>
      </div>

      {/* DOW */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Training Days</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you row most</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number) => [val, 'Sessions']}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell key={i} fill={d.sessions === maxDow ? '#f43f5e' : 'rgba(244,63,94,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Peak day: <span className="text-rose-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.sessions === 0).length > 0 && (
            <span>Rest days: <span className="font-medium">{dowData.filter((d) => d.sessions === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you prefer to row</p>
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
          You mostly row in the <span className="font-medium">{stats.preferredTime}</span>.
        </p>
      </div>

      {/* Monthly distance */}
      {monthlyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Meters logged per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [`${val} m`, 'Distance']}
              />
              <Bar dataKey="meters" fill="rgba(244,63,94,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span>Avg week: <span className="text-pink-400 font-medium">{avgWeeklyMeters} m</span></span>
            <span>Peak week: <span className="font-medium">{peakWeekMeters} m</span></span>
          </div>
        </div>
      )}

      {/* Monthly 500m split trend */}
      {splitMonths.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly 500m Split</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Lower = faster · min:ss per 500m</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(v) => fmtSplit(v)}
                reversed
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => [`${fmtSplit(val)} /500m`, 'Avg Split']}
              />
              <Line type="monotone" dataKey="avgSplitSecs" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          {bestMonthSplit && (
            <p className="text-xs text-text-secondary mt-2 opacity-60">
              Best month: <span className="text-rose-400 font-medium">{splitMonths.find(m => m.avgSplitSecs === bestMonthSplit)?.avgSplitStr} /500m</span> · Trend: {splitMonths[splitMonths.length - 1].avgSplitSecs! < splitMonths[0].avgSplitSecs! ? '📉 getting faster' : '📈 slowing over time'}
            </p>
          )}
        </div>
      )}

      {/* Weekly meters */}
      {weeklyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Distance</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Meters per week · last 16 weeks</p>
          <ResponsiveContainer width="100%" height={150}>
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
                  <Cell key={i} fill={w.meters >= peakWeekMeters * 0.85 ? '#f43f5e' : 'rgba(244,63,94,0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Split trend */}
      {splitTrend.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">500m Split Trend</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Session-by-session split progression</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={splitTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={false} />
              <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={fmtSplit} reversed />
              <Tooltip
                formatter={(val: number) => [`${fmtSplit(val)} /500m`, 'Split']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={avgSplit} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="split" stroke="#f43f5e" strokeWidth={1.5} dot={{ r: 2, fill: '#f43f5e' }} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-secondary mt-2 opacity-60">Avg: {fmtSplit(avgSplit)} /500m</p>
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
                  <p className="text-sm font-medium text-rose-400">{m.meters.toLocaleString()} m</p>
                  <p className="text-xs text-text-secondary opacity-60">{m.sessions} sessions · {Math.round(m.mins / 60)}h {m.mins % 60}m</p>
                </div>
                <div className="text-right">
                  {m.avgSplitStr && <p className="text-xs text-pink-400 font-medium">{m.avgSplitStr} /500m</p>}
                  {m.bestSplitStr && <p className="text-xs text-text-secondary opacity-60">best {m.bestSplitStr}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Rowing Training Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-rose-400 font-medium">Volume</span> · 5,000–8,000m per session is a solid aerobic workout for most rowers</p>
          <p><span className="text-pink-400 font-medium">Split targets</span> · Sub-2:00 /500m is competitive; 2:05–2:15 is solid recreational pace</p>
          <p><span className="text-fuchsia-400 font-medium">Training split</span> · 70% steady-state (UT2/UT1), 20% threshold, 10% high intensity</p>
          <p><span className="text-purple-400 font-medium">Full body</span> · Unlike most cardio, rowing engages legs (60%), core (20%), arms (20%)</p>
        </div>
      </div>
    </div>
  )
}
