import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const OxygenPatternsClient = dynamic(() => import('./oxygen-patterns-client').then(m => ({ default: m.OxygenPatternsClient })))
import type { OxygenPatternData } from './oxygen-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'SpO₂ Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function classifyZone(pct: number): 'normal' | 'mild' | 'low' {
  if (pct >= 95) return 'normal'
  if (pct >= 90) return 'mild'
  return 'low'
}

export default async function OxygenPatternsPage() {
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
    .eq('type', 'oxygen_saturation')
    .gte('start_time', startIso)
    .gt('value', 50)
    .lte('value', 100)
    .order('start_time', { ascending: true })

  const readings = (records ?? []).map((r) => {
    const dt = new Date(r.start_time)
    const hour = dt.getHours()
    return {
      pct: Math.round(r.value * 10) / 10,
      date: r.start_time.slice(0, 10),
      dow: dt.getDay(),
      hour,
      month: r.start_time.slice(0, 7),
      isNight: hour >= 22 || hour < 6, // 10pm–6am = likely sleep
    }
  })

  if (readings.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/oxygen" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">SpO₂ Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🫁</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              At least 5 SpO₂ readings needed. Requires Apple Watch with blood oxygen feature enabled.
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

  // Zone breakdown
  const normalCount = readings.filter((r) => r.pct >= 95).length
  const mildCount = readings.filter((r) => r.pct >= 90 && r.pct < 95).length
  const lowCount = readings.filter((r) => r.pct < 90).length

  // Night vs day
  const nightReadings = readings.filter((r) => r.isNight)
  const dayReadings = readings.filter((r) => !r.isNight)
  const nightAvg = nightReadings.length > 0
    ? +(nightReadings.reduce((s, r) => s + r.pct, 0) / nightReadings.length).toFixed(1)
    : null
  const dayAvg = dayReadings.length > 0
    ? +(dayReadings.reduce((s, r) => s + r.pct, 0) / dayReadings.length).toFixed(1)
    : null

  // Hourly averages (3-hour buckets)
  const hourBuckets = Array.from({ length: 8 }, (_, i) => {
    const h = i * 3
    const bucket = readings.filter((r) => r.hour >= h && r.hour < h + 3)
    return {
      label: `${h.toString().padStart(2, '0')}:00`,
      count: bucket.length,
      avgPct: bucket.length > 0 ? +(bucket.reduce((s, r) => s + r.pct, 0) / bucket.length).toFixed(1) : null,
    }
  }).filter((b) => b.count > 0)

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of readings) dowBuckets[r.dow].push(r.pct)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgPct: bucket.length > 0 ? +(bucket.reduce((s, v) => s + v, 0) / bucket.length).toFixed(1) : null,
    normalPct: bucket.length > 0 ? Math.round(bucket.filter((v) => v >= 95).length / bucket.length * 100) : null,
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
        normalPct: Math.round(vals.filter((v) => v >= 95).length / vals.length * 100),
        count: vals.length,
      }
    })

  const profileData: OxygenPatternData = {
    totalReadings: n,
    avgPct,
    minPct,
    maxPct,
    normalCount,
    mildCount,
    lowCount,
    nightAvg,
    dayAvg,
    nightCount: nightReadings.length,
    dayCount: dayReadings.length,
    hourBuckets,
    dowData,
    monthData,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/oxygen"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to oxygen"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">SpO₂ Patterns</h1>
            <p className="text-sm text-text-secondary">
              {n} readings · avg {avgPct}% · {Math.round(normalCount / n * 100)}% in normal range
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <OxygenPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
