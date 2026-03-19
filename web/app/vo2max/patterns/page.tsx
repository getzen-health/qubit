import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VO2PatternClient } from './vo2-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'VO₂ Max Patterns' }

function fitnessLevel(vo2: number): { label: string; color: string } {
  if (vo2 >= 59) return { label: 'Elite', color: '#a855f7' }
  if (vo2 >= 51) return { label: 'Excellent', color: '#22c55e' }
  if (vo2 >= 44) return { label: 'Good', color: '#84cc16' }
  if (vo2 >= 38) return { label: 'Average', color: '#f59e0b' }
  if (vo2 >= 30) return { label: 'Below Avg', color: '#f97316' }
  return { label: 'Poor', color: '#ef4444' }
}

export default async function VO2PatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const { data: records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'vo2_max')
    .gte('start_time', twoYearsAgo.toISOString())
    .gt('value', 10)
    .lte('value', 80)
    .order('start_time', { ascending: true })

  const rows = (records ?? []) as { value: number; start_time: string }[]

  if (rows.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">🫀</p>
          <p className="text-lg font-semibold text-text-primary">No VO₂ Max data</p>
          <p className="text-sm text-text-secondary mt-2">
            Apple Watch estimates VO₂ Max during outdoor runs and walks. Enable cardio fitness tracking and sync your data.
          </p>
        </div>
      </div>
    )
  }

  // Deduplicate to weekly averages for cleaner trend
  const weekMap = new Map<string, number[]>()
  rows.forEach((r) => {
    const d = new Date(r.start_time)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    if (!weekMap.has(key)) weekMap.set(key, [])
    weekMap.get(key)!.push(r.value)
  })
  const weeklyPoints = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      vo2: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    }))

  // Monthly averages
  const monthMap = new Map<string, number[]>()
  rows.forEach((r) => {
    const key = r.start_time.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(r.value)
  })
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([key, vals]) => {
      const monthNum = parseInt(key.slice(5, 7)) - 1
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const level = fitnessLevel(avg)
      return {
        label: `${monthLabels[monthNum]} ${key.slice(0, 4)}`,
        shortLabel: monthLabels[monthNum],
        avgVO2: Math.round(avg * 10) / 10,
        minVO2: Math.round(min * 10) / 10,
        maxVO2: Math.round(max * 10) / 10,
        level: level.label,
        levelColor: level.color,
        count: vals.length,
      }
    })

  // Fitness level history (most common level per month)
  const levelHistory = monthData.map((m) => ({
    label: m.shortLabel,
    level: m.level,
    color: m.levelColor,
    vo2: m.avgVO2,
  }))

  const allValues = rows.map((r) => r.value)
  const latest = allValues[allValues.length - 1]
  const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)

  // Trend: last 90 days vs 90-180 days ago
  const now = Date.now()
  const ms90 = 90 * 86400_000
  const recent = rows.filter((r) => now - new Date(r.start_time).getTime() < ms90)
  const older = rows.filter((r) => {
    const age = now - new Date(r.start_time).getTime()
    return age >= ms90 && age < 2 * ms90
  })
  const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b.value, 0) / recent.length : null
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b.value, 0) / older.length : null
  const trendDelta =
    recentAvg !== null && olderAvg !== null
      ? Math.round((recentAvg - olderAvg) * 10) / 10
      : null

  const stats = {
    latest: Math.round(latest * 10) / 10,
    avg: Math.round(avg * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    totalReadings: rows.length,
    currentLevel: fitnessLevel(latest),
    trendDelta,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/vo2max"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to VO₂ Max"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">VO₂ Max Patterns</h1>
            <p className="text-sm text-text-secondary">
              {stats.totalReadings} readings · current {stats.currentLevel.label}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VO2PatternClient
          stats={stats}
          weeklyPoints={weeklyPoints}
          monthData={monthData}
          levelHistory={levelHistory}
        />
      </main>
      <BottomNav />
    </div>
  )
}
