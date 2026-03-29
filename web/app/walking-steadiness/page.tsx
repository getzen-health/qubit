import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const WalkingSteadinessClient = dynamic(() => import('./walking-steadiness-client').then(m => ({ default: m.WalkingSteadinessClient })), { ssr: false })
import type { SteadinessData } from './walking-steadiness-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Walking Steadiness' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function classifyZone(pct: number): 'ok' | 'low' | 'very_low' {
  if (pct >= 60) return 'ok'
  if (pct >= 40) return 'low'
  return 'very_low'
}

export default async function WalkingSteadinessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'walking_steadiness')
    .gte('start_time', startIso)
    .gt('value', 0)
    .lte('value', 100)
    .order('start_time', { ascending: true })

  // Deduplicate: one reading per day (average)
  const byDay = new Map<string, number[]>()
  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(r.value)
  }
  const dailyReadings = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      pct: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
      dow: new Date(date + 'T12:00:00').getDay(),
      month: date.slice(0, 7),
    }))

  if (dailyReadings.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Walking Steadiness</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🚶</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No Steadiness Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Walking Steadiness is measured automatically by iPhone on iOS 15+ and requires walking with your iPhone.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = dailyReadings.length
  const latest = dailyReadings[n - 1].pct
  const latestZone = classifyZone(latest)
  const allPct = dailyReadings.map((r) => r.pct)
  const avgPct = Math.round((allPct.reduce((s, v) => s + v, 0) / n) * 10) / 10
  const minPct = Math.min(...allPct)
  const maxPct = Math.max(...allPct)

  // 7-day trend vs prior 7 days
  const recent7 = dailyReadings.slice(-7).map((r) => r.pct)
  const prior7 = dailyReadings.slice(-14, -7).map((r) => r.pct)
  const recent7Avg = recent7.length > 0 ? recent7.reduce((s, v) => s + v, 0) / recent7.length : null
  const prior7Avg = prior7.length > 0 ? prior7.reduce((s, v) => s + v, 0) / prior7.length : null
  const trendVsLastWeek =
    recent7Avg !== null && prior7Avg !== null ? +(recent7Avg - prior7Avg).toFixed(1) : null

  // Trend data for chart
  const trendData = dailyReadings.map((r) => ({ date: r.date, pct: r.pct }))

  // DOW averages
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of dailyReadings) dowBuckets[r.dow].push(r.pct)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    avg: bucket.length > 0 ? Math.round((bucket.reduce((s, v) => s + v, 0) / bucket.length) * 10) / 10 : null,
    count: bucket.length,
  }))

  // Monthly averages
  const monthBuckets: Record<string, number[]> = {}
  for (const r of dailyReadings) {
    if (!monthBuckets[r.month]) monthBuckets[r.month] = []
    monthBuckets[r.month].push(r.pct)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        avg: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
        count: vals.length,
      }
    })

  // Zone breakdown
  const okDays = dailyReadings.filter((r) => r.pct >= 60).length
  const lowDays = dailyReadings.filter((r) => r.pct >= 40 && r.pct < 60).length
  const veryLowDays = dailyReadings.filter((r) => r.pct < 40).length

  const data: SteadinessData = {
    latest,
    latestZone,
    avgPct,
    minPct,
    maxPct,
    n,
    trendVsLastWeek,
    trendData,
    dowData,
    monthData,
    okDays,
    lowDays,
    veryLowDays,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Walking Steadiness</h1>
            <p className="text-sm text-text-secondary">{n} days · 90-day gait stability analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <WalkingSteadinessClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
