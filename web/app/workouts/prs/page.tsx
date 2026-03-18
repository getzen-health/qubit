import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout PRs' }

const WORKOUT_ICONS: Record<string, string> = {
  Running: '🏃',
  Walking: '🚶',
  Hiking: '🥾',
  Cycling: '🚴',
  Swimming: '🏊',
  'Strength Training': '💪',
  Yoga: '🧘',
  HIIT: '⚡',
  Rowing: '🚣',
  Pilates: '🤸',
  Dance: '💃',
}

function workoutIcon(type: string) {
  return WORKOUT_ICONS[type] ?? '⚡'
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatPace(secsPerKm: number) {
  const min = Math.floor(secsPerKm / 60)
  const sec = Math.round(secsPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const DISTANCE_TYPES = new Set(['Running', 'Walking', 'Hiking', 'Cycling', 'Rowing'])

interface WorkoutRow {
  id: string
  workout_type: string
  start_time: string
  duration_minutes: number
  active_calories: number | null
  distance_meters: number | null
  avg_pace_per_km: number | null
}

interface PR {
  label: string
  value: string
  workoutId: string
  date: string
}

function computePRs(workouts: WorkoutRow[]): PR[] {
  if (workouts.length === 0) return []
  const prs: PR[] = []

  // Longest duration
  const byDuration = workouts.reduce((best, w) => w.duration_minutes > best.duration_minutes ? w : best)
  prs.push({ label: 'Longest Session', value: formatDuration(byDuration.duration_minutes), workoutId: byDuration.id, date: formatDate(byDuration.start_time) })

  // Most calories
  const withCalories = workouts.filter((w) => (w.active_calories ?? 0) > 0)
  if (withCalories.length > 0) {
    const best = withCalories.reduce((b, w) => (w.active_calories! > b.active_calories! ? w : b))
    prs.push({ label: 'Most Calories', value: `${Math.round(best.active_calories!)} kcal`, workoutId: best.id, date: formatDate(best.start_time) })
  }

  // Longest distance
  const withDistance = workouts.filter((w) => (w.distance_meters ?? 0) > 0)
  if (withDistance.length > 0) {
    const best = withDistance.reduce((b, w) => (w.distance_meters! > b.distance_meters! ? w : b))
    prs.push({ label: 'Longest Distance', value: `${(best.distance_meters! / 1000).toFixed(2)} km`, workoutId: best.id, date: formatDate(best.start_time) })
  }

  // Fastest pace (lower = faster)
  const withPace = workouts.filter((w) => (w.avg_pace_per_km ?? 0) > 0)
  if (withPace.length > 0) {
    const best = withPace.reduce((b, w) => (w.avg_pace_per_km! < b.avg_pace_per_km! ? w : b))
    prs.push({ label: 'Fastest Pace', value: formatPace(best.avg_pace_per_km!), workoutId: best.id, date: formatDate(best.start_time) })
  }

  return prs
}

export default async function WorkoutPRsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_pace_per_km')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  // Group by workout type, preserving insertion order by first occurrence
  const byType = new Map<string, WorkoutRow[]>()
  for (const w of workouts ?? []) {
    if (!byType.has(w.workout_type)) byType.set(w.workout_type, [])
    byType.get(w.workout_type)!.push(w)
  }

  // Sort types by session count descending
  const sortedTypes = Array.from(byType.entries()).sort((a, b) => b[1].length - a[1].length)

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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Workout PRs</h1>
            <p className="text-sm text-text-secondary">Personal records by activity</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {sortedTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🏆</span>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No workout data yet</h2>
            <p className="text-sm text-text-secondary">Sync your iPhone to import workouts from Apple Health.</p>
          </div>
        ) : (
          sortedTypes.map(([type, sessions]) => {
            const prs = computePRs(sessions)
            const hasDistance = DISTANCE_TYPES.has(type)
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{workoutIcon(type)}</span>
                  <div>
                    <h2 className="font-bold text-text-primary">{type}</h2>
                    <p className="text-xs text-text-secondary">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className={`grid gap-3 ${hasDistance ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {prs.map((pr) => (
                    <Link
                      key={pr.label}
                      href={`/workouts/${pr.workoutId}`}
                      className="bg-surface rounded-xl border border-border p-4 space-y-1 hover:bg-surface-secondary transition-colors block"
                    >
                      <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{pr.label}</p>
                      <p className="text-xl font-bold text-text-primary">{pr.value}</p>
                      <p className="text-xs text-text-secondary opacity-70">{pr.date}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })
        )}
      </main>
      <BottomNav />
    </div>
  )
}
