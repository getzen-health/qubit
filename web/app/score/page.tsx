import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const HealthScoreClient = dynamic(() => import('./score-client').then(m => ({ default: m.HealthScoreClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Health Score' }

export default async function HealthScorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: profile }, { data: workouts }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, resting_heart_rate, avg_hrv, recovery_score')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('step_goal, calorie_goal, sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
    supabase
      .from('workout_records')
      .select('start_time, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .gt('duration_minutes', 10),
  ])

  const stepGoal = profile?.step_goal ?? 10000
  const calorieGoal = profile?.calorie_goal ?? 500
  const sleepGoalMinutes = profile?.sleep_goal_minutes ?? 480

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-xl font-bold text-text-primary">Health Score</h1>
            <p className="text-sm text-text-secondary">30-day composite · Updated daily</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HealthScoreClient
          summaries={summaries ?? []}
          workouts={workouts ?? []}
          stepGoal={stepGoal}
          calorieGoal={calorieGoal}
          sleepGoalMinutes={sleepGoalMinutes}
        />
      </main>
      <BottomNav />
    </div>
  )
}
