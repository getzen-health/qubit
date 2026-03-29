import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const RHRPatternsClient = dynamic(() => import('./rhr-patterns-client').then(m => ({ default: m.RHRPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Resting HR Patterns' }

function fitnessClass(rhr: number): { label: string; color: string } {
  if (rhr < 45) return { label: 'Athlete', color: '#a855f7' }
  if (rhr < 54) return { label: 'Excellent', color: '#22c55e' }
  if (rhr < 62) return { label: 'Good', color: '#84cc16' }
  if (rhr < 70) return { label: 'Above Avg', color: '#f59e0b' }
  if (rhr < 80) return { label: 'Average', color: '#f97316' }
  return { label: 'Below Avg', color: '#ef4444' }
}

export default async function RHRPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const since = oneYearAgo.toISOString().slice(0, 10)

  const { data: rows } = await supabase
    .from('daily_summaries')
    .select('date, resting_heart_rate, avg_hrv, sleep_duration_minutes, active_calories')
    .eq('user_id', user.id)
    .gte('date', since)
    .not('resting_heart_rate', 'is', null)
    .gt('resting_heart_rate', 30)
    .lt('resting_heart_rate', 120)
    .order('date', { ascending: true })

  const summaries = (rows ?? []) as {
    date: string
    resting_heart_rate: number
    avg_hrv: number | null
    sleep_duration_minutes: number | null
    active_calories: number | null
  }[]

  if (summaries.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">🫀</p>
          <p className="text-lg font-semibold text-text-primary">No resting HR data</p>
          <p className="text-sm text-text-secondary mt-2">Sync your Apple Watch data to see patterns.</p>
        </div>
      </div>
    )
  }

  const allRHR = summaries.map((r) => r.resting_heart_rate)
  const avg = allRHR.reduce((a, b) => a + b, 0) / allRHR.length
  const min = Math.min(...allRHR)
  const max = Math.max(...allRHR)

  // Fitness classification distribution
  const classDist = {
    athlete: summaries.filter((r) => r.resting_heart_rate < 45).length,
    excellent: summaries.filter((r) => r.resting_heart_rate >= 45 && r.resting_heart_rate < 54).length,
    good: summaries.filter((r) => r.resting_heart_rate >= 54 && r.resting_heart_rate < 62).length,
    aboveAvg: summaries.filter((r) => r.resting_heart_rate >= 62 && r.resting_heart_rate < 70).length,
    average: summaries.filter((r) => r.resting_heart_rate >= 70 && r.resting_heart_rate < 80).length,
    belowAvg: summaries.filter((r) => r.resting_heart_rate >= 80).length,
  }

  // Trend: last 30 days vs 30-60 days ago
  const last30 = summaries.slice(-30)
  const prior30 = summaries.slice(-60, -30)
  const trendDelta =
    last30.length > 0 && prior30.length > 0
      ? Math.round(
          ((last30.reduce((a, b) => a + b.resting_heart_rate, 0) / last30.length) -
            (prior30.reduce((a, b) => a + b.resting_heart_rate, 0) / prior30.length)) *
            10
        ) / 10
      : null

  // DOW stats
  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  summaries.forEach((r) => {
    const day = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[day].push(r.resting_heart_rate)
  })
  const dowData = dowLabels.map((label, i) => {
    const vals = dowBuckets[i]
    if (vals.length === 0) return { label, avgRHR: null, count: 0 }
    const avgRHR = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    return { label, avgRHR, count: vals.length }
  })

  // Monthly stats
  const monthMap = new Map<string, number[]>()
  summaries.forEach((r) => {
    const key = r.date.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(r.resting_heart_rate)
  })
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const monthNum = parseInt(key.slice(5, 7)) - 1
      return {
        label: monthLabels[monthNum],
        avgRHR: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        minRHR: Math.min(...vals),
        maxRHR: Math.max(...vals),
        count: vals.length,
      }
    })

  // Distribution buckets
  const distBuckets = [
    { label: '< 45', min: 0, max: 44 },
    { label: '45–53', min: 45, max: 53 },
    { label: '54–61', min: 54, max: 61 },
    { label: '62–69', min: 62, max: 69 },
    { label: '70–79', min: 70, max: 79 },
    { label: '80+', min: 80, max: 999 },
  ].map((b) => ({
    label: b.label,
    count: summaries.filter((r) => r.resting_heart_rate >= b.min && r.resting_heart_rate <= b.max).length,
  })).filter((b) => b.count > 0)

  // 7-day rolling average for trend chart
  const trendData = summaries.slice(-90).map((r, i, arr) => {
    const window = arr.slice(Math.max(0, i - 6), i + 1)
    const rolling = Math.round((window.reduce((a, b) => a + b.resting_heart_rate, 0) / window.length) * 10) / 10
    return { date: r.date, rhr: r.resting_heart_rate, rolling }
  })

  const latest = summaries[summaries.length - 1].resting_heart_rate

  const stats = {
    latest,
    avg: Math.round(avg * 10) / 10,
    min,
    max,
    totalDays: summaries.length,
    currentClass: fitnessClass(latest),
    trendDelta,
    classDist,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate/resting"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to RHR"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Resting HR Patterns</h1>
            <p className="text-sm text-text-secondary">
              {stats.totalDays} days · {stats.currentClass.label} fitness class
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RHRPatternsClient
          stats={stats}
          dowData={dowData}
          monthData={monthData}
          distBuckets={distBuckets}
          trendData={trendData}
        />
      </main>
      <BottomNav />
    </div>
  )
}
