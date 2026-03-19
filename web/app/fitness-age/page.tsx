import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import FitnessAgeClient from './fitness-age-client'

export const metadata = { title: 'Fitness Age' }

export interface ChartPoint {
  ageGroup: string
  midAge: number
  vo2Avg: number
  isFitnessAge: boolean
  isChronologicalAge: boolean
}

export interface FitnessAgeData {
  latestVO2Max: number | null
  fitnessAge: number | null
  fitnessAgeGroup: string
  chronologicalAge: number | null
  biologicalSex: 'male' | 'female' | 'unknown'
  percentileLabel: string
  chartPoints: ChartPoint[]
}

// ACSM VO2 Max norms — 50th percentile (mL/kg/min)
const ACSM_NORMS = [
  { ageGroup: '20s', midAge: 25, male50th: 44.2, female50th: 38.1 },
  { ageGroup: '30s', midAge: 35, male50th: 42.5, female50th: 36.7 },
  { ageGroup: '40s', midAge: 45, male50th: 39.9, female50th: 34.6 },
  { ageGroup: '50s', midAge: 55, male50th: 36.4, female50th: 31.9 },
  { ageGroup: '60s', midAge: 65, male50th: 32.3, female50th: 28.4 },
  { ageGroup: '70+', midAge: 73, male50th: 27.0, female50th: 23.9 },
]

// Additional percentile thresholds per age group (mL/kg/min)
// [poor25th, avg50th, excellent75th] by age group for male/female
const ACSM_FULL = [
  { ageGroup: '20s', malePoor: 38.1, maleAvg: 44.2, maleExcellent: 50.2, femalePoor: 32.3, femaleAvg: 38.1, femaleExcellent: 43.9 },
  { ageGroup: '30s', malePoor: 36.7, maleAvg: 42.5, maleExcellent: 48.5, femalePoor: 30.9, femaleAvg: 36.7, femaleExcellent: 42.3 },
  { ageGroup: '40s', malePoor: 33.8, maleAvg: 39.9, maleExcellent: 46.4, femalePoor: 28.6, femaleAvg: 34.6, femaleExcellent: 39.7 },
  { ageGroup: '50s', malePoor: 30.2, maleAvg: 36.4, maleExcellent: 42.5, femalePoor: 25.8, femaleAvg: 31.9, femaleExcellent: 37.4 },
  { ageGroup: '60s', malePoor: 26.1, maleAvg: 32.3, maleExcellent: 38.1, femalePoor: 22.3, femaleAvg: 28.4, femaleExcellent: 33.6 },
  { ageGroup: '70+', malePoor: 21.7, maleAvg: 27.0, maleExcellent: 32.2, femalePoor: 19.4, femaleAvg: 23.9, femaleExcellent: 28.5 },
]

function getAgeGroup(age: number): string {
  if (age < 30) return '20s'
  if (age < 40) return '30s'
  if (age < 50) return '40s'
  if (age < 60) return '50s'
  if (age < 70) return '60s'
  return '70+'
}

function computeFitnessAge(vo2: number, sex: 'male' | 'female' | 'unknown'): { fitnessAge: number; fitnessAgeGroup: string } {
  const norms = sex === 'female' ? ACSM_NORMS.map((n) => ({ ...n, norm50th: n.female50th })) : ACSM_NORMS.map((n) => ({ ...n, norm50th: n.male50th }))

  // Find which age group's 50th percentile the user's VO2 max matches
  // If VO2 max is above all groups, clamp to youngest group
  // If below all, clamp to oldest group
  for (let i = 0; i < norms.length - 1; i++) {
    const current = norms[i]
    const next = norms[i + 1]
    if (vo2 >= current.norm50th) {
      // Between 20s midAge and current midAge — interpolate linearly
      const ratio = (vo2 - current.norm50th) / (current.norm50th - next.norm50th + 0.001)
      const interpolated = current.midAge - ratio * (current.midAge - (i > 0 ? norms[i - 1].midAge : 20))
      const fitnessAge = Math.round(Math.max(18, Math.min(80, i === 0 ? current.midAge - (vo2 - current.norm50th) * 0.7 : current.midAge)))
      return { fitnessAge, fitnessAgeGroup: current.ageGroup }
    }
    if (vo2 >= next.norm50th) {
      // Interpolate between current and next midAge
      const span = current.norm50th - next.norm50th
      const pos = vo2 - next.norm50th
      const ratio = span > 0 ? pos / span : 0.5
      const midAgeNext = next.midAge
      const midAgeCurrent = current.midAge
      const fitnessAge = Math.round(midAgeCurrent - ratio * (midAgeCurrent - midAgeNext))
      const ageGroup = ratio > 0.5 ? current.ageGroup : next.ageGroup
      return { fitnessAge, fitnessAgeGroup: ageGroup }
    }
  }
  // Below the last norm — oldest fitness age
  const last = norms[norms.length - 1]
  return { fitnessAge: last.midAge + 5, fitnessAgeGroup: last.ageGroup }
}

