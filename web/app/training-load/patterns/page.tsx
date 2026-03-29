import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import dynamic from 'next/dynamic'
const TrainingPatternsClient = dynamic(() => import('./training-patterns-client').then(m => ({ default: m.TrainingPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Patterns' }

export default async function TrainingPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, active_calories, workout_type')
    .eq('user_id', user.id)
    .gte('start_time', ninetyDaysAgo.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  const rows = workouts ?? []

  if (rows.length < 4) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/training-load" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Training Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 4 workouts to see your training patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  // DOW distribution (0=Sun → convert to Mon-first: 0=Mon..6=Sun)
  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dowSessions = Array(7).fill(0)
  const dowMins = Array(7).fill(0)
  const dowCals = Array(7).fill(0)

  // Hour-of-day distribution
  const hourSessions = Array(24).fill(0)

  // Weekly volume map: ISO week key → { mins, sessions, cals }
  const weekMap: Record<string, { mins: number; sessions: number; cals: number; weekStart: string }> = {}

  for (const w of rows) {
    const dt = new Date(w.start_time)
    // DOW: JS getDay() = 0 (Sun)..6 (Sat) → convert to Mon-first: (getDay()+6)%7
    const dow = (dt.getDay() + 6) % 7
    dowSessions[dow]++
    dowMins[dow] += w.duration_minutes ?? 0
    dowCals[dow] += w.active_calories ?? 0

    // Hour
    const hour = dt.getHours()
    hourSessions[hour]++

    // ISO week key: YYYY-Www
    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) {
      weekMap[weekKey] = { mins: 0, sessions: 0, cals: 0, weekStart: dt.toISOString().slice(0, 10) }
    }
    weekMap[weekKey].mins += w.duration_minutes ?? 0
    weekMap[weekKey].sessions++
    weekMap[weekKey].cals += w.active_calories ?? 0
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    sessions: dowSessions[i],
    totalMins: Math.round(dowMins[i]),
    avgCals: dowSessions[i] > 0 ? Math.round(dowCals[i] / dowSessions[i]) : 0,
  }))

  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
    sessions: hourSessions[h],
  }))

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, val]) => ({
      label: key.slice(5), // "Www"
      mins: Math.round(val.mins),
      sessions: val.sessions,
      cals: Math.round(val.cals),
    }))

  // Summary stats
  const totalSessions = rows.length
  const avgDurationMins = Math.round(rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / rows.length)
  const avgPerWeek = +(totalSessions / (90 / 7)).toFixed(1)
  const busiestDay = DOW_LABELS[dowSessions.indexOf(Math.max(...dowSessions))]

  const morningTotal = hourSessions.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourSessions.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourSessions.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  // Workout type breakdown (top 5)
  const typeCounts: Record<string, number> = {}
  for (const w of rows) {
    const t = w.workout_type ?? 'Other'
    typeCounts[t] = (typeCounts[t] ?? 0) + 1
  }
  const typeData = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([type, count]) => ({ type, count, pct: Math.round(count / totalSessions * 100) }))

  // Weekly consistency (weeks with ≥1 session / total weeks elapsed)
  const totalWeeks = Math.max(1, Object.keys(weekMap).length)
  const activeWeeks = Object.values(weekMap).filter((w) => w.sessions > 0).length
  const consistencyPct = Math.round(activeWeeks / Math.max(1, Math.ceil(90 / 7)) * 100)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/training-load" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Dumbbell className="w-5 h-5 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Training Patterns</h1>
              <p className="text-sm text-text-secondary">{totalSessions} sessions · last 90 days</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TrainingPatternsClient
          stats={{
            totalSessions,
            avgDurationMins,
            avgPerWeek,
            busiestDay,
            preferredTime,
            consistencyPct,
          }}
          dowData={dowData}
          hourData={hourData}
          weeklyData={weeklyData}
          typeData={typeData}
          timeTotals={{ morning: morningTotal, afternoon: afternoonTotal, evening: eveningTotal }}
        />
      </main>
      <BottomNav />
    </div>
  )
}
