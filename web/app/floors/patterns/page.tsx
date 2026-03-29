import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const FloorsPatternsClient = dynamic(() => import('./floors-patterns-client').then(m => ({ default: m.FloorsPatternsClient })))
import type { FloorsPatternData } from './floors-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Floors Climbed Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const GOAL = 10 // Apple default: 10 flights/day

export default async function FloorsPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, floors_climbed')
    .eq('user_id', user.id)
    .gte('date', oneYearAgo.toISOString().slice(0, 10))
    .not('floors_climbed', 'is', null)
    .gt('floors_climbed', 0)
    .order('date', { ascending: true })

  const days = (summaries ?? []).map((s) => {
    const dt = new Date(s.date + 'T00:00:00')
    return {
      floors: s.floors_climbed as number,
      date: s.date,
      dow: dt.getDay(),
      month: s.date.slice(0, 7),
    }
  })

  if (days.length < 7) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/floors" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Floors Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🏗️</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">At least 7 days of floor data needed.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = days.length
  const allFloors = days.map((d) => d.floors)
  const avgFloors = +(allFloors.reduce((s, v) => s + v, 0) / n).toFixed(1)
  const maxFloors = Math.max(...allFloors)
  const totalFloors = allFloors.reduce((s, v) => s + v, 0)
  const goalDays = days.filter((d) => d.floors >= GOAL).length

  // Current streak
  let currentStreak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].floors >= GOAL) currentStreak++
    else break
  }
  // Longest streak
  let longestStreak = 0
  let curStreak = 0
  for (const d of days) {
    if (d.floors >= GOAL) { curStreak++; longestStreak = Math.max(longestStreak, curStreak) }
    else curStreak = 0
  }

  // Distribution buckets: 1-4, 5-9, 10-14, 15-19, 20-29, 30+
  const distBuckets = [
    { label: '1–4', count: 0, min: 1, max: 4 },
    { label: '5–9', count: 0, min: 5, max: 9 },
    { label: '10–14', count: 0, min: 10, max: 14 },
    { label: '15–19', count: 0, min: 15, max: 19 },
    { label: '20–29', count: 0, min: 20, max: 29 },
    { label: '30+', count: 0, min: 30, max: Infinity },
  ]
  for (const f of allFloors) {
    for (const b of distBuckets) {
      if (f >= b.min && f <= b.max) { b.count++; break }
    }
  }

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const d of days) dowBuckets[d.dow].push(d.floors)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgFloors: bucket.length > 0 ? +(bucket.reduce((s, v) => s + v, 0) / bucket.length).toFixed(1) : null,
    goalPct: bucket.length > 0
      ? Math.round(bucket.filter((v) => v >= GOAL).length / bucket.length * 100)
      : null,
  }))

  // Monthly trend
  const monthBuckets: Record<string, number[]> = {}
  for (const d of days) {
    if (!monthBuckets[d.month]) monthBuckets[d.month] = []
    monthBuckets[d.month].push(d.floors)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, vals]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        avgFloors: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
        maxFloors: Math.max(...vals),
        goalPct: Math.round(vals.filter((v) => v >= GOAL).length / vals.length * 100),
        count: vals.length,
      }
    })

  const profileData: FloorsPatternData = {
    totalDays: n,
    avgFloors,
    maxFloors,
    totalFloors,
    goalDays,
    goal: GOAL,
    currentStreak,
    longestStreak,
    distBuckets: distBuckets.filter((b) => b.count > 0),
    dowData,
    monthData,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/floors"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to floors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Floors Patterns</h1>
            <p className="text-sm text-text-secondary">
              {n} days · avg {avgFloors} floors · {Math.round(goalDays / n * 100)}% goal days
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <FloorsPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
