import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HrvDeepDiveClient } from './hrv-deep-dive-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'HRV Deep Dive' }

// ─── Mock data generation ─────────────────────────────────────────────────────
// 330 days of daily HRV SDNN readings ending today (2026-03-19).
// Realistic characteristics:
//   • Baseline ~52 ms, personal best range 78–84 ms, low range 28–34 ms
//   • Weekly rhythm: Monday dip after weekend exertion, Thursday–Friday peak
//   • Slow upward trend over the year (+~0.018 ms/day) reflecting fitness gain
//   • Gaussian noise (σ ~9 ms) plus occasional anomaly days

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateHrvData() {
  const rand = seededRandom(42)
  const today = new Date('2026-03-19')
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 329) // 330 days

  const readings: { date: string; sdnn: number }[] = []

  for (let i = 0; i < 330; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)

    const dayOfWeek = d.getDay() // 0=Sun, 1=Mon, …, 6=Sat
    // Weekly rhythm: Mon dip (~-5), Fri peak (~+3)
    const weeklyEffect = [1, -5, -2, 1, 3, 3, 2][dayOfWeek]
    // Long-term positive trend: +6 ms over 330 days
    const trendEffect = (i / 329) * 6
    // Gaussian noise via Box-Muller (σ ~9 ms)
    const u1 = Math.max(rand(), 1e-9)
    const u2 = rand()
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 9
    // Occasional anomaly days (~5% chance of a dip or spike)
    const anomaly = rand() < 0.05 ? (rand() < 0.5 ? -18 : 14) : 0

    const sdnn = Math.round(Math.max(22, Math.min(90, 52 + trendEffect + weeklyEffect + noise + anomaly)))
    readings.push({ date: d.toISOString().slice(0, 10), sdnn })
  }

  return readings
}

function rollingAverage(readings: { date: string; sdnn: number }[], window: number) {
  return readings.map((r, i) => {
    const slice = readings.slice(Math.max(0, i - window + 1), i + 1)
    const avg = slice.reduce((s, x) => s + x.sdnn, 0) / slice.length
    return { date: r.date, sdnn: r.sdnn, rolling: Math.round(avg * 10) / 10 }
  })
}

function sevenDayAverage(readings: { date: string; sdnn: number; rolling: number }[]) {
  return readings.map((r, i) => {
    const slice = readings.slice(Math.max(0, i - 6), i + 1)
    const avg = slice.reduce((s, x) => s + x.sdnn, 0) / slice.length
    return { ...r, sevenDay: Math.round(avg * 10) / 10 }
  })
}

function monthlyAverages(readings: { date: string; sdnn: number }[]) {
  const buckets: Map<string, number[]> = new Map()
  for (const r of readings) {
    const month = r.date.slice(0, 7)
    if (!buckets.has(month)) buckets.set(month, [])
    buckets.get(month)!.push(r.sdnn)
  }
  return Array.from(buckets.entries()).map(([month, vals]) => {
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
    const label = new Date(month + '-15').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    return { month, label, avg }
  })
}

export default async function HrvDeepDivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawReadings = generateHrvData()
  const readings30 = rollingAverage(rawReadings, 30)
  const readings = sevenDayAverage(readings30)
  const monthly = monthlyAverages(rawReadings)

  const latestHrv = readings[readings.length - 1].sdnn
  const latest30Avg = readings[readings.length - 1].rolling
  const prev30Avg = readings[readings.length - 31]?.rolling ?? latest30Avg
  const trend30 = Math.round((latest30Avg - prev30Avg) * 10) / 10

  const baseline = 52
  const peak12mo = Math.max(...rawReadings.map((r) => r.sdnn))
  const low12mo = Math.min(...rawReadings.map((r) => r.sdnn))

  // ANS state based on ratio of current 30-day avg to baseline
  const ratio = latest30Avg / baseline
  const ansState =
    ratio >= 1.08
      ? 'Parasympathetic Dominant'
      : ratio >= 0.92
      ? 'Balanced'
      : 'Sympathetic Dominant'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/hrv"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to HRV"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">HRV Deep Dive 💚</h1>
            <p className="text-sm text-text-secondary">SDNN autonomic analysis · 12 months</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <HrvDeepDiveClient
          readings={readings}
          monthly={monthly}
          latestHrv={latestHrv}
          latest30Avg={latest30Avg}
          trend30={trend30}
          baseline={baseline}
          peak12mo={peak12mo}
          low12mo={low12mo}
          ansState={ansState}
          ratio={ratio}
        />
      </main>
      <BottomNav />
    </div>
  )
}
