import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Timer, Gauge, TrendingUp } from 'lucide-react'
import { RunningClient } from './running-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Analytics' }

export default async function RunningPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [{ data: runs }, { data: formRecords }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, end_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate')
      .eq('user_id', user.id)
      .eq('workout_type', 'Running')
      .gte('start_time', startIso)
      .gt('distance_meters', 0)
      .order('start_time', { ascending: true }),
    supabase
      .from('health_records')
      .select('type, value, start_time, end_time')
      .eq('user_id', user.id)
      .in('type', [
        'running_cadence',
        'running_stride_length',
        'running_vertical_oscillation',
        'running_ground_contact_time',
        'running_power',
      ])
      .gte('start_time', startIso)
      .order('start_time', { ascending: true }),
  ])

  // For each run, find matching form records (start_time overlaps workout window)
  // Form records are stored with start_time=workoutStart, end_time=workoutEnd
  const runMetrics = (runs ?? []).map((run) => {
    const runStart = run.start_time
    const runEnd = run.end_time ?? new Date(new Date(runStart).getTime() + run.duration_minutes * 60000).toISOString()

    const matching = (formRecords ?? []).filter(
      (r) => r.start_time >= runStart && r.start_time <= runEnd
    )

    function getMetric(type: string) {
      const r = matching.find((m) => m.type === type)
      return r ? r.value : null
    }

    return {
      date: runStart.slice(0, 10),
      durationMinutes: run.duration_minutes,
      distanceKm: (run.distance_meters ?? 0) / 1000,
      paceSecsPerKm: run.avg_pace_per_km,
      heartRate: run.avg_heart_rate,
      cadence: getMetric('running_cadence'),
      strideLength: getMetric('running_stride_length'),
      verticalOscillation: getMetric('running_vertical_oscillation'),
      groundContactTime: getMetric('running_ground_contact_time'),
      power: getMetric('running_power'),
    }
  })

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
            <h1 className="text-xl font-bold text-text-primary">Running Analytics</h1>
            <p className="text-sm text-text-secondary">Last 90 days</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/running/zones" className="text-xs text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-colors flex items-center gap-1">
              <Timer className="w-3 h-3" />Pace Zones
            </Link>
            <Link href="/running/efficiency" className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center gap-1">
              <Gauge className="w-3 h-3" />Efficiency
            </Link>
            <Link href="/running/form" className="text-xs text-green-400 hover:text-green-300 px-3 py-1.5 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors">
              Form Analysis
            </Link>
            <Link href="/running/progression" className="text-xs text-yellow-400 hover:text-yellow-300 px-3 py-1.5 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-colors flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />Progression
            </Link>
            <Link href="/race-predictor" className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              Race Predictor
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RunningClient runs={runMetrics} />
      </main>
      <BottomNav />
    </div>
  )
}
