import Link from 'next/link'
import { ArrowLeft, Moon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import { RegularityClient, type WeeklySRIPoint, type HeatmapWeek } from './regularity-client'

export const metadata = { title: 'Sleep Regularity Index' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns [startMinutes, endMinutes] where endMinutes may exceed 1440 for cross-midnight sleep. */
function sleepWindowMinutes(start: Date, end: Date): [number, number] {
  const s = start.getHours() * 60 + start.getMinutes()
  const e = end.getHours() * 60 + end.getMinutes()
  return e <= s ? [s, e + 1440] : [s, e]
}

/** Minutes of clock-time overlap between two sleep windows. */
function overlapMinutes(s1: Date, e1: Date, s2: Date, e2: Date): number {
  const [a, b] = sleepWindowMinutes(s1, e1)
  const [c, d] = sleepWindowMinutes(s2, e2)
  return Math.max(0, Math.min(b, d) - Math.max(a, c))
}

function getWeekSunday(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Map bedtime hours < 12 (post-midnight) to > 24 for linear comparison. */
function normalizeBedtime(hour: number): number {
  return hour < 12 ? hour + 24 : hour
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SleepRegularityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const eightFourDaysAgo = new Date()
  eightFourDaysAgo.setDate(eightFourDaysAgo.getDate() - 84)

  const { data: rawRecords } = await supabase
    .from('sleep_records')
    .select('start_time, end_time, duration_minutes, sleep_efficiency')
    .eq('user_id', user.id)
    .gte('start_time', eightFourDaysAgo.toISOString())
    .gt('duration_minutes', 60)
    .order('start_time', { ascending: true })

  const records = rawRecords ?? []

  const header = (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <Link
          href="/explore"
          className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
          aria-label="Back to explore"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Sleep Regularity Index</h1>
          <p className="text-sm text-text-secondary">12-Week Circadian Consistency</p>
        </div>
        <Moon className="w-5 h-5 text-text-secondary" />
      </div>
    </header>
  )

  // Not enough data — show empty state
  if (records.length < 7) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {header}
        <main className="flex-1 flex items-center justify-center p-8 pb-24 text-center">
          <div className="space-y-3">
            <Moon className="w-12 h-12 text-text-secondary mx-auto" />
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
              Not enough sleep data yet — sync at least 7 nights to see regularity trends.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── Build day-keyed map (latest record per calendar date) ─────────────────
  const byDate = new Map<string, { start: Date; end: Date; duration: number }>()
  for (const r of records) {
    const key = r.start_time.slice(0, 10)
    byDate.set(key, {
      start: new Date(r.start_time),
      end: new Date(r.end_time),
      duration: r.duration_minutes,
    })
  }

  // ── Compute night-to-night match rate for each date ───────────────────────
  const sortedDates = Array.from(byDate.keys()).sort()
  const dayMatchRate = new Map<string, number>()

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = byDate.get(sortedDates[i - 1])!
    const curr = byDate.get(sortedDates[i])!
    // Only pair consecutive nights (≤ 2 calendar days apart)
    const dayGap =
      (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) /
      86_400_000
    if (dayGap > 2) continue
    const overlap = overlapMinutes(prev.start, prev.end, curr.start, curr.end)
    dayMatchRate.set(sortedDates[i], Math.round((overlap / 1440) * 100))
  }

  // ── Build 12-week grid (Sunday → Saturday, oldest first) ─────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentWeekSunday = getWeekSunday(today)
  const firstWeekSunday = new Date(currentWeekSunday)
  firstWeekSunday.setDate(firstWeekSunday.getDate() - 7 * 11)

  const heatmapWeeks: HeatmapWeek[] = []
  const weeklySRI: WeeklySRIPoint[] = []

  for (let w = 0; w < 12; w++) {
    const weekStart = new Date(firstWeekSunday)
    weekStart.setDate(weekStart.getDate() + w * 7)

    const days: number[] = []
    const weekRates: number[] = []

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + d)
      const key = isoDate(day)
      const rate = dayMatchRate.get(key)

      if (day > today) {
        days.push(-1) // future
      } else if (rate !== undefined) {
        days.push(rate)
        weekRates.push(rate)
      } else {
        days.push(-1) // no record
      }
    }

    heatmapWeeks.push({ label: weekLabel(weekStart), days })
    weeklySRI.push({
      week: weekLabel(weekStart),
      sri: weekRates.length >= 4
        ? Math.round(weekRates.reduce((s, v) => s + v, 0) / weekRates.length)
        : null,
    })
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const nonNullSRIs = weeklySRI.filter((w) => w.sri !== null).map((w) => w.sri!)
  const avgSRI =
    nonNullSRIs.length > 0
      ? Math.round(nonNullSRIs.reduce((s, v) => s + v, 0) / nonNullSRIs.length)
      : 0

  // Bedtime consistency: % of nights within 30 min of median bedtime
  const bedtimes = records.map((r) => {
    const d = new Date(r.start_time)
    return normalizeBedtime(d.getHours() + d.getMinutes() / 60)
  })
  const sortedBedtimes = [...bedtimes].sort((a, b) => a - b)
  const medianBedtime = sortedBedtimes[Math.floor(sortedBedtimes.length / 2)]
  const consistencyPct = Math.round(
    (bedtimes.filter((b) => Math.abs(b - medianBedtime) * 60 < 30).length / bedtimes.length) * 100,
  )

  const avgSleepDurationHours =
    Math.round(
      (records.reduce((s, r) => s + r.duration_minutes, 0) / records.length / 60) * 10,
    ) / 10

  return (
    <div className="min-h-screen bg-background">
      {header}
      <RegularityClient
        weeklySRI={weeklySRI}
        heatmapWeeks={heatmapWeeks}
        avgSRI={avgSRI}
        nightsAnalyzed={records.length}
        consistencyPct={consistencyPct}
        avgSleepDurationHours={avgSleepDurationHours}
      />
      <BottomNav />
    </div>
  )
}


