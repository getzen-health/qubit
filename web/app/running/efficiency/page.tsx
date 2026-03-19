import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Gauge } from 'lucide-react'
import { EfficiencyClient } from './efficiency-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Efficiency' }

export default async function RunningEfficiencyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: runs } = await supabase
    .from('workout_records')
    .select('id, start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate')
    .eq('user_id', user.id)
    .eq('workout_type', 'Running')
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('distance_meters', 800)
    .gt('duration_minutes', 5)
    .not('avg_pace_per_km', 'is', null)
    .not('avg_heart_rate', 'is', null)
    .gt('avg_pace_per_km', 0)
    .gt('avg_heart_rate', 0)
    .order('start_time', { ascending: true })

  // Aerobic Efficiency Index (AEI) = speed (m/min) / avg HR
  // Higher = more efficient (more speed per heartbeat)
  // Normalize to a nicer number: (1000 / pace_secs_per_km) / avg_hr * 100
  interface EfficiencyPoint {
    date: string
    distanceKm: number
    durationMinutes: number
    paceSecsPerKm: number
    avgHr: number
    aei: number                     // aerobic efficiency index
    category: 'short' | 'medium' | 'long'
  }

  const points: EfficiencyPoint[] = (runs ?? []).map((r) => {
    const speedMpm = 1000 / r.avg_pace_per_km!   // meters per minute
    const aei = (speedMpm / r.avg_heart_rate!) * 100
    const distanceKm = (r.distance_meters ?? 0) / 1000
    const category: 'short' | 'medium' | 'long' =
      distanceKm < 5 ? 'short' : distanceKm < 12 ? 'medium' : 'long'
    return {
      date: r.start_time.slice(0, 10),
      distanceKm,
      durationMinutes: r.duration_minutes,
      paceSecsPerKm: r.avg_pace_per_km!,
      avgHr: r.avg_heart_rate!,
      aei: Math.round(aei * 100) / 100,
      category,
    }
  })

  // Overall trend: linear regression slope of AEI over time
  let trendSlope: number | null = null
  if (points.length >= 5) {
    const n = points.length
    const xs = points.map((_, i) => i)
    const ys = points.map((p) => p.aei)
    const xMean = xs.reduce((a, b) => a + b, 0) / n
    const yMean = ys.reduce((a, b) => a + b, 0) / n
    const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0)
    const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0)
    trendSlope = den > 0 ? num / den : null
  }

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
            <Gauge className="w-5 h-5 text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Running Efficiency</h1>
              <p className="text-sm text-text-secondary">
                {points.length > 0
                  ? `${points.length} runs with HR · last 90 days`
                  : 'Aerobic efficiency trends'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <EfficiencyClient points={points} trendSlope={trendSlope} />
      </main>
      <BottomNav />
    </div>
  )
}
