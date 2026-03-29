import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bike } from 'lucide-react'
import dynamic from 'next/dynamic'
const CyclingPatternsClient = dynamic(() => import('./cycling-patterns-client').then(m => ({ default: m.CyclingPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cycling Patterns' }

export default async function CyclingPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawRides } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_heart_rate, elevation_gain_meters, active_calories')
    .eq('user_id', user.id)
    .eq('workout_type', 'Cycling')
    .gte('start_time', oneYearAgo.toISOString())
    .gt('distance_meters', 500)
    .gt('duration_minutes', 3)
    .order('start_time', { ascending: true })

  const rides = rawRides ?? []

  if (rides.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/cycling" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Cycling Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Bike className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 rides to see your cycling patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dowRides = Array(7).fill(0)
  const dowKm = Array(7).fill(0)
  const hourRides = Array(24).fill(0)
  const monthMap: Record<string, { count: number; km: number; mins: number; elevation: number; cals: number; speeds: number[] }> = {}
  const weekMap: Record<string, { km: number; rides: number }> = {}

  for (const r of rides) {
    const dt = new Date(r.start_time)
    const dow = (dt.getDay() + 6) % 7
    const km = (r.distance_meters ?? 0) / 1000
    const mins = r.duration_minutes ?? 0

    dowRides[dow]++
    dowKm[dow] += km
    hourRides[dt.getHours()]++

    const monthKey = r.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0, km: 0, mins: 0, elevation: 0, cals: 0, speeds: [] }
    monthMap[monthKey].count++
    monthMap[monthKey].km += km
    monthMap[monthKey].mins += mins
    monthMap[monthKey].elevation += r.elevation_gain_meters ?? 0
    monthMap[monthKey].cals += r.active_calories ?? 0
    if (km > 0 && mins > 0) monthMap[monthKey].speeds.push((km / mins) * 60)

    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { km: 0, rides: 0 }
    weekMap[weekKey].km += km
    weekMap[weekKey].rides++
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    rides: dowRides[i],
    km: +dowKm[i].toFixed(1),
  }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-12)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      const avgSpeed = val.speeds.length > 0
        ? +(val.speeds.reduce((a, b) => a + b, 0) / val.speeds.length).toFixed(1)
        : null
      return {
        label: MONTH_NAMES[monthNum - 1],
        key,
        rides: val.count,
        km: +val.km.toFixed(1),
        mins: Math.round(val.mins),
        elevation: Math.round(val.elevation),
        cals: Math.round(val.cals),
        avgSpeed,
      }
    })

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([key, val]) => ({
      label: key.slice(5),
      km: +val.km.toFixed(1),
      rides: val.rides,
    }))

  // Summary stats
  const totalRides = rides.length
  const totalKm = +(rides.reduce((s, r) => s + (r.distance_meters ?? 0) / 1000, 0).toFixed(1))
  const avgKmPerRide = +(totalKm / totalRides).toFixed(1)
  const avgDurationMins = Math.round(rides.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / rides.length)
  const avgPerWeek = +(totalRides / (365 / 7)).toFixed(1)
  const totalElevation = Math.round(rides.reduce((s, r) => s + (r.elevation_gain_meters ?? 0), 0))

  // Speed stats
  const ridesWithSpeed = rides.filter((r) => (r.distance_meters ?? 0) > 500 && (r.duration_minutes ?? 0) > 3)
  const allSpeeds = ridesWithSpeed.map((r) => ((r.distance_meters ?? 0) / 1000 / (r.duration_minutes ?? 1)) * 60)
  const avgSpeedKph = allSpeeds.length > 0
    ? +(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length).toFixed(1)
    : null
  const bestSpeedKph = allSpeeds.length > 0 ? +Math.max(...allSpeeds).toFixed(1) : null
  const longestRideKm = +(Math.max(...rides.map((r) => (r.distance_meters ?? 0) / 1000), 0)).toFixed(1)

  const morningTotal = hourRides.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourRides.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourRides.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  const busiestDay = DOW_LABELS[dowRides.indexOf(Math.max(...dowRides))]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cycling" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Bike className="w-5 h-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Cycling Patterns</h1>
              <p className="text-sm text-text-secondary">{totalRides} rides · {totalKm} km · past year</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CyclingPatternsClient
          stats={{
            totalRides,
            totalKm,
            avgKmPerRide,
            avgDurationMins,
            avgPerWeek,
            avgSpeedKph,
            bestSpeedKph,
            longestRideKm,
            totalElevation,
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
