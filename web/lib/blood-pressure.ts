// Blood pressure utilities — AHA 2018 classification (Whelton et al., Hypertension 2018)
// DASH diet scoring (Sacks et al., NEJM 1997)

export interface BPReading {
  systolic: number
  diastolic: number
  pulse?: number
  arm: 'left' | 'right'
  time_of_day: 'morning' | 'midday' | 'evening' | 'night'
  notes?: string
}

export interface BPClassification {
  category: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Crisis'
  color: string // tailwind color token
  bgColor: string // tailwind bg token for badges
  description: string
  action: string
  seek_care: boolean
}

export interface BPStats {
  morning_avg: { systolic: number; diastolic: number } | null
  evening_avg: { systolic: number; diastolic: number } | null
  overall_avg: { systolic: number; diastolic: number } | null
  classification: BPClassification
  pulse_pressure: number // systolic - diastolic (>40 = widened)
  map: number // mean arterial pressure = DBP + 1/3*(SBP-DBP)
  trend_7d: 'improving' | 'stable' | 'worsening'
}

export interface DASHIntake {
  fruits_servings: number // target 4-5/day
  vegetables_servings: number // target 4-5/day
  whole_grains_servings: number // target 6-8/day
  low_fat_dairy: number // target 2-3/day
  nuts_legumes_week: number // target 4-5/week
  sodium_mg: number // target <2300mg, ideal <1500mg
  alcohol_drinks: number // target ≤2 men, ≤1 women
}

export const LIFESTYLE_BP_IMPACT: {
  factor: string
  reduction_mmhg: string
  evidence: string
}[] = [
  {
    factor: 'Weight loss (5 kg)',
    reduction_mmhg: '−4.4 mmHg',
    evidence: 'Neter et al., Hypertension 2003',
  },
  {
    factor: 'DASH diet',
    reduction_mmhg: '−8 to −14 mmHg',
    evidence: 'Sacks et al., NEJM 1997',
  },
  {
    factor: 'Sodium reduction',
    reduction_mmhg: '−2 to −8 mmHg',
    evidence: 'He & MacGregor, BMJ 2002',
  },
  {
    factor: 'Aerobic exercise (30 min, 5×/wk)',
    reduction_mmhg: '−3.84 mmHg',
    evidence: 'Whelton et al., JAMA IM 2002',
  },
  {
    factor: 'Limit alcohol',
    reduction_mmhg: '−3 to −4 mmHg',
    evidence: 'Xin et al., Hypertension 2001',
  },
  {
    factor: 'Quit smoking',
    reduction_mmhg: 'Variable (within hours)',
    evidence: 'Primatesta et al., Hypertension 2001',
  },
]

export function classifyBP(systolic: number, diastolic: number): BPClassification {
  if (systolic > 180 || diastolic > 120) {
    return {
      category: 'Crisis',
      color: 'text-red-600',
      bgColor: 'bg-red-600/20 text-red-400 border-red-600/30',
      description: 'Hypertensive Crisis',
      action: 'Seek emergency care immediately.',
      seek_care: true,
    }
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'Stage 2',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'Stage 2 Hypertension',
      action: 'Consult your doctor promptly for medication and lifestyle changes.',
      seek_care: false,
    }
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: 'Stage 1',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      description: 'Stage 1 Hypertension',
      action: 'Lifestyle changes recommended; discuss medication with your doctor.',
      seek_care: false,
    }
  }
  if (systolic >= 120 && diastolic < 80) {
    return {
      category: 'Elevated',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      description: 'Elevated Blood Pressure',
      action: 'Adopt heart-healthy lifestyle habits to prevent progression.',
      seek_care: false,
    }
  }
  return {
    category: 'Normal',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Normal Blood Pressure',
    action: 'Maintain a heart-healthy lifestyle.',
    seek_care: false,
  }
}

function avgReadings(
  arr: (BPReading & { date: string })[]
): { systolic: number; diastolic: number } | null {
  if (arr.length === 0) return null
  return {
    systolic: Math.round(arr.reduce((s, r) => s + r.systolic, 0) / arr.length),
    diastolic: Math.round(arr.reduce((s, r) => s + r.diastolic, 0) / arr.length),
  }
}

