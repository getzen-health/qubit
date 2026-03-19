import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { HRRecoveryClient } from './hr-recovery-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Heart Rate Recovery' }

export interface WorkoutRecovery {
  date: string
  workoutType: string
  maxHr: number
  peakHr: number        // highest HR in first 5 min before/at workout end
  hrr1: number | null   // drop at 1 min post-workout
  hrr2: number | null   // drop at 2 min post-workout
  durationMinutes: number
  distanceKm: number | null
}

export default async function HRRecoveryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [{ data: workouts }, { data: hrSamples }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, end_time, workout_type, avg_heart_rate, max_heart_rate, duration_minutes, distance_meters')
      .eq('user_id', user.id)
      .gte('start_time', startIso)
      .gt('duration_minutes', 10)
      .not('max_heart_rate', 'is', null)
      .order('start_time', { ascending: true }),
    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'heart_rate')
      .gte('start_time', startIso)
      .order('start_time', { ascending: true }),
  ])

  // Index HR samples by minute bucket for fast lookup
  const hrByMinute = new Map<string, number[]>()
  for (const s of hrSamples ?? []) {
    const key = s.start_time.slice(0, 16) // "yyyy-MM-ddTHH:mm"
    if (!hrByMinute.has(key)) hrByMinute.set(key, [])
    hrByMinute.get(key)!.push(s.value)
  }

  function avgHrAtMinute(isoMinute: string): number | null {
    const vals = hrByMinute.get(isoMinute.slice(0, 16))
    if (!vals || vals.length === 0) return null
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  function addMinutes(isoStr: string, minutes: number): string {
    const d = new Date(isoStr)
    d.setMinutes(d.getMinutes() + minutes)
    return d.toISOString()
  }

  const recoveries: WorkoutRecovery[] = []

  for (const w of workouts ?? []) {
    const maxHr = w.max_heart_rate
    if (!maxHr || maxHr < 100) continue

    const endTime = w.end_time ?? addMinutes(w.start_time, w.duration_minutes)

    // Peak HR: max from HR samples in last 5 minutes of workout
    let peakHr = maxHr
    for (let mOffset = -5; mOffset <= 0; mOffset++) {
      const minKey = addMinutes(endTime, mOffset)
      const v = avgHrAtMinute(minKey)
      if (v && v > peakHr) peakHr = v
    }

    // HRR1: HR at 1 min post-workout
    const hr1 = avgHrAtMinute(addMinutes(endTime, 1))
    const hrr1 = hr1 !== null ? Math.round(peakHr - hr1) : null

    // HRR2: HR at 2 min post-workout
    const hr2 = avgHrAtMinute(addMinutes(endTime, 2))
    const hrr2 = hr2 !== null ? Math.round(peakHr - hr2) : null

    // Need at least hrr1 to be useful
    if (hrr1 === null && hrr2 === null) continue

    recoveries.push({
      date: w.start_time.slice(0, 10),
      workoutType: w.workout_type ?? 'Other',
      maxHr,
      peakHr: Math.round(peakHr),
      hrr1,
      hrr2,
      durationMinutes: w.duration_minutes,
      distanceKm: w.distance_meters ? w.distance_meters / 1000 : null,
    })
  }

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
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">HR Recovery</h1>
              <p className="text-sm text-text-secondary">
                {recoveries.length > 0
                  ? `${recoveries.length} workouts with recovery data`
                  : 'Post-workout heart rate recovery'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HRRecoveryClient recoveries={recoveries} />
      </main>
      <BottomNav />
    </div>
  )
}
