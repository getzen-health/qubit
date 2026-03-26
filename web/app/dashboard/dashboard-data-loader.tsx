import { Suspense } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { DashboardStream } from './dashboard-stream'
import { WeeklyActivityChart } from '@/components/weekly-activity-chart'
import { ReadinessBanner } from '@/components/ReadinessBanner'
import { ReadinessBannerSkeleton } from '@/components/skeletons'
import Link from 'next/link'

export async function DashboardDataLoader({ user }: { user: User }) {
  const supabase = await createClient()

  const todayStr = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [
    { data: profile, error: profileError },
    { data: summaries },
    { count: weeklyWorkoutCount },
    { data: workoutTimestamps },
    { data: todayWater },
    { data: nutritionSettings },
    { data: activeFast },
    { data: todayMeals },
    { data: recentWorkouts },
    { data: recentSleepRecords },
    { data: insights },
    { data: devices },
    { data: latestPredictionRow },
    { data: latestVo2maxRow },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, step_goal, calorie_goal, sleep_goal_minutes, full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, distance_meters, floors_climbed, exercise_minutes, stand_hours, resting_heart_rate, hrv, sleep_score, recovery_score, strain_score, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false }),
    supabase
      .from('workout_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('start_time', sevenDaysAgo.toISOString()),
    supabase
      .from('workout_records')
      .select('start_time')
      .eq('user_id', user.id)
      .gte('start_time', sixtyDaysAgo.toISOString()),
    supabase
      .from('daily_water')
      .select('total_ml')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .single(),
    supabase
      .from('user_nutrition_settings')
      .select('water_target_ml, calorie_target')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('fasting_sessions')
      .select('id, protocol, target_hours, started_at')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single(),
    supabase
      .from('meals')
      .select('meal_items(calories, servings)')
      .eq('user_id', user.id)
      .gte('logged_at', `${todayStr}T00:00:00`)
      .lt('logged_at', `${todayStr}T23:59:59`),
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
      .select('id, title, content, category, priority, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_devices')
      .select('last_sync_at, device_name')
      .eq('user_id', user.id)
      .order('last_sync_at', { ascending: false })
      .limit(1),
    supabase
      .from('predictions')
      .select('recovery_forecast, performance_window, caution_flags, generated_at')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('vo2max_estimates')
      .select('vo2max')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Failed to load dashboard</h2>
          <p className="text-muted-foreground mt-2">Please refresh the page. If the problem persists, try logging out and back in.</p>
        </div>
      </div>
    )
  }

  const workoutDateSet = new Set(
    (workoutTimestamps ?? []).map((w) => w.start_time.slice(0, 10))
  )
  let workoutStreak = 0
  const checkDate = new Date()
  checkDate.setDate(checkDate.getDate() - 1)
  for (let i = 0; i < 60; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10)
    if (workoutDateSet.has(dateStr)) {
      workoutStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  const todayCaloriesConsumed = (todayMeals ?? []).reduce((sum, m) => {
    const items = (m as { meal_items: Array<{ calories: number; servings: number }> }).meal_items ?? []
    return sum + items.reduce((s: number, it) => s + it.calories * it.servings, 0)
  }, 0)

  const lastSyncAt = devices && devices.length > 0 ? devices[0].last_sync_at : null

  const allSummaries = summaries ?? []
  const latestSummary = allSummaries[0]
  const historySummaries = allSummaries.slice(1)

  const bodyBatteryScore = (() => {
    if (!latestSummary) return null

    const todayHrv = latestSummary.hrv
    const hrvHistory = historySummaries.map((s) => s.hrv).filter((v): v is number => v != null && v > 0)
    const baselineHrv = hrvHistory.length > 0 ? hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length : null

    const todayRhr = latestSummary.resting_heart_rate
    const rhrHistory = historySummaries.map((s) => s.resting_heart_rate).filter((v): v is number => v != null && v > 0)
    const baselineRhr = rhrHistory.length > 0 ? rhrHistory.reduce((a, b) => a + b, 0) / rhrHistory.length : null

    const sleepHistory = historySummaries.map((s) => s.sleep_duration_minutes).filter((v): v is number => v != null && v > 0)
    const baselineSleep = sleepHistory.length > 0 ? sleepHistory.reduce((a, b) => a + b, 0) / sleepHistory.length : null

    if (todayHrv && baselineHrv && baselineHrv > 0) {
      const deviation = (todayHrv - baselineHrv) / baselineHrv
      const hrvScore = Math.max(0, Math.min(100, 50 + deviation * 125))

      let rhrScore = 50
      if (todayRhr && baselineRhr && baselineRhr > 0) {
        const rhrDev = (baselineRhr - todayRhr) / baselineRhr
        rhrScore = Math.max(0, Math.min(100, 50 + rhrDev * 200))
      }

      let sleepScore = 50
      const sleepMins = latestSummary.sleep_duration_minutes ?? 0
      if (sleepMins > 0 && baselineSleep && baselineSleep > 0) {
        const sleepPerf = sleepMins / baselineSleep
        sleepScore = Math.max(0, Math.min(100, Math.min(sleepPerf, 1.2) * 80))
      } else if (sleepMins > 0) {
        sleepScore = Math.max(0, Math.min(100, (sleepMins / (7 * 60)) * 100))
      }

      return Math.round(hrvScore * 0.6 + rhrScore * 0.2 + sleepScore * 0.2)
    }

    const recovery = latestSummary.recovery_score ?? 0
    const sleepMins = latestSummary.sleep_duration_minutes ?? 0
    const sleepQuality = Math.min(100, (sleepMins / (7 * 60)) * 100)
    return Math.round(recovery * 0.6 + sleepQuality * 0.4)
  })()

  const stressScore = (() => {
    if (!latestSummary?.hrv || !historySummaries.length) return null
    const todayHrv = latestSummary.hrv
    const hrvHistory = historySummaries.map((s) => s.hrv).filter((v): v is number => v != null && v > 0)
    if (!hrvHistory.length) return null
    const baseline = hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length
    const deficit = Math.max(0, baseline - todayHrv) / baseline
    return Math.min(100, Math.round(deficit * 250))
  })()

  const hasNoData = allSummaries.length === 0

  // Dashboard summary cards real data
  const sleepHours = (recentSleepRecords?.[0]?.duration_minutes ?? 0) / 60
  const sleepQuality = null // Not available in schema, placeholder
  const workoutCount = recentWorkouts?.length ?? 0
  const workoutMinutes = recentWorkouts?.reduce((s, w) => s + (w.duration_minutes || 0), 0)
  const todayMood = null // Not available in loader, placeholder
  const supplementsTaken = 0 // Not available in loader, placeholder

  return (
    <>
      {hasNoData && (
        <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <Link
            href="/onboarding"
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-accent text-accent-foreground rounded-2xl shadow-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            ⚡ Set up your health profile →
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        import SleepSummaryCard from '@/components/sleep-summary-card'
import WorkoutSummaryCard from '@/components/workout-summary-card'
import MoodSummaryCard from '@/components/mood-summary-card'

<SleepSummaryCard hours={sleepHours} quality={sleepQuality} />
        <WorkoutSummaryCard count={workoutCount} totalMinutes={workoutMinutes} />
        <MoodSummaryCard todayScore={todayMood} />
      </div>
      <DashboardStream
        user={user}
        profile={profile}
        summaries={summaries ?? []}
        recentWorkouts={recentWorkouts ?? []}
        recentSleepRecords={recentSleepRecords ?? []}
        insights={insights ?? []}
        weeklyWorkoutCount={weeklyWorkoutCount ?? 0}
        workoutStreak={workoutStreak}
        dbStepGoal={profile?.step_goal ?? null}
        dbCalGoal={profile?.calorie_goal ?? null}
        dbSleepGoalMinutes={profile?.sleep_goal_minutes ?? null}
        lastSyncAt={lastSyncAt}
        todayWaterMl={todayWater?.total_ml ?? 0}
        waterTargetMl={nutritionSettings?.water_target_ml ?? 2500}
        activeFast={activeFast ?? null}
        todayCaloriesConsumed={Math.round(todayCaloriesConsumed)}
        calorieIntakeTarget={nutritionSettings?.calorie_target ?? 2000}
        bodyBatteryScore={bodyBatteryScore}
        stressScore={stressScore}
        latestPrediction={latestPredictionRow ?? null}
        latestVo2max={latestVo2maxRow?.vo2max ?? null}
        readinessBanner={
          <Suspense fallback={<ReadinessBannerSkeleton />}>
            <ReadinessBanner userId={user.id} />
          </Suspense>
        }
      />
    </>
  )
}
