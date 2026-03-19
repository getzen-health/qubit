import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HearingPatternsClient, type HearingPatternData } from './hearing-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Hearing Health Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// WHO noise exposure zones
function classifyDb(db: number): 'safe' | 'moderate' | 'loud' | 'dangerous' {
  if (db < 70) return 'safe'
  if (db < 80) return 'moderate'
  if (db < 90) return 'loud'
  return 'dangerous'
}

export default async function HearingPatternsPage() {
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
    .select('start_time, type, value')
    .eq('user_id', user.id)
    .in('type', ['headphone_audio_exposure', 'environmental_audio_exposure'])
    .gte('start_time', startIso)
    .order('start_time', { ascending: true })

  const allRecords = (records ?? []).map((r) => {
    const dt = new Date(r.start_time)
    return {
      db: r.value,
      type: r.type as 'headphone_audio_exposure' | 'environmental_audio_exposure',
      date: r.start_time.slice(0, 10),
      dow: dt.getDay(),
      hour: dt.getHours(),
      month: r.start_time.slice(0, 7),
    }
  })

  if (allRecords.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/hearing" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Hearing Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">👂</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Audio exposure data requires Apple Watch or AirPods with noise monitoring.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const headphone = allRecords.filter((r) => r.type === 'headphone_audio_exposure')
  const environmental = allRecords.filter((r) => r.type === 'environmental_audio_exposure')

  // Combine for overall stats
  const allDb = allRecords.map((r) => r.db)
  const avgDb = +(allDb.reduce((s, v) => s + v, 0) / allDb.length).toFixed(1)
  const maxDb = Math.max(...allDb)

  // Zone breakdown
  const safeCount = allRecords.filter((r) => classifyDb(r.db) === 'safe').length
  const moderateCount = allRecords.filter((r) => classifyDb(r.db) === 'moderate').length
  const loudCount = allRecords.filter((r) => classifyDb(r.db) === 'loud').length
  const dangerousCount = allRecords.filter((r) => classifyDb(r.db) === 'dangerous').length
  const total = allRecords.length

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of allRecords) dowBuckets[r.dow].push(r.db)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgDb: bucket.length > 0 ? +(bucket.reduce((s, v) => s + v, 0) / bucket.length).toFixed(1) : null,
    safePct: bucket.length > 0
      ? Math.round(bucket.filter((v) => classifyDb(v) === 'safe').length / bucket.length * 100)
      : null,
  }))

  // Monthly trend (aggregate to daily averages first, then monthly)
  const monthBuckets: Record<string, number[]> = {}
  for (const r of allRecords) {
    if (!monthBuckets[r.month]) monthBuckets[r.month] = []
    monthBuckets[r.month].push(r.db)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        avgDb: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
        maxDb: Math.max(...vals),
        loudPct: Math.round(vals.filter((v) => v >= 80).length / vals.length * 100),
        count: vals.length,
      }
    })

  // Hourly buckets (3-hour)
  const hourBuckets = Array.from({ length: 8 }, (_, i) => {
    const h = i * 3
    const bucket = allRecords.filter((r) => r.hour >= h && r.hour < h + 3)
    return {
      label: `${h.toString().padStart(2, '0')}:00`,
      count: bucket.length,
      avgDb: bucket.length > 0 ? +(bucket.reduce((s, r) => s + r.db, 0) / bucket.length).toFixed(1) : null,
    }
  }).filter((b) => b.count > 0)

  // Headphone stats
  const headphoneAvg = headphone.length > 0
    ? +(headphone.reduce((s, r) => s + r.db, 0) / headphone.length).toFixed(1)
    : null
  const envAvg = environmental.length > 0
    ? +(environmental.reduce((s, r) => s + r.db, 0) / environmental.length).toFixed(1)
    : null

  const profileData: HearingPatternData = {
    totalReadings: total,
    avgDb,
    maxDb,
    safeCount,
    moderateCount,
    loudCount,
    dangerousCount,
    headphoneAvg,
    envAvg,
    headphoneCount: headphone.length,
    envCount: environmental.length,
    dowData,
    hourBuckets,
    monthData,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hearing"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to hearing"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Hearing Patterns</h1>
            <p className="text-sm text-text-secondary">
              {total} readings · avg {avgDb} dB · {Math.round(safeCount / total * 100)}% safe
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HearingPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
