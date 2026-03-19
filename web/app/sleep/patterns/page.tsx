import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SleepPatternsClient, type SleepPatternData } from './sleep-patterns-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Patterns' }

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function SleepPatternsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 6 months of sleep records with stage breakdown
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const since = sixMonthsAgo.toISOString().slice(0, 10)

  const [{ data: summaries }, { data: sleepRecords }, { data: profile }] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('date, sleep_duration_minutes')
      .eq('user_id', user.id)
      .gte('date', since)
      .gt('sleep_duration_minutes', 60)
      .order('date', { ascending: true }),
    supabase
      .from('sleep_records')
      .select('date, start_time, end_time, duration_minutes, deep_minutes, rem_minutes')
      .eq('user_id', user.id)
      .gte('date', since)
      .gt('duration_minutes', 60)
      .order('date', { ascending: true }),
    supabase
      .from('users')
      .select('sleep_goal_minutes')
      .eq('user_id', user.id)
      .single(),
  ])

  const rows = summaries ?? []
  const srRows = sleepRecords ?? []
  const sleepGoalMinutes = profile?.sleep_goal_minutes ?? 480

  // ── Day-of-week averages (from daily_summaries) ────────────────────────────
  const dowBuckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }))
  for (const r of rows) {
    const dow = new Date(r.date + 'T12:00:00').getDay()
    dowBuckets[dow].sum += (r.sleep_duration_minutes ?? 0)
    dowBuckets[dow].count++
  }
  const dowData = dowBuckets.map((b, i) => ({
    label: DOW_LABELS[i],
    avgMins: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    count: b.count,
    isWeekend: i === 0 || i === 6,
  }))

  // ── Monthly averages ────────────────────────────────────────────────────────
  const monthBuckets: { sum: number; count: number }[] = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }))
  for (const r of rows) {
    const month = new Date(r.date + 'T12:00:00').getMonth()
    monthBuckets[month].sum += (r.sleep_duration_minutes ?? 0)
    monthBuckets[month].count++
  }
  const monthData = monthBuckets.map((b, i) => ({
    label: MONTH_LABELS[i],
    avgMins: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    count: b.count,
  }))

  // ── Sleep duration histogram ─────────────────────────────────────────────────
  const BUCKETS = [
    { label: '<5h',   min: 0,   max: 300  },
    { label: '5–6h',  min: 300, max: 360  },
    { label: '6–7h',  min: 360, max: 420  },
    { label: '7–8h',  min: 420, max: 480  },
    { label: '8–9h',  min: 480, max: 540  },
    { label: '9–10h', min: 540, max: 600  },
    { label: '>10h',  min: 600, max: Infinity },
  ]
  const histogram = BUCKETS.map(b => ({
    label: b.label,
    count: rows.filter(r => (r.sleep_duration_minutes ?? 0) >= b.min && (r.sleep_duration_minutes ?? 0) < b.max).length,
    isOptimal: b.min >= 420 && b.max <= 540,  // 7-9h is optimal
  }))

  // ── Consistency metrics ──────────────────────────────────────────────────────
  const sleepValues = rows.map(r => r.sleep_duration_minutes ?? 0).filter(v => v > 60)
  const totalDays  = sleepValues.length
  const mean       = totalDays > 0 ? sleepValues.reduce((a, b) => a + b, 0) / totalDays : 0
  const variance   = totalDays > 1
    ? sleepValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / totalDays
    : 0
  const stddev     = Math.sqrt(variance)
  const cv         = mean > 0 ? stddev / mean : 0

  // ── Goal hit rate ────────────────────────────────────────────────────────────
  const goalHitDays = rows.filter(r => (r.sleep_duration_minutes ?? 0) >= sleepGoalMinutes).length
  const goalHitRate = totalDays > 0 ? Math.round((goalHitDays / totalDays) * 100) : 0

  // ── Best/worst day-of-week ───────────────────────────────────────────────────
  const validDow = dowData.filter(d => d.count >= 3)
  const bestDow  = validDow.length > 0 ? validDow.reduce((a, b) => a.avgMins > b.avgMins ? a : b) : null
  const worstDow = validDow.length > 0 ? validDow.reduce((a, b) => a.avgMins < b.avgMins ? a : b) : null

  // ── Weeknight vs weekend sleep ─────────────────────────────────────────────
  const weeknightAvg = Math.round(avg(dowData.filter(d => !d.isWeekend).map(d => d.avgMins).filter(v => v > 0)))
  const weekendAvg   = Math.round(avg(dowData.filter(d => d.isWeekend).map(d => d.avgMins).filter(v => v > 0)))

  // ── Bedtime analysis from sleep_records ───────────────────────────────────
  const bedtimeMins: number[] = []
  for (const r of srRows) {
    if (!r.start_time) continue
    const d = new Date(r.start_time)
    const h = d.getHours()
    const m = d.getMinutes()
    // Convert to "minutes since 6pm" for proper overnight comparison
    let mins = h * 60 + m
    if (mins < 360) mins += 24 * 60  // 12am–6am maps to next day
    bedtimeMins.push(mins)
  }
  const avgBedtimeMins = bedtimeMins.length > 0
    ? Math.round(bedtimeMins.reduce((a, b) => a + b, 0) / bedtimeMins.length)
    : null
  const bedtimeH = avgBedtimeMins !== null ? Math.floor(avgBedtimeMins / 60) % 24 : null
  const bedtimeM = avgBedtimeMins !== null ? avgBedtimeMins % 60 : null
  const avgBedtimeStr = bedtimeH !== null && bedtimeM !== null
    ? `${bedtimeH % 12 === 0 ? 12 : bedtimeH % 12}:${String(bedtimeM).padStart(2, '0')} ${bedtimeH < 12 ? 'am' : 'pm'}`
    : null

  // ── Deep + REM averages ───────────────────────────────────────────────────
  const deepVals = srRows.map(r => r.deep_minutes).filter((v): v is number => v !== null && v > 0)
  const remVals  = srRows.map(r => r.rem_minutes).filter((v): v is number => v !== null && v > 0)
  const avgDeep  = deepVals.length > 0 ? Math.round(avg(deepVals)) : null
  const avgRem   = remVals.length > 0 ? Math.round(avg(remVals)) : null

  const patternData: SleepPatternData = {
    dowData,
    monthData,
    histogram,
    totalDays,
    meanMins: Math.round(mean),
    stddevMins: Math.round(stddev),
    cv: +cv.toFixed(2),
    goalHitRate,
    goalHitDays,
    sleepGoalMinutes,
    bestDow,
    worstDow,
    weeknightAvg,
    weekendAvg,
    avgBedtimeStr,
    avgDeepMins: avgDeep,
    avgRemMins: avgRem,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/sleep"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to sleep"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Sleep Patterns</h1>
            <p className="text-sm text-text-secondary">
              {totalDays > 0 ? `${totalDays} nights · last 6 months` : 'Day-of-week & seasonal analysis'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SleepPatternsClient data={patternData} />
      </main>
      <BottomNav />
    </div>
  )
}

function avg(vals: number[]): number {
  if (vals.length === 0) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
