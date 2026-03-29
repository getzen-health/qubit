import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import dynamic from 'next/dynamic'
const VO2MaxNormsClient = dynamic(() => import('./vo2max-norms-client').then(m => ({ default: m.VO2MaxNormsClient })))

export const metadata = { title: 'VO₂ Max Norms' }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VO2MaxReading {
  date: string
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
  avgNormForAgeGroup: number
  trend: VO2MaxReading[]
  ageGroupNorms: AgeGroupNorm[]
}

// HUNT Fitness Study norms (ml/kg/min)
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

function getAgeGroupNorm(age: number): AgeGroupNorm {
  if (age < 30) return AGE_GROUP_NORMS[0]
  if (age < 40) return AGE_GROUP_NORMS[1]
  if (age < 50) return AGE_GROUP_NORMS[2]
  if (age < 60) return AGE_GROUP_NORMS[3]
  if (age < 70) return AGE_GROUP_NORMS[4]
  return AGE_GROUP_NORMS[5]
}

function classifyVO2Max(v: number, norm: AgeGroupNorm): { category: string; percentileLow: number; percentileHigh: number } {
  if (v >= norm.superior)  return { category: 'Superior',     percentileLow: 95, percentileHigh: 99 }
  if (v >= norm.excellent) return { category: 'Excellent',    percentileLow: 80, percentileHigh: 94 }
  if (v >= norm.good)      return { category: 'Good',         percentileLow: 60, percentileHigh: 79 }
  if (v >= norm.average)   return { category: 'Average',      percentileLow: 40, percentileHigh: 59 }
  if (v >= norm.belowAvg)  return { category: 'Below Average', percentileLow: 20, percentileHigh: 39 }
  return                          { category: 'Poor',         percentileLow: 1,  percentileHigh: 19 }
}

function estimateFitnessAge(v: number): number {
  // Rough inverse of age-median curve: fitness age ≈ age at which median = v
  if (v >= 42) return 25
  if (v >= 40) return 32
  if (v >= 37) return 42
  if (v >= 34) return 52
  if (v >= 30) return 62
  if (v >= 26) return 70
  return 75
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VO2MaxNormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch real VO2max estimates (last 12 months)
  const since12mo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
  const [{ data: estimates }, { data: profile }] = await Promise.all([
    supabase
      .from('vo2max_estimates')
      .select('date, vo2max')
      .eq('user_id', user.id)
      .gte('date', since12mo)
      .order('date', { ascending: true }),
    supabase
      .from('user_profiles')
      .select('age')
      .eq('user_id', user.id)
      .single(),
  ])

  const readings = estimates ?? []
  const chronologicalAge = profile?.age ?? 35

  // Build monthly trend (YYYY-MM → avg)
  const monthMap = new Map<string, number[]>()
  for (const r of readings) {
    const key = r.date.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(Number(r.vo2max))
  }
  const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const trend: VO2MaxReading[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({
      date: `${MONTH_ABBR[parseInt(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`,
      value: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
    }))

  const latestVO2Max = readings.length > 0
    ? Number(readings[readings.length - 1].vo2max)
    : 0

  const norm = getAgeGroupNorm(chronologicalAge)
  const ageLabel = norm.ageGroup
  const classification = latestVO2Max > 0
    ? classifyVO2Max(latestVO2Max, norm)
    : { category: 'No data', percentileLow: 0, percentileHigh: 0 }

  const data: VO2MaxNormsData = {
    latestVO2Max,
    fitnessAge: latestVO2Max > 0 ? estimateFitnessAge(latestVO2Max) : chronologicalAge,
    chronologicalAge,
    percentileLow: classification.percentileLow,
    percentileHigh: classification.percentileHigh,
    fitnessCategory: classification.category,
    ageGroupLabel: ageLabel,
    readingCount: readings.length,
    avgNormForAgeGroup: norm.median,
    trend,
    ageGroupNorms: AGE_GROUP_NORMS,
  }

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
