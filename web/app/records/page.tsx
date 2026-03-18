import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDatetime(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface RecordCardProps {
  label: string
  value: string
  sub?: string
  date?: string
  empty?: boolean
}

function RecordCard({ label, value, sub, date, empty }: RecordCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-1">
      <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{label}</p>
      {empty ? (
        <p className="text-text-secondary text-sm">No data yet</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {sub && <p className="text-sm text-text-secondary">{sub}</p>}
          {date && <p className="text-xs text-text-secondary opacity-70">{date}</p>}
        </>
      )}
    </div>
  )
}

export default async function RecordsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: bestSteps },
    { data: bestHrv },
    { data: bestRecovery },
    { data: bestSleep },
    { data: longestWorkout },
    { data: mostCalWorkout },
    { data: longestDistance },
    { data: totalStats },
  ] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps')
      .eq('user_id', user.id)
      .order('steps', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv')
      .eq('user_id', user.id)
      .not('avg_hrv', 'is', null)
      .gt('avg_hrv', 0)
      .order('avg_hrv', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('daily_summaries')
      .select('date, recovery_score')
      .eq('user_id', user.id)
      .not('recovery_score', 'is', null)
      .gt('recovery_score', 0)
      .order('recovery_score', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('daily_summaries')
      .select('date, sleep_duration_minutes')
      .eq('user_id', user.id)
      .not('sleep_duration_minutes', 'is', null)
      .gt('sleep_duration_minutes', 0)
      .order('sleep_duration_minutes', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes')
      .eq('user_id', user.id)
      .order('duration_minutes', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, active_calories')
      .eq('user_id', user.id)
      .not('active_calories', 'is', null)
      .gt('active_calories', 0)
      .order('active_calories', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, distance_meters')
      .eq('user_id', user.id)
      .not('distance_meters', 'is', null)
      .gt('distance_meters', 0)
      .order('distance_meters', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('daily_summaries')
      .select('steps, active_calories, distance_meters')
      .eq('user_id', user.id),
  ])

  // Compute lifetime totals
  const totals = (totalStats ?? []).reduce(
    (acc, row) => ({
      steps: acc.steps + (row.steps ?? 0),
      calories: acc.calories + (row.active_calories ?? 0),
      distanceKm: acc.distanceKm + (row.distance_meters ?? 0) / 1000,
    }),
    { steps: 0, calories: 0, distanceKm: 0 }
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Personal Records</h1>
            <p className="text-sm text-text-secondary">Your all-time bests</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Lifetime Totals */}
        <section>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Lifetime Totals</h2>
          <div className="grid grid-cols-3 gap-3">
            <RecordCard
              label="Total Steps"
              value={Math.round(totals.steps).toLocaleString()}
            />
            <RecordCard
              label="Active Calories"
              value={`${Math.round(totals.calories).toLocaleString()} cal`}
            />
            <RecordCard
              label="Distance"
              value={`${totals.distanceKm.toFixed(0)} km`}
            />
          </div>
        </section>

        {/* Daily Bests */}
        <section>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Daily Bests</h2>
          <div className="grid grid-cols-2 gap-3">
            <RecordCard
              label="Most Steps"
              value={bestSteps ? bestSteps.steps.toLocaleString() : '—'}
              sub="steps in a day"
              date={bestSteps ? formatDate(bestSteps.date) : undefined}
              empty={!bestSteps}
            />
            <RecordCard
              label="Best HRV"
              value={bestHrv ? `${Math.round(bestHrv.avg_hrv!)} ms` : '—'}
              date={bestHrv ? formatDate(bestHrv.date) : undefined}
              empty={!bestHrv}
            />
            <RecordCard
              label="Best Recovery"
              value={bestRecovery ? `${bestRecovery.recovery_score}%` : '—'}
              date={bestRecovery ? formatDate(bestRecovery.date) : undefined}
              empty={!bestRecovery}
            />
            <RecordCard
              label="Longest Sleep"
              value={bestSleep ? formatDuration(bestSleep.sleep_duration_minutes!) : '—'}
              date={bestSleep ? formatDate(bestSleep.date) : undefined}
              empty={!bestSleep}
            />
          </div>
        </section>

        {/* Workout Bests */}
        <section>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Workout Bests</h2>
          <div className="grid grid-cols-1 gap-3">
            <RecordCard
              label="Longest Workout"
              value={longestWorkout ? formatDuration(longestWorkout.duration_minutes) : '—'}
              sub={longestWorkout?.workout_type}
              date={longestWorkout ? formatDatetime(longestWorkout.start_time) : undefined}
              empty={!longestWorkout}
            />
            <RecordCard
              label="Most Calories in a Workout"
              value={mostCalWorkout ? `${Math.round(mostCalWorkout.active_calories!)} cal` : '—'}
              sub={mostCalWorkout?.workout_type}
              date={mostCalWorkout ? formatDatetime(mostCalWorkout.start_time) : undefined}
              empty={!mostCalWorkout}
            />
            {longestDistance && (
              <RecordCard
                label="Longest Distance"
                value={`${(longestDistance.distance_meters! / 1000).toFixed(2)} km`}
                sub={longestDistance.workout_type}
                date={formatDatetime(longestDistance.start_time)}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
