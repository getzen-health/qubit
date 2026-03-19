'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

export interface ProgressionData {
  totalSessions: number
  totalHours: number
  avgDurationMins: number
  avgPerWeek: number
  totalCals: number
  durationTrend: number      // positive = sessions getting longer
  firstAvgDuration: number   // avg duration in first 30 days of year
  lastAvgDuration: number    // avg duration in last 30 days
  trendPoints: { date: string; duration: number; trend: number }[]
  months: {
    month: string
    label: string
    sessions: number
    totalMins: number
    totalCals: number
    avgDurationMins: number
  }[]
  quarters: {
    quarter: string
    sessions: number
    totalHours: number
    avgDurationMins: number
  }[]
  typeBreakdown: { type: string; count: number }[]
}

function fmtMins(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const TYPE_COLORS: Record<string, string> = {
  'Strength Training': '#ef4444',
  'Functional Strength Training': '#f97316',
  'Core Training': '#eab308',
  'Cross Training': '#22c55e',
  'Flexibility': '#06b6d4',
  'Mixed Cardio': '#8b5cf6',
}

export function StrengthProgressionClient({ data }: { data: ProgressionData }) {
  const {
    totalSessions, totalHours, avgDurationMins, avgPerWeek, totalCals,
    durationTrend, firstAvgDuration, lastAvgDuration,
    trendPoints, months, quarters, typeBreakdown,
  } = data

  const trendSign = durationTrend > 0 ? '+' : ''
  const trendColor = durationTrend > 0 ? 'text-emerald-400' : durationTrend < 0 ? 'text-red-400' : 'text-text-secondary'

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Sessions (1yr)</p>
          <p className="text-2xl font-bold text-red-500">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-1">{avgPerWeek}/week avg</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Total Volume</p>
          <p className="text-2xl font-bold text-orange-500">{totalHours}h</p>
          <p className="text-xs text-text-secondary mt-1">{fmtMins(avgDurationMins)} avg/session</p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Duration Trend</p>
          <p className={`text-2xl font-bold ${trendColor}`}>
            {trendSign}{Math.abs(durationTrend).toFixed(0)}m
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {durationTrend > 2 ? 'Sessions getting longer ↑' : durationTrend < -2 ? 'Sessions getting shorter ↓' : 'Stable session length'}
          </p>
        </div>
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <p className="text-xs text-text-secondary mb-1">Calories Burned</p>
          <p className="text-2xl font-bold text-yellow-500">{totalCals.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">past year total</p>
        </div>
      </div>

      {/* First vs last 30 days */}
      {firstAvgDuration > 0 && lastAvgDuration > 0 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-3">First vs. Last 30 Days</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">First 30 days avg</p>
              <p className="text-xl font-bold text-text-primary">{firstAvgDuration} min</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Last 30 days avg</p>
              <p className="text-xl font-bold text-text-primary">{lastAvgDuration} min</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-secondary">
              {lastAvgDuration > firstAvgDuration
                ? `Sessions are ${lastAvgDuration - firstAvgDuration} min longer than a year ago — progressive volume increase.`
                : lastAvgDuration < firstAvgDuration
                ? `Sessions are ${firstAvgDuration - lastAvgDuration} min shorter — consider reviewing intensity.`
                : 'Session duration is consistent year-over-year.'}
            </p>
          </div>
        </div>
      )}

      {/* Monthly volume chart */}
      {months.length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Volume</h2>
          <p className="text-xs text-text-secondary mb-4">Total minutes per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} min`, 'Volume']}
              />
              <Bar dataKey="totalMins" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session duration trend */}
      {trendPoints.length >= 4 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Session Duration Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Each session · trend line shows progression</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendPoints} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v.slice(5)} interval={Math.max(0, Math.floor(trendPoints.length / 6))} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [`${v} min`, name === 'trend' ? 'Trend' : 'Session']}
                labelFormatter={(l) => l}
              />
              <Line type="monotone" dataKey="duration" stroke="#ef4444" dot={{ r: 2 }} strokeWidth={1.5} opacity={0.6} name="Duration" />
              <Line type="monotone" dataKey="trend" stroke="#fbbf24" dot={false} strokeWidth={2} strokeDasharray="6 3" name="Trend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly sessions frequency */}
      {months.length >= 2 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Frequency</h2>
          <p className="text-xs text-text-secondary mb-4">Sessions per month</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v, 'Sessions']}
              />
              <Bar dataKey="sessions" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Type breakdown */}
      {typeBreakdown.length > 1 && (
        <div className="bg-surface-primary rounded-2xl p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Workout Type Mix</h2>
          <div className="space-y-2">
            {typeBreakdown.map(({ type, count }) => {
              const pct = Math.round((count / totalSessions) * 100)
              const color = TYPE_COLORS[type] ?? '#6b7280'
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-44 shrink-0 truncate">{type}</span>
                  <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
                  </div>
                  <span className="text-xs text-text-secondary w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
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
                <th className="text-right pb-2 font-medium">Sessions</th>
                <th className="text-right pb-2 font-medium">Hours</th>
                <th className="text-right pb-2 font-medium">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quarters.map((q) => (
                <tr key={q.quarter} className="text-text-primary">
                  <td className="py-2 font-medium text-red-400">{q.quarter}</td>
                  <td className="py-2 text-right">{q.sessions}</td>
                  <td className="py-2 text-right">{q.totalHours}h</td>
                  <td className="py-2 text-right">{q.avgDurationMins} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-surface-primary rounded-2xl p-4 border border-border">
        <h2 className="text-sm font-semibold text-red-400 mb-3">Progressive Overload Principles</h2>
        <div className="space-y-3 text-xs text-text-secondary">
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 mt-1.5 shrink-0" />
            <div><span className="text-red-400 font-medium">Volume:</span> Increase total sets × reps × weight by 5–10%/week for continued adaptation.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60 mt-1.5 shrink-0" />
            <div><span className="text-orange-400 font-medium">Frequency:</span> 2–4 strength sessions/week is optimal; each muscle group needs 48–72h recovery.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60 mt-1.5 shrink-0" />
            <div><span className="text-yellow-400 font-medium">Deload:</span> Every 4–6 weeks reduce volume by 40–50% to allow full recovery and supercompensation.</div>
          </div>
          <div className="flex gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 mt-1.5 shrink-0" />
            <div><span className="text-green-400 font-medium">Duration:</span> 45–75 min sessions are optimal; beyond 90 min cortisol rises and protein synthesis diminishes.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
