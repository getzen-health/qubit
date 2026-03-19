import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { WorkoutCalendarClient } from './calendar-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Calendar' }

export default async function WorkoutCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch 6 months of workouts
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate')
    .eq('user_id', user.id)
    .gte('start_time', sixMonthsAgo.toISOString())
    .order('start_time', { ascending: true })

  // Group by date
  const byDate = new Map<string, Array<{
    id: string
    type: string
    durationMinutes: number
    distanceKm: number | null
    calories: number | null
    avgHr: number | null
  }>>()

  for (const w of workouts ?? []) {
    const date = w.start_time.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push({
      id: w.id,
      type: w.workout_type ?? 'Workout',
      durationMinutes: w.duration_minutes ?? 0,
      distanceKm: w.distance_meters ? w.distance_meters / 1000 : null,
      calories: w.active_calories ?? null,
      avgHr: w.avg_heart_rate ?? null,
    })
  }

  const days = Array.from(byDate.entries()).map(([date, workouts]) => ({ date, workouts }))

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
            <CalendarDays className="w-5 h-5 text-violet-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Training Calendar</h1>
              <p className="text-sm text-text-secondary">
                {days.length > 0 ? `${(workouts ?? []).length} workouts in last 6 months` : 'No workouts yet'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WorkoutCalendarClient days={days} />
      </main>
      <BottomNav />
    </div>
  )
}
