'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ConsistencyData, WeekConsistency } from './page'

interface Props {
  data: ConsistencyData
}

function fmt1(n: number) { return n.toFixed(1) }

// Custom tooltip for stacked sport bar chart
function SportTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, p) => a + (p.value || 0), 0)
  const withData = payload.filter((p) => p.value > 0).reverse()
  return (
    <div className="bg-surface-primary border border-border rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {withData.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="text-text-secondary tabular-nums">
            {p.value} {p.value === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      ))}
      {withData.length > 0 && (
        <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-border">
          <span className="text-text-secondary font-medium">Total</span>
          <span className="font-bold tabular-nums">{total} sessions</span>
        </div>
      )}
    </div>
  )
}

// Custom tooltip for training days chart
function DaysTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const days = payload[0]?.value ?? 0
  return (
    <div className="bg-surface-primary border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      <p className="text-text-secondary">
        {days} {days === 1 ? 'training day' : 'training days'}
      </p>
    </div>
  )
}

function getConsistencyLevel(trainingDays: number): { label: string; color: string; bg: string } {
  if (trainingDays >= 5) return { label: 'High', color: 'text-green-400', bg: 'bg-green-500/20' }
  if (trainingDays >= 3) return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  if (trainingDays >= 1) return { label: 'Low', color: 'text-orange-400', bg: 'bg-orange-500/20' }
  return { label: 'Rest', color: 'text-text-secondary', bg: 'bg-surface-secondary' }
}

