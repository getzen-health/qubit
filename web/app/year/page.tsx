import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { YearClient } from './year-client'

export default async function YearPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: summaries }, { data: workouts }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('workout_records')
      .select('start_time')
      .eq('user_id', user.id),
    supabase
      .from('users')
      .select('step_goal, calorie_goal, sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
  ])

  const rows = summaries ?? []
  const stepGoal = profile?.step_goal ?? 10000
  const calorieGoal = profile?.calorie_goal ?? 500
  const sleepGoalMinutes = profile?.sleep_goal_minutes ?? 480

  // Workout dates set (YYYY-MM-DD)
  const workoutDates = (workouts ?? []).map((w) => w.start_time.slice(0, 10))

  // Find available years from data
  const yearSet = new Set(rows.map((r) => parseInt(r.date.slice(0, 4), 10)))
  const currentYear = new Date().getFullYear()
  yearSet.add(currentYear)
  const availableYears = Array.from(yearSet).sort((a, b) => b - a)

  const totalDays = rows.filter((r) => r.steps > 0 || r.active_calories > 0 || (r.sleep_duration_minutes ?? 0) > 0).length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/steps"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to Steps"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Year View</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0 ? `${totalDays} days tracked` : 'No data yet'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📅</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No data yet</h2>
            <p className="text-sm text-text-secondary">Sync your health data to see your year at a glance.</p>
          </div>
        ) : (
          <YearClient
            summaries={rows}
            workoutDates={workoutDates}
            availableYears={availableYears}
            initialYear={currentYear}
            stepGoal={stepGoal}
            calorieGoal={calorieGoal}
            sleepGoalMinutes={sleepGoalMinutes}
          />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
