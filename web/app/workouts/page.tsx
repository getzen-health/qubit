import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkoutsList } from './workouts-list'

export const metadata = { title: 'Workouts' }

export default async function WorkoutsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const [{ data: workouts }, { data: weekWorkouts }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate, avg_pace_per_km')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(30),
    supabase
      .from('workout_records')
      .select('duration_minutes, distance_meters, workout_type')
      .eq('user_id', user.id)
      .gte('start_time', weekStart.toISOString()),
  ])

  const weeklyKm = (weekWorkouts ?? []).reduce((s, w) => s + (w.distance_meters ?? 0) / 1000, 0)
  const weeklyMinutes = (weekWorkouts ?? []).reduce((s, w) => s + (w.duration_minutes ?? 0), 0)
  const weeklyCount = (weekWorkouts ?? []).length

  return (
    <WorkoutsList
      workouts={workouts ?? []}
      weeklyKm={weeklyKm}
      weeklyMinutes={weeklyMinutes}
      weeklyCount={weeklyCount}
    />
  )
}
