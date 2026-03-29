import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const HrvPatternsClient = dynamic(() => import('./hrv-patterns-client').then(m => ({ default: m.HrvPatternsClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Patterns' }

export default async function HrvPatternsPage() {
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
    .select('date, avg_hrv, sleep_duration_minutes, active_calories, resting_heart_rate')
    .eq('user_id', user.id)
    .gte('date', since)
    .not('avg_hrv', 'is', null)
    .gt('avg_hrv', 0)
    .order('date', { ascending: true })

  const summaries = (rows ?? []) as {
    date: string
    avg_hrv: number
    sleep_duration_minutes: number | null
    active_calories: number | null
    resting_heart_rate: number | null
  }[]

  if (summaries.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">💗</p>
          <p className="text-lg font-semibold text-text-primary">No HRV data available</p>
          <p className="text-sm text-text-secondary mt-2">
            Apple Watch measures HRV during sleep. Sync your health data to see patterns.
          </p>
        </div>
      </div>
    )
  }

  // Baseline = average over all available days
  const allHrv = summaries.map((r) => r.avg_hrv)
  const baseline = allHrv.reduce((a, b) => a + b, 0) / allHrv.length

  // Zone classification vs personal baseline (±15%)
  const elevated = summaries.filter((r) => r.avg_hrv >= baseline * 1.15)
  const normal = summaries.filter((r) => r.avg_hrv >= baseline * 0.85 && r.avg_hrv < baseline * 1.15)
  const low = summaries.filter((r) => r.avg_hrv < baseline * 0.85)

  // Trend delta: last 30 days vs first 30 days
  const first30 = summaries.slice(0, 30)
  const last30 = summaries.slice(-30)
  const trendDelta =
    summaries.length >= 60
      ? (last30.reduce((a, b) => a + b.avg_hrv, 0) / last30.length) -
        (first30.reduce((a, b) => a + b.avg_hrv, 0) / first30.length)
      : null

  // DOW stats
  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  summaries.forEach((r) => {
    const day = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[day].push(r.avg_hrv)
  })
  const dowData = dowLabels.map((label, i) => {
    const vals = dowBuckets[i]
    if (vals.length === 0) return { label, avgHrv: null, count: 0, aboveBaselinePct: null }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    const aboveBaselinePct = Math.round((vals.filter((v) => v >= baseline).length / vals.length) * 100)
    return { label, avgHrv: Math.round(avg * 10) / 10, count: vals.length, aboveBaselinePct }
  })

  // Monthly stats (last 12 months)
  const monthMap = new Map<string, number[]>()
  summaries.forEach((r) => {
    const key = r.date.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(r.avg_hrv)
  })
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const monthNum = parseInt(key.slice(5, 7)) - 1
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      return {
        label: monthLabels[monthNum],
        avgHrv: Math.round(avg * 10) / 10,
        minHrv: Math.round(min * 10) / 10,
        maxHrv: Math.round(max * 10) / 10,
        count: vals.length,
      }
    })

  // Sleep correlation pairs: sleep hours vs same-day HRV
  const sleepPairs = summaries
    .filter((r) => r.sleep_duration_minutes && r.sleep_duration_minutes > 60)
    .map((r) => ({
      sleepHours: Math.round((r.sleep_duration_minutes! / 60) * 10) / 10,
      hrv: r.avg_hrv,
    }))
    .slice(-90) // cap to 90 for scatter performance

  // 30-day rolling trend line (for the trend chart)
  const trendData = summaries.slice(-90).map((r, i, arr) => {
    const window = arr.slice(Math.max(0, i - 6), i + 1)
    const rolling = Math.round((window.reduce((a, b) => a + b.avg_hrv, 0) / window.length) * 10) / 10
    return { date: r.date, hrv: r.avg_hrv, rolling }
  })

  const stats = {
    totalDays: summaries.length,
    avgHrv: Math.round(baseline * 10) / 10,
    minHrv: Math.round(Math.min(...allHrv) * 10) / 10,
    maxHrv: Math.round(Math.max(...allHrv) * 10) / 10,
    elevatedCount: elevated.length,
    normalCount: normal.length,
    lowCount: low.length,
    trendDelta: trendDelta !== null ? Math.round(trendDelta * 10) / 10 : null,
    baseline: Math.round(baseline * 10) / 10,
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">HRV Patterns</h1>
            <p className="text-sm text-text-secondary">
              {stats.totalDays} days · personal baseline {stats.baseline} ms
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HrvPatternsClient
          stats={stats}
          dowData={dowData}
          monthData={monthData}
          sleepPairs={sleepPairs}
          trendData={trendData}
        />
      </main>
      <BottomNav />
    </div>
  )
}
