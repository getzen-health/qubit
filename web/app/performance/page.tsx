import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PerformanceClient } from './performance-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Performance Overview' }

// Sport type groups
const SPORT_GROUPS: Record<string, string[]> = {
  Running:  ['Running'],
  Cycling:  ['Cycling'],
  Swimming: ['Swimming'],
  Hiking:   ['Hiking'],
  Strength: ['Strength Training', 'Functional Strength Training', 'Core Training', 'Cross Training'],
  HIIT:     ['HIIT', 'High Intensity Interval Training'],
  Rowing:   ['Rowing', 'Indoor Rowing', 'Rowing Machine', 'Sculling'],
}

type SportKey = keyof typeof SPORT_GROUPS

function paceStr(minsPerKm: number): string {
  if (!minsPerKm || minsPerKm <= 0 || minsPerKm > 30) return '—'
  const min = Math.floor(minsPerKm)
  const sec = Math.round((minsPerKm - min) * 60)
  return `${min}:${sec.toString().padStart(2, '0')} /km`
}

function speedStr(km: number, durMins: number): string {
  if (!km || !durMins || durMins <= 0) return '—'
  return `${((km / durMins) * 60).toFixed(1)} km/h`
}

export interface SportSnapshot {
  sport: string
  icon: string
  color: string
  nowSessions: number
  thenSessions: number
  nowAvgMetric: number | null   // pace or speed or duration
  thenAvgMetric: number | null
  metricLabel: string           // e.g. "avg pace", "avg speed", "avg duration"
  metricDisplay: (v: number) => string
  nowTotalKm: number
  thenTotalKm: number
  nowTotalMins: number
  thenTotalMins: number
}

export interface PerformanceData {
  sports: SportSnapshot[]
  // Cardio health markers
  nowRHR: number | null
  thenRHR: number | null
  nowHRV: number | null
  thenHRV: number | null
  // Weekly training volume
  nowWeeklyMins: number
  thenWeeklyMins: number
  nowWeeklyWorkouts: number
  thenWeeklyWorkouts: number
  // Activity
  nowDailySteps: number
  thenDailySteps: number
}

