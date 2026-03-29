import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const MonotonyClient = dynamic(() => import('./monotony-client').then(m => ({ default: m.MonotonyClient })), { ssr: false })

export const metadata = { title: 'Training Monotony & Strain' }

export type Zone = 'excellent' | 'good' | 'elevated' | 'high'

export interface WeekMetrics {
  monday: string        // YYYY-MM-DD
  weeklyLoad: number    // total minutes
  avgDailyLoad: number  // mean of 7 daily loads
  monotony: number      // mean / stdDev (0 if no activity)
  strain: number        // weeklyLoad * monotony
  zone: Zone
}

export interface MonotonyData {
  weekMetrics: WeekMetrics[]
  currentMonotony: number
  currentStrain: number
  currentZone: Zone
  avgMonotony: number
  peakStrain: number
}

function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

function classifyZone(monotony: number): Zone {
  if (monotony < 1.5) return 'excellent'
  if (monotony < 2.0) return 'good'
  if (monotony < 2.5) return 'elevated'
  return 'high'
}

export default async function MonotonyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7)

  const { data: raw } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', twelveWeeksAgo.toISOString())
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  const workouts = raw ?? []

  // Build a day → total minutes map
  const dayMinutes = new Map<string, number>()
  for (const w of workouts) {
    const dayStr = new Date(w.start_time).toISOString().split('T')[0]
    dayMinutes.set(dayStr, (dayMinutes.get(dayStr) ?? 0) + (w.duration_minutes ?? 0))
  }

  // Build 12 Monday-anchored week buckets
  const now = new Date()
  const thisMondayStr = getMondayOf(now)
  const thisMondayDate = new Date(thisMondayStr + 'T00:00:00Z')

  const weekMetrics: WeekMetrics[] = []

  for (let i = 11; i >= 0; i--) {
    const mondayDate = new Date(thisMondayDate)
    mondayDate.setUTCDate(thisMondayDate.getUTCDate() - i * 7)
    const mondayStr = mondayDate.toISOString().split('T')[0]

    // Collect 7 daily loads (Mon through Sun)
    const dailyLoads: number[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(mondayDate)
      day.setUTCDate(mondayDate.getUTCDate() + d)
      const dayStr = day.toISOString().split('T')[0]
      dailyLoads.push(dayMinutes.get(dayStr) ?? 0)
    }

    const weeklyLoad = dailyLoads.reduce((a, b) => a + b, 0)
    const avgDailyLoad = weeklyLoad / 7

    // Standard deviation
    const variance =
      dailyLoads.reduce((sum, v) => sum + (v - avgDailyLoad) ** 2, 0) / 7
    const stdDev = Math.sqrt(variance)

    let monotony: number
    if (weeklyLoad === 0) {
      monotony = 0
    } else if (stdDev === 0) {
      // All 7 days are identical and non-zero — maximally monotonous
      monotony = 2.5
    } else {
      monotony = avgDailyLoad / stdDev
    }

    const strain = weeklyLoad * monotony
    const zone = classifyZone(monotony)

    weekMetrics.push({ monday: mondayStr, weeklyLoad, avgDailyLoad, monotony, strain, zone })
  }

  // Summary stats
  const activeWeeks = weekMetrics.filter((w) => w.weeklyLoad > 0)
  const currentMetrics = weekMetrics[weekMetrics.length - 1]
  const currentMonotony = currentMetrics?.monotony ?? 0
  const currentStrain = currentMetrics?.strain ?? 0
  const currentZone = currentMetrics?.zone ?? 'excellent'

  const avgMonotony =
    activeWeeks.length > 0
      ? activeWeeks.reduce((a, w) => a + w.monotony, 0) / activeWeeks.length
      : 0

  const peakStrain = weekMetrics.reduce((max, w) => Math.max(max, w.strain), 0)

  const data: MonotonyData = {
    weekMetrics,
    currentMonotony,
    currentStrain,
    currentZone,
    avgMonotony,
    peakStrain,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Monotony &amp; Strain</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Training variety index · 12 weeks</p>
          </div>
          <BarChart2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <MonotonyClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
