import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WeekClient } from './week-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Weekly Report' }

export default async function WeekPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  // Week starts Monday
  const dayOfWeek = now.getDay() // 0=Sun
  const daysFromMon = (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - daysFromMon)
  thisMonday.setHours(0, 0, 0, 0)

  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)

  const fourteenDaysAgo = new Date(lastMonday)

  const [{ data: summaries }, { data: profile }, { data: workouts }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, distance_meters, sleep_duration_minutes, avg_hrv, resting_heart_rate, floors_climbed, active_minutes')
      .eq('user_id', user.id)
      .gte('date', fourteenDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('step_goal, sleep_goal_minutes')
      .eq('id', user.id)
      .single(),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes, active_calories')
      .eq('user_id', user.id)
      .gte('start_time', fourteenDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
  ])

  const stepGoal = profile?.step_goal ?? 10000
  const sleepGoalMin = profile?.sleep_goal_minutes ?? 480

  const thisMondayStr = thisMonday.toISOString().slice(0, 10)
  const lastMondayStr = lastMonday.toISOString().slice(0, 10)

  const thisWeek = (summaries ?? []).filter((s) => s.date >= thisMondayStr)
  const lastWeek = (summaries ?? []).filter((s) => s.date >= lastMondayStr && s.date < thisMondayStr)

  const thisWorkouts = (workouts ?? []).filter((w) => w.start_time >= thisMonday.toISOString())
  const lastWorkouts = (workouts ?? []).filter(
    (w) => w.start_time >= lastMonday.toISOString() && w.start_time < thisMonday.toISOString()
  )

  function sum(arr: typeof summaries, key: keyof (typeof arr)[0]) {
    return (arr ?? []).reduce((s, d) => s + ((d[key] as number | null) ?? 0), 0)
  }
  function avg(arr: typeof summaries, key: keyof (typeof arr)[0]) {
    const vals = (arr ?? []).map((d) => d[key] as number | null).filter((v): v is number => v !== null && v > 0)
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  // Format week ranges for display
  function fmtRange(start: Date, days: number) {
    const end = new Date(start)
    end.setDate(start.getDate() + days - 1)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  }

  const thisWeekRange = fmtRange(thisMonday, daysFromMon + 1) // up to today
  const lastWeekRange = fmtRange(lastMonday, 7)

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
            <h1 className="text-xl font-bold text-text-primary">Weekly Report</h1>
            <p className="text-sm text-text-secondary">{thisWeekRange} vs {lastWeekRange}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WeekClient
          thisWeek={{
            days: thisWeek,
            totalSteps: sum(thisWeek, 'steps'),
            totalCalories: sum(thisWeek, 'active_calories'),
            totalDistanceM: sum(thisWeek, 'distance_meters'),
            totalFloors: sum(thisWeek, 'floors_climbed'),
            avgSleepMin: avg(thisWeek, 'sleep_duration_minutes'),
            avgHRV: avg(thisWeek, 'avg_hrv'),
            avgRHR: avg(thisWeek, 'resting_heart_rate'),
            avgActiveMin: avg(thisWeek, 'active_minutes'),
            workoutCount: thisWorkouts.length,
            workoutCalories: thisWorkouts.reduce((s, w) => s + (w.active_calories ?? 0), 0),
            daysAtStepGoal: thisWeek.filter((d) => (d.steps ?? 0) >= stepGoal).length,
            nightsWithGoalSleep: thisWeek.filter((d) => (d.sleep_duration_minutes ?? 0) >= sleepGoalMin).length,
            workouts: thisWorkouts,
          }}
          lastWeek={{
            days: lastWeek,
            totalSteps: sum(lastWeek, 'steps'),
            totalCalories: sum(lastWeek, 'active_calories'),
            totalDistanceM: sum(lastWeek, 'distance_meters'),
            totalFloors: sum(lastWeek, 'floors_climbed'),
            avgSleepMin: avg(lastWeek, 'sleep_duration_minutes'),
            avgHRV: avg(lastWeek, 'avg_hrv'),
            avgRHR: avg(lastWeek, 'resting_heart_rate'),
            avgActiveMin: avg(lastWeek, 'active_minutes'),
            workoutCount: lastWorkouts.length,
            workoutCalories: lastWorkouts.reduce((s, w) => s + (w.active_calories ?? 0), 0),
            daysAtStepGoal: lastWeek.filter((d) => (d.steps ?? 0) >= stepGoal).length,
            nightsWithGoalSleep: lastWeek.filter((d) => (d.sleep_duration_minutes ?? 0) >= sleepGoalMin).length,
            workouts: lastWorkouts,
          }}
          stepGoal={stepGoal}
          sleepGoalMin={sleepGoalMin}
          thisWeekRange={thisWeekRange}
          lastWeekRange={lastWeekRange}
          daysElapsed={daysFromMon + 1}
        />
      </main>
      <BottomNav />
    </div>
  )
}
