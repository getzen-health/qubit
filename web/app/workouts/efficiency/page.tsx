import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WorkoutEfficiencyClient, type EfficiencyData } from './efficiency-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Efficiency' }

// Canonical display names for workout types
const TYPE_LABEL: Record<string, string> = {
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  strength: 'Strength',
  hiit: 'HIIT',
  rowing: 'Rowing',
  hiking: 'Hiking',
  yoga: 'Yoga',
  pilates: 'Pilates',
  walking: 'Walking',
  elliptical: 'Elliptical',
  stair_climbing: 'Stair Climbing',
  crossfit: 'CrossFit',
  boxing: 'Boxing',
  tennis: 'Tennis',
  basketball: 'Basketball',
  soccer: 'Soccer',
  dance: 'Dance',
  functional_strength_training: 'Functional Strength',
  core_training: 'Core Training',
  flexibility: 'Flexibility',
  mixed_cardio: 'Mixed Cardio',
}

function typeLabel(t: string) {
  return TYPE_LABEL[t.toLowerCase()] ?? t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function isoWeek(d: Date): string {
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const wk = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`
}

export default async function WorkoutEfficiencyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes, active_calories, avg_heart_rate')
    .eq('user_id', user.id)
    .gte('start_time', sixMonthsAgo.toISOString())
    .gt('duration_minutes', 5)
    .not('active_calories', 'is', null)
    .gt('active_calories', 5)
    .order('start_time', { ascending: true })

  const rows = workouts ?? []

  // ── Per-type aggregation ─────────────────────────────────────────────────────
  type TypeStats = {
    type: string
    sessions: number
    totalMins: number
    totalCals: number
    hrMinSum: number   // sum of avg_hr × duration for weighted HR
    hrSessions: number // sessions that have HR data
  }

  const typeMap: Record<string, TypeStats> = {}

  for (const w of rows) {
    const t = w.workout_type.toLowerCase()
    if (!typeMap[t]) typeMap[t] = { type: t, sessions: 0, totalMins: 0, totalCals: 0, hrMinSum: 0, hrSessions: 0 }
    typeMap[t].sessions++
    typeMap[t].totalMins += w.duration_minutes
    typeMap[t].totalCals += w.active_calories
    if (w.avg_heart_rate && w.avg_heart_rate > 40) {
      typeMap[t].hrMinSum += w.avg_heart_rate * w.duration_minutes
      typeMap[t].hrSessions++
    }
  }

  // Compute efficiency metrics per type
  const typeStats = Object.values(typeMap)
    .filter((s) => s.sessions >= 2) // need at least 2 sessions for meaningful avg
    .map((s) => ({
      type: s.type,
      label: typeLabel(s.type),
      sessions: s.sessions,
      calPerMin: s.totalCals / s.totalMins,           // kcal/min average
      avgDuration: s.totalMins / s.sessions,           // avg session length
      avgCals: s.totalCals / s.sessions,               // avg calories per session
      avgHr: s.hrSessions > 0 ? s.hrMinSum / s.totalMins : null, // weighted avg HR
    }))
    .sort((a, b) => b.calPerMin - a.calPerMin)

  // ── Weekly trend: top 4 types by session count ────────────────────────────
  const topTypes = Object.values(typeMap)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 4)
    .map((s) => s.type)

  const weekMap: Record<string, Record<string, { cals: number; mins: number; count: number }>> = {}
  for (const w of rows) {
    const t = w.workout_type.toLowerCase()
    if (!topTypes.includes(t)) continue
    const wk = isoWeek(new Date(w.start_time))
    if (!weekMap[wk]) weekMap[wk] = {}
    if (!weekMap[wk][t]) weekMap[wk][t] = { cals: 0, mins: 0, count: 0 }
    weekMap[wk][t].cals += w.active_calories
    weekMap[wk][t].mins += w.duration_minutes
    weekMap[wk][t].count++
  }

  const weeklyTrend = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, byType], i, arr) => {
      const label = `W${i + 1}`
      const entry: Record<string, number | string> = { week: label }
      for (const t of topTypes) {
        const d = byType[t]
        entry[t] = d && d.mins > 0 ? +(d.cals / d.mins).toFixed(2) : 0
      }
      return entry
    })

  // ── Individual session leaderboard (top 20 by cal/min) ───────────────────
  const sessions = rows
    .filter((w) => w.duration_minutes >= 10)
    .map((w) => ({
      date: w.start_time.slice(0, 10),
      type: typeLabel(w.workout_type),
      duration: w.duration_minutes,
      calories: w.active_calories,
      calPerMin: w.active_calories / w.duration_minutes,
      avgHr: w.avg_heart_rate ?? null,
    }))
    .sort((a, b) => b.calPerMin - a.calPerMin)
    .slice(0, 15)

  // ── Overall summary ────────────────────────────────────────────────────────
  const totalSessions = rows.length
  const totalMins = rows.reduce((s, w) => s + w.duration_minutes, 0)
  const totalCals = rows.reduce((s, w) => s + w.active_calories, 0)
  const overallCalPerMin = totalMins > 0 ? totalCals / totalMins : 0

  const profileData: EfficiencyData = {
    typeStats,
    weeklyTrend,
    sessions,
    topTypes,
    totalSessions,
    totalMins: Math.round(totalMins),
    totalCals: Math.round(totalCals),
    overallCalPerMin: +overallCalPerMin.toFixed(2),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Workout Efficiency</h1>
            <p className="text-sm text-text-secondary">
              {totalSessions > 0
                ? `${totalSessions} sessions · last 6 months`
                : 'Calories burned per minute across workout types'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {typeStats.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">⚡</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Log at least 2 workouts of 2 different types to see efficiency analysis.
            </p>
          </div>
        ) : (
          <WorkoutEfficiencyClient data={profileData} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
