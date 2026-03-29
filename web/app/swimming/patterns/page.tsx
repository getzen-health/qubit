import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Waves } from 'lucide-react'
import dynamic from 'next/dynamic'
const SwimmingPatternsClient = dynamic(() => import('./swimming-patterns-client').then(m => ({ default: m.SwimmingPatternsClient })), { ssr: false })
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Swimming Patterns' }

function pace100mStr(minsPerKm: number | null): string | null {
  if (!minsPerKm || minsPerKm <= 0) return null
  const secsPerKm = minsPerKm * 60
  const secsper100 = secsPerKm / 10
  const m = Math.floor(secsper100 / 60)
  const s = Math.round(secsper100 % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default async function SwimmingPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawSwims } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_heart_rate, active_calories, avg_pace_per_km')
    .eq('user_id', user.id)
    .eq('workout_type', 'Swimming')
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 3)
    .order('start_time', { ascending: true })

  const swims = rawSwims ?? []

  if (swims.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/swimming" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Swimming Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Waves className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 swims to see your patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dowSwims = Array(7).fill(0)
  const dowMeters = Array(7).fill(0)
  const hourSwims = Array(24).fill(0)
  const monthMap: Record<string, { count: number; meters: number; mins: number; cals: number; paces100: number[] }> = {}
  const weekMap: Record<string, { meters: number; swims: number }> = {}

  for (const s of swims) {
    const dt = new Date(s.start_time)
    const dow = (dt.getDay() + 6) % 7
    const meters = s.distance_meters ?? 0
    const mins = s.duration_minutes ?? 0

    dowSwims[dow]++
    dowMeters[dow] += meters
    hourSwims[dt.getHours()]++

    const monthKey = s.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0, meters: 0, mins: 0, cals: 0, paces100: [] }
    monthMap[monthKey].count++
    monthMap[monthKey].meters += meters
    monthMap[monthKey].mins += mins
    monthMap[monthKey].cals += s.active_calories ?? 0
    if (s.avg_pace_per_km && s.avg_pace_per_km > 0 && meters > 100) {
      // pace per 100m in seconds
      monthMap[monthKey].paces100.push((s.avg_pace_per_km * 60) / 10)
    }

    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { meters: 0, swims: 0 }
    weekMap[weekKey].meters += meters
    weekMap[weekKey].swims++
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    swims: dowSwims[i],
    meters: Math.round(dowMeters[i]),
  }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-12)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      const avgPace100Secs = val.paces100.length > 0
        ? Math.round(val.paces100.reduce((a, b) => a + b, 0) / val.paces100.length)
        : null
      const m = avgPace100Secs ? Math.floor(avgPace100Secs / 60) : null
      const s2 = avgPace100Secs ? avgPace100Secs % 60 : null
      const avgPace100Str = m !== null && s2 !== null ? `${m}:${String(s2).padStart(2, '0')}` : null
      return {
        label: MONTH_NAMES[monthNum - 1],
        key,
        swims: val.count,
        meters: Math.round(val.meters),
        mins: Math.round(val.mins),
        cals: Math.round(val.cals),
        avgPace100Secs,
        avgPace100Str,
      }
    })

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([key, val]) => ({
      label: key.slice(5),
      meters: Math.round(val.meters),
      swims: val.swims,
    }))

  const totalSwims = swims.length
  const totalMeters = Math.round(swims.reduce((s, r) => s + (r.distance_meters ?? 0), 0))
  const avgMetersPerSwim = Math.round(totalMeters / totalSwims)
  const avgDurationMins = Math.round(swims.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / totalSwims)
  const avgPerWeek = +(totalSwims / (365 / 7)).toFixed(1)
  const longestSwimMeters = Math.max(...swims.map((s) => s.distance_meters ?? 0), 0)

  const swimsWithPace = swims.filter((s) => s.avg_pace_per_km && s.avg_pace_per_km > 0 && (s.distance_meters ?? 0) > 100)
  const avgPace100Str = swimsWithPace.length > 0
    ? pace100mStr(swimsWithPace.reduce((a, b) => a + (b.avg_pace_per_km ?? 0), 0) / swimsWithPace.length)
    : null
  const bestPace100Str = swimsWithPace.length > 0
    ? pace100mStr(Math.min(...swimsWithPace.map((s) => s.avg_pace_per_km ?? Infinity)))
    : null

  const morningTotal = hourSwims.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourSwims.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourSwims.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  const busiestDay = DOW_LABELS[dowSwims.indexOf(Math.max(...dowSwims))]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/swimming" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Waves className="w-5 h-5 text-cyan-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Swimming Patterns</h1>
              <p className="text-sm text-text-secondary">{totalSwims} swims · {(totalMeters / 1000).toFixed(1)} km · past year</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SwimmingPatternsClient
          stats={{
            totalSwims,
            totalMeters,
            avgMetersPerSwim,
            avgDurationMins,
            avgPerWeek,
            avgPace100Str,
            bestPace100Str,
            longestSwimMeters,
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
