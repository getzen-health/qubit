import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const ReadyClient = dynamic(() => import('./ready-client').then(m => ({ default: m.ReadyClient })))
import type { ReadinessData, DailyScore, ReadinessZone } from './ready-client'
import { BottomNav } from '@/components/bottom-nav'
import { calculateReadinessScore, toHrvScore, toRhrScore, toSleepScore } from '@/lib/readiness'
import { calculateACWR, acwrToStrainScore } from '@/lib/acwr'
import { ReadyPageSkeleton } from '@/components/skeletons'

export const metadata = { title: 'Daily Readiness Score' }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReadyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Fetch 30 days of daily_summaries and 28 days of workouts in parallel ──
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const since28 = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: rows }, { data: workoutRows }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate, sleep_efficiency, sleep_duration_minutes, recovery_score')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: true })
      .limit(30),
    supabase
      .from('workout_records')
      .select('start_time, active_calories, total_calories, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', since28 + 'T00:00:00Z')
      .order('start_time', { ascending: true }),
  ])

  // Aggregate workouts into daily loads (active_calories as proxy for training load)
  const loadByDate = new Map<string, number>()
  for (const w of workoutRows ?? []) {
    const date = w.start_time.slice(0, 10)
    const load = w.active_calories ?? w.total_calories ?? w.duration_minutes ?? 0
    loadByDate.set(date, (loadByDate.get(date) ?? 0) + load)
  }
  const dailyLoads = Array.from(loadByDate.entries()).map(([date, load]) => ({ date, load }))

  const acwr = calculateACWR(dailyLoads)
  const todayStrainScore = acwrToStrainScore(acwr)

  // ── Derive readiness scores ────────────────────────────────────────────────
  function scoreZone(s: number): ReadinessZone {
    if (s >= 80) return 'optimal'
    if (s >= 65) return 'good'
    if (s >= 45) return 'moderate'
    return 'low'
  }

  const summaries = rows ?? []

  const daily: DailyScore[] = summaries.map((r) => {
    const sleepHours = r.sleep_duration_minutes ? r.sleep_duration_minutes / 60 : null
    const score = r.recovery_score ?? (calculateReadinessScore(r.avg_hrv, r.resting_heart_rate, sleepHours, todayStrainScore) ?? 0)
    return {
      date:  r.date,
      score,
      zone:  scoreZone(score),
      hrv:   r.avg_hrv ?? 0,
      rhr:   r.resting_heart_rate ?? 0,
      sleep: sleepHours ?? 0,
    }
  })

  const recent7 = summaries.slice(-7)
  const hrvBaseline  = recent7.length ? recent7.reduce((s, r) => s + (r.avg_hrv ?? 0), 0) / recent7.length : 50
  const rhrBaseline  = recent7.length ? recent7.reduce((s, r) => s + (r.resting_heart_rate ?? 0), 0) / recent7.length : 60

  const latest = summaries[summaries.length - 1]
  const todayHrv   = latest?.avg_hrv ?? 0
  const todayRhr   = latest?.resting_heart_rate ?? 0
  const todaySleep = latest?.sleep_duration_minutes ? latest.sleep_duration_minutes / 60 : 0
  const todayScore = latest
    ? (latest.recovery_score ?? (calculateReadinessScore(latest.avg_hrv, latest.resting_heart_rate, todaySleep || null, todayStrainScore) ?? 0))
    : 0

  const todayHrvScore   = todayHrv   ? Math.round(toHrvScore(todayHrv))          : 0
  const todayRhrScore   = todayRhr   ? Math.round(toRhrScore(todayRhr))           : 0
  const todaySleepScore = todaySleep ? Math.round(toSleepScore(todaySleep))       : 0

  const data: ReadinessData = {
    todayScore, todayHrv, todayRhr, todaySleep,
    todayHrvScore, todayRhrScore, todaySleepScore,
    todayStrainScore,
    acwr,
    hrvBaseline: Math.round(hrvBaseline),
    rhrBaseline: Math.round(rhrBaseline),
    daily,
  }


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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Daily Readiness Score</h1>
            <p className="text-sm text-text-secondary">
              HRV · Resting HR · Sleep · 30-day trend
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <Suspense fallback={<ReadyPageSkeleton />}>
          <ReadyClient data={data} />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  )
}
