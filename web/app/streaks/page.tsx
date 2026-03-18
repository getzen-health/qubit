import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { StreaksClient } from './streaks-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Streaks' }

export default async function StreaksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('step_goal, sleep_goal_minutes, calorie_goal')
    .eq('id', user.id)
    .single()

  // 90 days of daily summaries for streak computation
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps, sleep_duration_minutes, active_calories, avg_hrv, recovery_score')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  // 90 days of workout records for workout streak
  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time')
    .eq('user_id', user.id)
    .gte('start_time', ninetyDaysAgo.toISOString())

  // 30 days of mindfulness sessions
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: mindfulness } = await supabase
    .from('health_records')
    .select('start_time, value')
    .eq('user_id', user.id)
    .eq('type', 'mindfulness')
    .gte('start_time', thirtyDaysAgo.toISOString())

  // 90 days of water logs
  const { data: waterLogs } = await supabase
    .from('daily_water')
    .select('date, total_ml')
    .eq('user_id', user.id)
    .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))

  // Nutrition settings for water goal
  const { data: nutritionSettings } = await supabase
    .from('user_nutrition_settings')
    .select('water_target_ml')
    .eq('user_id', user.id)
    .single()

  const workoutDays = new Set((workouts ?? []).map((w) => w.start_time.slice(0, 10)))
  const mindfulnessDays = new Set((mindfulness ?? []).map((m) => m.start_time.slice(0, 10)))

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
            <h1 className="text-xl font-bold text-text-primary">Streaks</h1>
            <p className="text-sm text-text-secondary">Your consistency over time</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StreaksClient
          summaries={summaries ?? []}
          workoutDays={Array.from(workoutDays)}
          mindfulnessDays={Array.from(mindfulnessDays)}
          waterLogs={waterLogs ?? []}
          stepGoal={profile?.step_goal ?? 10000}
          sleepGoalMinutes={profile?.sleep_goal_minutes ?? 480}
          calGoal={profile?.calorie_goal ?? 500}
          waterGoalMl={nutritionSettings?.water_target_ml ?? 2500}
        />
      </main>
      <BottomNav />
    </div>
  )
}
