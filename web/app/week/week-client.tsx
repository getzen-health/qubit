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

interface DaySummary {
  date: string
  steps: number | null
  active_calories: number | null
  distance_meters: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
  floors_climbed: number | null
  active_minutes: number | null
}

interface WorkoutRecord {
  start_time: string
  workout_type: string
  duration_minutes: number | null
  active_calories: number | null
}

interface WeekData {
  days: DaySummary[]
  totalSteps: number
  totalCalories: number
  totalDistanceM: number
  totalFloors: number
  avgSleepMin: number | null
  avgHRV: number | null
  avgRHR: number | null
  avgActiveMin: number | null
  workoutCount: number
  workoutCalories: number
  daysAtStepGoal: number
  nightsWithGoalSleep: number
  workouts: WorkoutRecord[]
}

interface WeekClientProps {
  thisWeek: WeekData
  lastWeek: WeekData
  stepGoal: number
  sleepGoalMin: number
  thisWeekRange: string
  lastWeekRange: string
  daysElapsed: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function pct(thisVal: number | null, lastVal: number | null): number | null {
  if (thisVal === null || lastVal === null || lastVal === 0) return null
  return Math.round(((thisVal - lastVal) / lastVal) * 100)
}

function delta(val: number | null) {
  if (val === null) return null
  return { value: Math.abs(val), up: val >= 0 }
}

function DeltaBadge({ value, up, higherIsBetter = true }: { value: number; up: boolean; higherIsBetter?: boolean }) {
  const positive = higherIsBetter ? up : !up
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
      positive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
    }`}>
      {up ? '+' : '-'}{value}%
    </span>
  )
}

function CompRow({
  label,
  thisVal,
  lastVal,
  format,
  higherIsBetter = true,
  color,
}: {
  label: string
  thisVal: number | null
  lastVal: number | null
  format: (v: number) => string
  higherIsBetter?: boolean
  color: string
}) {
  const d = delta(pct(thisVal, lastVal))
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary">
            {thisVal !== null ? format(thisVal) : '—'}
          </p>
          <p className="text-xs text-text-secondary opacity-60">
            {lastVal !== null ? format(lastVal) : '—'} prev
          </p>
        </div>
        {d && <DeltaBadge value={d.value} up={d.up} higherIsBetter={higherIsBetter} />}
      </div>
    </div>
  )
}

function fmtKm(m: number) {
  return `${(m / 1000).toFixed(1)} km`
}

function fmtSleep(min: number) {
  return `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`
}

function fmtSteps(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`
}

function dayLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
}

