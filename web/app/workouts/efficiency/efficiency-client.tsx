'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

// Colors for the top workout types in the trend chart
const TYPE_COLORS: Record<string, string> = {
  running: '#f97316',
  cycling: '#3b82f6',
  swimming: '#06b6d4',
  hiit: '#ec4899',
  strength: '#ef4444',
  rowing: '#8b5cf6',
  hiking: '#22c55e',
  yoga: '#a78bfa',
  walking: '#84cc16',
  elliptical: '#fb923c',
}

function typeColor(t: string) {
  return TYPE_COLORS[t.toLowerCase()] ?? '#94a3b8'
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export interface TypeStat {
  type: string
  label: string
  sessions: number
  calPerMin: number
  avgDuration: number
  avgCals: number
  avgHr: number | null
}

export interface SessionStat {
  date: string
  type: string
  duration: number
  calories: number
  calPerMin: number
  avgHr: number | null
}

export interface EfficiencyData {
  typeStats: TypeStat[]
  weeklyTrend: Record<string, number | string>[]
  sessions: SessionStat[]
  topTypes: string[]
  totalSessions: number
  totalMins: number
  totalCals: number
  overallCalPerMin: number
}

export function WorkoutEfficiencyClient({ data }: { data: EfficiencyData }) {
  const {
    typeStats,
    weeklyTrend,
    sessions,
    topTypes,
    totalSessions,
    totalMins,
    totalCals,
    overallCalPerMin,
  } = data

  const maxCalPerMin = Math.max(...typeStats.map((t) => t.calPerMin))

  return (
    <div className="space-y-4">

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Sessions',
            value: totalSessions.toString(),
            sub: 'last 6 months',
            color: 'text-orange-400',
          },
          {
            label: 'Total Time',
            value: fmtDuration(totalMins),
            sub: 'across all types',
            color: 'text-blue-400',
          },
          {
            label: 'Calories Burned',
            value: `${Math.round(totalCals / 1000 * 10) / 10}k`,
            sub: 'active kcal',
            color: 'text-red-400',
          },
          {
            label: 'Avg Efficiency',
            value: `${overallCalPerMin.toFixed(1)}`,
            sub: 'kcal / min',
            color: overallCalPerMin >= 8 ? 'text-green-400' : overallCalPerMin >= 5 ? 'text-yellow-400' : 'text-orange-400',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary opacity-70 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Efficiency by type bar chart ─────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">Efficiency by Workout Type</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          Average kcal burned per minute · higher = more intense
        </p>
        <ResponsiveContainer width="100%" height={Math.max(200, typeStats.length * 38)}>
          <BarChart
            data={typeStats}
            layout="vertical"
            margin={{ top: 0, right: 60, bottom: 0, left: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}`}
              unit=" kcal/m"
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [`${v.toFixed(1)} kcal/min`, 'Efficiency']}
              labelFormatter={(l: string) => l}
            />
            <Bar dataKey="calPerMin" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: 'rgba(255,255,255,0.5)', formatter: (v: number) => `${v.toFixed(1)}` }}>
              {typeStats.map((s) => (
                <Cell
                  key={s.type}
                  fill={s.calPerMin === maxCalPerMin ? typeColor(s.type) : `${typeColor(s.type)}66`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Type detail cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {typeStats.map((s, i) => (
          <div key={s.type} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-text-primary">{s.label}</p>
              {i === 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  top
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold ${typeColor(s.type) ? '' : 'text-text-primary'}`}
              style={{ color: typeColor(s.type) }}>
              {s.calPerMin.toFixed(1)}
            </p>
            <p className="text-xs text-text-secondary">kcal/min</p>
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.calPerMin / maxCalPerMin) * 100}%`,
                  background: typeColor(s.type),
                }}
              />
            </div>
            <div className="mt-2 space-y-0.5 text-[10px] text-text-secondary opacity-70">
              <p>{s.sessions} session{s.sessions !== 1 ? 's' : ''} · avg {fmtDuration(s.avgDuration)}</p>
              <p>avg {Math.round(s.avgCals)} kcal{s.avgHr ? ` · ${Math.round(s.avgHr)} bpm` : ''}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Weekly efficiency trend ───────────────────────────────────────── */}
      {weeklyTrend.length >= 4 && topTypes.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Weekly Efficiency Trend</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            kcal/min per week for top workout types · last 12 weeks
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="week"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`${Number(v).toFixed(1)} kcal/min`, name.charAt(0).toUpperCase() + name.slice(1)]}
                labelFormatter={(l: string) => `Week ${l}`}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v: string) => <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>}
              />
              {topTypes.map((t) => (
                <Line
                  key={t}
                  type="monotone"
                  dataKey={t}
                  stroke={typeColor(t)}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top sessions ─────────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-1">Most Efficient Sessions</p>
          <p className="text-xs text-text-secondary opacity-70 mb-3">
            Your highest-intensity workouts by kcal/min
          </p>
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-5 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-primary">{s.type}</p>
                    <p className="text-xs font-bold" style={{ color: typeColor(s.type.toLowerCase()) }}>
                      {s.calPerMin.toFixed(1)} kcal/m
                    </p>
                  </div>
                  <p className="text-[10px] text-text-secondary opacity-70">
                    {fmtDate(s.date)} · {fmtDuration(s.duration)} · {Math.round(s.calories)} kcal
                    {s.avgHr ? ` · ${s.avgHr} bpm` : ''}
                  </p>
                  <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (s.calPerMin / (sessions[0]?.calPerMin ?? 1)) * 100)}%`,
                        background: typeColor(s.type.toLowerCase()),
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── What does this mean ───────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2 text-xs text-text-secondary">
        <p className="font-semibold text-text-primary text-sm">Understanding Efficiency</p>
        <p>
          <span className="text-orange-400 font-medium">kcal/min</span> measures how many active calories
          you burn each minute of a workout — a proxy for exercise intensity.
        </p>
        <p>
          HIIT and running typically score highest (10–15 kcal/min). Strength training and yoga score lower
          (4–7 kcal/min) but provide different physiological benefits not captured by calories alone.
        </p>
        <p>
          Rising efficiency over time in a sport suggests improved fitness — you're burning more energy
          per minute because you can sustain higher intensities.
        </p>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalSessions} workouts analysed · last 6 months
      </p>
    </div>
  )
}
