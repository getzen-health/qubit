'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import type { WorkoutRecovery } from './page'

interface Props {
  recoveries: WorkoutRecovery[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function classifyHRR1(hrr: number): { label: string; color: string; tailwind: string } {
  if (hrr >= 25) return { label: 'Excellent', color: '#22c55e', tailwind: 'text-green-400' }
  if (hrr >= 18) return { label: 'Good', color: '#86efac', tailwind: 'text-green-300' }
  if (hrr >= 12) return { label: 'Normal', color: '#facc15', tailwind: 'text-yellow-400' }
  return { label: 'Poor', color: '#f97316', tailwind: 'text-orange-400' }
}

export function HRRecoveryClient({ recoveries }: Props) {
  if (recoveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">❤️</span>
        <h2 className="text-lg font-semibold text-text-primary">No recovery data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Heart rate recovery is calculated from HR samples in the minutes after your workout ends.
          Sync your health data and ensure workouts have at least 10 minutes of duration.
        </p>
      </div>
    )
  }

  const validHrr1 = recoveries.filter((r) => r.hrr1 !== null)
  const avgHrr1 = validHrr1.length
    ? Math.round(validHrr1.reduce((s, r) => s + r.hrr1!, 0) / validHrr1.length)
    : null

  const validHrr2 = recoveries.filter((r) => r.hrr2 !== null)
  const avgHrr2 = validHrr2.length
    ? Math.round(validHrr2.reduce((s, r) => s + r.hrr2!, 0) / validHrr2.length)
    : null

  const latestHrr1 = validHrr1.length ? validHrr1[validHrr1.length - 1].hrr1! : null
  const classification = latestHrr1 !== null ? classifyHRR1(latestHrr1) : null

  // Trend data for HRR1
  const trendData = validHrr1.map((r) => ({
    date: fmtDate(r.date),
    hrr1: r.hrr1,
    hrr2: r.hrr2,
    workoutType: r.workoutType,
  }))

  // By workout type
  const byType = new Map<string, number[]>()
  for (const r of validHrr1) {
    const type = r.workoutType.replace(/([A-Z])/g, ' $1').trim()
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type)!.push(r.hrr1!)
  }
  const byTypeData = Array.from(byType.entries())
    .map(([type, vals]) => ({
      type: type.length > 12 ? type.slice(0, 12) + '…' : type,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      count: vals.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8)

  // 4-week rolling average
  const rolling: { date: string; rolling: number }[] = []
  const windowSize = 5
  for (let i = 0; i < trendData.length; i++) {
    const slice = trendData.slice(Math.max(0, i - windowSize + 1), i + 1)
    const avg = slice.reduce((s, d) => s + (d.hrr1 ?? 0), 0) / slice.length
    rolling.push({ date: trendData[i].date, rolling: Math.round(avg) })
  }

  // Merge rolling into trend data
  const chartData = trendData.map((d, i) => ({ ...d, rolling: rolling[i]?.rolling }))

  // Recent workouts table
  const recent = [...validHrr1].reverse().slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Hero + classification */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center col-span-2 sm:col-span-1">
          <p className={`text-3xl font-bold ${classification?.tailwind ?? 'text-text-primary'}`}>
            {latestHrr1 !== null ? `${latestHrr1}` : '—'}
          </p>
          <p className="text-xs font-medium text-text-primary mt-0.5">Latest HRR1 (bpm)</p>
          <p className={`text-xs mt-0.5 font-semibold ${classification?.tailwind ?? 'text-text-secondary'}`}>
            {classification?.label ?? '—'}
          </p>
        </div>
        {[
          { label: 'Avg HRR1 (1 min)', value: avgHrr1 !== null ? `${avgHrr1} bpm` : '—', sub: 'higher = fitter' },
          { label: 'Avg HRR2 (2 min)', value: avgHrr2 !== null ? `${avgHrr2} bpm` : '—', sub: 'elite: >40 bpm' },
          { label: 'Workouts Analyzed', value: `${recoveries.length}`, sub: `${validHrr1.length} w/ HRR1` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold text-text-primary">{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Classification guide */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">HRR1 Classification (1-minute recovery)</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { range: '< 12 bpm', label: 'Poor', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { range: '12–17 bpm', label: 'Normal', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            { range: '18–24 bpm', label: 'Good', color: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            { range: '≥ 25 bpm', label: 'Excellent', color: 'text-green-400', bg: 'bg-green-600/15', border: 'border-green-500/30' },
          ].map(({ range, label, color, bg, border }) => (
            <div key={label} className={`rounded-lg border p-2 ${bg} ${border}`}>
              <p className={`text-sm font-semibold ${color}`}>{label}</p>
              <p className="text-xs text-text-secondary mt-0.5">{range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HRR1 trend chart */}
      {trendData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">HRR1 Trend Over Time</h2>
          <p className="text-xs text-text-secondary mb-3">Rising trend = improving cardiovascular fitness</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${v} bpm`,
                  name === 'rolling' ? '5-run avg' : 'HRR1',
                ]}
              />
              <ReferenceLine y={12} stroke="#f97316" strokeDasharray="4 3" strokeOpacity={0.4} />
              <ReferenceLine y={18} stroke="#facc15" strokeDasharray="4 3" strokeOpacity={0.4} />
              <ReferenceLine y={25} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="hrr1"
                stroke="#f87171"
                strokeWidth={1.5}
                dot={{ r: 3, fill: '#f87171' }}
                activeDot={{ r: 5 }}
                name="HRR1"
              />
              <Line
                type="monotone"
                dataKey="rolling"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
                name="rolling"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-400" />Per workout</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-yellow-400" style={{ borderTop: '1px dashed' }} />5-workout avg</div>
          </div>
        </div>
      )}

      {/* HRR by workout type */}
      {byTypeData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-1">Avg HRR1 by Workout Type</h2>
          <p className="text-xs text-text-secondary mb-3">Do high-intensity workouts produce better recovery?</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byTypeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 'auto']}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} bpm`, 'Avg HRR1']}
              />
              <ReferenceLine y={12} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {byTypeData.map((d, i) => (
                  <Cell key={i} fill={classifyHRR1(d.avg).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent workouts table */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Recent Workouts</h2>
        <div className="space-y-0 text-xs">
          <div className="grid grid-cols-5 gap-2 text-text-secondary pb-2 border-b border-border font-medium uppercase tracking-wide text-[10px]">
            <span>Date</span>
            <span>Type</span>
            <span className="text-right">Peak HR</span>
            <span className="text-right">HRR1</span>
            <span className="text-right">Rating</span>
          </div>
          {recent.map((r, i) => {
            const cls = r.hrr1 !== null ? classifyHRR1(r.hrr1) : null
            return (
              <div key={i} className="grid grid-cols-5 gap-2 py-2 border-b border-border/30 last:border-0">
                <span className="text-text-secondary">{fmtDate(r.date)}</span>
                <span className="text-text-primary truncate">
                  {r.workoutType.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-right text-text-primary">{r.peakHr} bpm</span>
                <span className={`text-right font-semibold ${cls?.tailwind ?? 'text-text-secondary'}`}>
                  {r.hrr1 !== null ? `${r.hrr1} bpm` : '—'}
                </span>
                <span className={`text-right ${cls?.tailwind ?? 'text-text-secondary'}`}>
                  {cls?.label ?? '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Education card */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">Understanding Heart Rate Recovery</h2>
        <div className="space-y-2 text-xs text-text-secondary">
          <p>
            <span className="text-red-400 font-medium">HRR1</span> (1-minute recovery) is the drop in heart
            rate during the first minute after stopping exercise. It reflects parasympathetic nervous system
            reactivation — the same system that governs HRV.
          </p>
          <p>
            <span className="text-green-400 font-medium">Scientific significance:</span> An HRR1 ≤ 12 bpm
            is clinically associated with increased cardiovascular mortality risk. Elite athletes typically
            show drops of 30+ bpm in the first minute.
          </p>
          <p>
            <span className="text-yellow-400 font-medium">Training to improve HRR:</span> Zone 2 aerobic
            base training is the most effective way to improve recovery speed. High-intensity intervals
            train the capacity, but steady low-intensity volume builds the engine.
          </p>
          <p className="opacity-60 pt-1">
            HRR is calculated from the peak HR in the last few minutes of your workout vs. HR at 1 and 2
            minutes post-workout. Requires HR monitoring during and immediately after exercise.
          </p>
        </div>
      </div>
    </div>
  )
}
