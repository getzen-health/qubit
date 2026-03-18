import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RacePredictorClient } from './race-predictor-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Race Predictor' }

export default async function RacePredictorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Last 90 days of running workouts with distance and pace
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: runs } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate, max_heart_rate')
    .eq('user_id', user.id)
    .eq('workout_type', 'Running')
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('distance_meters', 500)
    .order('start_time', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Race Predictor</h1>
            <p className="text-sm text-text-secondary">Predicted finish times using Riegel&apos;s formula</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RacePredictorClient runs={runs ?? []} />
      </main>
      <BottomNav />
    </div>
  )
}
