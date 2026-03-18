import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

function workoutIcon(type: string) {
  return WORKOUT_ICONS[type] ?? '⚡'
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatPace(secsPerKm: number) {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: workout } = await supabase
    .from('workout_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workout) notFound()

  // Find personal bests for this workout type
  const { data: sameType } = await supabase
    .from('workout_records')
    .select('id, duration_minutes, distance_meters, active_calories')
    .eq('user_id', user.id)
    .eq('workout_type', workout.workout_type)
    .lt('start_time', workout.start_time) // only prior workouts

  const pbs: string[] = []
  if (sameType && sameType.length > 0) {
    const maxDuration = Math.max(...sameType.map((w) => w.duration_minutes ?? 0))
    const maxDistance = Math.max(...sameType.map((w) => w.distance_meters ?? 0))
    const maxCalories = Math.max(...sameType.map((w) => w.active_calories ?? 0))
    if (workout.duration_minutes > maxDuration) pbs.push('Longest session')
    if (workout.distance_meters > 0 && workout.distance_meters > maxDistance) pbs.push('Furthest distance')
    if (workout.active_calories > 0 && workout.active_calories > maxCalories) pbs.push('Most calories')
  }

  const startDate = new Date(workout.start_time)

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Duration', value: formatDuration(workout.duration_minutes) },
  ]
  if (workout.active_calories > 0) {
    stats.push({ label: 'Active Calories', value: `${Math.round(workout.active_calories)} kcal` })
  }
  if (workout.total_calories > 0) {
    stats.push({ label: 'Total Calories', value: `${Math.round(workout.total_calories)} kcal` })
  }
  if (workout.distance_meters > 0) {
    stats.push({ label: 'Distance', value: `${(workout.distance_meters / 1000).toFixed(2)} km` })
  }
  if (workout.avg_pace_per_km > 0) {
    stats.push({ label: 'Avg Pace', value: formatPace(workout.avg_pace_per_km) })
  }
  if (workout.avg_heart_rate > 0) {
    stats.push({ label: 'Avg Heart Rate', value: `${workout.avg_heart_rate} bpm` })
  }
  if (workout.max_heart_rate > 0) {
    stats.push({ label: 'Max Heart Rate', value: `${workout.max_heart_rate} bpm` })
  }
  if (workout.elevation_gain_meters > 0) {
    stats.push({ label: 'Elevation Gain', value: `${Math.round(workout.elevation_gain_meters)} m` })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">{workout.workout_type}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Hero */}
        <div className="flex items-center gap-4 p-6 bg-surface rounded-xl border border-border">
          <span className="text-5xl">{workoutIcon(workout.workout_type)}</span>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{workout.workout_type}</h2>
            <p className="text-text-secondary">
              {startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-text-secondary">
              {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
            {pbs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {pbs.map((pb) => (
                  <span key={pb} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-semibold border border-yellow-500/20">
                    🏆 {pb}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3">
              <span className="text-text-secondary text-sm">{label}</span>
              <span className="text-text-primary font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Source */}
        {workout.source && (
          <p className="text-xs text-text-secondary text-center">
            Recorded by {workout.source}
          </p>
        )}
      </main>
    </div>
  )
}
