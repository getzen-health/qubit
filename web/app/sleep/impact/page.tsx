import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import { SleepImpactClient } from './sleep-impact-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Impact' }

export interface SleepDay {
  date: string
  sleepHours: number
  deepMinutes: number | null
  remMinutes: number | null
  efficiency: number | null   // % time asleep
  nextHrv: number | null
  nextSteps: number | null
  nextRhr: number | null
  nextCalories: number | null
  hadWorkout: boolean
}

export default async function SleepImpactPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [{ data: summaries }, { data: workouts }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, sleep_duration_minutes, deep_sleep_minutes, rem_sleep_minutes, avg_hrv, resting_heart_rate, steps, active_calories')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time')
      .eq('user_id', user.id)
      .gte('start_time', startIso),
  ])

  // Set of dates with workouts
  const workoutDates = new Set((workouts ?? []).map((w) => w.start_time.slice(0, 10)))

  // Index summaries by date
  const byDate = new Map((summaries ?? []).map((s) => [s.date, s]))

  const days: SleepDay[] = []
  const sorted = (summaries ?? []).filter(
    (s) => s.sleep_duration_minutes && s.sleep_duration_minutes > 60
  )

  for (const s of sorted) {
    const sleepHours = s.sleep_duration_minutes! / 60

    // Get next-day metrics
    const next = new Date(s.date + 'T12:00:00')
    next.setDate(next.getDate() + 1)
    const nextDate = next.toISOString().slice(0, 10)
    const nextDay = byDate.get(nextDate)

    // Sleep efficiency = (total sleep - awake minutes) / total time in bed (approx)
    const totalMinutes = s.sleep_duration_minutes!
    const deepMin = s.deep_sleep_minutes ?? 0
    const remMin = s.rem_sleep_minutes ?? 0

    days.push({
      date: s.date,
      sleepHours,
      deepMinutes: s.deep_sleep_minutes ?? null,
      remMinutes: s.rem_sleep_minutes ?? null,
      efficiency: null,  // not directly computed here
      nextHrv: nextDay?.avg_hrv ?? null,
      nextSteps: nextDay?.steps ?? null,
      nextRhr: nextDay?.resting_heart_rate ?? null,
      nextCalories: nextDay?.active_calories ?? null,
      hadWorkout: workoutDates.has(s.date),
    })
  }

  // Optimal sleep window: what sleep duration range has highest next-day HRV?
  const hrvByHourBucket: Record<string, number[]> = {}
  for (const d of days) {
    if (d.nextHrv === null) continue
    const bucket = (Math.floor(d.sleepHours * 2) / 2).toFixed(1)  // 0.5h buckets
    if (!hrvByHourBucket[bucket]) hrvByHourBucket[bucket] = []
    hrvByHourBucket[bucket].push(d.nextHrv)
  }

  const optimalBuckets = Object.entries(hrvByHourBucket)
    .map(([hours, vals]) => ({
      hours: parseFloat(hours),
      avgHrv: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      count: vals.length,
    }))
    .filter((b) => b.count >= 2)
    .sort((a, b) => a.hours - b.hours)

  const bestHrvBucket = optimalBuckets.reduce((best, b) => (!best || b.avgHrv > best.avgHrv) ? b : best, null as typeof optimalBuckets[0] | null)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Sleep Impact</h1>
              <p className="text-sm text-text-secondary">
                {days.length > 0
                  ? `${days.length} nights · how sleep shapes next-day performance`
                  : 'Sleep vs next-day performance'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SleepImpactClient
          days={days}
          optimalBuckets={optimalBuckets}
          bestHrvBucket={bestHrvBucket}
        />
      </main>
      <BottomNav />
    </div>
  )
}
