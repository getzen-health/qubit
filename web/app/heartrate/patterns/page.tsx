import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import dynamic from 'next/dynamic'
const HRPatternsClient = dynamic(() => import('./patterns-client').then(m => ({ default: m.HRPatternsClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Heart Rate Patterns' }

export default async function HRPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const [{ data: hrRecords }, { data: workouts }] = await Promise.all([
    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'heart_rate')
      .gte('start_time', fourteenDaysAgo.toISOString())
      .order('start_time', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time, end_time, workout_type, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', fourteenDaysAgo.toISOString())
      .gt('duration_minutes', 10),
  ])

  const records = hrRecords ?? []

  // Build hourly HR profile (0–23) averaged across all days
  const hourBuckets: number[][] = Array.from({ length: 24 }, () => [])
  for (const r of records) {
    if (!r.value || r.value < 30 || r.value > 220) continue
    const d = new Date(r.start_time)
    hourBuckets[d.getHours()].push(r.value)
  }

  const hourlyAvg = hourBuckets.map((vals, hour) => ({
    hour,
    avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
    min: vals.length ? Math.min(...vals) : null,
    max: vals.length ? Math.max(...vals) : null,
    count: vals.length,
  }))

  // Compute workout hours to overlay
  const workoutHours = new Set<number>()
  for (const w of workouts ?? []) {
    const start = new Date(w.start_time)
    const end = w.end_time ? new Date(w.end_time) : new Date(start.getTime() + w.duration_minutes * 60000)
    for (let h = start.getHours(); h <= Math.min(end.getHours(), 23); h++) {
      workoutHours.add(h)
    }
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
              <h1 className="text-xl font-bold text-text-primary">Daily HR Pattern</h1>
              <p className="text-sm text-text-secondary">
                {records.length > 0 ? `${records.length.toLocaleString()} readings · last 14 days` : 'Circadian heart rate rhythm'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HRPatternsClient
          hourlyAvg={hourlyAvg}
          workoutHours={Array.from(workoutHours)}
          totalReadings={records.length}
        />
      </main>
      <BottomNav />
    </div>
  )
}
