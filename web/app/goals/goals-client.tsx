'use client'

import Link from 'next/link'
import { Activity, Flame, Moon, Droplets, Settings } from 'lucide-react'

interface DailySummary {
  date: string
  steps: number
  active_calories: number
  sleep_duration_minutes: number | null
}

interface DailyWater {
  date: string
  total_ml: number
}

interface GoalsClientProps {
  stepGoal: number
  calGoal: number
  sleepGoalMinutes: number
  waterGoalMl: number
  summaries: DailySummary[]
  waterData: DailyWater[]
}

// Build a 90-day date array ending today
function buildDateArray(days: number): string[] {
  const arr: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    arr.push(d.toISOString().slice(0, 10))
  }
  return arr
}

// Compute streak (from most recent backwards)
function computeStreak(dates90: string[], metSet: Set<string>): { current: number; best: number; rate: number } {
  // current streak: count backwards from today until broken
  let current = 0
  const todayStr = new Date().toISOString().slice(0, 10)
  for (let i = dates90.length - 1; i >= 0; i--) {
    const d = dates90[i]
    // Skip today if data not yet available (it's still accumulating)
    if (d === todayStr && !metSet.has(d)) break
    if (metSet.has(d)) {
      current++
    } else {
      break
    }
  }

  // best streak: longest consecutive run
  let best = 0
  let run = 0
  for (const d of dates90) {
    if (metSet.has(d)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }

  // completion rate (exclude today as partial)
  const pastDates = dates90.filter((d) => d !== todayStr)
  const metCount = pastDates.filter((d) => metSet.has(d)).length
  const rate = pastDates.length > 0 ? Math.round((metCount / pastDates.length) * 100) : 0

  return { current, best, rate }
}

interface GoalHeatmapProps {
  label: string
  icon: React.ReactNode
  color: string // tailwind color class for met cells
  dates90: string[]
  metSet: Set<string>
  partialSet: Set<string>
  current: number
  best: number
  rate: number
  href: string
}

function GoalHeatmap({
  label, icon, color, dates90, metSet, partialSet, current, best, rate, href,
}: GoalHeatmapProps) {
  // Split into 13 weeks of 7 days (91 days, pad front if needed)
  const padded = [...dates90]
  while (padded.length < 91) padded.unshift('')

  const weeks: string[][] = []
  for (let w = 0; w < 13; w++) {
    weeks.push(padded.slice(w * 7, w * 7 + 7))
  }

  return (
    <Link
      href={href}
      className="block bg-surface rounded-xl border border-border p-4 hover:bg-surface-secondary transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-text-primary">{label}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{rate}%</span> done
          </span>
        </div>
      </div>

      {/* Heatmap grid: columns = weeks, rows = days Mon-Sun */}
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((date, di) => {
              if (!date) {
                return <div key={di} className="w-3.5 h-3.5 rounded-sm bg-transparent" />
              }
              const isMet = metSet.has(date)
              const isPartial = !isMet && partialSet.has(date)
              return (
                <div
                  key={date}
                  title={date}
                  className={`w-3.5 h-3.5 rounded-sm ${
                    isMet
                      ? color
                      : isPartial
                      ? 'bg-accent/20'
                      : 'bg-surface-secondary'
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mt-3">
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{current}</p>
          <p className="text-xs text-text-secondary">day streak</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{best}</p>
          <p className="text-xs text-text-secondary">best streak</p>
        </div>
        <div className="flex-1" />
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{rate}%</p>
          <p className="text-xs text-text-secondary">last 89 days</p>
        </div>
      </div>
    </Link>
  )
}

export function GoalsClient({
  stepGoal,
  calGoal,
  sleepGoalMinutes,
  waterGoalMl,
  summaries,
  waterData,
}: GoalsClientProps) {
  const dates90 = buildDateArray(90)

  // Build lookup maps
  const summaryByDate = new Map(summaries.map((s) => [s.date, s]))
  const waterByDate = new Map(waterData.map((w) => [w.date, w.total_ml]))

  // Steps goal
  const stepMetSet = new Set<string>()
  const stepPartialSet = new Set<string>()
  for (const date of dates90) {
    const s = summaryByDate.get(date)
    if (!s) continue
    if (s.steps >= stepGoal) stepMetSet.add(date)
    else if (s.steps >= stepGoal * 0.5) stepPartialSet.add(date)
  }

  // Calories goal
  const calMetSet = new Set<string>()
  const calPartialSet = new Set<string>()
  for (const date of dates90) {
    const s = summaryByDate.get(date)
    if (!s) continue
    if (s.active_calories >= calGoal) calMetSet.add(date)
    else if (s.active_calories >= calGoal * 0.5) calPartialSet.add(date)
  }

  // Sleep goal
  const sleepMetSet = new Set<string>()
  const sleepPartialSet = new Set<string>()
  for (const date of dates90) {
    const s = summaryByDate.get(date)
    if (!s || !s.sleep_duration_minutes) continue
    if (s.sleep_duration_minutes >= sleepGoalMinutes) sleepMetSet.add(date)
    else if (s.sleep_duration_minutes >= sleepGoalMinutes * 0.7) sleepPartialSet.add(date)
  }

  // Water goal
  const waterMetSet = new Set<string>()
  const waterPartialSet = new Set<string>()
  for (const date of dates90) {
    const ml = waterByDate.get(date)
    if (!ml) continue
    if (ml >= waterGoalMl) waterMetSet.add(date)
    else if (ml >= waterGoalMl * 0.5) waterPartialSet.add(date)
  }

  const stepStats = computeStreak(dates90, stepMetSet)
  const calStats = computeStreak(dates90, calMetSet)
  const sleepStats = computeStreak(dates90, sleepMetSet)
  const waterStats = computeStreak(dates90, waterMetSet)

  const hasAnyData = summaries.length > 0 || waterData.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-secondary">
          90-day goal completion history
        </p>
        <Link
          href="/settings/goals"
          className="flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <Settings className="w-3 h-3" />
          Edit goals
        </Link>
      </div>

      {!hasAnyData && (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-lg mb-1">No data yet</p>
          <p className="text-sm">Sync your Apple Health data to see goal progress here.</p>
        </div>
      )}

      {hasAnyData && (
        <>
          <GoalHeatmap
            label={`Steps · ${stepGoal.toLocaleString()}/day`}
            icon={<Activity className="w-4 h-4 text-green-400" />}
            color="bg-green-500"
            dates90={dates90}
            metSet={stepMetSet}
            partialSet={stepPartialSet}
            current={stepStats.current}
            best={stepStats.best}
            rate={stepStats.rate}
            href="/steps"
          />
          <GoalHeatmap
            label={`Active Calories · ${calGoal}/day`}
            icon={<Flame className="w-4 h-4 text-orange-400" />}
            color="bg-orange-500"
            dates90={dates90}
            metSet={calMetSet}
            partialSet={calPartialSet}
            current={calStats.current}
            best={calStats.best}
            rate={calStats.rate}
            href="/steps"
          />
          <GoalHeatmap
            label={`Sleep · ${(sleepGoalMinutes / 60).toFixed(1)}h/night`}
            icon={<Moon className="w-4 h-4 text-blue-400" />}
            color="bg-blue-500"
            dates90={dates90}
            metSet={sleepMetSet}
            partialSet={sleepPartialSet}
            current={sleepStats.current}
            best={sleepStats.best}
            rate={sleepStats.rate}
            href="/sleep"
          />
          <GoalHeatmap
            label={`Hydration · ${waterGoalMl >= 1000 ? `${(waterGoalMl / 1000).toFixed(1)}L` : `${waterGoalMl}ml`}/day`}
            icon={<Droplets className="w-4 h-4 text-cyan-400" />}
            color="bg-cyan-500"
            dates90={dates90}
            metSet={waterMetSet}
            partialSet={waterPartialSet}
            current={waterStats.current}
            best={waterStats.best}
            rate={waterStats.rate}
            href="/water"
          />
        </>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 pt-2 text-xs text-text-secondary justify-end">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-secondary" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-accent/20" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>Met</span>
        </div>
      </div>
    </div>
  )
}
