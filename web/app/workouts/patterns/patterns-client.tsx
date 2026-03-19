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

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

interface DayPattern {
  label: string
  sessions: number
  totalMins: number
  avgMins: number
  isBusiest: boolean
}

interface HourPattern {
  hour: number
  label: string
  sessions: number
  band: 'morning' | 'afternoon' | 'evening' | 'other'
}

interface WeekVolume {
  weekLabel: string
  totalMins: number
  sessions: number
  calories: number
}

interface Insight {
  text: string
  type: 'positive' | 'neutral' | 'warning'
}

export interface PatternsData {
  dayPatterns: DayPattern[]
  hourPatterns: HourPattern[]
  weekVolumes: WeekVolume[]
  totalSessions: number
  avgSessionMins: number
  avgSessionsPerWeek: number
  preferredDay: string
  preferredTime: string   // 'morning' | 'afternoon' | 'evening'
  consistencyPct: number  // % of weeks with at least 1 workout
  insights: Insight[]
}

const HOUR_COLORS: Record<string, string> = {
  morning: 'rgba(250,204,21,0.7)',
  afternoon: 'rgba(249,115,22,0.7)',
  evening: 'rgba(99,102,241,0.7)',
  other: 'rgba(100,116,139,0.4)',
}

function BandLabel({ band }: { band: string }) {
  const map: Record<string, string> = {
    morning: '🌅 Morning',
    afternoon: '☀️ Afternoon',
    evening: '🌙 Evening',
    other: 'Late night',
  }
  return <>{map[band] ?? band}</>
}

export function WorkoutPatternsClient({ data }: { data: PatternsData }) {
  const {
    dayPatterns, hourPatterns, weekVolumes,
    totalSessions, avgSessionMins, avgSessionsPerWeek,
    preferredDay, preferredTime, consistencyPct, insights,
  } = data

  const morningTotal = hourPatterns.filter((h) => h.band === 'morning').reduce((s, h) => s + h.sessions, 0)
  const afternoonTotal = hourPatterns.filter((h) => h.band === 'afternoon').reduce((s, h) => s + h.sessions, 0)
  const eveningTotal = hourPatterns.filter((h) => h.band === 'evening').reduce((s, h) => s + h.sessions, 0)
  const grandTotal = Math.max(1, morningTotal + afternoonTotal + eveningTotal)

  const avgWeekMins = weekVolumes.length > 0
    ? weekVolumes.reduce((s, w) => s + w.totalMins, 0) / weekVolumes.length
    : 0

  return (
    <div className="space-y-4">

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Sessions', value: totalSessions.toString(), sub: 'last 90 days', color: 'text-orange-400' },
          { label: 'Avg / Week', value: avgSessionsPerWeek.toFixed(1), sub: 'sessions', color: 'text-blue-400' },
          { label: 'Avg Duration', value: `${Math.round(avgSessionMins)} min`, sub: 'per session', color: 'text-green-400' },
          { label: 'Consistency', value: `${consistencyPct}%`, sub: 'weeks with a workout', color: consistencyPct >= 70 ? 'text-green-400' : 'text-orange-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Day-of-week chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Day-of-Week Distribution</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          Which days you train most often
          {preferredDay ? ` · Busiest: ${preferredDay}` : ''}
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dayPatterns} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                name === 'sessions' ? `${v} sessions` : `${Math.round(v)} min`,
                name === 'sessions' ? 'Sessions' : 'Total time',
              ]}
            />
            <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
              {dayPatterns.map((d) => (
                <Cell
                  key={d.label}
                  fill={d.isBusiest ? 'rgba(249,115,22,0.8)' : 'rgba(249,115,22,0.35)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Duration by day */}
        {dayPatterns.some((d) => d.avgMins > 0) && (
          <div className="grid grid-cols-7 gap-1 mt-3">
            {dayPatterns.map((d) => (
              <div key={d.label} className="text-center">
                <p className="text-[9px] text-text-secondary opacity-60">{d.label}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {d.avgMins > 0 ? `${Math.round(d.avgMins)}m` : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time of day */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Time of Day</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          When you prefer to train
          {preferredTime ? ` · Preferred: ${preferredTime}` : ''}
        </p>

        {/* Band bars */}
        <div className="space-y-2 mb-4">
          {[
            { band: 'morning', label: '🌅 Morning (5–11am)', count: morningTotal },
            { band: 'afternoon', label: '☀️ Afternoon (12–5pm)', count: afternoonTotal },
            { band: 'evening', label: '🌙 Evening (6–10pm)', count: eveningTotal },
          ].map(({ band, label, count }) => (
            <div key={band} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-40 shrink-0">{label}</span>
              <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / grandTotal) * 100}%`,
                    background: HOUR_COLORS[band],
                  }}
                />
              </div>
              <span className="text-xs text-text-secondary w-8 text-right">{count}</span>
            </div>
          ))}
        </div>

        {/* Hourly sparkline */}
        <p className="text-xs text-text-secondary opacity-60 mb-2">Hourly distribution</p>
        <ResponsiveContainer width="100%" height={60}>
          <BarChart
            data={hourPatterns.filter((h) => h.hour >= 5)}
            margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 8 }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} sessions`, '']}
              labelFormatter={(l: string) => l}
            />
            <Bar dataKey="sessions" radius={[2, 2, 0, 0]}>
              {hourPatterns.filter((h) => h.hour >= 5).map((h) => (
                <Cell key={h.hour} fill={HOUR_COLORS[h.band]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly volume */}
      {weekVolumes.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Training Volume</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">Minutes trained per week · last 12 weeks</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekVolumes} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}m`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  name === 'totalMins' ? `${Math.round(v)} min` : `${v}`,
                  name === 'totalMins' ? 'Training time' : 'Sessions',
                ]}
                labelFormatter={(l: string) => `Week ${l}`}
              />
              {avgWeekMins > 0 && (
                <ReferenceLine
                  y={avgWeekMins}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="4 3"
                  label={{ value: `avg ${Math.round(avgWeekMins)}m`, fill: 'rgba(255,255,255,0.3)', fontSize: 9, position: 'right' }}
                />
              )}
              <Bar dataKey="totalMins" radius={[3, 3, 0, 0]}>
                {weekVolumes.map((w, i) => {
                  const isMax = w.totalMins === Math.max(...weekVolumes.map((x) => x.totalMins))
                  const isLast = i === weekVolumes.length - 1
                  return (
                    <Cell
                      key={w.weekLabel}
                      fill={isMax ? 'rgba(249,115,22,0.8)' : isLast ? 'rgba(96,165,250,0.7)' : 'rgba(96,165,250,0.35)'}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400/80 inline-block" /> Peak week</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400/70 inline-block" /> This week</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400/35 inline-block" /> Other weeks</span>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary">Training Pattern Insights</p>
          {insights.map((ins, i) => (
            <div key={i} className="flex gap-2.5">
              <span className={`mt-0.5 shrink-0 text-sm ${ins.type === 'positive' ? 'text-green-400' : ins.type === 'warning' ? 'text-orange-400' : 'text-blue-400'}`}>
                {ins.type === 'positive' ? '✓' : ins.type === 'warning' ? '⚠' : '→'}
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalSessions} workouts analysed · last 90 days
      </p>
    </div>
  )
}
