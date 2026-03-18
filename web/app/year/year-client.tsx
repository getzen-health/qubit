'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DaySummary {
  date: string
  steps: number
}

interface Props {
  summaries: DaySummary[]
  availableYears: number[]
  initialYear: number
  stepGoal?: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function stepColor(steps: number | null, goal: number): string {
  if (steps === null || steps === 0) return 'bg-surface-secondary'
  if (steps >= goal) return 'bg-green-500'
  if (steps >= goal * 0.75) return 'bg-green-500/70'
  if (steps >= goal * 0.5) return 'bg-green-500/40'
  return 'bg-green-500/20'
}

function buildYearGrid(year: number, dataMap: Map<string, number>) {
  // Start from first Sunday on or before Jan 1
  const jan1 = new Date(year, 0, 1)
  const startSunday = new Date(jan1)
  startSunday.setDate(jan1.getDate() - jan1.getDay())

  // End on last Saturday on or after Dec 31
  const dec31 = new Date(year, 11, 31)
  const endSaturday = new Date(dec31)
  endSaturday.setDate(dec31.getDate() + (6 - dec31.getDay()))

  const weeks: Array<Array<{ dateStr: string; steps: number | null; inYear: boolean }>> = []
  const monthStartWeeks: Array<{ month: number; weekIndex: number }> = []

  let current = new Date(startSunday)
  let weekIndex = 0
  let lastMonth = -1

  while (current <= endSaturday) {
    const week: Array<{ dateStr: string; steps: number | null; inYear: boolean }> = []

    for (let d = 0; d < 7; d++) {
      const y = current.getFullYear()
      const m = current.getMonth()
      const day = current.getDate()
      const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const inYear = y === year
      const steps = inYear ? (dataMap.get(dateStr) ?? null) : null

      if (inYear && m !== lastMonth && d === 0) {
        monthStartWeeks.push({ month: m, weekIndex })
        lastMonth = m
      } else if (inYear && m !== lastMonth) {
        monthStartWeeks.push({ month: m, weekIndex })
        lastMonth = m
      }

      week.push({ dateStr, steps: inYear ? steps : null, inYear })
      current.setDate(current.getDate() + 1)
    }

    weeks.push(week)
    weekIndex++
  }

  return { weeks, monthStartWeeks }
}

export function YearClient({ summaries, availableYears, initialYear, stepGoal = 10000 }: Props) {
  const [selectedYear, setSelectedYear] = useState(initialYear)

  const dataMap = new Map<string, number>()
  for (const s of summaries) dataMap.set(s.date, s.steps)

  const { weeks, monthStartWeeks } = buildYearGrid(selectedYear, dataMap)

  // Stats for selected year
  const yearDays = summaries.filter((s) => s.date.startsWith(`${selectedYear}-`))
  const goalDays = yearDays.filter((s) => s.steps >= stepGoal).length
  const totalSteps = yearDays.reduce((a, b) => a + b.steps, 0)
  const avgSteps = yearDays.length > 0 ? Math.round(totalSteps / yearDays.length) : 0

  // Best streak
  const sortedDays = [...yearDays].sort((a, b) => a.date.localeCompare(b.date))
  let bestStreak = 0
  let currentStreak = 0
  let prevDate: Date | null = null
  for (const day of sortedDays) {
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

  return (
    <div className="space-y-6">
      {/* Year selector */}
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl border border-border p-3 text-center">
          <p className="text-xl font-bold text-green-400">{goalDays}</p>
          <p className="text-xs text-text-secondary">goal days</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3 text-center">
          <p className="text-xl font-bold text-text-primary">{avgSteps.toLocaleString()}</p>
          <p className="text-xs text-text-secondary">avg steps</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{bestStreak}</p>
          <p className="text-xs text-text-secondary">best streak</p>
        </div>
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
                {week.map(({ dateStr, steps, inYear }, di) => {
                  if (!inYear) {
                    return <div key={di} className="w-3 h-3" />
                  }
                  const hasData = steps !== null && steps > 0
                  return (
                    <Link
                      key={di}
                      href={hasData ? `/day/${dateStr}` : '#'}
                      className={cn(
                        'w-3 h-3 rounded-sm transition-opacity',
                        stepColor(steps, stepGoal),
                        hasData ? 'hover:opacity-75 cursor-pointer' : 'cursor-default pointer-events-none',
                      )}
                      title={`${dateStr}${steps !== null ? `: ${steps.toLocaleString()} steps` : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-surface-secondary border border-border/50" />
          <div className="w-3 h-3 rounded-sm bg-green-500/20" />
          <div className="w-3 h-3 rounded-sm bg-green-500/40" />
          <div className="w-3 h-3 rounded-sm bg-green-500/70" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>{stepGoal.toLocaleString()}+ steps</span>
        </div>
      </div>
    </div>
  )
}
