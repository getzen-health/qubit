import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CheckinPatternsClient, type CheckinPatternData } from './checkin-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Check-in Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function CheckinPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const startDate = oneYearAgo.toISOString().slice(0, 10)

  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('date, energy, mood, stress')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .not('date', 'is', null)
    .order('date', { ascending: true })

  const rows = (checkins ?? []).filter(
    (c) => c.energy !== null || c.mood !== null || c.stress !== null,
  )

  if (rows.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/checkin" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Check-in Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">📋</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Log your mood and energy for at least 5 days to see patterns.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const totalN = rows.length
  const energyRows = rows.filter((r) => r.energy !== null)
  const moodRows = rows.filter((r) => r.mood !== null)
  const stressRows = rows.filter((r) => r.stress !== null)

  const avg = (vals: (number | null)[]): number => {
    const v = vals.filter((x): x is number => x !== null)
    return v.length > 0 ? +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(2) : 0
  }

  const overallEnergy = avg(energyRows.map((r) => r.energy))
  const overallMood = avg(moodRows.map((r) => r.mood))
  const overallStress = avg(stressRows.map((r) => r.stress))

  // DOW breakdown
  const dowBuckets: typeof rows[] = Array.from({ length: 7 }, () => [])
  for (const r of rows) {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[dow].push(r)
  }
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgEnergy: avg(bucket.map((r) => r.energy)),
    avgMood: avg(bucket.map((r) => r.mood)),
    avgStress: avg(bucket.map((r) => r.stress)),
  }))

  // Monthly averages
  const monthBuckets: Record<string, typeof rows> = {}
  for (const r of rows) {
    const key = r.date.slice(0, 7)
    if (!monthBuckets[key]) monthBuckets[key] = []
    monthBuckets[key].push(r)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, bucket]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        count: bucket.length,
        avgEnergy: avg(bucket.map((r) => r.energy)),
        avgMood: avg(bucket.map((r) => r.mood)),
        avgStress: avg(bucket.map((r) => r.stress)),
      }
    })

  // Score distributions (1–5 for each metric)
  const energyDist = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: energyRows.filter((r) => r.energy === score).length,
    pct: energyRows.length > 0 ? Math.round(energyRows.filter((r) => r.energy === score).length / energyRows.length * 100) : 0,
  }))
  const moodDist = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: moodRows.filter((r) => r.mood === score).length,
    pct: moodRows.length > 0 ? Math.round(moodRows.filter((r) => r.mood === score).length / moodRows.length * 100) : 0,
  }))
  const stressDist = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: stressRows.filter((r) => r.stress === score).length,
    pct: stressRows.length > 0 ? Math.round(stressRows.filter((r) => r.stress === score).length / stressRows.length * 100) : 0,
  }))

  // Weekday vs weekend
  const weekdayRows = rows.filter((r) => {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    return dow >= 1 && dow <= 5
  })
  const weekendRows = rows.filter((r) => {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    return dow === 0 || dow === 6
  })
  const weekdayAvgEnergy = weekdayRows.length > 0 ? avg(weekdayRows.map((r) => r.energy)) : null
  const weekendAvgEnergy = weekendRows.length > 0 ? avg(weekendRows.map((r) => r.energy)) : null
  const weekdayAvgMood = weekdayRows.length > 0 ? avg(weekdayRows.map((r) => r.mood)) : null
  const weekendAvgMood = weekendRows.length > 0 ? avg(weekendRows.map((r) => r.mood)) : null
  const weekdayAvgStress = weekdayRows.length > 0 ? avg(weekdayRows.map((r) => r.stress)) : null
  const weekendAvgStress = weekendRows.length > 0 ? avg(weekendRows.map((r) => r.stress)) : null

  // Best/worst DOW by mood
  const dowWithMood = dowData.filter((d) => d.avgMood > 0 && d.count >= 2)
  const bestMoodDow = dowWithMood.length > 0 ? dowWithMood.reduce((a, b) => (a.avgMood > b.avgMood ? a : b)) : null
  const worstMoodDow = dowWithMood.length > 0 ? dowWithMood.reduce((a, b) => (a.avgMood < b.avgMood ? a : b)) : null
  const highStressDow = dowData.filter((d) => d.avgStress > 0 && d.count >= 2).reduce<(typeof dowData)[0] | null>((a, b) => (!a || b.avgStress > a.avgStress ? b : a), null)

  const profileData: CheckinPatternData = {
    totalDays: totalN,
    overallEnergy,
    overallMood,
    overallStress,
    dowData,
    monthData,
    energyDist,
    moodDist,
    stressDist,
    weekdayAvgEnergy,
    weekendAvgEnergy,
    weekdayAvgMood,
    weekendAvgMood,
    weekdayAvgStress,
    weekendAvgStress,
    bestMoodDow: bestMoodDow?.label ?? null,
    worstMoodDow: worstMoodDow?.label ?? null,
    highStressDow: highStressDow?.label ?? null,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/checkin"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to check-in"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Check-in Patterns</h1>
            <p className="text-sm text-text-secondary">{totalN} days logged</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CheckinPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
