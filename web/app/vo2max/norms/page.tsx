import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { VO2MaxNormsClient } from './vo2max-norms-client'

export const metadata = { title: 'VO₂ Max Norms' }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VO2MaxReading {
  date: string   // "YYYY-MM" label for chart
  value: number
}

export interface AgeGroupNorm {
  ageGroup: string
  poor: number
  belowAvg: number
  average: number
  good: number
  excellent: number
  superior: number
  median: number
}

export interface VO2MaxNormsData {
  latestVO2Max: number
  fitnessAge: number
  chronologicalAge: number
  percentileLow: number
  percentileHigh: number
  fitnessCategory: string
  ageGroupLabel: string
  readingCount: number
  avgNormForAgeGroup: number   // average (midpoint) norm for 30-39 group
  trend: VO2MaxReading[]
  ageGroupNorms: AgeGroupNorm[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TREND: VO2MaxReading[] = [
  { date: 'Mar 25', value: 44.8 },
  { date: 'Apr 25', value: 45.2 },
  { date: 'May 25', value: 45.6 },
  { date: 'Jun 25', value: 46.1 },
  { date: 'Jul 25', value: 46.5 },
  { date: 'Aug 25', value: 46.9 },
  { date: 'Sep 25', value: 47.1 },
  { date: 'Oct 25', value: 46.8 },
  { date: 'Nov 25', value: 47.0 },
  { date: 'Dec 25', value: 47.3 },
  { date: 'Jan 26', value: 47.4 },
  { date: 'Feb 26', value: 47.5 },
]

// HUNT Fitness Study norms (ml/kg/min) — midpoint of each tier
// Tiers: poor | belowAvg | average | good | excellent | superior
// superior value = lower threshold (≥ this value)
const AGE_GROUP_NORMS: AgeGroupNorm[] = [
  { ageGroup: '20–29', poor: 28, belowAvg: 34, average: 39, good: 44, excellent: 50, superior: 55, median: 42 },
  { ageGroup: '30–39', poor: 29, belowAvg: 34, average: 37, good: 42, excellent: 48, superior: 52, median: 40 },
  { ageGroup: '40–49', poor: 26, belowAvg: 31, average: 35, good: 39, excellent: 45, superior: 49, median: 37 },
  { ageGroup: '50–59', poor: 23, belowAvg: 28, average: 32, good: 36, excellent: 42, superior: 46, median: 34 },
  { ageGroup: '60–69', poor: 20, belowAvg: 24, average: 28, good: 33, excellent: 38, superior: 42, median: 30 },
  { ageGroup: '70+',   poor: 17, belowAvg: 20, average: 24, good: 28, excellent: 33, superior: 37, median: 26 },
]

const MOCK_DATA: VO2MaxNormsData = {
  latestVO2Max: 47.5,
  fitnessAge: 32,
  chronologicalAge: 38,
  percentileLow: 80,
  percentileHigh: 95,
  fitnessCategory: 'Excellent',
  ageGroupLabel: '30–39',
  readingCount: 12,
  avgNormForAgeGroup: 37,
  trend: MOCK_TREND,
  ageGroupNorms: AGE_GROUP_NORMS,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VO2MaxNormsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // In production this would query health_records for vo2_max type.
  // For now we use static mock data that demonstrates the full UI.
  const data: VO2MaxNormsData = MOCK_DATA

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/vo2max"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to VO₂ Max"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">🫁 VO₂ Max Norms</h1>
            <p className="text-sm text-text-secondary">
              {data.readingCount} readings · HUNT Fitness Study percentiles
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <VO2MaxNormsClient data={data} />
      </main>
      <BottomNav />
    </div>
  )
}
