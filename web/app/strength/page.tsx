import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, TrendingUp } from 'lucide-react'
import { StrengthClient } from './strength-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Strength Training' }

export default async function StrengthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()
  const startDate = startIso.slice(0, 10)

  const [{ data: sessions }, { data: summaries }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('start_time, duration_minutes, active_calories, workout_type, avg_heart_rate')
      .eq('user_id', user.id)
      .in('workout_type', ['Strength Training', 'Functional Strength Training', 'Core Training', 'Cross Training', 'Flexibility', 'Mixed Cardio'])
      .gte('start_time', startIso)
      .gt('duration_minutes', 5)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, recovery_score')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true }),
  ])

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Strength Training</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
          <Link
            href="/strength/progression"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Strength progression"
            title="Strength Progression"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link
            href="/strength/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Strength patterns"
            title="Strength Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StrengthClient sessions={sessions ?? []} summaries={summaries ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
