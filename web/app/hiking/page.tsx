import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, TrendingUp } from 'lucide-react'
import { HikingClient } from './hiking-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Hiking Analytics' }

export default async function HikingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: hikes } = await supabase
    .from('workout_records')
    .select('id, start_time, duration_minutes, distance_meters, avg_heart_rate, elevation_gain_meters, active_calories, avg_pace_per_km')
    .eq('user_id', user.id)
    .eq('workout_type', 'Hiking')
    .gte('start_time', startIso)
    .gt('duration_minutes', 0)
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
            <h1 className="text-xl font-bold text-text-primary">Hiking Analytics</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
          <Link
            href="/hiking/progression"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Hiking progression"
            title="Hiking Progression"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link
            href="/hiking/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Hiking patterns"
            title="Hiking Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HikingClient hikes={hikes ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
