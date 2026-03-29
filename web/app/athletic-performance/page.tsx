import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import dynamic from 'next/dynamic'
const AthleticPerformanceClient = dynamic(() => import('./athletic-performance-client').then(m => ({ default: m.AthleticPerformanceClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'
import { calculateTrainingMetrics, calculateSessionLoad } from '@/lib/athletic-performance'

export const metadata = { title: 'Athletic Performance' }

export default async function AthleticPerformancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const since = new Date()
  since.setDate(since.getDate() - 90)
  const sinceDate = since.toISOString().slice(0, 10)

  const { data: rows } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceDate)
    .order('date', { ascending: false })

  const sessions = (rows ?? []).map((r) => ({
    id: r.id as string,
    date: r.date as string,
    sport: r.sport as string,
    durationMin: r.duration_min as number,
    rpe: r.rpe as number,
    sessionLoad: r.session_load as number,
    workoutType: r.workout_type as 'easy' | 'moderate' | 'hard' | 'race' | 'recovery',
    heartRateAvg: r.heart_rate_avg as number | undefined,
    heartRateMax: r.heart_rate_max as number | undefined,
    distanceKm: r.distance_km as number | undefined,
    elevationM: r.elevation_m as number | undefined,
    notes: r.notes as string | undefined,
  }))

  const metrics = calculateTrainingMetrics(sessions)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <Trophy className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Athletic Performance</h1>
            <p className="text-sm text-text-secondary">Training load, ATL/CTL/TSB & race predictor</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AthleticPerformanceClient initialSessions={sessions} initialMetrics={metrics} />
      </main>
      <BottomNav />
    </div>
  )
}
