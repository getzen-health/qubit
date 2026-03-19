import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { YearlyWorkoutClient, type MonthStats } from './yearly-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Yearly Training Progress' }

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function YearlyWorkoutsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const currentYear = now.getFullYear()
  const prevYear = currentYear - 1

  // Fetch two full years of workouts
  const twoYearsAgo = new Date(prevYear, 0, 1).toISOString()

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes, distance_meters, active_calories, avg_pace_per_km')
    .eq('user_id', user.id)
    .gte('start_time', twoYearsAgo)
    .not('duration_minutes', 'is', null)
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  // Group by year-month
  const buckets: Record<string, {
    count: number
    distanceM: number
    durationMin: number
    calories: number
    paceSum: number
    paceCount: number
    runCount: number
  }> = {}

  for (const w of workouts ?? []) {
    const d = new Date(w.start_time)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!buckets[key]) {
      buckets[key] = { count: 0, distanceM: 0, durationMin: 0, calories: 0, paceSum: 0, paceCount: 0, runCount: 0 }
    }
    const b = buckets[key]
    b.count++
    b.distanceM += w.distance_meters ?? 0
    b.durationMin += w.duration_minutes ?? 0
    b.calories += w.active_calories ?? 0

    const isRun = (w.workout_type ?? '').toLowerCase().includes('run')
    if (isRun && w.avg_pace_per_km && w.avg_pace_per_km > 0) {
      b.paceSum += w.avg_pace_per_km
      b.paceCount++
      b.runCount++
    } else if (isRun) {
      b.runCount++
    }
  }

  // Build MonthStats for all 24 months
  const months: MonthStats[] = []
  for (const year of [prevYear, currentYear]) {
    for (let m = 0; m < 12; m++) {
      // Don't include future months
      if (year === currentYear && m > now.getMonth()) continue
      const key = `${year}-${String(m + 1).padStart(2, '0')}`
      const b = buckets[key]
      months.push({
        month: key,
        label: `${MONTH_LABELS[m]} '${String(year).slice(2)}`,
        shortLabel: MONTH_LABELS[m],
        year,
        workoutCount: b?.count ?? 0,
        totalDistanceKm: b ? b.distanceM / 1000 : 0,
        totalDurationMin: b?.durationMin ?? 0,
        totalCalories: b?.calories ?? 0,
        avgPaceSecsPerKm: b && b.paceCount > 0 ? b.paceSum / b.paceCount : null,
        runCount: b?.runCount ?? 0,
      })
    }
  }

  const totalWorkouts = months.filter((m) => m.year === currentYear).reduce((s, m) => s + m.workoutCount, 0)

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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Yearly Progress</h1>
            <p className="text-sm text-text-secondary">
              {totalWorkouts > 0 ? `${totalWorkouts} workouts in ${currentYear}` : `${currentYear} vs ${prevYear}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <YearlyWorkoutClient
          months={months}
          currentYear={currentYear}
          prevYear={prevYear}
        />
      </main>
      <BottomNav />
    </div>
  )
}
