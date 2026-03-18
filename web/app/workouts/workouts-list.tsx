'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

export function WorkoutsList({ workouts }: WorkoutsListProps) {
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
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⚡</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No workouts yet</h2>
            <p className="text-sm text-text-secondary">
              Sync your iPhone to import workouts from Apple Health.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.map((workout) => {
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
                <div
                  key={workout.id}
                  className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border"
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
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