export function WeekClient({ thisWeek, lastWeek, stepGoal, sleepGoalMin, thisWeekRange, lastWeekRange, daysElapsed }: WeekClientProps) {
  const hasData = thisWeek.days.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📅</span>
        <h2 className="text-lg font-semibold text-text-primary">No data this week</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync Apple Health data from the iOS app to see your weekly report.
        </p>
      </div>
    )
  }

  // Day-by-day step chart data — both weeks overlaid
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const stepChartData = daysOfWeek.map((day, i) => {
    const thisDay = thisWeek.days.find((d) => new Date(d.date + 'T00:00:00').getDay() === (i + 1) % 7 + (i === 6 ? -6 : 1))
    const lastDay = lastWeek.days.find((d) => {
      const dow = new Date(d.date + 'T00:00:00').getDay()
      return dow === (i + 1) % 7 + (i === 6 ? -6 : 1)
    })
    return {
      day,
      this: thisDay?.steps ?? 0,
      last: lastDay?.steps ?? 0,
    }
  })

  // Overall trend: net positive metrics count
  const comparisons = [
    { val: thisWeek.totalSteps, last: lastWeek.totalSteps, higher: true },
    { val: thisWeek.totalCalories, last: lastWeek.totalCalories, higher: true },
    { val: thisWeek.avgSleepMin, last: lastWeek.avgSleepMin, higher: true },
    { val: thisWeek.avgHRV, last: lastWeek.avgHRV, higher: true },
    { val: thisWeek.avgRHR, last: lastWeek.avgRHR, higher: false },
  ]
  const positiveCount = comparisons.filter(({ val, last, higher }) => {
    if (!val || !last) return false
    return higher ? val >= last : val <= last
  }).length
  const overallUp = positiveCount >= 3

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className={`rounded-xl border p-4 ${overallUp ? 'border-green-500/30 bg-green-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{overallUp ? '📈' : '📉'}</span>
          <div>
            <p className={`font-semibold ${overallUp ? 'text-green-400' : 'text-orange-400'}`}>
              {overallUp ? 'Stronger week' : 'Lighter week'} vs last
            </p>
            <p className="text-sm text-text-secondary">
              {positiveCount} of {comparisons.filter(c => c.val && c.last).length} tracked metrics improved
            </p>
          </div>
        </div>
      </div>

      {/* Consistency */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Consistency This Week</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{thisWeek.daysAtStepGoal}/{daysElapsed}</p>
            <p className="text-xs text-text-secondary mt-0.5">Step goal days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-400">{thisWeek.nightsWithGoalSleep}/{daysElapsed}</p>
            <p className="text-xs text-text-secondary mt-0.5">Sleep goal nights</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">{thisWeek.workoutCount}</p>
            <p className="text-xs text-text-secondary mt-0.5">Workouts</p>
          </div>
        </div>
      </div>

      {/* Step comparison chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">Daily Steps</h2>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> This week</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-text-secondary/30 inline-block" /> Last week</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={stepChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), '']} />
            <Bar dataKey="last" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="this" radius={[3, 3, 0, 0]}>
              {stepChartData.map((d) => (
                <Cell key={d.day} fill={d.this >= stepGoal ? '#4ade80' : 'var(--color-accent, #6366f1)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>Weekly total: <strong className="text-text-primary">{fmtSteps(thisWeek.totalSteps)}</strong></span>
          <span>Prev: {fmtSteps(lastWeek.totalSteps)}</span>
        </div>
      </div>

      {/* Metric comparison table */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-1">This Week vs Last Week</h2>
        <CompRow label="Total Steps" thisVal={thisWeek.totalSteps || null} lastVal={lastWeek.totalSteps || null} format={fmtSteps} color="#4ade80" />
        <CompRow label="Active Calories" thisVal={thisWeek.totalCalories || null} lastVal={lastWeek.totalCalories || null} format={(v) => `${Math.round(v)} kcal`} color="#fb923c" />
        <CompRow label="Distance" thisVal={thisWeek.totalDistanceM || null} lastVal={lastWeek.totalDistanceM || null} format={fmtKm} color="#38bdf8" />
        <CompRow label="Floors Climbed" thisVal={thisWeek.totalFloors || null} lastVal={lastWeek.totalFloors || null} format={(v) => `${Math.round(v)}`} color="#a78bfa" />
        <CompRow label="Avg Sleep" thisVal={thisWeek.avgSleepMin} lastVal={lastWeek.avgSleepMin} format={fmtSleep} color="#818cf8" />
        <CompRow label="Avg HRV" thisVal={thisWeek.avgHRV} lastVal={lastWeek.avgHRV} format={(v) => `${v.toFixed(0)} ms`} color="#8b5cf6" />
        <CompRow label="Resting HR" thisVal={thisWeek.avgRHR} lastVal={lastWeek.avgRHR} format={(v) => `${v.toFixed(0)} bpm`} higherIsBetter={false} color="#ef4444" />
        <CompRow label="Workouts" thisVal={thisWeek.workoutCount} lastVal={lastWeek.workoutCount} format={(v) => `${v}`} color="#f59e0b" />
        <CompRow label="Workout Calories" thisVal={thisWeek.workoutCalories || null} lastVal={lastWeek.workoutCalories || null} format={(v) => `${Math.round(v)} kcal`} color="#f97316" />
      </div>

      {/* Workout list */}
      {thisWeek.workouts.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">This Week&apos;s Workouts</h2>
          <div className="space-y-2">
            {thisWeek.workouts.map((w, i) => {
              const dt = new Date(w.start_time)
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary capitalize">{w.workout_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-text-secondary">
                      {dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right text-sm text-text-secondary">
                    {w.duration_minutes ? `${Math.round(w.duration_minutes)} min` : ''}
                    {w.active_calories ? <span className="ml-2 text-orange-400">{Math.round(w.active_calories)} cal</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
