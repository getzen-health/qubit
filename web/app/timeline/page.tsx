import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TimelineClient } from './timeline-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Health Timeline' }

export type EventKind =
  | 'workout'
  | 'sleep'
  | 'hrv_high'
  | 'hrv_low'
  | 'step_pr'
  | 'step_goal'
  | 'calorie_high'

export interface TimelineEvent {
  id: string
  kind: EventKind
  date: string        // ISO date yyyy-MM-dd
  time?: string       // HH:mm if known
  title: string
  subtitle: string
  detail?: string
  icon: string
  color: string
  href?: string
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyStr = thirtyDaysAgo.toISOString().slice(0, 10)
  const thirtyIso = thirtyDaysAgo.toISOString()

  const [
    { data: summaries },
    { data: workouts },
    { data: sleepRecords },
  ] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, steps, avg_hrv, active_calories, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', thirtyStr)
      .order('date', { ascending: false }),
    supabase
      .from('workout_records')
      .select('id, workout_type, start_time, duration_minutes, active_calories, distance_meters, avg_heart_rate, avg_pace_per_km')
      .eq('user_id', user.id)
      .gte('start_time', thirtyIso)
      .order('start_time', { ascending: false }),
    supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, rem_minutes, deep_minutes, awake_minutes')
      .eq('user_id', user.id)
      .gte('start_time', thirtyIso)
      .gt('duration_minutes', 60)
      .order('start_time', { ascending: false }),
  ])

  const events: TimelineEvent[] = []

  // ── All-time step PR for comparison ─────────────────────────────────────
  const { data: allSummaries } = await supabase
    .from('daily_summaries')
    .select('steps')
    .eq('user_id', user.id)
    .not('steps', 'is', null)
    .gt('steps', 0)
  const allTimeStepPR = allSummaries
    ? Math.max(...allSummaries.map((s) => s.steps ?? 0))
    : 0

  // HRV baseline for comparison
  const sorted = (summaries ?? [])
    .filter((s) => s.avg_hrv && s.avg_hrv > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
  const baselineSlice = sorted.slice(0, Math.max(0, sorted.length - 7))
  const hrvBaseline = baselineSlice.length > 0
    ? baselineSlice.reduce((s, d) => s + (d.avg_hrv ?? 0), 0) / baselineSlice.length
    : 0

  // ── WORKOUTS ─────────────────────────────────────────────────────────────
  function formatWorkoutType(t: string): string {
    return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  function formatPace(secPerKm: number) {
    const m = Math.floor(secPerKm / 60)
    const s = Math.round(secPerKm % 60)
    return `${m}:${s.toString().padStart(2, '0')}/km`
  }
  function workoutIcon(t: string): string {
    const type = t.toLowerCase()
    if (type.includes('run')) return '🏃'
    if (type.includes('cycle') || type.includes('bike')) return '🚴'
    if (type.includes('swim')) return '🏊'
    if (type.includes('strength') || type.includes('functional')) return '🏋️'
    if (type.includes('hike') || type.includes('walk')) return '🥾'
    if (type.includes('hiit')) return '⚡'
    if (type.includes('row')) return '🚣'
    if (type.includes('yoga')) return '🧘'
    return '💪'
  }
  function workoutColor(t: string): string {
    const type = t.toLowerCase()
    if (type.includes('run')) return '#f97316'
    if (type.includes('cycle') || type.includes('bike')) return '#3b82f6'
    if (type.includes('swim')) return '#06b6d4'
    if (type.includes('strength')) return '#ef4444'
    if (type.includes('hike')) return '#22c55e'
    if (type.includes('hiit')) return '#ec4899'
    if (type.includes('row')) return '#0ea5e9'
    return '#8b5cf6'
  }

  for (const w of workouts ?? []) {
    const parts: string[] = []
    if (w.duration_minutes) {
      const h = Math.floor(w.duration_minutes / 60)
      const m = w.duration_minutes % 60
      parts.push(h > 0 ? `${h}h ${m}m` : `${m}m`)
    }
    if (w.distance_meters && w.distance_meters > 0) {
      parts.push(`${(w.distance_meters / 1000).toFixed(2)} km`)
    }
    if (w.avg_pace_per_km && w.avg_pace_per_km > 0) parts.push(formatPace(w.avg_pace_per_km))
    if (w.avg_heart_rate) parts.push(`${Math.round(w.avg_heart_rate)} bpm`)
    if (w.active_calories) parts.push(`${Math.round(w.active_calories)} cal`)

    const wt = w.workout_type ?? 'Workout'
    events.push({
      id: `workout-${w.id ?? w.start_time}`,
      kind: 'workout',
      date: w.start_time.slice(0, 10),
      time: w.start_time.slice(11, 16),
      title: formatWorkoutType(wt),
      subtitle: parts.join(' · '),
      icon: workoutIcon(wt),
      color: workoutColor(wt),
      href: `/workouts`,
    })
  }

  // ── SLEEP ────────────────────────────────────────────────────────────────
  function sleepScore(r: typeof sleepRecords extends Array<infer T> | null | undefined ? T : never): number {
    const dur = r.duration_minutes ?? 0
    const awake = r.awake_minutes ?? 0
    const eff = dur > 0 ? Math.min(((dur - awake) / dur) * 100, 100) : 50
    const durScore = Math.min(Math.max(((dur - 300) / (480 - 300)) * 100, 0), 100)
    const stageMins = (r.rem_minutes ?? 0) + (r.deep_minutes ?? 0)
    const stageScore = dur > 0 ? Math.min((stageMins / dur) * 200, 100) : 50
    return Math.round(durScore * 0.4 + stageScore * 0.3 + eff * 0.3)
  }

  for (const s of sleepRecords ?? []) {
    const dur = s.duration_minutes ?? 0
    const h = Math.floor(dur / 60)
    const m = dur % 60
    const durStr = `${h}h ${m}m`
    const score = sleepScore(s)
    const grade = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
    const stageParts: string[] = []
    if (s.deep_minutes) stageParts.push(`${s.deep_minutes}m deep`)
    if (s.rem_minutes)  stageParts.push(`${s.rem_minutes}m REM`)

    events.push({
      id: `sleep-${s.start_time}`,
      kind: 'sleep',
      date: s.end_time ? s.end_time.slice(0, 10) : s.start_time.slice(0, 10),
      time: s.start_time.slice(11, 16),
      title: `${durStr} Sleep`,
      subtitle: `${grade} · Score ${score}/100`,
      detail: stageParts.join(' · '),
      icon: '😴',
      color: '#6366f1',
      href: '/sleep',
    })
  }

  // ── DAILY SUMMARY EVENTS ──────────────────────────────────────────────────
  const STEP_GOAL = 7500

  for (const d of summaries ?? []) {
    const daySteps = d.steps ?? 0
    const dayHRV   = d.avg_hrv ?? 0
    const dayCal   = d.active_calories ?? 0

    // Step PR
    if (daySteps > 0 && daySteps === allTimeStepPR) {
      events.push({
        id: `step-pr-${d.date}`,
        kind: 'step_pr',
        date: d.date,
        title: 'Step Personal Record!',
        subtitle: `${daySteps.toLocaleString()} steps — all-time best`,
        icon: '🏆',
        color: '#eab308',
        href: '/steps',
      })
    }

    // Step goal hit (but not PR — avoid duplicate on same day)
    if (daySteps >= STEP_GOAL && daySteps !== allTimeStepPR) {
      events.push({
        id: `step-goal-${d.date}`,
        kind: 'step_goal',
        date: d.date,
        title: 'Step Goal Hit',
        subtitle: `${daySteps.toLocaleString()} steps`,
        icon: '✅',
        color: '#22c55e',
        href: '/steps',
      })
    }

    // High HRV day (≥20% above baseline)
    if (dayHRV > 0 && hrvBaseline > 0) {
      const devPct = ((dayHRV - hrvBaseline) / hrvBaseline) * 100
      if (devPct >= 20) {
        events.push({
          id: `hrv-high-${d.date}`,
          kind: 'hrv_high',
          date: d.date,
          title: 'HRV High Day',
          subtitle: `${Math.round(dayHRV)} ms · +${Math.round(devPct)}% above baseline`,
          icon: '💚',
          color: '#22c55e',
          href: '/hrv',
        })
      } else if (devPct <= -20) {
        events.push({
          id: `hrv-low-${d.date}`,
          kind: 'hrv_low',
          date: d.date,
          title: 'HRV Low Day',
          subtitle: `${Math.round(dayHRV)} ms · ${Math.round(devPct)}% below baseline`,
          icon: '⚠️',
          color: '#f87171',
          href: '/hrv',
        })
      }
    }

    // Very high calorie burn day
    if (dayCal >= 700) {
      events.push({
        id: `cal-${d.date}`,
        kind: 'calorie_high',
        date: d.date,
        title: 'High Activity Day',
        subtitle: `${Math.round(dayCal)} active calories burned`,
        icon: '🔥',
        color: '#f97316',
        href: '/calories',
      })
    }
  }

  // Sort all events newest → oldest, deduplicate on id
  const seen = new Set<string>()
  const dedupedEvents = events
    .sort((a, b) => {
      const aKey = `${a.date}${a.time ?? '00:00'}`
      const bKey = `${b.date}${b.time ?? '00:00'}`
      return bKey.localeCompare(aKey)
    })
    .filter((e) => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Health Timeline</h1>
            <p className="text-sm text-text-secondary">
              {dedupedEvents.length > 0
                ? `${dedupedEvents.length} events · last 30 days`
                : 'Your health activity feed'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TimelineClient events={dedupedEvents} />
      </main>
      <BottomNav />
    </div>
  )
}