function computePercentileLabel(vo2: number, ageGroup: string, sex: 'male' | 'female' | 'unknown'): string {
  const full = ACSM_FULL.find((n) => n.ageGroup === ageGroup)
  if (!full) return 'Fitness data available'
  const excellent = sex === 'female' ? full.femaleExcellent : full.maleExcellent
  const avg = sex === 'female' ? full.femaleAvg : full.maleAvg
  const poor = sex === 'female' ? full.femalePoor : full.malePoor
  if (vo2 >= excellent) return 'Top 25% for your age group'
  if (vo2 >= avg) return 'Above average for your age group'
  if (vo2 >= poor) return 'Average for your age group'
  return 'Below average for your age group'
}

export default async function FitnessAgePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch latest VO2 max from health_records (type = 'vo2_max')
  const { data: vo2Records } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'vo2_max')
    .order('start_time', { ascending: false })
    .limit(1)

  const latestVO2Max: number | null =
    vo2Records && vo2Records.length > 0 ? (vo2Records[0].value as number) : null

  // Attempt to fetch user profile with date_of_birth and biological_sex
  // These columns may not exist in the current schema, so we handle gracefully
  let chronologicalAge: number | null = null
  let biologicalSex: 'male' | 'female' | 'unknown' = 'unknown'

  try {
    const { data: profile } = await supabase
      .from('users')
      .select('date_of_birth, biological_sex')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.date_of_birth) {
        const dob = new Date(profile.date_of_birth as string)
        const today = new Date()
        let age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
        chronologicalAge = age
      }
      if (profile.biological_sex === 'male' || profile.biological_sex === 'female') {
        biologicalSex = profile.biological_sex as 'male' | 'female'
      }
    }
  } catch {
    // profiles table or columns don't exist — graceful fallback
  }

  // Compute fitness age
  let fitnessAge: number | null = null
  let fitnessAgeGroup = ''
  let percentileLabel = 'Fitness data available'

  if (latestVO2Max !== null) {
    const result = computeFitnessAge(latestVO2Max, biologicalSex)
    fitnessAge = result.fitnessAge
    fitnessAgeGroup = result.fitnessAgeGroup

    // Percentile label based on chronological age group if available, else fitness age group
    const ageGroupForPercentile = chronologicalAge !== null
      ? getAgeGroup(chronologicalAge)
      : fitnessAgeGroup
    percentileLabel = computePercentileLabel(latestVO2Max, ageGroupForPercentile, biologicalSex)
  }

  // Build chart points
  const chronoAgeGroup = chronologicalAge !== null ? getAgeGroup(chronologicalAge) : null
  const chartPoints: ChartPoint[] = ACSM_NORMS.map((norm) => ({
    ageGroup: norm.ageGroup,
    midAge: norm.midAge,
    vo2Avg: biologicalSex === 'female' ? norm.female50th : norm.male50th,
    isFitnessAge: norm.ageGroup === fitnessAgeGroup,
    isChronologicalAge: norm.ageGroup === chronoAgeGroup,
  }))

  const fitnessAgeData: FitnessAgeData = {
    latestVO2Max,
    fitnessAge,
    fitnessAgeGroup,
    chronologicalAge,
    biologicalSex,
    percentileLabel,
    chartPoints,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Fitness Age</h1>
            <p className="text-sm text-text-secondary">VO₂ max vs ACSM age norms</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <FitnessAgeClient data={fitnessAgeData} />
      </main>
      <BottomNav />
    </div>
  )
}
