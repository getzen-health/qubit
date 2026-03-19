import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Footprints } from 'lucide-react'
import { RunningFormClient } from './form-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Form Analysis' }

export default async function RunningFormPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneEightyDaysAgo = new Date()
  oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180)
  const startIso = oneEightyDaysAgo.toISOString()

  const [{ data: runs }, { data: formRecords }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, end_time, duration_minutes, distance_meters, avg_pace_per_km')
      .eq('user_id', user.id)
      .eq('workout_type', 'Running')
      .gte('start_time', startIso)
      .gt('distance_meters', 500)
      .gt('duration_minutes', 5)
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

  // Join form metrics to each run
  const runData = (runs ?? []).map((run) => {
    const runStart = run.start_time
    const runEnd =
      run.end_time ??
      new Date(new Date(runStart).getTime() + run.duration_minutes * 60000).toISOString()

    const matching = (formRecords ?? []).filter(
      (r) => r.start_time >= runStart && r.start_time <= runEnd
    )
    const getMetric = (type: string) => matching.find((m) => m.type === type)?.value ?? null

    return {
      date: runStart.slice(0, 10),
      durationMinutes: run.duration_minutes,
      distanceKm: (run.distance_meters ?? 0) / 1000,
      paceSecsPerKm: run.avg_pace_per_km,
      cadence: getMetric('running_cadence'),          // steps/min
      strideLength: getMetric('running_stride_length'), // meters
      verticalOscillation: getMetric('running_vertical_oscillation'), // cm
      groundContactTime: getMetric('running_ground_contact_time'),   // ms
      power: getMetric('running_power'),               // watts
    }
  })

  const hasForm = runData.some(
    (r) =>
      r.cadence !== null ||
      r.strideLength !== null ||
      r.verticalOscillation !== null ||
      r.groundContactTime !== null ||
      r.power !== null
  )

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
          <div className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-green-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Running Form</h1>
              <p className="text-sm text-text-secondary">
                {hasForm ? `${runData.filter((r) => r.cadence !== null).length} runs with form data` : 'Biomechanics analysis'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RunningFormClient runs={runData} />
      </main>
      <BottomNav />
    </div>
  )
}
