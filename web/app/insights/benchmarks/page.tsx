import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { BenchmarksClient } from './benchmarks-client'

export const metadata = { title: 'Health Benchmarks' }

// Evidence-based population benchmarks by age group
// Sources: CDC, AHA, WHO, ACSM guidelines
const STEP_BENCHMARKS: Record<string, { p25: number; p50: number; p75: number }> = {
  '18-29': { p25: 6000, p50: 8500, p75: 11500 },
  '30-39': { p25: 5500, p50: 7800, p75: 10800 },
  '40-49': { p25: 5000, p50: 7200, p75: 10000 },
  '50-59': { p25: 4500, p50: 6800, p75: 9500 },
  '60-69': { p25: 4000, p50: 6200, p75: 8800 },
  '70+':   { p25: 3500, p50: 5500, p75: 8000 },
}

const SLEEP_BENCHMARKS: Record<string, { p25: number; p50: number; p75: number }> = {
  '18-29': { p25: 6.0, p50: 7.2, p75: 8.2 },
  '30-39': { p25: 5.8, p50: 6.9, p75: 8.0 },
  '40-49': { p25: 5.6, p50: 6.7, p75: 7.8 },
  '50-59': { p25: 5.5, p50: 6.5, p75: 7.6 },
  '60-69': { p25: 5.5, p50: 6.6, p75: 7.6 },
  '70+':   { p25: 5.4, p50: 6.5, p75: 7.5 },
}

const RHR_BENCHMARKS: Record<string, Record<string, { p25: number; p50: number; p75: number }>> = {
  male: {
    '18-29': { p25: 55, p50: 62, p75: 72 },
    '30-39': { p25: 56, p50: 63, p75: 73 },
    '40-49': { p25: 57, p50: 64, p75: 74 },
    '50-59': { p25: 58, p50: 65, p75: 75 },
    '60+':   { p25: 59, p50: 66, p75: 76 },
  },
  female: {
    '18-29': { p25: 58, p50: 65, p75: 75 },
    '30-39': { p25: 59, p50: 66, p75: 76 },
    '40-49': { p25: 60, p50: 67, p75: 77 },
    '50-59': { p25: 61, p50: 68, p75: 78 },
    '60+':   { p25: 62, p50: 69, p75: 79 },
  },
}

function getAgeBand(age: number, options: string[]): string {
  for (const band of options) {
    if (band.endsWith('+')) {
      const min = parseInt(band)
      if (age >= min) return band
    } else {
      const [min, max] = band.split('-').map(Number)
      if (age >= min && age <= max) return band
    }
  }
  return options[options.length - 1]
}

function percentile(value: number, p25: number, p50: number, p75: number, higherIsBetter = true): number {
  if (higherIsBetter) {
    if (value >= p75) return Math.min(99, Math.round(75 + ((value - p75) / (p75 - p50)) * 24))
    if (value >= p50) return Math.round(50 + ((value - p50) / (p75 - p50)) * 25)
    if (value >= p25) return Math.round(25 + ((value - p25) / (p50 - p25)) * 25)
    return Math.max(1, Math.round((value / p25) * 25))
  } else {
    // Lower is better (e.g. resting HR)
    if (value <= p25) return Math.min(99, Math.round(75 + ((p25 - value) / (p50 - p25)) * 24))
    if (value <= p50) return Math.round(50 + ((p50 - value) / (p50 - p25)) * 25)
    if (value <= p75) return Math.round(25 + ((p75 - value) / (p75 - p50)) * 25)
    return Math.max(1, Math.round(25 - ((value - p75) / p75) * 24))
  }
}

