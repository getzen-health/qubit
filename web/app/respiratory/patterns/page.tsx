import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const RespiratoryPatternsClient = dynamic(() => import('./respiratory-patterns-client').then(m => ({ default: m.RespiratoryPatternsClient })))
import type { RespiratoryPatternData } from './respiratory-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Respiratory Rate Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function RespiratoryPatternsPage() {
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
    .eq('type', 'respiratory_rate')
    .gte('start_time', startIso)
    .gt('value', 4)
    .lt('value', 40)
    .order('start_time', { ascending: true })

  const readings = (records ?? []).map((r) => {
    const dt = new Date(r.start_time)
    const hour = dt.getHours()
    return {
      bpm: Math.round(r.value * 10) / 10,
      date: r.start_time.slice(0, 10),
      dow: dt.getDay(),
      hour,
      month: r.start_time.slice(0, 7),
      isNight: hour >= 22 || hour < 6,
    }
  })

  if (readings.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/respiratory" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Respiratory Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🌬️</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              At least 5 respiratory rate readings needed. Requires Apple Watch with sleep tracking enabled.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = readings.length
  const allBpm = readings.map((r) => r.bpm)
  const avgBpm = +(allBpm.reduce((s, v) => s + v, 0) / n).toFixed(1)
  const minBpm = Math.min(...allBpm)
  const maxBpm = Math.max(...allBpm)

  // Zone breakdown: Normal 12–20, Low <12, High >20
  const normalCount = readings.filter((r) => r.bpm >= 12 && r.bpm <= 20).length
  const lowCount = readings.filter((r) => r.bpm < 12).length
  const highCount = readings.filter((r) => r.bpm > 20).length

  // Night vs day
  const nightReadings = readings.filter((r) => r.isNight)
  const dayReadings = readings.filter((r) => !r.isNight)
  const nightAvg = nightReadings.length > 0
    ? +(nightReadings.reduce((s, r) => s + r.bpm, 0) / nightReadings.length).toFixed(1)
    : null
  const dayAvg = dayReadings.length > 0
    ? +(dayReadings.reduce((s, r) => s + r.bpm, 0) / dayReadings.length).toFixed(1)
    : null

  // Hourly averages (3-hour buckets)
  const hourBuckets = Array.from({ length: 8 }, (_, i) => {
    const h = i * 3
    const bucket = readings.filter((r) => r.hour >= h && r.hour < h + 3)
    return {
      label: `${h.toString().padStart(2, '0')}:00`,
      count: bucket.length,
      avgBpm: bucket.length > 0 ? +(bucket.reduce((s, r) => s + r.bpm, 0) / bucket.length).toFixed(1) : null,
    }
  }).filter((b) => b.count > 0)

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of readings) dowBuckets[r.dow].push(r.bpm)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgBpm: bucket.length > 0 ? +(bucket.reduce((s, v) => s + v, 0) / bucket.length).toFixed(1) : null,
    normalPct: bucket.length > 0
      ? Math.round(bucket.filter((v) => v >= 12 && v <= 20).length / bucket.length * 100)
      : null,
  }))

  // Monthly trend
  const monthBuckets: Record<string, number[]> = {}
  for (const r of readings) {
    if (!monthBuckets[r.month]) monthBuckets[r.month] = []
    monthBuckets[r.month].push(r.bpm)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        avgBpm: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
        minBpm: Math.min(...vals),
        maxBpm: Math.max(...vals),
        normalPct: Math.round(vals.filter((v) => v >= 12 && v <= 20).length / vals.length * 100),
        count: vals.length,
      }
    })

  const profileData: RespiratoryPatternData = {
    totalReadings: n,
    avgBpm,
    minBpm,
    maxBpm,
    normalCount,
    lowCount,
    highCount,
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
            href="/respiratory"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to respiratory"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Respiratory Patterns</h1>
            <p className="text-sm text-text-secondary">
              {n} readings · avg {avgBpm} br/min · {Math.round(normalCount / n * 100)}% in normal range
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RespiratoryPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
