import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const FastingInsightsClient = dynamic(() => import('./fasting-insights-client').then(m => ({ default: m.FastingInsightsClient })))
import type { FastingInsightData } from './fasting-insights-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Fasting Insights' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function FastingInsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const startIso = oneYearAgo.toISOString()

  const { data: sessions } = await supabase
    .from('fasting_sessions')
    .select('id, protocol, target_hours, started_at, ended_at, completed, actual_hours')
    .eq('user_id', user.id)
    .gte('started_at', startIso)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true })

  const rows = sessions ?? []
  const completed = rows.filter((r) => r.completed)
  const totalFasts = rows.length
  const completedFasts = completed.length
  const completionRate = totalFasts > 0 ? Math.round(completedFasts / totalFasts * 100) : 0

  // Average actual hours (completed only)
  const avgActualHours = completed.length > 0
    ? completed.reduce((s, r) => s + (r.actual_hours ?? 0), 0) / completed.length
    : 0

  // Protocol breakdown
  const protocolCounts: Record<string, { count: number; completed: number; totalHours: number }> = {}
  for (const r of rows) {
    const key = r.protocol ?? '16:8'
    if (!protocolCounts[key]) protocolCounts[key] = { count: 0, completed: 0, totalHours: 0 }
    protocolCounts[key].count++
    if (r.completed) {
      protocolCounts[key].completed++
      protocolCounts[key].totalHours += r.actual_hours ?? 0
    }
  }
  const protocols = Object.entries(protocolCounts)
    .map(([name, data]) => ({
      name,
      count: data.count,
      completed: data.completed,
      completionRate: Math.round(data.completed / data.count * 100),
      avgHours: data.completed > 0 ? +(data.totalHours / data.completed).toFixed(1) : 0,
      pct: totalFasts > 0 ? Math.round(data.count / totalFasts * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // DOW distribution (when fasts start)
  const dowCounts = Array(7).fill(0)
  for (const r of completed) {
    const dow = new Date(r.started_at).getDay()
    dowCounts[dow]++
  }
  const dowData = DOW_LABELS.map((label, i) => ({ label, count: dowCounts[i] }))

  // Start hour distribution
  const hourCounts: number[] = Array(24).fill(0)
  for (const r of completed) {
    const h = new Date(r.started_at).getHours()
    hourCounts[h]++
  }
  // Group into morning (0-11), afternoon (12-17), evening (18-23)
  const timePeriods = [
    { label: 'Evening (6–11pm)', count: [18, 19, 20, 21, 22, 23].reduce((s, h) => s + hourCounts[h], 0) },
    { label: 'Night (12am–5am)', count: [0, 1, 2, 3, 4, 5].reduce((s, h) => s + hourCounts[h], 0) },
    { label: 'Morning (6–11am)', count: [6, 7, 8, 9, 10, 11].reduce((s, h) => s + hourCounts[h], 0) },
    { label: 'Afternoon (12–5pm)', count: [12, 13, 14, 15, 16, 17].reduce((s, h) => s + hourCounts[h], 0) },
  ].sort((a, b) => b.count - a.count)

  // Monthly trend: fasts per month + completion rate
  const monthData: Record<string, { total: number; completed: number }> = {}
  for (const r of rows) {
    const key = r.started_at.slice(0, 7) // YYYY-MM
    if (!monthData[key]) monthData[key] = { total: 0, completed: 0 }
    monthData[key].total++
    if (r.completed) monthData[key].completed++
  }
  const monthTrend = Object.entries(monthData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, data]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        total: data.total,
        completed: data.completed,
        completionRate: data.total > 0 ? Math.round(data.completed / data.total * 100) : 0,
      }
    })

  // Streak analysis
  // A streak = consecutive days with at least one completed fast
  const fastDates = new Set(completed.map((r) => r.started_at.slice(0, 10)))
  let longestStreak = 0
  let currentStreak = 0
  let tempStreak = 0
  const sortedDates = Array.from(fastDates).sort()
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1
    } else {
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      if (diffDays === 1) tempStreak++
      else tempStreak = 1
    }
    longestStreak = Math.max(longestStreak, tempStreak)
  }
  // Current streak from today backwards
  const today = new Date().toISOString().slice(0, 10)
  for (let i = 1; i <= 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    if (ds === today) continue
    if (fastDates.has(ds)) currentStreak++
    else break
  }

  // Duration distribution
  const durBuckets = [
    { label: '<12h', min: 0, max: 12 },
    { label: '12–16h', min: 12, max: 16 },
    { label: '16–18h', min: 16, max: 18 },
    { label: '18–20h', min: 18, max: 20 },
    { label: '20–22h', min: 20, max: 22 },
    { label: '22–24h', min: 22, max: 24 },
    { label: '24h+', min: 24, max: 999 },
  ].map((b) => {
    const count = completed.filter((r) => {
      const h = r.actual_hours ?? 0
      return h >= b.min && h < b.max
    }).length
    return { ...b, count, pct: completed.length > 0 ? Math.round(count / completed.length * 100) : 0 }
  }).filter((b) => b.count > 0)

  // Best fast
  const longestFast = completed.reduce<typeof rows[0] | null>((best, r) => {
    return (r.actual_hours ?? 0) > (best?.actual_hours ?? 0) ? r : best
  }, null)

  const profileData: FastingInsightData = {
    totalFasts,
    completedFasts,
    completionRate,
    avgActualHours: +avgActualHours.toFixed(1),
    currentStreak,
    longestStreak,
    longestFastHours: longestFast?.actual_hours ? +longestFast.actual_hours.toFixed(1) : null,
    longestFastDate: longestFast?.started_at?.slice(0, 10) ?? null,
    protocols,
    dowData,
    timePeriods,
    monthTrend,
    durBuckets,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/fasting"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to fasting"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Fasting Insights</h1>
            <p className="text-sm text-text-secondary">
              {totalFasts > 0
                ? `${totalFasts} fasts · ${completionRate}% completion`
                : 'Intermittent fasting analytics'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {totalFasts < 3 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">⏳</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Complete at least 3 fasting sessions to see insights. Use the Fasting page to start tracking.
            </p>
          </div>
        ) : (
          <FastingInsightsClient data={profileData} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
