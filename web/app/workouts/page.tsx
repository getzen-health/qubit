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

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate, avg_pace_per_km')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  return <WorkoutsList workouts={workouts ?? []} />
}