function avg(arr: number[]): number | null {
  const valid = arr.filter((v) => v > 0)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export default async function PerformancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  // "Now" = last 30 days
  const nowStart = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
  // "Then" = 12–13 months ago (same 30-day window, 1 year back)
  const thenEnd   = new Date(now.getTime() - 335 * 24 * 3600 * 1000)
  const thenStart = new Date(now.getTime() - 365 * 24 * 3600 * 1000)

  // Fetch workouts for both windows in one query
  const { data: workouts } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes, distance_meters, avg_pace_per_km, active_calories')
    .eq('user_id', user.id)
    .gte('start_time', thenStart.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  // Daily summaries for cardio markers (90 days now vs 90 days a year ago)
  const nowSumStart  = new Date(now.getTime() -  90 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const nowSumEnd    = now.toISOString().slice(0, 10)
  const thenSumEnd   = new Date(now.getTime() - 275 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const thenSumStart = new Date(now.getTime() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, resting_heart_rate, avg_hrv, steps')
    .eq('user_id', user.id)
    .gte('date', thenSumStart)
    .lte('date', nowSumEnd)
    .order('date', { ascending: true })

  const rows = workouts ?? []
  const sums = summaries ?? []

  // Partition into now / then
  const nowIso   = nowStart.toISOString()
  const thenEndIso = thenEnd.toISOString()

  const nowRows  = rows.filter((r) => r.start_time >= nowIso)
  const thenRows = rows.filter((r) => r.start_time >= thenStart.toISOString() && r.start_time <= thenEndIso)

  // Helper: get rows for a sport group in a window
  function getRows(window: typeof nowRows, types: string[]) {
    return window.filter((r) => types.includes(r.workout_type))
  }

  // Build sport snapshots
  const SPORT_META: Record<string, { icon: string; color: string }> = {
    Running:  { icon: '🏃', color: 'text-orange-500' },
    Cycling:  { icon: '🚴', color: 'text-blue-500' },
    Swimming: { icon: '🏊', color: 'text-cyan-500' },
    Hiking:   { icon: '🥾', color: 'text-green-500' },
    Strength: { icon: '💪', color: 'text-red-500' },
    HIIT:     { icon: '⚡', color: 'text-pink-500' },
    Rowing:   { icon: '🚣', color: 'text-purple-500' },
  }

  const sports: SportSnapshot[] = (Object.keys(SPORT_GROUPS) as SportKey[]).map((sport) => {
    const types = SPORT_GROUPS[sport]
    const nowSport = getRows(nowRows, types)
    const thenSport = getRows(thenRows, types)

    const nowKm = nowSport.reduce((a, r) => a + (r.distance_meters ?? 0) / 1000, 0)
    const thenKm = thenSport.reduce((a, r) => a + (r.distance_meters ?? 0) / 1000, 0)
    const nowMins = nowSport.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const thenMins = thenSport.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)

    let metricLabel = ''
    let nowMetric: number | null = null
    let thenMetric: number | null = null
    let metricDisplay = (v: number) => v.toFixed(1)

    if (sport === 'Running' || sport === 'Hiking') {
      metricLabel = 'avg pace'
      const nowPaces = nowSport.filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 2 && r.avg_pace_per_km < 20).map((r) => r.avg_pace_per_km!)
      const thenPaces = thenSport.filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 2 && r.avg_pace_per_km < 20).map((r) => r.avg_pace_per_km!)
      nowMetric = avg(nowPaces)
      thenMetric = avg(thenPaces)
      metricDisplay = paceStr
    } else if (sport === 'Cycling' || sport === 'Rowing') {
      metricLabel = 'avg speed'
      // compute speed from distance/duration
      nowMetric = nowSport.filter((r) => r.distance_meters && r.duration_minutes).length
        ? avg(nowSport.filter((r) => r.distance_meters && r.duration_minutes).map((r) => ((r.distance_meters! / 1000) / r.duration_minutes!) * 60))
        : null
      thenMetric = thenSport.filter((r) => r.distance_meters && r.duration_minutes).length
        ? avg(thenSport.filter((r) => r.distance_meters && r.duration_minutes).map((r) => ((r.distance_meters! / 1000) / r.duration_minutes!) * 60))
        : null
      metricDisplay = (v) => `${v.toFixed(1)} km/h`
    } else if (sport === 'Swimming') {
      metricLabel = 'pace /100m'
      const nowPaces = nowSport.filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 0).map((r) => (r.avg_pace_per_km! * 60) / 10)
      const thenPaces = thenSport.filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 0).map((r) => (r.avg_pace_per_km! * 60) / 10)
      nowMetric = avg(nowPaces)
      thenMetric = avg(thenPaces)
      metricDisplay = (v) => {
        const min = Math.floor(v / 60); const sec = Math.round(v % 60)
        return `${min}:${sec.toString().padStart(2, '0')} /100m`
      }
    } else {
      // Strength, HIIT — use avg duration
      metricLabel = 'avg session'
      nowMetric = nowSport.length ? avg(nowSport.map((r) => r.duration_minutes ?? 0)) : null
      thenMetric = thenSport.length ? avg(thenSport.map((r) => r.duration_minutes ?? 0)) : null
      metricDisplay = (v) => `${Math.round(v)} min`
    }

    return {
      sport,
      icon: SPORT_META[sport].icon,
      color: SPORT_META[sport].color,
      nowSessions: nowSport.length,
      thenSessions: thenSport.length,
      nowAvgMetric: nowMetric,
      thenAvgMetric: thenMetric,
      metricLabel,
      metricDisplay,
      nowTotalKm: nowKm,
      thenTotalKm: thenKm,
      nowTotalMins: nowMins,
      thenTotalMins: thenMins,
    }
  }).filter((s) => s.nowSessions > 0 || s.thenSessions > 0)

  // Cardio health markers
  const nowSums = sums.filter((s) => s.date >= nowSumStart)
  const thenSums = sums.filter((s) => s.date >= thenSumStart && s.date <= thenSumEnd)

  const nowRHR = avg(nowSums.filter((s) => s.resting_heart_rate && s.resting_heart_rate > 30).map((s) => s.resting_heart_rate!))
  const thenRHR = avg(thenSums.filter((s) => s.resting_heart_rate && s.resting_heart_rate > 30).map((s) => s.resting_heart_rate!))
  const nowHRV = avg(nowSums.filter((s) => s.avg_hrv && s.avg_hrv > 0).map((s) => s.avg_hrv!))
  const thenHRV = avg(thenSums.filter((s) => s.avg_hrv && s.avg_hrv > 0).map((s) => s.avg_hrv!))

  // Weekly training volume (average per week in each 30-day window)
  const nowWeeklyMins = nowRows.reduce((a, r) => a + (r.duration_minutes ?? 0), 0) / 4.3
  const thenWeeklyMins = thenRows.reduce((a, r) => a + (r.duration_minutes ?? 0), 0) / 4.3
  const nowWeeklyWorkouts = nowRows.length / 4.3
  const thenWeeklyWorkouts = thenRows.length / 4.3

  const nowDailySteps = avg(nowSums.filter((s) => s.steps && s.steps > 0).map((s) => s.steps!)) ?? 0
  const thenDailySteps = avg(thenSums.filter((s) => s.steps && s.steps > 0).map((s) => s.steps!)) ?? 0

  const data: PerformanceData = {
    sports,
    nowRHR,
    thenRHR,
    nowHRV,
    thenHRV,
    nowWeeklyMins,
    thenWeeklyMins,
    nowWeeklyWorkouts,
    thenWeeklyWorkouts,
    nowDailySteps,
    thenDailySteps,
  }

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Performance Overview</h1>
            <p className="text-sm text-text-secondary">Last 30 days vs same period 1 year ago</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <PerformanceClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
