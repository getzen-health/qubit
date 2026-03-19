import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RowingPatternsClient } from './rowing-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Rowing Patterns' }

function split500mStr(pacePerKm: number | null): string | null {
  if (!pacePerKm || pacePerKm <= 0) return null
  // pacePerKm is min/km; 500m split = pacePerKm / 2 minutes
  const splitMins = pacePerKm / 2
  const m = Math.floor(splitMins)
  const s = Math.round((splitMins - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default async function RowingPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawSessions } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate, active_calories')
    .eq('user_id', user.id)
    .in('workout_type', ['Rowing', 'Indoor Rowing', 'Rowing Machine', 'Sculling'])
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 1)
    .order('start_time', { ascending: true })

  const sessions = rawSessions ?? []

  if (sessions.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/rowing" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Rowing Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">🚣</p>
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 rowing sessions to see your patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dowSessions = Array(7).fill(0)
  const dowMeters = Array(7).fill(0)
  const hourSessions = Array(24).fill(0)
  const monthMap: Record<string, { count: number; meters: number; mins: number; cals: number; splits: number[] }> = {}
  const weekMap: Record<string, { meters: number; sessions: number } > = {}
  const splitTrend: { date: string; split: number }[] = []

  for (const s of sessions) {
    const dt = new Date(s.start_time)
    const dow = (dt.getDay() + 6) % 7
    const meters = s.distance_meters ?? 0
    const mins = s.duration_minutes ?? 0

    dowSessions[dow]++
    dowMeters[dow] += meters
    hourSessions[dt.getHours()]++

    const monthKey = s.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0, meters: 0, mins: 0, cals: 0, splits: [] }
    monthMap[monthKey].count++
    monthMap[monthKey].meters += meters
    monthMap[monthKey].mins += mins
    monthMap[monthKey].cals += s.active_calories ?? 0
    if (s.avg_pace_per_km && s.avg_pace_per_km > 0 && meters > 200) {
      const splitSecs = (s.avg_pace_per_km / 2) * 60
      monthMap[monthKey].splits.push(splitSecs)
      splitTrend.push({ date: s.start_time.slice(0, 10), split: Math.round(splitSecs) })
    }

    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { meters: 0, sessions: 0 }
    weekMap[weekKey].meters += meters
    weekMap[weekKey].sessions++
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    sessions: dowSessions[i],
    meters: Math.round(dowMeters[i]),
  }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-12)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      const avgSplitSecs = val.splits.length > 0
        ? Math.round(val.splits.reduce((a, b) => a + b, 0) / val.splits.length)
        : null
      const bestSplitSecs = val.splits.length > 0 ? Math.min(...val.splits) : null
      const m = avgSplitSecs ? Math.floor(avgSplitSecs / 60) : null
      const s2 = avgSplitSecs ? Math.round(avgSplitSecs % 60) : null
      const avgSplitStr = m !== null && s2 !== null ? `${m}:${String(s2).padStart(2, '0')}` : null
      const bm = bestSplitSecs ? Math.floor(bestSplitSecs / 60) : null
      const bs = bestSplitSecs ? Math.round(bestSplitSecs % 60) : null
      const bestSplitStr = bm !== null && bs !== null ? `${bm}:${String(bs).padStart(2, '0')}` : null
      return {
        label: MONTH_NAMES[monthNum - 1],
        key,
        sessions: val.count,
        meters: Math.round(val.meters),
        mins: Math.round(val.mins),
        cals: Math.round(val.cals),
        avgSplitSecs,
        avgSplitStr,
        bestSplitStr,
      }
    })

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([key, val]) => ({
      label: key.slice(5),
      meters: Math.round(val.meters),
      sessions: val.sessions,
    }))

  const totalSessions = sessions.length
  const totalMeters = Math.round(sessions.reduce((s, r) => s + (r.distance_meters ?? 0), 0))
  const avgMetersPerSession = Math.round(totalMeters / totalSessions)
  const avgDurationMins = Math.round(sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / totalSessions)
  const avgPerWeek = +(totalSessions / (365 / 7)).toFixed(1)
  const longestMeters = Math.max(...sessions.map((s) => s.distance_meters ?? 0), 0)

  const sessionsWithPace = sessions.filter((s) => s.avg_pace_per_km && s.avg_pace_per_km > 0 && (s.distance_meters ?? 0) > 200)
  const avgSplit500Str = sessionsWithPace.length > 0
    ? split500mStr(sessionsWithPace.reduce((a, b) => a + (b.avg_pace_per_km ?? 0), 0) / sessionsWithPace.length)
    : null
  const bestSplit500Str = sessionsWithPace.length > 0
    ? split500mStr(Math.min(...sessionsWithPace.map((s) => s.avg_pace_per_km ?? Infinity)))
    : null

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
          <Link href="/rowing" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Rowing Patterns</h1>
            <p className="text-sm text-text-secondary">{totalSessions} sessions · {(totalMeters / 1000).toFixed(1)} km · past year</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RowingPatternsClient
          stats={{
            totalSessions,
            totalMeters,
            avgMetersPerSession,
            avgDurationMins,
            avgPerWeek,
            avgSplit500Str,
            bestSplit500Str,
            longestMeters,
            busiestDay,
            preferredTime,
          }}
          dowData={dowData}
          monthlyData={monthlyData}
          weeklyData={weeklyData}
          splitTrend={splitTrend}
          timeTotals={{ morning: morningTotal, afternoon: afternoonTotal, evening: eveningTotal }}
        />
      </main>
      <BottomNav />
    </div>
  )
}
