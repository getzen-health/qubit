import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HydrationPatternsClient, type HydrationPatternData } from './hydration-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Hydration Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function HydrationPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString().slice(0, 10)

  const [{ data: waterData }, { data: profile }, { data: workoutData }] = await Promise.all([
    supabase
      .from('daily_water')
      .select('date, total_ml')
      .eq('user_id', user.id)
      .gte('date', since)
      .gt('total_ml', 0)
      .order('date', { ascending: true }),
    supabase
      .from('user_nutrition_settings')
      .select('water_target_ml')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('workout_records')
      .select('start_time')
      .eq('user_id', user.id)
      .gte('start_time', since + 'T00:00:00')
      .order('start_time', { ascending: true }),
  ])

  const targetMl = profile?.water_target_ml ?? 2500
  const rows = waterData ?? []

  // DOW averages (0=Sun, 6=Sat)
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of rows) {
    const dow = new Date(r.date).getDay()
    dowBuckets[dow].push(r.total_ml)
  }
  const dowAvg = dowBuckets.map((vals, i) => ({
    label: DOW_LABELS[i],
    avg: vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0,
    count: vals.length,
    hitRate: vals.length > 0 ? Math.round(vals.filter((v) => v >= targetMl).length / vals.length * 100) : 0,
  }))

  // Monthly averages
  const monthBuckets: Record<string, number[]> = {}
  for (const r of rows) {
    const key = r.date.slice(0, 7) // YYYY-MM
    if (!monthBuckets[key]) monthBuckets[key] = []
    monthBuckets[key].push(r.total_ml)
  }
  const monthAvg = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const [year, month] = key.split('-')
      return {
        label: `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year.slice(2)}`,
        avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        count: vals.length,
        hitRate: Math.round(vals.filter((v) => v >= targetMl).length / vals.length * 100),
      }
    })
    .slice(-12)

  // Goal hit streak
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  const sortedByDate = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  for (const r of sortedByDate) {
    if (r.total_ml >= targetMl) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  // Current streak: from today backwards
  const today = new Date().toISOString().slice(0, 10)
  const waterByDate = new Map(rows.map((r) => [r.date, r.total_ml]))
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    if (dateStr === today) continue // skip today (might still be in progress)
    const ml = waterByDate.get(dateStr) ?? 0
    if (ml >= targetMl) currentStreak++
    else break
  }

  // Distribution buckets (in 500ml bands)
  const maxBucket = Math.ceil(Math.max(...rows.map((r) => r.total_ml), targetMl * 1.5) / 500) * 500
  const bucketSize = 500
  const numBuckets = Math.ceil(maxBucket / bucketSize)
  const distBuckets = Array.from({ length: numBuckets }, (_, i) => {
    const min = i * bucketSize
    const max = (i + 1) * bucketSize
    const count = rows.filter((r) => r.total_ml >= min && r.total_ml < max).length
    return {
      label: min >= 1000 ? `${min / 1000}–${max / 1000}L` : `${min}–${max}`,
      min,
      max,
      count,
      pct: rows.length > 0 ? Math.round(count / rows.length * 100) : 0,
      isGoal: targetMl >= min && targetMl < max,
    }
  }).filter((b) => b.count > 0 || b.isGoal)

  // Workout day vs rest day
  const workoutDates = new Set(
    (workoutData ?? []).map((w) => w.start_time.slice(0, 10))
  )
  const workoutDayWater: number[] = []
  const restDayWater: number[] = []
  for (const r of rows) {
    if (workoutDates.has(r.date)) workoutDayWater.push(r.total_ml)
    else restDayWater.push(r.total_ml)
  }
  const avgWorkoutDay = workoutDayWater.length > 0
    ? Math.round(workoutDayWater.reduce((s, v) => s + v, 0) / workoutDayWater.length)
    : null
  const avgRestDay = restDayWater.length > 0
    ? Math.round(restDayWater.reduce((s, v) => s + v, 0) / restDayWater.length)
    : null

  // Overall stats
  const totalDays = rows.length
  const goalDays = rows.filter((r) => r.total_ml >= targetMl).length
  const goalRate = totalDays > 0 ? Math.round(goalDays / totalDays * 100) : 0
  const avgDaily = totalDays > 0 ? Math.round(rows.reduce((s, r) => s + r.total_ml, 0) / totalDays) : 0
  const bestDay = rows.reduce((best, r) => (r.total_ml > (best?.total_ml ?? 0) ? r : best), rows[0] ?? null)

  const profileData: HydrationPatternData = {
    targetMl,
    totalDays,
    goalDays,
    goalRate,
    avgDaily,
    currentStreak,
    longestStreak,
    bestDay: bestDay ? { date: bestDay.date, ml: bestDay.total_ml } : null,
    dowAvg,
    monthAvg,
    distBuckets,
    avgWorkoutDay,
    avgRestDay,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/water"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to hydration"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Hydration Patterns</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0
                ? `${totalDays} days · ${goalRate}% goal hit rate`
                : 'Water intake analysis'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {totalDays < 5 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">💧</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Log water intake for at least 5 days to see patterns. Use the Hydration page to track daily intake.
            </p>
          </div>
        ) : (
          <HydrationPatternsClient data={profileData} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
