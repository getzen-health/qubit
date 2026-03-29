import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mountain } from 'lucide-react'
import dynamic from 'next/dynamic'
const HikingPatternsClient = dynamic(() => import('./hiking-patterns-client').then(m => ({ default: m.HikingPatternsClient })))
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Hiking Patterns' }

export default async function HikingPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: rawHikes } = await supabase
    .from('workout_records')
    .select('start_time, duration_minutes, distance_meters, avg_heart_rate, elevation_gain_meters, active_calories, avg_pace_per_km')
    .eq('user_id', user.id)
    .eq('workout_type', 'Hiking')
    .gte('start_time', oneYearAgo.toISOString())
    .gt('duration_minutes', 5)
    .order('start_time', { ascending: true })

  const hikes = rawHikes ?? []

  if (hikes.length < 3) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/hiking" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Hiking Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Mountain className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</p>
          <p className="text-sm text-text-secondary">Log at least 3 hikes to see your patterns.</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const dowHikes = Array(7).fill(0)
  const dowKm = Array(7).fill(0)
  const hourHikes = Array(24).fill(0)
  const monthMap: Record<string, { count: number; km: number; mins: number; elevation: number; cals: number }> = {}
  const weekMap: Record<string, { km: number; hikes: number }> = {}

  for (const h of hikes) {
    const dt = new Date(h.start_time)
    const dow = (dt.getDay() + 6) % 7
    const km = (h.distance_meters ?? 0) / 1000

    dowHikes[dow]++
    dowKm[dow] += km
    hourHikes[dt.getHours()]++

    const monthKey = h.start_time.slice(0, 7)
    if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0, km: 0, mins: 0, elevation: 0, cals: 0 }
    monthMap[monthKey].count++
    monthMap[monthKey].km += km
    monthMap[monthKey].mins += h.duration_minutes ?? 0
    monthMap[monthKey].elevation += h.elevation_gain_meters ?? 0
    monthMap[monthKey].cals += h.active_calories ?? 0

    const year = dt.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const weekNum = Math.ceil(((dt.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`
    if (!weekMap[weekKey]) weekMap[weekKey] = { km: 0, hikes: 0 }
    weekMap[weekKey].km += km
    weekMap[weekKey].hikes++
  }

  const dowData = DOW_LABELS.map((label, i) => ({
    label,
    hikes: dowHikes[i],
    km: +dowKm[i].toFixed(1),
  }))

  const monthlyData = Object.keys(monthMap)
    .sort()
    .slice(-12)
    .map((key) => {
      const val = monthMap[key]
      const monthNum = parseInt(key.slice(5, 7), 10)
      return {
        label: MONTH_NAMES[monthNum - 1],
        key,
        hikes: val.count,
        km: +val.km.toFixed(1),
        mins: Math.round(val.mins),
        elevation: Math.round(val.elevation),
        cals: Math.round(val.cals),
      }
    })

  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-16)
    .map(([key, val]) => ({
      label: key.slice(5),
      km: +val.km.toFixed(1),
      hikes: val.hikes,
    }))

  const totalHikes = hikes.length
  const totalKm = +(hikes.reduce((s, h) => s + (h.distance_meters ?? 0) / 1000, 0).toFixed(1))
  const avgKmPerHike = +(totalKm / totalHikes).toFixed(1)
  const avgDurationMins = Math.round(hikes.reduce((s, h) => s + (h.duration_minutes ?? 0), 0) / totalHikes)
  const avgPerWeek = +(totalHikes / (365 / 7)).toFixed(1)
  const totalElevation = Math.round(hikes.reduce((s, h) => s + (h.elevation_gain_meters ?? 0), 0))
  const longestHikeKm = +(Math.max(...hikes.map((h) => (h.distance_meters ?? 0) / 1000), 0)).toFixed(1)
  const highestClimbM = Math.max(...hikes.map((h) => h.elevation_gain_meters ?? 0), 0)

  const morningTotal = hourHikes.slice(5, 12).reduce((a, b) => a + b, 0)
  const afternoonTotal = hourHikes.slice(12, 18).reduce((a, b) => a + b, 0)
  const eveningTotal = hourHikes.slice(18, 23).reduce((a, b) => a + b, 0)
  const preferredTime =
    morningTotal >= afternoonTotal && morningTotal >= eveningTotal ? 'morning'
    : afternoonTotal >= eveningTotal ? 'afternoon'
    : 'evening'

  const busiestDay = DOW_LABELS[dowHikes.indexOf(Math.max(...dowHikes))]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/hiking" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Mountain className="w-5 h-5 text-lime-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Hiking Patterns</h1>
              <p className="text-sm text-text-secondary">{totalHikes} hikes · {totalKm} km · past year</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HikingPatternsClient
          stats={{
            totalHikes,
            totalKm,
            avgKmPerHike,
            avgDurationMins,
            avgPerWeek,
            totalElevation,
            longestHikeKm,
            highestClimbM,
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
