import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ZonesClient } from './zones-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Zones' }

export default async function ZonesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [{ data: workouts }, { data: dailyHr }, { data: profileRaw }] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, workout_type, duration_minutes, avg_heart_rate, max_heart_rate, distance_meters, active_calories')
      .eq('user_id', user.id)
      .gte('start_time', startIso)
      .not('avg_heart_rate', 'is', null)
      .gt('avg_heart_rate', 0)
      .order('start_time', { ascending: true }),
    supabase
      .from('daily_heart_rate')
      .select('max_hr')
      .eq('user_id', user.id)
      .not('max_hr', 'is', null)
      .gt('max_hr', 0)
      .order('max_hr', { ascending: false })
      .limit(1),
    supabase
      .from('users')
      .select('date_of_birth, age')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  // Determine observed max HR from workout and daily HR data
  const observedMax = Math.max(
    ...(workouts ?? []).map((w) => w.max_heart_rate ?? 0),
    ...(dailyHr ?? []).map((d) => d.max_hr ?? 0),
  )
  const observedMaxHr = observedMax > 100 ? observedMax : null

  // Compute age-based max HR fallback (220 − age)
  const profile = profileRaw as { date_of_birth?: string | null; age?: number | null } | null
  const userAge =
    profile?.age ??
    (profile?.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(profile.date_of_birth).getTime()) /
            (365.25 * 24 * 3600 * 1000),
        )
      : null)
  const ageBasedMaxHr = userAge ? 220 - userAge : null

  // Priority: observed max HR > age-based > 190 default
  const displayMaxHr = observedMaxHr ?? ageBasedMaxHr ?? 190

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
          <div>
            <h1 className="text-xl font-bold text-text-primary">Training Zones</h1>
            <p className="text-sm text-text-secondary">Last 90 days · Max HR {displayMaxHr} bpm</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <ZonesClient workouts={workouts ?? []} observedMaxHr={observedMaxHr} ageBasedMaxHr={ageBasedMaxHr} />
      </main>
      <BottomNav />
    </div>
  )
}
