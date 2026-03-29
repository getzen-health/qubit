import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
const SpO2DeepDiveClient = dynamic(() => import('./spo2-deep-dive-client').then(m => ({ default: m.SpO2DeepDiveClient })), { ssr: false })
import type { SpO2Data, DailySpO2Reading, SpO2Status } from './spo2-deep-dive-client'
import { BottomNav } from '@/components/bottom-nav'

export const metadata = { title: 'Blood Oxygen Deep Dive' }

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockData(): SpO2Data {
  // 30-day daily readings ending today (2026-03-19)
  // Mostly 96–99%, occasional dips to 93–94% (borderline)
  const rawValues: Array<{ offset: number; avg: number; min: number; readings: number }> = [
    { offset: 29, avg: 97.2, min: 95.1, readings: 42 },
    { offset: 28, avg: 98.1, min: 96.3, readings: 38 },
    { offset: 27, avg: 96.8, min: 94.7, readings: 45 },
    { offset: 26, avg: 97.5, min: 95.8, readings: 40 },
    { offset: 25, avg: 98.3, min: 96.9, readings: 37 },
    { offset: 24, avg: 97.0, min: 95.2, readings: 44 },
    { offset: 23, avg: 96.4, min: 94.1, readings: 41 },  // slight dip
    { offset: 22, avg: 98.0, min: 96.5, readings: 39 },
    { offset: 21, avg: 97.7, min: 95.6, readings: 43 },
    { offset: 20, avg: 98.5, min: 97.0, readings: 36 },
    { offset: 19, avg: 97.3, min: 95.4, readings: 42 },
    { offset: 18, avg: 96.9, min: 94.8, readings: 40 },
    { offset: 17, avg: 93.8, min: 91.2, readings: 38 },  // borderline dip
    { offset: 16, avg: 94.2, min: 92.5, readings: 41 },  // borderline
    { offset: 15, avg: 95.6, min: 94.0, readings: 39 },  // recovery
    { offset: 14, avg: 97.1, min: 95.3, readings: 44 },
    { offset: 13, avg: 97.8, min: 96.2, readings: 37 },
    { offset: 12, avg: 98.2, min: 96.8, readings: 40 },
    { offset: 11, avg: 97.4, min: 95.7, readings: 43 },
    { offset: 10, avg: 96.7, min: 95.0, readings: 41 },
    { offset: 9,  avg: 97.9, min: 96.4, readings: 38 },
    { offset: 8,  avg: 98.4, min: 97.1, readings: 36 },
    { offset: 7,  avg: 97.2, min: 95.5, readings: 42 },
    { offset: 6,  avg: 97.6, min: 95.9, readings: 39 },
    { offset: 5,  avg: 98.0, min: 96.7, readings: 40 },
    { offset: 4,  avg: 97.3, min: 95.3, readings: 44 },
    { offset: 3,  avg: 96.5, min: 94.6, readings: 41 },
    { offset: 2,  avg: 97.8, min: 96.1, readings: 38 },
    { offset: 1,  avg: 98.1, min: 96.4, readings: 37 },
    { offset: 0,  avg: 97.5, min: 95.8, readings: 43 },
  ]

  function classify(avg: number): SpO2Status {
    if (avg >= 95) return 'normal'
    if (avg >= 92) return 'borderline'
    if (avg >= 88) return 'low'
    return 'veryLow'
  }

  const today = new Date()

  const daily: DailySpO2Reading[] = rawValues
    .sort((a, b) => b.offset - a.offset)
    .map(({ offset, avg, min, readings }) => {
      const d = new Date(today)
      d.setDate(d.getDate() - offset)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return {
        date: label,
        avg,
        min,
        readings,
        status: classify(avg),
      }
    })
    .reverse() // ascending — oldest first for chart left→right

  const allAvgs = rawValues.map((v) => v.avg)
  const allMins = rawValues.map((v) => v.min)
  const avg30d = +(allAvgs.reduce((s, v) => s + v, 0) / allAvgs.length).toFixed(1)
  const lowestReading = Math.min(...allMins)
  const daysBelowThreshold = allAvgs.filter((v) => v < 95).length

  return {
    avg30d,
    latestReading: 97.5,
    lowestReading,
    sleepAvg: 96.8,
    daysBelowThreshold,
    latestStatus: 'normal',
    daily,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SpO2DeepDivePage() {
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
            href="/oxygen"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to oxygen"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">🩸 Blood Oxygen Deep Dive</h1>
            <p className="text-sm text-text-secondary">
              SpO₂ trends · 30-day analysis · sleep saturation
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <SpO2DeepDiveClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
