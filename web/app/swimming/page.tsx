import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
const SwimmingClient = dynamic(() => import('./swimming-client').then(m => ({ default: m.SwimmingClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Swimming Analytics' }

export default async function SwimmingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: swims } = await supabase
    .from('workout_records')
    .select('id, start_time, duration_minutes, distance_meters, avg_heart_rate, max_heart_rate, active_calories, elevation_gain_meters')
    .eq('user_id', user.id)
    .eq('workout_type', 'Swimming')
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
            <h1 className="text-xl font-bold text-text-primary">Swimming Analytics</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
          <Link
            href="/swimming/progression"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Swimming progression"
            title="Swimming Progression"
          >
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link
            href="/swimming/patterns"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
            aria-label="Swimming patterns"
            title="Swimming Patterns"
          >
            <BarChart2 className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SwimmingClient swims={swims ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
