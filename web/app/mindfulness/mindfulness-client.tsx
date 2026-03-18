'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface MindfulSession {
  value: number        // duration in minutes
  start_time: string
  end_time: string
  source?: string | null
}

interface MindfulnessClientProps {
  sessions: MindfulSession[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDur(min: number) {
  const m = Math.round(min)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function MindfulnessClient({ sessions }: MindfulnessClientProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🧘</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No mindfulness data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Use the Apple Watch Mindfulness app or any meditation app that writes to Apple Health to get started.
        </p>
      </div>
    )
  }

  // Daily totals for chart (oldest → newest)
  const dailyMap: Record<string, number> = {}
  for (const s of sessions) {
    const day = s.start_time.slice(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + s.value
  }
  const chartData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({
      date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      minutes: +minutes.toFixed(0),
    }))

  const totalMin = sessions.reduce((s, r) => s + r.value, 0)
  const avgPerDay = chartData.length > 0 ? totalMin / chartData.length : 0
  const longestSession = Math.max(...sessions.map((s) => s.value))
  const daysWithSession = Object.keys(dailyMap).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Time', value: fmtDur(totalMin), color: 'text-purple-400' },
          { label: 'Sessions', value: sessions.length.toString(), color: 'text-text-primary' },
          { label: 'Days Active', value: daysWithSession.toString(), color: 'text-blue-400' },
          { label: 'Avg/Day', value: `${Math.round(avgPerDay)}m`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      {chartData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Daily Minutes</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}m`, 'Mindfulness']}
              />
              <Bar dataKey="minutes" fill="#a78bfa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-2">
        {sessions.map((session, i) => {
          const start = new Date(session.start_time)
          return (
            <div
              key={i}
              className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-text-secondary">
                  {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {session.source ? ` · ${session.source}` : ''}
                </p>
              </div>
              <p className="text-purple-400 font-semibold">{fmtDur(session.value)}</p>
            </div>
          )
        })}
      </div>

      {longestSession > 0 && (
        <p className="text-xs text-text-secondary text-center">
          Longest session: {fmtDur(longestSession)}
        </p>
      )}
    </div>
  )
}
