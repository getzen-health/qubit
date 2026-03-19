import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import { RowingClient } from './rowing-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Rowing' }

export default async function RowingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: sessions } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate, active_calories, max_heart_rate')
    .eq('user_id', user.id)
    .in('workout_type', ['Rowing', 'Indoor Rowing', 'Rowing Machine', 'Sculling'])
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('duration_minutes', 1)
    .order('start_time', { ascending: true })

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
            <h1 className="text-xl font-bold text-text-primary">Rowing</h1>
            <p className="text-sm text-text-secondary">Last 90 days · {sessions?.length ?? 0} sessions</p>
          </div>
          <Link
            href="/rowing/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Rowing patterns"
            title="Rowing Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RowingClient sessions={sessions ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
