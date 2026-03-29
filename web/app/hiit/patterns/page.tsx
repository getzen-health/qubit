import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
const HiitPatternsClient = dynamic(() => import('./hiit-patterns-client').then(m => ({ default: m.HiitPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HIIT Patterns' }

export default async function HiitPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawSessions } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, avg_heart_rate, max_heart_rate, active_calories, workout_type')
    .eq('user_id', user.id)
    .in('workout_type', ['HIIT', 'High Intensity Interval Training'])
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 3)
    .order('start_time', { ascending: true })

  const sessions = rawSessions ?? []

  if (sessions.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/hiit" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">HIIT Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Zap className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 HIIT sessions to see your patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dowSessions = Array(7).fill(0)
  const dowMins = Array(7).fill(0)
  const hourSessions = Array(24).fill(0)
  const monthMap: Record<string, { count: number; mins: number; cals: number; avgHrs: number[]; maxHrs: number[] }> = {}
  const weekMap: Record<string, { mins: number; sessions: number }> = {}
  const durationPoints: { date: string; mins: number }[] = []

  for (const s of sessions) {
    const dt = new Date(s.start_time)
    const dow = (dt.getDay() + 6) % 7
    const mins = s.duration_minutes ?? 0

    dowSessions[dow]++
    dowMins[dow] += mins
    hourSessions[dt.getHours()]++
    durationPoints.push({ date: s.start_time.slice(0, 10), mins })

    const monthKey = s.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0, mins: 0, cals: 0, avgHrs: [], maxHrs: [] }
    monthMap[monthKey].count++
    monthMap[monthKey].mins += mins
    monthMap[monthKey].cals += s.active_calories ?? 0
    if (s.avg_heart_rate) monthMap[monthKey].avgHrs.push(s.avg_heart_rate)
    if (s.max_heart_rate) monthMap[monthKey].maxHrs.push(s.max_heart_rate)

    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { mins: 0, sessions: 0 }
    weekMap[weekKey].mins += mins
    weekMap[weekKey].sessions++
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    sessions: dowSessions[i],
    totalMins: Math.round(dowMins[i]),
  }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-12)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      const avgHr = val.avgHrs.length > 0
        ? Math.round(val.avgHrs.reduce((a, b) => a + b, 0) / val.avgHrs.length)
        : null
      const maxHr = val.maxHrs.length > 0
        ? Math.round(Math.max(...val.maxHrs))
        : null
      return {
        label: MONTH_NAMES[monthNum - 1],
        key,
        sessions: val.count,
        mins: Math.round(val.mins),
        cals: Math.round(val.cals),
        avgHr,
        maxHr,
      }
    })

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([key, val]) => ({
      label: key.slice(5),
      mins: val.mins,
      sessions: val.sessions,
    }))

  // Summary stats
  const totalSessions = sessions.length
  const totalMins = sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
  const avgDurationMins = Math.round(totalMins / totalSessions)
  const avgPerWeek = +(totalSessions / (365 / 7)).toFixed(1)
  const totalHours = +(totalMins / 60).toFixed(1)
  const longestSessionMins = Math.max(...sessions.map((s) => s.duration_minutes ?? 0))

  const avgHrSessions = sessions.filter((s) => s.avg_heart_rate)
  const avgHrOverall = avgHrSessions.length > 0
    ? Math.round(avgHrSessions.reduce((a, b) => a + (b.avg_heart_rate ?? 0), 0) / avgHrSessions.length)
    : null
  const totalCalories = Math.round(sessions.reduce((s, r) => s + (r.active_calories ?? 0), 0))

  const morningTotal = hourSessions.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourSessions.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourSessions.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  const busiestDay = DOW_LABELS[dowSessions.indexOf(Math.max(...dowSessions))]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/hiit" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">HIIT Patterns</h1>
              <p className="text-sm text-text-secondary">{totalSessions} sessions · {totalHours}h · past year</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HiitPatternsClient
          stats={{
            totalSessions,
            avgDurationMins,
            avgPerWeek,
            totalHours,
            longestSessionMins,
            avgHrOverall,
            totalCalories,
            busiestDay,
            preferredTime,
          }}
          dowData={dowData}
          weeklyData={weeklyData}
          monthlyData={monthlyData}
          durationTrend={durationPoints}
          timeTotals={{ morning: morningTotal, afternoon: afternoonTotal, evening: eveningTotal }}
        />
      </main>
      <BottomNav />
    </div>
  )
}
