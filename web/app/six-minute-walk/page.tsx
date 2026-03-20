import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SixMinuteWalkClient, type SixMinuteWalkData, type DailyReading } from './six-minute-walk-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Six-Minute Walk Test' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): SixMinuteWalkData {
  // 90 daily readings ending today (2026-03-19)
  // Improving trend: start ~540-548m, end ~570-580m (+35m overall)
  // Variation: ±15m noise around a slowly rising baseline
  const today = new Date('2026-03-19')

  // Base trajectory: linear rise from 545 to 580 over 90 days
  const startBase = 545
  const endBase   = 580
  const days      = 90

  // Deterministic-ish noise offsets (cycle through a fixed pattern)
  const noisePattern = [
    5, -8, 12, -4, 9, -11, 6, -3, 14, -7,
    3, -10, 8, -5, 11, -9, 4, -2, 13, -6,
    7, -12, 2, -1, 10, -8, 5, -14, 9, -3,
    6, -7, 11, -4, 8, -11, 3, -6, 12, -9,
    4, -2, 7, -13, 10, -5, 6, -8, 9, -1,
    5, -10, 11, -4, 7, -7, 3, -12, 8, -6,
    10, -3, 5, -9, 12, -4, 7, -11, 6, -2,
    9, -8, 4, -5, 11, -7, 8, -13, 3, -6,
    10, -4, 7, -9, 5, -3, 12, -8, 6, -1,
  ]

  function classifyDistance(m: number): DailyReading['level'] {
    if (m >= 600) return 'excellent'
    if (m >= 500) return 'good'
    if (m >= 380) return 'fair'
    return 'low'
  }

  const daily: DailyReading[] = []
  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(today)
    d.setDate(d.getDate() - offset)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    // Linear interpolation along trend
    const progress = (days - 1 - offset) / (days - 1)
    const base = startBase + progress * (endBase - startBase)
    const noise = noisePattern[offset % noisePattern.length]
    const distance = Math.round(base + noise)

    daily.push({ date: label, distance, level: classifyDistance(distance) })
  }

  // Force today (offset = 0, last element) to exactly 563m
  daily[daily.length - 1].distance = 563
  daily[daily.length - 1].level = classifyDistance(563)

  const allDistances = daily.map((d) => d.distance)
  const avg90d = Math.round(allDistances.reduce((s, v) => s + v, 0) / allDistances.length)
  const best   = Math.max(...allDistances)

  // Trend: compare average of first 7 days vs last 7 days
  const first7 = daily.slice(0, 7).reduce((s, d) => s + d.distance, 0) / 7
  const last7  = daily.slice(-7).reduce((s, d) => s + d.distance, 0) / 7
  const trend  = Math.round(last7 - first7)

  return {
    latest: 563,
    latestLevel: 'good',
    avg90d,
    best,
    trend,
    readingCount: daily.length,
    daily,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SixMinuteWalkPage() {
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
            href="/walking"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to walking"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Six-Minute Walk Test</h1>
            <p className="text-sm text-text-secondary">
              Estimated functional exercise capacity · 90-day trend
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SixMinuteWalkClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
