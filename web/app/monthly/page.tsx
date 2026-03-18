import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MonthlyClient } from './monthly-client'
import { BottomNav } from '@/components/bottom-nav'

export default async function MonthlyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch up to 12 months of daily summaries
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const [{ data: summaries }, { data: workouts }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, active_calories, sleep_duration_minutes, resting_heart_rate, avg_hrv, recovery_score')
      .eq('user_id', user.id)
      .gte('date', oneYearAgo.toISOString().split('T')[0])
      .order('date', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, active_calories, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', oneYearAgo.toISOString())
      .order('start_time', { ascending: true }),
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
            <h1 className="text-xl font-bold text-text-primary">Monthly Stats</h1>
            <p className="text-sm text-text-secondary">Month-by-month breakdown</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MonthlyClient
          summaries={summaries ?? []}
          workouts={workouts ?? []}
        />
      </main>
      <BottomNav />
    </div>
  )
}
