'use client'

import { useState } from 'react'

interface Workout {
  start_time: string
  duration_minutes: number
  workout_type: string
  active_calories: number | null
}

interface DaySummary {
  date: string
  steps: number | null
  active_calories: number | null
}

interface ActivityCalendarClientProps {
  workouts: Workout[]
  summaries: DaySummary[]
}

const WORKOUT_COLORS: Record<string, string> = {
  Running: '#4ade80',
  Cycling: '#60a5fa',
  Swimming: '#22d3ee',
  Walking: '#a3e635',
  Hiking: '#84cc16',
  'Strength Training': '#f87171',
  'Functional Strength Training': '#ef4444',
  'High Intensity Interval Training': '#fb923c',
  HIIT: '#f97316',
  Yoga: '#c084fc',
  Pilates: '#a78bfa',
  Stretching: '#818cf8',
  Rowing: '#38bdf8',
  Boxing: '#fb923c',
  Tennis: '#facc15',
  Dance: '#f472b6',
}

function getWorkoutColor(type: string): string {
  return WORKOUT_COLORS[type] ?? '#94a3b8'
}

function intensityColor(level: 0 | 1 | 2 | 3 | 4, primaryColor?: string): string {
  if (level === 0) return 'rgba(255,255,255,0.05)'
  if (!primaryColor) {
    // Activity-only (steps)
    const alphas = ['', '0.25', '0.45', '0.65', '0.85']
    return `rgba(96, 165, 250, ${alphas[level]})`
  }
  // Workout day — use workout type color with intensity alpha
  const alphas = ['', '0.3', '0.5', '0.7', '0.9']
  // Parse hex color
  const hex = primaryColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alphas[level]})`
}

function fmtDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function computeStreak(activeDays: Set<string>, today: string): number {
  let streak = 0
  const d = new Date(today + 'T00:00:00')
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!activeDays.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function computeLongestStreak(activeDays: Set<string>): number {
  const sorted = Array.from(activeDays).sort()
  if (sorted.length === 0) return 0
  let longest = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }
  return longest
}

export function ActivityCalendarClient({ workouts, summaries }: ActivityCalendarClientProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Build daily workout map: date → list of workouts
  const dailyWorkouts = new Map<string, Workout[]>()
  for (const w of workouts) {
    const day = w.start_time.slice(0, 10)
    if (!dailyWorkouts.has(day)) dailyWorkouts.set(day, [])
    dailyWorkouts.get(day)!.push(w)
  }

  // Build daily steps map
  const dailySteps = new Map<string, number>()
  for (const s of summaries) {
    if (s.steps && s.steps > 0) dailySteps.set(s.date, s.steps)
  }

  // Build 52-week grid (364 days + today = 365)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  // Start from Sunday of the week 52 weeks ago
  const gridStart = new Date(today)
  gridStart.setDate(gridStart.getDate() - 364)
  // Align to Sunday
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const weeks: string[][] = []
  const cursor = new Date(gridStart)

  while (cursor <= today) {
    const week: string[] = []
    for (let dow = 0; dow < 7; dow++) {
      week.push(cursor.toISOString().slice(0, 10))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  // Compute intensity (0-4) for each day
  const maxCalories = Math.max(
    ...Array.from(dailyWorkouts.values()).map((ws) =>
      ws.reduce((s, w) => s + (w.active_calories ?? 0), 0)
    ),
    1
  )

  function getDayLevel(date: string): 0 | 1 | 2 | 3 | 4 {
    const ws = dailyWorkouts.get(date)
    if (ws && ws.length > 0) {
      const totalCal = ws.reduce((s, w) => s + (w.active_calories ?? 0), 0)
      if (totalCal <= 0) {
        // Has workout but no calorie data — moderate
        return 2
      }
      const pct = totalCal / maxCalories
      if (pct >= 0.7) return 4
      if (pct >= 0.4) return 3
      if (pct >= 0.2) return 2
      return 1
    }
    // Steps-only activity
    const steps = dailySteps.get(date) ?? 0
    if (steps >= 10000) return 1
    return 0
  }

  function getDayPrimaryColor(date: string): string | undefined {
    const ws = dailyWorkouts.get(date)
    if (!ws || ws.length === 0) return undefined
    // Use color of first (highest-cal) workout
    const sorted = [...ws].sort((a, b) => (b.active_calories ?? 0) - (a.active_calories ?? 0))
    return getWorkoutColor(sorted[0].workout_type)
  }

  // Active days set for streaks
  const activeDays = new Set<string>()
  for (const [day, ws] of dailyWorkouts.entries()) {
    if (ws.length > 0) activeDays.add(day)
  }

  const currentStreak = computeStreak(activeDays, todayStr)
  const longestStreak = computeLongestStreak(activeDays)
  const totalWorkoutDays = activeDays.size
  const totalSessions = workouts.length

  // Selected day details
  const selectedWorkouts = selectedDay ? (dailyWorkouts.get(selectedDay) ?? []) : []
  const selectedSteps = selectedDay ? (dailySteps.get(selectedDay) ?? 0) : 0

  // Month labels
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const firstDay = week.find((d) => d <= todayStr)
    if (!firstDay) return
    const month = new Date(firstDay + 'T00:00:00').getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ col, label: new Date(firstDay + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) })
      lastMonth = month
    }
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Current Streak', value: `${currentStreak}d`, sublabel: 'workout days' },
          { label: 'Longest Streak', value: `${longestStreak}d`, sublabel: 'workout days' },
          { label: 'Active Days', value: totalWorkoutDays, sublabel: 'past 365 days' },
          { label: 'Total Sessions', value: totalSessions, sublabel: 'past year' },
        ].map(({ label, value, sublabel }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-black text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{sublabel}</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Workout Activity — Past 12 Months</h3>

        {/* Month labels */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: weeks.length * 14 + 24 }}>
            <div className="flex mb-1 pl-6">
              {weeks.map((_, col) => {
                const found = monthLabels.find((m) => m.col === col)
                return (
                  <div key={col} style={{ width: 14, flexShrink: 0 }}>
                    {found && (
                      <span className="text-[9px] text-text-secondary">{found.label}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Day-of-week labels + grid */}
            <div className="flex gap-0">
              <div className="flex flex-col justify-around mr-1.5" style={{ height: 7 * 14 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="text-[9px] text-text-secondary leading-none">{i % 2 === 1 ? d : ''}</span>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ width: 12, marginRight: 2 }}>
                  {week.map((date) => {
                    const isFuture = date > todayStr
                    const level = isFuture ? 0 : getDayLevel(date)
                    const color = isFuture ? undefined : getDayPrimaryColor(date)
                    const bg = intensityColor(level, color)
                    const isSelected = date === selectedDay
                    return (
                      <div
                        key={date}
                        onClick={() => !isFuture && setSelectedDay(date === selectedDay ? null : date)}
                        title={isFuture ? '' : fmtDateLong(date)}
                        style={{
                          width: 12,
                          height: 12,
                          margin: 1,
                          borderRadius: 2,
                          backgroundColor: bg,
                          cursor: isFuture ? 'default' : 'pointer',
                          outline: isSelected ? '2px solid rgba(255,255,255,0.6)' : 'none',
                          outlineOffset: 1,
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <div
              key={level}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: intensityColor(level, level > 0 ? '#4ade80' : undefined),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-primary mb-3">{fmtDateLong(selectedDay)}</h3>
          {selectedWorkouts.length === 0 && selectedSteps === 0 && (
            <p className="text-sm text-text-secondary">Rest day — no workout recorded.</p>
          )}
          {selectedWorkouts.length === 0 && selectedSteps > 0 && (
            <p className="text-sm text-text-secondary">
              {selectedSteps.toLocaleString()} steps · No workout recorded.
            </p>
          )}
          <div className="space-y-2">
            {selectedWorkouts.map((w, i) => {
              const color = getWorkoutColor(w.workout_type)
              const durationH = Math.floor(w.duration_minutes / 60)
              const durationM = w.duration_minutes % 60
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{w.workout_type}</p>
                    <p className="text-xs text-text-secondary">
                      {durationH > 0 ? `${durationH}h ${durationM}m` : `${durationM}m`}
                      {w.active_calories ? ` · ${Math.round(w.active_calories)} cal` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
            {selectedSteps > 0 && (
              <p className="text-xs text-text-secondary pt-1">{selectedSteps.toLocaleString()} steps</p>
            )}
          </div>
        </div>
      )}

      {/* Workout type legend */}
      {workouts.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Workout Type Colors</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(workouts.map((w) => w.workout_type))).sort().map((type) => (
              <div key={type} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: getWorkoutColor(type) }} />
                <span className="text-text-secondary">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
