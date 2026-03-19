import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarHeart, Layers } from 'lucide-react'
import { HrvClient } from './hrv-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Analysis' }

export default async function HrvPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: sleepRecords }, { data: workoutDays }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, sleep_duration_minutes, recovery_score, active_calories')
      .eq('user_id', user.id)
      .gte('date', since)
      .not('avg_hrv', 'is', null)
      .gt('avg_hrv', 0)
      .order('date', { ascending: true }),
    supabase
      .from('sleep_records')
      .select('end_time, duration_minutes, deep_minutes, rem_minutes')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .gt('duration_minutes', 60)
      .order('start_time', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time, duration_minutes, active_calories')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .gt('duration_minutes', 10)
      .order('start_time', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to heart rate"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">HRV Analysis</h1>
            <p className="text-sm text-text-secondary">
              Heart rate variability · Last 90 days
            </p>
          </div>
          <Link
            href="/hrv/zones"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="HRV recovery zones"
            title="Recovery Zones"
          >
            <Layers className="w-5 h-5" />
          </Link>
          <Link
            href="/hrv/calendar"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="HRV recovery calendar"
            title="Recovery Calendar"
          >
            <CalendarHeart className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HrvClient
          summaries={summaries ?? []}
          sleepRecords={sleepRecords ?? []}
          workoutDays={workoutDays ?? []}
        />
      </main>
      <BottomNav />
    </div>
  )
}
