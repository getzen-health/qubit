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

export interface RunningStats {
  totalRuns: number
  totalKm: number
  avgKmPerRun: number
  avgDurationMins: number
  avgPerWeek: number
  avgPaceStr: string | null
  bestPaceStr: string | null
  longestRunKm: number
  busiestDay: string
  preferredTime: string
}

export interface DowRunningStat {
  label: string
  runs: number
  km: number
}

export interface MonthlyRunningStat {
  label: string
  key: string
  runs: number
  km: number
  mins: number
  avgPaceSecs: number | null
  avgPaceStr: string | null
}

export interface WeeklyRunningStat {
  label: string
  km: number
  runs: number
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

export function RunningPatternsClient({
  stats,
  dowData,
  monthlyData,
  weeklyData,
  timeTotals,
}: {
  stats: RunningStats
  dowData: DowRunningStat[]
  monthlyData: MonthlyRunningStat[]
  weeklyData: WeeklyRunningStat[]
  timeTotals: { morning: number; afternoon: number; evening: number }
}) {
  const maxDow = Math.max(...dowData.map((d) => d.runs), 1)
  const avgWeeklyKm = weeklyData.length > 0
    ? +(weeklyData.reduce((s, w) => s + w.km, 0) / weeklyData.length).toFixed(1)
    : 0
  const peakWeekKm = Math.max(...weeklyData.map((w) => w.km), 0)
  const totalTimeSession = Math.max(1, timeTotals.morning + timeTotals.afternoon + timeTotals.evening)

  // Pace trend for monthly chart (lower is better)
  const paceMonths = monthlyData.filter((m) => m.avgPaceSecs != null)
  const bestMonthPace = paceMonths.length > 0 ? Math.min(...paceMonths.map((m) => m.avgPaceSecs!)) : null
  const worstMonthPace = paceMonths.length > 0 ? Math.max(...paceMonths.map((m) => m.avgPaceSecs!)) : null

  return (
    <div className="space-y-6">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.totalRuns}</p>
          <p className="text-xs text-text-secondary mt-0.5">Runs (1yr)</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.totalKm}</p>
          <p className="text-xs text-text-secondary mt-0.5">Total km</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgKmPerRun} km avg</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-teal-400">{stats.avgPaceStr ?? '—'}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Pace (min/km)</p>
          {stats.bestPaceStr && <p className="text-xs text-green-400 opacity-70">Best: {stats.bestPaceStr}</p>}
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-cyan-400">{stats.longestRunKm} km</p>
          <p className="text-xs text-text-secondary mt-0.5">Longest Run</p>
          <p className="text-xs text-text-secondary opacity-50">{stats.avgDurationMins} min avg</p>
        </div>
      </div>

      {/* DOW distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Distribution</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">Which days you run most</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              formatter={(val: number, name: string) => [
                name === 'runs' ? `${val} runs` : `${val} km`,
                name === 'runs' ? 'Runs' : 'Total km',
              ]}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="runs" radius={[3, 3, 0, 0]}>
              {dowData.map((d, i) => (
                <Cell key={i} fill={d.runs === maxDow ? '#22c55e' : 'rgba(34,197,94,0.35)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary flex-wrap">
          <span>Favorite day: <span className="text-green-400 font-medium">{stats.busiestDay}</span></span>
          {dowData.filter((d) => d.runs === 0).length > 0 && (
            <span>Rest days: <span className="font-medium">{dowData.filter((d) => d.runs === 0).map((d) => d.label).join(', ')}</span></span>
          )}
        </div>
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary mb-4 opacity-70">When you prefer to run</p>
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
          You mostly run in the <span className="font-medium">{stats.preferredTime}</span>.
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
                  name === 'km' ? `${val} km` : `${val} runs`,
                  name === 'km' ? 'Distance' : 'Runs',
                ]}
              />
              <Bar dataKey="km" name="km" fill="rgba(34,197,94,0.7)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span>Avg week: <span className="text-emerald-400 font-medium">{avgWeeklyKm} km</span></span>
            <span>Peak week: <span className="font-medium">{peakWeekKm.toFixed(1)} km</span></span>
          </div>
        </div>
      )}

      {/* Monthly pace trend */}
      {paceMonths.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Monthly Avg Pace</p>
          <p className="text-xs text-text-secondary mb-4 opacity-70">Lower = faster · min/km</p>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={bestMonthPace && worstMonthPace ? [bestMonthPace - 15, worstMonthPace + 15] : ['dataMin - 15', 'dataMax + 15']}
                tickFormatter={(v) => {
                  const m = Math.floor(v / 60)
                  const s = v % 60
                  return `${m}:${String(s).padStart(2,'0')}`
                }}
                reversed
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: number) => {
                  const m = Math.floor(val / 60)
                  const s = val % 60
                  return [`${m}:${String(s).padStart(2,'0')} min/km`, 'Avg Pace']
                }}
              />
              <Line type="monotone" dataKey="avgPaceSecs" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
          {bestMonthPace && (
            <p className="text-xs text-text-secondary mt-2 opacity-60">
              Best month: <span className="text-green-400 font-medium">{paceMonths.find(m => m.avgPaceSecs === bestMonthPace)?.avgPaceStr} min/km</span> · Trend: {paceMonths[paceMonths.length - 1].avgPaceSecs! < paceMonths[0].avgPaceSecs! ? '📉 getting faster' : '📈 slowing over time'}
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
                  <Cell key={i} fill={w.km >= peakWeekKm * 0.85 ? '#22c55e' : 'rgba(34,197,94,0.4)'} />
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
                  <p className="text-sm font-medium text-green-400">{m.km.toFixed(1)} km</p>
                  <p className="text-xs text-text-secondary opacity-60">{m.runs} runs · {Math.round(m.mins / 60)}h {m.mins % 60}m total</p>
                </div>
                <div className="text-right">
                  {m.avgPaceStr && (
                    <p className="text-xs text-teal-400 font-medium">{m.avgPaceStr} /km</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Running Training Guidelines</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-green-400 font-medium">Volume increase</span> · Add no more than 10% per week to avoid injury</p>
          <p><span className="text-emerald-400 font-medium">80/20 rule</span> · 80% easy runs (conversational pace) + 20% quality work</p>
          <p><span className="text-teal-400 font-medium">Consistency</span> · 3–5 runs/week builds aerobic base more than occasional long runs</p>
          <p><span className="text-cyan-400 font-medium">Pace improvement</span> · Expect 1–2% improvement per training block with consistent load</p>
        </div>
      </div>
    </div>
  )
}