export default async function BenchmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: profile },
    { data: summaries },
    { data: sleepRecords },
    { data: hrRecords },
  ] = await Promise.all([
    supabase.from('users').select('age, biological_sex, height_cm, weight_kg').eq('id', user.id).single(),
    supabase
      .from('daily_summaries')
      .select('steps, active_calories, resting_heart_rate, date')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: false }),
    supabase
      .from('sleep_records')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', thirtyDaysAgo.toISOString())
      .not('duration_minutes', 'is', null),
    supabase
      .from('health_records')
      .select('value')
      .eq('user_id', user.id)
      .eq('type', 'resting_heart_rate')
      .gte('start_time', thirtyDaysAgo.toISOString()),
  ])

  const age = profile?.age ?? 35
  const sex = (profile?.biological_sex ?? 'male').toLowerCase() as 'male' | 'female'

  // Calculate 30-day averages
  const avgSteps = summaries?.length
    ? Math.round(summaries.reduce((s, r) => s + (r.steps ?? 0), 0) / summaries.length)
    : null

  const avgSleepHours = sleepRecords?.length
    ? Math.round((sleepRecords.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / sleepRecords.length) / 6) / 10
    : null

  const rhrValues = [
    ...(summaries?.map((s) => s.resting_heart_rate).filter(Boolean) ?? []),
    ...(hrRecords?.map((r) => r.value).filter(Boolean) ?? []),
  ] as number[]
  const avgRHR = rhrValues.length
    ? Math.round(rhrValues.reduce((s, v) => s + v, 0) / rhrValues.length)
    : null

  // Compute percentiles
  const stepBand = getAgeBand(age, Object.keys(STEP_BENCHMARKS))
  const sleepBand = getAgeBand(age, Object.keys(SLEEP_BENCHMARKS))
  const rhrBand = getAgeBand(age, Object.keys(RHR_BENCHMARKS.male))
  const rhrNorms = (sex === 'female' ? RHR_BENCHMARKS.female : RHR_BENCHMARKS.male)[rhrBand]

  const metrics = [
    {
      key: 'steps',
      label: 'Daily Steps',
      value: avgSteps,
      unit: 'steps/day',
      norms: STEP_BENCHMARKS[stepBand],
      higherIsBetter: true,
      icon: '👟',
      insight: avgSteps
        ? avgSteps >= STEP_BENCHMARKS[stepBand].p75
          ? 'Outstanding! You\'re in the top 25% for your age group.'
          : avgSteps >= STEP_BENCHMARKS[stepBand].p50
          ? 'Above average. Aim for 10,000 steps to reach the top quartile.'
          : 'Below average for your age. Try adding a 20-min walk daily.'
        : null,
    },
    {
      key: 'sleep',
      label: 'Sleep Duration',
      value: avgSleepHours,
      unit: 'hours/night',
      norms: SLEEP_BENCHMARKS[sleepBand],
      higherIsBetter: true,
      icon: '🌙',
      insight: avgSleepHours
        ? avgSleepHours >= 7 && avgSleepHours <= 9
          ? 'Within the recommended 7–9 hour range. Great job!'
          : avgSleepHours < 7
          ? 'Below recommended. Try a consistent bedtime routine.'
          : 'Slightly above average. Monitor sleep quality alongside duration.'
        : null,
    },
    {
      key: 'rhr',
      label: 'Resting Heart Rate',
      value: avgRHR,
      unit: 'bpm',
      norms: rhrNorms,
      higherIsBetter: false,
      icon: '❤️',
      insight: avgRHR
        ? avgRHR < 60
          ? 'Excellent cardiovascular fitness — athlete range!'
          : avgRHR < rhrNorms.p50
          ? 'Better than average. Keep up regular cardio exercise.'
          : avgRHR < rhrNorms.p75
          ? 'Average for your age group. Cardio exercise can lower RHR over time.'
          : 'Above average. Consider adding 150 min/week of moderate cardio.'
        : null,
    },
  ]

  const benchmarkData = metrics.map((m) => ({
    ...m,
    percentile: m.value !== null
      ? percentile(m.value, m.norms.p25, m.norms.p50, m.norms.p75, m.higherIsBetter)
      : null,
  }))

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/insights" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Health Benchmarks</h1>
            <p className="text-sm text-text-secondary">How you compare to your age group · 30-day avg</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <BenchmarksClient metrics={benchmarkData} age={age} sex={sex} />
      </main>

      <BottomNav />
    </div>
  )
}
