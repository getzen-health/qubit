'use client'

import { useState } from 'react'
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
import { cn } from '@/lib/utils'

interface Summary {
  date: string
  steps: number
  active_calories: number
  sleep_duration_minutes?: number
  resting_heart_rate?: number
  avg_hrv?: number
  recovery_score?: number
}

interface Workout {
  start_time: string
  workout_type: string
  active_calories?: number
  duration_minutes?: number
}

interface MonthData {
  key: string      // "2025-03"
  label: string    // "Mar 2025"
  days: number
  avgSteps: number
  avgCalories: number
  avgSleep: number | null  // minutes
  avgHrv: number | null
  avgRecovery: number | null
  workouts: number
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function stepColor(steps: number | undefined): string {
  if (!steps || steps === 0) return 'bg-surface-secondary'
  if (steps >= 10000) return 'bg-green-500'
  if (steps >= 7500) return 'bg-green-500/70'
  if (steps >= 5000) return 'bg-green-500/40'
  return 'bg-green-500/20'
}

function CalendarHeatmap({ summaries }: { summaries: Summary[] }) {
  const dataMap = new Map<string, number>()
  for (const s of summaries) dataMap.set(s.date, s.steps)

  const monthSet = new Set(summaries.map((s) => s.date.slice(0, 7)))
  const months = Array.from(monthSet).sort().reverse()
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? '')

  if (!selectedMonth) return null

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(year, month - 1, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`
    return { dateStr, day, steps: dataMap.get(dateStr) }
  })

  const visibleMonths = months.slice(0, 6)

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-sm font-medium text-text-primary">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          {visibleMonths.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMonth(m)}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                m === selectedMonth
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-surface-secondary',
              )}
            >
              {new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-text-secondary">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(({ dateStr, day, steps }) => {
          const hasData = steps !== undefined
          return (
            <Link
              key={dateStr}
              href={hasData ? `/day/${dateStr}` : '#'}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-opacity',
                stepColor(steps),
                hasData ? 'hover:opacity-80' : 'cursor-default pointer-events-none',
              )}
              title={hasData ? `${dateStr}: ${steps?.toLocaleString()} steps` : dateStr}
            >
              <span className={steps && steps > 0 ? 'text-white' : 'text-text-secondary'}>{day}</span>
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-surface-secondary border border-border" />
        <div className="w-4 h-4 rounded-sm bg-green-500/20" />
        <div className="w-4 h-4 rounded-sm bg-green-500/40" />
        <div className="w-4 h-4 rounded-sm bg-green-500/70" />
        <div className="w-4 h-4 rounded-sm bg-green-500" />
        <span>More</span>
        <span className="ml-2 opacity-60">(tap to view day)</span>
      </div>
    </div>
  )
}

function groupByMonth(summaries: Summary[], workouts: Workout[]): MonthData[] {
  const monthMap = new Map<string, { sums: Summary[]; workouts: number }>()

  for (const s of summaries) {
    const key = s.date.slice(0, 7) // "YYYY-MM"
    if (!monthMap.has(key)) monthMap.set(key, { sums: [], workouts: 0 })
    monthMap.get(key)!.sums.push(s)
  }

  for (const w of workouts) {
    const key = w.start_time.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, { sums: [], workouts: 0 })
    monthMap.get(key)!.workouts++
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { sums, workouts: wCount }]) => {
      const [year, month] = key.split('-').map(Number)
      const label = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const n = sums.length
      const avgSteps = n > 0 ? Math.round(sums.reduce((a, b) => a + b.steps, 0) / n) : 0
      const avgCalories = n > 0 ? Math.round(sums.reduce((a, b) => a + b.active_calories, 0) / n) : 0

      const sleepDays = sums.filter((s) => (s.sleep_duration_minutes ?? 0) > 0)
      const avgSleep = sleepDays.length > 0
        ? Math.round(sleepDays.reduce((a, b) => a + (b.sleep_duration_minutes ?? 0), 0) / sleepDays.length)
        : null

      const hrvDays = sums.filter((s) => (s.avg_hrv ?? 0) > 0)
      const avgHrv = hrvDays.length > 0
        ? Math.round(hrvDays.reduce((a, b) => a + (b.avg_hrv ?? 0), 0) / hrvDays.length)
        : null

      const recDays = sums.filter((s) => (s.recovery_score ?? 0) > 0)
      const avgRecovery = recDays.length > 0
        ? Math.round(recDays.reduce((a, b) => a + (b.recovery_score ?? 0), 0) / recDays.length)
        : null

      return { key, label, days: n, avgSteps, avgCalories, avgSleep, avgHrv, avgRecovery, workouts: wCount }
    })
}

function fmt(min: number) {
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

interface Props {
  summaries: Summary[]
  workouts: Workout[]
}

export function MonthlyClient({ summaries, workouts }: Props) {
  const months = groupByMonth(summaries, workouts)

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">📅</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No data yet</h2>
        <p className="text-sm text-text-secondary">Sync your health data to see monthly stats.</p>
      </div>
    )
  }

  const tickStyle = { fontSize: 10, fill: 'var(--color-text-secondary, #888)' }

  return (
    <div className="space-y-6">
      {/* Calendar Heatmap */}
      <CalendarHeatmap summaries={summaries} />

      {/* Steps chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Avg Daily Steps</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} interval={0} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Avg steps']} />
            <ReferenceLine y={10000} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
            <Bar dataKey="avgSteps" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep chart */}
      {months.some((m) => m.avgSleep !== null) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Avg Sleep (hours)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} interval={0} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${(v / 60).toFixed(1)}h`, 'Avg sleep']} />
              <ReferenceLine y={480} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Bar dataKey="avgSleep" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recovery chart */}
      {months.some((m) => m.avgRecovery !== null) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Avg Recovery Score</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={months} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} interval={0} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Avg recovery']} />
              <ReferenceLine y={67} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
              <Bar
                dataKey="avgRecovery"
                radius={[3, 3, 0, 0]}
                fill="#10b981"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month cards — show most recent first */}
      <div className="space-y-3">
        {[...months].reverse().map((m) => (
          <div key={m.key} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">{m.label}</h3>
              <span className="text-xs text-text-secondary">{m.days} days</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-base font-bold text-green-400">{m.avgSteps.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">avg steps</p>
              </div>
              <div>
                <p className="text-base font-bold text-orange-400">{m.avgCalories}</p>
                <p className="text-xs text-text-secondary">avg cal</p>
              </div>
              {m.avgSleep !== null ? (
                <div>
                  <p className="text-base font-bold text-blue-400">{fmt(m.avgSleep)}</p>
                  <p className="text-xs text-text-secondary">avg sleep</p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-bold text-text-primary">{m.workouts}</p>
                  <p className="text-xs text-text-secondary">workouts</p>
                </div>
              )}
            </div>
            {(m.avgHrv !== null || m.avgRecovery !== null || m.workouts > 0) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-text-secondary">
                {m.avgRecovery !== null && (
                  <span>
                    Recovery{' '}
                    <span className={m.avgRecovery >= 67 ? 'text-green-400' : m.avgRecovery >= 34 ? 'text-yellow-400' : 'text-red-400'}>
                      {m.avgRecovery}%
                    </span>
                  </span>
                )}
                {m.avgHrv !== null && <span>HRV <span className="text-purple-400">{m.avgHrv} ms</span></span>}
                {m.workouts > 0 && <span>{m.workouts} workouts</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
