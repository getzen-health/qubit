import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardStream } from './dashboard-stream'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch 30 days of summaries — needed for streak calculation in the client
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // Count workouts this week
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: weeklyWorkoutCount } = await supabase
    .from('workout_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('start_time', sevenDaysAgo.toISOString())

  // Compute workout streak (consecutive days with ≥1 workout, skipping today)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const { data: workoutTimestamps } = await supabase
    .from('workout_records')
    .select('start_time')
    .eq('user_id', user.id)
    .gte('start_time', sixtyDaysAgo.toISOString())
  const workoutDateSet = new Set(
    (workoutTimestamps ?? []).map((w) => w.start_time.slice(0, 10))
  )
  let workoutStreak = 0
  const checkDate = new Date()
  checkDate.setDate(checkDate.getDate() - 1) // start from yesterday
  for (let i = 0; i < 60; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10)
    if (workoutDateSet.has(dateStr)) {
      workoutStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Fetch recent workouts and sleep records for AI insights
  const [{ data: recentWorkouts }, { data: recentSleepRecords }, { data: insights }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('workout_type, duration_minutes, active_calories, avg_heart_rate')
      .eq('user_id', user.id)
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(7),
    supabase
      .from('sleep_records')
      .select('duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(7),
    supabase
      .from('health_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <DashboardStream
      user={user}
      profile={profile}
      summaries={summaries ?? []}
      recentWorkouts={recentWorkouts ?? []}
      recentSleepRecords={recentSleepRecords ?? []}
      insights={insights ?? []}
      weeklyWorkoutCount={weeklyWorkoutCount ?? 0}
      workoutStreak={workoutStreak}
    />
  )
}
