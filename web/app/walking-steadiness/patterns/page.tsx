import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const WalkingPatternsClient = dynamic(() => import('./walking-patterns-client').then(m => ({ default: m.WalkingPatternsClient })), { ssr: false })
import type { WalkingPatternData } from './walking-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Walking Steadiness Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function classifyZone(pct: number): 'ok' | 'low' | 'very_low' {
  if (pct >= 60) return 'ok'
  if (pct >= 40) return 'low'
  return 'very_low'
}

export default async function WalkingSteadinessPatternPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const startIso = oneYearAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'walking_steadiness')
    .gte('start_time', startIso)
    .gte('value', 0)
    .lte('value', 100)
    .order('start_time', { ascending: true })

  // Deduplicate to daily averages
  const byDay = new Map<string, number[]>()
  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(r.value)
  }

  const readings = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => {
      const dt = new Date(date + 'T00:00:00')
      return {
        pct: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
        date,
        dow: dt.getDay(),
        month: date.slice(0, 7),
      }
    })

  if (readings.length < 7) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/walking-steadiness" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Steadiness Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🚶</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              At least 7 days needed. Walking Steadiness requires iPhone 8 or later with iOS 15+.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = readings.length
  const allPct = readings.map((r) => r.pct)
  const avgPct = +(allPct.reduce((s, v) => s + v, 0) / n).toFixed(1)
  const minPct = Math.min(...allPct)
  const maxPct = Math.max(...allPct)

  const okCount = readings.filter((r) => r.pct >= 60).length
  const lowCount = readings.filter((r) => r.pct >= 40 && r.pct < 60).length
  const veryLowCount = readings.filter((r) => r.pct < 40).length

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of readings) dowBuckets[r.dow].push(r.pct)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgPct: bucket.length > 0 ? +(bucket.reduce((s, v) => s + v, 0) / bucket.length).toFixed(1) : null,
    okPct: bucket.length > 0
      ? Math.round(bucket.filter((v) => v >= 60).length / bucket.length * 100)
      : null,
  }))

  // Monthly trend
  const monthBuckets: Record<string, number[]> = {}
  for (const r of readings) {
    if (!monthBuckets[r.month]) monthBuckets[r.month] = []
    monthBuckets[r.month].push(r.pct)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        avgPct: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
        minPct: Math.min(...vals),
        okPct: Math.round(vals.filter((v) => v >= 60).length / vals.length * 100),
        count: vals.length,
      }
    })

  // 7-day rolling average for trend detection
  const trendData = readings.slice(-90).map((r, i, arr) => {
    const slice = arr.slice(Math.max(0, i - 6), i + 1)
    const rolling = +(slice.reduce((s, x) => s + x.pct, 0) / slice.length).toFixed(1)
    return { date: r.date, pct: r.pct, rolling }
  })

  // Trend: compare first 30 days vs last 30 days
  const first30 = readings.slice(0, 30).map((r) => r.pct)
  const last30 = readings.slice(-30).map((r) => r.pct)
  const firstAvg = first30.length > 0 ? first30.reduce((s, v) => s + v, 0) / first30.length : null
  const lastAvg = last30.length > 0 ? last30.reduce((s, v) => s + v, 0) / last30.length : null
  const trendDelta = firstAvg !== null && lastAvg !== null ? +(lastAvg - firstAvg).toFixed(1) : null

  const profileData: WalkingPatternData = {
    totalDays: n,
    avgPct,
    minPct,
    maxPct,
    okCount,
    lowCount,
    veryLowCount,
    trendDelta,
    dowData,
    monthData,
    trendData,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/walking-steadiness"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to walking steadiness"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Steadiness Patterns</h1>
            <p className="text-sm text-text-secondary">
              {n} days · avg {avgPct}% · {Math.round(okCount / n * 100)}% in OK range
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WalkingPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
