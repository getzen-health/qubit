import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { StrengthPatternsClient } from './strength-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Strength Training Patterns' }

export default async function StrengthPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: rawSessions } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, active_calories, workout_type, avg_heart_rate')
    .eq('user_id', user.id)
    .in('workout_type', [
      'Strength Training',
      'Functional Strength Training',
      'Core Training',
      'Cross Training',
      'Flexibility',
      'Mixed Cardio',
    ])
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  const sessions = rawSessions ?? []

  if (sessions.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/strength" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Strength Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 strength sessions to see patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  // DOW distribution (Mon-first)
  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dowSessions = Array(7).fill(0)
  const dowMins = Array(7).fill(0)
  const dowCals = Array(7).fill(0)

  // Hour of day
  const hourSessions = Array(24).fill(0)

  // Weekly volume
  const weekMap: Record<string, { mins: number; sessions: number; cals: number }> = {}

  // Monthly stats
  const monthMap: Record<string, { mins: number; sessions: number; cals: number; hrs: number[] }> = {}

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  for (const s of sessions) {
    const dt = new Date(s.start_time)
    const dow = (dt.getDay() + 6) % 7 // Mon-first
    dowSessions[dow]++
    dowMins[dow] += s.duration_minutes ?? 0
    dowCals[dow] += s.active_calories ?? 0

    const hour = dt.getHours()
    hourSessions[hour]++

    // ISO week key
    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { mins: 0, sessions: 0, cals: 0 }
    weekMap[weekKey].mins += s.duration_minutes ?? 0
    weekMap[weekKey].sessions++
    weekMap[weekKey].cals += s.active_calories ?? 0

    // Monthly
    const monthKey = s.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { mins: 0, sessions: 0, cals: 0, hrs: [] }
    monthMap[monthKey].mins += s.duration_minutes ?? 0
    monthMap[monthKey].sessions++
    monthMap[monthKey].cals += s.active_calories ?? 0
    if (s.avg_heart_rate) monthMap[monthKey].hrs.push(s.avg_heart_rate)
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    sessions: dowSessions[i],
    totalMins: Math.round(dowMins[i]),
  }))

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, val]) => ({
      label: key.slice(5), // "Www"
      mins: Math.round(val.mins),
      sessions: val.sessions,
    }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-6)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      const avgHr = val.hrs.length > 0
        ? Math.round(val.hrs.reduce((a, b) => a + b, 0) / val.hrs.length)
        : null
      return {
        label: MONTH_NAMES[monthNum - 1],
        sessions: val.sessions,
        mins: Math.round(val.mins),
        cals: Math.round(val.cals),
        avgHr,
      }
    })

  // Workout type breakdown
  const typeCounts: Record<string, { count: number; mins: number }> = {}
  for (const s of sessions) {
    const t = s.workout_type ?? 'Other'
    if (!typeCounts[t]) typeCounts[t] = { count: 0, mins: 0 }
    typeCounts[t].count++
    typeCounts[t].mins += s.duration_minutes ?? 0
  }
  const typeData = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([type, val]) => ({
      type,
      count: val.count,
      pct: Math.round(val.count / sessions.length * 100),
      avgMins: Math.round(val.mins / val.count),
    }))

  // Duration trend
  const durationTrend = sessions.map((s) => ({
    date: s.start_time.slice(5, 10),
    mins: s.duration_minutes ?? 0,
  }))

  // Summary stats
  const totalSessions = sessions.length
  const avgDurationMins = Math.round(sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / sessions.length)
  const avgPerWeek = +(totalSessions / (90 / 7)).toFixed(1)
  const busiestDay = DOW_LABELS[dowSessions.indexOf(Math.max(...dowSessions))]

  const morningTotal = hourSessions.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourSessions.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourSessions.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  const longestSessionMins = Math.max(...sessions.map((s) => s.duration_minutes ?? 0))
  const totalHours = Math.round(sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / 60 * 10) / 10

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/strength" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Dumbbell className="w-5 h-5 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Strength Patterns</h1>
              <p className="text-sm text-text-secondary">{totalSessions} sessions · {totalHours}h total · last 90 days</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <StrengthPatternsClient
          stats={{
            totalSessions,
            avgDurationMins,
            avgPerWeek,
            busiestDay,
            preferredTime,
            longestSessionMins,
            totalHours,
          }}
          dowData={dowData}
          weeklyData={weeklyData}
          monthlyData={monthlyData}
          typeData={typeData}
          durationTrend={durationTrend}
          timeTotals={{ morning: morningTotal, afternoon: afternoonTotal, evening: eveningTotal }}
        />
      </main>
      <BottomNav />
    </div>
  )
}
