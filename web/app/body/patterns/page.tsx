import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Scale } from 'lucide-react'
import dynamic from 'next/dynamic'
const BodyPatternsClient = dynamic(() => import('./body-patterns-client').then(m => ({ default: m.BodyPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Body Weight Trends' }

export default async function BodyPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawRows } = await supabase
    .from('daily_summaries')
    .select('date, weight_kg, body_fat_percent')
    .eq('user_id', user.id)
    .gte('date', oneYearAgo.toISOString().slice(0, 10))
    .not('weight_kg', 'is', null)
    .gt('weight_kg', 0)
    .order('date', { ascending: true })

  const rows = (rawRows ?? []).filter((r) => r.weight_kg && r.weight_kg > 0)

  if (rows.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/body" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Body Weight Trends</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Scale className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 5 weight measurements to see trends.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const weights = rows.map((r) => r.weight_kg!)
  const latest = weights[weights.length - 1]
  const earliest = weights[0]
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const totalChange = latest - earliest

  // Weekly change (last 7 vs prior 7)
  const last7 = rows.slice(-7)
  const prior7 = rows.length >= 14 ? rows.slice(-14, -7) : []
  const last7Avg = last7.reduce((a, r) => a + r.weight_kg!, 0) / last7.length
  const weeklyChange = prior7.length > 0
    ? last7Avg - (prior7.reduce((a, r) => a + r.weight_kg!, 0) / prior7.length)
    : null

  // 30-day change
  const last30 = rows.slice(-30)
  const change30 = last30.length >= 2 ? latest - last30[0].weight_kg! : null

  // Linear regression for weekly slope
  const n = weights.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += weights[i]; sumXY += i * weights[i]; sumX2 += i * i
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const weeklySlope = slope * 7
  const trendDir = weeklySlope > 0.05 ? 'gaining' : weeklySlope < -0.05 ? 'losing' : 'maintaining'

  // Body fat
  const bfRows = rows.filter((r) => (r.body_fat_percent ?? 0) > 0)
  const latestBf = bfRows.length > 0 ? bfRows[bfRows.length - 1].body_fat_percent : null
  const earliestBf = bfRows.length > 0 ? bfRows[0].body_fat_percent : null
  const bfChange = latestBf != null && earliestBf != null ? latestBf - earliestBf : null

  // DOW averages
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of rows) {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[dow].push(r.weight_kg!)
  }
  const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowData = dowBuckets.map((bucket, i) => {
    if (bucket.length === 0) return { label: dowLabels[i], avgWeight: null, count: 0, diffFromAvg: null }
    const avg = bucket.reduce((a, b) => a + b, 0) / bucket.length
    return { label: dowLabels[i], avgWeight: +avg.toFixed(2), count: bucket.length, diffFromAvg: +(avg - avgWeight).toFixed(2) }
  })

  // Monthly stats (last 12 months)
  const monthBuckets: Record<string, number[]> = {}
  const monthBfBuckets: Record<string, number[]> = {}
  for (const r of rows) {
    const key = r.date.slice(0, 7)
    ;(monthBuckets[key] = monthBuckets[key] ?? []).push(r.weight_kg!)
    if ((r.body_fat_percent ?? 0) > 0) {
      ;(monthBfBuckets[key] = monthBfBuckets[key] ?? []).push(r.body_fat_percent!)
    }
  }
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthData = Object.keys(monthBuckets).sort().slice(-12).map((key) => {
    const bucket = monthBuckets[key]
    const bfBucket = monthBfBuckets[key] ?? []
    const monthNum = parseInt(key.slice(5, 7), 10)
    const avg = bucket.reduce((a, b) => a + b, 0) / bucket.length
    const bf = bfBucket.length > 0 ? bfBucket.reduce((a, b) => a + b, 0) / bfBucket.length : null
    return {
      label: monthNames[monthNum - 1],
      key,
      avgWeight: +avg.toFixed(1),
      minWeight: +Math.min(...bucket).toFixed(1),
      maxWeight: +Math.max(...bucket).toFixed(1),
      avgBf: bf != null ? +bf.toFixed(1) : null,
      count: bucket.length,
    }
  })

  // 90-day trend data (daily points for chart)
  const trendData = rows.slice(-90).map((r) => ({
    date: r.date.slice(5), // MM-DD
    weight: +r.weight_kg!.toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/body" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Scale className="w-5 h-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Body Weight Trends</h1>
              <p className="text-sm text-text-secondary">{rows.length} measurements · past year</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <BodyPatternsClient
          stats={{
            latest,
            earliest,
            avg: +avgWeight.toFixed(1),
            minWeight,
            maxWeight,
            totalChange: +totalChange.toFixed(2),
            weeklyChange: weeklyChange != null ? +weeklyChange.toFixed(2) : null,
            change30: change30 != null ? +change30.toFixed(2) : null,
            weeklySlope: +weeklySlope.toFixed(3),
            trendDir,
            latestBf,
            earliestBf,
            bfChange: bfChange != null ? +bfChange.toFixed(1) : null,
            totalMeasurements: rows.length,
          }}
          dowData={dowData}
          monthData={monthData}
          trendData={trendData}
        />
      </main>
      <BottomNav />
    </div>
  )
}
