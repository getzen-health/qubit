import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HealthHeatmapClient, type HeatmapDay } from './heatmap-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Health Heatmap' }

export default async function HealthHeatmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, steps, sleep_duration_minutes, avg_hrv, active_calories, recovery_score, distance_meters')
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: true })

  const rows = summaries ?? []

  // Normalise each metric column (0–1 relative to min/max in window)
  function normalise(vals: (number | null)[], lowerIsBetter = false): (number | null)[] {
    const raw = vals.filter((v): v is number => v !== null && v > 0)
    if (raw.length < 2) return vals.map(v => (v !== null && v > 0 ? 0.5 : null))
    const min = Math.min(...raw)
    const max = Math.max(...raw)
    if (max === min) return vals.map(v => (v !== null && v > 0 ? 0.5 : null))
    return vals.map(v => {
      if (v === null || v <= 0) return null
      const n = (v - min) / (max - min)
      return lowerIsBetter ? 1 - n : n
    })
  }

  const stepsRaw    = rows.map(r => r.steps > 0 ? r.steps : null)
  const sleepRaw    = rows.map(r => (r.sleep_duration_minutes ?? 0) > 60 ? r.sleep_duration_minutes : null)
  const hrvRaw      = rows.map(r => (r.avg_hrv ?? 0) > 0 ? r.avg_hrv : null)
  const calRaw      = rows.map(r => (r.active_calories ?? 0) > 0 ? r.active_calories : null)
  const recoveryRaw = rows.map(r => (r.recovery_score ?? 0) > 0 ? r.recovery_score : null)
  const distRaw     = rows.map(r => (r.distance_meters ?? 0) > 100 ? (r.distance_meters! / 1000) : null)

  const stepsNorm    = normalise(stepsRaw)
  const sleepNorm    = normalise(sleepRaw)
  const hrvNorm      = normalise(hrvRaw)
  const calNorm      = normalise(calRaw)
  const recoveryNorm = normalise(recoveryRaw)
  const distNorm     = normalise(distRaw)

  const days: HeatmapDay[] = rows.map((r, i) => ({
    date: r.date,
    steps: r.steps > 0 ? r.steps : null,
    stepsNorm: stepsNorm[i],
    sleepMins: sleepRaw[i],
    sleepNorm: sleepNorm[i],
    hrv: hrvRaw[i],
    hrvNorm: hrvNorm[i],
    calories: calRaw[i] ? Math.round(calRaw[i]!) : null,
    calNorm: calNorm[i],
    recovery: recoveryRaw[i],
    recoveryNorm: recoveryNorm[i],
    distKm: distRaw[i],
    distNorm: distNorm[i],
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Health Heatmap</h1>
            <p className="text-sm text-text-secondary">
              {days.length > 0 ? `${days.length} days · 6 metrics side by side` : '90-day multi-metric overview'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <HealthHeatmapClient days={days} />
      </main>
      <BottomNav />
    </div>
  )
}
