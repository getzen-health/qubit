export interface ImmuneLog {
  id?: string
  user_id?: string
  date: string
  sleep_hours: number
  vit_c_mg: number
  vit_d_iu: number
  zinc_mg: number
  selenium_mcg: number
  stress_level: number // 1-10
  exercise_minutes: number
  exercise_intensity: 'none' | 'light' | 'moderate' | 'vigorous'
  fiber_g: number
  probiotic_taken: boolean
  symptoms: Record<string, number> // name -> 0-3
  notes?: string
  created_at?: string
}

export interface ImmuneScore {
  total: number
  grade: 'Optimal' | 'Good' | 'Fair' | 'Low'
  pillars: { sleep: number; nutrition: number; stress: number; exercise: number }
  seasonalRisk: boolean
  gutBonus: boolean
  symptomBurden: number
  recommendations: string[]
}

export const IMMUNE_SYMPTOMS = [
  'Sore Throat',
  'Runny Nose',
  'Fatigue',
  'Fever',
  'Cough',
  'Headache',
  'Body Aches',
]

export const IMMUNE_NUTRIENTS = [
  {
    name: 'Vitamin C',
    key: 'vit_c_mg' as const,
    unit: 'mg',
    rda: 65,
    therapeutic: 1000,
    color: 'orange',
    why: 'Vitamin C is a potent antioxidant that supports the production and function of white blood cells (lymphocytes and phagocytes). It helps protect immune cells from oxidative damage and is required for collagen synthesis, which maintains skin as a barrier against pathogens. Research by Calder et al. (2020, Nutrients) shows supplementation reduces cold duration by ~8% in adults.',
  },
  {
    name: 'Vitamin D',
    key: 'vit_d_iu' as const,
    unit: 'IU',
    rda: 600,
    therapeutic: 2000,
    color: 'yellow',
    why: 'Vitamin D acts as an immunomodulator, activating T-cells and macrophages. Deficiency (prevalent in winter months) is strongly linked to increased respiratory infection risk. Calder et al. (2020) identified Vitamin D as one of four key micronutrients with clinically significant immune-modulating effects. Optimal serum levels are 40–60 ng/mL.',
  },
  {
    name: 'Zinc',
    key: 'zinc_mg' as const,
    unit: 'mg',
    rda: 8,
    therapeutic: 15,
    color: 'blue',
    why: 'Zinc is essential for the development and function of immune cells including neutrophils, natural killer cells, and T-lymphocytes. Even mild zinc deficiency impairs immune responses. Studies show zinc lozenges started within 24 hours of cold onset reduce symptom duration by 33%. Sources: meat, shellfish, legumes, seeds.',
  },
  {
    name: 'Selenium',
    key: 'selenium_mcg' as const,
    unit: 'mcg',
    rda: 55,
    therapeutic: 100,
    color: 'green',
    why: 'Selenium is required for the activity of glutathione peroxidase, a key antioxidant enzyme in immune cells. It supports NK cell and T-cell proliferation and reduces oxidative stress during immune responses. Low selenium status has been associated with more virulent viral mutations (Calder et al. 2020). Brazil nuts are the richest food source.',
  },
]

// Flu season: October–March in northern hemisphere
function isFlySeason(dateStr: string): boolean {
  const month = new Date(dateStr).getMonth() + 1 // 1-12
  return month >= 10 || month <= 3
}

