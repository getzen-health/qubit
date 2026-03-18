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

  // Fetch recent insights
  const { data: insights } = await supabase
    .from('health_insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardStream
      user={user}
      profile={profile}
      summaries={summaries ?? []}
      insights={insights ?? []}
      weeklyWorkoutCount={weeklyWorkoutCount ?? 0}
    />
  )
}
