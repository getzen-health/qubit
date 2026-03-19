import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AchievementsClient } from './achievements-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Achievements' }

export type Rarity = 'bronze' | 'silver' | 'gold' | 'legendary'
export type Category = 'steps' | 'workouts' | 'sleep' | 'hrv' | 'activity' | 'streaks'

export interface Achievement {
  id: string
  category: Category
  rarity: Rarity
  icon: string
  title: string
  description: string
  earned: boolean
  progress: number   // 0–1
  progressLabel: string
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const yearStr = oneYearAgo.toISOString().slice(0, 10)

  const [
    { data: summaries },
    { data: workoutRows },
    { data: sleepRows },
  ] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, avg_hrv, sleep_duration_minutes, active_calories')
      .eq('user_id', user.id)
      .gte('date', yearStr)
      .order('date', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes, active_calories, distance_meters')
      .eq('user_id', user.id)
      .gte('start_time', oneYearAgo.toISOString())
      .order('start_time', { ascending: true }),
    supabase
      .from('sleep_records')
      .select('start_time, duration_minutes, deep_minutes, rem_minutes')
      .eq('user_id', user.id)
      .gte('start_time', oneYearAgo.toISOString())
      .gt('duration_minutes', 90)
      .order('start_time', { ascending: true }),
  ])

  const days = summaries ?? []
  const workouts = workoutRows ?? []
  const sleepNights = sleepRows ?? []

  // ── Helper: step streak ───────────────────────────────────────────────────
  const STEP_GOAL = 7500
  const stepDays = days.filter((d) => d.steps && d.steps > 0)
  const stepsSorted = [...stepDays].sort((a, b) => a.date.localeCompare(b.date))

  function longestStepStreak(threshold: number): number {
    let best = 0, cur = 0
    for (const d of stepsSorted) {
      if ((d.steps ?? 0) >= threshold) { cur++; best = Math.max(best, cur) }
      else cur = 0
    }
    return best
  }

  const totalSteps = stepDays.reduce((s, d) => s + (d.steps ?? 0), 0)
  const maxDaySteps = stepDays.reduce((m, d) => Math.max(m, d.steps ?? 0), 0)
  const stepGoalDays = stepDays.filter((d) => (d.steps ?? 0) >= STEP_GOAL).length
  const streak3  = longestStepStreak(STEP_GOAL) >= 3
  const streak7  = longestStepStreak(STEP_GOAL) >= 7
  const streak30 = longestStepStreak(STEP_GOAL) >= 30

  // ── Workout stats ─────────────────────────────────────────────────────────
  const runs = workouts.filter((w) => w.workout_type?.toLowerCase().includes('run'))
  const strengthSessions = workouts.filter((w) =>
    ['strength', 'functional', 'traditional'].some((t) => w.workout_type?.toLowerCase().includes(t))
  )
  const maxCalWorkout = workouts.reduce((m, w) => Math.max(m, w.active_calories ?? 0), 0)
  const totalWorkoutDays = new Set(workouts.map((w) => w.start_time.slice(0, 10))).size
  const totalDistanceKm = workouts.reduce((s, w) => s + (w.distance_meters ?? 0), 0) / 1000

  // ── Sleep stats ───────────────────────────────────────────────────────────
  const SLEEP_GOAL_MIN = 420 // 7 hours
  const sleepDays = days.filter((d) => d.sleep_duration_minutes && d.sleep_duration_minutes > 90)
  const avgSleepMin = sleepDays.length > 0
    ? sleepDays.reduce((s, d) => s + (d.sleep_duration_minutes ?? 0), 0) / sleepDays.length
    : 0

  function longestSleepStreak(): number {
    const sorted = [...sleepDays].sort((a, b) => a.date.localeCompare(b.date))
    let best = 0, cur = 0
    for (const d of sorted) {
      if ((d.sleep_duration_minutes ?? 0) >= SLEEP_GOAL_MIN) { cur++; best = Math.max(best, cur) }
      else cur = 0
    }
    return best
  }
  const sleepStreak7 = longestSleepStreak() >= 7

  // ── HRV stats ─────────────────────────────────────────────────────────────
  const hrvDays = days.filter((d) => d.avg_hrv && d.avg_hrv > 0)
  const last30HRV = [...hrvDays].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  const baseline28 = last30HRV.slice(0, 22)
  const baselineAvg = baseline28.length > 0
    ? baseline28.reduce((s, d) => s + (d.avg_hrv ?? 0), 0) / baseline28.length : 0
  const aboveBaselineDays = last30HRV.filter((d) => baselineAvg > 0 && (d.avg_hrv ?? 0) > baselineAvg).length

  // ── Activity stats ────────────────────────────────────────────────────────
  const maxDayCals = days.reduce((m, d) => Math.max(m, d.active_calories ?? 0), 0)
  const highCalDays = days.filter((d) => (d.active_calories ?? 0) >= 600).length

  // ── Build achievements ────────────────────────────────────────────────────
  const achievements: Achievement[] = [
    // STEPS
    {
      id: 'first_steps',
      category: 'steps', rarity: 'bronze', icon: '🚶',
      title: 'First Steps',
      description: 'Had your step data synced to KQuarks.',
      earned: stepDays.length > 0,
      progress: Math.min(stepDays.length / 1, 1),
      progressLabel: `${stepDays.length} days tracked`,
    },
    {
      id: 'goal_getter',
      category: 'steps', rarity: 'bronze', icon: '🎯',
      title: 'Goal Getter',
      description: 'Hit your 7,500 step daily goal at least once.',
      earned: stepGoalDays >= 1,
      progress: Math.min(stepGoalDays / 1, 1),
      progressLabel: `${stepGoalDays} goal days`,
    },
    {
      id: 'ten_thousander',
      category: 'steps', rarity: 'silver', icon: '💪',
      title: 'Ten-Thousander',
      description: 'Walked 10,000+ steps in a single day.',
      earned: maxDaySteps >= 10000,
      progress: Math.min(maxDaySteps / 10000, 1),
      progressLabel: `Best: ${maxDaySteps.toLocaleString()} steps`,
    },
    {
      id: 'step_streak_3',
      category: 'streaks', rarity: 'bronze', icon: '🔥',
      title: '3-Day Streak',
      description: '3 consecutive days hitting your step goal.',
      earned: streak3,
      progress: Math.min(longestStepStreak(STEP_GOAL) / 3, 1),
      progressLabel: `Best streak: ${longestStepStreak(STEP_GOAL)} days`,
    },
    {
      id: 'step_streak_7',
      category: 'streaks', rarity: 'silver', icon: '⚡',
      title: 'Week Warrior',
      description: '7 consecutive days hitting your step goal.',
      earned: streak7,
      progress: Math.min(longestStepStreak(STEP_GOAL) / 7, 1),
      progressLabel: `Best streak: ${longestStepStreak(STEP_GOAL)} days`,
    },
    {
      id: 'step_streak_30',
      category: 'streaks', rarity: 'gold', icon: '🏆',
      title: 'Month Master',
      description: '30 consecutive days hitting your step goal.',
      earned: streak30,
      progress: Math.min(longestStepStreak(STEP_GOAL) / 30, 1),
      progressLabel: `Best streak: ${longestStepStreak(STEP_GOAL)} days`,
    },
    {
      id: 'million_steps',
      category: 'steps', rarity: 'gold', icon: '🌟',
      title: 'Million Stepper',
      description: 'Logged 1,000,000 total steps in KQuarks.',
      earned: totalSteps >= 1_000_000,
      progress: Math.min(totalSteps / 1_000_000, 1),
      progressLabel: `${(totalSteps / 1000).toFixed(0)}k / 1M steps`,
    },
    // WORKOUTS
    {
      id: 'first_workout',
      category: 'workouts', rarity: 'bronze', icon: '🏋️',
      title: 'First Sweat',
      description: 'Logged your first workout.',
      earned: workouts.length >= 1,
      progress: Math.min(workouts.length / 1, 1),
      progressLabel: `${workouts.length} workouts total`,
    },
    {
      id: 'regular',
      category: 'workouts', rarity: 'silver', icon: '📅',
      title: 'Regular',
      description: '20+ workout days in the past year.',
      earned: totalWorkoutDays >= 20,
      progress: Math.min(totalWorkoutDays / 20, 1),
      progressLabel: `${totalWorkoutDays} / 20 workout days`,
    },
    {
      id: 'dedicated',
      category: 'workouts', rarity: 'gold', icon: '🔥',
      title: 'Dedicated',
      description: '50+ workout days in the past year.',
      earned: totalWorkoutDays >= 50,
      progress: Math.min(totalWorkoutDays / 50, 1),
      progressLabel: `${totalWorkoutDays} / 50 workout days`,
    },
    {
      id: 'runner',
      category: 'workouts', rarity: 'bronze', icon: '🏃',
      title: 'Runner',
      description: 'Completed 10+ running workouts.',
      earned: runs.length >= 10,
      progress: Math.min(runs.length / 10, 1),
      progressLabel: `${runs.length} / 10 runs`,
    },
    {
      id: 'calorie_crusher',
      category: 'workouts', rarity: 'silver', icon: '🔥',
      title: 'Calorie Crusher',
      description: 'Burned 500+ active calories in a single workout.',
      earned: maxCalWorkout >= 500,
      progress: Math.min(maxCalWorkout / 500, 1),
      progressLabel: `Best: ${Math.round(maxCalWorkout)} cal`,
    },
    {
      id: 'iron_person',
      category: 'workouts', rarity: 'gold', icon: '🦾',
      title: 'Iron Person',
      description: '20+ strength training sessions in the past year.',
      earned: strengthSessions.length >= 20,
      progress: Math.min(strengthSessions.length / 20, 1),
      progressLabel: `${strengthSessions.length} / 20 sessions`,
    },
    {
      id: 'distance_runner',
      category: 'workouts', rarity: 'gold', icon: '🗺️',
      title: 'Distance Explorer',
      description: 'Covered 500+ km total across all workouts.',
      earned: totalDistanceKm >= 500,
      progress: Math.min(totalDistanceKm / 500, 1),
      progressLabel: `${totalDistanceKm.toFixed(0)} / 500 km`,
    },
    {
      id: 'century_workouts',
      category: 'workouts', rarity: 'legendary', icon: '🌟',
      title: 'Century Club',
      description: 'Logged 100+ workout days in the past year.',
      earned: totalWorkoutDays >= 100,
      progress: Math.min(totalWorkoutDays / 100, 1),
      progressLabel: `${totalWorkoutDays} / 100 workout days`,
    },
    // SLEEP
    {
      id: 'first_sleep',
      category: 'sleep', rarity: 'bronze', icon: '😴',
      title: 'Rest Tracked',
      description: 'Had sleep data recorded in KQuarks.',
      earned: sleepNights.length > 0,
      progress: Math.min(sleepNights.length / 1, 1),
      progressLabel: `${sleepNights.length} nights tracked`,
    },
    {
      id: 'quality_sleep',
      category: 'sleep', rarity: 'bronze', icon: '🌙',
      title: 'Quality Sleep',
      description: 'Averaged 7+ hours of sleep per night.',
      earned: avgSleepMin >= SLEEP_GOAL_MIN,
      progress: Math.min(avgSleepMin / SLEEP_GOAL_MIN, 1),
      progressLabel: `Avg: ${Math.round(avgSleepMin / 60 * 10) / 10}h / 7h`,
    },
    {
      id: 'sleep_streak_7',
      category: 'sleep', rarity: 'silver', icon: '⭐',
      title: 'Sleep Champion',
      description: '7 consecutive nights with 7+ hours of sleep.',
      earned: sleepStreak7,
      progress: Math.min(longestSleepStreak() / 7, 1),
      progressLabel: `Best streak: ${longestSleepStreak()} nights`,
    },
    {
      id: 'sleep_30',
      category: 'sleep', rarity: 'gold', icon: '🏆',
      title: 'Sleep Veteran',
      description: '30+ nights of sleep tracked with 7h+ average.',
      earned: sleepDays.filter((d) => (d.sleep_duration_minutes ?? 0) >= SLEEP_GOAL_MIN).length >= 30,
      progress: Math.min(sleepDays.filter((d) => (d.sleep_duration_minutes ?? 0) >= SLEEP_GOAL_MIN).length / 30, 1),
      progressLabel: `${sleepDays.filter((d) => (d.sleep_duration_minutes ?? 0) >= SLEEP_GOAL_MIN).length} / 30 nights`,
    },
    // HRV
    {
      id: 'hrv_tracking',
      category: 'hrv', rarity: 'bronze', icon: '💗',
      title: 'HRV Tracker',
      description: 'Recorded HRV data for 7+ days.',
      earned: hrvDays.length >= 7,
      progress: Math.min(hrvDays.length / 7, 1),
      progressLabel: `${hrvDays.length} / 7 days`,
    },
    {
      id: 'recovery_star',
      category: 'hrv', rarity: 'silver', icon: '🌟',
      title: 'Recovery Star',
      description: 'HRV above personal baseline on 10+ of last 30 days.',
      earned: aboveBaselineDays >= 10,
      progress: Math.min(aboveBaselineDays / 10, 1),
      progressLabel: `${aboveBaselineDays} / 10 days above baseline`,
    },
    {
      id: 'baseline_beater',
      category: 'hrv', rarity: 'gold', icon: '🏆',
      title: 'Baseline Beater',
      description: 'HRV above baseline on 20+ of last 30 days.',
      earned: aboveBaselineDays >= 20,
      progress: Math.min(aboveBaselineDays / 20, 1),
      progressLabel: `${aboveBaselineDays} / 20 days`,
    },
    // ACTIVITY
    {
      id: 'calorie_burner',
      category: 'activity', rarity: 'bronze', icon: '🔥',
      title: 'Calorie Burner',
      description: 'Burned 400+ active calories in a single day.',
      earned: maxDayCals >= 400,
      progress: Math.min(maxDayCals / 400, 1),
      progressLabel: `Best day: ${Math.round(maxDayCals)} cal`,
    },
    {
      id: 'high_energy',
      category: 'activity', rarity: 'silver', icon: '⚡',
      title: 'High Energy',
      description: 'Burned 600+ active calories in a day (10+ times).',
      earned: highCalDays >= 10,
      progress: Math.min(highCalDays / 10, 1),
      progressLabel: `${highCalDays} / 10 high-cal days`,
    },
    {
      id: 'calorie_legend',
      category: 'activity', rarity: 'gold', icon: '🌋',
      title: 'Calorie Legend',
      description: 'Burned 1,000+ active calories in a single day.',
      earned: maxDayCals >= 1000,
      progress: Math.min(maxDayCals / 1000, 1),
      progressLabel: `Best day: ${Math.round(maxDayCals)} cal`,
    },
    {
      id: 'data_champion',
      category: 'activity', rarity: 'legendary', icon: '🌟',
      title: 'Data Champion',
      description: 'Tracked health data for 200+ days — fully committed to your health journey.',
      earned: days.length >= 200,
      progress: Math.min(days.length / 200, 1),
      progressLabel: `${days.length} / 200 days tracked`,
    },
  ]

  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Achievements</h1>
            <p className="text-sm text-text-secondary">
              {earnedCount} / {achievements.length} earned
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AchievementsClient achievements={achievements} earnedCount={earnedCount} />
      </main>
      <BottomNav />
    </div>
  )
}
