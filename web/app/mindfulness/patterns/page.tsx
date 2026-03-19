import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MindfulnessPatternsClient, type MindfulnessPatternData } from './mindfulness-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Mindfulness Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function MindfulnessPatternsPage() {
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
    .eq('type', 'mindfulness')
    .gte('start_time', startIso)
    .gt('value', 0)
    .order('start_time', { ascending: true })

  const sessions = (records ?? []).map((r) => {
    const dt = new Date(r.start_time)
    return {
      minutes: +r.value,
      date: r.start_time.slice(0, 10),
      dow: dt.getDay(),
      hour: dt.getHours(),
      month: r.start_time.slice(0, 7),
    }
  })

  if (sessions.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/mindfulness" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Mindfulness Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🧘</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">Log at least 3 mindfulness sessions to see patterns.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = sessions.length
  const totalMinutes = sessions.reduce((s, r) => s + r.minutes, 0)
  const avgMinutes = Math.round(totalMinutes / n)

  const firstDate = new Date(sessions[0].date)
  const lastDate = new Date(sessions[n - 1].date)
  const weeksSpan = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 86400000)) + 1)
  const avgSessionsPerWeek = +(n / weeksSpan).toFixed(1)

  // DOW patterns
  const dowBuckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const s of sessions) dowBuckets[s.dow].push(s.minutes)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgMinutes: bucket.length > 0 ? Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length) : null,
    totalMinutes: Math.round(bucket.reduce((a, b) => a + b, 0)),
  }))

  // Duration distribution
  const durationBuckets = [
    { label: '< 5m', min: 0, max: 5 },
    { label: '5–10m', min: 5, max: 10 },
    { label: '10–20m', min: 10, max: 20 },
    { label: '20–30m', min: 20, max: 30 },
    { label: '30–60m', min: 30, max: 60 },
    { label: '60m+', min: 60, max: Infinity },
  ]
  const durationDist = durationBuckets
    .map((b) => {
      const count = sessions.filter((s) => s.minutes >= b.min && s.minutes < b.max).length
      return { label: b.label, count, pct: Math.round((count / n) * 100) }
    })
    .filter((b) => b.count > 0)

  // Monthly trend
  const monthBuckets: Record<string, number[]> = {}
  for (const s of sessions) {
    if (!monthBuckets[s.month]) monthBuckets[s.month] = []
    monthBuckets[s.month].push(s.minutes)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, bucket]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        sessions: bucket.length,
        totalMinutes: Math.round(bucket.reduce((a, b) => a + b, 0)),
        avgMinutes: Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length),
      }
    })

  // Time of day
  const periodDefs = [
    { label: 'Morning', icon: '🌅', time: '5–12am', hours: [5, 6, 7, 8, 9, 10, 11] },
    { label: 'Afternoon', icon: '☀️', time: '12–5pm', hours: [12, 13, 14, 15, 16] },
    { label: 'Evening', icon: '🌆', time: '5–10pm', hours: [17, 18, 19, 20, 21] },
    { label: 'Night', icon: '🌙', time: '10pm–5am', hours: [22, 23, 0, 1, 2, 3, 4] },
  ]
  const timePeriods = periodDefs
    .map((p) => {
      const bucket = sessions.filter((s) => p.hours.includes(s.hour))
      return {
        label: p.label,
        icon: p.icon,
        time: p.time,
        count: bucket.length,
        avgMinutes:
          bucket.length > 0
            ? Math.round(bucket.reduce((s, r) => s + r.minutes, 0) / bucket.length)
            : null,
        pct: Math.round((bucket.length / n) * 100),
      }
    })
    .filter((p) => p.count > 0)

  // Streaks
  const allDates = [...new Set(sessions.map((s) => s.date))].sort()
  let longestStreak = 1
  let tempStreak = 1
  for (let i = 1; i < allDates.length; i++) {
    const diff =
      (new Date(allDates[i]).getTime() - new Date(allDates[i - 1]).getTime()) / 86400000
    if (diff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let currentStreak = 0
  if (allDates.length > 0 && (allDates[allDates.length - 1] === today || allDates[allDates.length - 1] === yesterday)) {
    currentStreak = 1
    for (let i = allDates.length - 2; i >= 0; i--) {
      const diff =
        (new Date(allDates[i + 1]).getTime() - new Date(allDates[i]).getTime()) / 86400000
      if (diff === 1) {
        currentStreak++
      } else break
    }
  }

  // Consistency: % of weeks with at least one session
  const weekSet = new Set<string>()
  for (const d of allDates) {
    const dt = new Date(d)
    const weekStart = new Date(dt)
    weekStart.setDate(dt.getDate() - dt.getDay())
    weekSet.add(weekStart.toISOString().slice(0, 10))
  }
  const consistencyPct = Math.round((weekSet.size / weeksSpan) * 100)

  const bestDow = dowData.reduce((best, d) => (d.count > best.count ? d : best), dowData[0])

  const profileData: MindfulnessPatternData = {
    totalSessions: n,
    totalMinutes: Math.round(totalMinutes),
    avgMinutes,
    avgSessionsPerWeek,
    currentStreak,
    longestStreak,
    consistencyPct,
    bestDow: bestDow.count > 0 ? bestDow.label : null,
    dowData,
    durationDist,
    monthData,
    timePeriods,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/mindfulness"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to mindfulness"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Mindfulness Patterns</h1>
            <p className="text-sm text-text-secondary">
              {n} sessions · {Math.round(totalMinutes / 60)}h total · {avgSessionsPerWeek}/week
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <MindfulnessPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
