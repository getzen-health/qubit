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
  LineChart,
  Line,
  Legend,
} from 'recharts'

export interface DowDaylightStat {
  label: string
  avg: number | null
  count: number
  goalPct: number | null
}

export interface MonthDaylightStat {
  label: string
  avg: number
  goalPct: number
  count: number
}

export interface ZoneCount {
  label: string
  count: number
  pct: number
  colorClass: string
}

export interface HistBucket {
  label: string
  count: number
}

export interface DaylightPatternData {
  totalDays: number
  avgMinutes: number
  goalHitDays: number
  goalHitPct: number
  currentStreak: number
  longestStreak: number
  bestDow: string | null
  worstDow: string | null
  dowData: DowDaylightStat[]
  monthData: MonthDaylightStat[]
  zoneCounts: ZoneCount[]
  histogram: HistBucket[]
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtMin(m: number) {
  const mins = Math.round(m)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`
}

function goalColor(pct: number): string {
  if (pct >= 70) return 'text-green-400'
  if (pct >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function DaylightPatternsClient({ data }: { data: DaylightPatternData }) {
  const {
    totalDays, avgMinutes, goalHitDays, goalHitPct,
    currentStreak, longestStreak, bestDow, worstDow,
    dowData, monthData, zoneCounts, histogram,
  } = data

  const dowWithData = dowData.filter((d) => d.avg !== null && d.count > 0)
  const hasMonthData = monthData.length >= 2
  const totalZoneDays = zoneCounts.reduce((s, z) => s + z.count, 0)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{fmtMin(avgMinutes)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Daily Avg</p>
          <p className="text-xs text-text-secondary opacity-60">Goal: 20m</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className={`text-2xl font-bold ${goalColor(goalHitPct)}`}>{goalHitPct}%</p>
          <p className="text-xs text-text-secondary mt-0.5">Goal Days</p>
          <p className="text-xs text-text-secondary opacity-60">{goalHitDays} of {totalDays}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{currentStreak}</p>
          <p className="text-xs text-text-secondary mt-0.5">Day Streak</p>
          <p className="text-xs text-text-secondary opacity-60">Best: {longestStreak}d</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{totalDays}</p>
          <p className="text-xs text-text-secondary mt-0.5">Days Tracked</p>
          <p className="text-xs text-text-secondary opacity-60">Past year</p>
        </div>
      </div>

      {/* Highlights */}
      {(bestDow || worstDow) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Insights</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bestDow && (
              <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
                <span className="text-2xl">☀️</span>
                <div>
                  <p className="text-xs text-text-secondary">Most sunlight</p>
                  <p className="text-sm font-semibold text-text-primary">{bestDow}</p>
                </div>
              </div>
            )}
            {worstDow && (
              <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
                <span className="text-2xl">🌥️</span>
                <div>
                  <p className="text-xs text-text-secondary">Least sunlight</p>
                  <p className="text-sm font-semibold text-text-primary">{worstDow}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goal progress bar */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-text-primary">Goal Achievement (≥ 20 min/day)</p>
          <p className={`text-sm font-bold ${goalColor(goalHitPct)}`}>{goalHitPct}%</p>
        </div>
        <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-500/70 transition-all"
            style={{ width: `${goalHitPct}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1 opacity-60">
          {goalHitDays} days reached the 20-minute circadian goal out of {totalDays}
        </p>
      </div>

      {/* Zone breakdown */}
      {totalZoneDays > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Exposure Levels</p>
          <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-0.5">
            {zoneCounts.map((z) => z.pct > 0 && (
              <div key={z.label} className={`${z.colorClass} flex-none`} style={{ width: `${z.pct}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {zoneCounts.map((z) => z.count > 0 && (
              <div key={z.label} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full flex-none ${z.colorClass}`} />
                <span className="text-xs text-text-primary flex-1">{z.label}</span>
                <span className="text-xs font-semibold text-text-primary w-8 text-right">{z.pct}%</span>
                <span className="text-xs text-text-secondary w-10 text-right opacity-60">{z.count}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOW chart */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Average by Day of Week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowWithData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number) => [`${val}m`, 'Avg Daylight']}
                contentStyle={tooltipStyle}
              />
              <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Goal', fill: '#22c55e', fontSize: 10 }} />
              <Bar dataKey="avg" name="Avg (min)" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* DOW goal % */}
      {dowWithData.length >= 4 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Goal Rate by Day</p>
          <p className="text-xs text-text-secondary mb-4 opacity-60">% of days that reached 20+ minutes</p>
          <div className="space-y-2">
            {dowData.map((d) => {
              if (d.goalPct === null) return null
              const color = d.goalPct >= 70 ? '#22c55e' : d.goalPct >= 40 ? '#f59e0b' : '#ef4444'
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-8">{d.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.goalPct}%`, backgroundColor: color + 'cc' }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right" style={{ color }}>{d.goalPct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Distribution histogram */}
      {histogram.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Duration Distribution</p>
          <div className="space-y-2">
            {histogram.map((b) => {
              const maxCount = Math.max(...histogram.map((h) => h.count))
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-14 text-right">{b.label}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500/60"
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary w-6 text-right">{b.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val: number, name: string) => [
                  name === 'goalPct' ? `${val}%` : `${val}m`,
                  name === 'goalPct' ? 'Goal Days %' : 'Avg Daylight',
                ]}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="left" y={20} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line yAxisId="left" type="monotone" dataKey="avg" name="Avg Minutes" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="goalPct" name="Goal Days %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">About Daylight Exposure</p>
        <div className="space-y-1 text-xs text-text-secondary">
          <p><span className="text-orange-400 font-medium">Excellent (60m+)</span> — Ideal for circadian rhythm and mood regulation</p>
          <p><span className="text-green-400 font-medium">Goal Met (20–59m)</span> — Meets the recommended minimum for circadian health</p>
          <p><span className="text-amber-400 font-medium">Below Goal (5–19m)</span> — Some benefit but below recommended level</p>
          <p><span className="text-red-400 font-medium">Very Low (&lt; 5m)</span> — May affect circadian rhythm, sleep quality, and mood</p>
        </div>
        <p className="text-xs text-text-secondary opacity-60 mt-3">
          Measured by iPhone ambient light sensor. Requires iOS 17+. Bright outdoor light (≥ 1000 lux) is needed for circadian benefit.
        </p>
      </div>
    </div>
  )
}
