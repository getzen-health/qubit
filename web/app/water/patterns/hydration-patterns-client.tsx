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
  LineChart,
  Line,
  Legend,
} from 'recharts'

interface DowStat {
  label: string
  avg: number
  count: number
  hitRate: number
}

interface MonthStat {
  label: string
  avg: number
  count: number
  hitRate: number
}

interface DistBucket {
  label: string
  min: number
  max: number
  count: number
  pct: number
  isGoal: boolean
}

export interface HydrationPatternData {
  targetMl: number
  totalDays: number
  goalDays: number
  goalRate: number
  avgDaily: number
  currentStreak: number
  longestStreak: number
  bestDay: { date: string; ml: number } | null
  dowAvg: DowStat[]
  monthAvg: MonthStat[]
  distBuckets: DistBucket[]
  avgWorkoutDay: number | null
  avgRestDay: number | null
}

function fmt(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`
  return `${ml}ml`
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function goalColor(avg: number, target: number): string {
  const pct = avg / target
  if (pct >= 1) return '#22c55e'
  if (pct >= 0.75) return '#3b82f6'
  if (pct >= 0.5) return '#f59e0b'
  return '#ef4444'
}

const CustomTooltip = ({
  active,
  payload,
  label,
  target,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  target: number
}) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="text-text-secondary">{fmt(val)}</p>
      <p className="text-xs" style={{ color: goalColor(val, target) }}>
        {Math.round((val / target) * 100)}% of goal
      </p>
    </div>
  )
}

export function HydrationPatternsClient({ data }: { data: HydrationPatternData }) {
  const {
    targetMl,
    totalDays,
    goalDays,
    goalRate,
    avgDaily,
    currentStreak,
    longestStreak,
    bestDay,
    dowAvg,
    monthAvg,
    distBuckets,
    avgWorkoutDay,
    avgRestDay,
  } = data

  const bestDow = [...dowAvg].sort((a, b) => b.avg - a.avg)[0]
  const worstDow = dowAvg.filter((d) => d.count > 0).sort((a, b) => a.avg - b.avg)[0]

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Daily Average', value: fmt(avgDaily), sub: `Goal: ${fmt(targetMl)}`, color: goalColor(avgDaily, targetMl) },
          { label: 'Goal Hit Rate', value: `${goalRate}%`, sub: `${goalDays} of ${totalDays} days`, color: goalRate >= 70 ? '#22c55e' : goalRate >= 50 ? '#f59e0b' : '#ef4444' },
          { label: 'Current Streak', value: `${currentStreak}d`, sub: currentStreak > 0 ? 'Consecutive goal days' : 'No current streak', color: '#3b82f6' },
          { label: 'Longest Streak', value: `${longestStreak}d`, sub: bestDay ? `Best: ${fmt(bestDay.ml)}` : '—', color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Day-of-week chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">By Day of Week</h2>
        <p className="text-xs text-text-secondary mb-4">Average intake for each weekday</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dowAvg} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${v}`}
              domain={[0, Math.max(...dowAvg.map((d) => d.avg), targetMl) * 1.1]}
            />
            <Tooltip content={<CustomTooltip target={targetMl} />} />
            <ReferenceLine y={targetMl} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#22c55e' }} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {dowAvg.map((d) => (
                <Cell key={d.label} fill={goalColor(d.avg, targetMl)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Best/worst day */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {bestDow && (
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <p className="text-xs text-text-secondary">Best day</p>
              <p className="font-semibold text-green-400">{bestDow.label}</p>
              <p className="text-xs text-text-secondary">{fmt(bestDow.avg)} avg · {bestDow.hitRate}% hit rate</p>
            </div>
          )}
          {worstDow && (
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <p className="text-xs text-text-secondary">Worst day</p>
              <p className="font-semibold text-red-400">{worstDow.label}</p>
              <p className="text-xs text-text-secondary">{fmt(worstDow.avg)} avg · {worstDow.hitRate}% hit rate</p>
            </div>
          )}
        </div>
      </div>

      {/* Goal hit rate by DOW */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Goal Achievement by Day</h2>
        <p className="text-xs text-text-secondary mb-4">% of days reaching the {fmt(targetMl)} target</p>
        <div className="space-y-2">
          {dowAvg.filter((d) => d.count > 0).map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-8 shrink-0">{d.label}</span>
              <div className="flex-1 bg-surface-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${d.hitRate}%`,
                    background: d.hitRate >= 70 ? '#22c55e' : d.hitRate >= 50 ? '#3b82f6' : d.hitRate >= 30 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-xs font-medium text-text-primary w-9 text-right">{d.hitRate}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly trend */}
      {monthAvg.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Average daily intake per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${v}`}
                domain={[0, Math.max(...monthAvg.map((m) => m.avg), targetMl) * 1.1]}
              />
              <Tooltip content={<CustomTooltip target={targetMl} />} />
              <ReferenceLine y={targetMl} stroke="#22c55e" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props
                  return (
                    <circle
                      key={payload.label}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={goalColor(payload.avg, targetMl)}
                      stroke="var(--color-background)"
                      strokeWidth={1.5}
                    />
                  )
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Workout vs rest day */}
      {avgWorkoutDay !== null && avgRestDay !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Workout Days vs Rest Days</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Workout Days', value: avgWorkoutDay, emoji: '🏋️' },
              { label: 'Rest Days', value: avgRestDay, emoji: '🛋️' },
            ].map((item) => {
              const pct = Math.round((item.value / targetMl) * 100)
              return (
                <div key={item.label} className="text-center">
                  <p className="text-2xl mb-1">{item.emoji}</p>
                  <p className="text-lg font-bold text-text-primary">{fmt(item.value)}</p>
                  <p className="text-xs text-text-secondary">{item.label}</p>
                  <p className="text-xs mt-1" style={{ color: goalColor(item.value, targetMl) }}>{pct}% of goal</p>
                </div>
              )
            })}
          </div>
          {avgWorkoutDay > avgRestDay && (
            <p className="text-xs text-text-secondary text-center mt-3 pt-3 border-t border-border">
              You drink {fmt(avgWorkoutDay - avgRestDay)} more on workout days 💪
            </p>
          )}
          {avgRestDay > avgWorkoutDay && (
            <p className="text-xs text-text-secondary text-center mt-3 pt-3 border-t border-border">
              You actually drink {fmt(avgRestDay - avgWorkoutDay)} more on rest days
            </p>
          )}
        </div>
      )}

      {/* Distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Intake Distribution</h2>
        <p className="text-xs text-text-secondary mb-4">How your daily intake is spread</p>
        <div className="space-y-2">
          {distBuckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className={`text-xs w-14 shrink-0 ${b.isGoal ? 'text-green-400 font-medium' : 'text-text-secondary'}`}>
                {b.label}
              </span>
              <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${b.pct}%`,
                    background: b.isGoal ? '#22c55e' : b.max <= targetMl * 0.5 ? '#ef4444' : b.max <= targetMl ? '#f59e0b' : '#22c55e',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="text-xs text-text-secondary w-10 text-right">{b.pct}%</span>
              <span className="text-xs text-text-secondary w-8 text-right">{b.count}d</span>
            </div>
          ))}
        </div>
        {bestDay && (
          <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border">
            Best day: {fmt(bestDay.ml)} on {fmtDate(bestDay.date)}
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-400 mb-2">Hydration Tips</p>
        <ul className="space-y-1.5 text-xs text-text-secondary">
          <li>• Aim to spread intake evenly through the day rather than drinking large amounts at once</li>
          <li>• Increase by ~500ml on workout days to compensate for sweat losses</li>
          <li>• Your goal of {fmt(targetMl)}/day accounts for ~2.5L total fluid (including food moisture)</li>
          <li>• Pale yellow urine is a simple indicator of good hydration status</li>
        </ul>
      </div>
    </div>
  )
}
