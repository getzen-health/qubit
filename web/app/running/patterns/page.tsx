import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Footprints } from 'lucide-react'
import dynamic from 'next/dynamic'
const RunningPatternsClient = dynamic(() => import('./running-patterns-client').then(m => ({ default: m.RunningPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Running Patterns' }

function paceToSecs(pace: number | null): number | null {
  // pace stored as min/km decimal, convert to seconds
  if (!pace || pace <= 0) return null
  return Math.round(pace * 60)
}

function secsToMmSs(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default async function RunningPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawRuns } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_pace_per_km, avg_heart_rate')
    .eq('user_id', user.id)
    .eq('workout_type', 'Running')
    .gte('start_time', oneYearAgo.toISOString())
    .gt('distance_meters', 500)
    .gt('duration_minutes', 3)
    .order('start_time', { ascending: true })

  const runs = rawRuns ?? []

  if (runs.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/running" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Running Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Footprints className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 runs to see your running patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  // DOW distribution (Mon-first)
  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dowRuns = Array(7).fill(0)
  const dowKm = Array(7).fill(0)

  // Hour of day
  const hourRuns = Array(24).fill(0)

  // Monthly stats
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthMap: Record<string, { count: number; km: number; paces: number[]; mins: number }> = {}

  // Weekly distance
  const weekMap: Record<string, { km: number; runs: number }> = {}

  // Pace trend (monthly avg pace in secs/km)
  const longestRunKm = Math.max(...runs.map((r) => (r.distance_meters ?? 0) / 1000), 0)
  const bestPaceSecs = runs
    .filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 0 && (r.distance_meters ?? 0) > 1000)
    .reduce((best: number | null, r) => {
      const s = paceToSecs(r.avg_pace_per_km)
      if (!s) return best
      return best === null ? s : Math.min(best, s)
    }, null)

  for (const r of runs) {
    const dt = new Date(r.start_time)
    const dow = (dt.getDay() + 6) % 7
    dowRuns[dow]++
    dowKm[dow] += (r.distance_meters ?? 0) / 1000

    hourRuns[dt.getHours()]++

    const monthKey = r.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0, km: 0, paces: [], mins: 0 }
    monthMap[monthKey].count++
    monthMap[monthKey].km += (r.distance_meters ?? 0) / 1000
    monthMap[monthKey].mins += r.duration_minutes ?? 0
    const p = paceToSecs(r.avg_pace_per_km)
    if (p) monthMap[monthKey].paces.push(p)

    // ISO week
    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { km: 0, runs: 0 }
    weekMap[weekKey].km += (r.distance_meters ?? 0) / 1000
    weekMap[weekKey].runs++
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    runs: dowRuns[i],
    km: +dowKm[i].toFixed(1),
  }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-12)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      const avgPaceSecs = val.paces.length > 0
        ? Math.round(val.paces.reduce((a, b) => a + b, 0) / val.paces.length)
        : null
      return {
        label: MONTH_NAMES[monthNum - 1],
        key,
        runs: val.count,
        km: +val.km.toFixed(1),
        mins: Math.round(val.mins),
        avgPaceSecs,
        avgPaceStr: avgPaceSecs ? secsToMmSs(avgPaceSecs) : null,
      }
    })

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([key, val]) => ({
      label: key.slice(5),
      km: +val.km.toFixed(1),
      runs: val.runs,
    }))

  // Summary stats
  const totalRuns = runs.length
  const totalKm = +(runs.reduce((s, r) => s + (r.distance_meters ?? 0) / 1000, 0).toFixed(1))
  const avgKmPerRun = +(totalKm / totalRuns).toFixed(1)
  const avgDurationMins = Math.round(runs.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / runs.length)
  const avgPerWeek = +(totalRuns / (365 / 7)).toFixed(1)

  const allPaces = runs.filter((r) => r.avg_pace_per_km && r.avg_pace_per_km > 0 && (r.distance_meters ?? 0) > 1000)
  const avgPaceSecs = allPaces.length > 0
    ? Math.round(allPaces.reduce((s, r) => s + (r.avg_pace_per_km ?? 0) * 60, 0) / allPaces.length)
    : null

  const morningTotal = hourRuns.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourRuns.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourRuns.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  const busiestDay = DOW_LABELS[dowRuns.indexOf(Math.max(...dowRuns))]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/running" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Footprints className="w-5 h-5 text-green-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Running Patterns</h1>
              <p className="text-sm text-text-secondary">{totalRuns} runs · {totalKm} km · past year</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <RunningPatternsClient
          stats={{
            totalRuns,
            totalKm,
            avgKmPerRun,
            avgDurationMins,
            avgPerWeek,
            avgPaceStr: avgPaceSecs ? secsToMmSs(avgPaceSecs) : null,
            bestPaceStr: bestPaceSecs ? secsToMmSs(bestPaceSecs) : null,
            longestRunKm: +longestRunKm.toFixed(1),
            busiestDay,
            preferredTime,
          }}
          dowData={dowData}
          monthlyData={monthlyData}
          weeklyData={weeklyData}
          timeTotals={{ morning: morningTotal, afternoon: afternoonTotal, evening: eveningTotal }}
        />
      </main>
      <BottomNav />
    </div>
  )
}
