import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const VolumeClient = dynamic(() => import('./volume-client').then(m => ({ default: m.VolumeClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Training Volume History' }

// Canonical sport groups mapped to display names and colors
const SPORT_MAP: Record<string, { group: string; color: string }> = {
  Running:                          { group: 'Running',   color: '#f97316' },
  Cycling:                          { group: 'Cycling',   color: '#3b82f6' },
  Swimming:                         { group: 'Swimming',  color: '#06b6d4' },
  'Strength Training':              { group: 'Strength',  color: '#ef4444' },
  'Functional Strength Training':   { group: 'Strength',  color: '#ef4444' },
  'Core Training':                  { group: 'Strength',  color: '#ef4444' },
  'Cross Training':                 { group: 'Strength',  color: '#ef4444' },
  Hiking:                           { group: 'Hiking',    color: '#22c55e' },
  HIIT:                             { group: 'HIIT',      color: '#f43f5e' },
  'High Intensity Interval Training': { group: 'HIIT',   color: '#f43f5e' },
  Rowing:                           { group: 'Rowing',    color: '#a855f7' },
  'Indoor Rowing':                  { group: 'Rowing',    color: '#a855f7' },
  'Rowing Machine':                 { group: 'Rowing',    color: '#a855f7' },
  Sculling:                         { group: 'Rowing',    color: '#a855f7' },
  Walking:                          { group: 'Walking',   color: '#84cc16' },
  Yoga:                             { group: 'Yoga',      color: '#ec4899' },
  Mindfulness:                      { group: 'Yoga',      color: '#ec4899' },
  Pilates:                          { group: 'Other',     color: '#94a3b8' },
}

const GROUP_ORDER = ['Running', 'Cycling', 'Swimming', 'Strength', 'HIIT', 'Hiking', 'Rowing', 'Walking', 'Yoga', 'Other']
const GROUP_COLORS: Record<string, string> = {
  Running: '#f97316', Cycling: '#3b82f6', Swimming: '#06b6d4',
  Strength: '#ef4444', HIIT: '#f43f5e', Hiking: '#22c55e',
  Rowing: '#a855f7', Walking: '#84cc16', Yoga: '#ec4899', Other: '#94a3b8',
}

export interface WeekPoint {
  weekLabel: string  // "Jan W1", "Feb W2", etc.
  weekStart: string  // ISO date of Mon
  totalMins: number
  [sport: string]: number | string  // sport-group → mins
}

export interface VolumeData {
  weeks: WeekPoint[]
  groups: string[]              // active groups (have data)
  groupColors: Record<string, string>
  totalHours: number
  avgWeeklyHours: number
  peakWeekMins: number
  peakWeekLabel: string
  activeSports: { group: string; totalMins: number; color: string }[]
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
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

export default async function VolumeHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: raw } = await supabase
    .from('workout_records')
    .select('start_time, workout_type, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 3)
    .order('start_time', { ascending: true })

  const workouts = raw ?? []

  // Build 52 weeks of Mondays
  const now = new Date()
  const thisMonday = getMonday(now)

  const weekMap = new Map<string, WeekPoint>()
  for (let i = 51; i >= 0; i--) {
    const monday = new Date(thisMonday)
    monday.setDate(thisMonday.getDate() - i * 7)
    const isoKey = monday.toISOString().slice(0, 10)
    const pt: WeekPoint = { weekLabel: weekLabel(monday), weekStart: isoKey, totalMins: 0 }
    for (const g of GROUP_ORDER) pt[g] = 0
    weekMap.set(isoKey, pt)
  }

  // Accumulate workout minutes into week buckets
  const groupTotals: Record<string, number> = {}
  for (const g of GROUP_ORDER) groupTotals[g] = 0

  for (const w of workouts) {
    const d = new Date(w.start_time)
    const monday = getMonday(d)
    const key = monday.toISOString().slice(0, 10)
    const pt = weekMap.get(key)
    if (!pt) continue

    const mapped = SPORT_MAP[w.workout_type] ?? { group: 'Other', color: '#94a3b8' }
    const group = mapped.group
    const mins = w.duration_minutes ?? 0
    pt[group] = (pt[group] as number) + mins
    pt.totalMins += mins
    groupTotals[group] = (groupTotals[group] ?? 0) + mins
  }

  const weeks = [...weekMap.values()]

  // Active groups (have at least 10 minutes total)
  const activeGroups = GROUP_ORDER.filter((g) => (groupTotals[g] ?? 0) >= 10)

  // Active sports summary sorted by total time
  const activeSports = activeGroups
    .map((g) => ({ group: g, totalMins: groupTotals[g], color: GROUP_COLORS[g] }))
    .sort((a, b) => b.totalMins - a.totalMins)

  const totalMins = weeks.reduce((a, w) => a + w.totalMins, 0)
  const activeWeeks = weeks.filter((w) => w.totalMins > 0)
  const avgWeeklyMins = activeWeeks.length > 0 ? totalMins / activeWeeks.length : 0

  const peakWeek = weeks.reduce((best, w) => (w.totalMins > best.totalMins ? w : best), weeks[0])

  const data: VolumeData = {
    weeks,
    groups: activeGroups,
    groupColors: GROUP_COLORS,
    totalHours: totalMins / 60,
    avgWeeklyHours: avgWeeklyMins / 60,
    peakWeekMins: peakWeek?.totalMins ?? 0,
    peakWeekLabel: peakWeek?.weekLabel ?? '—',
    activeSports,
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Training Volume History</h1>
            <p className="text-sm text-text-secondary">Last 52 weeks · by sport</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VolumeClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
