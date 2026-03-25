'use client'

import React from 'react'
import Link from 'next/link'

interface ActivityDay {
  date: string
  steps: number
  level: 0 | 1 | 2 | 3 | 4
}

interface ActivityHeatmapProps {
  data: ActivityDay[]
  weeks?: number
}

function ActivityHeatmapComponent({ data, weeks = 12 }: ActivityHeatmapProps) {
  const levelColors = [
    'bg-gray-100 dark:bg-gray-800',
    'bg-green-200 dark:bg-green-900',
    'bg-green-400 dark:bg-green-700',
    'bg-green-500 dark:bg-green-600',
    'bg-green-600 dark:bg-green-500',
  ]

  // Generate grid data for the last N weeks
  const days = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7))

  // Create a map of date to activity level
  const activityMap = new Map(data.map(d => [d.date, d]))

  // Generate weeks array
  const weeksData: ActivityDay[][] = []
  const current = new Date(startDate)

  // Adjust to start from Sunday
  current.setDate(current.getDate() - current.getDay())

  for (let w = 0; w < weeks; w++) {
    const week: ActivityDay[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0]
      const activity = activityMap.get(dateStr)
      week.push({
        date: dateStr,
        steps: activity?.steps ?? 0,
        level: activity?.level ?? 0,
      })
      current.setDate(current.getDate() + 1)
    }
    weeksData.push(week)
  }

  const totalSteps = data.reduce((sum, d) => sum + d.steps, 0)
  const avgSteps = data.length > 0 ? Math.round(totalSteps / data.length) : 0
  const activeDays = data.filter(d => d.level > 0).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Heatmap</h3>
          <p className="text-sm text-gray-500">Last {weeks} weeks of activity</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-gray-900 dark:text-white">{activeDays}</div>
            <div className="text-xs text-gray-500">Active days</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 dark:text-white">{avgSteps.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Avg steps</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2">
          {days.map((day, i) => (
            <div key={i} className="h-3 text-xs text-gray-400 leading-3">{day}</div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeksData.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <Link
                  key={di}
                  href={`/day/${day.date}`}
                  className={`w-3 h-3 rounded-sm ${levelColors[day.level]} transition-colors hover:ring-2 hover:ring-purple-500 cursor-pointer block`}
                  title={`${day.date}: ${day.steps.toLocaleString()} steps`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-gray-500">Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  )
}

function WeeklyComparisonComponent({
  thisWeek,
  lastWeek
}: {
  thisWeek: { steps: number; calories: number; distance: number; activeMinutes: number }
  lastWeek: { steps: number; calories: number; distance: number; activeMinutes: number }
}) {
  const metrics = [
    { label: 'Steps', current: thisWeek.steps, previous: lastWeek.steps, unit: '', icon: '👟' },
    { label: 'Calories', current: thisWeek.calories, previous: lastWeek.calories, unit: 'kcal', icon: '🔥' },
    { label: 'Distance', current: thisWeek.distance, previous: lastWeek.distance, unit: 'km', icon: '📍' },
    { label: 'Active Min', current: thisWeek.activeMinutes, previous: lastWeek.activeMinutes, unit: 'min', icon: '⏱️' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">This Week vs Last Week</h3>
      <p className="text-sm text-gray-500 mb-6">See how you&apos;re progressing</p>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const change = metric.previous > 0
            ? ((metric.current - metric.previous) / metric.previous) * 100
            : 0
          const isPositive = change >= 0

          return (
            <div key={metric.label} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{metric.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {metric.current.toLocaleString()} {metric.unit}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isPositive
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="h-full bg-gray-400 dark:bg-gray-500 transition-all duration-500"
                    style={{ width: `${Math.min((metric.previous / Math.max(metric.current, metric.previous)) * 100, 100)}%` }}
                  />
                  {metric.current > metric.previous && (
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                      style={{ width: `${((metric.current - metric.previous) / Math.max(metric.current, metric.previous)) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Last: {metric.previous.toLocaleString()}</span>
                <span>This: {metric.current.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ActivityHeatmap = React.memo(ActivityHeatmapComponent)
export const WeeklyComparison = React.memo(WeeklyComparisonComponent)
