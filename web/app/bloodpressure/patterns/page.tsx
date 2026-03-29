import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const BPPatternsClient = dynamic(() => import('./bp-patterns-client').then(m => ({ default: m.BPPatternsClient })))
import type { BPPatternData } from './bp-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Blood Pressure Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function classifyBP(sys: number, dia: number): string {
  if (sys < 120 && dia < 80) return 'Normal'
  if (sys < 130 && dia < 80) return 'Elevated'
  if (sys < 140 || dia < 90) return 'Stage 1'
  return 'Stage 2'
}

export default async function BPPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const startIso = oneYearAgo.toISOString()

  const { data: records } = await supabase
    .from('health_records')
    .select('type, value, start_time')
    .eq('user_id', user.id)
    .in('type', ['blood_pressure_systolic', 'blood_pressure_diastolic'])
    .gte('start_time', startIso)
    .gt('value', 0)
    .order('start_time', { ascending: true })

  const systolicRaw = (records ?? []).filter((r) => r.type === 'blood_pressure_systolic' && r.value > 60 && r.value < 250)
  const diastolicRaw = (records ?? []).filter((r) => r.type === 'blood_pressure_diastolic' && r.value > 30 && r.value < 150)

  const readings = systolicRaw.flatMap((s) => {
    const match = diastolicRaw.find(
      (d) => Math.abs(new Date(s.start_time).getTime() - new Date(d.start_time).getTime()) < 90000
    )
    if (!match) return []
    const dt = new Date(s.start_time)
    return [{
      timestamp: s.start_time,
      date: s.start_time.slice(0, 10),
      systolic: Math.round(s.value),
      diastolic: Math.round(match.value),
      pulse: Math.round(s.value) - Math.round(match.value),
      hour: dt.getHours(),
      dow: dt.getDay(),
    }]
  })

  if (readings.length < 5) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/bloodpressure" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Back">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <h1 className="text-xl font-bold text-text-primary">Blood Pressure Patterns</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🩺</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Not Enough Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">Log at least 5 readings to see patterns.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const n = readings.length
  const avgSys = Math.round(readings.reduce((s, r) => s + r.systolic, 0) / n)
  const avgDia = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / n)
  const avgPulse = Math.round(readings.reduce((s, r) => s + r.pulse, 0) / n)
  const latestCategory = classifyBP(readings[n - 1].systolic, readings[n - 1].diastolic)

  // DOW patterns
  const dowBuckets: typeof readings[] = Array.from({ length: 7 }, () => [])
  for (const r of readings) dowBuckets[r.dow].push(r)
  const dowData = dowBuckets.map((bucket, i) => ({
    label: DOW_LABELS[i],
    count: bucket.length,
    avgSys: bucket.length > 0 ? Math.round(bucket.reduce((s, r) => s + r.systolic, 0) / bucket.length) : null,
    avgDia: bucket.length > 0 ? Math.round(bucket.reduce((s, r) => s + r.diastolic, 0) / bucket.length) : null,
  }))

  // Time-of-day periods
  const morningReadings = readings.filter((r) => r.hour >= 6 && r.hour < 12)
  const afternoonReadings = readings.filter((r) => r.hour >= 12 && r.hour < 18)
  const eveningReadings = readings.filter((r) => r.hour >= 18 && r.hour < 23)
  const nightReadings = readings.filter((r) => r.hour < 6 || r.hour >= 23)

  function periodStat(label: string, icon: string, rds: typeof readings) {
    if (rds.length === 0) return null
    return {
      label,
      icon,
      count: rds.length,
      avgSys: Math.round(rds.reduce((s, r) => s + r.systolic, 0) / rds.length),
      avgDia: Math.round(rds.reduce((s, r) => s + r.diastolic, 0) / rds.length),
    }
  }
  const timePeriods = [
    periodStat('Morning', '🌅', morningReadings),
    periodStat('Afternoon', '☀️', afternoonReadings),
    periodStat('Evening', '🌆', eveningReadings),
    periodStat('Night', '🌙', nightReadings),
  ].filter(Boolean) as NonNullable<ReturnType<typeof periodStat>>[]

  // Monthly averages
  const monthBuckets: Record<string, typeof readings> = {}
  for (const r of readings) {
    const key = r.date.slice(0, 7)
    if (!monthBuckets[key]) monthBuckets[key] = []
    monthBuckets[key].push(r)
  }
  const monthData = Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, bucket]) => {
      const [, month] = key.split('-')
      return {
        label: MONTH_LABELS[parseInt(month, 10) - 1],
        count: bucket.length,
        avgSys: Math.round(bucket.reduce((s, r) => s + r.systolic, 0) / bucket.length),
        avgDia: Math.round(bucket.reduce((s, r) => s + r.diastolic, 0) / bucket.length),
      }
    })

  // BP category breakdown
  const categories = ['Normal', 'Elevated', 'Stage 1', 'Stage 2']
  const categoryDist = categories.map((cat) => {
    const count = readings.filter((r) => classifyBP(r.systolic, r.diastolic) === cat).length
    return { label: cat, count, pct: Math.round(count / n * 100) }
  })

  // Pulse pressure trend
  const avgPulsePressure = avgPulse

  const profileData: BPPatternData = {
    totalReadings: n,
    avgSys,
    avgDia,
    avgPulsePressure,
    latestCategory,
    dowData,
    timePeriods,
    monthData,
    categoryDist,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/bloodpressure"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to blood pressure"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Blood Pressure Patterns</h1>
            <p className="text-sm text-text-secondary">{n} readings · avg {avgSys}/{avgDia} mmHg</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <BPPatternsClient data={profileData} />
      </main>
      <BottomNav />
    </div>
  )
}
