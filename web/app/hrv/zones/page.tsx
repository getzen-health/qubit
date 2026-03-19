import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HRVZonesClient, type HRVZoneData } from './hrv-zones-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Recovery Zones' }

export default async function HRVZonesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const since = ninetyDaysAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: workouts }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, recovery_score, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true }),
    supabase
      .from('workout_records')
      .select('start_time, workout_type, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', ninetyDaysAgo.toISOString())
      .gt('duration_minutes', 10)
      .order('start_time', { ascending: true }),
  ])

  const rows = (summaries ?? []).filter((r) => r.avg_hrv !== null && r.avg_hrv > 0)

  // ── Baseline: rolling median of all HRV values in the window ──────────────
  const sortedHrv = [...rows.map((r) => r.avg_hrv as number)].sort((a, b) => a - b)
  const p50 = sortedHrv.length > 0 ? sortedHrv[Math.floor(sortedHrv.length * 0.5)] : 0
  const p75 = sortedHrv.length > 0 ? sortedHrv[Math.floor(sortedHrv.length * 0.75)] : 0

  // Zone thresholds (relative to personal baseline p50)
  // Green (Optimal): >= p75  → top quarter of your range
  // Yellow (Normal): p50–p75 → above-median, below optimal
  // Orange (Reduced): below p50 → below median
  const zoneThresholds = { green: p75, yellow: p50 }

  // ── Day entries with zone assignment ──────────────────────────────────────
  const workoutDays = new Set(
    (workouts ?? []).map((w) => w.start_time.slice(0, 10))
  )

  const days = rows.map((r) => {
    const hrv = r.avg_hrv as number
    const zone: 'green' | 'yellow' | 'orange' =
      hrv >= zoneThresholds.green
        ? 'green'
        : hrv >= zoneThresholds.yellow
        ? 'yellow'
        : 'orange'
    return {
      date: r.date,
      hrv,
      zone,
      hadWorkout: workoutDays.has(r.date),
      recovery: r.recovery_score,
      rhr: r.resting_heart_rate,
      sleepMins: r.sleep_duration_minutes,
    }
  })

  // ── Zone counts ───────────────────────────────────────────────────────────
  const greenDays  = days.filter((d) => d.zone === 'green').length
  const yellowDays = days.filter((d) => d.zone === 'yellow').length
  const orangeDays = days.filter((d) => d.zone === 'orange').length

  // ── Current streak in latest zone ─────────────────────────────────────────
  let currentStreak = 0
  const currentZone = days.length > 0 ? days[days.length - 1].zone : null
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].zone === currentZone) currentStreak++
    else break
  }

  // ── Best streak (consecutive green days) ─────────────────────────────────
  let bestGreenStreak = 0, streak = 0
  for (const d of days) {
    if (d.zone === 'green') { streak++; bestGreenStreak = Math.max(bestGreenStreak, streak) }
    else streak = 0
  }

  // ── Correlation: workout → next day zone ─────────────────────────────────
  const dayAfterWorkout = days.filter((d, i) => i > 0 && days[i - 1].hadWorkout)
  const dayAfterRest    = days.filter((d, i) => i > 0 && !days[i - 1].hadWorkout)
  const avgHrvAfterWorkout = avg(dayAfterWorkout.map((d) => d.hrv))
  const avgHrvAfterRest    = avg(dayAfterRest.map((d) => d.hrv))

  // ── 7-day rolling average per day ────────────────────────────────────────
  const rolling7 = days.map((_, i) => {
    const window = days.slice(Math.max(0, i - 6), i + 1)
    return avg(window.map((d) => d.hrv))
  })

  const data: HRVZoneData = {
    days: days.map((d, i) => ({ ...d, rolling7: rolling7[i] })),
    totalDays: days.length,
    greenDays,
    yellowDays,
    orangeDays,
    baseline: Math.round(p50),
    optimalThreshold: Math.round(p75),
    currentZone,
    currentStreak,
    bestGreenStreak,
    avgHrvAfterWorkout: avgHrvAfterWorkout ? Math.round(avgHrvAfterWorkout) : null,
    avgHrvAfterRest:    avgHrvAfterRest    ? Math.round(avgHrvAfterRest)    : null,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HRV"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">HRV Recovery Zones</h1>
            <p className="text-sm text-text-secondary">
              {days.length > 0 ? `${days.length} days · personal baseline zones` : '90-day zone classification'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HRVZonesClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
