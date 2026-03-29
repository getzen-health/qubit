import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Thermometer } from 'lucide-react'
import dynamic from 'next/dynamic'
const TemperatureInsightsClient = dynamic(() => import('./temperature-insights-client').then(m => ({ default: m.TemperatureInsightsClient })))
import type { TemperatureInsightsData, NightlyDeviation, DeviationStatus } from './temperature-insights-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Wrist Temperature Insights' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): TemperatureInsightsData {
  // 30-day nightly deviations ending 2026-03-19
  // Mostly −0.2 to +0.4°C with two elevated nights (+1.1°C, +1.15°C) and a couple of lows
  const rawValues: Array<{ offset: number; deviation: number }> = [
    { offset: 29, deviation:  0.18 },
    { offset: 28, deviation: -0.12 },
    { offset: 27, deviation:  0.31 },
    { offset: 26, deviation:  0.05 },
    { offset: 25, deviation: -0.22 },
    { offset: 24, deviation:  0.27 },
    { offset: 23, deviation:  0.14 },
    { offset: 22, deviation: -0.08 },
    { offset: 21, deviation:  0.38 },
    { offset: 20, deviation:  0.22 },
    // elevated bout: offsets 19–18 (+1°C nights)
    { offset: 19, deviation:  1.15 },
    { offset: 18, deviation:  1.10 },
    // recovery
    { offset: 17, deviation:  0.61 },
    { offset: 16, deviation:  0.34 },
    { offset: 15, deviation:  0.19 },
    { offset: 14, deviation: -0.17 },
    { offset: 13, deviation:  0.08 },
    { offset: 12, deviation:  0.24 },
    { offset: 11, deviation: -0.31 },
    { offset: 10, deviation:  0.10 },
    // low night
    { offset:  9, deviation: -0.62 },
    { offset:  8, deviation: -0.18 },
    { offset:  7, deviation:  0.29 },
    { offset:  6, deviation:  0.07 },
    { offset:  5, deviation:  0.35 },
    { offset:  4, deviation: -0.14 },
    { offset:  3, deviation:  0.21 },
    { offset:  2, deviation:  0.16 },
    { offset:  1, deviation:  0.08 },
    { offset:  0, deviation:  0.23 },
  ]

  function classify(deviation: number): DeviationStatus {
    if (deviation >= 1.0) return 'elevated'
    if (deviation < -0.5) return 'low'
    return 'normal'
  }

  const today = new Date()

  // Build daily array oldest→newest (left→right on chart)
  const daily: NightlyDeviation[] = rawValues
    .sort((a, b) => b.offset - a.offset)
    .map(({ offset, deviation }) => {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return {
        date: label,
        deviation,
        status: classify(deviation),
      }
    })
    .reverse() // ascending for Recharts left→right

  const allDeviations = rawValues.map((v) => v.deviation)
  const avg30d = +(allDeviations.reduce((s, v) => s + v, 0) / allDeviations.length).toFixed(2)
  const peak30d = +Math.max(...allDeviations).toFixed(2)
  const nightsAbove1C = allDeviations.filter((v) => v >= 1.0).length

  // Consecutive elevated nights counting from most recent night backwards
  const sorted = rawValues.slice().sort((a, b) => a.offset - b.offset) // offset 0 = today at index 0
  let consecutiveElevated = 0
  for (const { deviation } of sorted) {
    if (classify(deviation) === 'elevated') consecutiveElevated++
    else break
  }

  // Last night = offset 0
  const lastNight = rawValues.find((v) => v.offset === 0)!

  return {
    lastNightDeviation: lastNight.deviation,
    lastNightStatus: classify(lastNight.deviation),
    avg30d,
    peak30d,
    nightsAbove1C,
    consecutiveElevated,
    daily,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TemperatureInsightsPage() {
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
            href="/temperature"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to temperature"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Wrist Temperature Insights</h1>
              <p className="text-sm text-text-secondary">
                Nightly deviation from personal baseline · 30-day view
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <TemperatureInsightsClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
