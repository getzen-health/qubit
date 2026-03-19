import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GlucosePatternsClient, type GlucosePatternData } from './glucose-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Glucose Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// mg/dL ranges
const LOW_THRESHOLD = 70
const TARGET_LOW = 70
const TARGET_HIGH = 140  // tighter target (non-diabetic)
const ELEVATED_THRESHOLD = 180

function classifyGlucose(mgdl: number): 'low' | 'normal' | 'elevated' | 'high' {
  if (mgdl < LOW_THRESHOLD) return 'low'
  if (mgdl <= TARGET_HIGH) return 'normal'
  if (mgdl <= ELEVATED_THRESHOLD) return 'elevated'
  return 'high'
}

export default async function GlucosePatternsPage() {
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
    .eq('type', 'blood_glucose')
    .gte('start_time', startIso)
    .gt('value', 30)
    .lt('value', 600)
    .order('start_time', { ascending: true })

  const readings = (records ?? []).map((r) => {
    const dt = new Date(r.start_time)
    return {
      mgdl: Math.round(r.value),
      date: r.start_time.slice(0, 10),
      dow: dt.getDay(),
      hour: dt.getHours(),
      month: r.start_time.slice(0, 7),
    }
  })

  if (readings.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/glucose" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Glucose Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🩸</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">Log at least 5 glucose readings to see patterns.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = readings.length
  const mgdls = readings.map((r) => r.mgdl)
  const avgMgdl = Math.round(mgdls.reduce((s, v) => s + v, 0) / n)
  const minMgdl = Math.min(...mgdls)
  const maxMgdl = Math.max(...mgdls)
  const estA1c = +((avgMgdl + 46.7) / 28.7).toFixed(1)

  // Time in range
  const inRange = readings.filter((r) => r.mgdl >= TARGET_LOW && r.mgdl <= TARGET_HIGH).length
  const low = readings.filter((r) => r.mgdl < TARGET_LOW).length
  const elevated = readings.filter((r) => r.mgdl > TARGET_HIGH && r.mgdl <= ELEVATED_THRESHOLD).length
  const high = readings.filter((r) => r.mgdl > ELEVATED_THRESHOLD).length

  const rangeDist = [
    { label: 'Low', range: `<${TARGET_LOW}`, count: low, pct: Math.round(low / n * 100), colorClass: 'bg-red-500/70' },
    { label: 'In Range', range: `${TARGET_LOW}–${TARGET_HIGH}`, count: inRange, pct: Math.round(inRange / n * 100), colorClass: 'bg-green-500/70' },
    { label: 'Elevated', range: `${TARGET_HIGH + 1}–${ELEVATED_THRESHOLD}`, count: elevated, pct: Math.round(elevated / n * 100), colorClass: 'bg-amber-500/70' },
    { label: 'High', range: `>${ELEVATED_THRESHOLD}`, count: high, pct: Math.round(high / n * 100), colorClass: 'bg-red-600/70' },
  ]

  // DOW patterns
  const dowBuckets: typeof readings[] = Array.from({ length: 7 }, () => [])
  for (const r of readings) dowBuckets[r.dow].push(r)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgMgdl: bucket.length > 0 ? Math.round(bucket.reduce((s, r) => s + r.mgdl, 0) / bucket.length) : null,
    inRangePct: bucket.length > 0 ? Math.round(bucket.filter((r) => r.mgdl >= TARGET_LOW && r.mgdl <= TARGET_HIGH).length / bucket.length * 100) : null,
  }))

  // Time of day (3-hour buckets)
  const hourBuckets = Array.from({ length: 8 }, (_, i) => {
    const h = i * 3
    const bucket = readings.filter((r) => r.hour >= h && r.hour < h + 3)
    return {
      label: `${h.toString().padStart(2, '0')}:00`,
      count: bucket.length,
      avgMgdl: bucket.length > 0 ? Math.round(bucket.reduce((s, r) => s + r.mgdl, 0) / bucket.length) : null,
    }
  }).filter((b) => b.count > 0)

  // Named time periods
  const fasting = readings.filter((r) => r.hour >= 5 && r.hour < 9)
  const morning = readings.filter((r) => r.hour >= 9 && r.hour < 12)
  const afternoon = readings.filter((r) => r.hour >= 12 && r.hour < 17)
  const evening = readings.filter((r) => r.hour >= 17 && r.hour < 22)
  const night = readings.filter((r) => r.hour >= 22 || r.hour < 5)

  function periodAvg(rds: typeof readings): number | null {
    return rds.length > 0 ? Math.round(rds.reduce((s, r) => s + r.mgdl, 0) / rds.length) : null
  }
  const timePeriods = [
    { label: 'Fasting', icon: '🌅', time: '5–9am', avg: periodAvg(fasting), count: fasting.length },
    { label: 'Morning', icon: '☀️', time: '9am–12pm', avg: periodAvg(morning), count: morning.length },
    { label: 'Afternoon', icon: '🌤️', time: '12–5pm', avg: periodAvg(afternoon), count: afternoon.length },
    { label: 'Evening', icon: '🌆', time: '5–10pm', avg: periodAvg(evening), count: evening.length },
    { label: 'Night', icon: '🌙', time: '10pm–5am', avg: periodAvg(night), count: night.length },
  ].filter((p) => p.count > 0)

  // Monthly averages
  const monthBuckets: Record<string, number[]> = {}
  for (const r of readings) {
    if (!monthBuckets[r.month]) monthBuckets[r.month] = []
    monthBuckets[r.month].push(r.mgdl)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, bucket]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        count: bucket.length,
        avgMgdl: Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length),
        minMgdl: Math.min(...bucket),
        maxMgdl: Math.max(...bucket),
        inRangePct: Math.round(bucket.filter((v) => v >= TARGET_LOW && v <= TARGET_HIGH).length / bucket.length * 100),
      }
    })

  const profileData: GlucosePatternData = {
    totalReadings: n,
    avgMgdl,
    minMgdl,
    maxMgdl,
    estA1c,
    inRangePct: Math.round(inRange / n * 100),
    rangeDist,
    dowData,
    hourBuckets,
    timePeriods,
    monthData,
    targetLow: TARGET_LOW,
    targetHigh: TARGET_HIGH,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/glucose"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to glucose"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Glucose Patterns</h1>
            <p className="text-sm text-text-secondary">{n} readings · avg {avgMgdl} mg/dL · {Math.round(inRange / n * 100)}% in range</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <GlucosePatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
