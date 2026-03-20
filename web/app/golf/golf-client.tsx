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
} from 'recharts'

interface GolfRound {
  start_time: string
  duration_minutes: number
  distance_meters?: number | null
  active_calories?: number | null
  avg_heart_rate?: number | null
  step_count?: number | null
}

interface GolfClientProps {
  rounds: GolfRound[]
}

const GREEN = '#22c55e'

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
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function distanceColor(km: number): string {
  if (km < 3) return '#f97316'    // orange
  if (km < 5) return '#eab308'    // yellow
  if (km < 7) return '#6ee7b7'    // mint
  return '#22c55e'                 // green
}

// Build last-12-months labels (Mon YYYY → count)
function buildMonthlyMap(): Map<string, number> {
  const map = new Map<string, number>()
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    map.set(label, 0)
  }
  return map
}

function monthLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function GolfClient({ rounds }: GolfClientProps) {
  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">⛳</span>
        <h2 className="text-lg font-semibold text-text-primary">No golf rounds yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import golf workouts from Apple Health. Start a Golf workout on
          Apple Watch to track rounds automatically.
        </p>
      </div>
    )
  }

  // ── 12-month window ─────────────────────────────────────────────────────────
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const recentRounds = rounds.filter((r) => new Date(r.start_time) >= twelveMonthsAgo)

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalRounds = recentRounds.length

  const roundsWithDist = recentRounds.filter((r) => (r.distance_meters ?? 0) > 0)
  const avgDistKm =
    roundsWithDist.length > 0
      ? roundsWithDist.reduce((s, r) => s + (r.distance_meters ?? 0) / 1000, 0) /
        roundsWithDist.length
      : null

  const roundsWithCal = recentRounds.filter((r) => (r.active_calories ?? 0) > 0)
  const avgCalories =
    roundsWithCal.length > 0
      ? roundsWithCal.reduce((s, r) => s + (r.active_calories ?? 0), 0) / roundsWithCal.length
      : null

  const avgDuration =
    recentRounds.length > 0
      ? recentRounds.reduce((s, r) => s + r.duration_minutes, 0) / recentRounds.length
      : null

  // ── Monthly rounds bar chart ─────────────────────────────────────────────────
  const monthlyMap = buildMonthlyMap()
  for (const r of recentRounds) {
    const label = monthLabel(r.start_time)
    if (monthlyMap.has(label)) {
      monthlyMap.set(label, (monthlyMap.get(label) ?? 0) + 1)
    }
  }
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }))

  // ── Distance per round bar chart ─────────────────────────────────────────────
  const distanceData = roundsWithDist.map((r) => ({
    date: fmtDate(r.start_time),
    distKm: +((r.distance_meters ?? 0) / 1000).toFixed(2),
  }))

  // ── Recent rounds table (last 15) ────────────────────────────────────────────
  const recentTable = [...rounds].reverse().slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: GREEN }}>
            {totalRounds}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Rounds (12 mo)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {avgDistKm !== null ? `${avgDistKm.toFixed(1)} km` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Distance</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {avgCalories !== null ? `${Math.round(avgCalories)} kcal` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Calories</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {avgDuration !== null ? fmtDuration(avgDuration) : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Duration</p>
        </div>
      </div>

      {/* Monthly rounds bar chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Rounds per Month — Last 12 Months
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, 'Rounds']}
            />
            <Bar dataKey="count" fill={GREEN} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distance per round bar chart */}
      {distanceData.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">
            Distance per Round (km)
          </h3>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-3">
            {[
              { color: '#f97316', label: '< 3 km' },
              { color: '#eab308', label: '3–5 km' },
              { color: '#6ee7b7', label: '5–7 km' },
              { color: '#22c55e', label: '> 7 km' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-text-secondary">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: color }}
                />
                {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distanceData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={30}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v.toFixed(2)} km`, 'Distance']}
              />
              <Bar dataKey="distKm" radius={[3, 3, 0, 0]}>
                {distanceData.map((entry, i) => (
                  <Cell key={i} fill={distanceColor(entry.distKm)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent rounds table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-medium text-text-secondary">Recent Rounds</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-secondary font-medium px-4 py-2">
                  Date
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Duration
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Distance
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-3 py-2">
                  Calories
                </th>
                <th className="text-right text-xs text-text-secondary font-medium px-4 py-2">
                  Avg HR
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTable.map((r, i) => {
                const distKm = (r.distance_meters ?? 0) / 1000
                const hasDistance = distKm > 0
                const date = new Date(r.start_time)
                return (
                  <tr
                    key={i}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 1 ? 'bg-surface-secondary/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-text-primary whitespace-nowrap">
                      {date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {fmtDuration(r.duration_minutes)}
                    </td>
                    <td
                      className="px-3 py-2.5 text-right tabular-nums font-medium"
                      style={{ color: hasDistance ? distanceColor(distKm) : undefined }}
                    >
                      {hasDistance ? `${distKm.toFixed(2)} km` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-secondary">
                      {(r.active_calories ?? 0) > 0
                        ? `${Math.round(r.active_calories!)} kcal`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {(r.avg_heart_rate ?? 0) > 0
                        ? `${Math.round(r.avg_heart_rate!)} bpm`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rounds.length > 15 && (
          <p className="text-xs text-text-secondary text-center px-4 py-2">
            Showing 15 of {rounds.length} rounds
          </p>
        )}
      </div>

      {/* Fitness card */}
      <div
        className="rounded-2xl border p-4 space-y-2"
        style={{
          background: 'rgba(34,197,94,0.07)',
          borderColor: 'rgba(34,197,94,0.25)',
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: GREEN }}>
          Golf &amp; Physical Activity
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          A typical 18-hole round involves walking{' '}
          <span className="text-text-primary font-medium">6–8 km</span> and burning{' '}
          <span className="text-text-primary font-medium">400–700 kcal</span>, making golf an
          excellent low-impact form of cardiovascular exercise. Carrying your bag can add 10–20%
          more calorie burn compared to using a cart.
        </p>
      </div>
    </div>
  )
}
