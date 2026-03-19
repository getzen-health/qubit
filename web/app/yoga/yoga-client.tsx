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
} from 'recharts'

interface Session {
  id: string
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories?: number | null
  avg_heart_rate?: number | null
}

interface YogaClientProps {
  sessions: Session[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function avgOf(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null && v > 0)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

type PracticeCategory = 'Yoga' | 'Pilates' | 'Mind-Body' | 'Tai Chi'

function categorise(workoutType: string): PracticeCategory {
  const t = workoutType.toLowerCase()
  if (t.includes('pilates')) return 'Pilates'
  if (t.includes('tai')) return 'Tai Chi'
  if (t.includes('mind') || t.includes('qigong') || t.includes('meditation')) return 'Mind-Body'
  return 'Yoga'
}

const CATEGORY_COLORS: Record<PracticeCategory, string> = {
  Yoga: '#a855f7',
  Pilates: '#c084fc',
  'Mind-Body': '#7c3aed',
  'Tai Chi': '#ddd6fe',
}

export function YogaClient({ sessions }: YogaClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🧘</span>
        <h2 className="text-lg font-semibold text-text-primary">No mind-body sessions yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import yoga, pilates, tai chi, and mind-body workouts from Apple
          Health or the Fitness app.
        </p>
      </div>
    )
  }

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, r) => s + r.duration_minutes, 0)
  const totalHours = +(totalMinutes / 60).toFixed(1)
  const avgDuration = Math.round(totalMinutes / totalSessions)
  const avgHr = avgOf(sessions.map((r) => r.avg_heart_rate))

  // ── Weekly sessions (last 13 weeks) ────────────────────────────────────────
  const now = new Date()
  // Align to start of current week (Monday)
  const todayDow = now.getDay() // 0 = Sun
  const daysSinceMonday = (todayDow + 6) % 7
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - daysSinceMonday)
  thisMonday.setHours(0, 0, 0, 0)

  const weeklyCounts: { week: string; sessions: number }[] = []
  for (let w = 12; w >= 0; w--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = sessions.filter((r) => {
      const d = new Date(r.start_time)
      return d >= weekStart && d < weekEnd
    }).length

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeklyCounts.push({ week: label, sessions: count })
  }

  // ── Practice type breakdown ─────────────────────────────────────────────────
  const categoryCounts: Record<PracticeCategory, number> = {
    Yoga: 0,
    Pilates: 0,
    'Mind-Body': 0,
    'Tai Chi': 0,
  }
  sessions.forEach((r) => {
    categoryCounts[categorise(r.workout_type)]++
  })
  const breakdownData = (Object.keys(categoryCounts) as PracticeCategory[])
    .map((cat) => ({ name: cat, count: categoryCounts[cat], fill: CATEGORY_COLORS[cat] }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)

  // ── Recent sessions table ──────────────────────────────────────────────────
  const recent = [...sessions].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{totalSessions}</p>
          <p className="text-xs text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{totalHours}h</p>
          <p className="text-xs text-text-secondary mt-0.5">Total Hours</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-fuchsia-400">{avgDuration} min</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-300">
            {avgHr !== null ? `${Math.round(avgHr)} bpm` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Heart Rate</p>
        </div>
      </div>

      {/* Weekly sessions bar chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-secondary">Weekly Sessions</h3>
          <span className="text-xs text-purple-400 border border-purple-400/30 rounded-full px-2 py-0.5">
            Target: 3/wk
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyCounts} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={20}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Sessions']}
              labelFormatter={(label: string) => `Week of ${label}`}
            />
            <ReferenceLine
              y={3}
              stroke="#a855f7"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{ value: '3/wk', position: 'insideTopRight', fontSize: 10, fill: '#a855f7' }}
            />
            <Bar dataKey="sessions" fill="#a855f7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Practice type breakdown */}
      {breakdownData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Practice Type Breakdown</h3>
          <div className="space-y-3">
            {breakdownData.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-20 shrink-0">{d.name}</span>
                <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((d.count / totalSessions) * 100)}%`,
                      backgroundColor: d.fill,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-text-primary w-8 text-right shrink-0">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs text-text-secondary">
            {breakdownData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: d.fill }}
                />
                {d.name} ({Math.round((d.count / totalSessions) * 100)}%)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-secondary">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">Duration</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">HR</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary">kcal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((r) => {
                const cat = categorise(r.workout_type)
                const color = CATEGORY_COLORS[cat]
                return (
                  <tr key={r.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-text-secondary text-xs">
                      {new Date(r.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color,
                          backgroundColor: color + '22',
                          border: `1px solid ${color}44`,
                        }}
                      >
                        {cat}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary font-medium">
                      {fmtDuration(r.duration_minutes)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-secondary">
                      {r.avg_heart_rate && r.avg_heart_rate > 0 ? `${r.avg_heart_rate} bpm` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-secondary">
                      {r.active_calories && r.active_calories > 0
                        ? Math.round(r.active_calories)
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Science card */}
      <div className="bg-surface rounded-xl border border-purple-500/30 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
              Science & HRV
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Regular yoga practice improves HRV by activating the parasympathetic nervous system.
            Studies show 8–12 weeks of consistent practice can improve HRV by 5–15%.
          </p>
        </div>
      </div>
    </div>
  )
}
