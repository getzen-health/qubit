import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SleepBreathingClient, type SleepBreathingData } from './breathing-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Sleep Breathing' }

export default async function SleepBreathingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const startIso = ninetyDaysAgo.toISOString()

  // Fetch overnight respiratory rate + SpO2 simultaneously with sleep records
  const [{ data: respRecords }, { data: spo2Records }, { data: sleepRecs }] = await Promise.all([
    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'respiratory_rate')
      .gte('start_time', startIso)
      .gt('value', 4)
      .lt('value', 40)
      .order('start_time', { ascending: true }),

    supabase
      .from('health_records')
      .select('value, start_time')
      .eq('user_id', user.id)
      .eq('type', 'oxygen_saturation')
      .gte('start_time', startIso)
      .gt('value', 70)
      .lt('value', 101)
      .order('start_time', { ascending: true }),

    supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', startIso)
      .gt('duration_minutes', 60)
      .order('start_time', { ascending: true }),
  ])

  // Build a set of sleep windows (start → end) keyed by night date
  // "Night date" = the date of sleep start (if before midnight) or date - 1 day (if starts after midnight)
  const sleepWindows: { start: number; end: number }[] = (sleepRecs ?? []).map((s) => ({
    start: new Date(s.start_time).getTime(),
    end: new Date(s.end_time).getTime(),
  }))

  function isOvernightSample(isoTime: string): boolean {
    const t = new Date(isoTime).getTime()
    // Check if this timestamp falls within any sleep window
    if (sleepWindows.some((w) => t >= w.start && t <= w.end)) return true
    // Fallback: hour between 9pm and 9am
    const h = new Date(isoTime).getHours()
    return h >= 21 || h <= 9
  }

  // Filter to overnight samples
  const overnightResp = (respRecords ?? []).filter((r) => isOvernightSample(r.start_time))
  const overnightSpo2 = (spo2Records ?? []).filter((r) => isOvernightSample(r.start_time))

  // Group by calendar day (YYYY-MM-DD) — use end_time of sleep window for the "morning" date
  function nightDate(isoTime: string): string {
    const d = new Date(isoTime)
    // If hour < 12, it's still "last night" — attribute to yesterday
    if (d.getHours() < 12) {
      const prev = new Date(d)
      prev.setDate(d.getDate() - 1)
      return prev.toISOString().slice(0, 10)
    }
    return d.toISOString().slice(0, 10)
  }

  // Per-night respiratory rate: avg, min, max
  const respByNight: Record<string, number[]> = {}
  for (const r of overnightResp) {
    const day = nightDate(r.start_time)
    if (!respByNight[day]) respByNight[day] = []
    respByNight[day].push(r.value)
  }

  // Per-night SpO2: avg + min
  const spo2ByNight: Record<string, number[]> = {}
  for (const r of overnightSpo2) {
    const day = nightDate(r.start_time)
    if (!spo2ByNight[day]) spo2ByNight[day] = []
    spo2ByNight[day].push(r.value)
  }

  // Combine into per-night rows
  const allNights = Array.from(
    new Set([...Object.keys(respByNight), ...Object.keys(spo2ByNight)])
  ).sort()

  const nights = allNights.map((date) => {
    const rVals = respByNight[date] ?? []
    const sVals = spo2ByNight[date] ?? []

    const respAvg = rVals.length > 0 ? rVals.reduce((s, v) => s + v, 0) / rVals.length : null
    const respMin = rVals.length > 0 ? Math.min(...rVals) : null
    const respMax = rVals.length > 0 ? Math.max(...rVals) : null

    const spo2Avg = sVals.length > 0 ? sVals.reduce((s, v) => s + v, 0) / sVals.length : null
    const spo2Min = sVals.length > 0 ? Math.min(...sVals) : null

    // Low SpO2 events: any reading < 94%
    const lowSpo2Events = sVals.filter((v) => v < 94).length

    // Respiratory category
    let respCategory: 'low' | 'normal' | 'elevated' | 'high' | null = null
    if (respAvg !== null) {
      if (respAvg < 12) respCategory = 'low'
      else if (respAvg <= 18) respCategory = 'normal'
      else if (respAvg <= 22) respCategory = 'elevated'
      else respCategory = 'high'
    }

    return {
      date,
      respAvg: respAvg !== null ? +respAvg.toFixed(1) : null,
      respMin: respMin !== null ? +respMin.toFixed(1) : null,
      respMax: respMax !== null ? +respMax.toFixed(1) : null,
      respSamples: rVals.length,
      spo2Avg: spo2Avg !== null ? +spo2Avg.toFixed(1) : null,
      spo2Min: spo2Min !== null ? +spo2Min.toFixed(1) : null,
      spo2Samples: sVals.length,
      lowSpo2Events,
      respCategory,
    }
  })

  const validNights = nights.filter((n) => n.respAvg !== null || n.spo2Avg !== null)

  // Overall stats
  const respNights = validNights.filter((n) => n.respAvg !== null)
  const spo2Nights = validNights.filter((n) => n.spo2Avg !== null)

  const avgResp = respNights.length > 0
    ? respNights.reduce((s, n) => s + (n.respAvg ?? 0), 0) / respNights.length
    : null

  const avgSpo2 = spo2Nights.length > 0
    ? spo2Nights.reduce((s, n) => s + (n.spo2Avg ?? 0), 0) / spo2Nights.length
    : null

  const minSpo2Overall = spo2Nights.length > 0
    ? Math.min(...spo2Nights.map((n) => n.spo2Min ?? 100))
    : null

  const nightsWithLowSpo2 = validNights.filter((n) => n.lowSpo2Events > 0).length
  const normalRespNights = respNights.filter((n) => n.respCategory === 'normal').length

  // SpO2 distribution (buckets: <90, 90-92, 92-94, 94-96, 96-98, 98-100)
  const allSpo2Vals = overnightSpo2.map((r) => r.value)
  const spoBuckets = [
    { label: '<90%', min: 0, max: 90, color: 'rgba(239,68,68,0.8)' },
    { label: '90-92', min: 90, max: 92, color: 'rgba(249,115,22,0.8)' },
    { label: '92-94', min: 92, max: 94, color: 'rgba(234,179,8,0.7)' },
    { label: '94-96', min: 94, max: 96, color: 'rgba(163,230,53,0.7)' },
    { label: '96-98', min: 96, max: 98, color: 'rgba(34,197,94,0.7)' },
    { label: '98-100', min: 98, max: 101, color: 'rgba(34,211,238,0.7)' },
  ].map((b) => ({
    ...b,
    count: allSpo2Vals.filter((v) => v >= b.min && v < b.max).length,
    pct: allSpo2Vals.length > 0
      ? Math.round(allSpo2Vals.filter((v) => v >= b.min && v < b.max).length / allSpo2Vals.length * 100)
      : 0,
  }))

  const profileData: SleepBreathingData = {
    nights: validNights.slice(-60), // last 60 nights
    avgResp: avgResp !== null ? +avgResp.toFixed(1) : null,
    avgSpo2: avgSpo2 !== null ? +avgSpo2.toFixed(1) : null,
    minSpo2Overall: minSpo2Overall !== null ? +minSpo2Overall.toFixed(1) : null,
    nightsWithLowSpo2,
    normalRespNights,
    totalNights: validNights.length,
    spoBuckets,
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
            <h1 className="text-xl font-bold text-text-primary">Sleep Breathing</h1>
            <p className="text-sm text-text-secondary">
              {validNights.length > 0
                ? `Respiratory rate & SpO₂ · ${validNights.length} nights`
                : 'Overnight breathing patterns'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {validNights.length < 3 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🌬️</p>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No Sleep Breathing Data</h2>
            <p className="text-sm text-text-secondary max-w-xs">
              Apple Watch automatically measures respiratory rate and blood oxygen during sleep.
              Wear your watch overnight to see data here.
            </p>
          </div>
        ) : (
          <SleepBreathingClient data={profileData} />
        )}
      </main>
      <BottomNav />
    </div>
  )
}
