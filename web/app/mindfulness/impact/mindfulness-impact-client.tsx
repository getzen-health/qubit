'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts'

interface ZoneGroup {
  days: number
  avgHrv: number | null
  avgRhr: number | null
  avgRecovery: number | null
}

interface WeekEntry {
  date: string
  mins: number
}

interface DayPair {
  date: string
  minsMeditated: number
  nextHrv: number | null
}

export interface ImpactData {
  withMindfulness: ZoneGroup
  withoutMindfulness: ZoneGroup
  weeklyMins: WeekEntry[]
  totalSessions: number
  totalMins: number
  pairs: DayPair[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

export function MindfulnessImpactClient({ data }: { data: ImpactData }) {
  const { withMindfulness: wm, withoutMindfulness: wo, weeklyMins, totalSessions, totalMins, pairs } = data

  if (totalSessions < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">🧘</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Complete at least 5 mindfulness sessions to see how they affect your next-day metrics.
        </p>
      </div>
    )
  }

  const hrvDiff = wm.avgHrv !== null && wo.avgHrv !== null ? wm.avgHrv - wo.avgHrv : null
  const rhrDiff = wm.avgRhr !== null && wo.avgRhr !== null ? wm.avgRhr - wo.avgRhr : null
  const recDiff = wm.avgRecovery !== null && wo.avgRecovery !== null ? wm.avgRecovery - wo.avgRecovery : null

  const hrvPositive = hrvDiff !== null && hrvDiff > 0
  const rhrPositive = rhrDiff !== null && rhrDiff < 0  // lower RHR = better

  const totalH = Math.floor(totalMins / 60)
  const totalM = totalMins % 60

  // Scatter: minutes meditated vs next-day HRV (only days with >0 minutes)
  const scatterData = pairs.filter((p) => p.minsMeditated > 0 && p.nextHrv !== null)
  const avgHrvWithMind = wm.avgHrv

  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">Sessions</p>
          <p className="text-2xl font-bold text-teal-400">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">last 90 days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-secondary opacity-70 mb-1">Total Time</p>
          <p className="text-2xl font-bold text-text-primary">{totalH}h {totalM}m</p>
          <p className="text-xs text-text-secondary mt-0.5">mindfulness practice</p>
        </div>
        {hrvDiff !== null && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">HRV Impact</p>
            <p className={`text-2xl font-bold ${hrvPositive ? 'text-green-400' : 'text-orange-400'}`}>
              {hrvDiff > 0 ? '+' : ''}{hrvDiff} ms
            </p>
            <p className="text-xs text-text-secondary mt-0.5">next-day HRV diff</p>
          </div>
        )}
        {rhrDiff !== null && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">RHR Impact</p>
            <p className={`text-2xl font-bold ${rhrPositive ? 'text-green-400' : 'text-orange-400'}`}>
              {rhrDiff > 0 ? '+' : ''}{rhrDiff} bpm
            </p>
            <p className="text-xs text-text-secondary mt-0.5">next-day RHR diff</p>
          </div>
        )}
      </div>

      {/* HRV / RHR / Recovery comparison */}
      {(wm.avgHrv !== null || wm.avgRhr !== null) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Next-Day Metrics Comparison</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Average of the day AFTER a mindfulness session vs the day after no session
          </p>

          <div className="space-y-4">
            {wm.avgHrv !== null && wo.avgHrv !== null && (
              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>HRV (ms)</span>
                  <span className={hrvPositive ? 'text-green-400' : 'text-text-secondary'}>
                    {hrvPositive ? `+${hrvDiff} ms after mindfulness` : `${hrvDiff} ms difference`}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-teal-400/20 overflow-hidden">
                        <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.min(100, (wm.avgHrv / 100) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">{wm.avgHrv} ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-text-secondary opacity-40 shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-text-secondary opacity-50" style={{ width: `${Math.min(100, (wo.avgHrv / 100) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium w-12 text-right opacity-60">{wo.avgHrv} ms</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-text-secondary mt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> After mindfulness</span>
                  <span className="flex items-center gap-1 opacity-60"><span className="w-2 h-2 rounded-full bg-text-secondary inline-block" /> After no session</span>
                </div>
              </div>
            )}

            {wm.avgRhr !== null && wo.avgRhr !== null && (
              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                  <span>Resting HR (bpm) — lower is better</span>
                  <span className={rhrPositive ? 'text-green-400' : 'text-orange-400'}>
                    {rhrDiff! < 0 ? `${rhrDiff} bpm after mindfulness` : `+${rhrDiff} bpm`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-2.5">
                    <p className="text-lg font-bold text-teal-400">{wm.avgRhr}</p>
                    <p className="text-xs text-text-secondary">After session</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary border border-border p-2.5">
                    <p className="text-lg font-bold text-text-primary">{wo.avgRhr}</p>
                    <p className="text-xs text-text-secondary">No session</p>
                  </div>
                </div>
              </div>
            )}

            {wm.avgRecovery !== null && wo.avgRecovery !== null && (
              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                  <span>Recovery Score (%)</span>
                  <span className={recDiff! > 0 ? 'text-green-400' : 'text-text-secondary'}>
                    {recDiff! > 0 ? `+${recDiff}%` : `${recDiff}%`} after mindfulness
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-2.5">
                    <p className="text-lg font-bold text-teal-400">{wm.avgRecovery}%</p>
                    <p className="text-xs text-text-secondary">After session</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary border border-border p-2.5">
                    <p className="text-lg font-bold text-text-primary">{wo.avgRecovery}%</p>
                    <p className="text-xs text-text-secondary">No session</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-text-secondary opacity-50 mt-4">
            Correlation, not causation. Other factors (sleep, training load) also affect next-day HRV.
          </p>
        </div>
      )}

      {/* Weekly minutes chart */}
      {weeklyMins.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Practice Volume</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">Minutes of mindfulness per week</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyMins} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => {
                  const dt = new Date(d + 'T12:00:00')
                  return `${dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                }}
                interval={Math.max(0, Math.floor(weeklyMins.length / 6))}
              />
              <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} min`, 'Mindfulness']}
                labelFormatter={(d) => `Week of ${new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              />
              <Bar dataKey="mins" fill="rgba(45,212,191,0.65)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scatter: session minutes vs next-day HRV */}
      {scatterData.length >= 5 && avgHrvWithMind !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Session Length vs Next-Day HRV</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Each dot = one session day. Does a longer session predict higher HRV?
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                type="number" dataKey="minsMeditated" name="Minutes"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false}
                label={{ value: 'Session mins', position: 'insideBottom', offset: -2, style: { fill: 'rgba(255,255,255,0.3)', fontSize: 9 } }}
              />
              <YAxis
                type="number" dataKey="nextHrv" name="Next-day HRV"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  name === 'Minutes' ? `${v} min` : `${v} ms`,
                  name,
                ]}
              />
              <ReferenceLine y={avgHrvWithMind} stroke="rgba(45,212,191,0.3)" strokeDasharray="4 2" />
              <Scatter data={scatterData} fill="rgba(45,212,191,0.7)" r={5} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalSessions} mindfulness days analysed · 90-day window · Correlation analysis only
      </p>
    </div>
  )
}
