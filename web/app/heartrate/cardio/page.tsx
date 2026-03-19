import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, HeartPulse } from 'lucide-react'
import { CardioHealthClient } from './cardio-health-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Cardio Health' }

export interface CardioData {
  // HRV
  hrv7Day: number | null
  hrv28Day: number | null
  hrvDevPct: number | null
  hrv14Days: { date: string; hrv: number }[]

  // Resting HR
  rhr7Day: number | null
  rhrTrend: number | null  // bpm/day

  // VO2 Max
  vo2Max: number | null
  vo2MaxTrend: number | null  // change over 60 days

  // HR Recovery (average from recent workouts)
  hrr1Avg: number | null
}

export default async function CardioHealthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const ninetyStr = ninetyDaysAgo.toISOString().slice(0, 10)

  const [
    { data: summaries },
    { data: vo2Records },
    { data: workouts },
    { data: hrSamples },
  ] = await Promise.all([
    // Daily summaries for HRV and RHR
    supabase
      .from('daily_summaries')
      .select('date, avg_hrv, resting_heart_rate')
      .eq('user_id', user.id)
      .gte('date', ninetyStr)
      .order('date', { ascending: true }),

    // VO2 Max records
    supabase
      .from('health_records')
      .select('start_time, value')
      .eq('user_id', user.id)
      .eq('type', 'vo2_max')
      .gte('start_time', new Date(Date.now() - 90 * 86400000).toISOString())
      .order('start_time', { ascending: true }),

    // Workouts for HR Recovery
    supabase
      .from('workout_records')
      .select('id, start_time, end_time, workout_type, max_heart_rate, avg_heart_rate')
      .eq('user_id', user.id)
      .gte('start_time', new Date(Date.now() - 30 * 86400000).toISOString())
      .gt('max_heart_rate', 120)
      .order('start_time', { ascending: false })
      .limit(20),

    // HR samples for recovery calculation
    supabase
      .from('heart_rate_samples')
      .select('start_time, value')
      .eq('user_id', user.id)
      .gte('start_time', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('start_time', { ascending: true }),
  ])

  const sorted = summaries ?? []

  // ── HRV: last 7-day avg vs 28-day baseline ──────────────────────────────
  const withHRV = sorted.filter((s) => s.avg_hrv && s.avg_hrv > 0)
  const hrv7  = withHRV.slice(-7).map((s) => s.avg_hrv!)
  const hrv28 = withHRV.slice(0, -7).map((s) => s.avg_hrv!)
  const hrv7Avg  = hrv7.length  > 0 ? hrv7.reduce((a, b) => a + b, 0)  / hrv7.length  : null
  const hrv28Avg = hrv28.length > 0 ? hrv28.reduce((a, b) => a + b, 0) / hrv28.length : null
  const hrvDev   = hrv7Avg && hrv28Avg && hrv28Avg > 0
    ? ((hrv7Avg - hrv28Avg) / hrv28Avg) * 100 : null
  const hrv14Days = withHRV.slice(-14).map((s) => ({ date: s.date, hrv: Math.round(s.avg_hrv!) }))

  // ── RHR: last 7-day avg + linear trend ─────────────────────────────────
  const withRHR = sorted.filter((s) => (s as any).resting_heart_rate && (s as any).resting_heart_rate > 0)
  const rhr7Vals = withRHR.slice(-7).map((s) => (s as any).resting_heart_rate as number)
  const rhr7Avg  = rhr7Vals.length > 0 ? rhr7Vals.reduce((a, b) => a + b, 0) / rhr7Vals.length : null

  // Linear regression slope for RHR trend (last 28 days)
  const rhrLast28 = withRHR.slice(-28)
  let rhrSlope: number | null = null
  if (rhrLast28.length >= 5) {
    const n = rhrLast28.length
    const xs = rhrLast28.map((_, i) => i)
    const ys = rhrLast28.map((s) => (s as any).resting_heart_rate as number)
    const mx = xs.reduce((a, b) => a + b, 0) / n
    const my = ys.reduce((a, b) => a + b, 0) / n
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
    const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    rhrSlope = den > 0 ? num / den : null
  }

  // ── VO2 Max ─────────────────────────────────────────────────────────────
  const vo2 = vo2Records ?? []
  const latestVo2 = vo2.length > 0 ? vo2[vo2.length - 1].value : null
  let vo2Trend: number | null = null
  if (vo2.length >= 2) {
    const first = vo2[0].value
    const last  = vo2[vo2.length - 1].value
    vo2Trend = last - first
  }

  // ── HR Recovery ─────────────────────────────────────────────────────────
  // Index HR by minute bucket
  const hrByMinute = new Map<string, number[]>()
  for (const s of hrSamples ?? []) {
    const key = s.start_time.slice(0, 16)  // "yyyy-MM-ddTHH:mm"
    const arr = hrByMinute.get(key) ?? []
    arr.push(s.value)
    hrByMinute.set(key, arr)
  }

  function avgAtMinute(key: string): number | null {
    const vals = hrByMinute.get(key)
    return vals && vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  function addMinutes(iso: string, mins: number): string {
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() + mins)
    return d.toISOString().slice(0, 16)
  }

  const recoveries: number[] = []
  for (const w of (workouts ?? []).slice(0, 10)) {
    if (!w.end_time || !w.max_heart_rate) continue
    const endMin = w.end_time.slice(0, 16)

    // Peak HR: max of avg HR in last 5 min before end
    let peak = w.max_heart_rate
    for (let offset = -5; offset <= 0; offset++) {
      const key = addMinutes(endMin, offset)
      const v = avgAtMinute(key)
      if (v && v > peak) peak = v
    }

    // HR at 1 min post-workout
    const postKey = addMinutes(endMin, 1)
    const post1 = avgAtMinute(postKey)
    if (post1 !== null && peak > 0) {
      const hrr1 = peak - post1
      if (hrr1 > 0 && hrr1 < 80) recoveries.push(hrr1)
    }
  }

  const hrr1Avg = recoveries.length > 0
    ? Math.round(recoveries.reduce((a, b) => a + b, 0) / recoveries.length)
    : null

  const cardioData: CardioData = {
    hrv7Day: hrv7Avg !== null ? Math.round(hrv7Avg) : null,
    hrv28Day: hrv28Avg !== null ? Math.round(hrv28Avg) : null,
    hrvDevPct: hrvDev !== null ? Math.round(hrvDev * 10) / 10 : null,
    hrv14Days,
    rhr7Day: rhr7Avg !== null ? Math.round(rhr7Avg) : null,
    rhrTrend: rhrSlope !== null ? Math.round(rhrSlope * 100) / 100 : null,
    vo2Max: latestVo2 !== null ? Math.round(latestVo2 * 10) / 10 : null,
    vo2MaxTrend: vo2Trend !== null ? Math.round(vo2Trend * 10) / 10 : null,
    hrr1Avg,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Cardio Health</h1>
              <p className="text-sm text-text-secondary">HRV · RHR · VO₂ Max · HR Recovery</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <CardioHealthClient data={cardioData} />
      </main>
      <BottomNav />
    </div>
  )
}
