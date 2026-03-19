import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Timer } from 'lucide-react'
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

  const { data: runs } = await supabase
    .from('workout_records')
    .select('id, start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate')
    .eq('user_id', user.id)
    .eq('workout_type', 'Running')
    .gte('start_time', startIso)
    .gt('distance_meters', 400)
    .gt('duration_minutes', 3)
    .not('avg_pace_per_km', 'is', null)
    .gt('avg_pace_per_km', 0)
    .order('start_time', { ascending: true })

  // Estimate threshold pace from best 5K-equivalent effort
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
      </main>
      <BottomNav />
    </div>
  )
}
