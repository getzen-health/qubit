import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { UVExposureClient } from './uv-exposure-client'

export const metadata = { title: 'UV Exposure' }

// ─── Types ────────────────────────────────────────────────────────────────────

export type UVCategory = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'

export interface UVDay {
  date: string       // 'YYYY-MM-DD'
  uv: number         // J/m²
  category: UVCategory
  note?: string      // optional activity label
}

export interface UVSummary {
  today: number
  todayCategory: UVCategory
  avg30d: number
  peak30d: number
  peakDate: string
  highPlusDays: number
  daysTracked: number
}

export interface UVExposureData {
  days: UVDay[]
  summary: UVSummary
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getUVCategory(uv: number): UVCategory {
  if (uv < 25) return 'Low'
  if (uv < 50) return 'Moderate'
  if (uv < 100) return 'High'
  if (uv < 200) return 'Very High'
  return 'Extreme'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function generateMockData(): UVExposureData {
  const today = new Date('2026-03-19')

  // 30 entries going back from today; some indoor days = 0
  // Seed values: realistic seasonal UV (late winter/early spring in northern hemisphere)
  // Higher on weekends (outdoor sports), one extreme hiking day
  const seedValues: Array<{ uv: number; note?: string }> = [
    { uv: 8 },                              // day -29 (Mon)
    { uv: 0 },                              // day -28 (indoor)
    { uv: 14 },                             // day -27
    { uv: 0 },                              // day -26 (indoor)
    { uv: 22 },                             // day -25
    { uv: 38, note: 'Run' },               // day -24 (Sat)
    { uv: 45, note: 'Cycling' },            // day -23 (Sun)
    { uv: 11 },                             // day -22 (Mon)
    { uv: 0 },                              // day -21 (indoor)
    { uv: 18 },                             // day -20
    { uv: 5 },                              // day -19
    { uv: 0 },                              // day -18 (indoor)
    { uv: 29 },                             // day -17
    { uv: 67, note: 'Trail run' },          // day -16 (Sat) — today's value reference
    { uv: 55, note: 'Hike' },              // day -15 (Sun)
    { uv: 12 },                             // day -14 (Mon)
    { uv: 0 },                              // day -13 (indoor)
    { uv: 24 },                             // day -12
    { uv: 33 },                             // day -11
    { uv: 0 },                              // day -10 (indoor)
    { uv: 185, note: 'Alpine hike' },       // day -9 (Sat — extreme, high altitude)
    { uv: 120, note: 'Mountain run' },      // day -8 (Sun)
    { uv: 19 },                             // day -7 (Mon)
    { uv: 0 },                              // day -6 (indoor)
    { uv: 41 },                             // day -5
    { uv: 28 },                             // day -4
    { uv: 0 },                              // day -3 (indoor)
    { uv: 72, note: 'Long run' },           // day -2 (Sat)
    { uv: 88, note: 'Cycling' },            // day -1 (Sun)
    { uv: 67, note: 'Trail run' },          // day 0 = today
  ]

  const days: UVDay[] = seedValues.map((s, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    const date = d.toISOString().slice(0, 10)
    return {
      date,
      uv: s.uv,
      category: getUVCategory(s.uv),
      note: s.note,
    }
  })

  const withUV = days.filter((d) => d.uv > 0)
  const avg30d = withUV.length
    ? Math.round(withUV.reduce((s, d) => s + d.uv, 0) / withUV.length)
    : 0
  const peak = days.reduce((best, d) => (d.uv > best.uv ? d : best), days[0])

  return {
    days,
    summary: {
      today: 67,
      todayCategory: 'High',
      avg30d,
      peak30d: peak.uv,
      peakDate: peak.date,
      highPlusDays: days.filter((d) => d.uv >= 100).length,
      daysTracked: withUV.length,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UVExposurePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = generateMockData()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">UV Exposure</h1>
            <p className="text-sm text-text-secondary">Solar UV dose from Apple Watch Ultra · last 30 days</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <UVExposureClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