export function calculateImmuneScore(log: ImmuneLog): ImmuneScore {
  // --- Sleep pillar (0-100) ---
  // Cohen et al. 2009 (NEJM): sleep deprivation reduces immune response 3x
  let sleepPillar: number
  if (log.sleep_hours >= 7) sleepPillar = 100
  else if (log.sleep_hours >= 6) sleepPillar = 70
  else if (log.sleep_hours >= 5) sleepPillar = 40
  else sleepPillar = 10

  // --- Nutrition pillar (0-100) ---
  // Calder et al. 2020: Vit C, D, Zinc, Selenium each worth 25pts
  let nutritionPillar = 0
  if (log.vit_c_mg >= 65) nutritionPillar += 25
  if (log.vit_d_iu >= 600) nutritionPillar += 25
  if (log.zinc_mg >= 8) nutritionPillar += 25
  if (log.selenium_mcg >= 55) nutritionPillar += 25

  // --- Stress pillar (0-100) ---
  // Perceived stress 1-10 → 100 - (level × 10)
  const stressPillar = Math.max(0, 100 - log.stress_level * 10)

  // --- Exercise pillar (0-100) ---
  // Gleeson et al. 2011 & Nieman & Wentz 2019: J-curve
  // 30-60 min moderate = 100, 0-30 min = 60, >90 min vigorous = 50 (overtraining), 0 = 30
  let exercisePillar: number
  const mins = log.exercise_minutes
  const intensity = log.exercise_intensity
  if (mins === 0 || intensity === 'none') {
    exercisePillar = 30
  } else if (mins > 90 && intensity === 'vigorous') {
    exercisePillar = 50
  } else if (mins >= 30 && mins <= 60 && (intensity === 'moderate' || intensity === 'light')) {
    exercisePillar = 100
  } else if (mins < 30) {
    exercisePillar = 60
  } else {
    exercisePillar = 75 // 60-90 min moderate / other combos
  }

  // --- Weighted total ---
  const raw =
    sleepPillar * 0.3 +
    nutritionPillar * 0.3 +
    stressPillar * 0.2 +
    exercisePillar * 0.2

  // --- Gut bonus: +5pts if fiber ≥25g AND probiotic taken ---
  const gutBonus = log.fiber_g >= 25 && log.probiotic_taken
  const withGut = gutBonus ? Math.min(100, raw + 5) : raw

  // --- Seasonal risk weighting ---
  const seasonalRisk = isFlySeason(log.date)
  const total = Math.round(seasonalRisk ? withGut * 0.9 : withGut)

  // --- Grade ---
  let grade: ImmuneScore['grade']
  if (total >= 75) grade = 'Optimal'
  else if (total >= 50) grade = 'Good'
  else if (total >= 30) grade = 'Fair'
  else grade = 'Low'

  // --- Symptom burden (0-100) ---
  const symptomValues = Object.values(log.symptoms)
  const symptomSum = symptomValues.reduce((a, b) => a + b, 0)
  const symptomBurden = Math.round((symptomSum / 21) * 100)

  // --- Recommendations ---
  const recommendations: string[] = []
  if (sleepPillar < 70) recommendations.push('Aim for 7–9 hours of sleep to maintain full immune response (Cohen et al. 2009)')
  if (log.vit_c_mg < 65) recommendations.push('Increase Vitamin C intake — citrus, bell peppers, or a supplement (≥65 mg/day)')
  if (log.vit_d_iu < 600) recommendations.push('Boost Vitamin D — sunlight exposure or supplementation (600–2000 IU/day)')
  if (log.zinc_mg < 8) recommendations.push('Add zinc-rich foods: shellfish, legumes, seeds, or a low-dose supplement (≥8 mg/day)')
  if (log.selenium_mcg < 55) recommendations.push('Include selenium sources: 1–2 Brazil nuts or fish/poultry (≥55 mcg/day)')
  if (stressPillar < 60) recommendations.push('Practice stress reduction: 10 min meditation, breathwork, or nature walk')
  if (exercisePillar <= 30) recommendations.push('Even a 20-min brisk walk boosts NK cell activity (Gleeson et al. 2011)')
  if (exercisePillar === 50) recommendations.push('Rest or do light activity — overtraining suppresses immunity (Nieman & Wentz 2019)')
  if (!gutBonus) recommendations.push('Eat 25g+ fiber and take a probiotic for gut-immune axis support')
  if (seasonalRisk) recommendations.push('Flu season (Oct–Mar): consider annual vaccine and extra hand hygiene')

  return {
    total,
    grade,
    pillars: {
      sleep: sleepPillar,
      nutrition: nutritionPillar,
      stress: stressPillar,
      exercise: exercisePillar,
    },
    seasonalRisk,
    gutBonus,
    symptomBurden,
    recommendations,
  }
}

export function gradeColor(grade: ImmuneScore['grade']): string {
  switch (grade) {
    case 'Optimal': return 'text-green-500'
    case 'Good': return 'text-yellow-500'
    case 'Fair': return 'text-orange-500'
    case 'Low': return 'text-red-500'
  }
}

export function scoreRingColor(score: number): string {
  if (score >= 75) return '#22c55e'   // green-500
  if (score >= 50) return '#eab308'   // yellow-500
  if (score >= 30) return '#f97316'   // orange-500
  return '#ef4444'                     // red-500
}
