'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DaySummary {
  date: string
  steps: number
  active_calories: number
  sleep_duration_minutes?: number | null
}

type Tab = 'steps' | 'sleep' | 'calories' | 'workouts'

interface Props {
  summaries: DaySummary[]
  workoutDates: string[]
  availableYears: number[]
  initialYear: number
  stepGoal?: number
  calorieGoal?: number
  sleepGoalMinutes?: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

// ── Color helpers ─────────────────────────────────────────────────────────────

function stepsColor(steps: number | null, goal: number): string {
  if (!steps || steps === 0) return 'bg-surface-secondary'
  if (steps >= goal) return 'bg-green-500'
  if (steps >= goal * 0.75) return 'bg-green-500/70'
  if (steps >= goal * 0.5) return 'bg-green-500/40'
  return 'bg-green-500/20'
}

function caloriesColor(cal: number | null, goal: number): string {
  if (!cal || cal === 0) return 'bg-surface-secondary'
  if (cal >= goal) return 'bg-orange-500'
  if (cal >= goal * 0.75) return 'bg-orange-500/70'
  if (cal >= goal * 0.5) return 'bg-orange-500/40'
  return 'bg-orange-500/20'
}

function sleepColor(minutes: number | null, goal: number): string {
  if (!minutes || minutes === 0) return 'bg-surface-secondary'
  if (minutes >= goal) return 'bg-blue-500'
  if (minutes >= goal * 0.875) return 'bg-blue-500/70'
  if (minutes >= goal * 0.75) return 'bg-blue-500/40'
  return 'bg-blue-500/20'
}

function workoutColor(hasWorkout: boolean): string {
  return hasWorkout ? 'bg-purple-500' : 'bg-surface-secondary'
}

function getCellColor(
  tab: Tab,
  day: { steps: number | null; calories: number | null; sleep: number | null; workout: boolean },
  stepGoal: number,
  calorieGoal: number,
  sleepGoalMinutes: number
): string {
  switch (tab) {
    case 'steps': return stepsColor(day.steps, stepGoal)
    case 'calories': return caloriesColor(day.calories, calorieGoal)
    case 'sleep': return sleepColor(day.sleep, sleepGoalMinutes)
    case 'workouts': return workoutColor(day.workout)
  }
}

function getCellTooltip(
  tab: Tab,
  dateStr: string,
  day: { steps: number | null; calories: number | null; sleep: number | null; workout: boolean }
): string {
  switch (tab) {
    case 'steps': return `${dateStr}${day.steps ? `: ${day.steps.toLocaleString()} steps` : ''}`
    case 'calories': return `${dateStr}${day.calories ? `: ${day.calories.toLocaleString()} cal` : ''}`
    case 'sleep': {
      if (!day.sleep) return dateStr
      const h = Math.floor(day.sleep / 60)
      const m = day.sleep % 60
      return `${dateStr}: ${h}h ${m}m sleep`
    }
    case 'workouts': return `${dateStr}${day.workout ? ': workout day' : ''}`
  }
}

// ── Grid builder ──────────────────────────────────────────────────────────────

function buildYearGrid(year: number, dataMap: Map<string, { steps: number; calories: number; sleep: number }>, workoutSet: Set<string>) {
  const jan1 = new Date(year, 0, 1)
  const startSunday = new Date(jan1)
  startSunday.setDate(jan1.getDate() - jan1.getDay())

  const dec31 = new Date(year, 11, 31)
  const endSaturday = new Date(dec31)
  endSaturday.setDate(dec31.getDate() + (6 - dec31.getDay()))

  type Cell = { dateStr: string; steps: number | null; calories: number | null; sleep: number | null; workout: boolean; inYear: boolean }
  const weeks: Cell[][] = []
  const monthStartWeeks: Array<{ month: number; weekIndex: number }> = []

  let current = new Date(startSunday)
  let weekIndex = 0
  let lastMonth = -1

  while (current <= endSaturday) {
    const week: Cell[] = []

    for (let d = 0; d < 7; d++) {
      const y = current.getFullYear()
      const m = current.getMonth()
      const day = current.getDate()
      const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const inYear = y === year

      if (inYear && m !== lastMonth) {
        monthStartWeeks.push({ month: m, weekIndex })
        lastMonth = m
      }

      const data = inYear ? dataMap.get(dateStr) : undefined
      week.push({
        dateStr,
        steps: data ? data.steps : null,
        calories: data ? data.calories : null,
        sleep: data ? data.sleep : null,
        workout: inYear ? workoutSet.has(dateStr) : false,
        inYear,
      })
      current.setDate(current.getDate() + 1)
    }

    weeks.push(week)
    weekIndex++
  }

  return { weeks, monthStartWeeks }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function computeStepStats(yearDays: DaySummary[], stepGoal: number) {
  const goalDays = yearDays.filter((s) => s.steps >= stepGoal).length
  const totalSteps = yearDays.reduce((a, b) => a + b.steps, 0)
  const avgSteps = yearDays.length > 0 ? Math.round(totalSteps / yearDays.length) : 0

  const sorted = [...yearDays].sort((a, b) => a.date.localeCompare(b.date))
  let bestStreak = 0
  let currentStreak = 0
  let prevDate: Date | null = null
  for (const day of sorted) {
    const d = new Date(day.date + 'T12:00:00')
    const isConsecutive = prevDate && (d.getTime() - prevDate.getTime()) === 86400000
    if (day.steps >= stepGoal) {
      currentStreak = isConsecutive ? currentStreak + 1 : 1
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
    prevDate = d
  }

  return [
    { value: goalDays.toString(), label: 'goal days', color: 'text-green-400' },
    { value: avgSteps.toLocaleString(), label: 'avg steps', color: 'text-text-primary' },
    { value: bestStreak.toString(), label: 'best streak', color: 'text-yellow-400' },
  ]
}

function computeCalStats(yearDays: DaySummary[], calorieGoal: number) {
  const withCal = yearDays.filter((s) => s.active_calories > 0)
  const goalDays = withCal.filter((s) => s.active_calories >= calorieGoal).length
  const total = withCal.reduce((a, b) => a + b.active_calories, 0)
  const avg = withCal.length > 0 ? Math.round(total / withCal.length) : 0

  return [
    { value: goalDays.toString(), label: 'goal days', color: 'text-orange-400' },
    { value: avg.toLocaleString(), label: 'avg cal', color: 'text-text-primary' },
    { value: total.toLocaleString(), label: 'total cal', color: 'text-orange-400' },
  ]
}

function computeSleepStats(yearDays: DaySummary[], sleepGoalMinutes: number) {
  const withSleep = yearDays.filter((s) => (s.sleep_duration_minutes ?? 0) > 0)
  const goalNights = withSleep.filter((s) => (s.sleep_duration_minutes ?? 0) >= sleepGoalMinutes).length
  const total = withSleep.reduce((a, b) => a + (b.sleep_duration_minutes ?? 0), 0)
  const avg = withSleep.length > 0 ? Math.round(total / withSleep.length) : 0
  const avgH = Math.floor(avg / 60)
  const avgM = avg % 60

  return [
    { value: goalNights.toString(), label: 'goal nights', color: 'text-blue-400' },
    { value: avg > 0 ? `${avgH}h ${avgM}m` : '—', label: 'avg sleep', color: 'text-text-primary' },
    { value: withSleep.length.toString(), label: 'nights tracked', color: 'text-blue-400' },
  ]
}

function computeWorkoutStats(yearDays: DaySummary[], workoutSet: Set<string>) {
  const yearDates = yearDays.map((s) => s.date)
  const workoutCount = yearDates.filter((d) => workoutSet.has(d)).length
  const months = new Set(yearDates.map((d) => d.slice(0, 7))).size
  const perMonth = months > 0 ? (workoutCount / months).toFixed(1) : '0'

  return [
    { value: workoutCount.toString(), label: 'workouts', color: 'text-purple-400' },
    { value: perMonth, label: 'per month', color: 'text-text-primary' },
    { value: yearDays.length.toString(), label: 'days tracked', color: 'text-purple-400' },
  ]
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend({ tab, goal }: { tab: Tab; goal: number }) {
  if (tab === 'workouts') {
    return (
      <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
        <div className="w-3 h-3 rounded-sm bg-surface-secondary border border-border/50" />
        <span>No workout</span>
        <div className="w-3 h-3 rounded-sm bg-purple-500 ml-2" />
        <span>Workout</span>
      </div>
    )
  }

  const colors = {
    steps: ['bg-green-500/20', 'bg-green-500/40', 'bg-green-500/70', 'bg-green-500'],
    calories: ['bg-orange-500/20', 'bg-orange-500/40', 'bg-orange-500/70', 'bg-orange-500'],
    sleep: ['bg-blue-500/20', 'bg-blue-500/40', 'bg-blue-500/70', 'bg-blue-500'],
  }[tab]

  const label = { steps: 'steps', calories: 'cal', sleep: 'h sleep' }[tab]
  const fmtGoal = tab === 'sleep' ? `${Math.round(goal / 60)}h` : goal.toLocaleString()

  return (
    <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
      <span>Less</span>
      <div className="w-3 h-3 rounded-sm bg-surface-secondary border border-border/50" />
      {colors.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
      <span>{fmtGoal}+ {label}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'steps', label: 'Steps' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'calories', label: 'Calories' },
  { id: 'workouts', label: 'Workouts' },
]

export function YearClient({
  summaries,
  workoutDates,
  availableYears,
  initialYear,
  stepGoal = 10000,
  calorieGoal = 500,
  sleepGoalMinutes = 480,
}: Props) {
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [activeTab, setActiveTab] = useState<Tab>('steps')

  const dataMap = new Map<string, { steps: number; calories: number; sleep: number }>()
  for (const s of summaries) {
    dataMap.set(s.date, {
      steps: s.steps ?? 0,
      calories: s.active_calories ?? 0,
      sleep: s.sleep_duration_minutes ?? 0,
    })
  }

  const workoutSet = new Set(workoutDates)

  const { weeks, monthStartWeeks } = buildYearGrid(selectedYear, dataMap, workoutSet)

  // Stats for selected year
  const yearDays = summaries.filter((s) => s.date.startsWith(`${selectedYear}-`))

  const stats = activeTab === 'steps'
    ? computeStepStats(yearDays, stepGoal)
    : activeTab === 'calories'
    ? computeCalStats(yearDays, calorieGoal)
    : activeTab === 'sleep'
    ? computeSleepStats(yearDays, sleepGoalMinutes)
    : computeWorkoutStats(yearDays, workoutSet)

  const currentGoal = activeTab === 'steps' ? stepGoal : activeTab === 'calories' ? calorieGoal : sleepGoalMinutes

  return (
    <div className="space-y-6">
      {/* Year + Metric selectors */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {availableYears.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setSelectedYear(y)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                y === selectedYear
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
              )}
            >
              {y}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                id === activeTab
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ value, label, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-surface rounded-xl border border-border p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {(() => {
              const cells: React.ReactNode[] = []
              let lastWeek = 0
              for (const { month, weekIndex } of monthStartWeeks) {
                const gap = weekIndex - lastWeek
                if (gap > 0) {
                  cells.push(
                    <div
                      key={`gap-${month}`}
                      style={{ width: `${gap * 14}px` }}
                      className="shrink-0"
                    />
                  )
                }
                cells.push(
                  <div key={month} className="text-xs text-text-secondary shrink-0" style={{ width: '14px' }}>
                    {MONTH_LABELS[month]}
                  </div>
                )
                lastWeek = weekIndex + 1
              }
              return cells
            })()}
          </div>

          {/* Grid: 7 rows (days) x N weeks (columns) */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="h-3 w-6 flex items-center justify-end">
                  <span className="text-[9px] text-text-secondary">{label}</span>
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map(({ dateStr, steps, calories, sleep, workout, inYear }, di) => {
                  if (!inYear) {
                    return <div key={di} className="w-3 h-3" />
                  }
                  const cellData = { steps, calories, sleep, workout }
                  const colorClass = getCellColor(activeTab, cellData, stepGoal, calorieGoal, sleepGoalMinutes)
                  const tooltip = getCellTooltip(activeTab, dateStr, cellData)

                  const hasData = activeTab === 'workouts' ? workout : (
                    activeTab === 'steps' ? (steps ?? 0) > 0 :
                    activeTab === 'calories' ? (calories ?? 0) > 0 :
                    (sleep ?? 0) > 0
                  )

                  return (
                    <Link
                      key={di}
                      href={hasData ? `/day/${dateStr}` : '#'}
                      className={cn(
                        'w-3 h-3 rounded-sm transition-opacity',
                        colorClass,
                        hasData ? 'hover:opacity-75 cursor-pointer' : 'cursor-default pointer-events-none',
                      )}
                      title={tooltip}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <Legend tab={activeTab} goal={currentGoal} />
      </div>
    </div>
  )
}
