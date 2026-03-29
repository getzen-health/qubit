import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const PeriodizationClient = dynamic(() => import('./periodization-client').then(m => ({ default: m.PeriodizationClient })), { ssr: false })

export const metadata = { title: 'Training Periodization' }

export type Phase = 'base' | 'build' | 'peak' | 'taper' | 'offSeason'

export interface WeekBucket {
  monday: string // YYYY-MM-DD
  totalMinutes: number
  phase: Phase
}

export interface PhaseBlock {
  id: string
  phase: Phase
  startDate: string
  endDate: string
  weekCount: number
}

export interface PeriodizationData {
  buckets: WeekBucket[]
  phaseBlocks: PhaseBlock[]
  currentPhase: Phase
  peakVolume: number   // highest single week minutes
  avgVolume: number    // 52-week avg
  currentVolume: number // last 2-week avg
}

function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

function classifyPhase(
  currentAvg: number,
  prevAvg: number | null,
  peakVolume: number,
  avgVolume: number
): Phase {
  if (peakVolume === 0) return 'offSeason'
  const pctOfPeak = currentAvg / peakVolume
  if (pctOfPeak < 0.25) return 'offSeason'

  if (prevAvg !== null) {
    const trend = prevAvg > 0 ? (currentAvg - prevAvg) / prevAvg : 0
    // Tapering: significant drop from higher base
    if (trend < -0.25 && currentAvg > avgVolume * 0.4 && pctOfPeak > 0.3) return 'taper'
    // Peak: high volume (>75% of peak)
    if (pctOfPeak >= 0.75) return 'peak'
    // Build: rising trend + medium-high volume
    if (trend > 0.08 && pctOfPeak >= 0.4) return 'build'
  }

  if (pctOfPeak >= 0.35) return 'base'
  return 'offSeason'
}

export default async function PeriodizationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fiftyTwoWeeksAgo = new Date()
  fiftyTwoWeeksAgo.setDate(fiftyTwoWeeksAgo.getDate() - 52 * 7)

  const { data: raw } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes')
    .eq('user_id', user.id)
    .gte('start_time', fiftyTwoWeeksAgo.toISOString())
    .gt('duration_minutes', 0)
    .order('start_time', { ascending: true })

  const workouts = raw ?? []

  // Build 52 Monday-anchored week buckets
  const now = new Date()
  const thisMondayStr = getMondayOf(now)
  const thisMondayDate = new Date(thisMondayStr + 'T00:00:00Z')

  const weekMinutes = new Map<string, number>()
  for (let i = 51; i >= 0; i--) {
    const d = new Date(thisMondayDate)
    d.setUTCDate(thisMondayDate.getUTCDate() - i * 7)
    weekMinutes.set(d.toISOString().split('T')[0], 0)
  }

  // Accumulate minutes into week buckets
  for (const w of workouts) {
    const monday = getMondayOf(new Date(w.start_time))
    if (weekMinutes.has(monday)) {
      weekMinutes.set(monday, (weekMinutes.get(monday) ?? 0) + (w.duration_minutes ?? 0))
    }
  }

  const sortedMondays = [...weekMinutes.keys()].sort()
  const minuteValues = sortedMondays.map((m) => weekMinutes.get(m) ?? 0)

  // Compute global stats
  const peakVolume = Math.max(...minuteValues, 0)
  const avgVolume =
    minuteValues.length > 0 ? minuteValues.reduce((a, b) => a + b, 0) / minuteValues.length : 0

  // Build 4-week rolling averages for phase classification
  // rolling avg for week i = avg of weeks [i-3, i-2, i-1, i]
  const rollingAvgs: number[] = minuteValues.map((_, i) => {
    const window = minuteValues.slice(Math.max(0, i - 3), i + 1)
    return window.reduce((a, b) => a + b, 0) / window.length
  })

  // Classify each week
  const buckets: WeekBucket[] = sortedMondays.map((monday, i) => {
    const currentAvg = rollingAvgs[i]
    const prevAvg = i >= 4 ? rollingAvgs[i - 4] : null
    const phase = classifyPhase(currentAvg, prevAvg, peakVolume, avgVolume)
    return { monday, totalMinutes: minuteValues[i], phase }
  })

  // Build phase blocks (consecutive weeks with the same phase)
  const phaseBlocks: PhaseBlock[] = []
  let blockStart = 0
  for (let i = 1; i <= buckets.length; i++) {
    const isLast = i === buckets.length
    const phaseChanged = !isLast && buckets[i].phase !== buckets[blockStart].phase
    if (phaseChanged || isLast) {
      const slice = buckets.slice(blockStart, i)
      phaseBlocks.push({
        id: `${buckets[blockStart].monday}-${buckets[i - 1].monday}`,
        phase: buckets[blockStart].phase,
        startDate: buckets[blockStart].monday,
        endDate: buckets[i - 1].monday,
        weekCount: slice.length,
      })
      blockStart = i
    }
  }

  const currentPhase = buckets[buckets.length - 1]?.phase ?? 'offSeason'

  // Last 2-week avg for currentVolume
  const last2 = minuteValues.slice(-2)
  const currentVolume = last2.length > 0 ? last2.reduce((a, b) => a + b, 0) / last2.length : 0

  const data: PeriodizationData = {
    buckets,
    phaseBlocks,
    currentPhase,
    peakVolume,
    avgVolume,
    currentVolume,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Periodization</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Training phase detector · 52 weeks</p>
          </div>
          <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        <PeriodizationClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