export function ConsistencyClient({ data }: Props) {
  const {
    weeks,
    totalSessions52w,
    activeWeeks,
    avgSessionsPerActiveWeek,
    currentStreak,
    longestStreak,
    bestWeekSessions,
    bestWeekLabel,
    activeSports,
    sports,
    sportColors,
  } = data

  const tickInterval = Math.floor(weeks.length / 12)

  // Last 8 weeks most recent first
  const last8Weeks = weeks.slice(-8).reverse()

  // Insights calculations
  const thisWeekSessions = weeks[weeks.length - 1]?.totalSessions ?? 0
  const last4Weeks = weeks.slice(-4)
  const avg4w = last4Weeks.length > 0
    ? last4Weeks.reduce((a, w) => a + w.totalSessions, 0) / last4Weeks.length
    : 0
  const consistencyPct = Math.round((activeWeeks / 52) * 100)

  return (
    <div className="space-y-6">
      {/* Summary cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl font-bold text-text-primary tabular-nums">{totalSessions52w}</div>
          <div className="text-xs text-text-secondary mt-1">52-Week Sessions</div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            {Math.floor((activeWeeks / 52) * 100)}%
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Active Weeks <span className="text-text-secondary/60">({activeWeeks} weeks)</span>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            {currentStreak}
            {currentStreak >= 4 && <span className="ml-1 text-xl">🔥</span>}
            <span className="text-sm font-normal text-text-secondary ml-1">wk</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">Current Streak</div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl font-bold text-text-primary tabular-nums">
            {longestStreak}
            <span className="text-sm font-normal text-text-secondary ml-1">wk</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">Longest Streak</div>
        </div>
      </div>

      {/* Weekly session count chart — stacked by sport */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-1">Weekly Sessions by Sport</h2>
        <p className="text-xs text-text-secondary mb-4">52-week stacked view · dashed lines = 3 and 5 sessions/week</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeks} margin={{ left: -20, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 9 }} interval={tickInterval} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip content={<SportTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              y={3}
              stroke="#14b8a6"
              strokeDasharray="4 3"
              label={{ value: '3/week', fill: '#14b8a6', fontSize: 9, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={5}
              stroke="#a855f7"
              strokeDasharray="4 3"
              label={{ value: '5/week', fill: '#a855f7', fontSize: 9, position: 'insideTopRight' }}
            />
            {sports.map((s) => (
              <Bar key={s} dataKey={s} stackId="sports" fill={sportColors[s] ?? '#94a3b8'} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Training days per week chart */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-1">Training Days Per Week</h2>
        <p className="text-xs text-text-secondary mb-4">
          Unique days with at least one workout · double sessions still count as 1 day
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeks} margin={{ left: -20, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 9 }} interval={tickInterval} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} domain={[0, 7]} />
            <Tooltip content={<DaysTooltip />} />
            <ReferenceLine
              y={5}
              stroke="#14b8a6"
              strokeDasharray="4 3"
              label={{ value: '5 days', fill: '#14b8a6', fontSize: 9, position: 'insideTopRight' }}
            />
            <Bar dataKey="trainingDays" fill="#3b82f6" opacity={0.7} name="Training Days" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sport frequency breakdown */}
      {activeSports.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-4 border border-border">
          <h2 className="font-semibold text-text-primary mb-3">Sessions by Sport</h2>
          <div className="space-y-3">
            {activeSports.map((s) => {
              const pct = totalSessions52w > 0 ? (s.sessions / totalSessions52w) * 100 : 0
              return (
                <div key={s.sport}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-text-primary">{s.sport}</span>
                    <span className="text-xs text-text-secondary tabular-nums">
                      {s.sessions} sessions · {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Last 8 weeks consistency table */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Last 8 Weeks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left pb-2 font-medium">Week</th>
                <th className="text-right pb-2 font-medium">Sessions</th>
                <th className="text-right pb-2 font-medium">Days</th>
                <th className="text-right pb-2 font-medium">Consistency</th>
              </tr>
            </thead>
            <tbody>
              {last8Weeks.map((w: WeekConsistency, i: number) => {
                const level = getConsistencyLevel(w.trainingDays)
                return (
                  <tr key={w.weekStart} className={i % 2 === 0 ? '' : 'bg-surface-secondary/50'}>
                    <td className="py-2 text-text-secondary text-xs">{w.weekLabel}</td>
                    <td className="py-2 text-right tabular-nums text-xs font-medium text-text-primary">
                      {w.totalSessions > 0 ? w.totalSessions : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs text-text-secondary">
                      {w.trainingDays > 0 ? w.trainingDays : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>
                        {level.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights card */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
        <h3 className="font-semibold text-teal-600 dark:text-teal-400 mb-3">Consistency Insights</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="text-teal-500 shrink-0 font-bold">·</span>
            <span>
              This week you had <span className="font-medium text-text-primary">{thisWeekSessions} sessions</span>
              {' '}(4-week avg: <span className="font-medium text-text-primary">{fmt1(avg4w)}</span>)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-500 shrink-0 font-bold">·</span>
            <span>
              You trained in{' '}
              <span className="font-medium text-text-primary">{consistencyPct}%</span> of weeks over the past year
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-500 shrink-0 font-bold">·</span>
            <span>
              Your best streak was{' '}
              <span className="font-medium text-text-primary">{longestStreak} consecutive training weeks</span>
              {bestWeekLabel && longestStreak > 0 && (
                <> · best single week: <span className="font-medium text-text-primary">{bestWeekSessions} sessions</span> ({bestWeekLabel})</>
              )}
            </span>
          </li>
        </ul>
        {avgSessionsPerActiveWeek > 0 && (
          <p className="mt-2 text-xs text-text-secondary/70">
            On active weeks you averaged {fmt1(avgSessionsPerActiveWeek)} sessions.
          </p>
        )}
      </div>

      {/* Guidelines card */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
        <h3 className="font-semibold text-teal-600 dark:text-teal-400 mb-2">Training Consistency Tips</h3>
        <p className="text-sm text-text-secondary">
          Research shows training 3–5 days per week provides optimal stimulus for adaptation. Consistency
          over intensity — showing up regularly matters more than peak effort. Aim for at least 3 active
          weeks per month to maintain cardiovascular adaptations.
        </p>
      </div>
    </div>
  )
}
