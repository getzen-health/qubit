'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Workout {
  id: string
  workout_type: string
  start_time: string
  duration_minutes: number
  active_calories?: number
  distance_meters?: number
  avg_heart_rate?: number
}

const WORKOUT_ICONS: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Hiking: '🥾',
  Cycling: '🚴',
  Swimming: '🏊',
  'Strength Training': '💪',
  Yoga: '🧘',
  HIIT: '⚡',
  Rowing: '🚣',
  Pilates: '🤸',
  Dance: '💃',
}

function workoutIcon(type: string): string {
  return WORKOUT_ICONS[type] ?? '⚡'
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface WorkoutsListProps {
  workouts: Workout[]
}

// Compute ISO week label "MMM d" for the Monday of each week
function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function WorkoutsList({ workouts }: WorkoutsListProps) {
  const [activeType, setActiveType] = useState<string | null>(null)

  // Unique types that appear in this user's workouts, preserving occurrence order
  const types = Array.from(new Set(workouts.map((w) => w.workout_type)))
  const filtered = activeType ? workouts.filter((w) => w.workout_type === activeType) : workouts

  // 12-week frequency chart (always from full workouts list, not filtered)
  const weekFrequency = (() => {
    const weeks: Map<string, number> = new Map()
    const now = new Date()
    // Seed last 12 weeks with 0 so missing weeks appear
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weeks.set(weekLabel(d), 0)
    }
    for (const w of workouts) {
      const label = weekLabel(new Date(w.start_time))
      if (weeks.has(label)) {
        weeks.set(label, (weeks.get(label) ?? 0) + 1)
      }
    }
    return Array.from(weeks.entries()).map(([week, count]) => ({ week, count }))
  })()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Workouts</h1>
            <p className="text-sm text-text-secondary">{workouts.length} sessions</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 12-week frequency chart */}
        {workouts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Weekly Frequency</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekFrequency} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface, #1a1a1a)',
                    border: '1px solid var(--color-border, #333)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value, 'Workouts']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Type filter chips */}
        {types.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <button
              onClick={() => setActiveType(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeType === null
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(activeType === type ? null : type)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === type
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {workoutIcon(type)} {type}
              </button>
            ))}
          </div>
        )}

        {workouts.length > 0 && (() => {
          const totalMinutes = filtered.reduce((s, w) => s + w.duration_minutes, 0)
          const totalCal = filtered.reduce((s, w) => s + (w.active_calories ?? 0), 0)
          const h = Math.floor(totalMinutes / 60)
          const m = totalMinutes % 60
          return (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Sessions', value: filtered.length.toString() },
                { label: 'Total Time', value: h > 0 ? `${h}h ${m}m` : `${m}m` },
                { label: 'Calories', value: totalCal > 0 ? `${Math.round(totalCal).toLocaleString()} cal` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
                  <p className="text-lg font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )
        })()}
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚡</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No workouts yet</h2>
            <p className="text-sm text-text-secondary">
              Sync your iPhone to import workouts from Apple Health.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.length === 0 ? (
              <p className="text-center text-text-secondary py-12">No {activeType} workouts found.</p>
            ) : (() => {
              // Group by month label
              const groups: { label: string; items: typeof filtered }[] = []
              for (const workout of filtered) {
                const label = new Date(workout.start_time).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                const last = groups[groups.length - 1]
                if (last && last.label === label) {
                  last.items.push(workout)
                } else {
                  groups.push({ label, items: [workout] })
                }
              }
              return groups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">{group.label}</h3>
                  <div className="space-y-2">
                    {group.items.map((workout) => {
                      const date = new Date(workout.start_time)
                      const stats: string[] = [formatDuration(workout.duration_minutes)]
                      if (workout.active_calories && workout.active_calories > 0) {
                        stats.push(`${Math.round(workout.active_calories)} cal`)
                      }
                      if (workout.distance_meters && workout.distance_meters > 0) {
                        stats.push(`${(workout.distance_meters / 1000).toFixed(1)} km`)
                      }
                      if (workout.avg_heart_rate && workout.avg_heart_rate > 0) {
                        stats.push(`${workout.avg_heart_rate} bpm avg`)
                      }
                      return (
                        <Link
                          key={workout.id}
                          href={`/workouts/${workout.id}`}
                          className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors"
                        >
                          <span className="text-3xl">{workoutIcon(workout.workout_type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-text-primary truncate">
                                {workout.workout_type}
                              </span>
                              <span className="text-sm text-text-secondary shrink-0">
                                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary mt-0.5">{stats.join(' · ')}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}
      </main>
    </div>
  )
}
