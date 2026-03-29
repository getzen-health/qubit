import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const Zone2Client = dynamic(() => import('./zone2-client').then(m => ({ default: m.Zone2Client })))

export const metadata = { title: 'Zone 2 Training' }

// Sport grouping map → canonical name
const SPORT_GROUP: Record<string, string> = {
  Running: 'Running',
  Cycling: 'Cycling',
  Walking: 'Walking',
  Hiking: 'Hiking',
  Swimming: 'Swimming',
}

const SPORT_COLORS: Record<string, string> = {
  Running: '#f97316',
  Cycling: '#3b82f6',
  Walking: '#84cc16',
  Hiking: '#22c55e',
  Swimming: '#06b6d4',
  Other: '#94a3b8',
}

const maxHR = 190
const zone2MinPct = 0.60
const zone2MaxPct = 0.70
const zone2FloorBpm = Math.round(zone2MinPct * maxHR) // 114
const zone2CeilBpm = Math.round(zone2MaxPct * maxHR)  // 133
const zone2SoftFloorBpm = 105                          // soft lower bound for partial credit

export interface WeekBucket {
  weekLabel: string
  weekStart: string
  z2Mins: number
  [sport: string]: number | string
}

export interface Zone2Data {
  weeks: WeekBucket[]
  totalZ2Hours: number
  avgZ2HoursPerActiveWeek: number
  peakZ2WeekMins: number
  peakZ2WeekLabel: string
  currentWeekZ2Mins: number
  activeSports: { sport: string; totalMins: number; color: string }[]
  sports: string[]
  sportColors: Record<string, string>
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function weekLabel(monday: Date): string {
  const month = monday.toLocaleDateString('en-US', { month: 'short' })
  const weekOfMonth = Math.ceil(monday.getDate() / 7)
  return `${month} W${weekOfMonth}`
}

function classifyZ2Factor(avgHR: number): number {
  if (avgHR <= 0) return 0
  if (avgHR >= zone2FloorBpm && avgHR <= zone2CeilBpm) return 0.8
  if (avgHR >= zone2SoftFloorBpm && avgHR < zone2FloorBpm) return 0.5
  return 0
}

function groupSport(workoutType: string): string {
  return SPORT_GROUP[workoutType] ?? 'Other'
}

export default async function Zone2Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: raw } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes, avg_heart_rate, active_calories')
    .eq('user_id', user.id)
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  const workouts = raw ?? []

  // Build 52 Monday-anchored week buckets (from 51 weeks ago to this week)
  const now = new Date()
  const thisMonday = getMonday(now)
  const SPORTS_ALL = ['Running', 'Cycling', 'Walking', 'Hiking', 'Swimming', 'Other']

  const weekMap = new Map<string, WeekBucket>()
  for (let i = 51; i >= 0; i--) {
    const monday = new Date(thisMonday)
    monday.setDate(thisMonday.getDate() - i * 7)
    const isoKey = monday.toISOString().slice(0, 10)
    const bucket: WeekBucket = { weekLabel: weekLabel(monday), weekStart: isoKey, z2Mins: 0 }
    for (const s of SPORTS_ALL) bucket[s] = 0
    weekMap.set(isoKey, bucket)
  }

  // Sport totals for summary
  const sportTotals: Record<string, number> = {}
  for (const s of SPORTS_ALL) sportTotals[s] = 0

  // Accumulate Z2 minutes into week buckets
  for (const w of workouts) {
    const avgHR = w.avg_heart_rate ?? 0
    const durationMins = w.duration_minutes ?? 0
    const z2Factor = classifyZ2Factor(avgHR)
    if (z2Factor === 0) continue

    const z2Mins = durationMins * z2Factor
    const sport = groupSport(w.workout_type)

    const d = new Date(w.start_time)
    const monday = getMonday(d)
    const key = monday.toISOString().slice(0, 10)
    const bucket = weekMap.get(key)
    if (!bucket) continue

    bucket.z2Mins += z2Mins
    bucket[sport] = ((bucket[sport] as number) ?? 0) + z2Mins
    sportTotals[sport] = (sportTotals[sport] ?? 0) + z2Mins
  }

  const weeks = [...weekMap.values()]

  // Compute statistics
  const totalZ2Mins = weeks.reduce((a, w) => a + w.z2Mins, 0)
  const totalZ2Hours = totalZ2Mins / 60

  const activeWeeks = weeks.filter((w) => w.z2Mins > 0)
  const avgZ2HoursPerActiveWeek =
    activeWeeks.length > 0 ? (activeWeeks.reduce((a, w) => a + w.z2Mins, 0) / activeWeeks.length) / 60 : 0

  const peakWeek = weeks.reduce(
    (best, w) => (w.z2Mins > best.z2Mins ? w : best),
    weeks[0] ?? { weekLabel: '—', weekStart: '', z2Mins: 0 },
  )
  const peakZ2WeekMins = peakWeek.z2Mins
  const peakZ2WeekLabel = peakWeek.weekLabel

  // Current week = last bucket
  const currentWeekZ2Mins = weeks[weeks.length - 1]?.z2Mins ?? 0

  // Active sports sorted by total Z2 minutes descending, minimum 10 min
  const activeSports = SPORTS_ALL
    .filter((s) => (sportTotals[s] ?? 0) >= 10)
    .map((s) => ({ sport: s, totalMins: sportTotals[s], color: SPORT_COLORS[s] }))
    .sort((a, b) => b.totalMins - a.totalMins)

  const data: Zone2Data = {
    weeks,
    totalZ2Hours,
    avgZ2HoursPerActiveWeek,
    peakZ2WeekMins,
    peakZ2WeekLabel,
    currentWeekZ2Mins,
    activeSports,
    sports: SPORTS_ALL,
    sportColors: SPORT_COLORS,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/zones"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to zones"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Zone 2 Training</h1>
              <p className="text-sm text-text-secondary">Aerobic base builder</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <Zone2Client data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