export function calculateBPStats(readings: (BPReading & { date: string })[]): BPStats {
  const morning_avg = avgReadings(readings.filter((r) => r.time_of_day === 'morning'))
  const evening_avg = avgReadings(readings.filter((r) => r.time_of_day === 'evening'))
  const overall_avg = avgReadings(readings)

  const classification = overall_avg
    ? classifyBP(overall_avg.systolic, overall_avg.diastolic)
    : classifyBP(0, 0)

  const pulse_pressure = overall_avg ? overall_avg.systolic - overall_avg.diastolic : 0

  const map = overall_avg
    ? Math.round(overall_avg.diastolic + (overall_avg.systolic - overall_avg.diastolic) / 3)
    : 0

  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date))
  const last7 = sorted.slice(-7)
  const prev7 = sorted.slice(-14, -7)

  let trend_7d: 'improving' | 'stable' | 'worsening' = 'stable'
  if (last7.length >= 3 && prev7.length >= 3) {
    const lastAvg = last7.reduce((s, r) => s + r.systolic, 0) / last7.length
    const prevAvg = prev7.reduce((s, r) => s + r.systolic, 0) / prev7.length
    const diff = lastAvg - prevAvg
    if (diff <= -3) trend_7d = 'improving'
    else if (diff >= 3) trend_7d = 'worsening'
  }

  return { morning_avg, evening_avg, overall_avg, classification, pulse_pressure, map, trend_7d }
}

export function dashScore(intake: DASHIntake): {
  score: number
  grade: string
  recommendations: string[]
} {
  let score = 0
  const recommendations: string[] = []

  // Fruits: 4-5/day → 15 pts
  score += Math.min(intake.fruits_servings / 4.5, 1) * 15
  if (intake.fruits_servings < 4) recommendations.push('Increase fruit intake to 4–5 servings/day')

  // Vegetables: 4-5/day → 15 pts
  score += Math.min(intake.vegetables_servings / 4.5, 1) * 15
  if (intake.vegetables_servings < 4)
    recommendations.push('Increase vegetable intake to 4–5 servings/day')

  // Whole grains: 6-8/day → 20 pts
  score += Math.min(intake.whole_grains_servings / 7, 1) * 20
  if (intake.whole_grains_servings < 6)
    recommendations.push('Increase whole grain intake to 6–8 servings/day')

  // Low-fat dairy: 2-3/day → 15 pts
  score += Math.min(intake.low_fat_dairy / 2.5, 1) * 15
  if (intake.low_fat_dairy < 2) recommendations.push('Include 2–3 servings of low-fat dairy/day')

  // Nuts/legumes: 4-5/week → 10 pts
  score += Math.min(intake.nuts_legumes_week / 4.5, 1) * 10
  if (intake.nuts_legumes_week < 4)
    recommendations.push('Add 4–5 servings of nuts or legumes per week')

  // Sodium: <1500mg ideal → 15 pts
  let sodiumScore = 0
  if (intake.sodium_mg <= 1500) {
    sodiumScore = 15
  } else if (intake.sodium_mg <= 2300) {
    sodiumScore = 15 * (1 - (intake.sodium_mg - 1500) / 800)
  }
  score += sodiumScore
  if (intake.sodium_mg > 2300)
    recommendations.push('Reduce sodium to <2300 mg/day (ideal: <1500 mg/day)')

  // Alcohol: ≤1 → 10 pts, ≤2 → 5 pts
  const alcoholScore = intake.alcohol_drinks <= 1 ? 10 : intake.alcohol_drinks <= 2 ? 5 : 0
  score += alcoholScore
  if (intake.alcohol_drinks > 2)
    recommendations.push('Limit alcohol to ≤2 drinks/day (men) or ≤1 drink/day (women)')

  const finalScore = Math.round(score)
  const grade =
    finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : finalScore >= 60 ? 'D' : 'F'

  return { score: finalScore, grade, recommendations }
}
