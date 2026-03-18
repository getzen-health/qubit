import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { GoalsClient } from './goals-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const [
    { data: profile },
    { data: nutrition },
    { data: summaries },
    { data: waterData },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('step_goal, calorie_goal, sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_nutrition_settings')
      .select('water_target_ml, calorie_target')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
    supabase
      .from('daily_water')
      .select('date, total_ml')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
  ])

  const stepGoal = profile?.step_goal ?? 10000
  const calGoal = profile?.calorie_goal ?? 500
  const sleepGoalMinutes = profile?.sleep_goal_minutes ?? 480
  const waterGoalMl = nutrition?.water_target_ml ?? 2500

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-text-primary">Goals</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <GoalsClient
          stepGoal={stepGoal}
          calGoal={calGoal}
          sleepGoalMinutes={sleepGoalMinutes}
          waterGoalMl={waterGoalMl}
          summaries={summaries ?? []}
          waterData={waterData ?? []}
        />
      </main>
      <BottomNav />
    </div>
  )
}
