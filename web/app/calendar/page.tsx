import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ActivityCalendarClient } from './calendar-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Activity Calendar' }

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Last 365 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 364)
  const startIso = startDate.toISOString().slice(0, 10)

  const [{ data: workouts }, { data: summaries }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('start_time, duration_minutes, workout_type, active_calories')
      .eq('user_id', user.id)
      .gte('start_time', startDate.toISOString())
      .gt('duration_minutes', 5)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories')
      .eq('user_id', user.id)
      .gte('date', startIso)
      .order('date', { ascending: true }),
  ])

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
            <h1 className="text-xl font-bold text-text-primary">Activity Calendar</h1>
            <p className="text-sm text-text-secondary">365-day workout & activity heatmap</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ActivityCalendarClient
          workouts={workouts ?? []}
          summaries={summaries ?? []}
        />
      </main>
      <BottomNav />
    </div>
  )
}
