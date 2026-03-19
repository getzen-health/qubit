import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { ImpactClient } from './impact-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Impact on Recovery' }

export default async function WorkoutImpactPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()
  const startDate = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: workouts }, { data: summaries }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, end_time, workout_type, duration_minutes, active_calories, avg_heart_rate')
      .eq('user_id', user.id)
      .gte('start_time', startIso)
      .gt('duration_minutes', 10)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, recovery_score, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .not('avg_hrv', 'is', null)
      .gt('avg_hrv', 0)
      .order('date', { ascending: true }),
  ])

  // Join: for each workout, find the next morning's HRV
  // "next morning" = the daily_summaries row for the day after the workout ends
  const summaryMap = new Map((summaries ?? []).map((s) => [s.date, s]))

  function nextDay(isoDateOrTime: string): string {
    const d = new Date(isoDateOrTime)
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  function workoutEndTime(w: { start_time: string; end_time: string | null; duration_minutes: number }): string {
    if (w.end_time) return w.end_time
    const start = new Date(w.start_time)
    return new Date(start.getTime() + w.duration_minutes * 60000).toISOString()
  }

  function timingLabel(endHour: number): string {
    if (endHour < 11) return 'Morning'
    if (endHour < 17) return 'Afternoon'
    if (endHour < 22) return 'Evening'
    return 'Night'
  }

  interface WorkoutPoint {
    date: string
    workoutType: string
    timing: string
    endHour: number
    durationMinutes: number
    avgHr: number | null
    nextHrv: number
    nextRecovery: number | null
    nextRhr: number | null
    nextSleep: number | null
  }

  const points: WorkoutPoint[] = []

  for (const w of workouts ?? []) {
    const endIso = workoutEndTime(w)
    const endHour = new Date(endIso).getHours()
    const nextDate = nextDay(endIso)
    const next = summaryMap.get(nextDate)
    if (!next?.avg_hrv) continue

    points.push({
      date: w.start_time.slice(0, 10),
      workoutType: w.workout_type,
      timing: timingLabel(endHour),
      endHour,
      durationMinutes: w.duration_minutes,
      avgHr: w.avg_heart_rate ?? null,
      nextHrv: next.avg_hrv!,
      nextRecovery: next.recovery_score ?? null,
      nextRhr: next.resting_heart_rate ?? null,
      nextSleep: next.sleep_duration_minutes ?? null,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Workout Impact</h1>
              <p className="text-sm text-text-secondary">
                {points.length > 0
                  ? `${points.length} workouts with next-day HRV data`
                  : 'How training affects recovery'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ImpactClient points={points} />
      </main>
      <BottomNav />
    </div>
  )
}
