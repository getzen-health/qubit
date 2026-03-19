import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WorkoutPatternsClient, type PatternsData } from './patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Workout Patterns' }

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Convert JS getDay() (0=Sun) to Mon=0 index
function toMonFirst(jsDay: number): number {
  return (jsDay + 6) % 7
}

export default async function WorkoutPatternsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, active_calories, workout_type')
    .eq('user_id', user.id)
    .gte('start_time', ninetyDaysAgo.toISOString())
    .not('duration_minutes', 'is', null)
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  const rows = workouts ?? []

  // ── Day-of-week bucketing ──────────────────────────────────────────────────
  const dowSessions = new Array(7).fill(0)
  const dowMins     = new Array(7).fill(0)

  for (const w of rows) {
    const d = new Date(w.start_time)
    const idx = toMonFirst(d.getDay())
    dowSessions[idx]++
    dowMins[idx] += w.duration_minutes ?? 0
  }

  const maxSessions = Math.max(...dowSessions)
  const dayPatterns = DOW_LABELS.map((label, i) => ({
    label,
    sessions: dowSessions[i],
    totalMins: Math.round(dowMins[i]),
    avgMins: dowSessions[i] > 0 ? Math.round(dowMins[i] / dowSessions[i]) : 0,
    isBusiest: dowSessions[i] === maxSessions && maxSessions > 0,
  }))

  const preferredDayIdx = dowSessions.indexOf(maxSessions)
  const preferredDay = maxSessions > 0 ? DOW_LABELS[preferredDayIdx] : ''

  // ── Hour-of-day bucketing ─────────────────────────────────────────────────
  const hourSessions = new Array(24).fill(0)
  for (const w of rows) {
    const h = new Date(w.start_time).getHours()
    hourSessions[h]++
  }

  function hourBand(h: number): 'morning' | 'afternoon' | 'evening' | 'other' {
    if (h >= 5 && h <= 11) return 'morning'
    if (h >= 12 && h <= 17) return 'afternoon'
    if (h >= 18 && h <= 22) return 'evening'
    return 'other'
  }

  function hourLabel(h: number): string {
    if (h === 0) return '12am'
    if (h < 12) return `${h}am`
    if (h === 12) return '12pm'
    return `${h - 12}pm`
  }

  const hourPatterns = hourSessions.map((count, h) => ({
    hour: h,
    label: hourLabel(h),
    sessions: count,
    band: hourBand(h),
  }))

  const morningTotal   = hourPatterns.filter((h) => h.band === 'morning').reduce((s, h) => s + h.sessions, 0)
  const afternoonTotal = hourPatterns.filter((h) => h.band === 'afternoon').reduce((s, h) => s + h.sessions, 0)
  const eveningTotal   = hourPatterns.filter((h) => h.band === 'evening').reduce((s, h) => s + h.sessions, 0)
  const preferredTime: string =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning' :
    afternoonTotal >= eveningTotal ? 'afternoon' : 'evening'

  // ── Weekly volume (last 12 ISO weeks) ────────────────────────────────────
  const weekMap: Record<string, { mins: number; sessions: number; cals: number; weekNum: number; year: number }> = {}
  for (const w of rows) {
    const d = new Date(w.start_time)
    // ISO week: approximate
    const jan4 = new Date(d.getFullYear(), 0, 4)
    const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
    const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[key]) weekMap[key] = { mins: 0, sessions: 0, cals: 0, weekNum, year: d.getFullYear() }
    weekMap[key].mins += w.duration_minutes ?? 0
    weekMap[key].sessions++
    weekMap[key].cals += w.active_calories ?? 0
  }

  const weekVolumes = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v], i, arr) => ({
      weekLabel: `W${i + 1}`,
      totalMins: Math.round(v.mins),
      sessions: v.sessions,
      calories: Math.round(v.cals),
    }))

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalSessions = rows.length
  const avgSessionMins = totalSessions > 0
    ? rows.reduce((s, w) => s + (w.duration_minutes ?? 0), 0) / totalSessions
    : 0
  const avgSessionsPerWeek = totalSessions / (90 / 7)

  const weeksTotal = Math.ceil(90 / 7)
  const weeksWithWorkout = weekVolumes.filter((w) => w.sessions > 0).length
  const consistencyPct = Math.round((weeksWithWorkout / weeksTotal) * 100)

  // ── Insights ───────────────────────────────────────────────────────────────
  type InsightType = 'positive' | 'neutral' | 'warning'
  const insights: { text: string; type: InsightType }[] = []

  if (consistencyPct >= 80) {
    insights.push({ text: `You've trained in ${consistencyPct}% of weeks — excellent consistency!`, type: 'positive' })
  } else if (consistencyPct < 50) {
    insights.push({ text: `You trained in only ${consistencyPct}% of weeks. Building a regular schedule can improve fitness gains.`, type: 'warning' })
  }

  const restDays = dayPatterns.filter((d) => d.sessions === 0)
  if (restDays.length === 0 && totalSessions > 20) {
    insights.push({ text: `You train on every day of the week. Consider scheduling a dedicated weekly rest day to support recovery.`, type: 'warning' })
  } else if (restDays.length >= 2) {
    insights.push({ text: `${restDays.map((d) => d.label).join(' and ')} are naturally your rest days — good for weekly recovery rhythm.`, type: 'positive' })
  }

  const timeTips: Record<string, string> = {
    morning: 'Morning training can boost energy and mood throughout the day.',
    afternoon: 'Afternoon workouts often align with peak physiological performance.',
    evening: 'Evening training is fine — finish 2+ hours before bed to protect sleep quality.',
  }
  if (preferredTime) {
    insights.push({ text: `You prefer ${preferredTime} workouts. ${timeTips[preferredTime]}`, type: 'neutral' })
  }

  if (weekVolumes.length >= 4) {
    const last4Avg = weekVolumes.slice(-4).reduce((s, w) => s + w.totalMins, 0) / 4
    const first4Avg = weekVolumes.slice(0, 4).reduce((s, w) => s + w.totalMins, 0) / 4
    if (first4Avg > 0 && last4Avg > first4Avg * 1.25) {
      const pct = Math.round((last4Avg - first4Avg) / first4Avg * 100)
      insights.push({ text: `Training volume is up ${pct}% recently. Great progress — but watch for overtraining signals like declining HRV.`, type: 'warning' })
    } else if (first4Avg > 0 && last4Avg < first4Avg * 0.7) {
      insights.push({ text: `Recent training volume is lower than earlier in the period. Is this planned recovery or a motivation dip?`, type: 'neutral' })
    }
  }

  const profileData: PatternsData = {
    dayPatterns,
    hourPatterns,
    weekVolumes,
    totalSessions,
    avgSessionMins: Math.round(avgSessionMins),
    avgSessionsPerWeek: +avgSessionsPerWeek.toFixed(1),
    preferredDay,
    preferredTime,
    consistencyPct,
    insights,
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
            <h1 className="text-xl font-bold text-text-primary">Workout Patterns</h1>
            <p className="text-sm text-text-secondary">
              {totalSessions > 0
                ? `${totalSessions} sessions · last 90 days`
                : 'Day-of-week, time-of-day & volume trends'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {totalSessions < 4 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🏋️</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Log at least 4 workouts to see your training patterns.
            </p>
          </div>
        ) : (
          <WorkoutPatternsClient data={profileData} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
