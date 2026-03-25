import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Timer, Heart } from 'lucide-react'
import { PaceZonesClient } from './pace-zones-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Pace Zones' }

export default async function RunningZonesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const [
    { data: runs },
    { data: userRow },
    { data: profileRow },
    { data: dailySummaryRow },
  ] = await Promise.all([
    supabase
      .from('workout_records')
      .select('id, start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate')
      .eq('user_id', user.id)
      .eq('workout_type', 'Running')
      .gte('start_time', startIso)
      .gt('distance_meters', 400)
      .gt('duration_minutes', 3)
      .not('avg_pace_per_km', 'is', null)
      .gt('avg_pace_per_km', 0)
      .order('start_time', { ascending: true }),
    supabase
      .from('users')
      .select('max_heart_rate, resting_hr, date_of_birth, age')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('max_heart_rate')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('daily_summaries')
      .select('resting_heart_rate')
      .eq('user_id', user.id)
      .not('resting_heart_rate', 'is', null)
      .gt('resting_heart_rate', 30)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // ── Heart Rate Zone computation ────────────────────────────────────────────
  type UserRow = { max_heart_rate?: number | null; resting_hr?: number | null; date_of_birth?: string | null; age?: number | null } | null
  type ProfileRow = { max_heart_rate?: number | null } | null
  type DailySummaryRow = { resting_heart_rate?: number | null } | null

  const castUser = userRow as UserRow
  const castProfile = profileRow as ProfileRow
  const castDaily = dailySummaryRow as DailySummaryRow

  // Derive age → birth_year column not present; compute from date_of_birth or age field
  const userAge: number | null =
    castUser?.age != null
      ? castUser.age
      : castUser?.date_of_birth
        ? Math.floor((Date.now() - new Date(castUser.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null

  // Priority: users.max_heart_rate → user_profiles.max_heart_rate → 220−age → 190
  const profileMaxHr = castUser?.max_heart_rate ?? castProfile?.max_heart_rate ?? null
  let maxHr: number
  let maxHrSource: 'profile' | 'estimated' | 'default'
  if (profileMaxHr && profileMaxHr > 100) {
    maxHr = profileMaxHr
    maxHrSource = 'profile'
  } else if (userAge) {
    maxHr = 220 - userAge
    maxHrSource = 'estimated'
  } else {
    maxHr = 190
    maxHrSource = 'default'
  }

  // Resting HR: prefer users.resting_hr, then latest daily summary
  const restingHr: number | null = castUser?.resting_hr ?? castDaily?.resting_heart_rate ?? null

  // Karvonen formula: if restingHr known, zone = restingHr + pct × HRR; else pct × maxHr
  const hrr = restingHr !== null ? maxHr - restingHr : null
  function karvonen(pct: number): number {
    if (hrr !== null && restingHr !== null) return Math.round(restingHr + (pct / 100) * hrr)
    return Math.round((pct / 100) * maxHr)
  }

  const HR_ZONE_DEFS = [
    { id: 1, name: 'Recovery',     pctMin: 50, pctMax: 60,  color: '#60a5fa' }, // blue
    { id: 2, name: 'Aerobic Base', pctMin: 60, pctMax: 70,  color: '#4ade80' }, // green
    { id: 3, name: 'Tempo',        pctMin: 70, pctMax: 80,  color: '#facc15' }, // yellow
    { id: 4, name: 'Threshold',    pctMin: 80, pctMax: 90,  color: '#fb923c' }, // orange
    { id: 5, name: 'VO₂max',       pctMin: 90, pctMax: 100, color: '#f87171' }, // red
  ]
  const hrZones = HR_ZONE_DEFS.map((z) => ({
    ...z,
    bpmMin: karvonen(z.pctMin),
    bpmMax: z.pctMax === 100 ? maxHr : karvonen(z.pctMax),
  }))

  const maxHrNote =
    maxHrSource === 'profile'
      ? `Max HR: ${maxHr} bpm (from profile)`
      : maxHrSource === 'estimated'
        ? `Max HR: ${maxHr} bpm (estimated: 220 − age)`
        : `Max HR: ${maxHr} bpm (default — set age or max HR in profile for accuracy)`

  // ── Estimate threshold pace from best 5K-equivalent effort ─────────────────
  // Use the fastest pace among runs ≥ 3 km as a proxy for race/threshold pace
  const eligibleRuns = (runs ?? []).filter((r) => (r.distance_meters ?? 0) >= 3000)
  const fastestPace = eligibleRuns.length > 0
    ? Math.min(...eligibleRuns.map((r) => r.avg_pace_per_km!))
    : null

  // Pace zones as multiples of threshold pace (faster = harder):
  // Zone 1 (Easy):     > 1.25x threshold
  // Zone 2 (Steady):  1.10x – 1.25x threshold
  // Zone 3 (Tempo):   1.03x – 1.10x threshold
  // Zone 4 (Threshold): 0.98x – 1.03x threshold
  // Zone 5 (Race):    < 0.98x threshold

  interface RunPoint {
    date: string           // yyyy-MM-dd
    week: string           // yyyy-Www ISO week
    durationMinutes: number
    distanceKm: number
    paceSecsPerKm: number
    zone: 1 | 2 | 3 | 4 | 5
    avgHr: number | null
  }

  function classifyZone(paceSecsPerKm: number, threshold: number): 1 | 2 | 3 | 4 | 5 {
    const ratio = paceSecsPerKm / threshold
    if (ratio > 1.25) return 1
    if (ratio > 1.10) return 2
    if (ratio > 1.03) return 3
    if (ratio > 0.98) return 4
    return 5
  }

  function isoWeek(dateStr: string): string {
    const d = new Date(dateStr)
    const day = d.getDay() || 7
    d.setDate(d.getDate() + 4 - day)
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }

  const threshold = fastestPace  // seconds per km at threshold/race effort

  const points: RunPoint[] = (runs ?? []).map((r) => ({
    date: r.start_time.slice(0, 10),
    week: isoWeek(r.start_time.slice(0, 10)),
    durationMinutes: r.duration_minutes,
    distanceKm: (r.distance_meters ?? 0) / 1000,
    paceSecsPerKm: r.avg_pace_per_km!,
    zone: threshold ? classifyZone(r.avg_pace_per_km!, threshold) : 1,
    avgHr: r.avg_heart_rate ?? null,
  }))

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
            <Timer className="w-5 h-5 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Pace Zones</h1>
              <p className="text-sm text-text-secondary">
                {points.length > 0
                  ? `${points.length} runs · last 90 days`
                  : 'Easy vs. hard training balance'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <PaceZonesClient points={points} thresholdPace={threshold} />

        {/* Heart Rate Zones */}
        <section className="mt-8 space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-text-primary">Heart Rate Zones</h2>
          </div>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {hrZones.map((zone, i) => (
              <div
                key={zone.id}
                className={`flex items-center gap-4 px-4 py-3${i < hrZones.length - 1 ? ' border-b border-border' : ''}`}
              >
                <div
                  className="w-3 h-8 rounded-sm shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">Z{zone.id} · {zone.name}</p>
                  <p className="text-xs text-text-secondary">
                    {zone.pctMin}–{zone.pctMax}% {restingHr !== null ? 'HRR' : 'max HR'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-text-primary shrink-0">
                  {zone.bpmMin}–{zone.bpmMax}{' '}
                  <span className="text-text-secondary text-xs font-normal">bpm</span>
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary px-1 pt-1">
            {maxHrNote}
            {restingHr !== null && ` · Resting HR: ${restingHr} bpm · Karvonen formula`}
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
