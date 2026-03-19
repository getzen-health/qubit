import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BodyTrendsClient, type BodyTrendData } from './body-trends-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Body Weight Trends' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function BodyTrendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const startDate = oneYearAgo.toISOString().slice(0, 10)

  const { data: rawSummaries } = await supabase
    .from('daily_summaries')
    .select('date, weight_kg, body_fat_percent')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .gt('weight_kg', 0)
    .not('weight_kg', 'is', null)
    .order('date', { ascending: true })

  const summaries = (rawSummaries ?? []) as { date: string; weight_kg: number; body_fat_percent: number | null }[]

  if (summaries.length < 5) {
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
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">⚖️</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">Log at least 5 weight measurements to see trends.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const weights = summaries.map((s) => s.weight_kg)
  const latest = weights[weights.length - 1]
  const earliest = weights[0]
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const totalChange = latest - earliest

  // 7-day moving average (last point vs 7 days prior point)
  const last7 = summaries.slice(-7)
  const prev7Start = summaries.length >= 14 ? summaries.slice(-14, -7) : null
  const last7Avg = last7.reduce((s, r) => s + r.weight_kg, 0) / last7.length
  const prev7Avg = prev7Start && prev7Start.length > 0
    ? prev7Start.reduce((s, r) => s + r.weight_kg, 0) / prev7Start.length
    : null
  const weeklyChange = prev7Avg !== null ? +(last7Avg - prev7Avg).toFixed(2) : null

  // 30-day change
  const last30 = summaries.slice(-30)
  const firstOf30 = last30[0]?.weight_kg ?? null
  const change30 = firstOf30 !== null ? +(latest - firstOf30).toFixed(2) : null

  // Linear regression for trend slope (kg/week)
  const n = weights.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += weights[i]; sumXY += i * weights[i]; sumX2 += i * i
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  // slope is kg/measurement-day — convert to kg/week
  // average days between measurements
  const totalMeasurements = n
  const daysSpan = Math.max(1, (new Date(summaries[n-1].date).getTime() - new Date(summaries[0].date).getTime()) / 86400000)
  const measureFreq = daysSpan / totalMeasurements // avg days between measurements
  const weeklySlope = +(slope * 7 / measureFreq).toFixed(2)

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const s of summaries) {
    const dow = new Date(s.date + 'T12:00:00').getDay()
    dowBuckets[dow].push(s.weight_kg)
  }
  const overallAvg = avgWeight
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgWeight: bucket.length > 0 ? +(bucket.reduce((a, b) => a + b, 0) / bucket.length).toFixed(2) : null,
    diffFromAvg: bucket.length > 0
      ? +(bucket.reduce((a, b) => a + b, 0) / bucket.length - overallAvg).toFixed(2)
      : null,
  }))

  // Monthly summaries
  const monthBuckets: Record<string, number[]> = {}
  const monthBfBuckets: Record<string, number[]> = {}
  for (const s of summaries) {
    const key = s.date.slice(0, 7)
    if (!monthBuckets[key]) monthBuckets[key] = []
    monthBuckets[key].push(s.weight_kg)
    if (s.body_fat_percent && s.body_fat_percent > 0) {
      if (!monthBfBuckets[key]) monthBfBuckets[key] = []
      monthBfBuckets[key].push(s.body_fat_percent)
    }
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, bucket]) => {
      const [, month] = key.split('-')
      const bfBucket = monthBfBuckets[key] ?? []
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        count: bucket.length,
        avgWeight: +(bucket.reduce((a, b) => a + b, 0) / bucket.length).toFixed(2),
        minWeight: +Math.min(...bucket).toFixed(2),
        maxWeight: +Math.max(...bucket).toFixed(2),
        avgBf: bfBucket.length > 0 ? +(bfBucket.reduce((a, b) => a + b, 0) / bfBucket.length).toFixed(1) : null,
      }
    })

  // Body fat summary
  const bfData = summaries.filter((s) => s.body_fat_percent && s.body_fat_percent > 0)
  const latestBf = bfData.length > 0 ? bfData[bfData.length - 1].body_fat_percent : null
  const earliestBf = bfData.length > 0 ? bfData[0].body_fat_percent : null
  const bfChange = latestBf !== null && earliestBf !== null ? +(latestBf - earliestBf).toFixed(1) : null

  // Trend direction
  const trendDir = weeklySlope > 0.05 ? 'gaining' : weeklySlope < -0.05 ? 'losing' : 'maintaining'

  const profileData: BodyTrendData = {
    totalMeasurements,
    latest,
    earliest,
    minWeight: +minWeight.toFixed(2),
    maxWeight: +maxWeight.toFixed(2),
    avgWeight: +avgWeight.toFixed(2),
    totalChange: +totalChange.toFixed(2),
    weeklyChange,
    change30,
    weeklySlope,
    trendDir,
    latestBf,
    earliestBf,
    bfChange,
    dowData,
    monthData,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/body"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to body weight"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Body Weight Trends</h1>
            <p className="text-sm text-text-secondary">{totalMeasurements} measurements · {latest.toFixed(1)} kg now</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <BodyTrendsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
