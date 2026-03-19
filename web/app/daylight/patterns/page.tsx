import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DaylightPatternsClient, type DaylightPatternData } from './daylight-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Daylight Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Daylight zones (minutes)
const ZONES = [
  { label: 'Very Low', min: 0, max: 5, colorClass: 'bg-red-500/70', color: '#ef4444' },
  { label: 'Below Goal', min: 5, max: 20, colorClass: 'bg-amber-500/70', color: '#f59e0b' },
  { label: 'Goal Met', min: 20, max: 60, colorClass: 'bg-green-500/70', color: '#22c55e' },
  { label: 'Excellent', min: 60, max: Infinity, colorClass: 'bg-orange-500/70', color: '#f97316' },
]

function classifyZone(minutes: number): 'very_low' | 'below_goal' | 'goal' | 'excellent' {
  if (minutes >= 60) return 'excellent'
  if (minutes >= 20) return 'goal'
  if (minutes >= 5) return 'below_goal'
  return 'very_low'
}

export default async function DaylightPatternsPage() {
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
    .select('start_time, value')
    .eq('user_id', user.id)
    .eq('type', 'time_in_daylight')
    .gte('start_time', startIso)
    .gte('value', 0)
    .order('start_time', { ascending: true })

  // Aggregate to daily totals
  const byDay = new Map<string, number>()
  for (const r of records ?? []) {
    const day = r.start_time.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + r.value)
  }
  const dailyReadings = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({
      date,
      minutes: +minutes.toFixed(1),
      dow: new Date(date + 'T12:00:00').getDay(),
      month: date.slice(0, 7),
    }))

  if (dailyReadings.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/daylight" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Daylight Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">☀️</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              At least 5 days of daylight data needed. Requires iPhone outdoors with iOS 17+.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = dailyReadings.length
  const allMins = dailyReadings.map((r) => r.minutes)
  const avgMinutes = +(allMins.reduce((s, v) => s + v, 0) / n).toFixed(1)
  const goalHitDays = dailyReadings.filter((r) => r.minutes >= 20).length
  const goalHitPct = Math.round((goalHitDays / n) * 100)

  // Streak (consecutive goal-met days)
  let currentStreak = 0
  let longestStreak = 0
  let temp = 0
  for (const r of dailyReadings) {
    if (r.minutes >= 20) {
      temp++
      longestStreak = Math.max(longestStreak, temp)
    } else {
      temp = 0
    }
  }
  // current streak from end
  for (let i = dailyReadings.length - 1; i >= 0; i--) {
    if (dailyReadings[i].minutes >= 20) currentStreak++
    else break
  }

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const r of dailyReadings) dowBuckets[r.dow].push(r.minutes)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    avg: bucket.length > 0 ? +(bucket.reduce((s, v) => s + v, 0) / bucket.length).toFixed(1) : null,
    count: bucket.length,
    goalPct: bucket.length > 0 ? Math.round(bucket.filter((v) => v >= 20).length / bucket.length * 100) : null,
  }))

  // Monthly trend
  const monthBuckets: Record<string, number[]> = {}
  for (const r of dailyReadings) {
    if (!monthBuckets[r.month]) monthBuckets[r.month] = []
    monthBuckets[r.month].push(r.minutes)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const [, month] = key.split('-')
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        avg: +avg.toFixed(1),
        goalPct: Math.round(vals.filter((v) => v >= 20).length / vals.length * 100),
        count: vals.length,
      }
    })

  // Zone breakdown
  const zoneCounts = ZONES.map((z) => ({
    label: z.label,
    count: dailyReadings.filter((r) => r.minutes >= z.min && r.minutes < z.max).length,
    pct: Math.round(dailyReadings.filter((r) => r.minutes >= z.min && r.minutes < z.max).length / n * 100),
    colorClass: z.colorClass,
  }))

  // Distribution histogram
  const histBuckets = [
    { label: '0–5m', min: 0, max: 5 },
    { label: '5–10m', min: 5, max: 10 },
    { label: '10–20m', min: 10, max: 20 },
    { label: '20–30m', min: 20, max: 30 },
    { label: '30–60m', min: 30, max: 60 },
    { label: '60–90m', min: 60, max: 90 },
    { label: '90m+', min: 90, max: Infinity },
  ]
  const histogram = histBuckets
    .map((b) => ({
      label: b.label,
      count: dailyReadings.filter((r) => r.minutes >= b.min && r.minutes < b.max).length,
    }))
    .filter((b) => b.count > 0)

  // Best/worst DOW
  const validDow = dowData.filter((d) => d.avg !== null && d.count >= 2)
  const bestDow = validDow.length > 0 ? validDow.reduce((a, b) => (a.avg! > b.avg! ? a : b)) : null
  const worstDow = validDow.length > 0 ? validDow.reduce((a, b) => (a.avg! < b.avg! ? a : b)) : null

  const profileData: DaylightPatternData = {
    totalDays: n,
    avgMinutes,
    goalHitDays,
    goalHitPct,
    currentStreak,
    longestStreak,
    bestDow: bestDow?.label ?? null,
    worstDow: worstDow?.label ?? null,
    dowData,
    monthData,
    zoneCounts,
    histogram,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/daylight"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to daylight"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Daylight Patterns</h1>
            <p className="text-sm text-text-secondary">
              {n} days · {avgMinutes}m avg · {goalHitPct}% days at goal
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <DaylightPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
