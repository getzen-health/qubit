import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BreathingRateClient, type BreathingRateData, type DailyReading, type WeeklyAvg } from './breathing-rate-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Breathing Rate Deep Dive' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): BreathingRateData {
  // 30-day daily readings ending today (2026-03-19)
  // Mostly 13–16 br/min with one 5-day illness bout around days 10–14 (17–19 range)
  const rawValues: Array<{ offset: number; rate: number }> = [
    { offset: 29, rate: 14.1 },
    { offset: 28, rate: 13.6 },
    { offset: 27, rate: 14.8 },
    { offset: 26, rate: 13.2 },
    { offset: 25, rate: 15.0 },
    { offset: 24, rate: 14.4 },
    { offset: 23, rate: 13.9 },
    { offset: 22, rate: 14.7 },
    { offset: 21, rate: 15.2 },
    { offset: 20, rate: 13.5 },
    // illness bout: days offset 19–15 (elevated)
    { offset: 19, rate: 17.1 },
    { offset: 18, rate: 18.4 },
    { offset: 17, rate: 18.1 },
    { offset: 16, rate: 17.6 },
    { offset: 15, rate: 17.0 },
    // recovery
    { offset: 14, rate: 15.8 },
    { offset: 13, rate: 14.9 },
    { offset: 12, rate: 14.3 },
    { offset: 11, rate: 13.8 },
    { offset: 10, rate: 14.2 },
    { offset: 9,  rate: 13.4 },
    { offset: 8,  rate: 14.6 },
    { offset: 7,  rate: 11.8 },
    { offset: 6,  rate: 13.7 },
    { offset: 5,  rate: 14.1 },
    { offset: 4,  rate: 13.5 },
    { offset: 3,  rate: 15.1 },
    { offset: 2,  rate: 13.9 },
    { offset: 1,  rate: 14.0 },
    { offset: 0,  rate: 14.2 },
  ]

  const baseline = 13.8

  function classify(rate: number): 'normal' | 'elevated' | 'high' {
    const delta = rate - baseline
    if (delta > 3 || rate > 17) return 'high'
    if (delta > 1.5 || rate > 16) return 'elevated'
    return 'normal'
  }

  const today = new Date()

  const daily: DailyReading[] = rawValues
    .sort((a, b) => b.offset - a.offset)
    .map(({ offset, rate }) => {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return {
        date: label,
        rate,
        status: classify(rate),
        baseline,
      }
    })
    .reverse() // ascending (oldest first for chart left→right)

  // Weekly averages — group by ISO week (Mon–Sun), last 5 weeks
  const weekBuckets: Map<string, number[]> = new Map()
  for (const { offset, rate } of rawValues) {
    const d = new Date(today)
    d.setDate(d.getDate() - offset)
    // Monday of that week
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(d)
    mon.setDate(diff)
    const key = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!weekBuckets.has(key)) weekBuckets.set(key, [])
    weekBuckets.get(key)!.push(rate)
  }

  const weekly: WeeklyAvg[] = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => {
      // Sort by parsing the label back to an approximate order (they're already insertion-ordered, but sort for safety)
      return a < b ? -1 : 1
    })
    .map(([week, vals]) => {
      const avg = +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)
      let risk: 'normal' | 'elevated' | 'high'
      if (avg > 17) risk = 'high'
      else if (avg > baseline + 1.5) risk = 'elevated'
      else risk = 'normal'
      return { week, avg, risk }
    })

  const allRates = rawValues.map((v) => v.rate)
  const lowest = Math.min(...allRates)
  const highest = Math.max(...allRates)

  return {
    latestRate: 14.2,
    latestStatus: 'normal',
    baseline,
    deltaVsBaseline: +(14.2 - baseline).toFixed(1),
    lowest30d: lowest,
    highest30d: highest,
    daily,
    weekly,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BreathingRateDeepDivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = buildMockData()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/respiratory"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to respiratory"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">🌬️ Breathing Rate Deep Dive</h1>
            <p className="text-sm text-text-secondary">
              Nightly respiratory trends · illness detection signals
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <BreathingRateClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
