'use client'

import Link from 'next/link'
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

interface SleepRecord {
  id: string
  start_time: string
  end_time: string
  duration_minutes: number
  awake_minutes?: number
  rem_minutes?: number
  core_minutes?: number
  deep_minutes?: number
  sleep_quality_score?: number
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function stageWidth(minutes: number, total: number) {
  return `${Math.round((minutes / Math.max(total, 1)) * 100)}%`
}

interface SleepPageClientProps {
  records: SleepRecord[]
}

export function SleepPageClient({ records }: SleepPageClientProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🌙</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No sleep data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import sleep data from Apple Health.
        </p>
      </div>
    )
  }

  // Chart data: oldest → newest
  const chartData = [...records].reverse().map((r) => ({
    date: new Date(r.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: +(r.duration_minutes / 60).toFixed(1),
    deep: +((r.deep_minutes ?? 0) / 60).toFixed(2),
    rem: +((r.rem_minutes ?? 0) / 60).toFixed(2),
    core: +((r.core_minutes ?? 0) / 60).toFixed(2),
    awake: +((r.awake_minutes ?? 0) / 60).toFixed(2),
  }))

  // 7-day averages (first 7 records are most recent)
  const recent7 = records.slice(0, 7)
  const avgTotal = Math.round(recent7.reduce((s, r) => s + r.duration_minutes, 0) / Math.max(recent7.length, 1))
  const avgDeep = Math.round(recent7.reduce((s, r) => s + (r.deep_minutes ?? 0), 0) / Math.max(recent7.length, 1))
  const avgRem = Math.round(recent7.reduce((s, r) => s + (r.rem_minutes ?? 0), 0) / Math.max(recent7.length, 1))

  const hasStages = records.some((r) => (r.deep_minutes ?? 0) > 0 || (r.rem_minutes ?? 0) > 0)

  // Sleep schedule consistency (from all records)
  const bedtimeHours = records.map((r) => {
    const t = new Date(r.start_time)
    let h = t.getHours() + t.getMinutes() / 60
    if (h < 12) h += 24 // wrap midnight: 0:30 → 24.5
    return h
  })
  const waketimeHours = records.map((r) => {
    const t = new Date(r.end_time)
    return t.getHours() + t.getMinutes() / 60
  })
  function avgHours(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / arr.length }
  function stdDev(arr: number[], mean: number) {
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length)
  }
  function fmtHourDecimal(h: number) {
    const norm = h % 24
    const hh = Math.floor(norm)
    const mm = Math.round((norm - hh) * 60)
    const period = hh >= 12 ? 'PM' : 'AM'
    const displayH = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh
    return `${displayH}:${mm.toString().padStart(2, '0')} ${period}`
  }
  const avgBed = avgHours(bedtimeHours)
  const avgWake = avgHours(waketimeHours)
  const bedSD = stdDev(bedtimeHours, avgBed) * 60 // in minutes
  const wakeSD = stdDev(waketimeHours, avgWake) * 60
  const consistencyLabel = bedSD < 30 ? 'Very consistent' : bedSD < 60 ? 'Consistent' : bedSD < 90 ? 'Moderate' : 'Variable'
  const consistencyColor = bedSD < 30 ? 'text-green-400' : bedSD < 60 ? 'text-blue-400' : bedSD < 90 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-1">
          {hasStages ? 'Sleep Stages (hours)' : 'Sleep Duration (hours)'}
        </h2>
        {hasStages && (
          <div className="flex gap-3 mb-3 text-xs text-text-secondary">
            <span><span className="text-blue-500">●</span> Deep</span>
            <span><span className="text-purple-500">●</span> REM</span>
            <span><span className="text-blue-300">●</span> Light</span>
            <span><span className="text-orange-400">●</span> Awake</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface, #1a1a1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { deep: 'Deep', rem: 'REM', core: 'Light', awake: 'Awake', hours: 'Total' }
                return [`${value}h`, labels[name] ?? name]
              }}
            />
            <ReferenceLine
              y={8}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 3"
              label={{ value: '8h goal', position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            />
            {hasStages ? (
              <>
                <Bar dataKey="deep" stackId="s" fill="#3b82f6" />
                <Bar dataKey="rem" stackId="s" fill="#a855f7" />
                <Bar dataKey="core" stackId="s" fill="#93c5fd" />
                <Bar dataKey="awake" stackId="s" fill="#fb923c" radius={[3, 3, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="hours" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 7-day averages */}
      {recent7.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">7-Day Average</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Total', value: formatDuration(avgTotal) },
              ...(hasStages ? [
                { label: 'Deep', value: formatDuration(avgDeep) },
                { label: 'REM', value: formatDuration(avgRem) },
              ] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-lg font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep schedule */}
      {records.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Sleep Schedule</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-text-primary">{fmtHourDecimal(avgBed)}</p>
              <p className="text-xs text-text-secondary">Avg Bedtime</p>
              {bedSD > 0 && <p className="text-xs text-text-secondary opacity-60">±{Math.round(bedSD)}m</p>}
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{fmtHourDecimal(avgWake)}</p>
              <p className="text-xs text-text-secondary">Avg Wake</p>
              {wakeSD > 0 && <p className="text-xs text-text-secondary opacity-60">±{Math.round(wakeSD)}m</p>}
            </div>
            <div>
              <p className={`text-lg font-bold ${consistencyColor}`}>{consistencyLabel}</p>
              <p className="text-xs text-text-secondary">Consistency</p>
            </div>
          </div>
        </div>
      )}

      {/* Night list */}
      <div className="space-y-3">
        {records.map((record) => {
          const night = new Date(record.start_time)
          const dayDate = night.toISOString().slice(0, 10)
          const totalWithAwake = record.duration_minutes + (record.awake_minutes ?? 0)
          const showStages = hasStages && ((record.deep_minutes ?? 0) + (record.rem_minutes ?? 0) + (record.core_minutes ?? 0)) > 0

          return (
            <Link key={record.id} href={`/day/${dayDate}`} className="bg-surface rounded-xl border border-border p-4 space-y-3 block hover:bg-surface-secondary transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary">
                    {night.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(record.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' – '}
                    {new Date(record.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-400">
                  {formatDuration(record.duration_minutes)}
                </p>
              </div>

              {showStages && (
                <>
                  {/* Stages bar */}
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    {(record.deep_minutes ?? 0) > 0 && (
                      <div
                        className="bg-blue-500 rounded-l-full"
                        style={{ width: stageWidth(record.deep_minutes!, totalWithAwake) }}
                      />
                    )}
                    {(record.rem_minutes ?? 0) > 0 && (
                      <div
                        className="bg-purple-500"
                        style={{ width: stageWidth(record.rem_minutes!, totalWithAwake) }}
                      />
                    )}
                    {(record.core_minutes ?? 0) > 0 && (
                      <div
                        className="bg-blue-300"
                        style={{ width: stageWidth(record.core_minutes!, totalWithAwake) }}
                      />
                    )}
                    {(record.awake_minutes ?? 0) > 0 && (
                      <div
                        className="bg-orange-400 rounded-r-full"
                        style={{ width: stageWidth(record.awake_minutes!, totalWithAwake) }}
                      />
                    )}
                  </div>

                  {/* Stage labels */}
                  <div className="flex gap-3 text-xs text-text-secondary">
                    {(record.deep_minutes ?? 0) > 0 && (
                      <span><span className="text-blue-400">●</span> Deep {formatDuration(record.deep_minutes!)}</span>
                    )}
                    {(record.rem_minutes ?? 0) > 0 && (
                      <span><span className="text-purple-400">●</span> REM {formatDuration(record.rem_minutes!)}</span>
                    )}
                    {(record.core_minutes ?? 0) > 0 && (
                      <span><span className="text-blue-300">●</span> Light {formatDuration(record.core_minutes!)}</span>
                    )}
                    {(record.awake_minutes ?? 0) > 0 && (
                      <span><span className="text-orange-400">●</span> Awake {formatDuration(record.awake_minutes!)}</span>
                    )}
                  </div>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
